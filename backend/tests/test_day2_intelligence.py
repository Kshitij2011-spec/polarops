"""Comprehensive unit & integration tests for Day 2 Asset Intelligence, Multi-Hop BFS, and Explainable Risk."""

from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session

from app.models import Asset, AssetCategory, AssetDependency, Criticality, DependencyType
from app.services.dependency_service import traverse_asset_dependencies
from app.services.risk_service import calculate_asset_risk
from app.services.telemetry_service import get_asset_telemetry_history


def test_multihop_dependency_traversal_g02(client):
    """Verify multi-hop BFS dependency traversal returns downstream paths, nodes, and depth."""
    response = client.get("/assets/G-02/dependencies?max_depth=5")
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "G-02"
    assert data["max_depth"] >= 2
    assert data["total_downstream_assets"] >= 2  # HVAC-02 and PDU-SCI
    assert data["total_affected_services"] >= 1  # Habitat Zone 2 Heating

    # Verify nodes & edges are populated
    node_ids = [n["id"] for n in data["nodes"]]
    assert "G-02" in node_ids
    assert "HVAC-02" in node_ids
    assert "PDU-SCI" in node_ids

    # Verify paths include multi-hop traversal
    paths = data["paths"]
    assert len(paths) >= 2
    # At least one path should trace G-02 -> HVAC-02
    assert any("G-02 → HVAC-02" in p for p in paths)


def test_dependency_traversal_cycle_safety(db_session: Session):
    """Verify BFS traversal terminates safely and without infinite loops when cycles exist."""
    # Create cycle: CYC-A -> CYC-B -> CYC-C -> CYC-A
    now = datetime.now(timezone.utc)
    a1 = Asset(id="CYC-A", station_id="STATION-BHARATI", code="CYC-A", name="Asset A", category=AssetCategory.PUMP, criticality=Criticality.DEFERRABLE, created_at=now, updated_at=now)
    a2 = Asset(id="CYC-B", station_id="STATION-BHARATI", code="CYC-B", name="Asset B", category=AssetCategory.PUMP, criticality=Criticality.DEFERRABLE, created_at=now, updated_at=now)
    a3 = Asset(id="CYC-C", station_id="STATION-BHARATI", code="CYC-C", name="Asset C", category=AssetCategory.PUMP, criticality=Criticality.DEFERRABLE, created_at=now, updated_at=now)
    db_session.add_all([a1, a2, a3])
    db_session.flush()

    dep1 = AssetDependency(source_asset_id="CYC-A", target_asset_id="CYC-B", dependency_type=DependencyType.ELECTRICAL, created_at=now)
    dep2 = AssetDependency(source_asset_id="CYC-B", target_asset_id="CYC-C", dependency_type=DependencyType.ELECTRICAL, created_at=now)
    dep3 = AssetDependency(source_asset_id="CYC-C", target_asset_id="CYC-A", dependency_type=DependencyType.ELECTRICAL, created_at=now)
    db_session.add_all([dep1, dep2, dep3])
    db_session.flush()

    # Traversal should complete without error
    result = traverse_asset_dependencies(db_session, "CYC-A", max_depth=10)
    assert result is not None
    assert len(result.nodes) == 3
    node_ids = {n.id for n in result.nodes}
    assert node_ids == {"CYC-A", "CYC-B", "CYC-C"}


def test_telemetry_history_api(client):
    """GET /assets/G-02/telemetry returns chronological sensor series and trend calculations."""
    response = client.get("/assets/G-02/telemetry?limit=20")
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "G-02"
    assert len(data["series"]) >= 3  # Vibration, Temp, Efficiency

    series_by_key = {s["metric_key"]: s for s in data["series"]}
    assert "bearing_vibration_mm_s" in series_by_key
    vib = series_by_key["bearing_vibration_mm_s"]

    assert vib["current_value"] == 4.8
    assert vib["warning_threshold"] == 4.0
    assert vib["threshold_status"] == "WARNING"
    assert vib["trend"] == "RISING"
    assert "Rising" in vib["trend_description"]
    assert len(vib["points"]) >= 5

    # Check efficiency series (should be falling)
    assert "efficiency_pct" in series_by_key
    eff = series_by_key["efficiency_pct"]
    assert eff["current_value"] == 32.4
    assert eff["trend"] == "FALLING"

    # Provenance
    assert data["provenance"]["truth_type"] == "MEASURED"


def test_asset_risk_engine_g02(client):
    """GET /assets/G-02/risk returns explainable composite risk and factor evidence."""
    response = client.get("/assets/G-02/risk")
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "G-02"
    assert data["score"] >= 70  # Elevated risk due to multi-dimensional factors
    assert data["level"] in ["HIGH", "CRITICAL"]

    # Verify all 6 factors are present and populated
    factor_keys = [f["factor"] for f in data["factors"]]
    assert "condition" in factor_keys
    assert "criticality" in factor_keys
    assert "dependency" in factor_keys
    assert "maintenance" in factor_keys
    assert "spare" in factor_keys
    assert "resupply" in factor_keys

    # Verify factor evidence
    factors_map = {f["factor"]: f for f in data["factors"]}
    assert factors_map["condition"]["score"] > 0
    assert "threshold" in factors_map["condition"]["evidence"].lower()

    assert factors_map["maintenance"]["score"] == 15
    assert "BLOCKED_PARTS" in factors_map["maintenance"]["evidence"]

    assert factors_map["spare"]["score"] == 10
    assert "0 available" in factors_map["spare"]["evidence"]

    assert data["maintenance_blocked"] is True
    assert data["spare_available_quantity"] == 0
    assert data["resupply_days"] is not None
    assert data["resupply_days"] >= 10.0
    assert data["truth_type"] == "DERIVED"
    assert len(data["assumptions"]) >= 2


def test_asset_risk_nominal_asset(client):
    """Nominal asset (G-01) has low risk score and no maintenance blockages."""
    response = client.get("/assets/G-01/risk")
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "G-01"
    assert data["score"] < 40
    assert data["level"] == "LOW"
    assert data["maintenance_blocked"] is False
