"""Unit and regression tests for Task B5: Science Data Continuity Backend.

Verifies:
1. Normal observation is not falsely classified as buffered.
2. Buffered/queued observation is correctly reported as buffered.
3. Observation ID does not determine buffered state (no ID > 100 threshold).
4. Offline observation can be buffered using the existing sync mechanism.
5. Buffered observation retains truth_type = MEASURED.
6. Metadata completeness reflects actual populated/missing fields.
7. A complete observation is reported complete.
8. An incomplete observation is not falsely reported complete.
9. Science provenance timestamp comes from observation timestamp.
10. Naive SQLite timestamps are handled safely.
11. Future timestamps clamp freshness to 0.0.
12. Missing timestamp uses fallback behavior.
13. DEGRADED communication does not crash science observation pipeline.
14. OFFLINE communication preserves local buffering behavior.
15. Existing synchronization/recovery behavior remains intact.
16. Existing science API endpoints remain backward-compatible.
"""

from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy.orm import Session

from app.models.entities import (
    CommunicationLink,
    ScientificInstrument,
    ScientificObservation,
    SyncQueueItem,
)
from app.models.enums import CommsLinkStatus, Quality, SyncStatus, TruthType
from app.schemas.resilience import BufferObservationRequest
from app.services.science_service import (
    _utc,
    buffer_science_observation,
    build_observation_provenance,
    evaluate_instrument_metadata_completeness,
    evaluate_observation_metadata_completeness,
    get_all_instruments,
    get_instrument_detail,
    record_science_observation,
)
from app.services.sync_service import restore_and_sync_all


@pytest.fixture(autouse=True)
def clean_science_and_comms_state(db_session: Session):
    """Ensure link is ONLINE and test-created science records are cleaned up after each test."""
    yield
    link = db_session.query(CommunicationLink).filter(CommunicationLink.station_id == "STATION-BHARATI").first()
    if link:
        link.status = CommsLinkStatus.ONLINE
        link.latency_ms = 580
        link.bandwidth_kbps = 2048
        link.last_sync_at = datetime.now(timezone.utc)
    db_session.query(SyncQueueItem).filter(
        SyncQueueItem.event_type == "SCIENCE_OBSERVATION_BUFFER"
    ).delete(synchronize_session=False)
    db_session.query(ScientificObservation).filter(
        ScientificObservation.source.in_(["LOCAL_EDGE_BUFFER", "DIRECT_SENSOR_STREAM", "DEGRADED_STREAM", "TEST_SUITE"])
    ).delete(synchronize_session=False)
    db_session.commit()


def test_normal_observation_not_falsely_classified_as_buffered(db_session: Session):
    """1. Verify a normal observation (not queued) is reported with is_buffered=False."""
    now_utc = datetime.now(timezone.utc)
    obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=now_utc,
        measurement_value=128.4,
        unit="TECU",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
        created_at=now_utc,
    )
    db_session.add(obs)
    db_session.commit()

    detail = get_instrument_detail(db_session, "INST-S17-RADAR")
    assert detail is not None
    obs_schema = next((o for o in detail.recent_observations if o.id == obs.id), None)
    assert obs_schema is not None
    assert obs_schema.is_buffered is False
    assert obs_schema.sync_status == "RECONCILED"


def test_buffered_queued_observation_correctly_reported(db_session: Session):
    """2. Verify an observation actively queued in SyncQueueItem is reported as is_buffered=True."""
    req = BufferObservationRequest(
        instrument_id="INST-S17-RADAR",
        measurement_value=135.2,
        unit="TECU",
    )
    buffered_obs = buffer_science_observation(db_session, req)
    assert buffered_obs.is_buffered is True
    assert buffered_obs.sync_status == "PENDING"

    detail = get_instrument_detail(db_session, "INST-S17-RADAR")
    assert detail is not None
    obs_schema = next((o for o in detail.recent_observations if o.id == buffered_obs.id), None)
    assert obs_schema is not None
    assert obs_schema.is_buffered is True
    assert obs_schema.sync_status == "PENDING"


