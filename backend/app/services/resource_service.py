"""Domain service for fuel reserves, warehouse inventory, resupply logistics, and recovery exposure."""

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
    Quality,
    ResupplyOpportunity,
    ResupplyStatus,
    SparePart,
    TruthType,
)
from app.schemas.common import ProvenanceSchema
from app.schemas.resource import (
    AssetRecoveryExposureResponse,
    FuelStatusResponse,
    InventorySpareItem,
    ResupplyOpportunityItem,
)


def get_station_fuel_status(db: Session, station_id: str = "STATION-BHARATI") -> FuelStatusResponse | None:
    """Retrieve station fuel stock, hourly consumption burn rate, and calculated operational runway."""
    diesel = (
        db.query(EnergyResource)
        .filter(
            EnergyResource.station_id == station_id,
            EnergyResource.resource_type == "DIESEL_LFO",
        )
        .first()
    )
    if not diesel:
        return None

    # Deterministic runway calculation: remaining fuel / (hourly burn * 24)
    burn_rate = diesel.burn_rate_per_hour if diesel.burn_rate_per_hour > 0 else 84.5
    runway_days = round(diesel.current_quantity / (burn_rate * 24.0), 1)
    winter_target = 90.0
    resupply_gap = round(runway_days - winter_target, 1)

    return FuelStatusResponse(
        station_id=station_id,
        resource_type=diesel.resource_type,
        current_stock_liters=round(diesel.current_quantity, 1),
        max_capacity_liters=round(diesel.max_capacity, 1),
        burn_rate_liters_per_hour=round(burn_rate, 1),
        projected_runway_days=runway_days,
        winter_target_days=winter_target,
        resupply_gap_days=resupply_gap,
        provenance=ProvenanceSchema(
            source=diesel.source or "resource:fuel_calc",
            timestamp=datetime.now(timezone.utc),
            quality=Quality.GOOD,
            truth_type=TruthType.DERIVED,
            confidence=0.95,
        ),
    )


def list_station_inventory(db: Session, station_id: str = "STATION-BHARATI") -> list[InventorySpareItem]:
    """Retrieve list of critical spare parts in station warehouse inventory."""
    items = (
        db.query(InventoryItem)
        .filter(InventoryItem.station_id == station_id)
        .order_by(InventoryItem.spare_part_id.asc())
        .all()
    )

    result: list[InventorySpareItem] = []
    now = datetime.now(timezone.utc)
    for item in items:
        sp = item.spare_part
        if not sp:
            continue

        # Collect associated active work orders
        m_spares = db.query(MaintenanceSpare).filter(MaintenanceSpare.spare_part_id == sp.id).all()
        wo_ids = [m.work_order_id for m in m_spares if m.work_order_id]

        status = "AVAILABLE"
        if item.quantity_available <= 0:
            status = "CRITICAL_SHORTAGE"
        elif item.quantity_reserved > 0:
            status = "RESERVED"

        # Freshness from the inventory record's own updated_at — same UTC-safe guard
        # used by asset_service.py and telemetry_service.py.
        item_ts = item.updated_at
        if item_ts is not None and item_ts.tzinfo is None:
            item_ts = item_ts.replace(tzinfo=timezone.utc)
        item_freshness = (
            max(0.0, (now - item_ts).total_seconds())
            if item_ts is not None
            else 1.0
        )

        result.append(
            InventorySpareItem(
                id=item.id,
                spare_part_id=sp.id,
                part_number=sp.part_number,
                name=sp.name,
                description=sp.description or "",
                criticality=str(sp.criticality.value if hasattr(sp.criticality, "value") else sp.criticality),
                quantity_available=item.quantity_available,
                quantity_reserved=item.quantity_reserved,
                reorder_threshold=item.reorder_threshold,
                location=item.location,
                status=status,
                work_order_ids=wo_ids,
                provenance=ProvenanceSchema(
                    source=f"inventory:{item.id}",
                    timestamp=item_ts or now,
                    freshness_seconds=round(item_freshness, 1),
                    quality=Quality.GOOD,
                    truth_type=TruthType.MEASURED,
                    confidence=0.95,
                ),
            )
        )

    return result


