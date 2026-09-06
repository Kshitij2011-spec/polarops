"""Domain service for Incident Workspace, Action Tracking, and Operational Memory."""

from datetime import datetime, timezone
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.entities import Asset, Incident, OperationalAction, OperationalMemory, Service
from app.models.enums import IncidentSeverity, IncidentStatus
from app.schemas.resilience import (
    CreateMemoryRequest,
    IncidentActionCreateRequest,
    IncidentActionSchema,
    IncidentCreateRequest,
    IncidentDetailResponse,
    IncidentListItemResponse,
    MemorySearchResponse,
    OperationalMemorySchema,
)
from app.services.dependency_service import traverse_asset_dependencies
from app.services.risk_service import calculate_asset_risk


def get_all_incidents(db: Session, station_id: str = "STATION-BHARATI") -> List[IncidentListItemResponse]:
    """Retrieve all operational incidents for a station."""
    incidents = (
        db.query(Incident)
        .filter(Incident.station_id == station_id)
        .order_by(Incident.started_at.desc())
        .all()
    )
    results = []
    for inc in incidents:
        results.append(
            IncidentListItemResponse(
                id=inc.id,
                station_id=inc.station_id,
                title=inc.title,
                severity=IncidentSeverity(inc.severity),
                status=IncidentStatus(inc.status),
                location=inc.location,
                started_at=inc.started_at,
                resolved_at=inc.resolved_at,
                actions_count=len(inc.actions),
            )
        )
    return results


