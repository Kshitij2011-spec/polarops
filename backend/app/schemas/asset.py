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


# ── EXPLAINABLE RISK ENGINE SCHEMAS (RISK INTELLIGENCE 2.0) ───────────────

class RiskFactorItem(BaseModel):
    """Individual factor contributing to composite operational risk."""

    factor: str
    title: str
    score: int
    max_score: int
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    evidence: str


class RiskDriverItem(BaseModel):
    """Ranked contributor to operational risk with explicit derivation and trend."""

    rank: int
    factor: str  # "condition", "dependency", "criticality", "maintenance", "spare", "resupply"
    title: str
    score: int
    max_score: int
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    evidence: str
    threshold: Optional[str] = None
    trend: str = "STABLE"  # "DEGRADING", "IMPROVING", "STABLE"
    derivation_rule: str
    truth_type: str = "DERIVED"
    provenance_source: str


class FailureExposureItem(BaseModel):
    """Deterministic assessment of consequences if this asset becomes unavailable."""

    level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    score: int  # 0-100 normalized
    affected_critical_services: list[str] = []
    affected_zones: list[str] = []
    redundancy_posture: str  # e.g. "N-0 (Loss of single-point redundant backup)"
    generation_reserve_kw: Optional[float] = None
    summary: str
    truth_type: str = "DERIVED"


class RecoveryExposureItem(BaseModel):
    """Deterministic assessment of operational constraints hindering equipment recovery."""

    level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    work_order_status: Optional[str] = None
    work_order_id: Optional[str] = None
    spare_part_number: Optional[str] = None
    spare_part_name: Optional[str] = None
    spare_available_quantity: int = 0
    resupply_vessel_name: Optional[str] = None
    resupply_days: Optional[float] = None
    recovery_bottleneck: str
    truth_type: str = "DERIVED"


class EnvironmentalAmplificationItem(BaseModel):
    """Coupling between ambient weather extremes and asset operational exposure."""

    ambient_temp_celsius: float
    wind_speed_knots: float
    wind_chill_celsius: float
    weather_condition: str
    amplification_level: str  # "NONE", "MODERATE", "SEVERE"
    amplification_factor: float  # e.g. 1.25 (+25% thermal loss acceleration)
    explanation: str
    truth_type: str = "DERIVED"


class OperationalHeadroomItem(BaseModel):
    """Remaining operational safety margins under current station conditions."""

    rating: str  # "NOMINAL", "NARROW", "COMPRESSED", "CRITICAL"
    generation_reserve_kw: float
    generation_headroom_label: str
    fuel_runway_days: float
    recovery_buffer_days: float
    thermal_hold_hours: float
    summary: str
    truth_type: str = "DERIVED"


class RiskConcentrationItem(BaseModel):
    """Topological graph concentration of operational risk from BFS traversal."""

    direct_dependents: list[str] = []
    indirect_dependents: list[str] = []
    critical_services: list[str] = []
    affected_zones: list[str] = []
    primary_domain: str
    max_depth: int = 0
    summary: str
    truth_type: str = "DERIVED"


class RiskProjectionItem(BaseModel):
    """Deterministic scenario evolution showing how risk score changes under operational conditions."""

    scenario_id: str
    name: str
    condition: str
    current_risk_score: int
    projected_risk_score: int
    score_delta: int
    projected_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    operational_impact: str
    headroom_effect: str
    truth_type: str = "SCENARIO"


class RiskStateTransitionItem(BaseModel):
    """Deterministic risk state ladder with explicit operational trigger conditions."""

    current_state: str  # "NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"
    state_trend: str  # "ESCALATING", "STABLE", "DE-ESCALATING"
    ladder: list[str] = ["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"]
    triggered_by: list[str] = []
    next_threshold_trigger: Optional[str] = None
    truth_type: str = "DERIVED"


class AssetRiskResponse(BaseModel):
    """Deterministic explainable composite risk profile for an asset (Risk Intelligence 2.0)."""

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

    # ── Risk Intelligence 2.0 Layers ──────────────────────────────────────
    drivers: list[RiskDriverItem] = []
    failure_exposure: Optional[FailureExposureItem] = None
    recovery_exposure: Optional[RecoveryExposureItem] = None
    environmental_amplification: Optional[EnvironmentalAmplificationItem] = None
    headroom: Optional[OperationalHeadroomItem] = None
    concentration: Optional[RiskConcentrationItem] = None
    projections: list[RiskProjectionItem] = []
    state_transition: Optional[RiskStateTransitionItem] = None

