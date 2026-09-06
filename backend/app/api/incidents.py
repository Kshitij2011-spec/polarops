"""API router for Incident Workspace and Response Actions."""

from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import IncidentStatus
from app.schemas.resilience import (
    IncidentActionCreateRequest,
    IncidentActionSchema,
    IncidentCreateRequest,
    IncidentDetailResponse,
    IncidentListItemResponse,
)
from app.services.incident_service import (
    add_incident_action,
    create_incident,
    get_all_incidents,
    get_incident_detail,
    update_incident_status,
)

router = APIRouter(prefix="/incidents", tags=["Incidents & Actions"])


class IncidentStatusUpdateRequest(BaseModel):
    status: IncidentStatus


@router.get("", response_model=List[IncidentListItemResponse])
def list_incidents(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> List[IncidentListItemResponse]:
    """Retrieve all incidents for a station."""
    return get_all_incidents(db, station_id=station_id)


@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
) -> IncidentDetailResponse:
    """Retrieve detailed common operating picture for an incident with blast radius and risk."""
    inc = get_incident_detail(db, incident_id=incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")
    return inc


@router.post("", response_model=IncidentDetailResponse)
def open_incident(
    req: IncidentCreateRequest,
    db: Session = Depends(get_db),
) -> IncidentDetailResponse:
    """Create and open a new operational incident."""
    return create_incident(db, req=req)


@router.post("/{incident_id}/actions", response_model=IncidentActionSchema)
def log_action(
    incident_id: str,
    req: IncidentActionCreateRequest,
    db: Session = Depends(get_db),
) -> IncidentActionSchema:
    """Log an operator response action against an active incident."""
    try:
        return add_incident_action(db, incident_id=incident_id, req=req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{incident_id}/status", response_model=IncidentDetailResponse)
def patch_incident_status(
    incident_id: str,
    body: Optional[IncidentStatusUpdateRequest] = Body(None),
    status: Optional[IncidentStatus] = Query(None),
    db: Session = Depends(get_db),
) -> IncidentDetailResponse:
    """Update incident lifecycle status (ACTIVE -> CONTAINED -> RESOLVED)."""
    new_status = None
    if body and body.status:
        new_status = body.status
    elif status:
        new_status = status

    if not new_status:
        raise HTTPException(status_code=400, detail="Missing 'status' in request body or query param.")

    try:
        return update_incident_status(db, incident_id=incident_id, new_status=new_status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
