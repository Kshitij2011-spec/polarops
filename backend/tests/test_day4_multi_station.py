"""Comprehensive tests for Day 4 Multi-Station Operational Coordination.

Tests cover:
1. Deterministic comparison between Bharati and Maitri.
2. Operational capabilities derived from canonical state across 5 domains.
3. Meaningful resource & fuel differences.
4. Communication constraints and coordination context.
5. Logistics constraints (distance, weather flight ceiling, midwinter traverse).
6. Cross-station scenario coupling (Bharati disruption + Maitri operational headroom).
7. Cross-station explainability (8-part structured causal reasoning).
8. Statelessness: Cross-station simulation does not mutate station state.
9. Event: Explicit cross-station analysis logs CROSS_STATION_ANALYSIS in timeline.
10. Determinism & reproducibility: Same state/input yields identical results.
"""

from datetime import datetime, timezone
import pytest
from app.models import Asset, EnergyResource, EventLog, Incident, Station, WeatherObservation
from app.models.enums import OperationalEventType
from app.schemas.scenario import CrossStationScenarioRequest
from app.services.explainability_service import explain_cross_station, generate_explanation
from app.services.scenario_service import simulate_cross_station_coordination
from app.services.station_service import get_station_comparison


def test_station_comparison_deterministic(client):
    """GET /station/comparison returns structured portfolio comparison between Bharati and Maitri."""
    response = client.get("/station/comparison?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert response.status_code == 200
    data = response.json()

    assert data["station_a"]["code"] == "BHARATI"
    assert data["station_b"]["code"] == "MAITRI"
    assert data["higher_pressure_station_id"] == "STATION-BHARATI"
    assert "pressure_rationale" in data
    assert len(data["differences"]) >= 4
    assert len(data["constraints"]) >= 3
    assert len(data["considerations"]) >= 3
    assert data["provenance"]["truth_type"] == "DERIVED"


def test_operational_capabilities_derived_from_state(client):
    """Both stations have operational capabilities derived across 5 domains (0-100 scores)."""
    response = client.get("/station/comparison?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert response.status_code == 200
    data = response.json()

    domains = ["ENERGY_RESILIENCE", "COMMS_CONTINUITY", "SCIENCE_CONTINUITY", "LIFE_SUPPORT", "RECOVERY_BUFFER"]
    
    # Check station_a (Bharati) capabilities
    caps_a = {c["domain"]: c for c in data["station_a"]["capabilities"]}
    for d in domains:
        assert d in caps_a
        assert 0 <= caps_a[d]["headroom_score"] <= 100
        assert caps_a[d]["status"] in ["NOMINAL", "CONSTRAINED", "CRITICAL"]

    # Bharati has impaired recovery buffer due to SK-402 stockout
    assert caps_a["RECOVERY_BUFFER"]["headroom_score"] <= 30
    assert caps_a["RECOVERY_BUFFER"]["status"] == "CRITICAL"

    # Check station_b (Maitri) capabilities
    caps_b = {c["domain"]: c for c in data["station_b"]["capabilities"]}
    for d in domains:
        assert d in caps_b
        assert 0 <= caps_b[d]["headroom_score"] <= 100

    # Maitri has robust recovery buffer (2 available SK-402 spares)
    assert caps_b["RECOVERY_BUFFER"]["headroom_score"] >= 80
    assert caps_b["RECOVERY_BUFFER"]["status"] == "NOMINAL"


def test_meaningful_resource_differences(client):
    """Resource differences show fuel runway gap and SK-402 spare availability asymmetry."""
    response = client.get("/station/comparison?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert response.status_code == 200
    data = response.json()

    diff_map = {d["dimension"]: d for d in data["differences"]}
    assert "FUEL_RUNWAY" in diff_map
    assert "CRITICAL_SPARES" in diff_map
    assert "STATION_HEALTH" in diff_map

    # Bharati has 0 available SK-402 spares, Maitri has 2
    assert "0" in diff_map["CRITICAL_SPARES"]["station_a_value"]
    assert "2" in diff_map["CRITICAL_SPARES"]["station_b_value"]

    # Maitri has significantly longer fuel runway (>100 days)
    assert data["station_b"]["fuel_runway_days"] > 100.0


def test_communication_and_distance_constraints(client):
    """Explicit coordination constraints expose 3,000 km distance and weather flight restrictions."""
    response = client.get("/station/comparison?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert response.status_code == 200
    data = response.json()

    constraints = {c["constraint_type"]: c for c in data["constraints"]}
    assert "LOGISTICS_DISTANCE" in constraints
    assert constraints["LOGISTICS_DISTANCE"]["status"] == "RESTRICTED"
    assert "3,000 km" in constraints["LOGISTICS_DISTANCE"]["impact"]

    assert "WEATHER_FLIGHT_WINDOW" in constraints
    assert constraints["WEATHER_FLIGHT_WINDOW"]["status"] == "RESTRICTED"


def test_cross_station_scenario_stateless_coupling(client, db_session):
    """POST /scenarios/cross-station evaluates Bharati disruption against Maitri headroom without mutating DB."""
    # Record initial counts to verify statelessness
    init_assets = db_session.query(Asset).count()
    init_stations = db_session.query(Station).count()
    init_resources = db_session.query(EnergyResource).count()

    payload = {
        "disrupted_station_id": "STATION-BHARATI",
        "support_station_id": "STATION-MAITRI",
        "scenario_type": "CROSS_STATION_COORDINATION",
        "target_asset_id": "G-02",
        "duration_hours": 72.0,
    }

    response = client.post("/scenarios/cross-station", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["disrupted_station_id"] == "STATION-BHARATI"
    assert data["support_station_id"] == "STATION-MAITRI"
    assert data["reserve_margin_support_kw"] > 0
    assert len(data["decision_options"]) >= 3
    assert len(data["differences"]) >= 4
    assert data["truth_type"] == "SCENARIO"
    assert "Does NOT execute or simulate physical cargo/fuel transfers" in data["disclaimer"]

    # Verify no database entity was mutated
    assert db_session.query(Asset).count() == init_assets
    assert db_session.query(Station).count() == init_stations
    assert db_session.query(EnergyResource).count() == init_resources

    # G-02 health remains original
    g02 = db_session.query(Asset).filter(Asset.code == "G-02").first()
    assert g02 is not None
    assert g02.health_score == 62


def test_explicit_evaluation_logs_canonical_event(client, db_session):
    """Explicitly evaluating cross-station analysis records CROSS_STATION_ANALYSIS event in timeline."""
    init_events_count = db_session.query(EventLog).filter(
        EventLog.event_type == OperationalEventType.CROSS_STATION_ANALYSIS
    ).count()

    response = client.post("/station/comparison/evaluate?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert response.status_code == 200

    new_events = db_session.query(EventLog).filter(
        EventLog.event_type == OperationalEventType.CROSS_STATION_ANALYSIS
    ).all()
    assert len(new_events) == init_events_count + 1

    latest_ev = new_events[-1]
    assert latest_ev.entity_type == "PORTFOLIO"
    assert "Cross-station" in latest_ev.title


def test_cross_station_explainability_structured(client):
    """GET /explain/CROSS_STATION/PORTFOLIO returns complete 8-part structured evidence reasoning."""
    response = client.get("/explain/CROSS_STATION/PORTFOLIO?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()

    assert data["domain"] == "CROSS_STATION"
    assert data["entity_id"] == "PORTFOLIO"
    assert "Bharati" in data["summary"]
    assert "Maitri" in data["summary"]
    assert len(data["evidence"]) >= 4
    assert len(data["consequences"]) >= 2
    assert len(data["recovery_constraints"]) >= 3
    assert len(data["recommended_next_steps"]) >= 3

    # Check that both Bharati and Maitri evidence factors are present
    factors = [e["factor"] for e in data["evidence"]]
    assert any("BHARATI" in f.upper() for f in factors)
    assert any("MAITRI" in f.upper() for f in factors)


def test_cross_station_determinism_reproducibility(db_session):
    """Repeated calls to get_station_comparison produce bit-for-bit reproducible results."""
    comp1 = get_station_comparison(db_session, "STATION-BHARATI", "STATION-MAITRI")
    comp2 = get_station_comparison(db_session, "STATION-BHARATI", "STATION-MAITRI")

    assert comp1.higher_pressure_station_id == comp2.higher_pressure_station_id
    assert comp1.station_a.overall_health == comp2.station_a.overall_health
    assert comp1.station_b.overall_health == comp2.station_b.overall_health
    assert len(comp1.differences) == len(comp2.differences)
    assert len(comp1.constraints) == len(comp2.constraints)


def test_recovery_chain_and_logistics_intelligence(client):
    """GET /station/comparison exposes structured 4-part recovery chain for G-02 with verified timing disclaimer."""
    response = client.get("/station/comparison?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert response.status_code == 200
    data = response.json()

    assert "recovery_chain" in data
    assert len(data["recovery_chain"]) >= 1

    g02 = next((r for r in data["recovery_chain"] if r["asset_code"] == "G-02"), None)
    assert g02 is not None
    assert g02["recovery_status"] == "CONSTRAINED"
    assert "4.8 mm/s" in g02["technical_condition"]
    assert "SK-402" in g02["material_constraint"]
    assert "0" in g02["local_availability"]
    assert "BLOCKED" in g02["maintenance_constraint"]
    assert "MV Vasiliy Golovnin" in g02["resupply_dependency"]
    assert "N+1" in g02["recovery_exposure"]
    assert g02["timing_confidence"] == "Requires future validation"
    assert "post-delivery mechanical inspection" in g02["timing_disclaimer"]


def test_recovery_explainability_deterministic(client):
    """GET /explain/RECOVERY/G-02 returns deterministic causal explanation for recovery constraints."""
    response = client.get("/explain/RECOVERY/G-02?station_id=STATION-BHARATI")
    assert response.status_code == 200
    data = response.json()

    assert data["domain"] == "RECOVERY"
    assert data["entity_id"] == "G-02"
    assert data["severity"] == "HIGH"
    assert "CONSTRAINED" in data["summary"]
    assert "SK-402" in data["summary"]
    assert len(data["evidence"]) >= 4
    assert len(data["consequences"]) >= 2
    assert len(data["recovery_constraints"]) >= 3
    assert len(data["recommended_next_steps"]) >= 3

    # Check specific recovery evidence metrics
    metric_names = [e["factor"] for e in data["evidence"]]
    assert "TECHNICAL_CONDITION" in metric_names
    assert "MATERIAL_CONSTRAINT" in metric_names
    assert "MAINTENANCE_STATUS" in metric_names
    assert "LOGISTICS_RESUPPLY" in metric_names


def test_headroom_defensible_comms_and_provenance(client):
    """Headroom scores have calculation_basis, comms logic is defensible (no arbitrary 10/100), and constraints are categorized."""
    response = client.get("/station/comparison?station_a_id=STATION-BHARATI&station_b_id=STATION-MAITRI")
    assert response.status_code == 200
    data = response.json()

    # Capabilities have calculation basis
    for cap in data["station_a"]["capabilities"]:
        assert "calculation_basis" in cap
        assert cap["calculation_basis"] is not None
        assert len(cap["calculation_basis"]) > 0

    # Comms headroom audit: Maitri's 512 kbps BGAN is an operational link with autonomous edge buffering, NOT 10/100
    maitri_comms = next((c for c in data["station_b"]["capabilities"] if c["domain"] == "COMMS_CONTINUITY"), None)
    assert maitri_comms is not None
    assert maitri_comms["headroom_score"] >= 80, f"Maitri comms headroom should be defensible, got {maitri_comms['headroom_score']}"

    # Constraints have provenance and validation status
    for c in data["constraints"]:
        assert "provenance_type" in c
        assert "validation_status" in c
        assert c["provenance_type"] in ["DOCUMENTED_GEOGRAPHY", "MODELED_OPERATIONAL_RULE", "MODELED_SYSTEM_PROFILE"]
        assert c["validation_status"] in ["VERIFIED_RESEARCH", "REQUIRES_FUTURE_VALIDATION"]

