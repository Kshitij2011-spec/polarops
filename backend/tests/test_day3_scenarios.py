"""Unit and API integration tests for Day 3 Resources, Energy, and What-If Scenario Engine."""

import pytest
from app.models import Asset, EnergyResource, MaintenanceStatus, MaintenanceWorkOrder


def test_fuel_and_energy_calculations(client):
    """GET /resources/fuel and /resources/energy return deterministic calculations."""
    # 1. Fuel Endpoint
    fuel_res = client.get("/resources/fuel?station_id=STATION-BHARATI")
    assert fuel_res.status_code == 200
    fuel_data = fuel_res.json()

    assert fuel_data["station_id"] == "STATION-BHARATI"
    assert fuel_data["current_stock_liters"] == 142500.0
    assert fuel_data["max_capacity_liters"] == 250000.0
    assert fuel_data["burn_rate_liters_per_hour"] == 84.5
    assert fuel_data["projected_runway_days"] > 65.0
    assert fuel_data["provenance"]["truth_type"] == "DERIVED"

    # 2. Energy Balance (Baseline)
    energy_res = client.get("/resources/energy?station_id=STATION-BHARATI")
    assert energy_res.status_code == 200
    energy_data = energy_res.json()

    assert energy_data["total_generation_capacity_kw"] >= 600.0
    assert energy_data["available_generation_capacity_kw"] >= 600.0
    assert energy_data["online_generators_count"] == 2
    assert energy_data["outside_temp_celsius"] == -28.5
    assert energy_data["thermal_demand_kw"] > 0.0
    baseline_load = energy_data["projected_electrical_load_kw"]

    # 3. Cold Snap Adjustment (-38°C) increases thermal demand and modeled electrical load
    cold_res = client.get("/resources/energy?station_id=STATION-BHARATI&ambient_temp_override=-38.0")
    assert cold_res.status_code == 200
    cold_data = cold_res.json()

    assert cold_data["outside_temp_celsius"] == -38.0
    assert cold_data["thermal_demand_kw"] > energy_data["thermal_demand_kw"]
    assert cold_data["projected_electrical_load_kw"] > baseline_load
    assert "SEVERE COLD SNAP" in cold_data["weather_context"]


def test_inventory_and_recovery_exposure_g02(client):
    """Warehouse inventory shows SK-402 shortage and G-02 exposes HIGH recovery exposure."""
    # 1. Inventory Items
    inv_res = client.get("/resources/inventory?station_id=STATION-BHARATI")
    assert inv_res.status_code == 200
    inv_data = inv_res.json()

    sk402 = next((item for item in inv_data if item["part_number"] == "SK-402"), None)
    assert sk402 is not None
    assert sk402["quantity_available"] == 0
    assert sk402["status"] == "CRITICAL_SHORTAGE"

    # 2. Resupply Opportunities
    res_res = client.get("/resources/resupply?station_id=STATION-BHARATI")
    assert res_res.status_code == 200
    res_data = res_res.json()

    vessel = next((item for item in res_data if "Vasiliy" in item["vessel_name"]), None)
    assert vessel is not None
    assert vessel["quantity"] == 2
    assert vessel["spare_part_number"] == "SK-402"

    # 3. Recovery Exposure for G-02
    rec_res = client.get("/resources/recovery/G-02")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()

    assert rec_data["asset_id"] == "G-02"
    assert rec_data["active_work_order_id"] == "MWO-2026-089"
    assert rec_data["required_spare_part_number"] == "SK-402"
    assert rec_data["quantity_available"] == 0
    assert rec_data["exposure_level"] == "HIGH"
    assert "MV Vasiliy Golovnin" in rec_data["reasoning"]


