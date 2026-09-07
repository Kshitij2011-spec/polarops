"""Pydantic v2 schemas for What-If Scenario Simulation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.explainability import RecoveryConstraint
from app.schemas.station import (
    CoordinationConstraintItem,
    CrossStationConsiderationItem,
    OperationalCapabilityItem,
    OperationalDifferenceItem,
)


class ScenarioSimulateRequest(BaseModel):
    """Stateless input specification for an operational what-if simulation."""

    station_id: str = Field(default="STATION-BHARATI", description="Station identifier")
    scenario_type: str = Field(default="GENERATOR_FAILURE", description="Scenario type identifier")
    target_asset_id: str = Field(default="G-02", description="Asset code or ID targeted by scenario")
    duration_hours: float = Field(
        default=72.0,
        gt=0.0,
        le=720.0,
        description="Duration in hours for hypothetical failure window",
    )
    ambient_temp_celsius: Optional[float] = Field(
        default=None,
        ge=-70.0,
        le=15.0,
        description="Optional environmental temperature override for cold-snap simulation",
    )


class ScenarioMetricDelta(BaseModel):
    """Comparison delta between baseline operational state and hypothetical scenario projection."""

    name: str
    baseline_value: float
    scenario_value: float
    delta: float
    unit: str
    impact_direction: str  # "POSITIVE", "NEGATIVE", "NEUTRAL"
    description: str


class ScenarioAffectedService(BaseModel):
    """Mission-critical service impacted by scenario dependency propagation."""

    service_id: str
    code: str
    name: str
    criticality: str
    baseline_status: str  # "NOMINAL", "WARNING", "CRITICAL"
    scenario_status: str  # "DEGRADED", "OFFLINE", "NOMINAL"
    degradation_rationale: str


class ScenarioDecisionOption(BaseModel):
    """Deterministic, explainable decision-support option for human operator consideration."""

    code: str
    title: str
    category: str  # "GENERATION_DISPATCH", "THERMAL_MANAGEMENT", "LOAD_SHEDDING", "LOGISTICS_ESCALATION"
    description: str
    operational_impact: str
    risk_reduction_tier: str  # "HIGH", "MEDIUM", "LOW"
    requires_human_approval: bool = True
    disclaimer: str = "[OUR DESIGN] Prototype decision-support option. Advisory only; not an approved emergency procedure."


class ScenarioSimulateResponse(BaseModel):
    """Complete structured simulation payload showing baseline, scenario state, and decision options."""

    scenario_id: str
    station_id: str
    scenario_type: str
    target_asset_id: str
    target_asset_name: str
    duration_hours: float
    ambient_temp_celsius: float
    baseline_summary: str
    scenario_summary: str
    deltas: list[ScenarioMetricDelta]
    affected_services: list[ScenarioAffectedService]
    affected_assets_count: int
    baseline_risk_score: int
    scenario_risk_score: int
    risk_delta: int
    baseline_risk_level: str
    scenario_risk_level: str
    decision_options: list[ScenarioDecisionOption]
    thermal_demand_kw: float = 0.0
    projected_load_kw: float = 0.0
    available_capacity_kw: float = 0.0
    reserve_margin_kw: float = 0.0
    reserve_margin_percent: float = 0.0
    recovery_constraints: list[RecoveryConstraint] = []
    assumptions: list[str] = []
    computed_at: datetime
    truth_type: str = "SCENARIO"
    source_context: list[str] = ["scenario_service", "energy_service", "dependency_service", "risk_service", "resource_service"]


class CrossStationScenarioRequest(BaseModel):
    """Stateless input specification for a cross-station coordination scenario."""

    disrupted_station_id: str = Field(default="STATION-BHARATI", description="Station experiencing operational disruption")
    support_station_id: str = Field(default="STATION-MAITRI", description="Candidate support/comparison station")
    scenario_type: str = Field(default="CROSS_STATION_COORDINATION", description="Scenario type identifier")
    target_asset_id: str = Field(default="G-02", description="Asset undergoing failure at disrupted station")
    duration_hours: float = Field(default=72.0, gt=0.0, le=720.0, description="Hypothetical disruption duration")
    ambient_temp_celsius: Optional[float] = Field(default=None, description="Optional temperature override")


class CrossStationScenarioResponse(BaseModel):
    """Structured response for cross-station coordination scenario evaluation."""

    scenario_id: str
    scenario_type: str
    disrupted_station_id: str
    disrupted_station_name: str
    support_station_id: str
    support_station_name: str
    disruption_summary: str
    support_capacity_summary: str
    differences: list["OperationalDifferenceItem"] = Field(default_factory=list)
    capabilities: list["OperationalCapabilityItem"] = Field(default_factory=list)
    constraints: list["CoordinationConstraintItem"] = Field(default_factory=list)
    considerations: list["CrossStationConsiderationItem"] = Field(default_factory=list)
    decision_options: list[ScenarioDecisionOption] = Field(default_factory=list)
    affected_services: list[ScenarioAffectedService] = Field(default_factory=list)
    reserve_margin_disrupted_kw: float
    reserve_margin_support_kw: float
    truth_type: str = "SCENARIO"
    source_context: list[str] = Field(
        default_factory=lambda: [
            "scenario_service",
            "station_service",
            "resource_service",
            "energy_service",
            "risk_service",
        ]
    )
    disclaimer: str = "[OUR DESIGN] Evaluates cross-station operational differences and advisory support considerations. Does NOT execute or simulate physical cargo/fuel transfers."
    computed_at: datetime

