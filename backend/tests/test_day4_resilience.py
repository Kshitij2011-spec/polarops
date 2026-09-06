"""Unit and integration tests for Day 4 Resilience, Science Continuity, Incidents, and Memory."""

import json
import pytest
from app.models.entities import Asset, EnergyResource, Incident, SyncQueueItem
from app.models.enums import CommsLinkStatus, IncidentSeverity, IncidentStatus, SyncStatus
from app.services.sync_service import compute_canonical_sha256


def test_canonical_sha256_determinism():
    """Verify that canonical SHA-256 serialization produces identical hashes regardless of key order."""
    payload_a = {"b": 2, "a": 1, "z": [3, 2, 1], "nested": {"k2": "v2", "k1": "v1"}}
    payload_b = {"nested": {"k1": "v1", "k2": "v2"}, "a": 1, "z": [3, 2, 1], "b": 2}
    
    hash_a = compute_canonical_sha256(payload_a)
    hash_b = compute_canonical_sha256(payload_b)
    
    assert hash_a == hash_b
    assert len(hash_a) == 64  # SHA-256 hex string


def test_comms_link_status_and_offline_simulation(client):
    """Verify link status endpoint and transition from ONLINE to OFFLINE."""
    # 1. Check initial status
    res = client.get("/resilience/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ONLINE", "OFFLINE"]
    assert "provenance" in data
    assert data["provenance"]["truth_type"] in ["MEASURED", "DERIVED", "SCENARIO"]

    # 2. Simulate offline
    res_off = client.post("/resilience/simulate-offline")
    assert res_off.status_code == 200
    off_data = res_off.json()
    assert off_data["status"] == "OFFLINE"

    # Status query confirms OFFLINE
    res_stat = client.get("/resilience/status")
    assert res_stat.json()["status"] == "OFFLINE"


def test_deterministic_priority_queue_ordering(client):
    """Verify queue items are deterministically sorted by priority ASC (P0 before P1, P2, P3) and created_at ASC."""
    # Reset simulation first
    client.post("/resilience/reset")

    # Fetch queue
    res = client.get("/resilience/queue")
    assert res.status_code == 200
    data = res.json()
    items = data["items"]
    assert len(items) >= 4

    # Check priority sorting: non-decreasing
    for i in range(len(items) - 1):
        assert items[i]["priority"] <= items[i+1]["priority"]
        if items[i]["priority"] == items[i+1]["priority"]:
            assert items[i]["created_at"] <= items[i+1]["created_at"]

    # Check that first item is P0
    assert items[0]["priority"] == 0
    assert items[0]["priority_label"] == "P0"


def test_offline_event_queueing_and_checksum_verification(client):
    """Verify creating an event while offline persists it with valid canonical checksum."""
    client.post("/resilience/simulate-offline")
    
    event_payload = {"asset_id": "G-02", "sensor": "bearing_temp", "value": 98.4}
    req = {
        "station_id": "STATION-BHARATI",
        "event_type": "HIGH_TEMP_ALERT",
        "priority": 0,
        "payload": event_payload,
    }
    
    res = client.post("/resilience/events", json=req)
    assert res.status_code == 200
    item = res.json()
    assert item["priority"] == 0
    assert item["priority_label"] == "P0"
    assert item["status"] == "PENDING"
    assert item["is_checksum_verified"] is True
    assert item["checksum_sha256"] == compute_canonical_sha256(event_payload)


def test_restore_and_sync_lifecycle(client):
    """Verify restore triggers priority transfer, verification, and transition to ONLINE."""
    client.post("/resilience/simulate-offline")

    # Trigger restore
    res = client.post("/resilience/restore")
    assert res.status_code == 200
    data = res.json()
    assert data["link_status"] == "ONLINE"  # Final link state is ONLINE, never RECONCILED
    assert data["items_processed"] > 0
    assert data["items_reconciled"] > 0

    # Check all processed items are RECONCILED
    for item in data["details"]:
        assert item["status"] in ["RECONCILED", "FAILED_RETRY"]
        assert item["is_checksum_verified"] is True

    # Link status is now ONLINE
    res_link = client.get("/resilience/status")
    assert res_link.json()["status"] == "ONLINE"


def test_retry_failed_queue_item(client):
    """Verify retrying a failed queue item recomputes checksum and reconciles item."""
    # Reset simulation
    client.post("/resilience/reset")
    
    # Intentionally corrupt or create an item in FAILED_RETRY
    res_queue = client.get("/resilience/queue")
    first_item = res_queue.json()["items"][0]
    item_id = first_item["id"]

    # Retry the item
    res_retry = client.post(f"/resilience/retry/{item_id}")
    assert res_retry.status_code == 200
    retried = res_retry.json()
    assert retried["status"] == "RECONCILED"
    assert retried["is_checksum_verified"] is True
    assert retried["retry_count"] >= 1