def test_scenario_g02_failure_simulation(client):
    """POST /scenarios/simulate calculates generation reduction, affected services, and risk delta."""
    payload = {
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
    }
    response = client.post("/scenarios/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["target_asset_id"] == "G-02"
    assert data["duration_hours"] == 72.0
    assert data["truth_type"] == "SCENARIO"

    # Check deltas
    deltas = {d["name"]: d for d in data["deltas"]}
    assert "Available Generation Capacity" in deltas
    assert deltas["Available Generation Capacity"]["delta"] == -300.0
    assert deltas["Available Generation Capacity"]["scenario_value"] == 300.0

    # Check affected services
    srv_names = [s["name"] for s in data["affected_services"]]
    assert any("Habitat Zone 2 Heating" in s for s in srv_names)
    assert all(s["scenario_status"] == "DEGRADED" for s in data["affected_services"])

    # Check risk change
    assert data["scenario_risk_score"] >= data["baseline_risk_score"]

    # Check decision-support options
    assert len(data["decision_options"]) >= 3
    assert all("decision-support option" in opt["disclaimer"].lower() for opt in data["decision_options"])


def test_scenario_duration_delta(client):
    """Simulations with different durations produce deterministic duration-dependent projections."""
    res_24h = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 24.0,
    })
    assert res_24h.status_code == 200
    data_24h = res_24h.json()

    res_72h = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
    })
    assert res_72h.status_code == 200
    data_72h = res_72h.json()

    # Duration scaling changes risk score or duration field deterministically
    assert data_24h["duration_hours"] == 24.0
    assert data_72h["duration_hours"] == 72.0
    assert data_72h["scenario_risk_score"] >= data_24h["scenario_risk_score"]


def test_scenario_stateless_no_db_mutation(client, db_session):
    """Scenario execution MUST NOT mutate any database entity or baseline operational value."""
    # 1. Record baseline database values
    fuel_before = db_session.query(EnergyResource).filter(EnergyResource.station_id == "STATION-BHARATI").first().current_quantity
    g02_status_before = db_session.query(Asset).filter(Asset.code == "G-02").first().status
    wo_before = db_session.query(MaintenanceWorkOrder).filter(MaintenanceWorkOrder.id == "MWO-2026-089").first().status

    # 2. Run simulation
    sim_res = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
        "ambient_temp_celsius": -40.0,
    })
    assert sim_res.status_code == 200

    # 3. Query database again and assert exact match
    fuel_after = db_session.query(EnergyResource).filter(EnergyResource.station_id == "STATION-BHARATI").first().current_quantity
    g02_status_after = db_session.query(Asset).filter(Asset.code == "G-02").first().status
    wo_after = db_session.query(MaintenanceWorkOrder).filter(MaintenanceWorkOrder.id == "MWO-2026-089").first().status

    assert fuel_before == fuel_after
    assert g02_status_before == g02_status_after
    assert wo_before == wo_after


def test_scenario_determinism(client):
    """Running the identical scenario twice yields identical deterministic values."""
    payload = {
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 48.0,
        "ambient_temp_celsius": -32.0,
    }
    res1 = client.post("/scenarios/simulate", json=payload).json()
    res2 = client.post("/scenarios/simulate", json=payload).json()

    assert res1["baseline_risk_score"] == res2["baseline_risk_score"]
    assert res1["scenario_risk_score"] == res2["scenario_risk_score"]
    assert res1["risk_delta"] == res2["risk_delta"]
    assert [d["delta"] for d in res1["deltas"]] == [d["delta"] for d in res2["deltas"]]
    assert len(res1["decision_options"]) == len(res2["decision_options"])


def test_scenario_validation_errors(client):
    """Invalid scenario inputs return proper HTTP 400 / 404 / 422 responses."""
    # Zero or negative duration
    res_zero = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": 0.0,
    })
    assert res_zero.status_code == 422

    res_neg = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "G-02",
        "duration_hours": -10.0,
    })
    assert res_neg.status_code == 422

    # Unsupported scenario type
    res_type = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "UNSUPPORTED_TYPE",
        "target_asset_id": "G-02",
        "duration_hours": 24.0,
    })
    assert res_type.status_code == 400

    # Non-existent asset
    res_asset = client.post("/scenarios/simulate", json={
        "station_id": "STATION-BHARATI",
        "scenario_type": "GENERATOR_FAILURE",
        "target_asset_id": "NON_EXISTENT_ASSET",
        "duration_hours": 24.0,
    })
    assert res_asset.status_code == 404