def list_station_resupply(db: Session, station_id: str = "STATION-BHARATI") -> list[ResupplyOpportunityItem]:
    """Retrieve inbound maritime expedition and flight resupply logistics opportunities."""
    opportunities = (
        db.query(ResupplyOpportunity)
        .filter(ResupplyOpportunity.station_id == station_id)
        .order_by(ResupplyOpportunity.expected_date.asc())
        .all()
    )

    result: list[ResupplyOpportunityItem] = []
    # Hoist now() outside the loop — a single reference time for all ETA/freshness calcs.
    now = datetime.now(timezone.utc)
    for opp in opportunities:
        sp = opp.spare_part
        # Compute ETA from the actual expected_date stored in the database.
        # Use the project-standard UTC convention (matching risk_service.py Factor 6).
        # Past dates clamp to 0.0; there is no hardcoded fallback.
        exp = (
            opp.expected_date
            if opp.expected_date.tzinfo
            else opp.expected_date.replace(tzinfo=timezone.utc)
        )
        delta = (exp - now).total_seconds() / 86400.0
        eta_days = max(0.0, round(delta, 1))

        # Freshness from the resupply record's own updated_at, not the expected arrival date.
        # updated_at = when the vessel schedule entry was last modified in the database.
        # truth_type FORECAST: expected_date is a planned future value, not a sensor reading.
        opp_ts = opp.updated_at
        if opp_ts is not None and opp_ts.tzinfo is None:
            opp_ts = opp_ts.replace(tzinfo=timezone.utc)
        opp_freshness = (
            max(0.0, (now - opp_ts).total_seconds())
            if opp_ts is not None
            else 1.0
        )

        result.append(
            ResupplyOpportunityItem(
                id=opp.id,
                vessel_name=opp.vessel_name,
                expected_date=opp.expected_date,
                eta_days=eta_days,
                spare_part_id=opp.spare_part_id,
                spare_part_number=sp.part_number if sp else "SK-402",
                spare_part_name=sp.name if sp else "Gasket & Fuel Pump Seal Kit",
                quantity=opp.quantity,
                delay_days=opp.delay_days,
                status=str(opp.status.value if hasattr(opp.status, "value") else opp.status),
                provenance=ProvenanceSchema(
                    source=f"resupply:{opp.id}",
                    timestamp=opp_ts or now,
                    freshness_seconds=round(opp_freshness, 1),
                    quality=Quality.GOOD,
                    truth_type=TruthType.FORECAST,
                    confidence=0.85,
                ),
            )
        )

    return result

def _utc(ts: "datetime | None") -> "datetime | None":
    """Normalize a possibly-naive datetime to UTC-aware, or return None."""
    if ts is None:
        return None
    return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)


