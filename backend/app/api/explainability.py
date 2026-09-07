"""API router for Deterministic Operational Explainability Layer."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.explainability import ExplanationQueryRequest, ExplanationResponse
from app.services.explainability_service import generate_explanation

router = APIRouter(tags=["Explainability"])


@router.get("/explain/{domain}/{entity_id}", response_model=ExplanationResponse)
@router.get("/api/v1/explain/{domain}/{entity_id}", response_model=ExplanationResponse)
def get_explanation(
    domain: str,
    entity_id: str,
    station_id: str = Query(default="STATION-BHARATI", description="Station ID"),
    db: Session = Depends(get_db),
) -> ExplanationResponse:
    """Retrieve structured deterministic operational explanation for an entity across domains."""
    return generate_explanation(
        db=db,
        domain=domain,
        entity_id=entity_id,
        station_id=station_id,
    )


@router.post("/explain", response_model=ExplanationResponse)
@router.post("/api/v1/explain", response_model=ExplanationResponse)
def post_explanation(
    req: ExplanationQueryRequest,
    db: Session = Depends(get_db),
) -> ExplanationResponse:
    """Query structured deterministic explanation via JSON request payload."""
    return generate_explanation(
        db=db,
        domain=req.domain,
        entity_id=req.entity_id,
        station_id=req.station_id,
    )
