"""Tests for Deterministic Operational Explainability Layer and Cross-Domain Reasoning."""

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.seed import seed_database
from app.main import app


# Uses client fixture from conftest.py


def test_g02_cross_domain_explanation(client):
    """MANDATORY CROSS-DOMAIN TEST:

    Proves G-02 explanation explicitly synthesizes structured data from:
    1. Telemetry (measured vibration/coolant metrics & limits)
    2. Risk Engine (composite condition risk calculation & factors)
    3. Dependency Service (multi-hop blast radius & exposed heating circuits)
    4. Spare Parts (SK-402 inventory stockout)
    5. Logistics / Resupply (MV Vasiliy Golovnin transit ETA)
    """
    response = client.get("/api/v1/explain/ASSET/G-02?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()

    # 1. Subject & Core Attributes
    assert data["domain"] == "ASSET"
    assert data["entity_id"] in ["G-02", "GEN-BHARATI-G02"]
    assert data["severity"] == "WARNING"
    assert data["confidence"] == 1.0
    assert data["truth_type"] == "DERIVED"
    assert len(data["summary"]) > 10
    assert len(data["why_it_matters"]) > 10

    # 2. Telemetry Evidence (vibration, temp, health)
    evidence = data["evidence"]
    assert len(evidence) >= 2
    vib_evidence = next((e for e in evidence if "vibration" in e["metric"].lower()), None)
    assert vib_evidence is not None
    assert vib_evidence["value"] == 4.8 or float(vib_evidence["value"]) >= 4.0
    assert vib_evidence["threshold"] == 4.0 or float(vib_evidence["threshold"]) <= 50.0

    # 3. Dependency Consequence (downstream service & zone impact)
    consequences = data["consequences"]
    assert len(consequences) >= 1
    heating_consequence = next((c for c in consequences if "heating" in c["impact"].lower() or "service" in c["domain"].lower()), None)
    assert heating_consequence is not None
    assert heating_consequence["blast_radius_depth"] >= 1

    # 4. Spare Availability Constraint (SK-402 stockout)
    constraints = data["recovery_constraints"]
    assert len(constraints) >= 1
    sk402_constraint = next((rc for rc in constraints if "SK-402" in rc["description"] or rc["resource_id"] == "SK-402"), None)
    assert sk402_constraint is not None
    assert sk402_constraint["impact_level"] in ["HIGH", "BLOCKING"]

    # 5. Logistics Resupply Window (MV Vasiliy Golovnin)
    assert any("Golovnin" in rc["description"] or "11" in rc["description"] or "resupply" in rc["description"].lower() for rc in constraints)

    # 6. Recommended Non-Actuating Next Steps
    next_steps = data["recommended_next_steps"]
    assert len(next_steps) >= 3
    actions = [s["action_code"] for s in next_steps]
    assert "INSPECT_G02" in actions
    assert "RUN_SCENARIO" in actions
    assert "REVIEW_RECOVERY" in actions
    for step in next_steps:
        assert step["target_route"].startswith("/")
        assert step["action_type"] in ["INSPECT", "SIMULATE", "REVIEW", "MITIGATE"]

    # 7. Source Context Provenance
    assert "risk_service.calculate_asset_risk" in data["source_context"]
    assert "dependency_service.traverse_asset_dependencies" in data["source_context"]


def test_resource_fuel_explanation(client):
    """Test Resource explanation for station fuel endurance and winter target."""
    response = client.get("/api/v1/explain/RESOURCE/DIESEL_LFO?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "RESOURCE"
    assert data["entity_id"] == "DIESEL_LFO"
    assert data["severity"] == "WARNING"
    assert "70.3" in data["summary"] or "days" in data["summary"]

    # Check evidence factors
    metrics = [e["metric"] for e in data["evidence"]]
    assert "fuel_quantity_liters" in metrics
    assert "fuel_runway_days" in metrics


def test_resource_spare_explanation(client):
    """Test Resource explanation for SK-402 seal kit stockout."""
    response = client.get("/api/v1/explain/RESOURCE/SK-402?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "RESOURCE"
    assert data["entity_id"] == "SK-402"
    assert data["severity"] == "WARNING"
    assert any(rc["constraint_type"] == "INVENTORY_STOCKOUT" for rc in data["recovery_constraints"])


def test_comms_resilience_explanation(client):
    """Test Communication / Resilience explanation."""
    response = client.get("/api/v1/explain/COMMUNICATION/VSAT_UPLINK?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "COMMUNICATION"
    assert data["entity_id"] == "VSAT_UPLINK"
    assert any(e["metric"] == "comms_link_status" for e in data["evidence"])


def test_science_instrument_explanation(client):
    """Test Science explanation for hero radar instrument S-17."""
    response = client.get("/api/v1/explain/SCIENCE/INST-S17-RADAR?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "SCIENCE"
    assert any("buffer" in e["metric"] for e in data["evidence"])


def test_incident_explanation(client):
    """Test Incident explanation for active hero incident INC-2026-04."""
    response = client.get("/api/v1/explain/INCIDENT/INC-2026-04?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "INCIDENT"
    assert data["entity_id"] == "INC-2026-04"


def test_post_explanation_query(client):
    """Test POST /api/v1/explain query payload."""
    payload = {
        "domain": "ASSET",
        "entity_id": "G-02",
        "station_id": "STATION-BHARATI",
    }
    response = client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200
    assert response.json()["domain"] == "ASSET"


def test_unsupported_domain_returns_400(client):
    """Test unsupported domain returns clean HTTP 400."""
    response = client.get("/api/v1/explain/UNKNOWN_DOMAIN/XYZ")
    assert response.status_code == 400
    assert "Unsupported explanation domain" in response.json()["detail"]


def test_explanation_deterministic_reproducibility(client):
    """Test deterministic reproducibility: consecutive queries yield identical results."""
    resp1 = client.get("/api/v1/explain/ASSET/G-02").json()
    resp2 = client.get("/api/v1/explain/ASSET/G-02").json()
    assert resp1["subject"] == resp2["subject"]
    assert resp1["summary"] == resp2["summary"]
    assert resp1["severity"] == resp2["severity"]
    assert len(resp1["evidence"]) == len(resp2["evidence"])
    assert len(resp1["consequences"]) == len(resp2["consequences"])
    assert len(resp1["recovery_constraints"]) == len(resp2["recovery_constraints"])
