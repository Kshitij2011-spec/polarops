"""Domain service for asset telemetry and relational dependency traversal."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.models import (
    Asset,
    AssetCategory,
    AssetDependency,
    AssetStatus,
    Measurement,
    Sensor,
)
from app.models.enums import Quality, TruthType
from app.schemas.asset import (
    AssetDependenciesResponse,
    AssetDetailResponse,
    AssetListItem,
    AssetMetricSchema,
    DownstreamImpact,
    DownstreamServiceImpact,
    UpstreamDependencyItem,
)
from app.schemas.common import ProvenanceSchema
from app.services.sensor_health_service import (
    _confidence_from_quality,
    _resolve_quality,
    _resolve_truth_type,
)


def list_assets(
    db: Session,
    station_id: str = "STATION-BHARATI",
    category: Optional[AssetCategory] = None,
    status: Optional[AssetStatus] = None,
) -> list[AssetListItem]:
    """Query list of station assets with optional category or status filters."""
    query = db.query(Asset).filter(Asset.station_id == station_id)
    if category:
        query = query.filter(Asset.category == category)
    if status:
        query = query.filter(Asset.status == status)

    assets = query.order_by(Asset.code.asc()).all()
    return [
        AssetListItem(
            id=a.id,
            code=a.code,
            name=a.name,
            category=a.category,
            status=a.status,
            health_score=a.health_score,
            criticality=a.criticality,
            zone_id=a.zone_id,
        )
        for a in assets
    ]


def get_asset_detail(db: Session, asset_id: str) -> AssetDetailResponse | None:
    """Retrieve full asset profile with latest sensor readings and provenance."""
    asset = (
        db.query(Asset)
        .filter((Asset.id == asset_id) | (Asset.code == asset_id))
        .first()
    )
    if not asset:
        return None

    metrics: list[AssetMetricSchema] = []
    latest_timestamp = asset.updated_at
    latest_source = asset.source
    latest_truth_type = TruthType.MEASURED
    latest_quality = Quality.GOOD

    for sensor in asset.sensors:
        latest_meas = (
            db.query(Measurement)
            .filter(Measurement.sensor_id == sensor.id)
            .order_by(Measurement.timestamp.desc())
            .first()
        )

        val = latest_meas.value if latest_meas else 0.0
        if latest_meas:
            latest_timestamp = latest_meas.timestamp
            latest_source = latest_meas.source
            latest_truth_type = latest_meas.truth_type
            # B6 fix: capture actual measurement quality (not hardcoded GOOD)
            latest_quality = _resolve_quality(latest_meas.quality)

        # Assess threshold status
        metric_status = "NOMINAL"
        if sensor.critical_threshold is not None:
            if (sensor.metric_key == "efficiency_pct" and val <= sensor.critical_threshold) or (
                sensor.metric_key != "efficiency_pct" and val >= sensor.critical_threshold
            ):
                metric_status = "CRITICAL"
        if metric_status == "NOMINAL" and sensor.warning_threshold is not None:
            if (sensor.metric_key == "efficiency_pct" and val <= sensor.warning_threshold) or (
                sensor.metric_key != "efficiency_pct" and val >= sensor.warning_threshold
            ):
                metric_status = "WARNING"

        metrics.append(
            AssetMetricSchema(
                key=sensor.metric_key,
                name=sensor.name,
                value=val,
                unit=sensor.unit,
                status=metric_status,
                warning_threshold=sensor.warning_threshold,
                critical_threshold=sensor.critical_threshold,
            )
        )

    now = datetime.now(timezone.utc)
    if latest_timestamp and latest_timestamp.tzinfo is None:
        latest_timestamp = latest_timestamp.replace(tzinfo=timezone.utc)
    freshness = (
        max(0.0, (now - latest_timestamp).total_seconds())
        if latest_timestamp
        else 1.0
    )

    # B6 fix: provenance reflects actual measurement quality and confidence
    provenance = ProvenanceSchema(
        source=latest_source,
        timestamp=latest_timestamp or now,
        freshness_seconds=round(freshness, 1),
        quality=latest_quality,
        truth_type=_resolve_truth_type(latest_truth_type),
        confidence=_confidence_from_quality(latest_quality),
    )

    return AssetDetailResponse(
        asset_id=asset.id,
        code=asset.code,
        name=asset.name,
        category=asset.category,
        zone_id=asset.zone_id,
        status=asset.status,
        health_score=asset.health_score,
        criticality=asset.criticality,
        metrics=metrics,
        provenance=provenance,
    )


def get_asset_dependencies(
    db: Session, asset_id: str
) -> AssetDependenciesResponse | None:
    """Retrieve upstream dependency assets and downstream blast-radius impact."""
    asset = (
        db.query(Asset)
        .filter((Asset.id == asset_id) | (Asset.code == asset_id))
        .first()
    )
    if not asset:
        return None

    # Upstream: where this asset is target
    upstream_deps = (
        db.query(AssetDependency)
        .filter(AssetDependency.target_asset_id == asset.id)
        .all()
    )
    upstream_items: list[UpstreamDependencyItem] = []
    for dep in upstream_deps:
        if dep.source_asset:
            upstream_items.append(
                UpstreamDependencyItem(
                    asset_id=dep.source_asset.id,
                    code=dep.source_asset.code,
                    name=dep.source_asset.name,
                    type=dep.dependency_type,
                    impact_factor=dep.impact_factor,
                    is_redundant=dep.is_redundant,
                )
            )

    # Downstream: where this asset is source
    downstream_deps = (
        db.query(AssetDependency)
        .filter(AssetDependency.source_asset_id == asset.id)
        .all()
    )

    affected_subsystems: list[str] = []
    affected_services: list[DownstreamServiceImpact] = []
    affected_zones: set[str] = set()

    for dep in downstream_deps:
        if dep.target_asset:
            if dep.target_asset.category not in affected_subsystems:
                affected_subsystems.append(str(dep.target_asset.category))
            if dep.target_asset.zone_id:
                affected_zones.add(dep.target_asset.zone_id)
        if dep.target_service:
            affected_services.append(
                DownstreamServiceImpact(
                    service_id=dep.target_service.id,
                    code=dep.target_service.code,
                    name=dep.target_service.name,
                    criticality=dep.target_service.criticality,
                )
            )

    return AssetDependenciesResponse(
        asset_id=asset.id,
        upstream_dependencies=upstream_items,
        downstream_impact=DownstreamImpact(
            affected_subsystems=affected_subsystems,
            affected_services=affected_services,
            affected_zones=sorted(list(affected_zones)),
        ),
    )
