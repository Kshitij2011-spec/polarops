"""Unit and API integration tests for Day 3 Cross-Domain Operational Impact & Scenario Coupling."""

import pytest
from app.models.entities import EventLog
from app.models.enums import OperationalEventType


def test_scenario_reserve_margin_and_energy_coupling(client):
    """POST /scenarios/simulate calculates generation reserve margin and cold-snap thermal demand."""
    payload = {
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
        "ambient_temp_celsius": -28.5,
    }
    res = client.post("/scenarios/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Generation capacity drops from 600 kW to 300 kW
    assert data["available_capacity_kw"] == 300.0
    assert data["thermal_demand_kw"] > 0.0
    assert data["projected_load_kw"] > 180.0

    # Reserve margin = 300 kW - projected_load_kw
    expected_margin = round(300.0 - data["projected_load_kw"], 1)
    assert data["reserve_margin_kw"] == expected_margin
    assert data["reserve_margin_percent"] > 0.0

    # Reserve margin delta appears in deltas list
    deltas = {d["name"]: d for d in data["deltas"]}
    assert "Generation Reserve Margin" in deltas
    assert deltas["Generation Reserve Margin"]["scenario_value"] == expected_margin
    assert deltas["Generation Reserve Margin"]["delta"] < 0.0


def test_scenario_cold_snap_sensitivity(client):
    """Severe cold-snap (-45°C) increases thermal demand and reduces reserve margin compared to -28.5°C."""
    # Baseline temp scenario
    res_normal = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
        "ambient_temp_celsius": -28.5,
    }).json()

    # Severe cold snap scenario
    res_cold = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
        "ambient_temp_celsius": -45.0,
    }).json()

    # Higher thermal demand and electrical load at -45°C
    assert res_cold["thermal_demand_kw"] > res_normal["thermal_demand_kw"]
    assert res_cold["projected_load_kw"] > res_normal["projected_load_kw"]

    # Compressed reserve margin at -45°C
    assert res_cold["reserve_margin_kw"] < res_normal["reserve_margin_kw"]
    assert res_cold["reserve_margin_percent"] < res_normal["reserve_margin_percent"]


def test_scenario_recovery_constraints_coupling(client):
    """Scenario simulation includes canonical spare stockout and resupply vessel constraints."""
    res = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
    })
    assert res.status_code == 200
    data = res.json()

    # Recovery constraints list must contain SK-402 stockout
    constraints = data["recovery_constraints"]
    assert len(constraints) >= 1

    stockout = next((c for c in constraints if c["constraint_type"] == "INVENTORY_STOCKOUT"), None)
    assert stockout is not None
    assert stockout["resource_id"] == "SK-402"
    assert stockout["impact_level"] == "BLOCKING"
    assert "0 units" in stockout["description"]


def test_scenario_evaluated_event_recorded_in_stream(client, db_session):
    """Running a scenario simulation logs a SCENARIO_EVALUATED operational event in EventLog."""
    initial_event_count = db_session.query(EventLog).filter(
        EventLog.event_type == OperationalEventType.SCENARIO_EVALUATED
    ).count()

    res = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 48.0,
        "ambient_temp_celsius": -30.0,
    })
    assert res.status_code == 200
    scenario_id = res.json()["scenario_id"]

    # Event count increased by 1
    new_event_count = db_session.query(EventLog).filter(
        EventLog.event_type == OperationalEventType.SCENARIO_EVALUATED
    ).count()
    assert new_event_count == initial_event_count + 1

    # Verify event fields
    event = db_session.query(EventLog).filter(
        EventLog.entity_id == scenario_id,
        EventLog.event_type == OperationalEventType.SCENARIO_EVALUATED,
    ).first()
    assert event is not None
    assert "G-02" in event.title
    assert event.truth_type == "SCENARIO"
    assert "reserve margin" in event.summary.lower()


def test_scenario_explainability_endpoint(client):
    """GET /explain/scenarios/{id} and POST /explain with domain SCENARIOS return structured reasoning."""
    # 1. Simulate scenario to obtain ID
    sim_res = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
    }).json()
    scenario_id = sim_res["scenario_id"]

    # 2. Query explanation endpoint
    exp_res = client.get(f"/explain/scenarios/{scenario_id}?station_id=STATION-BHARATI")
    assert exp_res.status_code == 200
    exp = exp_res.json()

    assert exp["domain"] == "SCENARIOS"
    assert exp["truth_type"] == "SCENARIO"
    assert "Outage Impact" in exp["subject"]
    assert exp["severity"] == "CRITICAL"

    # Evidence factors include generation capacity and reserve margin
    evidence_factors = [e["factor"] for e in exp["evidence"]]
    assert "Available Generation Capacity" in evidence_factors
    assert "Generation Reserve Margin" in evidence_factors

    # Recovery constraints include SK-402
    assert any("SK-402" in c["description"] for c in exp["recovery_constraints"])

    # Decision options / next steps
    assert len(exp["recommended_next_steps"]) >= 2
