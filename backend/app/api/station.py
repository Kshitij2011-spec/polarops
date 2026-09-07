"""Station situation awareness and environment API router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import OperationalEventType
from app.schemas.station import StationComparisonResponse, StationOverviewResponse
from app.services.event_service import record_operational_event
from app.services.station_service import get_station_comparison, get_station_overview

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


@router.get("/comparison", response_model=StationComparisonResponse)
def get_station_comparison_endpoint(
    station_a_id: str = Query(default="STATION-BHARATI", description="Primary station ID or code"),
    station_b_id: str = Query(default="STATION-MAITRI", description="Comparison station ID or code"),
    record_event: bool = Query(default=False, description="Whether to record explicit analysis event"),
    db: Session = Depends(get_db),
) -> StationComparisonResponse:
    """Evaluate deterministic cross-station operational comparison between two research stations."""
    comparison = get_station_comparison(db, station_a_id=station_a_id, station_b_id=station_b_id)
    if record_event:
        try:
            record_operational_event(
                db=db,
                station_id=comparison.station_a.station_id,
                event_type=OperationalEventType.CROSS_STATION_ANALYSIS,
                severity="SYSTEM",
                entity_type="PORTFOLIO",
                entity_id="STATION_COMPARISON",
                title=f"Cross-station operational comparison evaluated ({comparison.station_a.code} vs {comparison.station_b.code})",
                summary=(
                    f"Operational headroom analysis compared {comparison.station_a.code} and {comparison.station_b.code}. "
                    f"{comparison.higher_pressure_station_id} under greater modeled pressure."
                ),
                source="SYNTHETIC_SIMULATION",
                truth_type="DERIVED",
                metadata={
                    "station_a": comparison.station_a.code,
                    "station_b": comparison.station_b.code,
                    "higher_pressure_station_id": comparison.higher_pressure_station_id,
                    "differences_count": len(comparison.differences),
                    "considerations_count": len(comparison.considerations),
                },
            )
        except Exception:
            pass
    return comparison


@router.post("/comparison/evaluate", response_model=StationComparisonResponse)
def evaluate_station_comparison_explicit(
    station_a_id: str = Query(default="STATION-BHARATI", description="Primary station ID or code"),
    station_b_id: str = Query(default="STATION-MAITRI", description="Comparison station ID or code"),
    db: Session = Depends(get_db),
) -> StationComparisonResponse:
    """Explicitly trigger cross-station operational comparison and log canonical timeline event."""
    return get_station_comparison_endpoint(
        station_a_id=station_a_id,
        station_b_id=station_b_id,
        record_event=True,
        db=db,
    )
