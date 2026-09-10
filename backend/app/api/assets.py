"""Asset intelligence, multi-hop dependency, telemetry trends, and explainable risk API router."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import AssetCategory, AssetStatus
from app.schemas.asset import (
    AssetDependenciesResponse,
    AssetDetailResponse,
    AssetListItem,
    AssetRiskResponse,
    AssetTelemetryResponse,
)
from app.schemas.sensor_health import AssetSensorHealthResponse
from app.services.asset_service import (
    get_asset_detail,
    list_assets,
)
from app.services.dependency_service import traverse_asset_dependencies
from app.services.risk_service import calculate_asset_risk
from app.services.sensor_health_service import get_asset_sensor_health
from app.services.telemetry_service import get_asset_telemetry_history

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=list[AssetListItem])
def get_assets_list(
    station_id: str = Query(default="STATION-BHARATI", description="Station ID"),
    category: Optional[AssetCategory] = Query(default=None, description="Filter by category"),
    status: Optional[AssetStatus] = Query(default=None, description="Filter by status"),
    db: Session = Depends(get_db),
) -> list[AssetListItem]:
    """Retrieve list of station assets with optional category or status filters."""
    return list_assets(db, station_id=station_id, category=category, status=status)


@router.get("/{asset_id}", response_model=AssetDetailResponse)
def get_asset_by_id(
    asset_id: str,
    db: Session = Depends(get_db),
) -> AssetDetailResponse:
    """Retrieve detailed telemetry metrics, threshold status, and provenance for an asset."""
    detail = get_asset_detail(db, asset_id=asset_id)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Asset with ID '{asset_id}' was not found in station equipment registry.",
        )
    return detail


@router.get("/{asset_id}/dependencies", response_model=AssetDependenciesResponse)
def get_asset_dependency_tree(
    asset_id: str,
    max_depth: int = Query(default=5, ge=1, le=10, description="Maximum BFS traversal depth"),
    db: Session = Depends(get_db),
) -> AssetDependenciesResponse:
    """Retrieve multi-hop dependency graph, downstream equipment/services, and cascade paths."""
    deps = traverse_asset_dependencies(db, asset_id=asset_id, max_depth=max_depth)
    if not deps:
        raise HTTPException(
            status_code=404,
            detail=f"Asset with ID '{asset_id}' was not found.",
        )
    return deps


@router.get("/{asset_id}/telemetry", response_model=AssetTelemetryResponse)
def get_asset_telemetry(
    asset_id: str,
    limit: int = Query(default=50, ge=1, le=200, description="Max chronological points per series"),
    db: Session = Depends(get_db),
) -> AssetTelemetryResponse:
    """Retrieve chronological sensor measurements, threshold statuses, and deterministic trend calculations."""
    telemetry = get_asset_telemetry_history(db, asset_id=asset_id, limit_points=limit)
    if not telemetry:
        raise HTTPException(
            status_code=404,
            detail=f"Asset with ID '{asset_id}' was not found.",
        )
    return telemetry


@router.get("/{asset_id}/risk", response_model=AssetRiskResponse)
def get_asset_risk_assessment(
    asset_id: str,
    db: Session = Depends(get_db),
) -> AssetRiskResponse:
    """Retrieve explainable 6-factor composite operational risk score and structured evidence."""
    risk = calculate_asset_risk(db, asset_id=asset_id)
    if not risk:
        raise HTTPException(
            status_code=404,
            detail=f"Asset with ID '{asset_id}' was not found.",
        )
    return risk


@router.get("/{asset_id}/sensor-health", response_model=AssetSensorHealthResponse)
def get_asset_sensor_health_summary(
    asset_id: str,
    db: Session = Depends(get_db),
) -> AssetSensorHealthResponse:
    """Retrieve deterministic sensor freshness and health classification for all sensors on an asset.

    Health (FRESH / STALE / UNKNOWN) reflects measurement recency only.
    Quality (GOOD / SUSPECT / BAD) reflects signal trustworthiness and is preserved independently.
    Both dimensions are returned for each sensor, enabling truthful Digital Twin data-quality reporting.
    """
    health = get_asset_sensor_health(db, asset_id=asset_id)
    if not health:
        raise HTTPException(
            status_code=404,
            detail=f"Asset with ID '{asset_id}' was not found in station equipment registry.",
        )
    return health