def test_observation_id_does_not_determine_buffered_state(db_session: Session):
    """3. Verify observation ID thresholds (e.g. obs.id > 100) NEVER determine buffered status."""
    now_utc = datetime.now(timezone.utc)

    # Case A: Low ID that IS queued -> must be is_buffered = True
    obs_low = ScientificObservation(
        id=7,
        instrument_id="INST-S17-RADAR",
        timestamp=now_utc,
        measurement_value=111.1,
        unit="TECU",
        quality=Quality.GOOD,
        source="LOCAL_EDGE_BUFFER",
        truth_type=TruthType.MEASURED,
        created_at=now_utc,
    )
    db_session.merge(obs_low)

    q_low = SyncQueueItem(
        id="QITEM-SCI-7",
        station_id="STATION-BHARATI",
        event_type="SCIENCE_OBSERVATION_BUFFER",
        payload_json='{"observation_id": 7, "value": 111.1}',
        priority=2,
        status=SyncStatus.PENDING,
        checksum_sha256="canonical_hash_7",
        created_at=now_utc,
        updated_at=now_utc,
    )
    db_session.merge(q_low)

    # Case B: High ID that is NOT queued -> must be is_buffered = False
    obs_high = ScientificObservation(
        id=450,
        instrument_id="INST-S17-RADAR",
        timestamp=now_utc,
        measurement_value=222.2,
        unit="TECU",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
        created_at=now_utc,
    )
    db_session.merge(obs_high)
    db_session.commit()

    detail = get_instrument_detail(db_session, "INST-S17-RADAR")
    assert detail is not None

    obs_low_schema = next((o for o in detail.recent_observations if o.id == 7), None)
    assert obs_low_schema is not None
    assert obs_low_schema.is_buffered is True  # ID 7 (<= 100) is buffered because it is actively queued!

    obs_high_schema = next((o for o in detail.recent_observations if o.id == 450), None)
    assert obs_high_schema is not None
    assert obs_high_schema.is_buffered is False  # ID 450 (> 100) is NOT buffered because it is not queued!


def test_offline_observation_buffered_using_existing_sync_mechanism(client):
    """4. Verify recording an observation while OFFLINE routes it into the priority queue."""
    client.post("/resilience/simulate-offline")

    req = {
        "instrument_id": "INST-S17-RADAR",
        "measurement_value": 144.6,
        "unit": "TECU",
    }
    res = client.post("/science/observations", json=req)
    assert res.status_code == 200
    data = res.json()

    assert data["is_buffered"] is True
    assert data["sync_status"] == "PENDING"
    assert data["source"] == "LOCAL_EDGE_BUFFER"

    # Verify queue contains the item
    res_q = client.get("/resilience/queue")
    assert res_q.status_code == 200
    queue_items = res_q.json()["items"]
    assert any(it["event_type"] == "SCIENCE_OBSERVATION_BUFFER" for it in queue_items)


def test_buffered_observation_retains_truth_type_measured(db_session: Session):
    """5. Verify a buffered observation retains truth_type=MEASURED from the instrument."""
    req = BufferObservationRequest(
        instrument_id="INST-S17-RADAR",
        measurement_value=150.0,
        unit="TECU",
    )
    buffered = buffer_science_observation(db_session, req)
    assert buffered.truth_type == "MEASURED"
    assert buffered.provenance is not None
    assert buffered.provenance.truth_type == TruthType.MEASURED


def test_metadata_completeness_reflects_actual_populated_fields():
    """6. Verify evaluate_observation_metadata_completeness detects COMPLETE, PARTIAL, and MISSING."""
    now_utc = datetime.now(timezone.utc)

    # COMPLETE
    complete_obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=now_utc,
        measurement_value=120.0,
        unit="TECU",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
    )
    assert evaluate_observation_metadata_completeness(complete_obs) == "COMPLETE"

    # PARTIAL (missing unit)
    partial_obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=now_utc,
        measurement_value=120.0,
        unit="",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
    )
    assert evaluate_observation_metadata_completeness(partial_obs) == "PARTIAL"

    # MISSING (no populated fields)
    missing_obs = ScientificObservation(
        instrument_id=None,
        timestamp=None,
        measurement_value=None,
        unit=None,
        quality=None,
        source=None,
        truth_type=None,
    )
    assert evaluate_observation_metadata_completeness(missing_obs) == "MISSING"


def test_complete_observation_reported_complete(client):
    """7. Verify a valid observation submitted via API is reported with metadata_completeness=COMPLETE."""
    req = {
        "instrument_id": "INST-S17-RADAR",
        "measurement_value": 139.5,
        "unit": "TECU",
    }
    res = client.post("/science/observations", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["metadata_completeness"] == "COMPLETE"


def test_incomplete_observation_not_falsely_reported_complete(db_session: Session):
    """8. Verify an observation with missing metadata is reported as PARTIAL, not COMPLETE."""
    now_utc = datetime.now(timezone.utc)
    incomplete_obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=now_utc,
        measurement_value=125.0,
        unit="",  # empty unit
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
        created_at=now_utc,
    )
    db_session.add(incomplete_obs)
    db_session.commit()

    detail = get_instrument_detail(db_session, "INST-S17-RADAR")
    assert detail is not None
    obs_schema = next((o for o in detail.recent_observations if o.id == incomplete_obs.id), None)
    assert obs_schema is not None
    assert obs_schema.metadata_completeness != "COMPLETE"
    assert obs_schema.metadata_completeness == "PARTIAL"


def test_provenance_timestamp_comes_from_observation(db_session: Session):
    """9. Verify observation provenance timestamp reflects the observation's own timestamp."""
    two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
    obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=two_hours_ago,
        measurement_value=131.0,
        unit="TECU",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
    )
    prov = build_observation_provenance(obs)
    assert prov.timestamp == two_hours_ago
    assert prov.freshness_seconds >= 7190.0  # Approx 2 hours in seconds


