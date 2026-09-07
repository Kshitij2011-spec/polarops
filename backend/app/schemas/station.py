"""Station overview and environmental Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, Field

from app.models.enums import EnvironmentMode, StationStatus
from app.schemas.common import ProvenanceSchema


class AmbientWeatherSchema(BaseModel):
    """Current station weather observation."""

    temperature_celsius: float
    wind_speed_knots: float
    wind_chill_celsius: float
    conditions: str
    provenance: ProvenanceSchema


class SubsystemSummaryItem(BaseModel):
    """High-level operational health indicator for a station subsystem."""

    code: str
    name: str
    status: str
    health_score: int = Field(ge=0, le=100)


class CriticalEventItem(BaseModel):
    """Urgent operational anomaly or active incident requiring operator attention."""

    id: str
    title: str
    severity: str
    status: str
    asset_id: Optional[str] = None
    location: Optional[str] = None
    description: str


class StationOverviewResponse(BaseModel):
    """High-level situation awareness payload for Station Command Center."""

    station_id: str
    name: str
    status: StationStatus
    environment_mode: EnvironmentMode
    overall_health_score: int = Field(ge=0, le=100)
    active_incidents_count: int
    fuel_runway_days: Optional[float] = None
    fuel_quantity_liters: Optional[float] = None
    connectivity_status: str = "ONLINE"
    ambient_weather: AmbientWeatherSchema
    subsystem_summary: list[SubsystemSummaryItem]
    critical_events: list[CriticalEventItem] = []


class OperationalCapabilityItem(BaseModel):
    """Derived operational capability headroom score and state for a station domain."""

    domain: str  # "ENERGY_RESILIENCE", "COMMS_CONTINUITY", "SCIENCE_CONTINUITY", "LIFE_SUPPORT", "RECOVERY_BUFFER"
    name: str
    headroom_score: int = Field(ge=0, le=100)
    status: str  # "NOMINAL", "CONSTRAINED", "CRITICAL"
    summary: str
    calculation_basis: Optional[str] = None
    metrics: dict[str, str | int | float | bool] = Field(default_factory=dict)


class OperationalDifferenceItem(BaseModel):
    """Structured operational divergence between compared stations."""

    dimension: str  # "STATION_HEALTH", "FUEL_RUNWAY", "ASSET_RISK", "COMMUNICATIONS", "CRITICAL_SPARES", "WEATHER_EXPOSURE"
    title: str
    station_a_value: str
    station_b_value: str
    delta_summary: str
    pressure_direction: str  # "BHARATI_HIGHER", "MAITRI_HIGHER", "BALANCED"
    significance: str  # "CRITICAL", "MODERATE", "INFORMATIONAL"


class CoordinationConstraintItem(BaseModel):
    """Explicit physical, meteorological, or telecommunications constraint."""

    constraint_type: str  # "LOGISTICS_DISTANCE", "WEATHER_FLIGHT_WINDOW", "COMMS_ASYMMETRY", "TRAVERSE_SEASON"
    name: str
    status: str  # "RESTRICTED", "IMPASSABLE", "NOMINAL", "DEGRADED"
    impact: str
    details: str
    provenance_type: str = "DOCUMENTED_GEOGRAPHY"  # "DOCUMENTED_GEOGRAPHY", "MODELED_OPERATIONAL_RULE", "MODELED_SYSTEM_PROFILE"
    validation_status: str = "VERIFIED_RESEARCH"  # "VERIFIED_RESEARCH", "REQUIRES_FUTURE_VALIDATION"


class CrossStationConsiderationItem(BaseModel):
    """Advisory operational consideration for human operator decision support (non-actuating)."""

    id: str
    category: str  # "RESOURCE_SUPPORT", "RECOVERY_ALIGNMENT", "COMMS_READINESS", "RISK_MITIGATION"
    title: str
    recommendation: str
    rationale: str
    prerequisites: list[str] = Field(default_factory=list)
    feasibility_status: str  # "FEASIBLE_WITH_CONSTRAINTS", "RESTRICTED", "ADVISORY_ONLY"


class RecoveryChainItem(BaseModel):
    """Structured end-to-end recovery chain distinguishing technical, material, and logistics constraints."""

    station_id: str
    asset_id: str
    asset_code: str = "G-02"
    asset_name: str
    technical_condition: str
    material_constraint: str
    local_availability: str = "0 units available (Stockout)"
    local_stock_quantity: int = 0
    maintenance_constraint: str = "BLOCKED (MWO-2026-089 awaiting parts)"
    maintenance_status: str = "BLOCKED"
    work_order_id: Optional[str] = None
    resupply_dependency: str
    candidate_support_station: Optional[str] = None
    recovery_status: str = "CONSTRAINED"  # "CONSTRAINED", "NOMINAL", "MONITORING"
    recovery_exposure: str = "Loss of N+1 redundancy; single-fault vulnerability"
    operational_exposure: str = "Single generator G-01 dependency; secondary heating loop exposed to freeze-out"
    timing_confidence: str = "Requires future validation"
    timing_disclaimer: str = "Recovery remains constrained until the required resource becomes available. Repair duration requires post-delivery mechanical inspection."


class StationPortfolioItem(BaseModel):
    """Summary of a station's canonical state within the portfolio comparison."""

    station_id: str
    code: str
    name: str
    status: StationStatus
    overall_health: int
    fuel_runway_days: Optional[float] = None
    fuel_quantity_liters: Optional[float] = None
    temperature_celsius: float
    wind_speed_knots: float
    conditions: str
    comms_status: str
    active_incidents_count: int
    critical_spares_available: int
    capabilities: list[OperationalCapabilityItem] = Field(default_factory=list)


class StationComparisonResponse(BaseModel):
    """Deterministic comparison between two research stations."""

    station_a: StationPortfolioItem
    station_b: StationPortfolioItem
    capabilities_summary: list[dict[str, str | int | float]] = Field(default_factory=list)
    differences: list[OperationalDifferenceItem] = Field(default_factory=list)
    constraints: list[CoordinationConstraintItem] = Field(default_factory=list)
    considerations: list[CrossStationConsiderationItem] = Field(default_factory=list)
    recovery_chain: list[RecoveryChainItem] = Field(default_factory=list)
    higher_pressure_station_id: str
    pressure_rationale: str
    provenance: ProvenanceSchema
