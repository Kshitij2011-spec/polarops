"""API router for Communication Resilience, Priority Queue, and Offline Sync."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.resilience import (
    CommsLinkStatusResponse,
    CreateEventRequest,
    ResetSimulationResponse,
    RestoreLinkResponse,
    SyncQueueItemSchema,
    SyncQueueListResponse,
)
from app.services.sync_service import (
    create_queued_event,
    get_comms_status,
    get_sync_queue,
    reset_resilience_simulation,
    restore_and_sync_all,
    retry_failed_item,
    simulate_link_degradation,
    simulate_link_failure,
)

router = APIRouter(prefix="/resilience", tags=["Resilience & Sync"])


@router.get("/status", response_model=CommsLinkStatusResponse)
def get_link_status(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> CommsLinkStatusResponse:
    """Return satellite communication link status, latency, and unsynced queue count."""
    return get_comms_status(db, station_id=station_id)


@router.get("/queue", response_model=SyncQueueListResponse)
def get_priority_queue(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> SyncQueueListResponse:
    """Return offline sync queue items deterministically sorted by priority ASC, created_at ASC."""
    return get_sync_queue(db, station_id=station_id)


@router.post("/simulate-offline", response_model=CommsLinkStatusResponse)
def trigger_simulate_offline(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> CommsLinkStatusResponse:
    """Simulate satellite communication outage (ONLINE -> OFFLINE)."""
    return simulate_link_failure(db, station_id=station_id)


@router.post("/simulate-degraded", response_model=CommsLinkStatusResponse)
def trigger_simulate_degraded(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    latency_ms: int = Query(1450, description="Degraded link latency in ms"),
    bandwidth_kbps: int = Query(256, description="Degraded link bandwidth in kbps"),
    db: Session = Depends(get_db),
) -> CommsLinkStatusResponse:
    """Simulate satellite communication link degradation (reduced bandwidth, elevated latency)."""
    return simulate_link_degradation(
        db, station_id=station_id, latency_ms=latency_ms, bandwidth_kbps=bandwidth_kbps
    )


@router.post("/restore", response_model=RestoreLinkResponse)
def trigger_restore_and_sync(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> RestoreLinkResponse:
    """Simulate link reconnection, executing priority-aware transfer and SHA-256 verification."""
    return restore_and_sync_all(db, station_id=station_id)


@router.post("/events", response_model=SyncQueueItemSchema)
def queue_local_event(
    req: CreateEventRequest,
    db: Session = Depends(get_db),
) -> SyncQueueItemSchema:
    """Buffer a local event into the priority offline queue while operating offline."""
    return create_queued_event(db, req)


@router.post("/retry/{queue_id}", response_model=SyncQueueItemSchema)
def retry_item(
    queue_id: str,
    db: Session = Depends(get_db),
) -> SyncQueueItemSchema:
    """Retry an item that failed transmission or checksum verification."""
    try:
        return retry_failed_item(db, queue_id=queue_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/reset", response_model=ResetSimulationResponse)
def reset_simulation(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> ResetSimulationResponse:
    """Reset Day 4 resilience simulation state to deterministic baseline."""
    return reset_resilience_simulation(db, station_id=station_id)