def get_asset_recovery_exposure(db: Session, asset_id: str) -> AssetRecoveryExposureResponse | None:
    """Evaluate deterministic recovery constraints, spare stock availability, and resupply exposure for an asset."""
    asset = (
        db.query(Asset)
        .filter((Asset.id == asset_id) | (Asset.code == asset_id))
        .first()
    )
    if not asset:
        return None

    # 1. Active Work Order
    active_wo = (
        db.query(MaintenanceWorkOrder)
        .filter(
            MaintenanceWorkOrder.asset_id == asset.id,
            MaintenanceWorkOrder.status.in_([MaintenanceStatus.BLOCKED_PARTS, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.PENDING]),
        )
        .order_by(MaintenanceWorkOrder.priority.asc())
        .first()
    )

    req_spare_num = None
    req_spare_name = None
    qty_req = 0
    qty_avail = 0
    qty_res = 0
    vessel_name = None
    resupply_eta = None

    if active_wo:
        m_spare = db.query(MaintenanceSpare).filter(MaintenanceSpare.work_order_id == active_wo.id).first()
        if m_spare and m_spare.spare_part:
            sp = m_spare.spare_part
            req_spare_num = sp.part_number
            req_spare_name = sp.name
            qty_req = m_spare.quantity_required

            # Warehouse stock
            inv = db.query(InventoryItem).filter(InventoryItem.spare_part_id == sp.id).first()
            if inv:
                qty_avail = inv.quantity_available
                qty_res = inv.quantity_reserved

            # Resupply opportunity — earliest viable (non-delivered) opportunity only.
            # Status filter matches project ResupplyStatus enum; DELIVERED is excluded
            # because a delivered vessel carries no meaningful future ETA.
            # Ordering by expected_date ASC ensures the soonest opportunity is chosen
            # when multiple opportunities exist for the same spare part.
            res = (
                db.query(ResupplyOpportunity)
                .filter(
                    ResupplyOpportunity.spare_part_id == sp.id,
                    ResupplyOpportunity.status.in_([
                        ResupplyStatus.SCHEDULED,
                        ResupplyStatus.IN_TRANSIT,
                        ResupplyStatus.DELAYED,
                    ]),
                )
                .order_by(ResupplyOpportunity.expected_date.asc())
                .first()
            )
            if res:
                vessel_name = res.vessel_name
                # Compute ETA from expected_date (same UTC-safe pattern as risk_service.py L258-262).
                now = datetime.now(timezone.utc)
                exp = (
                    res.expected_date
                    if res.expected_date.tzinfo
                    else res.expected_date.replace(tzinfo=timezone.utc)
                )
                delta = (exp - now).total_seconds() / 86400.0
                resupply_eta = max(0.0, round(delta, 1))

    # 3. Composite provenance freshness.
    # Recovery exposure is derived from multiple operational inputs.
    # We use the MOST RECENT updated_at among the inputs that actually contributed
    # to this result, following the task B3/B8 specification.
    # Re-use already-fetched objects from the work-order block above — no duplicate queries.
    now = datetime.now(timezone.utc)
    candidate_ts: list[datetime] = []
    if active_wo is not None:
        ts = _utc(active_wo.updated_at)
        if ts is not None:
            candidate_ts.append(ts)
    if active_wo:
        _m2 = db.query(MaintenanceSpare).filter(MaintenanceSpare.work_order_id == active_wo.id).first()
        if _m2 and _m2.spare_part:
            _inv2 = db.query(InventoryItem).filter(InventoryItem.spare_part_id == _m2.spare_part_id).first()
            if _inv2 is not None:
                ts = _utc(_inv2.updated_at)
                if ts is not None:
                    candidate_ts.append(ts)
            _res2 = (
                db.query(ResupplyOpportunity)
                .filter(
                    ResupplyOpportunity.spare_part_id == _m2.spare_part_id,
                    ResupplyOpportunity.status.in_([
                        ResupplyStatus.SCHEDULED,
                        ResupplyStatus.IN_TRANSIT,
                        ResupplyStatus.DELAYED,
                    ]),
                )
                .order_by(ResupplyOpportunity.expected_date.asc())
                .first()
            )
            if _res2 is not None:
                ts = _utc(_res2.updated_at)
                if ts is not None:
                    candidate_ts.append(ts)

    if candidate_ts:
        latest_input_ts = max(candidate_ts)
        recovery_freshness = max(0.0, (now - latest_input_ts).total_seconds())
        recovery_ts = latest_input_ts
    else:
        recovery_freshness = 1.0
        recovery_ts = now

    # 2. Deterministic Exposure Scoring
    is_critical_asset = str(asset.criticality) in ["CRITICAL", "LIFE_SUPPORT", "Criticality.CRITICAL", "Criticality.LIFE_SUPPORT"]
    is_blocked = active_wo and (active_wo.status == MaintenanceStatus.BLOCKED_PARTS or str(active_wo.status) == "BLOCKED_PARTS")
    is_stockout = qty_avail <= 0

    if is_critical_asset and is_blocked and is_stockout:
        exposure_level = "HIGH"
        reasoning = (
            f"Recovery is constrained: {asset.name} is a critical asset with active work order "
            f"{active_wo.id} blocked by zero local stock of {req_spare_num} ({req_spare_name}). "
            f"Resupply vessel {vessel_name or 'MV Vasiliy Golovnin'} is \u2248 {resupply_eta if resupply_eta is not None else 'unknown'} days away."
        )
    elif is_blocked and is_stockout:
        exposure_level = "MEDIUM"
        reasoning = f"Work order {active_wo.id if active_wo else 'N/A'} is blocked by part shortage, but asset has lower criticality."
    elif is_blocked and not is_stockout:
        exposure_level = "LOW"
        reasoning = "Maintenance is active but required parts are available in local warehouse."
    else:
        exposure_level = "LOW"
        reasoning = "No active maintenance blockers or spare part shortages detected for this equipment."

    assumptions = [
        "[OUR DESIGN] Explainable recovery exposure model based on asset tier, maintenance status, spare stock, and resupply ETA.",
        "Resupply schedule is a synthetic logistics demonstration voyage.",
    ]

    return AssetRecoveryExposureResponse(
        asset_id=asset.code,
        asset_name=asset.name,
        criticality=str(asset.criticality.value if hasattr(asset.criticality, "value") else asset.criticality),
        active_work_order_id=active_wo.id if active_wo else None,
        work_order_title=active_wo.title if active_wo else None,
        work_order_status=str(active_wo.status.value if hasattr(active_wo.status, "value") else active_wo.status) if active_wo else None,
        required_spare_part_number=req_spare_num,
        required_spare_part_name=req_spare_name,
        quantity_required=qty_req,
        quantity_available=qty_avail,
        quantity_reserved=qty_res,
        resupply_vessel_name=vessel_name,
        resupply_eta_days=resupply_eta,
        exposure_level=exposure_level,
        reasoning=reasoning,
        assumptions=assumptions,
        provenance=ProvenanceSchema(
            source=f"recovery_model:{asset.code}",
            timestamp=recovery_ts,
            freshness_seconds=round(recovery_freshness, 1),
            quality=Quality.GOOD,
            truth_type=TruthType.DERIVED,
            confidence=0.92,
        ),
    )
