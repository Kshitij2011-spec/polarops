"""Asset, telemetry metric, multi-hop dependency, and explainable risk Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.enums import AssetCategory, AssetStatus, Criticality, DependencyType
from app.schemas.common import ProvenanceSchema


class AssetMetricSchema(BaseModel):
    """Latest reading and threshold boundaries for an asset sensor."""

    key: str
    name: str
    value: float
    unit: str
    status: str  # NOMINAL, WARNING, CRITICAL
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None


class AssetListItem(BaseModel):
    """Summarized asset item for list queries."""

    id: str
    code: str
    name: str
    category: AssetCategory
    status: AssetStatus
    health_score: int
    criticality: Criticality
    zone_id: Optional[str] = None


class AssetDetailResponse(BaseModel):
    """Detailed asset profile with live telemetry metrics and provenance metadata."""

    asset_id: str
    code: str
    name: str
    category: AssetCategory
    zone_id: Optional[str] = None
    status: AssetStatus
    health_score: int
    criticality: Criticality
    metrics: list[AssetMetricSchema]
    provenance: ProvenanceSchema


# ── MULTI-HOP DEPENDENCY SCHEMAS ───────────────────────────────────────────

class UpstreamDependencyItem(BaseModel):
    """Upstream asset required for this equipment's operation."""

    asset_id: str
    code: str
    name: str
    type: DependencyType
    impact_factor: float
    is_redundant: bool


class DownstreamServiceImpact(BaseModel):
    """Service affected by this asset."""

    service_id: str
    code: str
    name: str
    criticality: Criticality


class DownstreamImpact(BaseModel):
    """Downstream systems, services, and zones affected if this asset fails."""

    affected_subsystems: list[str]
    affected_services: list[DownstreamServiceImpact]
    affected_zones: list[str]


class DependencyNode(BaseModel):
    """Graph node representing an asset, service, or spatial zone in blast radius."""

    id: str
    code: str
    name: str
    node_type: str  # "ASSET", "SERVICE", "ZONE"
    category: Optional[str] = None
    criticality: Optional[str] = None
    depth: int = 0
    status: Optional[str] = None


class DependencyEdge(BaseModel):
    """Directed dependency link between two nodes."""

    source_id: str
    target_id: str
    dependency_type: str
    impact_factor: float = 1.0
    is_redundant: bool = False


class AssetDependenciesResponse(BaseModel):
    """Multi-hop relational dependency map for root-cause and blast-radius exploration."""

    asset_id: str
    upstream_dependencies: list[UpstreamDependencyItem] = []
    downstream_impact: DownstreamImpact
    nodes: list[DependencyNode] = []
    edges: list[DependencyEdge] = []
    max_depth: int = 0
    paths: list[str] = []
    total_downstream_assets: int = 0
    total_affected_services: int = 0
    total_affected_zones: int = 0


# ── TELEMETRY TIME-SERIES SCHEMAS ──────────────────────────────────────────

class TelemetryPoint(BaseModel):
    """Individual historical sensor measurement point."""

    timestamp: datetime
    value: float
    quality: str = "GOOD"
    truth_type: str = "MEASURED"


class AssetTelemetrySeries(BaseModel):
    """Chronological time-series measurements and trend analysis for a sensor."""

    metric_key: str
    metric_name: str
    unit: str
    current_value: float
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    threshold_status: str  # "NOMINAL", "WARNING", "CRITICAL"
    trend: str  # "RISING", "FALLING", "STABLE"
    trend_description: str
    points: list[TelemetryPoint]


class AssetTelemetryResponse(BaseModel):
    """Historical sensor telemetry payload for trend visualization."""

    asset_id: str
    asset_name: str
    series: list[AssetTelemetrySeries]
    provenance: ProvenanceSchema


# ── EXPLAINABLE RISK ENGINE SCHEMAS ────────────────────────────────────────

class RiskFactorItem(BaseModel):
    """Individual factor contributing to composite operational risk."""

    factor: str
    title: str
    score: int
    max_score: int
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    evidence: str


class AssetRiskResponse(BaseModel):
    """Deterministic explainable composite risk profile for an asset."""

    asset_id: str
    asset_name: str
    score: int = Field(ge=0, le=100)
    level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    factors: list[RiskFactorItem]
    summary: str
    maintenance_blocked: bool = False
    active_work_order_id: Optional[str] = None
    required_spare_part: Optional[str] = None
    spare_available_quantity: int = 0
    resupply_days: Optional[float] = None
    computed_at: datetime
    truth_type: str = "DERIVED"
    assumptions: list[str] = []
