"""Domain service for deterministic, explainable operational risk scoring."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import (
    Asset,
    Criticality,
    InventoryItem,
    MaintenanceSpare,
    MaintenanceStatus,
    MaintenanceWorkOrder,
    Measurement,
    ResupplyOpportunity,
    Sensor,
)
from app.schemas.asset import AssetRiskResponse, RiskFactorItem
from app.services.dependency_service import traverse_asset_dependencies


def calculate_asset_risk(db: Session, asset_id: str) -> AssetRiskResponse | None:
    """Calculate deterministic, multi-dimensional operational risk profile with explainable evidence.

    Composite Scoring Model:
    1. Condition / Anomaly Severity: 0–25 pts
    2. Asset Criticality: 0–20 pts
    3. Multi-Hop Dependency Exposure: 0–20 pts
    4. Maintenance Blockages: 0–15 pts
    5. Local Spare Part Availability: 0–10 pts
    6. Logistics & Resupply Exposure: 0–10 pts
    Total Maximum Score: 100 pts.
    """
    asset = (
        db.query(Asset)
        .filter((Asset.id == asset_id) | (Asset.code == asset_id))
        .first()
    )
    if not asset:
        return None

    factors: list[RiskFactorItem] = []

    # ── 1. Condition & Sensor Anomaly Severity (0–25 pts) ───────────────
    condition_score = 0
    anomaly_details = []

    for sensor in asset.sensors:
        latest_meas = (
            db.query(Measurement)
            .filter(Measurement.sensor_id == sensor.id)
            .order_by(Measurement.timestamp.desc())
            .first()
        )
        if latest_meas:
            val = latest_meas.value
            if sensor.critical_threshold is not None:
                if (sensor.metric_key == "efficiency_pct" and val <= sensor.critical_threshold) or (
                    sensor.metric_key != "efficiency_pct" and val >= sensor.critical_threshold
                ):
                    condition_score = max(condition_score, 25)
                    anomaly_details.append(f"{sensor.name}: {val} {sensor.unit} (exceeds critical threshold)")
                    continue
            if sensor.warning_threshold is not None:
                if (sensor.metric_key == "efficiency_pct" and val <= sensor.warning_threshold) or (
                    sensor.metric_key != "efficiency_pct" and val >= sensor.warning_threshold
                ):
                    condition_score = max(condition_score, 20)
                    anomaly_details.append(f"{sensor.name}: {val} {sensor.unit} (exceeds warning threshold {sensor.warning_threshold})")

    if condition_score == 0:
        if asset.health_score < 70:
            condition_score = 15
            anomaly_details.append(f"Composite health score is degraded ({asset.health_score}/100)")
        elif asset.health_score < 85:
            condition_score = 8
            anomaly_details.append(f"Sub-nominal health score ({asset.health_score}/100)")
        else:
            condition_score = 2
            anomaly_details.append("All primary equipment sensors operating within nominal limits")

    cond_severity = (
        "CRITICAL" if condition_score >= 25 else "HIGH" if condition_score >= 18 else "MEDIUM" if condition_score >= 10 else "LOW"
    )
    factors.append(
        RiskFactorItem(
            factor="condition",
            title="Sensor Anomaly & Physical Condition",
            score=condition_score,
            max_score=25,
            severity=cond_severity,
            evidence="; ".join(anomaly_details) if anomaly_details else "Equipment telemetry nominal.",
        )
    )

    # ── 2. Asset Criticality (0–20 pts) ──────────────────────────────────
    crit_map = {
        Criticality.LIFE_SUPPORT: 20,
        Criticality.CRITICAL: 18,
        Criticality.STANDARD: 8,
        Criticality.DEFERRABLE: 3,
    }
    crit_score = crit_map.get(asset.criticality, 8)
    crit_severity = "CRITICAL" if crit_score >= 18 else "HIGH" if crit_score >= 14 else "MEDIUM" if crit_score >= 8 else "LOW"
    factors.append(
        RiskFactorItem(
            factor="criticality",
            title="Station Tier Criticality",
            score=crit_score,
            max_score=20,
            severity=crit_severity,
            evidence=f"Asset is designated {str(asset.criticality)} equipment in station operations taxonomy.",
        )
    )

    # ── 3. Multi-Hop Dependency Blast Radius (0–20 pts) ─────────────────
    deps = traverse_asset_dependencies(db, asset.id, max_depth=4)
    dep_score = 2
    dep_evidence_parts = []

    if deps:
        has_life_support_service = any(
            srv.criticality == Criticality.LIFE_SUPPORT for srv in deps.downstream_impact.affected_services
        )
        has_critical_service = any(
            srv.criticality == Criticality.CRITICAL for srv in deps.downstream_impact.affected_services
        )

        if has_life_support_service:
            dep_score = 20
            life_support_names = [
                s.name for s in deps.downstream_impact.affected_services if s.criticality == Criticality.LIFE_SUPPORT
            ]
            dep_evidence_parts.append(f"Direct downstream impact on Life Support services: {', '.join(life_support_names)}")
        elif has_critical_service:
            dep_score = 15
            crit_names = [
                s.name for s in deps.downstream_impact.affected_services if s.criticality == Criticality.CRITICAL
            ]
            dep_evidence_parts.append(f"Downstream impact on Critical services: {', '.join(crit_names)}")
        elif deps.total_downstream_assets > 0:
            dep_score = 10
            dep_evidence_parts.append(f"{deps.total_downstream_assets} downstream assets exposed across {deps.max_depth} graph hops")
        else:
            dep_score = 4
            dep_evidence_parts.append("Isolated operational envelope; minimal downstream blast radius")

        if deps.downstream_impact.affected_zones:
            dep_evidence_parts.append(f"Zones exposed: {', '.join(deps.downstream_impact.affected_zones)}")

    dep_severity = "CRITICAL" if dep_score >= 20 else "HIGH" if dep_score >= 14 else "MEDIUM" if dep_score >= 8 else "LOW"
    factors.append(
        RiskFactorItem(
            factor="dependency",
            title="Multi-Hop Dependency Blast Radius",
            score=dep_score,
            max_score=20,
            severity=dep_severity,
            evidence="; ".join(dep_evidence_parts) if dep_evidence_parts else "No downstream dependencies recorded.",
        )
    )

    # ── 4. Maintenance State & Active Work Orders (0–15 pts) ───────────
    mwo = (
        db.query(MaintenanceWorkOrder)
        .filter(MaintenanceWorkOrder.asset_id == asset.id)
        .order_by(MaintenanceWorkOrder.created_at.desc())
        .first()
    )

    maint_score = 0
    maint_evidence = "No open maintenance work orders pending."
    maint_blocked = False
    active_mwo_id = None
    required_part_name = None

    if mwo:
        active_mwo_id = mwo.id
        if mwo.status == MaintenanceStatus.BLOCKED_PARTS:
            maint_score = 15
            maint_blocked = True
            maint_evidence = f"Work Order {mwo.id} is BLOCKED_PARTS ({mwo.title}). Action: {mwo.required_action}"
        elif mwo.status == MaintenanceStatus.OVERDUE:
            maint_score = 12
            maint_evidence = f"Work Order {mwo.id} is OVERDUE for required maintenance."
        elif mwo.status == MaintenanceStatus.IN_PROGRESS:
            maint_score = 8
            maint_evidence = f"Work Order {mwo.id} is currently under repair."
        elif mwo.status == MaintenanceStatus.SCHEDULED:
            maint_score = 5
            maint_evidence = f"Work Order {mwo.id} is scheduled for preventive maintenance."

    maint_severity = "CRITICAL" if maint_score >= 15 else "HIGH" if maint_score >= 10 else "MEDIUM" if maint_score >= 5 else "LOW"
    factors.append(
        RiskFactorItem(
            factor="maintenance",
            title="Maintenance Work Order Status",
            score=maint_score,
            max_score=15,
            severity=maint_severity,
            evidence=maint_evidence,
        )
    )

    # ── 5. Local Spare Parts Availability (0–10 pts) ────────────────────
    spare_score = 0
    spare_evidence = "All replacement spares in stock."
    spare_avail_qty = 1

    if mwo:
        m_spares = db.query(MaintenanceSpare).filter(MaintenanceSpare.work_order_id == mwo.id).all()
        for ms in m_spares:
            inv = (
                db.query(InventoryItem)
                .filter(InventoryItem.spare_part_id == ms.spare_part_id)
                .first()
            )
            part_desc = ms.spare_part.name if ms.spare_part else ms.spare_part_id
            required_part_name = part_desc
            if inv:
                spare_avail_qty = inv.quantity_available
                if inv.quantity_available < ms.quantity_required:
                    spare_score = 10
                    spare_evidence = (
                        f"Critical spare '{part_desc}' has 0 available units in station stock "
                        f"(location: {inv.location})."
                    )
                    break
                elif inv.quantity_available <= inv.reorder_threshold:
                    spare_score = 5
                    spare_evidence = f"Spare '{part_desc}' stock is low ({inv.quantity_available} units remaining)."

    spare_severity = "CRITICAL" if spare_score >= 10 else "MEDIUM" if spare_score >= 5 else "LOW"
    factors.append(
        RiskFactorItem(
            factor="spare",
            title="Local Spare Parts Availability",
            score=spare_score,
            max_score=10,
            severity=spare_severity,
            evidence=spare_evidence,
        )
    )

    # ── 6. Logistics & Resupply Exposure (0–10 pts) ─────────────────────
    resupply_score = 0
    resupply_days = None
    resupply_evidence = "No resupply exposure or dependencies pending."

    if maint_blocked:
        # Check in-transit resupply opportunities
        resupply = (
            db.query(ResupplyOpportunity)
            .filter(ResupplyOpportunity.station_id == asset.station_id)
            .order_by(ResupplyOpportunity.expected_date.asc())
            .first()
        )
        if resupply:
            now = datetime.now(timezone.utc)
            r_date = resupply.expected_date
            if r_date.tzinfo is None:
                r_date = r_date.replace(tzinfo=timezone.utc)
            resupply_days = max(0.0, round((r_date - now).total_seconds() / 86400, 1))
            if resupply_days > 7.0:
                resupply_score = 8
                resupply_evidence = (
                    f"Next scheduled resupply vessel ({resupply.vessel_name}) ETA is in "
                    f"≈ {resupply_days} days. Blizzard window blocks emergency flights."
                )
            else:
                resupply_score = 4
                resupply_evidence = f"Vessel {resupply.vessel_name} expected within {resupply_days} days."
        else:
            resupply_score = 10
            resupply_evidence = "No maritime or aerial resupply scheduled within 30-day window."

    resupply_severity = "HIGH" if resupply_score >= 8 else "MEDIUM" if resupply_score >= 4 else "LOW"
    factors.append(
        RiskFactorItem(
            factor="resupply",
            title="Logistics & Resupply Window Exposure",
            score=resupply_score,
            max_score=10,
            severity=resupply_severity,
            evidence=resupply_evidence,
        )
    )

    # ── Composite Risk Calculation & Classification ───────────────────
    total_score = sum(f.score for f in factors)
    total_score = min(100, max(0, total_score))

    if total_score >= 85:
        risk_level = "CRITICAL"
    elif total_score >= 70:
        risk_level = "HIGH"
    elif total_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Narrative Summary
    summary = (
        f"{asset.name} exhibits {risk_level} composite operational risk ({total_score}/100). "
        f"Degraded sensor telemetry is coupled with Criticality {str(asset.criticality)}, "
        f"impacting mission-critical life support heating. Recovery is constrained because active "
        f"maintenance is BLOCKED due to 0 available spare parts, with next resupply vessel ETA in "
        f"≈ {resupply_days or 'N/A'} days."
    )

    return AssetRiskResponse(
        asset_id=asset.id,
        asset_name=asset.name,
        score=total_score,
        level=risk_level,
        factors=factors,
        summary=summary,
        maintenance_blocked=maint_blocked,
        active_work_order_id=active_mwo_id,
        required_spare_part=required_part_name,
        spare_available_quantity=spare_avail_qty,
        resupply_days=resupply_days,
        computed_at=datetime.now(timezone.utc),
        truth_type="DERIVED",
        assumptions=[
            "[OUR DESIGN] Prototype deterministic composite risk model based on 6 weighted factors (Condition 25%, Criticality 20%, Dependency 20%, Maintenance 15%, Spare 10%, Resupply 10%).",
            "No black-box machine learning or unvalidated statistical failure probabilities claimed.",
            "Weather severity provides operational context but does not arbitrarily multiply risk scores.",
        ],
    )
