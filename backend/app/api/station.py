"""Station situation awareness and environment API router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.station import StationOverviewResponse
from app.services.station_service import get_station_overview

router = APIRouter(prefix="/station", tags=["Station"])


@router.get("/overview", response_model=StationOverviewResponse)
def get_station_situation_overview(
    station_id: str = Query(
        default="STATION-BHARATI",
        description="Station identifier or code (e.g. STATION-BHARATI or BHARATI)",
    ),
    db: Session = Depends(get_db),
) -> StationOverviewResponse:
    """Return high-level situation awareness metrics, weather, and subsystem status."""
    overview = get_station_overview(db, station_id=station_id)
    if not overview:
        raise HTTPException(
            status_code=404,
            detail=f"Station with ID '{station_id}' was not found.",
        )
    return overview
