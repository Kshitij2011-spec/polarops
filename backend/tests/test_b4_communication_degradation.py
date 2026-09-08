"""Tests for Task B4: Communication Degradation Model.

Verifies:
1. DEGRADED enum exists on CommsLinkStatus.
2. All existing comms states (ONLINE, OFFLINE, RESTORING, SYNCING) remain intact.
3. CommunicationLink entity can persist and retrieve DEGRADED status.
4. DEGRADED is distinct from OFFLINE (latency, bandwidth, operational headroom, continuity).
5. State transitions: ONLINE -> DEGRADED, DEGRADED -> ONLINE.
6. State transitions: DEGRADED -> OFFLINE.
7. Existing offline-sync behavior remains intact (restore_and_sync_all from DEGRADED).
8. Existing communication API remains backward-compatible (GET /resilience/status).
9. No existing communication/station endpoint crashes when status is DEGRADED.
10. Operational capability calculation treats DEGRADED as operational (online=True, not offline).
11. Provenance quality is SUSPECT and confidence is reduced (0.75) for DEGRADED.
12. VALID_COMMS_TRANSITIONS state graph is consistent.
"""

from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session

from app.models.entities import CommunicationLink
from app.models.enums import CommsLinkStatus, Quality, TruthType
from app.services.sync_service import (
    VALID_COMMS_TRANSITIONS,
    get_comms_status,
    get_or_create_link,
    is_valid_link_transition,
    reset_resilience_simulation,
    restore_and_sync_all,
    simulate_link_degradation,
    simulate_link_failure,
    transition_link_status,
)
from app.services.station_service import get_station_comparison, get_station_overview


@pytest.fixture(autouse=True)
def clean_comms_state(db_session: Session):
    """Ensure link is restored to nominal ONLINE state after each test."""
    yield
    link = db_session.query(CommunicationLink).filter(CommunicationLink.station_id == "STATION-BHARATI").first()
    if link:
        link.status = CommsLinkStatus.ONLINE
        link.latency_ms = 580
        link.bandwidth_kbps = 2048
        link.last_sync_at = datetime.now(timezone.utc)
        db_session.commit()


def test_degraded_enum_exists():
    """1. Verify DEGRADED enum exists on CommsLinkStatus."""
    assert hasattr(CommsLinkStatus, "DEGRADED")
    assert CommsLinkStatus.DEGRADED == "DEGRADED"
    assert CommsLinkStatus.DEGRADED.value == "DEGRADED"


def test_existing_comms_states_preserved():
    """2. Verify all existing communication states remain intact."""
    expected_states = {"ONLINE", "DEGRADED", "OFFLINE", "RESTORING", "SYNCING"}
    actual_states = {s.value for s in CommsLinkStatus}
    assert actual_states == expected_states

    assert CommsLinkStatus.ONLINE == "ONLINE"
    assert CommsLinkStatus.OFFLINE == "OFFLINE"
    assert CommsLinkStatus.RESTORING == "RESTORING"
    assert CommsLinkStatus.SYNCING == "SYNCING"
    assert len(CommsLinkStatus) == 5


def test_persist_and_read_degraded_status(db_session: Session):
    """3. Verify a communication link can persist and read DEGRADED status in SQLite."""
    link = get_or_create_link(db_session, "STATION-BHARATI")
    link.status = CommsLinkStatus.DEGRADED
    link.latency_ms = 1450
    link.bandwidth_kbps = 256
    db_session.commit()

    db_session.expire_all()
    reloaded = db_session.query(CommunicationLink).filter_by(id=link.id).first()
    assert reloaded is not None
    assert reloaded.status == "DEGRADED"
    assert CommsLinkStatus(reloaded.status) == CommsLinkStatus.DEGRADED
    assert reloaded.latency_ms == 1450
    assert reloaded.bandwidth_kbps == 256