def test_naive_sqlite_timestamp_handled_safely():
    """10. Verify naive datetimes from SQLite are safely treated as UTC without timezone errors."""
    naive_dt = datetime(2026, 9, 8, 14, 30, 0)  # No tzinfo
    obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=naive_dt,
        measurement_value=130.0,
        unit="TECU",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
    )
    prov = build_observation_provenance(obs)
    assert prov.timestamp.tzinfo is not None
    assert prov.timestamp.tzinfo == timezone.utc


def test_future_timestamp_clamps_freshness_to_zero():
    """11. Verify future observation timestamps clamp freshness_seconds to 0.0."""
    future_dt = datetime.now(timezone.utc) + timedelta(hours=3)
    obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=future_dt,
        measurement_value=130.0,
        unit="TECU",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
    )
    prov = build_observation_provenance(obs)
    assert prov.freshness_seconds == 0.0


def test_missing_timestamp_fallback_behavior():
    """12. Verify missing observation timestamp falls back safely to current time."""
    obs = ScientificObservation(
        instrument_id="INST-S17-RADAR",
        timestamp=None,
        measurement_value=130.0,
        unit="TECU",
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM",
        truth_type=TruthType.MEASURED,
    )
    prov = build_observation_provenance(obs)
    assert prov.timestamp is not None
    assert prov.freshness_seconds == 1.0


def test_degraded_comms_does_not_crash_pipeline(client):
    """13. Verify DEGRADED comms mode operates without error across all science routes."""
    client.post("/resilience/simulate-degraded")

    # Listing
    res_list = client.get("/science/instruments")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 2

    # Observations query
    res_obs = client.get("/science/instruments/INST-S17-RADAR/observations")
    assert res_obs.status_code == 200

    # Ingestion under DEGRADED
    res_record = client.post("/science/observations", json={
        "instrument_id": "INST-S17-RADAR",
        "measurement_value": 143.2,
        "unit": "TECU",
    })
    assert res_record.status_code == 200


def test_offline_comms_preserves_local_buffering(client):
    """14. Verify OFFLINE comms mode routes observations into local buffer with valid queue registration."""
    client.post("/resilience/simulate-offline")

    res = client.post("/science/observations", json={
        "instrument_id": "INST-S08-SEIS",
        "measurement_value": 0.024,
        "unit": "MM_S",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_buffered"] is True
    assert data["sync_status"] == "PENDING"
    assert data["source"] == "LOCAL_EDGE_BUFFER"


def test_existing_synchronization_recovery_intact(client):
    """15. Verify restore-and-sync reconciles queued science observations so they are no longer buffered."""
    client.post("/resilience/simulate-offline")

    # Buffer an observation
    res_buf = client.post("/science/observations/buffer", json={
        "instrument_id": "INST-S17-RADAR",
        "measurement_value": 156.7,
        "unit": "TECU",
    })
    assert res_buf.status_code == 200
    obs_id = res_buf.json()["id"]
    assert res_buf.json()["is_buffered"] is True
    assert res_buf.json()["sync_status"] == "PENDING"

    # Restore and sync all
    res_restore = client.post("/resilience/restore")
    assert res_restore.status_code == 200
    assert res_restore.json()["link_status"] == "ONLINE"

    # Verify observation in instrument detail is now reconciled (is_buffered = False)
    res_detail = client.get("/science/instruments/INST-S17-RADAR/observations")
    assert res_detail.status_code == 200
    synced_obs = next(o for o in res_detail.json()["recent_observations"] if o["id"] == obs_id)
    assert synced_obs["is_buffered"] is False
    assert synced_obs["sync_status"] == "RECONCILED"


def test_existing_science_api_endpoints_backward_compatible(client):
    """16. Verify existing science API contracts and field schemas remain 100% backward-compatible."""
    # 1. GET /science/instruments
    res_inst = client.get("/science/instruments")
    assert res_inst.status_code == 200
    instruments = res_inst.json()
    assert isinstance(instruments, list)
    expected_inst_keys = {
        "id", "station_id", "code", "name", "instrument_type",
        "health", "power_status", "calibration_status", "last_seen_at",
        "metadata_completeness", "buffered_observations_count",
        "recent_observations", "truth_type",
    }
    assert expected_inst_keys.issubset(instruments[0].keys())

    # 2. GET /science/instruments/{id}/observations
    res_detail = client.get("/science/instruments/INST-S17-RADAR/observations")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert expected_inst_keys.issubset(detail.keys())
    if detail["recent_observations"]:
        obs = detail["recent_observations"][0]
        expected_obs_keys = {
            "id", "instrument_id", "timestamp", "measurement_value",
            "unit", "quality", "source", "truth_type", "is_buffered", "sync_status",
        }
        assert expected_obs_keys.issubset(obs.keys())

    # 3. POST /science/observations/buffer
    res_buf = client.post("/science/observations/buffer", json={
        "instrument_id": "INST-S17-RADAR",
        "measurement_value": 138.0,
        "unit": "TECU",
    })
    assert res_buf.status_code == 200
    buf_data = res_buf.json()
    assert "id" in buf_data
    assert "is_buffered" in buf_data
    assert "sync_status" in buf_data
