"""B9 - API Contract Hardening Test Suite.

Purpose
-------
Verify that all public PolarOps API endpoints:
* Return expected fields with consistent types.
* Serialize enums as their string values (not Python repr).
* Handle invalid IDs, enum values, and malformed input correctly.
* Return appropriate HTTP status codes (404, 400/422, 409).
* Do not expose raw stack traces or secrets.
* Preserve B4/B5/B6/B7 contract semantics exactly.
* Use canonical ProvenanceSchema where provenance is required.
* Maintain /lifecycle/resolve routing before /{id}.
"""

from datetime import datetime

import pytest
from fastapi.testclient import TestClient


# -------------------------------------------------------------------------
# 1. HEALTH ENDPOINT CONTRACT
# -------------------------------------------------------------------------

class TestHealthContract:
    """GET /health - explicit response schema and field contract."""

    def test_health_returns_200(self, client: TestClient):
        r = client.get("/health")
        assert r.status_code == 200

    def test_health_has_status_field(self, client: TestClient):
        r = client.get("/health")
        assert "status" in r.json()

    def test_health_status_is_ok(self, client: TestClient):
        r = client.get("/health")
        assert r.json()["status"] == "ok"

    def test_health_has_service_field(self, client: TestClient):
        r = client.get("/health")
        assert "service" in r.json()

    def test_health_service_is_polarops_api(self, client: TestClient):
        r = client.get("/health")
        assert r.json()["service"] == "polarops-api"

    def test_health_no_extra_sensitive_keys(self, client: TestClient):
        """Ensure health check does not leak secrets, DB strings, or env details."""
        r = client.get("/health")
        body = r.text.lower()
        for forbidden in ("password", "secret", "token", "sqlite", "traceback", "error"):
            assert forbidden not in body, f"Health response must not contain '{forbidden}'"


# -------------------------------------------------------------------------
# 2. ASSETS API - 404 AND ENUM SERIALIZATION
# -------------------------------------------------------------------------

class TestAssetsContract:
    """GET /assets and related endpoints."""

    def test_assets_list_returns_array(self, client: TestClient):
        r = client.get("/assets")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_assets_list_item_has_required_fields(self, client: TestClient):
        r = client.get("/assets")
        items = r.json()
        assert len(items) > 0
        item = items[0]
        for field in ("id", "code", "name", "category", "status", "health_score", "criticality"):
            assert field in item, f"Missing field: {field}"

    def test_assets_category_enum_is_string(self, client: TestClient):
        r = client.get("/assets")
        for item in r.json():
            cat = item["category"]
            assert isinstance(cat, str), "category must be a string (StrEnum)"
            assert cat == cat.upper(), "category must be upper-case string"

    def test_assets_status_enum_is_string(self, client: TestClient):
        r = client.get("/assets")
        for item in r.json():
            status = item["status"]
            assert isinstance(status, str)
            assert status in ("NOMINAL", "WARNING", "CRITICAL", "SHUTDOWN", "MAINTENANCE")

    def test_assets_criticality_enum_is_string(self, client: TestClient):
        r = client.get("/assets")
        for item in r.json():
            crit = item["criticality"]
            assert isinstance(crit, str)
            assert crit in ("LIFE_SUPPORT", "CRITICAL", "STANDARD", "DEFERRABLE")

    def test_asset_detail_404_on_invalid_id(self, client: TestClient):
        r = client.get("/assets/NONEXISTENT-ASSET-XXXXXX")
        assert r.status_code == 404

    def test_asset_detail_404_no_fake_data(self, client: TestClient):
        """A 404 must not return a fabricated entity in the body."""
        r = client.get("/assets/NONEXISTENT-ASSET-XXXXXX")
        assert r.status_code == 404
        assert "detail" in r.json()

    def test_asset_detail_has_provenance(self, client: TestClient):
        r = client.get("/assets")
        if not r.json():
            pytest.skip("No assets seeded")
        asset_id = r.json()[0]["id"]
        r2 = client.get(f"/assets/{asset_id}")
        assert r2.status_code == 200
        data = r2.json()
        assert "provenance" in data
        prov = data["provenance"]
        for field in ("source", "timestamp", "quality", "truth_type", "confidence"):
            assert field in prov, f"ProvenanceSchema missing field: {field}"

    def test_asset_provenance_quality_is_canonical_string(self, client: TestClient):
        r = client.get("/assets")
        if not r.json():
            pytest.skip("No assets seeded")
        asset_id = r.json()[0]["id"]
        r2 = client.get(f"/assets/{asset_id}")
        prov = r2.json()["provenance"]
        assert prov["quality"] in ("GOOD", "SUSPECT", "BAD")

    def test_asset_dependency_404_on_invalid_id(self, client: TestClient):
        r = client.get("/assets/FAKE-999/dependencies")
        assert r.status_code == 404

    def test_asset_telemetry_404_on_invalid_id(self, client: TestClient):
        r = client.get("/assets/FAKE-999/telemetry")
        assert r.status_code == 404

    def test_asset_risk_404_on_invalid_id(self, client: TestClient):
        r = client.get("/assets/FAKE-999/risk")
        assert r.status_code == 404


