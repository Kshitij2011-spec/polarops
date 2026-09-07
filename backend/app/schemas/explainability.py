"""Pydantic v2 validation schemas for Deterministic Operational Explainability Layer."""

from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ExplanationEvidence(BaseModel):
    """Specific measurable factor and threshold contributing to reasoning."""

    factor: str = Field(..., description="Factor label e.g. Bearing Vibration, Coolant Temp")
    metric: str = Field(..., description="Technical metric name e.g. bearing_vibration_mm_s")
    value: Any = Field(..., description="Observed or derived metric value")
    threshold: Optional[Any] = Field(default=None, description="Operational limit threshold")
    status: str = Field(default="WARNING", description="NOMINAL, WARNING, or CRITICAL")
    detail: str = Field(..., description="Qualitative evaluation of the metric against threshold")


class ExplanationConsequence(BaseModel):
    """Downstream cascade or physical impact exposed by the condition."""

    domain: str = Field(..., description="Impacted domain e.g. HEATING, POWER, SCIENCE, LOGISTICS")
    impact: str = Field(..., description="High-level impact summary e.g. Zone 2 Heating Margin Reduced")
    blast_radius_depth: int = Field(default=1, description="Topological distance from root entity (BFS hop count)")
    description: str = Field(..., description="Detailed operational consequence")


class RecoveryConstraint(BaseModel):
    """Operational or logistical limitation constraining remediation."""

    constraint_type: str = Field(..., description="e.g. INVENTORY_STOCKOUT, RESUPPLY_WINDOW, WEATHER_WINDOW")
    resource_id: Optional[str] = Field(default=None, description="Associated part or resource e.g. SK-402, DIESEL_LFO")
    description: str = Field(..., description="Explanation of recovery bottleneck")
    impact_level: str = Field(default="HIGH", description="LOW, MEDIUM, HIGH, BLOCKING")


class RecommendedNextStep(BaseModel):
    """Deterministic, non-actuating decision-support action for the operator."""

    action_code: str = Field(..., description="Standard operational code e.g. INSPECT_G02, RUN_SCENARIO")
    title: str = Field(..., description="Human-readable action title")
    description: str = Field(..., description="Why and what the operator should investigate")
    target_route: str = Field(..., description="Frontend navigation target e.g. /assets/G-02, /scenarios")
    action_type: str = Field(default="INSPECT", description="INSPECT, SIMULATE, MITIGATE, REVIEW")


class ExplanationResponse(BaseModel):
    """Canonical structured explanation returned by the deterministic reasoning engine."""

    subject: str = Field(..., description="Headline explanation subject e.g. Generator G-02 Vibration Anomaly")
    domain: str = Field(..., description="Domain e.g. ASSET, RESOURCE, COMMUNICATION, SCIENCE, INCIDENT")
    entity_id: str = Field(..., description="Unique entity identifier e.g. G-02, SK-402, VSAT_UPLINK")
    station_id: str = Field(default="STATION-BHARATI", description="Station identifier")
    severity: str = Field(default="WARNING", description="INFO, WARNING, or CRITICAL")
    summary: str = Field(..., description="WHAT CHANGED — Clear operational summary")
    why_it_matters: str = Field(..., description="WHY IT MATTERS — Operational importance and systemic role")
    evidence: List[ExplanationEvidence] = Field(default_factory=list, description="Measurable evidence and factors")
    consequences: List[ExplanationConsequence] = Field(default_factory=list, description="Downstream cascading impacts")
    recovery_constraints: List[RecoveryConstraint] = Field(default_factory=list, description="Constraints hindering recovery")
    recommended_next_steps: List[RecommendedNextStep] = Field(default_factory=list, description="Recommended operator investigation steps")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Deterministic confidence (1.0 for modeled rules)")
    truth_type: str = Field(default="DERIVED", description="MEASURED, DERIVED, or SYNTHETIC_SIMULATION")
    source_context: List[str] = Field(default_factory=list, description="Underlying database tables or domain services evaluated")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of explanation synthesis")

    model_config = ConfigDict(from_attributes=True)


class ExplanationQueryRequest(BaseModel):
    """Request payload to query an explanation."""

    domain: str
    entity_id: str
    station_id: str = "STATION-BHARATI"
