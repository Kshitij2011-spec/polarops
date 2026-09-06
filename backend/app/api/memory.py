"""API router for Operational Memory and Institutional Knowledge."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.resilience import (
    CreateMemoryRequest,
    MemorySearchResponse,
    OperationalMemorySchema,
)
from app.services.incident_service import (
    record_operational_memory,
    search_operational_memory,
)

router = APIRouter(prefix="/memory", tags=["Operational Memory"])


@router.get("", response_model=MemorySearchResponse)
def search_memory(
    q: Optional[str] = Query(None, description="Keyword search query"),
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> MemorySearchResponse:
    """Perform keyword search across stored operational memories and post-mortem lessons."""
    return search_operational_memory(db, query=q, station_id=station_id)


@router.post("", response_model=OperationalMemorySchema)
def record_memory(
    req: CreateMemoryRequest,
    db: Session = Depends(get_db),
) -> OperationalMemorySchema:
    """Record an operational memory entry from a resolved incident or post-mortem."""
    return record_operational_memory(db, req=req)
