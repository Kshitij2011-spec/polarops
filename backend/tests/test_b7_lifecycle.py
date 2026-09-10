"""Unit, service, and API tests for Task B7: Model / Schema Lifecycle Metadata.

Test groups
-----------
1.  Basic lifecycle creation            (T01–T05)
2.  Temporal validity                   (T06–T11)
3.  Version resolution — historical     (T12–T15)
4.  Version resolution — current ACTIVE (T16–T18)
5.  Overlap protection                  (T19–T23)
6.  Time handling / UTC normalization   (T24–T25)
7.  API endpoints                       (T26–T31)
8.  Regression — B5/B6 unchanged       (T32–T33)

All tests avoid wall-clock dependency by using explicit fixed UTC timestamps.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import ComponentLifecycle
from app.models.enums import LifecycleStatus
from app.schemas.lifecycle import LifecycleCreateRequest
from app.services.lifecycle_service import (
    _check_overlap,
    _utc,
    create_lifecycle_record,
    get_lifecycle_record,
    is_valid_at,
    list_lifecycle_records,
    resolve_current_version,
    resolve_version_at,
)


# ── Helpers ────────────────────────────────────────────────────────────────

def _dt(iso: str) -> datetime:
    """Parse an ISO 8601 UTC string to a UTC-aware datetime."""
    return datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)


def _make_record(
    db: Session,
    record_id: str,
    component_type: str = "MODEL",
    component_name: str = "test-model",
    version: str = "1.0.0",
    schema_version: str = "1.0",
    status: LifecycleStatus = LifecycleStatus.ACTIVE,
    effective_from: datetime = _dt("2026-01-01T00:00:00"),
    effective_to: Optional[datetime] = None,
    description: Optional[str] = None,
) -> ComponentLifecycle:
    """Create and persist a minimal ComponentLifecycle row for testing."""
    record = ComponentLifecycle(
        id=record_id,
        component_type=component_type,
        component_name=component_name,
        version=version,
        schema_version=schema_version,
        status=status,
        effective_from=effective_from,
        effective_to=effective_to,
        description=description,
    )
    db.add(record)
    db.flush()
    return record


# ── 1. Basic lifecycle creation ────────────────────────────────────────────

class TestBasicCreation:
    """T01–T05: Service-level create + retrieve round-trips."""

    def test_T01_create_valid_record(self, db_session: Session):
        """T01: Valid create request persists and returns correct fields."""
        req = LifecycleCreateRequest(
            id="T01-LC",
            component_type="MODEL",
            component_name="risk-engine",
            version="2.1.0",
            schema_version="1.2",
            status=LifecycleStatus.ACTIVE,
            effective_from=_dt("2026-09-01T00:00:00"),
            effective_to=None,
        )
        result = create_lifecycle_record(db_session, req)
        assert result.id == "T01-LC"
        assert result.component_type == "MODEL"
        assert result.component_name == "risk-engine"
        assert result.version == "2.1.0"
        assert result.schema_version == "1.2"
        assert result.status == LifecycleStatus.ACTIVE
        assert result.effective_to is None

    def test_T02_version_and_schema_version_are_separate_fields(self, db_session: Session):
        """T02: version != schema_version — they are distinct, never conflated."""
        req = LifecycleCreateRequest(
            id="T02-LC",
            component_type="SCHEMA",
            component_name="telemetry-schema",
            version="3.0.0",
            schema_version="2.5",
            status=LifecycleStatus.ACTIVE,
            effective_from=_dt("2026-01-01T00:00:00"),
        )
        result = create_lifecycle_record(db_session, req)
        assert result.version == "3.0.0"
        assert result.schema_version == "2.5"
        assert result.version != result.schema_version

    def test_T03_retrieve_by_id(self, db_session: Session):
        """T03: get_lifecycle_record retrieves the same record created."""
        req = LifecycleCreateRequest(
            id="T03-LC",
            component_type="CONFIG",
            component_name="sensor-config",
            version="0.9",
            schema_version="0.1",
            effective_from=_dt("2026-06-01T00:00:00"),
        )
        create_lifecycle_record(db_session, req)
        fetched = get_lifecycle_record(db_session, "T03-LC")
        assert fetched is not None
        assert fetched.id == "T03-LC"
        assert fetched.component_name == "sensor-config"

    def test_T04_retrieve_nonexistent_returns_none(self, db_session: Session):
        """T04: get_lifecycle_record returns None for unknown ID."""
        result = get_lifecycle_record(db_session, "DOES-NOT-EXIST")
        assert result is None

    def test_T05_duplicate_id_raises_value_error(self, db_session: Session):
        """T05: Registering a duplicate ID raises ValueError."""
        req = LifecycleCreateRequest(
            id="T05-LC",
            component_type="MODEL",
            component_name="duplicate-model",
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
        )
        create_lifecycle_record(db_session, req)
        with pytest.raises(ValueError, match="already exists"):
            create_lifecycle_record(db_session, req)


# ── 2. Temporal validity ───────────────────────────────────────────────────

class TestTemporalValidity:
    """T06–T11: is_valid_at() boundary conditions."""

    def _build_orm(
        self,
        db: Session,
        record_id: str,
        effective_from: str,
        effective_to: Optional[str] = None,
    ) -> ComponentLifecycle:
        return _make_record(
            db,
            record_id=record_id,
            effective_from=_dt(effective_from),
            effective_to=_dt(effective_to) if effective_to else None,
        )

    def test_T06_before_effective_from_is_not_valid(self, db_session: Session):
        """T06: Timestamp before effective_from → not valid."""
        r = self._build_orm(db_session, "T06-LC", "2026-06-01T00:00:00")
        assert not is_valid_at(r, _dt("2026-05-31T23:59:59"))

    def test_T07_exactly_at_effective_from_is_valid(self, db_session: Session):
        """T07: Timestamp exactly at effective_from → valid (inclusive bound)."""
        r = self._build_orm(db_session, "T07-LC", "2026-06-01T00:00:00")
        assert is_valid_at(r, _dt("2026-06-01T00:00:00"))

    def test_T08_inside_interval_is_valid(self, db_session: Session):
        """T08: Timestamp strictly inside interval → valid."""
        r = self._build_orm(db_session, "T08-LC", "2026-01-01T00:00:00", "2026-12-31T00:00:00")
        assert is_valid_at(r, _dt("2026-06-15T12:00:00"))

    def test_T09_exactly_at_effective_to_is_not_valid(self, db_session: Session):
        """T09: Timestamp exactly at effective_to → NOT valid (exclusive bound)."""
        r = self._build_orm(db_session, "T09-LC", "2026-01-01T00:00:00", "2026-06-01T00:00:00")
        assert not is_valid_at(r, _dt("2026-06-01T00:00:00"))

    def test_T10_after_effective_to_is_not_valid(self, db_session: Session):
        """T10: Timestamp after effective_to → not valid."""
        r = self._build_orm(db_session, "T10-LC", "2026-01-01T00:00:00", "2026-06-01T00:00:00")
        assert not is_valid_at(r, _dt("2026-06-02T00:00:00"))

    def test_T11_open_ended_interval_is_valid_far_future(self, db_session: Session):
        """T11: Open-ended interval (effective_to=None) → valid far into the future."""
        r = self._build_orm(db_session, "T11-LC", "2026-01-01T00:00:00", effective_to=None)
        assert is_valid_at(r, _dt("2030-01-01T00:00:00"))


# ── 3. Version resolution — historical ────────────────────────────────────

class TestHistoricalResolution:
    """T12–T15: resolve_version_at() correctness."""

    def test_T12_resolves_correct_version_at_historical_timestamp(self, db_session: Session):
        """T12: Two adjacent versions — historical timestamp resolves to v1."""
        _make_record(db_session, "T12-V1", version="1.0.0", schema_version="1.0",
                     effective_from=_dt("2026-01-01T00:00:00"),
                     effective_to=_dt("2026-06-01T00:00:00"),
                     component_name="hist-model")
        _make_record(db_session, "T12-V2", version="2.0.0", schema_version="2.0",
                     effective_from=_dt("2026-06-01T00:00:00"),
                     component_name="hist-model")
        db_session.flush()

        result = resolve_version_at(db_session, "MODEL", "hist-model",
                                    _dt("2026-03-15T00:00:00"))
        assert result.resolved_record is not None
        assert result.resolved_record.version == "1.0.0"

    def test_T13_deprecated_version_remains_historically_resolvable(self, db_session: Session):
        """T13: DEPRECATED version is still returned for historical timestamps."""
        _make_record(db_session, "T13-DEP", version="1.5.0", schema_version="1.5",
                     status=LifecycleStatus.DEPRECATED,
                     effective_from=_dt("2026-01-01T00:00:00"),
                     effective_to=_dt("2026-09-01T00:00:00"),
                     component_name="dep-model")
        db_session.flush()

        result = resolve_version_at(db_session, "MODEL", "dep-model",
                                    _dt("2026-05-01T00:00:00"))
        assert result.resolved_record is not None
        assert result.resolved_record.status == LifecycleStatus.DEPRECATED
        assert result.resolved_record.version == "1.5.0"

    def test_T14_retired_version_remains_historically_resolvable(self, db_session: Session):
        """T14: RETIRED version is still returned for historical timestamps."""
        _make_record(db_session, "T14-RET", version="0.9.0", schema_version="0.9",
                     status=LifecycleStatus.RETIRED,
                     effective_from=_dt("2025-01-01T00:00:00"),
                     effective_to=_dt("2025-12-31T00:00:00"),
                     component_name="ret-model")
        db_session.flush()

        result = resolve_version_at(db_session, "MODEL", "ret-model",
                                    _dt("2025-06-01T00:00:00"))
        assert result.resolved_record is not None
        assert result.resolved_record.status == LifecycleStatus.RETIRED

    def test_T15_no_record_for_timestamp_returns_none(self, db_session: Session):
        """T15: Timestamp before any record → resolved_record is None."""
        _make_record(db_session, "T15-LC", version="1.0.0", schema_version="1.0",
                     effective_from=_dt("2026-09-01T00:00:00"),
                     component_name="gap-model")
        db_session.flush()

        result = resolve_version_at(db_session, "MODEL", "gap-model",
                                    _dt("2025-01-01T00:00:00"))
        assert result.resolved_record is None


# ── 4. Version resolution — current ACTIVE ────────────────────────────────

class TestCurrentVersionResolution:
    """T16–T18: resolve_current_version() correctness."""

    def test_T16_current_returns_active_record(self, db_session: Session):
        """T16: resolve_current_version returns ACTIVE open-ended record."""
        _make_record(db_session, "T16-ACT", version="3.0.0", schema_version="3.0",
                     status=LifecycleStatus.ACTIVE,
                     effective_from=_dt("2026-01-01T00:00:00"),
                     component_name="curr-model-a")
        db_session.flush()

        result = resolve_current_version(db_session, "MODEL", "curr-model-a")
        assert result.resolved_record is not None
        assert result.resolved_record.version == "3.0.0"
        assert result.is_current is True

    def test_T17_deprecated_not_selected_as_current(self, db_session: Session):
        """T17: Only DEPRECATED record present → no current version returned."""
        _make_record(db_session, "T17-DEP", version="2.0.0", schema_version="2.0",
                     status=LifecycleStatus.DEPRECATED,
                     effective_from=_dt("2026-01-01T00:00:00"),
                     component_name="curr-model-b")
        db_session.flush()

        result = resolve_current_version(db_session, "MODEL", "curr-model-b")
        assert result.resolved_record is None
        assert result.is_current is False

    def test_T18_active_preferred_over_deprecated(self, db_session: Session):
        """T18: ACTIVE record is returned even when a DEPRECATED one also exists."""
        _make_record(db_session, "T18-DEP", version="1.0.0", schema_version="1.0",
                     status=LifecycleStatus.DEPRECATED,
                     effective_from=_dt("2026-01-01T00:00:00"),
                     effective_to=_dt("2026-06-01T00:00:00"),
                     component_name="curr-model-c")
        _make_record(db_session, "T18-ACT", version="2.0.0", schema_version="2.0",
                     status=LifecycleStatus.ACTIVE,
                     effective_from=_dt("2026-06-01T00:00:00"),
                     component_name="curr-model-c")
        db_session.flush()

        result = resolve_current_version(db_session, "MODEL", "curr-model-c")
        assert result.resolved_record is not None
        assert result.resolved_record.version == "2.0.0"
        assert result.resolved_record.status == LifecycleStatus.ACTIVE


# ── 5. Overlap protection ──────────────────────────────────────────────────

class TestOverlapProtection:
    """T19–T23: _check_overlap() and create_lifecycle_record() rejection."""

    def test_T19_overlapping_intervals_rejected(self, db_session: Session):
        """T19: Overlapping intervals for same component → ValueError."""
        req1 = LifecycleCreateRequest(
            id="T19-V1",
            component_type="MODEL",
            component_name="overlap-model",
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
            effective_to=_dt("2026-08-01T00:00:00"),
        )
        create_lifecycle_record(db_session, req1)

        req2 = LifecycleCreateRequest(
            id="T19-V2",
            component_type="MODEL",
            component_name="overlap-model",
            version="2.0.0",
            schema_version="2.0",
            effective_from=_dt("2026-06-01T00:00:00"),  # overlaps with V1
            effective_to=None,
        )
        with pytest.raises(ValueError, match="overlaps"):
            create_lifecycle_record(db_session, req2)

    def test_T20_adjacent_intervals_accepted(self, db_session: Session):
        """T20: Adjacent (non-overlapping) intervals accepted without error."""
        req1 = LifecycleCreateRequest(
            id="T20-V1",
            component_type="MODEL",
            component_name="adjacent-model",
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
            effective_to=_dt("2026-06-01T00:00:00"),
        )
        req2 = LifecycleCreateRequest(
            id="T20-V2",
            component_type="MODEL",
            component_name="adjacent-model",
            version="2.0.0",
            schema_version="2.0",
            effective_from=_dt("2026-06-01T00:00:00"),  # starts exactly where v1 ends
            effective_to=None,
        )
        r1 = create_lifecycle_record(db_session, req1)
        r2 = create_lifecycle_record(db_session, req2)
        assert r1.id == "T20-V1"
        assert r2.id == "T20-V2"

    def test_T21_open_ended_overlap_rejected(self, db_session: Session):
        """T21: Open-ended existing record blocks any overlapping new record."""
        req1 = LifecycleCreateRequest(
            id="T21-V1",
            component_type="MODEL",
            component_name="open-model",
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
            effective_to=None,  # open-ended
        )
        create_lifecycle_record(db_session, req1)

        req2 = LifecycleCreateRequest(
            id="T21-V2",
            component_type="MODEL",
            component_name="open-model",
            version="2.0.0",
            schema_version="2.0",
            effective_from=_dt("2026-06-01T00:00:00"),
        )
        with pytest.raises(ValueError, match="overlaps"):
            create_lifecycle_record(db_session, req2)

    def test_T22_different_components_have_independent_intervals(self, db_session: Session):
        """T22: Same interval is fine for different component names."""
        req1 = LifecycleCreateRequest(
            id="T22-A",
            component_type="MODEL",
            component_name="component-alpha",
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
        )
        req2 = LifecycleCreateRequest(
            id="T22-B",
            component_type="MODEL",
            component_name="component-beta",  # different name
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
        )
        r1 = create_lifecycle_record(db_session, req1)
        r2 = create_lifecycle_record(db_session, req2)
        assert r1.id == "T22-A"
        assert r2.id == "T22-B"

    def test_T23_different_component_types_have_independent_intervals(self, db_session: Session):
        """T23: Same name but different component_type → independent intervals."""
        req1 = LifecycleCreateRequest(
            id="T23-MODEL",
            component_type="MODEL",
            component_name="shared-name",
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
        )
        req2 = LifecycleCreateRequest(
            id="T23-SCHEMA",
            component_type="SCHEMA",
            component_name="shared-name",  # same name, different type
            version="1.0.0",
            schema_version="1.0",
            effective_from=_dt("2026-01-01T00:00:00"),
        )
        r1 = create_lifecycle_record(db_session, req1)
        r2 = create_lifecycle_record(db_session, req2)
        assert r1.id == "T23-MODEL"
        assert r2.id == "T23-SCHEMA"


# ── 6. Time handling / UTC normalization ───────────────────────────────────

class TestTimeHandling:
    """T24–T25: _utc() and naive datetime normalization."""

    def test_T24_naive_datetime_treated_as_utc(self, db_session: Session):
        """T24: Naive (SQLite-like) timestamps are normalized to UTC-aware."""
        naive_dt = datetime(2026, 6, 1, 0, 0, 0)  # no tzinfo
        result = _utc(naive_dt)
        assert result is not None
        assert result.tzinfo is not None
        assert result.tzinfo == timezone.utc

    def test_T25_utc_aware_datetime_is_passthrough(self, db_session: Session):
        """T25: UTC-aware datetime passes through _utc() unchanged."""
        aware_dt = _dt("2026-06-01T12:00:00")
        result = _utc(aware_dt)
        assert result == aware_dt
        assert result.tzinfo is not None


# ── 7. API endpoints ───────────────────────────────────────────────────────

class TestAPIEndpoints:
    """T26–T31: HTTP-level API tests via FastAPI TestClient."""

    def test_T26_list_endpoint_returns_200(self, client: TestClient):
        """T26: GET /lifecycle returns 200 with correct structure."""
        resp = client.get("/lifecycle")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_T27_post_registers_new_record(self, client: TestClient):
        """T27: POST /lifecycle creates a record and returns 201."""
        payload = {
            "id": "API-T27",
            "component_type": "MODEL",
            "component_name": "api-test-model",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z",
            "effective_to": None,
        }
        resp = client.post("/lifecycle", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["id"] == "API-T27"
        assert data["version"] == "1.0.0"
        assert data["schema_version"] == "1.0"

    def test_T28_get_by_id_returns_correct_record(self, client: TestClient):
        """T28: GET /lifecycle/{id} returns 200 for an existing record."""
        # Create first
        payload = {
            "id": "API-T28",
            "component_type": "SCHEMA",
            "component_name": "api-test-schema",
            "version": "2.0.0",
            "schema_version": "2.0",
            "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z",
        }
        client.post("/lifecycle", json=payload)
        resp = client.get("/lifecycle/API-T28")
        assert resp.status_code == 200
        assert resp.json()["id"] == "API-T28"

    def test_T29_get_by_id_unknown_returns_404(self, client: TestClient):
        """T29: GET /lifecycle/{id} returns 404 for unknown ID."""
        resp = client.get("/lifecycle/DOES-NOT-EXIST-999")
        assert resp.status_code == 404

    def test_T30_resolve_endpoint_no_timestamp_returns_current(self, client: TestClient):
        """T30: GET /lifecycle/resolve without timestamp resolves current version."""
        # Seed a record
        payload = {
            "id": "API-T30",
            "component_type": "MODEL",
            "component_name": "resolve-test-model",
            "version": "5.0.0",
            "schema_version": "5.0",
            "status": "ACTIVE",
            "effective_from": "2026-01-01T00:00:00Z",
        }
        client.post("/lifecycle", json=payload)
        resp = client.get(
            "/lifecycle/resolve",
            params={"component_type": "MODEL", "component_name": "resolve-test-model"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["resolved_record"] is not None
        assert data["resolved_record"]["version"] == "5.0.0"
        assert data["is_current"] is True

    def test_T31_resolve_with_timestamp_returns_historical(self, client: TestClient):
        """T31: GET /lifecycle/resolve with timestamp resolves historical version."""
        # Two adjacent versions
        client.post("/lifecycle", json={
            "id": "API-T31-V1",
            "component_type": "MODEL",
            "component_name": "ts-resolve-model",
            "version": "1.0.0",
            "schema_version": "1.0",
            "status": "DEPRECATED",
            "effective_from": "2026-01-01T00:00:00Z",
            "effective_to": "2026-06-01T00:00:00Z",
        })
        client.post("/lifecycle", json={
            "id": "API-T31-V2",
            "component_type": "MODEL",
            "component_name": "ts-resolve-model",
            "version": "2.0.0",
            "schema_version": "2.0",
            "status": "ACTIVE",
            "effective_from": "2026-06-01T00:00:00Z",
        })
        resp = client.get(
            "/lifecycle/resolve",
            params={
                "component_type": "MODEL",
                "component_name": "ts-resolve-model",
                "timestamp": "2026-03-01T00:00:00Z",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["resolved_record"]["version"] == "1.0.0"
        assert data["resolved_record"]["status"] == "DEPRECATED"


# ── 8. Regression — B5/B6 unchanged ───────────────────────────────────────

class TestRegression:
    """T32–T33: Verify B5/B6 endpoints remain functional."""

    def test_T32_b6_asset_sensor_health_endpoint_still_works(self, client: TestClient):
        """T32: GET /assets/{id}/sensor-health still returns 200 or 404 (not broken)."""
        resp = client.get("/assets/G-02/sensor-health")
        assert resp.status_code in (200, 404)

    def test_T33_b5_science_instruments_endpoint_still_works(self, client: TestClient):
        """T33: GET /science/instruments still returns 200 (B5 not broken)."""
        resp = client.get("/science/instruments")
        assert resp.status_code == 200