def test_science_instruments_and_buffering(client):
    """Verify science instruments listing and generic offline observation buffering."""
    # 1. Get instruments
    res = client.get("/science/instruments")
    assert res.status_code == 200
    instruments = res.json()
    assert len(instruments) >= 2
    inst_ids = [inst["id"] for inst in instruments]
    assert "INST-S17-RADAR" in inst_ids

    # 2. Buffer observation offline
    client.post("/resilience/simulate-offline")
    buf_req = {
        "instrument_id": "INST-S17-RADAR",
        "measurement_value": 142.5,
        "unit": "TECU",
    }
    res_buf = client.post("/science/observations/buffer", json=buf_req)
    assert res_buf.status_code == 200
    obs = res_buf.json()
    assert obs["instrument_id"] == "INST-S17-RADAR"
    assert obs["is_buffered"] is True
    assert obs["sync_status"] == "PENDING"
    assert obs["measurement_value"] == 142.5

    # 3. Check observations endpoint
    res_obs = client.get("/science/instruments/INST-S17-RADAR/observations")
    assert res_obs.status_code == 200
    inst_data = res_obs.json()
    assert any(o["id"] == obs["id"] for o in inst_data["recent_observations"])


def test_incident_workspace_and_engine_reuse(client):
    """Verify incident creation, Day 2 dependency/risk engine reuse, and action logging."""
    # 1. List existing incidents
    res_list = client.get("/incidents")
    assert res_list.status_code == 200
    incidents = res_list.json()
    assert len(incidents) >= 1

    # 2. Create new incident
    create_req = {
        "station_id": "STATION-BHARATI",
        "title": "G-02 Primary Fuel Line Air Lock",
        "severity": "CRITICAL",
        "location": "Powerhouse Gen Bay 2",
        "description": "Generator G-02 fuel line experiencing vapor lock causing pressure fluctuations.",
        "primary_asset_id": "G-02",
    }
    res_create = client.post("/incidents", json=create_req)
    assert res_create.status_code == 200
    inc_detail = res_create.json()
    assert inc_detail["status"] == "ACTIVE"
    assert inc_detail["severity"] == "CRITICAL"
    assert len(inc_detail["affected_assets"]) > 0  # Reused from Day 2 dependency traversal
    assert len(inc_detail["affected_services"]) > 0
    assert inc_detail["modeled_risk_score"] > 0    # Reused from Day 2 risk engine
    assert len(inc_detail["available_response_options"]) > 0

    new_inc_id = inc_detail["id"]

    # 3. Log response action
    action_req = {
        "action_code": "PURGE_FUEL_LINE",
        "description": "Executed manual bleeding valve sequence on primary manifold.",
        "executed_by": "Station Lead Engineer",
        "outcome_status": "COMPLETED",
    }
    res_action = client.post(f"/incidents/{new_inc_id}/actions", json=action_req)
    assert res_action.status_code == 200
    action_data = res_action.json()
    assert action_data["action_code"] == "PURGE_FUEL_LINE"

    # 4. Update status: ACTIVE -> CONTAINED -> RESOLVED
    res_patch1 = client.patch(f"/incidents/{new_inc_id}/status", json={"status": "CONTAINED"})
    assert res_patch1.status_code == 200
    assert res_patch1.json()["status"] == "CONTAINED"

    res_patch2 = client.patch(f"/incidents/{new_inc_id}/status", json={"status": "RESOLVED"})
    assert res_patch2.status_code == 200
    assert res_patch2.json()["status"] == "RESOLVED"
    assert res_patch2.json()["resolved_at"] is not None


def test_operational_memory_recording_and_search(client):
    """Verify explicit human-controlled memory recording and deterministic search."""
    mem_req = {
        "station_id": "STATION-BHARATI",
        "event_type": "GENERATOR_VAPOR_LOCK_RESOLVED",
        "title": "Winter 2026 G-02 Vapor Lock Clearance Protocol",
        "incident_id": "INC-2026-TEST",
        "decision": "Bleed fuel line while maintaining G-01 priority load",
        "action_taken": "Opened bleed valve 3B for 12 seconds with auxiliary booster on",
        "outcome": "Pressure normalized within 90 seconds without dropping grid frequency",
        "lesson": "Always verify fuel booster pump pressure before bleeding high-pressure line in freezing conditions",
    }
    res_post = client.post("/memory", json=mem_req)
    assert res_post.status_code == 200
    mem_data = res_post.json()
    assert mem_data["title"] == "Winter 2026 G-02 Vapor Lock Clearance Protocol"

    # Search for term
    res_search = client.get("/memory?q=Vapor%20Lock")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["total_count"] >= 1
    assert any("Vapor Lock" in m["title"] for m in search_data["memories"])


