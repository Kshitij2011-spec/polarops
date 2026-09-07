"""API router for Canonical Operational Event Stream and demo simulation."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.events import (
    EventListResponse,
    OperationalEventSchema,
    ResetEventsResponse,
    SimulateEventRequest,
)
from app.services.event_service import (
    get_operational_events,
    record_operational_event,
    reset_operational_events,
    simulate_demo_event,
)

router = APIRouter(tags=["Events"])


@router.get("/events", response_model=EventListResponse)
@router.get("/api/v1/events", response_model=EventListResponse)
def list_events(
    station_id: str = Query(default="STATION-BHARATI", description="Station ID"),
    severity: Optional[str] = Query(default=None, description="Filter by severity e.g. INFO, WARNING, CRITICAL, SYSTEM"),
    event_type: Optional[str] = Query(default=None, description="Filter by event type e.g. THRESHOLD_BREACH, RISK_CHANGE"),
    limit: int = Query(default=50, ge=1, le=200, description="Max items to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> EventListResponse:
    """Retrieve chronologically ordered operational events for the station."""
    return get_operational_events(
        db=db,
        station_id=station_id,
        severity=severity,
        event_type=event_type,
        limit=limit,
        offset=offset,
    )


@router.post("/events/simulate", response_model=OperationalEventSchema)
@router.post("/api/v1/events/simulate", response_model=OperationalEventSchema)
def simulate_event(
    req: SimulateEventRequest = SimulateEventRequest(),
    db: Session = Depends(get_db),
) -> OperationalEventSchema:
    """Generate or advance a deterministic demonstration operational event."""
    return simulate_demo_event(
        db=db,
        station_id=req.station_id,
        step_index=req.event_step,
    )


@router.post("/events/reset", response_model=ResetEventsResponse)
@router.post("/api/v1/events/reset", response_model=ResetEventsResponse)
def reset_events(
    station_id: str = Query(default="STATION-BHARATI", description="Station ID to reset"),
    db: Session = Depends(get_db),
) -> ResetEventsResponse:
    """Reset the operational event stream for the specified station back to the canonical baseline."""
    return reset_operational_events(db=db, station_id=station_id)
