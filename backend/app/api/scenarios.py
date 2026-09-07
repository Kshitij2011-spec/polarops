"""What-If Scenario Simulation API router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.scenario import (
    CrossStationScenarioRequest,
    CrossStationScenarioResponse,
    ScenarioSimulateRequest,
    ScenarioSimulateResponse,
)
from app.services.scenario_service import (
    simulate_cross_station_coordination,
    simulate_operational_scenario,
)

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.post("/simulate", response_model=ScenarioSimulateResponse)
def simulate_scenario(
    request: ScenarioSimulateRequest,
    db: Session = Depends(get_db),
) -> ScenarioSimulateResponse:
    """Execute in-memory, deterministic simulation of hypothetical operational disruptions.

    Does NOT mutate any database entity or live station state.
    """
    if request.scenario_type != "GENERATOR_FAILURE":
        raise HTTPException(
            status_code=400,
            detail=f"Scenario type '{request.scenario_type}' is not supported in MVP. Supported: 'GENERATOR_FAILURE'.",
        )

    try:
        response = simulate_operational_scenario(db, request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


@router.post("/cross-station", response_model=CrossStationScenarioResponse)
def simulate_cross_station(
    request: CrossStationScenarioRequest,
    db: Session = Depends(get_db),
) -> CrossStationScenarioResponse:
    """Execute stateless deterministic cross-station coordination scenario evaluation.

    Does NOT mutate any database entity or live station state.
    """
    try:
        response = simulate_cross_station_coordination(db, request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

