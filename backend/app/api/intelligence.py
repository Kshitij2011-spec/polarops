"""Operational Intelligence consolidation and causal reasoning API router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.intelligence import OperationalInsightResponse
from app.services.intelligence_service import get_station_operational_intelligence

router = APIRouter(tags=["Operational Intelligence"])


@router.get("/intelligence/narrative", response_model=OperationalInsightResponse)
@router.get("/intelligence", response_model=OperationalInsightResponse)
@router.get("/operational-intelligence/narrative", response_model=OperationalInsightResponse)
@router.get("/operational-intelligence", response_model=OperationalInsightResponse)
def get_operational_intelligence(
    station_id: str = Query(
        default="STATION-BHARATI",
        description="Station ID or Code (e.g. STATION-BHARATI or STATION-MAITRI)",
    ),
    db: Session = Depends(get_db),
) -> OperationalInsightResponse:
    """Retrieve synthesized 7-stage deterministic causal narrative for station operational intelligence.
    
    Traverses:
    CHANGE -> CONTEXT -> DEPENDENCY -> RISK -> CONSEQUENCE -> SCENARIO -> ACTION
    
    Synthesizes real sensor telemetry, weather, BFS dependencies, composite risk scores,
    recovery constraints, and scenario projections.
    """
    insight = get_station_operational_intelligence(db, station_id=station_id)
    if not insight:
        raise HTTPException(
            status_code=404,
            detail=f"Operational intelligence for station '{station_id}' was not found.",
        )
    return insight