def test_degraded_is_distinct_from_offline(client):
    """4. Verify DEGRADED is distinct from OFFLINE across status, latency, and bandwidth."""
    # Simulate degraded link
    res_deg = client.post("/resilience/simulate-degraded?latency_ms=1200&bandwidth_kbps=512")
    assert res_deg.status_code == 200
    deg_data = res_deg.json()

    assert deg_data["status"] == "DEGRADED"
    assert deg_data["latency_ms"] == 1200
    assert deg_data["bandwidth_kbps"] == 512
    assert deg_data["is_local_operation_active"] is True
    assert deg_data["provenance"]["quality"] == "SUSPECT"
    assert deg_data["provenance"]["confidence"] == 0.75
    assert deg_data["provenance"]["truth_type"] == "MEASURED"

    # Simulate offline link
    res_off = client.post("/resilience/simulate-offline")
    assert res_off.status_code == 200
    off_data = res_off.json()

    assert off_data["status"] == "OFFLINE"
    assert off_data["latency_ms"] == 9999
    assert off_data["bandwidth_kbps"] == 0

    # Explicit differentiation
    assert deg_data["status"] != off_data["status"]
    assert deg_data["latency_ms"] != off_data["latency_ms"]
    assert deg_data["bandwidth_kbps"] != off_data["bandwidth_kbps"]


def test_degraded_to_online_transition(db_session: Session):
    """5. Verify transition from DEGRADED to ONLINE restores nominal metrics."""
    # Move to DEGRADED
    res_deg = transition_link_status(db_session, "STATION-BHARATI", CommsLinkStatus.DEGRADED)
    assert res_deg.status == CommsLinkStatus.DEGRADED
    assert res_deg.latency_ms == 1450
    assert res_deg.bandwidth_kbps == 256

    # Verify transition validity
    assert is_valid_link_transition(CommsLinkStatus.DEGRADED, CommsLinkStatus.ONLINE) is True

    # Move to ONLINE
    res_on = transition_link_status(db_session, "STATION-BHARATI", CommsLinkStatus.ONLINE)
    assert res_on.status == CommsLinkStatus.ONLINE
    assert res_on.latency_ms == 580
    assert res_on.bandwidth_kbps == 2048
    assert res_on.provenance.quality == Quality.GOOD
    assert res_on.provenance.confidence == 1.0


def test_degraded_to_offline_transition(db_session: Session):
    """6. Verify transition from DEGRADED to OFFLINE works and applies blackout metrics."""
    # Move to DEGRADED
    transition_link_status(db_session, "STATION-BHARATI", CommsLinkStatus.DEGRADED)

    # Verify transition validity
    assert is_valid_link_transition(CommsLinkStatus.DEGRADED, CommsLinkStatus.OFFLINE) is True

    # Move to OFFLINE
    res_off = transition_link_status(db_session, "STATION-BHARATI", CommsLinkStatus.OFFLINE)
    assert res_off.status == CommsLinkStatus.OFFLINE
    assert res_off.latency_ms == 9999
    assert res_off.bandwidth_kbps == 0


def test_existing_offline_sync_behavior_intact(client):
    """7. Verify restore-and-sync workflow operates seamlessly when recovering from DEGRADED."""
    # Set link to DEGRADED
    client.post("/resilience/simulate-degraded")

    # Queue an event while in degraded mode
    event_payload = {"asset_id": "COMM-DOME", "degradation_level": "MILD_INTERFERENCE"}
    req = {
        "station_id": "STATION-BHARATI",
        "event_type": "DEGRADED_DIAGNOSTIC",
        "priority": 1,
        "payload": event_payload,
    }
    ev_res = client.post("/resilience/events", json=req)
    assert ev_res.status_code == 200

    # Trigger restore and sync
    restore_res = client.post("/resilience/restore")
    assert restore_res.status_code == 200
    res_data = restore_res.json()
    assert res_data["link_status"] == "ONLINE"
    assert res_data["items_processed"] > 0
    assert res_data["items_reconciled"] > 0

    # Verify status is now ONLINE
    stat_res = client.get("/resilience/status")
    assert stat_res.json()["status"] == "ONLINE"


