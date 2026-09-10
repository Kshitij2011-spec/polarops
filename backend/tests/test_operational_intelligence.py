"""Tests for PolarOps Operational Intelligence consolidation and causal reasoning."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Asset, AssetStatus, Station, WeatherObservation
from app.services.intelligence_service import get_station_operational_intelligence


def test_operational_intelligence_bharati_critical_path(client: TestClient, db_session: Session):
    """Test Bharati station returns full 7-stage causal narrative focused on G-02 degradation."""
    response = client.get("/intelligence/narrative?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()

    # Station context
    assert data["station_id"] == "STATION-BHARATI"
    assert "Bharati" in data["station_name"]
    assert data["primary_condition_id"] == "G-02"
    assert data["severity"] == "CRITICAL"
    assert "SINGLE FAULT VULNERABLE" in data["status_label"]

    # 7-stage causal chain
    stages = data["causal_chain"]
    assert len(stages) == 7
    stage_names = [s["stage"] for s in stages]
    assert stage_names == [
        "CHANGE",
        "CONTEXT",
        "DEPENDENCY",
        "RISK",
        "CONSEQUENCE",
        "SCENARIO",
        "ACTION",
    ]

    # Stage 1: CHANGE (G-02 telemetry)
    change_stage = stages[0]
    assert change_stage["stage"] == "CHANGE"
    assert "G-02" in change_stage["title"]
    assert change_stage["truth_type"] == "MEASURED"
    assert change_stage["severity"] == "CRITICAL"
    assert change_stage["supporting_metrics"]["vibration_mm_s"] == 4.8
    assert change_stage["target_route"] == "/assets/G-02"

    # Stage 2: CONTEXT (Antarctic weather & fuel)
    context_stage = stages[1]
    assert context_stage["stage"] == "CONTEXT"
    assert context_stage["truth_type"] == "MEASURED"
    assert "blizzard" in context_stage["headline"].lower() or "cold" in context_stage["headline"].lower()
    assert "wind_speed_knots" in context_stage["supporting_metrics"] or "wind_speed_kt" in context_stage["supporting_metrics"]

    # Stage 3: DEPENDENCY (BFS downstream blast radius)
    dep_stage = stages[2]
    assert dep_stage["stage"] == "DEPENDENCY"
    assert dep_stage["truth_type"] == "DERIVED"
    assert dep_stage["supporting_metrics"]["dependent_services_count"] >= 1
    assert "Life Support Zone 2" in dep_stage["description"]

    # Stage 4: RISK (Composite 91/100 risk score)
    risk_stage = stages[3]
    assert risk_stage["stage"] == "RISK"
    assert risk_stage["truth_type"] == "DERIVED"
    assert risk_stage["severity"] == "CRITICAL"
    assert risk_stage["supporting_metrics"]["composite_risk_score"] >= 80

    # Stage 5: CONSEQUENCE (Outage blast radius & generation headroom)
    conseq_stage = stages[4]
    assert conseq_stage["stage"] == "CONSEQUENCE"
    assert conseq_stage["truth_type"] == "DERIVED"
    assert "spare_part_blocked" in conseq_stage["supporting_metrics"]
    assert conseq_stage["supporting_metrics"]["spare_part_blocked"] is True

    # Stage 6: SCENARIO (48h/72h outage simulation)
    scen_stage = stages[5]
    assert scen_stage["stage"] == "SCENARIO"
    assert scen_stage["truth_type"] == "SCENARIO"
    assert "reserve_margin_kw" in scen_stage["supporting_metrics"]

    # Stage 7: ACTION (Operator decision guidance)
    action_stage = stages[6]
    assert action_stage["stage"] == "ACTION"
    assert action_stage["truth_type"] == "DERIVED"

    # Decisions list
    decisions = data["decisions"]
    assert len(decisions) >= 3
    routes = [d["target_route"] for d in decisions]
    assert "/assets/G-02" in routes
    assert "/scenarios" in routes

    # Provenance
    provenance = data["provenance"]
    assert provenance["quality"] in ["VERIFIED", "SYNTHETIC_BENCHMARK", "GOOD", "OPERATIONAL"]
    assert provenance["truth_type"] in ["DERIVED", "MEASURED", "SCENARIO"]
    assert provenance["confidence"] > 0.8


def test_operational_intelligence_maitri_nominal_path(client: TestClient):
    """Test Maitri station returns nominal operational readiness and does NOT force G-02."""
    response = client.get("/intelligence/narrative?station_id=STATION-MAITRI")
    assert response.status_code == 200
    data = response.json()

    assert data["station_id"] == "STATION-MAITRI"
    assert "Maitri" in data["station_name"]
    # Ensure prioritization is NOT hardcoded to G-02
    assert data["primary_condition_id"] != "G-02"
    assert data["severity"] == "NOMINAL"
    assert "NOMINAL" in data["status_label"]

    stages = data["causal_chain"]
    assert len(stages) == 7
    # Verify stages reflect nominal status
    change_stage = stages[0]
    assert change_stage["severity"] == "NOMINAL"
    assert "G-02" not in change_stage["title"]

    # Maitri fuel runway should be high (~133 days)
    context_stage = stages[1]
    assert context_stage["supporting_metrics"]["fuel_runway_days"] > 100

    # Decisions should include inter-station coordination or advisory support
    decisions = data["decisions"]
    assert len(decisions) >= 2


def test_operational_intelligence_endpoint_aliases(client: TestClient):
    """Test that all specified endpoint aliases return valid intelligence responses."""
    # /intelligence
    r1 = client.get("/intelligence?station_id=STATION-BHARATI")
    assert r1.status_code == 200
    assert r1.json()["station_id"] == "STATION-BHARATI"

    # /intelligence/narrative
    r2 = client.get("/intelligence/narrative?station_id=STATION-BHARATI")
    assert r2.status_code == 200

    # /operational-intelligence
    r3 = client.get("/operational-intelligence?station_id=STATION-BHARATI")
    assert r3.status_code == 200
    assert r3.json()["station_id"] == "STATION-BHARATI"

    # Station by short code
    r4 = client.get("/intelligence/narrative?station_id=BHARATI")
    assert r4.status_code == 200
    assert r4.json()["station_id"] == "STATION-BHARATI"


def test_operational_intelligence_missing_station_404(client: TestClient):
    """Test invalid station ID gracefully returns 404."""
    response = client.get("/intelligence/narrative?station_id=NONEXISTENT_STATION")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_operational_intelligence_graceful_missing_weather_or_incident(db_session: Session):
    """Test service handles missing optional records gracefully without crashing."""
    # Temporarily remove weather records for Bharati to test fallback
    db_session.query(WeatherObservation).filter(WeatherObservation.station_id == "STATION-BHARATI").delete()
    db_session.commit()

    insight = get_station_operational_intelligence(db_session, station_id="STATION-BHARATI")
    assert insight is not None
    assert insight.station_id == "STATION-BHARATI"
    assert len(insight.causal_chain) == 7