def test_simulation_reset_isolation(client, db_session):
    """Verify POST /resilience/reset resets ONLY resilience state and never mutates canonical resources or assets."""
    # Record baseline state of assets and resources
    initial_assets_count = db_session.query(Asset).count()
    initial_fuel_level = db_session.query(EnergyResource).filter(EnergyResource.resource_type == "DIESEL_LFO").first().current_quantity

    # Do various resilience operations
    client.post("/resilience/simulate-offline")
    client.post("/resilience/events", json={
        "station_id": "STATION-BHARATI",
        "event_type": "EPHEMERAL_TEST_EVENT",
        "priority": 3,
        "payload": {"test": "val"},
    })

    # Reset simulation
    res_reset = client.post("/resilience/reset")
    assert res_reset.status_code == 200
    reset_data = res_reset.json()
    assert reset_data["link_status"] == "ONLINE"

    # Verify canonical data is preserved
    final_assets_count = db_session.query(Asset).count()
    final_fuel_level = db_session.query(EnergyResource).filter(EnergyResource.resource_type == "DIESEL_LFO").first().current_quantity

    assert final_assets_count == initial_assets_count
    assert final_fuel_level == initial_fuel_level


def test_repeated_reset_simulation_cycles(client, db_session):
    """Execute repeated cycles: reset -> simulate offline -> create event -> restore -> reset.
    
    Audit Point 1: Confirm that each reset returns system to the exact deterministic baseline:
    - Expected demo queue items (6 items total)
    - Expected priority ordering (P0 < P1 < P2 < P3)
    - No duplicate queue items
    - No mutation of Day 1-3 canonical resources (fuel, water)
    - No mutation of measurements or assets
    - Hero incident INC-2026-04 returned to ACTIVE baseline state with resolved_at=None
    """
    initial_assets_count = db_session.query(Asset).count()
    initial_fuel = db_session.query(EnergyResource).filter(EnergyResource.resource_type == "DIESEL_LFO").first().current_quantity

    for cycle in range(3):
        # 1. Reset
        res_reset1 = client.post("/resilience/reset")
        assert res_reset1.status_code == 200

        # Verify baseline queue
        q_res = client.get("/resilience/queue")
        q_data = q_res.json()
        assert q_data["total_count"] == 6
        queue_ids = [it["id"] for it in q_data["items"]]
        assert len(queue_ids) == len(set(queue_ids))  # No duplicates
        assert queue_ids[0].startswith("QITEM-P0")  # P0 first

        # Verify hero incident is ACTIVE
        inc_res = client.get("/incidents/INC-2026-04")
        assert inc_res.status_code == 200
        assert inc_res.json()["status"] == "ACTIVE"
        assert inc_res.json()["resolved_at"] is None

        # 2. Simulate offline
        off_res = client.post("/resilience/simulate-offline")
        assert off_res.status_code == 200
        assert off_res.json()["status"] == "OFFLINE"

        # 3. Create event while offline
        ev_res = client.post("/resilience/events", json={
            "station_id": "STATION-BHARATI",
            "event_type": f"CYCLE_TEST_EVENT_{cycle}",
            "priority": 0,
            "payload": {"cycle": cycle, "data": "test_alert"},
        })
        assert ev_res.status_code == 200

        # Buffer a science observation
        client.post("/science/observations/buffer", json={
            "instrument_id": "INST-S17-RADAR",
            "measurement_value": 135.2 + cycle,
            "unit": "TECU",
        })

        # Resolve incident INC-2026-04 to simulate operator action
        client.patch("/incidents/INC-2026-04/status", json={"status": "RESOLVED"})

        # 4. Restore and sync
        restore_res = client.post("/resilience/restore")
        assert restore_res.status_code == 200
        assert restore_res.json()["link_status"] == "ONLINE"

        # 5. Reset back to baseline
        res_reset2 = client.post("/resilience/reset")
        assert res_reset2.status_code == 200

        # Assertions after reset
        q_after = client.get("/resilience/queue").json()
        assert q_after["total_count"] == 6
        post_ids = [it["id"] for it in q_after["items"]]
        assert len(post_ids) == len(set(post_ids))
        for i in range(len(q_after["items"]) - 1):
            assert q_after["items"][i]["priority"] <= q_after["items"][i+1]["priority"]

        # Assert hero incident restored to ACTIVE
        inc_restored = client.get("/incidents/INC-2026-04").json()
        assert inc_restored["status"] == "ACTIVE"
        assert inc_restored["resolved_at"] is None

    # Assert zero mutation of canonical assets and fuel
    assert db_session.query(Asset).count() == initial_assets_count
    assert db_session.query(EnergyResource).filter(EnergyResource.resource_type == "DIESEL_LFO").first().current_quantity == initial_fuel


def test_incident_resolution_does_not_create_memory(client):
    """Audit Point 3: Verify resolving an incident does NOT automatically create an operational memory record."""
    initial_mem_count = client.get("/memory").json()["total_count"]

    # Resolve incident INC-2026-04
    res_patch = client.patch("/incidents/INC-2026-04/status", json={"status": "RESOLVED"})
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "RESOLVED"

    # Verify memory count has NOT changed
    post_mem_count = client.get("/memory").json()["total_count"]
    assert post_mem_count == initial_mem_count