def test_comms_api_backward_compatible(client):
    """8. Verify GET /resilience/status preserves all existing contract fields."""
    res = client.get("/resilience/status")
    assert res.status_code == 200
    data = res.json()

    # Core required contract fields
    expected_fields = {
        "link_id",
        "station_id",
        "name",
        "status",
        "last_sync_at",
        "latency_ms",
        "bandwidth_kbps",
        "pending_queue_count",
        "is_local_operation_active",
        "provenance",
    }
    assert expected_fields.issubset(data.keys())

    # Check provenance fields
    prov = data["provenance"]
    assert {"source", "timestamp", "freshness_seconds", "quality", "truth_type", "confidence"}.issubset(prov.keys())


def test_no_endpoint_crashes_when_degraded(client):
    """9. Verify no communication or station endpoint crashes when link status is DEGRADED."""
    # Set link to DEGRADED
    client.post("/resilience/simulate-degraded")

    # 1. Resilience status
    res_stat = client.get("/resilience/status")
    assert res_stat.status_code == 200
    assert res_stat.json()["status"] == "DEGRADED"

    # 2. Resilience queue
    res_queue = client.get("/resilience/queue")
    assert res_queue.status_code == 200

    # 3. Station overview
    res_overview = client.get("/station/overview?station_id=STATION-BHARATI")
    assert res_overview.status_code == 200

    # 4. Station comparison
    res_cmp = client.get("/station/comparison?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert res_cmp.status_code == 200

    # 5. Explainability communication
    res_exp = client.get("/explain/COMMUNICATION/VSAT_UPLINK?station_id=STATION-BHARATI")
    assert res_exp.status_code == 200
    assert "DEGRADED" in res_exp.json()["subject"]


def test_station_service_evaluates_degraded_correctly(db_session: Session):
    """10. Verify station service handles DEGRADED as operational (not OFFLINE)."""
    simulate_link_degradation(db_session, "STATION-BHARATI", latency_ms=1450, bandwidth_kbps=256)

    cmp_resp = get_station_comparison(db_session, "STATION-BHARATI", "STATION-MAITRI")
    assert cmp_resp is not None
    comms_cap = next(c for c in cmp_resp.station_a.capabilities if c.domain == "COMMS_CONTINUITY")

    assert comms_cap.headroom_score == 68
    assert comms_cap.status == "CONSTRAINED"
    assert "Carrier DEGRADED" in comms_cap.summary
    assert "Carrier OFFLINE" not in comms_cap.summary
    assert comms_cap.metrics["online"] is True
    assert comms_cap.metrics["degraded"] is True
    assert comms_cap.metrics["link_type"] == "DEGRADED_VSAT"
    assert comms_cap.metrics["continuity_mode"] == "DEGRADED_STREAMING"


def test_valid_comms_transitions_map():
    """11. Verify deterministic state transition graph."""
    assert is_valid_link_transition(CommsLinkStatus.ONLINE, CommsLinkStatus.DEGRADED) is True
    assert is_valid_link_transition(CommsLinkStatus.ONLINE, CommsLinkStatus.OFFLINE) is True
    assert is_valid_link_transition(CommsLinkStatus.DEGRADED, CommsLinkStatus.ONLINE) is True
    assert is_valid_link_transition(CommsLinkStatus.DEGRADED, CommsLinkStatus.OFFLINE) is True
    assert is_valid_link_transition(CommsLinkStatus.OFFLINE, CommsLinkStatus.RESTORING) is True
    assert is_valid_link_transition(CommsLinkStatus.RESTORING, CommsLinkStatus.SYNCING) is True
    assert is_valid_link_transition(CommsLinkStatus.SYNCING, CommsLinkStatus.ONLINE) is True

    # Invalid transitions
    assert is_valid_link_transition(CommsLinkStatus.OFFLINE, CommsLinkStatus.DEGRADED) is False
    assert is_valid_link_transition(CommsLinkStatus.DEGRADED, CommsLinkStatus.SYNCING) is False
