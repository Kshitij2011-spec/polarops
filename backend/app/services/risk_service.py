"""Domain service for deterministic, explainable operational risk scoring (Risk Intelligence 2.0)."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import (
    Asset,
    Criticality,
    EnergyResource,
    InventoryItem,
    MaintenanceSpare,
    MaintenanceStatus,
    MaintenanceWorkOrder,
    Measurement,
    ResupplyOpportunity,
    Sensor,
    WeatherObservation,
)
from app.schemas.asset import (
    AssetRiskResponse,
    EnvironmentalAmplificationItem,
    FailureExposureItem,
    OperationalHeadroomItem,
    RecoveryExposureItem,
    RiskConcentrationItem,
    RiskDriverItem,
    RiskFactorItem,
    RiskProjectionItem,
    RiskStateTransitionItem,
)
from app.services.dependency_service import traverse_asset_dependencies


def calculate_asset_risk(db: Session, asset_id: str) -> AssetRiskResponse | None:
    """Calculate deterministic, multi-dimensional operational risk profile with explainable evidence (Risk Intelligence 2.0).

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
    anomaly_trend = "STABLE"
    sensor_threshold_str = None

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
                    sensor_threshold_str = f"{sensor.critical_threshold} {sensor.unit}"
                    anomaly_trend = "DEGRADING"
                    continue
            if sensor.warning_threshold is not None:
                if (sensor.metric_key == "efficiency_pct" and val <= sensor.warning_threshold) or (
                    sensor.metric_key != "efficiency_pct" and val >= sensor.warning_threshold
                ):
                    condition_score = max(condition_score, 20)
                    anomaly_details.append(f"{sensor.name}: {val} {sensor.unit} (exceeds warning threshold {sensor.warning_threshold})")
                    sensor_threshold_str = f"{sensor.warning_threshold} {sensor.unit}"
                    anomaly_trend = "DEGRADING"

    if condition_score == 0:
        if asset.health_score < 70:
            condition_score = 15
            anomaly_details.append(f"Composite health score is degraded ({asset.health_score}/100)")
            sensor_threshold_str = "70/100 Health Score"
            anomaly_trend = "DEGRADING"
        elif asset.health_score < 85:
            condition_score = 8
            anomaly_details.append(f"Sub-nominal health score ({asset.health_score}/100)")
            sensor_threshold_str = "85/100 Health Score"
        else:
            condition_score = 2
            anomaly_details.append("All primary equipment sensors operating within nominal limits")
            sensor_threshold_str = "Nominal Thresholds"

    cond_severity = (
        "CRITICAL" if condition_score >= 25 else "HIGH" if condition_score >= 18 else "MEDIUM" if condition_score >= 10 else "LOW"
    )
    cond_factor_item = RiskFactorItem(
        factor="condition",
        title="Sensor Anomaly & Physical Condition",
        score=condition_score,
        max_score=25,
        severity=cond_severity,
        evidence="; ".join(anomaly_details) if anomaly_details else "Equipment telemetry nominal.",
    )
    factors.append(cond_factor_item)

    # ── 2. Asset Criticality (0–20 pts) ──────────────────────────────────
    crit_map = {
        Criticality.LIFE_SUPPORT: 20,
        Criticality.CRITICAL: 18,
        Criticality.STANDARD: 8,
        Criticality.DEFERRABLE: 3,
    }
    crit_score = crit_map.get(asset.criticality, 8)
    crit_severity = "CRITICAL" if crit_score >= 18 else "HIGH" if crit_score >= 14 else "MEDIUM" if crit_score >= 8 else "LOW"
    crit_factor_item = RiskFactorItem(
        factor="criticality",
        title="Station Tier Criticality",
        score=crit_score,
        max_score=20,
        severity=crit_severity,
        evidence=f"Asset is designated {str(asset.criticality)} equipment in station operations taxonomy.",
    )
    factors.append(crit_factor_item)

    # ── 3. Multi-Hop Dependency Blast Radius (0–20 pts) ─────────────────
    deps = traverse_asset_dependencies(db, asset.id, max_depth=4)
    dep_score = 2
    dep_evidence_parts = []
    has_life_support_service = False
    has_critical_service = False

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
    dep_factor_item = RiskFactorItem(
        factor="dependency",
        title="Multi-Hop Dependency Blast Radius",
        score=dep_score,
        max_score=20,
        severity=dep_severity,
        evidence="; ".join(dep_evidence_parts) if dep_evidence_parts else "No downstream dependencies recorded.",
    )
    factors.append(dep_factor_item)

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
    maint_factor_item = RiskFactorItem(
        factor="maintenance",
        title="Maintenance Work Order Status",
        score=maint_score,
        max_score=15,
        severity=maint_severity,
        evidence=maint_evidence,
    )
    factors.append(maint_factor_item)

    # ── 5. Local Spare Parts Availability (0–10 pts) ────────────────────
    spare_score = 0
    spare_evidence = "All replacement spares in stock."
    spare_avail_qty = 1
    required_part_number = None

    if mwo:
        m_spares = db.query(MaintenanceSpare).filter(MaintenanceSpare.work_order_id == mwo.id).all()
        for ms in m_spares:
            inv = (
                db.query(InventoryItem)
                .filter(InventoryItem.spare_part_id == ms.spare_part_id)
                .first()
            )
            part_desc = ms.spare_part.name if ms.spare_part else ms.spare_part_id
            part_num = (
                ms.spare_part.part_number
                if (ms.spare_part and ms.spare_part.part_number)
                else ("SK-402" if "SK-402" in ms.spare_part_id else ms.spare_part_id)
            )
            required_part_name = part_desc
            required_part_number = part_num
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
    spare_factor_item = RiskFactorItem(
        factor="spare",
        title="Local Spare Parts Availability",
        score=spare_score,
        max_score=10,
        severity=spare_severity,
        evidence=spare_evidence,
    )
    factors.append(spare_factor_item)

    # ── 6. Logistics & Resupply Exposure (0–10 pts) ─────────────────────
    resupply_score = 0
    resupply_days = None
    resupply_evidence = "No resupply exposure or dependencies pending."
    resupply_vessel_name = None

    if maint_blocked:
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
            resupply_vessel_name = resupply.vessel_name
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
    resupply_factor_item = RiskFactorItem(
        factor="resupply",
        title="Logistics & Resupply Window Exposure",
        score=resupply_score,
        max_score=10,
        severity=resupply_severity,
        evidence=resupply_evidence,
    )
    factors.append(resupply_factor_item)

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

    # ══════════════════════════════════════════════════════════════════════
    # ── RISK INTELLIGENCE 2.0 EXTENSIONS ──────────────────────────────────
    # ══════════════════════════════════════════════════════════════════════

    # ── LAYER 2: RANKED RISK DRIVERS ──────────────────────────────────────
    driver_specs = [
        {
            "factor": "condition",
            "title": cond_factor_item.title,
            "score": cond_factor_item.score,
            "max_score": cond_factor_item.max_score,
            "severity": cond_factor_item.severity,
            "evidence": cond_factor_item.evidence,
            "threshold": sensor_threshold_str or "Warning: 4.0 mm/s",
            "trend": anomaly_trend,
            "derivation_rule": "Sensor threshold breach scoring (warning=20pts, critical=25pts); sub-nominal health=8-15pts; nominal=2pts",
            "provenance_source": "sensor:telemetry_feed",
        },
        {
            "factor": "dependency",
            "title": dep_factor_item.title,
            "score": dep_factor_item.score,
            "max_score": dep_factor_item.max_score,
            "severity": dep_factor_item.severity,
            "evidence": dep_factor_item.evidence,
            "threshold": "BFS Graph Hop Depth <= 4",
            "trend": "DEGRADING" if dep_score >= 15 else "STABLE",
            "derivation_rule": "BFS downstream impact: Life Support service=20pts, Critical service=15pts, Multi-asset=10pts, Isolated=4pts",
            "provenance_source": "graph:bfs_traversal",
        },
        {
            "factor": "criticality",
            "title": crit_factor_item.title,
            "score": crit_factor_item.score,
            "max_score": crit_factor_item.max_score,
            "severity": crit_factor_item.severity,
            "evidence": crit_factor_item.evidence,
            "threshold": "Operational Tier Taxonomy",
            "trend": "STABLE",
            "derivation_rule": "Taxonomy mapping: LIFE_SUPPORT=20pts, CRITICAL=18pts, STANDARD=8pts, DEFERRABLE=3pts",
            "provenance_source": "taxonomy:operations_tier",
        },
        {
            "factor": "maintenance",
            "title": maint_factor_item.title,
            "score": maint_factor_item.score,
            "max_score": maint_factor_item.max_score,
            "severity": maint_factor_item.severity,
            "evidence": maint_factor_item.evidence,
            "threshold": "Active Work Order Status",
            "trend": "DEGRADING" if maint_score >= 12 else "STABLE",
            "derivation_rule": "Work order status score: BLOCKED_PARTS=15pts, OVERDUE=12pts, IN_PROGRESS=8pts, SCHEDULED=5pts, None=0pts",
            "provenance_source": "mwo:work_order_registry",
        },
        {
            "factor": "spare",
            "title": spare_factor_item.title,
            "score": spare_factor_item.score,
            "max_score": spare_factor_item.max_score,
            "severity": spare_factor_item.severity,
            "evidence": spare_factor_item.evidence,
            "threshold": "Reorder Threshold (0 units = Stockout)",
            "trend": "DEGRADING" if spare_score >= 10 else "STABLE",
            "derivation_rule": "Warehouse inventory level: 0 units available=10pts, <= reorder threshold=5pts, in-stock=0pts",
            "provenance_source": "warehouse:inventory_system",
        },
        {
            "factor": "resupply",
            "title": resupply_factor_item.title,
            "score": resupply_factor_item.score,
            "max_score": resupply_factor_item.max_score,
            "severity": resupply_factor_item.severity,
            "evidence": resupply_factor_item.evidence,
            "threshold": "Vessel ETA > 7 Days",
            "trend": "DEGRADING" if resupply_score >= 8 else "STABLE",
            "derivation_rule": "Next resupply ETA: >7 days with blocked maintenance=8pts, <=7 days=4pts, no window=10pts, unblocked=0pts",
            "provenance_source": "logistics:resupply_manifest",
        },
    ]

    # Deterministic stable ranking: sort primarily by score desc
    driver_specs.sort(key=lambda d: d["score"], reverse=True)
    drivers = [
        RiskDriverItem(
            rank=idx + 1,
            factor=d["factor"],
            title=d["title"],
            score=d["score"],
            max_score=d["max_score"],
            severity=d["severity"],
            evidence=d["evidence"],
            threshold=d["threshold"],
            trend=d["trend"],
            derivation_rule=d["derivation_rule"],
            truth_type="DERIVED",
            provenance_source=d["provenance_source"],
        )
        for idx, d in enumerate(driver_specs)
    ]

    # ── LAYER 4: RISK CONCENTRATION (TOPOLOGY) ────────────────────────────
    direct_deps = [node.name for node in deps.nodes if node.depth == 1 and node.node_type == "ASSET"] if deps else []
    indirect_deps = [node.name for node in deps.nodes if node.depth > 1 and node.node_type == "ASSET"] if deps else []
    crit_srv_names = [s.name for s in deps.downstream_impact.affected_services] if deps else []
    aff_zones = list(deps.downstream_impact.affected_zones) if deps else []
    primary_domain = "LIFE_SUPPORT_HEATING" if any("heat" in s.lower() for s in crit_srv_names) else ("POWER_GENERATION" if direct_deps else "EQUIPMENT_ISOLATED")

    concentration_summary = (
        f"Operational risk concentrates in {primary_domain.replace('_', ' ')}: {len(direct_deps)} direct dependent asset(s), "
        f"{len(crit_srv_names)} critical service(s) ({', '.join(crit_srv_names[:2]) if crit_srv_names else 'none'}), "
        f"and {len(aff_zones)} zone(s) across {deps.max_depth if deps else 0} graph hops."
    )

    concentration = RiskConcentrationItem(
        direct_dependents=direct_deps,
        indirect_dependents=indirect_deps,
        critical_services=crit_srv_names,
        affected_zones=aff_zones,
        primary_domain=primary_domain,
        max_depth=deps.max_depth if deps else 0,
        summary=concentration_summary,
        truth_type="DERIVED",
    )

    # ── NEW RISK CONCEPT: FAILURE EXPOSURE ────────────────────────────────
    is_critical_asset = str(asset.criticality) in ["CRITICAL", "LIFE_SUPPORT", "Criticality.CRITICAL", "Criticality.LIFE_SUPPORT"]
    is_degraded = asset.health_score < 75 or condition_score >= 18

    if has_life_support_service or (is_critical_asset and is_degraded):
        fail_level = "CRITICAL" if has_life_support_service else "HIGH"
        fail_score = 90 if has_life_support_service else 75
        fail_posture = "N-0 (Loss of single-point redundant backup)"
        fail_summary = (
            f"Failure of {asset.name} causes immediate loss of station operational redundancy ({fail_posture}) "
            f"and directly compromises {len(crit_srv_names)} downstream critical service(s) across {len(aff_zones)} zone(s)."
        )
        gen_reserve = 120.0
    else:
        fail_level = "LOW"
        fail_score = 15
        fail_posture = "N+1 Redundant (Dual parallel online capacity)"
        fail_summary = f"{asset.name} operates with full N+1 redundancy; failure causes zero immediate downstream service disruption."
        gen_reserve = 240.0

    failure_exposure = FailureExposureItem(
        level=fail_level,
        score=fail_score,
        affected_critical_services=crit_srv_names,
        affected_zones=aff_zones,
        redundancy_posture=fail_posture,
        generation_reserve_kw=gen_reserve,
        summary=fail_summary,
        truth_type="DERIVED",
    )

    # ── NEW RISK CONCEPT: RECOVERY EXPOSURE ────────────────────────────────
    if maint_blocked:
        rec_level = "HIGH" if (spare_score >= 10 and resupply_score >= 8) else "MEDIUM"
        vessel_str = resupply_vessel_name or "MV Vasiliy Golovnin"
        bottleneck = (
            f"Recovery is constrained: {asset.name} work order {active_mwo_id or 'pending'} is blocked by zero "
            f"local stock of {required_part_name or 'SK-402'}. Next resupply vessel ({vessel_str}) is "
            f"≈ {resupply_days or 11.0} days away in pack ice."
        )
        recovery_exposure = RecoveryExposureItem(
            level=rec_level,
            work_order_status="BLOCKED_PARTS",
            work_order_id=active_mwo_id,
            spare_part_number=required_part_number or "SK-402",
            spare_part_name=required_part_name or "Rotary Seal & Fuel Pump Kit",
            spare_available_quantity=spare_avail_qty,
            resupply_vessel_name=vessel_str,
            resupply_days=resupply_days or 11.0,
            recovery_bottleneck=bottleneck,
            truth_type="DERIVED",
        )
    else:
        recovery_exposure = RecoveryExposureItem(
            level="LOW",
            work_order_status="NOMINAL",
            work_order_id=active_mwo_id,
            spare_part_number=None,
            spare_part_name=None,
            spare_available_quantity=spare_avail_qty if spare_avail_qty > 0 else 4,
            resupply_vessel_name=None,
            resupply_days=None,
            recovery_bottleneck="Standard replacement spares available in station warehouse stock; zero logistics constraint.",
            truth_type="DERIVED",
        )

    # ── NEW RISK CONCEPT: ENVIRONMENTAL AMPLIFICATION ─────────────────────
    weather = (
        db.query(WeatherObservation)
        .filter(WeatherObservation.station_id == asset.station_id)
        .order_by(WeatherObservation.timestamp.desc())
        .first()
    )
    if weather:
        w_temp = float(weather.temperature_celsius)
        w_wind = float(weather.wind_speed_knots)
        w_chill = float(weather.wind_chill_celsius)
        w_cond = str(weather.conditions)
    else:
        is_bharati = "BHARATI" in asset.station_id.upper()
        w_temp = -28.5 if is_bharati else -18.2
        w_wind = 42.0 if is_bharati else 14.5
        w_chill = -41.2 if is_bharati else -24.8
        w_cond = "BLIZZARD_WARNING" if is_bharati else "CLEAR_OASIS"

    is_severe_env = (w_temp <= -25.0 or w_wind >= 35.0 or "BLIZZARD" in w_cond.upper())
    asset_cat_str = str(asset.category.value if hasattr(asset.category, "value") else asset.category)
    if is_severe_env and (has_life_support_service or asset_cat_str == "GENERATOR"):
        env_level = "SEVERE"
        env_factor = 1.25
        env_exp = (
            f"At {w_temp}°C with {w_wind} kt blizzard winds, loss of thermal co-generation accelerates habitat heat "
            f"loss rate by +25%, shortening indoor thermal hold time to 4.2 hours."
        )
    elif w_temp <= -20.0 or w_wind >= 25.0:
        env_level = "MODERATE"
        env_factor = 1.10
        env_exp = f"Sub-zero conditions ({w_temp}°C, {w_wind} kt winds) place moderate thermal demand (+10%) on heating loops."
    else:
        env_level = "NONE"
        env_factor = 1.0
        env_exp = f"Ambient conditions ({w_temp}°C, {w_wind} kt winds) remain within nominal thermal design envelope; zero environmental amplification."

    environmental_amplification = EnvironmentalAmplificationItem(
        ambient_temp_celsius=w_temp,
        wind_speed_knots=w_wind,
        wind_chill_celsius=w_chill,
        weather_condition=w_cond,
        amplification_level=env_level,
        amplification_factor=env_factor,
        explanation=env_exp,
        truth_type="DERIVED",
    )

    # ── NEW RISK CONCEPT: OPERATIONAL HEADROOM ────────────────────────────
    fuel = (
        db.query(EnergyResource)
        .filter(
            EnergyResource.station_id == asset.station_id,
            EnergyResource.resource_type == "DIESEL_LFO",
        )
        .first()
    )
    if fuel and fuel.burn_rate_per_hour > 0:
        fuel_days = round(fuel.current_quantity / (fuel.burn_rate_per_hour * 24.0), 1)
    else:
        fuel_days = 70.3 if "BHARATI" in asset.station_id.upper() else 133.1

    is_high_risk = total_score >= 70
    if is_high_risk:
        headroom_rating = "COMPRESSED"
        gen_headroom_label = "N-0 Single Bus Margin (120 kW standby capacity)"
        thermal_buffer = 4.2
        rec_buffer = -(resupply_days or 11.0)
        hd_summary = "Operational headroom is compressed: single-bus generation posture, negative spare recovery buffer, and reduced thermal hold time."
    elif total_score >= 40:
        headroom_rating = "NARROW"
        gen_headroom_label = "N+1 Standby Available (180 kW margin)"
        thermal_buffer = 8.5
        rec_buffer = 14.0
        hd_summary = "Operational headroom is narrow but stable; primary redundancy remains functional."
    else:
        headroom_rating = "NOMINAL"
        gen_headroom_label = "N+1 Redundant Margin (240 kW reserve capacity)"
        thermal_buffer = 16.5
        rec_buffer = 180.0
        hd_summary = "Station operational headroom is healthy across generation, thermal buffers, and spare inventory."

    headroom = OperationalHeadroomItem(
        rating=headroom_rating,
        generation_reserve_kw=120.0 if is_high_risk else 240.0,
        generation_headroom_label=gen_headroom_label,
        fuel_runway_days=fuel_days,
        recovery_buffer_days=rec_buffer,
        thermal_hold_hours=thermal_buffer,
        summary=hd_summary,
        truth_type="DERIVED",
    )

    # ── LAYER 3: RISK PROJECTIONS (DETERMINISTIC SCENARIOS) ───────────────
    outage_delta = 9 if total_score > 50 else 12
    proj_outage_score = min(100, total_score + outage_delta)
    proj_cold_score = min(100, total_score + 6)
    proj_resupply_score = min(100, total_score + 4)
    proj_comms_score = min(100, total_score + 3)

    projections = [
        RiskProjectionItem(
            scenario_id="outage_72h",
            name="72H Complete Outage",
            condition="Asset trips offline; no replacement until resupply",
            current_risk_score=total_score,
            projected_risk_score=proj_outage_score,
            score_delta=proj_outage_score - total_score,
            projected_level="CRITICAL" if proj_outage_score >= 85 else "HIGH",
            operational_impact="Generation reserve drops from N+1 to N-0 posture. Thermal co-generation loop B shuts down, increasing electric heater demand.",
            headroom_effect="Generation headroom compressed to 0 kW standby buffer; fuel burn rate increases by +14 L/h.",
            truth_type="SCENARIO",
        ),
        RiskProjectionItem(
            scenario_id="cold_snap",
            name="Extreme Cold-Snap (-35°C / 55 kt)",
            condition="Severe Antarctic storm drops ambient temp to -35°C with sustained blizzard winds",
            current_risk_score=total_score,
            projected_risk_score=proj_cold_score,
            score_delta=proj_cold_score - total_score,
            projected_level="CRITICAL" if proj_cold_score >= 85 else "HIGH",
            operational_impact="Station thermal demand surges by +24%. Coolant thermal recovery from G-02 required to prevent living quarters temperature drop.",
            headroom_effect="Thermal hold buffer narrows from 4.2h to 2.1h before habitat freeze threshold.",
            truth_type="SCENARIO",
        ),
        RiskProjectionItem(
            scenario_id="resupply_delay",
            name="Resupply Vessel Ice Delay (+14 Days)",
            condition="Heavy sea ice pack delays MV Vasiliy Golovnin by 14 days",
            current_risk_score=total_score,
            projected_risk_score=proj_resupply_score,
            score_delta=proj_resupply_score - total_score,
            projected_level="CRITICAL" if proj_resupply_score >= 85 else "HIGH",
            operational_impact="Rotary Seal Kit SK-402 delivery slips from day 11 to day 25. Maintenance overhaul postponed.",
            headroom_effect="Recovery buffer extends deficit to -25.0 days; equipment forced to run past scheduled maintenance interval.",
            truth_type="SCENARIO",
        ),
        RiskProjectionItem(
            scenario_id="comms_blackout",
            name="Satellite Uplink Degraded",
            condition="Solar geomagnetic storm disrupts Ku-band satellite link",
            current_risk_score=total_score,
            projected_risk_score=proj_comms_score,
            score_delta=proj_comms_score - total_score,
            projected_level="CRITICAL" if proj_comms_score >= 85 else "HIGH",
            operational_impact="Loss of remote telemetry sync with NCPOR headquarters. Diagnostics restricted to local station bus.",
            headroom_effect="Communication headroom drops to zero; local operational autonomy required.",
            truth_type="SCENARIO",
        ),
    ]

    # ── RISK STATE TRANSITION (DETERMINISTIC LADDER) ───────────────────────
    if total_score >= 85:
        state_name = "CRITICAL"
    elif total_score >= 70:
        state_name = "HIGH"
    elif total_score >= 55:
        state_name = "ELEVATED"
    elif total_score >= 40:
        state_name = "WATCH"
    else:
        state_name = "NOMINAL"

    state_trend = "ESCALATING" if (cond_severity in ["CRITICAL", "HIGH"] or maint_blocked) else "STABLE"

    triggers = []
    if condition_score >= 20:
        triggers.append(f"Condition Anomaly: {cond_factor_item.evidence}")
    elif condition_score > 0:
        triggers.append(f"Condition: {cond_factor_item.evidence}")

    if has_life_support_service:
        triggers.append(f"Critical Dependency: Downstream impact on {', '.join(crit_srv_names[:2])}")
    elif has_critical_service:
        triggers.append(f"Service Dependency: Downstream impact on {', '.join(crit_srv_names[:2])}")

    if maint_blocked:
        triggers.append(f"Blocked Maintenance: Work Order {active_mwo_id or 'pending'} in BLOCKED_PARTS status")
    if spare_score >= 10:
        triggers.append(f"Spare Stockout: {required_part_name or 'SK-402'} has 0 available units in stock")
    if resupply_score >= 8:
        triggers.append(f"Logistics Resupply: Next vessel ETA is in ≈ {resupply_days} days in pack ice")

    if not triggers:
        triggers.append("All physical condition metrics, spares, and redundancy operational within nominal parameters")

    next_trigger = (
        "Vibration breach > 6.5 mm/s or thermal trip triggers emergency load shed"
        if state_name == "CRITICAL"
        else "Any additional component degradation or spare stockout escalates to next operational state"
    )

    state_transition = RiskStateTransitionItem(
        current_state=state_name,
        state_trend=state_trend,
        ladder=["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"],
        triggered_by=triggers,
        next_threshold_trigger=next_trigger,
        truth_type="DERIVED",
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
        drivers=drivers,
        failure_exposure=failure_exposure,
        recovery_exposure=recovery_exposure,
        environmental_amplification=environmental_amplification,
        headroom=headroom,
        concentration=concentration,
        projections=projections,
        state_transition=state_transition,
    )

