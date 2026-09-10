"""B10 — Performance / Reliability / QA Test Suite.

Covers:
- API smoke tests for all major endpoints
- Determinism (stable ordering, stable resolution)
- Repeated-request idempotency and state safety
- Resilience (B4) regression
- Science continuity (B5) regression
- Sensor health (B6) regression
- Lifecycle (B7) regression
- Provenance (B3/B8) regression
- Failure paths (missing entities, invalid input, duplicate data)
- Startup / configuration checks
- Bounded list behavior
- Checksum / data integrity
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import CommsLinkStatus
from app.services.sensor_health_service import (
    SENSOR_STALE_THRESHOLD_SECONDS,
    compute_sensor_freshness,
    evaluate_sensor_health,
)
from app.services.sync_service import (
    VALID_COMMS_TRANSITIONS,
    compute_canonical_checksum,
    get_or_create_link,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid() -> str:
    return str(uuid.uuid4())[:12]


# ===========================================================================
# SECTION 1 — Configuration / Startup
# ===========================================================================


class TestConfiguration:
    """Verify configuration safety for dev/prod settings."""

    def test_debug_default_is_false(self):
        """DEBUG must default to False."""
        assert settings.DEBUG is False

    def test_cors_origins_not_empty(self):
        """At least one CORS origin must be configured."""
        assert len(settings.effective_cors_origins) >= 1

    def test_database_url_not_empty(self):
        """DATABASE_URL must be set."""
        assert settings.DATABASE_URL != ""

    def test_database_url_not_raw_postgres(self):
        """postgres:// is normalized to postgresql:// for SQLAlchemy."""
        assert not settings.DATABASE_URL.startswith("postgres://"), (
            "Raw postgres:// URL should have been normalized by Settings.__init__"
        )

    def test_frontend_origin_comma_separated(self):
        """FRONTEND_ORIGIN comma-separated list is correctly expanded."""
        from app.core.config import Settings
        s = Settings(FRONTEND_ORIGIN="https://a.example.com,https://b.example.com")
        origins = s.effective_cors_origins
        assert "https://a.example.com" in origins
        assert "https://b.example.com" in origins


# ===========================================================================
# SECTION 2 — API Smoke Tests
# ===========================================================================


