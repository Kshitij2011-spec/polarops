"""API router for Scientific Instrument Continuity and Observation Buffering."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.resilience import (
    BufferObservationRequest,
    ScienceInstrumentDetailResponse,
    ScienceObservationSchema,
)
from app.services.science_service import (
    buffer_science_observation,
    get_all_instruments,
    get_instrument_detail,
    record_science_observation,
)

router = APIRouter(prefix="/science", tags=["Science Continuity"])


@router.get("/instruments", response_model=List[ScienceInstrumentDetailResponse])
def list_science_instruments(
    station_id: str = Query("STATION-BHARATI", description="Station identifier"),
    db: Session = Depends(get_db),
) -> List[ScienceInstrumentDetailResponse]:
    """Retrieve all scientific experiment instruments and data buffer statuses."""
    return get_all_instruments(db, station_id=station_id)


@router.get("/instruments/{instrument_id}/observations", response_model=ScienceInstrumentDetailResponse)
def get_instrument_observations(
    instrument_id: str,
    db: Session = Depends(get_db),
) -> ScienceInstrumentDetailResponse:
    """Retrieve observation history and local buffer metrics for an instrument."""
    inst = get_instrument_detail(db, instrument_id=instrument_id)
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instrument '{instrument_id}' not found.")
    return inst


@router.post("/observations/buffer", response_model=ScienceObservationSchema)
def buffer_observation(
    req: BufferObservationRequest,
    db: Session = Depends(get_db),
) -> ScienceObservationSchema:
    """Buffer a scientific measurement locally while operating disconnected."""
    try:
        return buffer_science_observation(db, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/observations", response_model=ScienceObservationSchema)
def create_observation(
    req: BufferObservationRequest,
    force_buffer: Optional[bool] = Query(None, description="Force buffering independent of link state"),
    db: Session = Depends(get_db),
) -> ScienceObservationSchema:
    """Record a scientific measurement with automatic link-state continuity handling."""
    try:
        return record_science_observation(db, req, force_buffer=force_buffer)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