def get_incident_detail(db: Session, incident_id: str) -> Optional[IncidentDetailResponse]:
    """Retrieve detailed common operating picture for an incident with multi-hop blast radius and risk."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return None

    # Determine primary asset from description or default to G-02
    target_asset_id = "G-02" if "G-02" in inc.title or "G-02" in inc.description else "G-01"

    # Reuse Day 2 Dependency Graph BFS Traversal
    dep_res = traverse_asset_dependencies(db, asset_id=target_asset_id, max_depth=5)
    affected_assets = []
    affected_services = []
    if dep_res:
        affected_assets = [
            {
                "asset_id": node.id,
                "name": node.name,
                "criticality": str(node.criticality) if node.criticality else "MEDIUM",
                "distance": node.depth,
                "impact_factor": 1.0,
            }
            for node in dep_res.nodes
            if node.node_type == "ASSET" and node.id != target_asset_id
        ]
        affected_services = [
            {
                "service_id": srv.service_id,
                "name": srv.name,
                "criticality": str(srv.criticality),
                "status": "DEGRADED" if inc.status == IncidentStatus.ACTIVE else "NOMINAL",
                "rationale": f"Downstream dependency on {target_asset_id} under active incident {inc.id}.",
            }
            for srv in dep_res.downstream_impact.affected_services
        ]

    # Reuse Day 2 Explainable Risk Engine
    risk_res = calculate_asset_risk(db, asset_id=target_asset_id)
    modeled_risk = risk_res.score if risk_res else 85

    # Advisory Prototype Decision Options
    decision_options = [
        {
            "code": "DISPATCH_G01_PRIORITY",
            "title": "Prioritize G-01 Generation Dispatch",
            "category": "GENERATION_DISPATCH",
            "description": "Dispatch Primary Genset G-01 to carry station grid up to 280 kW max continuous limit.",
            "risk_reduction_tier": "HIGH",
        },
        {
            "code": "AUX_BOILER_B01_TRANSFER",
            "title": "Transfer Thermal Load to Auxiliary Boiler B-01",
            "category": "THERMAL_MANAGEMENT",
            "description": "Initiate 35-minute preheat sequence on Auxiliary Boiler B-01 to pick up Habitat Zone 2 space heating.",
            "risk_reduction_tier": "HIGH",
        },
        {
            "code": "SHED_SCIENCE_RADAR_LOAD",
            "title": "Shed Non-Critical Science Payloads",
            "category": "LOAD_SHEDDING",
            "description": "De-energize Upper Atmosphere Radar Bay (Zone 4) to shed 35 kW from electrical bus.",
            "risk_reduction_tier": "MEDIUM",
        },
        {
            "code": "ESCALATE_AIRLIFT_SPARE",
            "title": "Escalate SK-402 Emergency Airlift Contingency",
            "category": "LOGISTICS_ESCALATION",
            "description": "Request priority ski-equipped flight for Fuel Pump Seal Kit SK-402.",
            "risk_reduction_tier": "HIGH",
        },
    ]

    actions_list = [
        IncidentActionSchema(
            id=act.id,
            incident_id=act.incident_id,
            action_code=act.action_code,
            description=act.description,
            executed_by=act.executed_by,
            executed_at=act.executed_at,
            outcome_status=act.outcome_status,
        )
        for act in inc.actions
    ]

    return IncidentDetailResponse(
        id=inc.id,
        station_id=inc.station_id,
        title=inc.title,
        severity=IncidentSeverity(inc.severity),
        status=IncidentStatus(inc.status),
        location=inc.location,
        description=inc.description,
        started_at=inc.started_at,
        resolved_at=inc.resolved_at,
        affected_assets=affected_assets,
        affected_services=affected_services,
        modeled_risk_score=modeled_risk,
        available_response_options=decision_options,
        actions=actions_list,
        truth_type="DERIVED",
    )


def create_incident(db: Session, req: IncidentCreateRequest) -> IncidentDetailResponse:
    """Create a new operational incident and persist it."""
    now_utc = datetime.now(timezone.utc)
    inc_id = f"INC-2026-{uuid.uuid4().hex[:4].upper()}"
    new_inc = Incident(
        id=inc_id,
        station_id=req.station_id,
        title=req.title,
        severity=req.severity,
        status=IncidentStatus.ACTIVE,
        location=req.location,
        description=req.description,
        started_at=now_utc,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)
    return get_incident_detail(db, new_inc.id)


def add_incident_action(db: Session, incident_id: str, req: IncidentActionCreateRequest) -> IncidentActionSchema:
    """Log a response action executed by an operator."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise ValueError(f"Incident '{incident_id}' not found.")

    action_id = f"ACT-{uuid.uuid4().hex[:6].upper()}"
    now_utc = datetime.now(timezone.utc)
    action = OperationalAction(
        id=action_id,
        incident_id=incident_id,
        action_code=req.action_code,
        description=req.description,
        executed_by=req.executed_by,
        executed_at=now_utc,
        outcome_status=req.outcome_status,
        created_at=now_utc,
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    return IncidentActionSchema(
        id=action.id,
        incident_id=action.incident_id,
        action_code=action.action_code,
        description=action.description,
        executed_by=action.executed_by,
        executed_at=action.executed_at,
        outcome_status=action.outcome_status,
    )


def update_incident_status(db: Session, incident_id: str, new_status: IncidentStatus) -> IncidentDetailResponse:
    """Transition an incident lifecycle state (ACTIVE -> CONTAINED -> RESOLVED)."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise ValueError(f"Incident '{incident_id}' not found.")

    inc.status = new_status
    if new_status == IncidentStatus.RESOLVED and not inc.resolved_at:
        inc.resolved_at = datetime.now(timezone.utc)
    inc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inc)

    return get_incident_detail(db, inc.id)


def record_operational_memory(db: Session, req: CreateMemoryRequest) -> OperationalMemorySchema:
    """Explicit human-controlled workflow recording an incident into organizational memory."""
    mem_id = f"MEM-{datetime.now(timezone.utc).year}-W{uuid.uuid4().hex[:4].upper()}"
    now_utc = datetime.now(timezone.utc)

    context_str = f"Decision: {req.decision} | Action Taken: {req.action_taken} | Outcome: {req.outcome}"
    new_mem = OperationalMemory(
        id=mem_id,
        station_id=req.station_id,
        event_type=req.event_type,
        title=req.title,
        context_summary=context_str,
        lessons_learned=req.lesson,
        created_at=now_utc,
    )
    db.add(new_mem)
    db.commit()
    db.refresh(new_mem)

    return OperationalMemorySchema(
        id=new_mem.id,
        station_id=new_mem.station_id,
        event_type=new_mem.event_type,
        title=new_mem.title,
        context_summary=new_mem.context_summary,
        lessons_learned=new_mem.lessons_learned,
        decision=req.decision,
        action_taken=req.action_taken,
        outcome=req.outcome,
        created_at=new_mem.created_at,
    )


def search_operational_memory(db: Session, query: Optional[str] = None, station_id: str = "STATION-BHARATI") -> MemorySearchResponse:
    """Perform deterministic keyword search across stored operational memories and lessons learned."""
    q = db.query(OperationalMemory).filter(OperationalMemory.station_id == station_id)
    if query and query.strip():
        term = f"%{query.strip().lower()}%"
        q = q.filter(
            OperationalMemory.title.ilike(term)
            | OperationalMemory.context_summary.ilike(term)
            | OperationalMemory.lessons_learned.ilike(term)
            | OperationalMemory.event_type.ilike(term)
        )

    records = q.order_by(OperationalMemory.created_at.desc()).all()
    mem_schemas = []
    for r in records:
        mem_schemas.append(
            OperationalMemorySchema(
                id=r.id,
                station_id=r.station_id,
                event_type=r.event_type,
                title=r.title,
                context_summary=r.context_summary,
                lessons_learned=r.lessons_learned,
                created_at=r.created_at,
            )
        )

    return MemorySearchResponse(
        query=query,
        total_count=len(mem_schemas),
        memories=mem_schemas,
    )