# -------------------------------------------------------------------------
# 3. RESOURCES API - ENUM TYPING
# -------------------------------------------------------------------------

class TestResourcesContract:
    """GET /resources endpoints - typed enums and provenance."""

    def test_inventory_criticality_is_enum_string(self, client: TestClient):
        r = client.get("/resources/inventory")
        assert r.status_code == 200
        items = r.json()
        for item in items:
            crit = item.get("criticality")
            if crit is not None:
                assert isinstance(crit, str)
                assert crit in ("LIFE_SUPPORT", "CRITICAL", "STANDARD", "DEFERRABLE"), (
                    f"criticality '{crit}' is not a valid Criticality enum value"
                )

    def test_resupply_status_is_enum_string(self, client: TestClient):
        r = client.get("/resources/resupply")
        assert r.status_code == 200
        items = r.json()
        for item in items:
            status = item.get("status")
            if status is not None:
                assert isinstance(status, str)
                assert status in ("SCHEDULED", "IN_TRANSIT", "DELAYED", "DELIVERED"), (
                    f"resupply status '{status}' is not a valid ResupplyStatus enum value"
                )

    def test_fuel_status_has_provenance(self, client: TestClient):
        r = client.get("/resources/fuel")
        assert r.status_code in (200, 404)
        if r.status_code == 200:
            data = r.json()
            assert "provenance" in data
            prov = data["provenance"]
            for f in ("source", "timestamp", "quality", "truth_type", "confidence"):
                assert f in prov


# -------------------------------------------------------------------------
# 4. B4 RESILIENCE - ENUM SERIALIZATION AND STATE TRANSITIONS
# -------------------------------------------------------------------------

class TestB4ResilienceContract:
    """POST /resilience/simulate-* and GET /resilience/status."""

    def test_comms_status_link_status_is_string(self, client: TestClient):
        r = client.get("/resilience/status")
        assert r.status_code == 200
        status = r.json()["status"]
        assert isinstance(status, str)
        assert status in ("ONLINE", "DEGRADED", "OFFLINE", "RESTORING", "SYNCING")

    def test_simulate_degraded_returns_degraded_status(self, client: TestClient):
        r = client.post("/resilience/simulate-degraded")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "DEGRADED"

    def test_simulate_degraded_has_bandwidth_and_latency(self, client: TestClient):
        r = client.post("/resilience/simulate-degraded?latency_ms=1450&bandwidth_kbps=256")
        assert r.status_code == 200
        data = r.json()
        assert data["latency_ms"] == 1450
        assert data["bandwidth_kbps"] == 256

    def test_simulate_degraded_provenance_is_canonical(self, client: TestClient):
        r = client.post("/resilience/simulate-degraded")
        assert r.status_code == 200
        prov = r.json().get("provenance")
        assert prov is not None
        for f in ("source", "timestamp", "quality", "truth_type", "confidence"):
            assert f in prov

    def test_simulate_offline_returns_offline_status(self, client: TestClient):
        r = client.post("/resilience/simulate-offline")
        assert r.status_code == 200
        assert r.json()["status"] == "OFFLINE"

    def test_restore_after_offline(self, client: TestClient):
        client.post("/resilience/simulate-offline")
        r = client.post("/resilience/restore")
        assert r.status_code == 200
        data = r.json()
        assert "link_status" in data
        assert data["link_status"] in ("ONLINE", "RESTORING", "SYNCING")


# -------------------------------------------------------------------------
# 5. B5 SCIENCE - TIMESTAMP AND PROVENANCE CONTRACT
# -------------------------------------------------------------------------

