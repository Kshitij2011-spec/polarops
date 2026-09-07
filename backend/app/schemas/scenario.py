"""Pydantic v2 schemas for What-If Scenario Simulation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.explainability import RecoveryConstraint


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
