"""Comprehensive unit and API tests for Risk Intelligence 2.0.

Validates the 4 distinct operational reasoning layers:
1. Current Risk & Deterministic State Transition Ladder
2. Ranked Risk Drivers with derivation rules, thresholds, and trends
3. Deterministic Scenario Risk Projections (strictly labeled [SCENARIO])
4. Graph-Based Risk Concentration & Exposures:
   - Failure Exposure (N-0 posture, critical services, affected zones)
   - Recovery Exposure (BLOCKED_PARTS, SK-402 stockout, vessel ETA)
   - Environmental Amplification (blizzard coupling, thermal loss rate)
   - Operational Headroom (generation reserve, fuel runway, thermal hold hours)
Validates multi-station divergence: Bharati G-02 critical case vs. Maitri nominal fleet case.
Validates backward compatibility and deterministic repeatability.
"""

from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.seed import ensure_maitri_canonical_state
from app.models import MaintenanceStatus, MaintenanceWorkOrder
from app.services.risk_service import calculate_asset_risk


def test_risk_intelligence_bharati_g02_layers(client: TestClient):
    """GET /assets/G-02/risk returns all 4 layers of Risk Intelligence 2.0 with full evidence."""
    response = client.get("/assets/G-02/risk")
    assert response.status_code == 200
    data = response.json()

    # ── LAYER 1: CURRENT RISK & STATE TRANSITION ───────────────────────────
    assert data["asset_id"] == "G-02"
    assert data["score"] >= 85
    assert data["level"] == "CRITICAL"
    assert data["truth_type"] == "DERIVED"

    # State transition ladder
    state_trans = data.get("state_transition")
    assert state_trans is not None
    assert state_trans["current_state"] == "CRITICAL"
    assert state_trans["state_trend"] == "ESCALATING"
    assert state_trans["ladder"] == ["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"]
    assert len(state_trans["triggered_by"]) >= 3
    # Check trigger conditions contain real data facts
    triggers_str = " ".join(state_trans["triggered_by"])
    assert "Condition" in triggers_str or "Vibration" in triggers_str
    assert "BLOCKED_PARTS" in triggers_str or "Maintenance" in triggers_str
    assert "SK-402" in triggers_str or "Stockout" in triggers_str

    # ── LAYER 2: RANKED RISK DRIVERS ───────────────────────────────────────
    drivers = data.get("drivers")
    assert drivers is not None
    assert len(drivers) == 6

    # Verify ranked order (descending by score)
    scores = [d["score"] for d in drivers]
    assert scores == sorted(scores, reverse=True)
    assert [d["rank"] for d in drivers] == [1, 2, 3, 4, 5, 6]

    # Verify driver fields
    for d in drivers:
        assert d["factor"] in ["condition", "dependency", "criticality", "maintenance", "spare", "resupply"]
        assert d["score"] >= 0
        assert d["max_score"] > 0
        assert d["severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert len(d["evidence"]) > 5
        assert d["threshold"] is not None
        assert d["trend"] in ["DEGRADING", "STABLE", "IMPROVING"]
        assert len(d["derivation_rule"]) > 10
        assert d["truth_type"] == "DERIVED"
        assert len(d["provenance_source"]) > 3

    # Condition driver should be among top contributors
    cond_driver = next(d for d in drivers if d["factor"] == "condition")
    assert cond_driver["score"] >= 20
    assert cond_driver["severity"] in ["HIGH", "CRITICAL"]
    assert cond_driver["trend"] == "DEGRADING"

    # Maintenance driver should show BLOCKED_PARTS
    maint_driver = next(d for d in drivers if d["factor"] == "maintenance")
    assert maint_driver["score"] == 15
    assert "BLOCKED_PARTS" in maint_driver["evidence"]

    # Spare driver should show 0 stock
    spare_driver = next(d for d in drivers if d["factor"] == "spare")
    assert spare_driver["score"] == 10
    assert "0 available" in spare_driver["evidence"]

    # ── LAYER 3: DETERMINISTIC SCENARIO PROJECTIONS ────────────────────────
    projections = data.get("projections")
    assert projections is not None
    assert len(projections) == 4

    proj_ids = [p["scenario_id"] for p in projections]
    assert "outage_72h" in proj_ids
    assert "cold_snap" in proj_ids
    assert "resupply_delay" in proj_ids
    assert "comms_blackout" in proj_ids

    for p in projections:
        assert p["truth_type"] == "SCENARIO"  # Strict epistemic honesty
        assert p["current_risk_score"] == data["score"]
        assert p["projected_risk_score"] >= p["current_risk_score"]
        assert p["score_delta"] >= 0
        assert p["projected_level"] in ["HIGH", "CRITICAL"]
        assert len(p["operational_impact"]) > 15
        assert len(p["headroom_effect"]) > 15

    # 72H outage should project reserve margin compression
    outage_proj = next(p for p in projections if p["scenario_id"] == "outage_72h")
    assert "N-0" in outage_proj["operational_impact"] or "reserve" in outage_proj["operational_impact"].lower()

    # Cold snap should project thermal demand surge
    cold_proj = next(p for p in projections if p["scenario_id"] == "cold_snap")
    assert "thermal" in cold_proj["operational_impact"].lower() or "heating" in cold_proj["operational_impact"].lower()

    # ── LAYER 4: RISK CONCENTRATION & EXPOSURES ───────────────────────────
    # Failure Exposure
    fail_exp = data.get("failure_exposure")
    assert fail_exp is not None
    assert fail_exp["level"] in ["HIGH", "CRITICAL"]
    assert "N-0" in fail_exp["redundancy_posture"]
    assert len(fail_exp["affected_critical_services"]) >= 1
    assert any("Heating" in s for s in fail_exp["affected_critical_services"])
    assert fail_exp["truth_type"] == "DERIVED"

    # Recovery Exposure
    rec_exp = data.get("recovery_exposure")
    assert rec_exp is not None
    assert rec_exp["level"] == "HIGH"
    assert rec_exp["work_order_status"] == "BLOCKED_PARTS"
    assert rec_exp["spare_part_number"] == "SK-402"
    assert rec_exp["spare_available_quantity"] == 0
    assert rec_exp["resupply_vessel_name"] == "MV Vasiliy Golovnin"
    assert rec_exp["resupply_days"] is not None
    assert rec_exp["resupply_days"] >= 10.0
    assert "blocked" in rec_exp["recovery_bottleneck"].lower()

    # Environmental Amplification
    env_amp = data.get("environmental_amplification")
    assert env_amp is not None
    assert env_amp["amplification_level"] == "SEVERE"
    assert env_amp["amplification_factor"] == 1.25
    assert env_amp["ambient_temp_celsius"] <= -25.0
    assert "blizzard" in env_amp["explanation"].lower() or "heat" in env_amp["explanation"].lower()
    assert env_amp["truth_type"] == "DERIVED"

    # Operational Headroom
    headroom = data.get("headroom")
    assert headroom is not None
    assert headroom["rating"] == "COMPRESSED"
    assert "N-0" in headroom["generation_headroom_label"]
    assert headroom["thermal_hold_hours"] <= 5.0
    assert headroom["recovery_buffer_days"] < 0  # Deficit buffer due to shortage gap
    assert headroom["fuel_runway_days"] >= 60.0

    # Risk Concentration
    conc = data.get("concentration")
    assert conc is not None
    assert len(conc["direct_dependents"]) >= 1
    assert len(conc["critical_services"]) >= 1
    assert conc["primary_domain"] == "LIFE_SUPPORT_HEATING"
    assert conc["max_depth"] >= 2


def test_risk_intelligence_maitri_nominal_divergence(client: TestClient, db_session: Session):
    """Maitri assets dynamically evaluate to nominal operational risk with zero forced high-risk."""
    ensure_maitri_canonical_state(db_session)

    response = client.get("/assets/MAITRI-GEN-01/risk")
    assert response.status_code == 200
    data = response.json()

    assert data["asset_id"] == "MAITRI-GEN-01"
    # Maitri generator has nominal telemetry, available spares, no work order blockers
    assert data["score"] < 40
    assert data["level"] == "LOW"
    assert data["maintenance_blocked"] is False

    # State transition ladder must be NOMINAL
    state_trans = data.get("state_transition")
    assert state_trans is not None
    assert state_trans["current_state"] == "NOMINAL"
    assert state_trans["state_trend"] == "STABLE"

    # Failure exposure must be LOW with N+1 Redundancy
    fail_exp = data.get("failure_exposure")
    assert fail_exp is not None
    assert fail_exp["level"] == "LOW"
    assert "N+1" in fail_exp["redundancy_posture"]

    # Recovery exposure must be LOW with spares in stock
    rec_exp = data.get("recovery_exposure")
    assert rec_exp is not None
    assert rec_exp["level"] == "LOW"
    assert rec_exp["work_order_status"] == "NOMINAL"

    # Environmental amplification must be NONE
    env_amp = data.get("environmental_amplification")
    assert env_amp is not None
    assert env_amp["amplification_level"] == "NONE"
    assert env_amp["amplification_factor"] == 1.0

    # Operational headroom must be NOMINAL
    headroom = data.get("headroom")
    assert headroom is not None
    assert headroom["rating"] == "NOMINAL"
    assert headroom["thermal_hold_hours"] > 10.0
    assert headroom["fuel_runway_days"] > 100.0


def test_risk_intelligence_backward_compatibility(client: TestClient):
    """Verify complete backward compatibility: all original AssetRiskResponse fields exist and match types."""
    response = client.get("/assets/G-02/risk")
    assert response.status_code == 200
    data = response.json()

    # Original fields from Day 2 specification
    original_fields = [
        "asset_id",
        "asset_name",
        "score",
        "level",
        "factors",
        "summary",
        "maintenance_blocked",
        "active_work_order_id",
        "required_spare_part",
        "spare_available_quantity",
        "resupply_days",
        "computed_at",
        "truth_type",
        "assumptions",
    ]
    for field in original_fields:
        assert field in data, f"Missing backward compatible field: {field}"

    assert isinstance(data["factors"], list)
    assert len(data["factors"]) == 6
    for f in data["factors"]:
        assert "factor" in f
        assert "title" in f
        assert "score" in f
        assert "max_score" in f
        assert "severity" in f
        assert "evidence" in f


def test_risk_intelligence_deterministic_repeatability(db_session: Session):
    """Multiple evaluations of calculate_asset_risk yield identical scores, rankings, and outputs."""
    res1 = calculate_asset_risk(db_session, "G-02")
    res2 = calculate_asset_risk(db_session, "G-02")

    assert res1 is not None and res2 is not None
    assert res1.score == res2.score
    assert res1.level == res2.level
    assert len(res1.drivers) == len(res2.drivers)
    assert [d.rank for d in res1.drivers] == [d.rank for d in res2.drivers]
    assert [d.score for d in res1.drivers] == [d.score for d in res2.drivers]
    assert res1.state_transition.current_state == res2.state_transition.current_state
    assert res1.failure_exposure.score == res2.failure_exposure.score
    assert res1.environmental_amplification.amplification_factor == res2.environmental_amplification.amplification_factor
    assert [p.projected_risk_score for p in res1.projections] == [p.projected_risk_score for p in res2.projections]


def test_risk_maintenance_status_lifecycle(db_session: Session):
    """Verify that calculate_asset_risk correctly evaluates canonical MaintenanceStatus enum members without AttributeErrors."""
    mwo = db_session.query(MaintenanceWorkOrder).filter(MaintenanceWorkOrder.asset_id == "G-02").first()
    assert mwo is not None
    orig_status = mwo.status
    orig_due = mwo.due_at

    try:
        # 1. BLOCKED_PARTS (baseline) -> 15 pts, maint_blocked=True
        mwo.status = MaintenanceStatus.BLOCKED_PARTS
        db_session.commit()
        res_blocked = calculate_asset_risk(db_session, "G-02")
        assert res_blocked is not None
        maint_factor = next(f for f in res_blocked.factors if f.factor == "maintenance")
        assert maint_factor.score == 15
        assert res_blocked.maintenance_blocked is True
        assert "BLOCKED_PARTS" in maint_factor.evidence

        # 2. IN_PROGRESS -> 8 pts, maint_blocked=False
        mwo.status = MaintenanceStatus.IN_PROGRESS
        db_session.commit()
        res_prog = calculate_asset_risk(db_session, "G-02")
        assert res_prog is not None
        maint_factor = next(f for f in res_prog.factors if f.factor == "maintenance")
        assert maint_factor.score == 8
        assert res_prog.maintenance_blocked is False
        assert "under repair" in maint_factor.evidence

        # 3. PENDING with past due_at (overdue) -> 12 pts, maint_blocked=False
        mwo.status = MaintenanceStatus.PENDING
        mwo.due_at = datetime.now(timezone.utc) - timedelta(days=2)
        db_session.commit()
        res_overdue = calculate_asset_risk(db_session, "G-02")
        assert res_overdue is not None
        maint_factor = next(f for f in res_overdue.factors if f.factor == "maintenance")
        assert maint_factor.score == 12
        assert "OVERDUE" in maint_factor.evidence

        # 4. PENDING with future due_at (scheduled) -> 5 pts, maint_blocked=False
        mwo.status = MaintenanceStatus.PENDING
        mwo.due_at = datetime.now(timezone.utc) + timedelta(days=5)
        db_session.commit()
        res_pending = calculate_asset_risk(db_session, "G-02")
        assert res_pending is not None
        maint_factor = next(f for f in res_pending.factors if f.factor == "maintenance")
        assert maint_factor.score == 5
        assert "scheduled" in maint_factor.evidence.lower() or "preventive" in maint_factor.evidence.lower()

        # 5. COMPLETED -> 0 pts, active_work_order_id=None
        mwo.status = MaintenanceStatus.COMPLETED
        db_session.commit()
        res_completed = calculate_asset_risk(db_session, "G-02")
        assert res_completed is not None
        maint_factor = next(f for f in res_completed.factors if f.factor == "maintenance")
        assert maint_factor.score == 0
        assert res_completed.active_work_order_id is None
        assert "No open maintenance" in maint_factor.evidence

    finally:
        # Restore canonical state
        mwo.status = orig_status
        mwo.due_at = orig_due
        db_session.commit()