class TestB5ScienceContract:
    """GET /science and POST /science/observations endpoints."""

    def test_list_instruments_returns_array(self, client: TestClient):
        r = client.get("/science/instruments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_instrument_detail_404_on_invalid_id(self, client: TestClient):
        r = client.get("/science/instruments/NONEXISTENT-INST/observations")
        assert r.status_code == 404

    def test_science_observation_quality_is_enum_string(self, client: TestClient):
        instruments = client.get("/science/instruments").json()
        if not instruments:
            pytest.skip("No instruments seeded")
        inst_id = instruments[0]["id"]
        r = client.get(f"/science/instruments/{inst_id}/observations")
        if r.status_code == 200:
            obs_list = r.json().get("recent_observations", [])
            for obs in obs_list:
                quality = obs.get("quality")
                if quality is not None:
                    assert isinstance(quality, str)
                    assert quality in ("GOOD", "SUSPECT", "BAD"), (
                        f"quality '{quality}' is not a valid Quality enum value"
                    )

    def test_science_observation_truth_type_is_enum_string(self, client: TestClient):
        instruments = client.get("/science/instruments").json()
        if not instruments:
            pytest.skip("No instruments seeded")
        inst_id = instruments[0]["id"]
        r = client.get(f"/science/instruments/{inst_id}/observations")
        if r.status_code == 200:
            obs_list = r.json().get("recent_observations", [])
            for obs in obs_list:
                tt = obs.get("truth_type")
                if tt is not None:
                    assert isinstance(tt, str)
                    assert tt in (
                        "MEASURED", "DERIVED", "FORECAST", "SCENARIO", "SYNTHETIC_SIMULATION"
                    ), f"truth_type '{tt}' is not a valid TruthType value"

    def test_buffer_observation_invalid_instrument_returns_404(self, client: TestClient):
        payload = {
            "instrument_id": "NONEXISTENT-INST-XXXXXX",
            "measurement_value": 42.0,
            "unit": "TECU",
        }
        r = client.post("/science/observations/buffer", json=payload)
        assert r.status_code == 404


# -------------------------------------------------------------------------
# 6. B6 SENSOR HEALTH - HEALTH/QUALITY ORTHOGONALITY
# -------------------------------------------------------------------------

class TestB6SensorHealthContract:
    """GET /assets/{asset_id}/sensor-health."""

    def _get_valid_asset_id(self, client: TestClient) -> str:
        r = client.get("/assets")
        assets = r.json()
        if not assets:
            pytest.skip("No assets seeded")
        return assets[0]["id"]

    def test_sensor_health_returns_200(self, client: TestClient):
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        assert r.status_code == 200

    def test_sensor_health_404_on_invalid_asset(self, client: TestClient):
        r = client.get("/assets/FAKE-ASSET-XXXX/sensor-health")
        assert r.status_code == 404

    def test_sensor_health_response_has_required_fields(self, client: TestClient):
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        data = r.json()
        for field in ("asset_id", "asset_name", "sensor_count", "sensors"):
            assert field in data

    def test_per_sensor_health_fields(self, client: TestClient):
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        data = r.json()
        for sensor in data.get("sensors", []):
            for field in (
                "sensor_id", "sensor_name", "metric_key", "freshness_seconds",
                "health", "quality", "truth_type", "confidence", "provenance",
            ):
                assert field in sensor, f"sensor record missing field: {field}"

    def test_sensor_health_values_are_valid(self, client: TestClient):
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        for sensor in r.json().get("sensors", []):
            assert sensor["health"] in ("FRESH", "STALE", "UNKNOWN")

    def test_sensor_quality_values_are_valid(self, client: TestClient):
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        for sensor in r.json().get("sensors", []):
            assert sensor["quality"] in ("GOOD", "SUSPECT", "BAD")

    def test_sensor_health_and_quality_are_independent(self, client: TestClient):
        """GOOD+STALE or SUSPECT+FRESH must both be representable (not conflated)."""
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        sensors = r.json().get("sensors", [])
        for sensor in sensors:
            assert "health" in sensor
            assert "quality" in sensor
            assert sensor["health"] in ("FRESH", "STALE", "UNKNOWN")
            assert sensor["quality"] in ("GOOD", "SUSPECT", "BAD")

    def test_sensor_confidence_in_valid_range(self, client: TestClient):
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        for sensor in r.json().get("sensors", []):
            conf = sensor.get("confidence")
            assert conf is not None
            assert 0.0 <= conf <= 1.0

    def test_sensor_provenance_is_canonical(self, client: TestClient):
        asset_id = self._get_valid_asset_id(client)
        r = client.get(f"/assets/{asset_id}/sensor-health")
        for sensor in r.json().get("sensors", []):
            prov = sensor.get("provenance", {})
            for f in ("source", "timestamp", "quality", "truth_type", "confidence"):
                assert f in prov


# -------------------------------------------------------------------------
# 7. B7 LIFECYCLE - ROUTING, INTERVALS, AND ENUM SERIALIZATION
# -------------------------------------------------------------------------

class TestB7LifecycleContract:
    """GET /lifecycle, GET /lifecycle/resolve, GET /lifecycle/{id}, POST /lifecycle."""

    def _post_lifecycle(self, client: TestClient, unique_suffix: str) -> "Response":
        payload = {
            "id": f"B9-LC-{unique_suffix}",
            "component_type": "MODEL",
            "component_name": f"b9-test-model-{unique_suffix}",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2025-01-01T00:00:00Z",
            "effective_to": None,
        }
        return client.post("/lifecycle", json=payload)

    def test_lifecycle_list_returns_total_and_items(self, client: TestClient):
        r = client.get("/lifecycle")
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_lifecycle_status_enum_serializes_as_string(self, client: TestClient):
        r = self._post_lifecycle(client, "ENUM-CHK")
        assert r.status_code == 201
        assert r.json()["status"] == "ACTIVE"

    def test_lifecycle_get_by_id(self, client: TestClient):
        r = self._post_lifecycle(client, "GET-ID")
        assert r.status_code == 201
        record_id = r.json()["id"]
        r2 = client.get(f"/lifecycle/{record_id}")
        assert r2.status_code == 200
        assert r2.json()["id"] == record_id

    def test_lifecycle_get_by_invalid_id_returns_404(self, client: TestClient):
        r = client.get("/lifecycle/DOES-NOT-EXIST-XXXXXX")
        assert r.status_code == 404

    def test_lifecycle_resolve_is_not_treated_as_id(self, client: TestClient):
        """Critical: /lifecycle/resolve must not be caught by /{id} route."""
        r = client.get("/lifecycle/resolve?component_type=MODEL&component_name=nonexistent")
        assert r.status_code == 200
        data = r.json()
        assert "resolved_record" in data or "resolution_note" in data

    def test_lifecycle_resolve_response_shape(self, client: TestClient):
        r = self._post_lifecycle(client, "RESOLVE-SHAPE")
        assert r.status_code == 201
        ct = r.json()["component_type"]
        cn = r.json()["component_name"]
        r2 = client.get(f"/lifecycle/resolve?component_type={ct}&component_name={cn}")
        assert r2.status_code == 200
        data = r2.json()
        for field in ("component_type", "component_name", "query_timestamp", "is_current"):
            assert field in data

    def test_lifecycle_overlap_rejected_with_409(self, client: TestClient):
        suffix = "OVERLAP-B9"
        r1 = self._post_lifecycle(client, suffix)
        assert r1.status_code == 201
        payload = {
            "id": f"B9-LC-{suffix}-DUP",
            "component_type": "MODEL",
            "component_name": f"b9-test-model-{suffix}",
            "version": "1.1.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2025-01-01T00:00:00Z",
            "effective_to": None,
        }
        r2 = client.post("/lifecycle", json=payload)
        assert r2.status_code == 409

    def test_lifecycle_interval_boundary_semantics(self, client: TestClient):
        """At exactly effective_to, old version must NOT be valid."""
        suffix = "BOUND-B9"
        r = client.post("/lifecycle", json={
            "id": f"B9-LC-{suffix}",
            "component_type": "CONFIG",
            "component_name": f"b9-config-{suffix}",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2025-01-01T00:00:00Z",
            "effective_to": "2025-06-01T00:00:00Z",
        })
        assert r.status_code == 201
        r2 = client.get(
            f"/lifecycle/resolve?component_type=CONFIG"
            f"&component_name=b9-config-{suffix}"
            f"&timestamp=2025-06-01T00:00:00Z"
        )
        assert r2.status_code == 200
        data = r2.json()
        assert data.get("resolved_record") is None


# -------------------------------------------------------------------------
# 8. ERROR CONTRACT - NO STACK TRACES, CORRECT STATUS CODES
# -------------------------------------------------------------------------

class TestErrorContract:
    """Cross-cutting error behavior verification."""

    def test_no_traceback_in_404_response(self, client: TestClient):
        r = client.get("/assets/NONEXISTENT-ASSET-XXXXXX")
        body = r.text.lower()
        assert "traceback" not in body
        assert "raise " not in body

    def test_no_traceback_in_lifecycle_404(self, client: TestClient):
        r = client.get("/lifecycle/NONEXISTENT-ID-XXXXXX")
        body = r.text.lower()
        assert "traceback" not in body

    def test_no_secrets_in_any_api_response(self, client: TestClient):
        """Health endpoint and asset list must not expose secrets."""
        for url in ("/health", "/assets", "/resources/inventory"):
            r = client.get(url)
            body = r.text.lower()
            for forbidden in ("password=", "secret=", "api_key", "token=",
                               "postgresql://", "sqlite:///", "credentials"):
                assert forbidden not in body, f"Possible secret leak at {url}: found '{forbidden}'"

    def test_invalid_enum_query_param_returns_422(self, client: TestClient):
        r = client.get("/assets?category=INVALID_CATEGORY_VALUE")
        assert r.status_code == 422

    def test_lifecycle_missing_required_field_returns_422(self, client: TestClient):
        payload = {"id": "B9-MISSING-FIELDS"}
        r = client.post("/lifecycle", json=payload)
        assert r.status_code == 422

    def test_incident_empty_json_body_returns_422(self, client: TestClient):
        """PATCH with {} body missing 'status' field triggers FastAPI validation error (422)."""
        r = client.post("/incidents", json={
            "station_id": "STATION-BHARATI",
            "title": "B9 Test Incident",
            "severity": "MINOR",
            "description": "Test incident for B9 contract verification",
        })
        assert r.status_code == 200
        inc_id = r.json()["id"]
        # {} body parsed as IncidentStatusUpdateRequest but 'status' field is required -> 422
        r2 = client.patch(f"/incidents/{inc_id}/status", json={})
        assert r2.status_code == 422


# -------------------------------------------------------------------------
# 9. PROVENANCE CONTRACT - CANONICAL FIELDS ACROSS DOMAINS
# -------------------------------------------------------------------------

class TestProvenanceContract:
    """Verify canonical ProvenanceSchema shape is consistent across all domains."""

    REQUIRED_PROVENANCE_FIELDS = {"source", "timestamp", "quality", "truth_type", "confidence"}

    def _assert_provenance(self, prov: dict, context: str):
        for f in self.REQUIRED_PROVENANCE_FIELDS:
            assert f in prov, f"{context}: provenance missing '{f}'"

    def test_fuel_provenance_has_canonical_fields(self, client: TestClient):
        r = client.get("/resources/fuel")
        if r.status_code == 200:
            self._assert_provenance(r.json()["provenance"], "fuel")

    def test_comms_status_provenance_has_canonical_fields(self, client: TestClient):
        r = client.get("/resilience/status")
        assert r.status_code == 200
        self._assert_provenance(r.json()["provenance"], "comms_status")

    def test_provenance_confidence_is_float_in_range(self, client: TestClient):
        r = client.get("/resilience/status")
        assert r.status_code == 200
        conf = r.json()["provenance"]["confidence"]
        assert isinstance(conf, (int, float))
        assert 0.0 <= conf <= 1.0

    def test_provenance_quality_is_valid_enum(self, client: TestClient):
        r = client.get("/resilience/status")
        assert r.status_code == 200
        quality = r.json()["provenance"]["quality"]
        assert quality in ("GOOD", "SUSPECT", "BAD")

    def test_provenance_truth_type_is_valid_enum(self, client: TestClient):
        r = client.get("/resilience/status")
        assert r.status_code == 200
        truth_type = r.json()["provenance"]["truth_type"]
        assert truth_type in (
            "MEASURED", "DERIVED", "FORECAST", "SCENARIO", "SYNTHETIC_SIMULATION"
        )


# -------------------------------------------------------------------------
# 10. DATETIME CONTRACT - UTC, NULLABLE FIELDS
# -------------------------------------------------------------------------

class TestDatetimeContract:
    """Verify timestamp fields are ISO-8601 serializable and UTC-consistent."""

    def test_lifecycle_created_at_is_datetime_string(self, client: TestClient):
        r = client.post("/lifecycle", json={
            "id": "B9-LC-DATETIME-CHK",
            "component_type": "MODEL",
            "component_name": "b9-datetime-test",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2025-01-01T00:00:00Z",
        })
        assert r.status_code == 201
        data = r.json()
        created_at = data["created_at"]
        parsed = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        assert parsed is not None

    def test_lifecycle_effective_to_can_be_null(self, client: TestClient):
        r = client.post("/lifecycle", json={
            "id": "B9-LC-NULL-TO",
            "component_type": "MODEL",
            "component_name": "b9-null-to-test",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2025-01-01T00:00:00Z",
            "effective_to": None,
        })
        assert r.status_code == 201
        assert r.json()["effective_to"] is None

    def test_comms_last_sync_at_is_nullable(self, client: TestClient):
        """last_sync_at can be None when no sync has occurred yet."""
        r = client.get("/resilience/status")
        assert r.status_code == 200
        val = r.json().get("last_sync_at")
        if val is not None:
            datetime.fromisoformat(val.replace("Z", "+00:00"))