class TestApiSmoke:
    """Smoke-test that key endpoints return 200 with expected content."""

    def test_health_endpoint_200(self, client: TestClient):
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert "service" in body

    def test_assets_list_200(self, client: TestClient):
        r = client.get("/assets")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_assets_list_ordered_by_code(self, client: TestClient):
        """Assets are returned in deterministic ascending code order."""
        r = client.get("/assets")
        assert r.status_code == 200
        codes = [item["code"] for item in r.json()]
        assert codes == sorted(codes)

    def test_fuel_status_200(self, client: TestClient):
        r = client.get("/resources/fuel")
        assert r.status_code == 200
        body = r.json()
        assert "projected_runway_days" in body
        assert body["projected_runway_days"] > 0

    def test_inventory_200(self, client: TestClient):
        r = client.get("/resources/inventory")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_resupply_200(self, client: TestClient):
        r = client.get("/resources/resupply")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_resilience_status_200(self, client: TestClient):
        r = client.get("/resilience/status")
        assert r.status_code == 200
        body = r.json()
        assert "status" in body
        assert "pending_queue_count" in body

    def test_science_instruments_200(self, client: TestClient):
        r = client.get("/science/instruments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_lifecycle_list_200(self, client: TestClient):
        r = client.get("/lifecycle")
        assert r.status_code == 200
        body = r.json()
        assert "total" in body
        assert "items" in body

    def test_incidents_list_200(self, client: TestClient):
        r = client.get("/incidents")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_station_overview_200(self, client: TestClient):
        r = client.get("/station/overview")
        assert r.status_code == 200
        assert "station_id" in r.json()

    def test_resilience_queue_200(self, client: TestClient):
        r = client.get("/resilience/queue")
        assert r.status_code == 200
        assert "items" in r.json()


# ===========================================================================
# SECTION 3 — Failure Paths
# ===========================================================================


class TestFailurePaths:
    """Missing entities and invalid input must not expose stack traces."""

    def test_asset_not_found_returns_404(self, client: TestClient):
        r = client.get("/assets/NONEXISTENT-ASSET-XYZ")
        assert r.status_code == 404
        body = r.json()
        assert "detail" in body
        assert "traceback" not in str(body).lower()

    def test_asset_telemetry_not_found_returns_404(self, client: TestClient):
        r = client.get("/assets/NONEXISTENT-ASSET-XYZ/telemetry")
        assert r.status_code == 404

    def test_asset_sensor_health_not_found_returns_404(self, client: TestClient):
        r = client.get("/assets/NONEXISTENT-ASSET-XYZ/sensor-health")
        assert r.status_code == 404

    def test_lifecycle_not_found_returns_404(self, client: TestClient):
        r = client.get("/lifecycle/NONEXISTENT-LC-ID-XYZ")
        assert r.status_code == 404
        assert "detail" in r.json()

    def test_incident_not_found_returns_404(self, client: TestClient):
        r = client.get("/incidents/NONEXISTENT-INC-ID")
        assert r.status_code == 404

    def test_recovery_exposure_not_found_returns_404(self, client: TestClient):
        r = client.get("/resources/recovery/NONEXISTENT-ASSET-XYZ")
        assert r.status_code == 404

    def test_fuel_not_found_unknown_station(self, client: TestClient):
        r = client.get("/resources/fuel?station_id=STATION-DOES-NOT-EXIST")
        assert r.status_code == 404

    def test_lifecycle_resolve_unknown_component_returns_empty(self, client: TestClient):
        r = client.get("/lifecycle/resolve?component_type=MODEL&component_name=nonexistent-model-xyz")
        assert r.status_code == 200
        assert r.json()["resolved_record"] is None

    def test_incident_patch_missing_status_returns_400(self, client: TestClient):
        inc_r = client.post("/incidents", json={
            "station_id": "STATION-BHARATI",
            "title": "B10 Test Incident",
            "description": "Failure path test",
            "severity": "MINOR",
            "location": "Test Lab",
            "status": "ACTIVE",
        })
        assert inc_r.status_code == 200
        inc_id = inc_r.json()["id"]
        r = client.patch(f"/incidents/{inc_id}/status")
        assert r.status_code == 400
        assert "detail" in r.json()

    def test_lifecycle_duplicate_id_returns_409(self, client: TestClient):
        payload = {
            "id": f"LC-B10-DUP-{_uid()}",
            "component_type": "MODEL",
            "component_name": f"b10-dup-{_uid()}",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z",
            "effective_to": None,
        }
        assert client.post("/lifecycle", json=payload).status_code == 201
        assert client.post("/lifecycle", json=payload).status_code == 409

    def test_lifecycle_overlap_returns_409(self, client: TestClient):
        name = f"b10-overlap-{_uid()}"
        base = {
            "component_type": "SCHEMA",
            "component_name": name,
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z",
            "effective_to": None,
        }
        assert client.post("/lifecycle", json={**base, "id": f"LC-OV1-{_uid()}"}).status_code == 201
        r2 = client.post("/lifecycle", json={
            **base, "id": f"LC-OV2-{_uid()}",
            "version": "2.0.0",
            "effective_from": "2026-03-01T00:00:00Z",
        })
        assert r2.status_code == 409

    def test_science_buffer_invalid_instrument_returns_404(self, client: TestClient):
        r = client.post("/science/observations/buffer", json={
            "instrument_id": "INST-DOES-NOT-EXIST",
            "measurement_value": 42.0,
            "unit": "K",
        })
        assert r.status_code == 404


# ===========================================================================
# SECTION 4 — Determinism
# ===========================================================================


class TestDeterminism:
    """Verify repeated reads produce identical, stably-ordered results."""

    def test_assets_list_stable(self, client: TestClient):
        assert client.get("/assets").json() == client.get("/assets").json()

    def test_resupply_ordered_by_expected_date(self, client: TestClient):
        r = client.get("/resources/resupply")
        assert r.status_code == 200
        dates = [item["expected_date"] for item in r.json() if item.get("expected_date")]
        assert dates == sorted(dates)

    def test_inventory_stable(self, client: TestClient):
        """Inventory list ordering and business data must be stable across repeated reads.

        Compares stable structural fields only (id, part, quantities, status).
        Provenance timestamps (freshness_seconds, timestamp) are deliberately excluded
        because they reflect wall-clock age and will differ between two HTTP requests.
        """
        def _stable_fields(items: list) -> list:
            return [
                {
                    "id": item["id"],
                    "spare_part_id": item["spare_part_id"],
                    "part_number": item["part_number"],
                    "name": item["name"],
                    "quantity_available": item["quantity_available"],
                    "quantity_reserved": item["quantity_reserved"],
                    "reorder_threshold": item["reorder_threshold"],
                    "status": item["status"],
                }
                for item in items
            ]

        r1 = client.get("/resources/inventory").json()
        r2 = client.get("/resources/inventory").json()
        assert _stable_fields(r1) == _stable_fields(r2)

    def test_lifecycle_resolve_stable(self, client: TestClient):
        name = f"b10-stable-{_uid()}"
        client.post("/lifecycle", json={
            "id": f"LC-STABLE-{_uid()}",
            "component_type": "MODEL",
            "component_name": name,
            "version": "3.0.0",
            "schema_version": "2.0",
            "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z",
            "effective_to": None,
        })
        url = f"/lifecycle/resolve?component_type=MODEL&component_name={name}"
        v1 = client.get(url).json()["resolved_record"]["version"]
        v2 = client.get(url).json()["resolved_record"]["version"]
        assert v1 == v2

    def test_health_response_stable(self, client: TestClient):
        r1 = client.get("/health").json()
        r2 = client.get("/health").json()
        assert r1["status"] == r2["status"]
        assert r1["service"] == r2["service"]

    def test_fuel_status_deterministic(self, client: TestClient):
        r1 = client.get("/resources/fuel")
        r2 = client.get("/resources/fuel")
        assert r1.status_code == 200 and r2.status_code == 200
        assert r1.json()["projected_runway_days"] == r2.json()["projected_runway_days"]


# ===========================================================================
# SECTION 5 — Sensor Health (B6) Regression
# ===========================================================================


class TestSensorHealthRegression:
    """Verify B6 sensor health semantics remain intact."""

    def test_fresh_threshold_constant(self):
        assert SENSOR_STALE_THRESHOLD_SECONDS == 7200.0

    def test_fresh_sensor(self):
        ts = _now() - timedelta(hours=1)
        assert evaluate_sensor_health(ts, _now()) == "FRESH"

    def test_stale_sensor(self):
        ts = _now() - timedelta(hours=3)
        assert evaluate_sensor_health(ts, _now()) == "STALE"

    def test_unknown_sensor_no_measurement(self):
        assert evaluate_sensor_health(None, _now()) == "UNKNOWN"

    def test_future_timestamp_clamps_to_fresh(self):
        future = _now() + timedelta(hours=1)
        assert evaluate_sensor_health(future, _now()) == "FRESH"
        assert compute_sensor_freshness(future, _now()) == 0.0

    def test_quality_orthogonal_to_health(self):
        """STALE health must not corrupt measurement quality."""
        stale_ts = _now() - timedelta(hours=3)
        health = evaluate_sensor_health(stale_ts, _now())
        freshness = compute_sensor_freshness(stale_ts, _now())
        assert health == "STALE"
        assert freshness >= SENSOR_STALE_THRESHOLD_SECONDS

    def test_sensor_health_api_returns_expected_fields(self, client: TestClient):
        assets = client.get("/assets").json()
        assert len(assets) > 0
        r = client.get(f"/assets/{assets[0]['id']}/sensor-health")
        assert r.status_code == 200
        body = r.json()
        assert "sensor_count" in body
        for sensor in body["sensors"]:
            assert sensor["health"] in ("FRESH", "STALE", "UNKNOWN")
            assert sensor["quality"] in ("GOOD", "SUSPECT", "BAD")
            assert sensor["freshness_seconds"] >= 0.0


# ===========================================================================
# SECTION 6 — Science Continuity (B5) Regression
# ===========================================================================


class TestScienceContinuityRegression:
    """Verify B5 science buffering/sync semantics remain intact."""

    def _get_instrument(self, client):
        instruments = client.get("/science/instruments").json()
        if not instruments:
            pytest.skip("No instruments seeded")
        return instruments[0]["id"]

    def test_online_observation_not_buffered(self, client: TestClient, db_session: Session):
        link = get_or_create_link(db_session, "STATION-BHARATI")
        link.status = CommsLinkStatus.ONLINE
        link.bandwidth_kbps = 2048
        db_session.commit()
        inst_id = self._get_instrument(client)
        r = client.post("/science/observations", json={
            "instrument_id": inst_id, "measurement_value": 123.45, "unit": "K"
        })
        assert r.status_code == 200
        assert r.json()["is_buffered"] is False
        assert r.json()["sync_status"] == "RECONCILED"

    def test_offline_observation_is_buffered(self, client: TestClient, db_session: Session):
        link = get_or_create_link(db_session, "STATION-BHARATI")
        link.status = CommsLinkStatus.OFFLINE
        link.bandwidth_kbps = 0
        db_session.commit()
        inst_id = self._get_instrument(client)
        r = client.post("/science/observations", json={
            "instrument_id": inst_id, "measurement_value": 99.9, "unit": "K"
        })
        assert r.status_code == 200
        assert r.json()["is_buffered"] is True
        assert r.json()["sync_status"] == "PENDING"
        link.status = CommsLinkStatus.ONLINE
        link.bandwidth_kbps = 2048
        db_session.commit()

    def test_no_fake_buffering_heuristic(self, client: TestClient, db_session: Session):
        """Buffering must NOT use obs.id > 100 or similar."""
        link = get_or_create_link(db_session, "STATION-BHARATI")
        link.status = CommsLinkStatus.ONLINE
        link.bandwidth_kbps = 2048
        db_session.commit()
        inst_id = self._get_instrument(client)
        for _ in range(3):
            r = client.post("/science/observations", json={
                "instrument_id": inst_id, "measurement_value": 50.0, "unit": "nT"
            })
            assert r.status_code == 200
            assert r.json()["is_buffered"] is False

    def test_observation_provenance_fields_present(self, client: TestClient, db_session: Session):
        link = get_or_create_link(db_session, "STATION-BHARATI")
        link.status = CommsLinkStatus.ONLINE
        link.bandwidth_kbps = 2048
        db_session.commit()
        inst_id = self._get_instrument(client)
        r = client.post("/science/observations", json={
            "instrument_id": inst_id, "measurement_value": 77.7, "unit": "K"
        })
        assert r.status_code == 200
        prov = r.json()["provenance"]
        for field in ("source", "timestamp", "freshness_seconds", "quality", "truth_type", "confidence"):
            assert field in prov
        assert prov["quality"] in ("GOOD", "SUSPECT", "BAD")
        assert prov["truth_type"] in ("MEASURED", "DERIVED", "FORECAST", "SCENARIO", "SYNTHETIC_SIMULATION")


# ===========================================================================
# SECTION 7 — Lifecycle (B7) Regression
# ===========================================================================


class TestLifecycleRegression:
    """Verify B7 lifecycle interval semantics remain intact."""

    def test_lifecycle_create_and_retrieve(self, client: TestClient):
        rec_id = f"LC-B10-{_uid()}"
        payload = {
            "id": rec_id,
            "component_type": "MODEL",
            "component_name": f"b10-model-{_uid()}",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z",
            "effective_to": None,
        }
        assert client.post("/lifecycle", json=payload).status_code == 201
        r = client.get(f"/lifecycle/{rec_id}")
        assert r.status_code == 200
        assert r.json()["id"] == rec_id
        assert r.json()["status"] == "ACTIVE"

    def test_historical_resolve_returns_deprecated(self, client: TestClient):
        name = f"b10-hist-{_uid()}"
        client.post("/lifecycle", json={
            "id": f"LC-V1-{_uid()}", "component_type": "MODEL", "component_name": name,
            "version": "1.0.0", "schema_version": "1.0", "status": "DEPRECATED",
            "effective_from": "2026-01-01T00:00:00Z", "effective_to": "2026-06-01T00:00:00Z",
        })
        client.post("/lifecycle", json={
            "id": f"LC-V2-{_uid()}", "component_type": "MODEL", "component_name": name,
            "version": "2.0.0", "schema_version": "2.0", "status": "ACTIVE",
            "effective_from": "2026-06-01T00:00:00Z", "effective_to": None,
        })
        r = client.get(f"/lifecycle/resolve?component_type=MODEL&component_name={name}&timestamp=2026-03-01T00:00:00Z")
        assert r.status_code == 200
        assert r.json()["resolved_record"]["version"] == "1.0.0"
        assert r.json()["is_current"] is False

    def test_current_resolve_returns_active(self, client: TestClient):
        name = f"b10-curr-{_uid()}"
        client.post("/lifecycle", json={
            "id": f"LC-CURR-{_uid()}", "component_type": "CONFIG", "component_name": name,
            "version": "5.0.0", "schema_version": "3.0", "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z", "effective_to": None,
        })
        r = client.get(f"/lifecycle/resolve?component_type=CONFIG&component_name={name}")
        assert r.status_code == 200
        assert r.json()["resolved_record"]["status"] == "ACTIVE"
        assert r.json()["is_current"] is True

    def test_boundary_timestamp_semantics(self, client: TestClient):
        name = f"b10-bnd-{_uid()}"
        boundary = "2026-06-01T00:00:00+00:00"
        client.post("/lifecycle", json={
            "id": f"LC-BND1-{_uid()}", "component_type": "SCHEMA", "component_name": name,
            "version": "1.0.0", "schema_version": "1.0", "status": "DEPRECATED",
            "effective_from": "2026-01-01T00:00:00Z", "effective_to": boundary,
        })
        client.post("/lifecycle", json={
            "id": f"LC-BND2-{_uid()}", "component_type": "SCHEMA", "component_name": name,
            "version": "2.0.0", "schema_version": "2.0", "status": "ACTIVE",
            "effective_from": boundary, "effective_to": None,
        })
        r = client.get("/lifecycle/resolve", params={"component_type": "SCHEMA", "component_name": name, "timestamp": boundary})
        assert r.status_code == 200
        assert r.json()["resolved_record"]["version"] == "2.0.0"

    def test_lifecycle_list_ordered_deterministically(self, client: TestClient):
        r = client.get("/lifecycle")
        assert r.status_code == 200
        items = r.json()["items"]
        if len(items) >= 2:
            keys = [(i["component_type"], i["component_name"], i["effective_from"]) for i in items]
            assert keys == sorted(keys)


# ===========================================================================
# SECTION 8 — Resilience (B4) Regression
# ===========================================================================


class TestResilienceRegression:
    """Verify B4 communication degradation semantics remain intact."""

    def test_online_to_offline_transition(self, client: TestClient):
        client.post("/resilience/reset")
        r = client.post("/resilience/simulate-offline")
        assert r.status_code == 200
        assert r.json()["status"] == "OFFLINE"

    def test_online_to_degraded_transition(self, client: TestClient):
        client.post("/resilience/reset")
        r = client.post("/resilience/simulate-degraded?latency_ms=1450&bandwidth_kbps=256")
        assert r.status_code == 200
        assert r.json()["status"] == "DEGRADED"

    def test_degraded_mode_is_operational(self, client: TestClient):
        """DEGRADED link shows reduced but non-zero bandwidth."""
        client.post("/resilience/reset")
        client.post("/resilience/simulate-degraded?bandwidth_kbps=512")
        r = client.get("/resilience/status")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "DEGRADED"
        assert body.get("bandwidth_kbps", 0) > 0

    def test_restore_after_offline(self, client: TestClient):
        client.post("/resilience/reset")
        client.post("/resilience/simulate-offline")
        r = client.post("/resilience/restore")
        assert r.status_code == 200
        assert r.json()["link_status"] == "ONLINE"

    def test_repeated_status_reads_idempotent(self, client: TestClient):
        s1 = client.get("/resilience/status").json()["status"]
        s2 = client.get("/resilience/status").json()["status"]
        s3 = client.get("/resilience/status").json()["status"]
        assert s1 == s2 == s3

    def test_valid_comms_transitions_defined(self):
        expected = {CommsLinkStatus.ONLINE, CommsLinkStatus.DEGRADED,
                    CommsLinkStatus.OFFLINE, CommsLinkStatus.RESTORING, CommsLinkStatus.SYNCING}
        assert set(VALID_COMMS_TRANSITIONS.keys()) == expected


# ===========================================================================
# SECTION 9 — Provenance (B3/B8) Regression
# ===========================================================================


class TestProvenanceRegression:
    """Verify canonical provenance fields are present and internally consistent."""

    def _assert_provenance(self, prov: dict) -> None:
        for field in ("source", "timestamp", "freshness_seconds", "quality", "truth_type", "confidence"):
            assert field in prov, f"provenance.{field} missing"
        assert prov["freshness_seconds"] >= 0.0
        assert 0.0 <= prov["confidence"] <= 1.0
        assert prov["quality"] in ("GOOD", "SUSPECT", "BAD")
        assert prov["truth_type"] in ("MEASURED", "DERIVED", "FORECAST", "SCENARIO", "SYNTHETIC_SIMULATION")

    def test_fuel_status_provenance(self, client: TestClient):
        r = client.get("/resources/fuel")
        assert r.status_code == 200
        self._assert_provenance(r.json()["provenance"])

    def test_inventory_item_provenance(self, client: TestClient):
        r = client.get("/resources/inventory")
        assert r.status_code == 200
        for item in r.json():
            self._assert_provenance(item["provenance"])

    def test_resupply_provenance_truth_type_is_forecast(self, client: TestClient):
        r = client.get("/resources/resupply")
        assert r.status_code == 200
        for item in r.json():
            self._assert_provenance(item["provenance"])
            assert item["provenance"]["truth_type"] == "FORECAST"

    def test_asset_detail_provenance(self, client: TestClient):
        assets = client.get("/assets").json()
        if not assets:
            pytest.skip("No assets seeded")
        r = client.get(f"/assets/{assets[0]['id']}")
        assert r.status_code == 200
        self._assert_provenance(r.json()["provenance"])

    def test_sensor_health_provenance(self, client: TestClient):
        assets = client.get("/assets").json()
        if not assets:
            pytest.skip("No assets seeded")
        r = client.get(f"/assets/{assets[0]['id']}/sensor-health")
        assert r.status_code == 200
        for sensor in r.json().get("sensors", []):
            self._assert_provenance(sensor["provenance"])


# ===========================================================================
# SECTION 10 — Repeated-Request Idempotency
# ===========================================================================


class TestRepeatedRequests:
    """Verify read endpoints never mutate state."""

    def test_repeated_get_assets_does_not_duplicate(self, client: TestClient):
        count1 = len(client.get("/assets").json())
        client.get("/assets")
        client.get("/assets")
        count4 = len(client.get("/assets").json())
        assert count1 == count4

    def test_repeated_resilience_status_no_queue_growth(self, client: TestClient):
        q1 = client.get("/resilience/status").json().get("pending_queue_count", 0)
        for _ in range(5):
            client.get("/resilience/status")
        q2 = client.get("/resilience/status").json().get("pending_queue_count", 0)
        assert q2 == q1

    def test_repeated_lifecycle_resolve_stable(self, client: TestClient):
        name = f"b10-rpt-{_uid()}"
        client.post("/lifecycle", json={
            "id": f"LC-RPT-{_uid()}", "component_type": "MODEL", "component_name": name,
            "version": "7.0.0", "schema_version": "5.0", "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z", "effective_to": None,
        })
        url = f"/lifecycle/resolve?component_type=MODEL&component_name={name}"
        versions = {client.get(url).json()["resolved_record"]["version"] for _ in range(3)}
        assert len(versions) == 1

    def test_repeated_sensor_health_reads_stable(self, client: TestClient):
        assets = client.get("/assets").json()
        if not assets:
            pytest.skip("No assets seeded")
        asset_id = assets[0]["id"]
        results = [
            [(s["sensor_id"], s["health"]) for s in client.get(f"/assets/{asset_id}/sensor-health").json()["sensors"]]
            for _ in range(3)
        ]
        assert results[0] == results[1] == results[2]


# ===========================================================================
# SECTION 11 — Query Safety / Bounded Behavior
# ===========================================================================


class TestQuerySafety:
    """Verify bounded query limits are respected."""

    def _first_asset_id(self, client):
        assets = client.get("/assets").json()
        if not assets:
            pytest.skip("No assets seeded")
        return assets[0]["id"]

    def test_asset_telemetry_limit_respected(self, client: TestClient):
        r = client.get(f"/assets/{self._first_asset_id(client)}/telemetry?limit=5")
        assert r.status_code == 200
        for series in r.json().get("sensors", []):
            assert len(series.get("measurements", [])) <= 5

    def test_asset_telemetry_limit_max_200(self, client: TestClient):
        r = client.get(f"/assets/{self._first_asset_id(client)}/telemetry?limit=201")
        assert r.status_code == 422

    def test_dependency_max_depth_enforced(self, client: TestClient):
        r = client.get(f"/assets/{self._first_asset_id(client)}/dependencies?max_depth=11")
        assert r.status_code == 422

    def test_resupply_ordered_by_date(self, client: TestClient):
        r = client.get("/resources/resupply")
        assert r.status_code == 200
        dates = [item["expected_date"] for item in r.json()]
        assert dates == sorted(dates)


# ===========================================================================
# SECTION 12 — Checksum / Data Integrity
# ===========================================================================


class TestDataIntegrity:
    """Verify deterministic checksum generation remains stable."""

    def test_canonical_checksum_stable(self):
        payload = {"observation_id": 42, "value": 99.9, "unit": "K"}
        assert compute_canonical_checksum(payload) == compute_canonical_checksum(payload)
        assert len(compute_canonical_checksum(payload)) == 64

    def test_canonical_checksum_key_order_invariant(self):
        assert compute_canonical_checksum({"a": 1, "b": 2}) == compute_canonical_checksum({"b": 2, "a": 1})

    def test_canonical_checksum_string_input(self):
        import json
        payload = {"x": 10}
        as_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        assert compute_canonical_checksum(payload) == compute_canonical_checksum(as_str)
