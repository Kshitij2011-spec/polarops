"""Tests for Canonical Operational Event Stream, API, and Deterministic Simulator."""

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.seed import seed_database
from app.main import app
from app.models.entities import EventLog
from app.services.event_service import (
    get_operational_events,
    record_operational_event,
    reset_operational_events,
    simulate_demo_event,
)


# Uses client fixture from conftest.py


def test_get_operational_events_endpoint(client):
    """Test GET /api/v1/events returns seeded events with deterministic ordering."""
    client.post("/api/v1/events/reset?station_id=STATION-BHARATI")
    response = client.get("/api/v1/events?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()
    assert data["station_id"] == "STATION-BHARATI"
    assert data["total_count"] >= 8
    events = data["events"]
    assert len(events) >= 8

    # Verify deterministic chronological ordering (newest first)
    for i in range(len(events) - 1):
        assert events[i]["timestamp"] >= events[i + 1]["timestamp"]

    # Verify G-02 threshold breach event exists
    g02_event = next((e for e in events if e["entity_id"] == "G-02"), None)
    assert g02_event is not None
    assert g02_event["severity"] == "WARNING"
    assert g02_event["truth_type"] in ["MEASURED", "DERIVED"]


def test_events_severity_filter(client):
    """Test severity filtering on GET /events."""
    response = client.get("/api/v1/events?station_id=STATION-BHARATI&severity=WARNING")
    assert response.status_code == 200
    data = response.json()
    for ev in data["events"]:
        assert ev["severity"] == "WARNING"


def test_events_event_type_filter(client):
    """Test event_type filtering on GET /events."""
    response = client.get("/api/v1/events?station_id=STATION-BHARATI&event_type=THRESHOLD_BREACH")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 1
    for ev in data["events"]:
        assert ev["event_type"] == "THRESHOLD_BREACH"


def test_simulate_demo_event(client):
    """Test POST /api/v1/events/simulate advances deterministic demo sequence."""
    response = client.post("/api/v1/events/simulate", json={"station_id": "STATION-BHARATI", "event_step": 0})
    assert response.status_code == 200
    event = response.json()
    assert event["event_type"] == "TELEMETRY_CHANGE"
    assert event["entity_id"] == "G-02"
    assert event["source"] == "SYNTHETIC_SIMULATION"
    assert event["truth_type"] == "MEASURED"
    assert "metadata" in event
    assert event["metadata"]["value"] == 4.8


def test_reset_events_restores_baseline(client):
    """Test POST /api/v1/events/reset restores canonical seeded baseline."""
    # Reset
    response = client.post("/api/v1/events/reset?station_id=STATION-BHARATI")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "RESET_TO_CANONICAL_BASELINE"
    assert res["events_count"] == 8

    # Query events to verify baseline
    q_resp = client.get("/api/v1/events?station_id=STATION-BHARATI")
    assert q_resp.status_code == 200
    events = q_resp.json()["events"]
    assert len(events) == 8
