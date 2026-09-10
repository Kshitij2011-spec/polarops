"""Pydantic schemas for unified Operational Intelligence narrative and causal reasoning."""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.enums import Quality, TruthType
from app.schemas.common import ProvenanceSchema


class CausalStageItem(BaseModel):
    """Represents a single deterministic stage in the operational causal narrative chain.
    
    Causal stages follow the hero chain:
    CHANGE -> CONTEXT -> DEPENDENCY -> RISK -> CONSEQUENCE -> SCENARIO -> ACTION
    """
    stage: str = Field(
        ...,
        description="Stage identifier: CHANGE, CONTEXT, DEPENDENCY, RISK, CONSEQUENCE, SCENARIO, ACTION",
        example="CHANGE",
    )
    title: str = Field(
        ...,
        description="Descriptive stage title",
        example="Generator G-02 Mechanical Degradation",
    )
    headline: str = Field(
        ...,
        description="High-impact concise summary statement",
        example="Bearing vibration reached 4.8 mm/s exceeding warning threshold (4.0 mm/s ceiling)",
    )
    description: str = Field(
        ...,
        description="Detailed contextual explanation of this causal link",
    )
    severity: str = Field(
        default="INFO",
        description="Stage severity: CRITICAL, WARNING, NOMINAL, INFO",
        example="WARNING",
    )
    truth_type: TruthType = Field(
        default=TruthType.MEASURED,
        description="Epistemic data honesty label",
        example=TruthType.MEASURED,
    )
    supporting_metrics: dict[str, Any] = Field(
        default_factory=dict,
        description="Structured telemetry readings or calculated values backing this stage",
    )
    target_route: Optional[str] = Field(
        default=None,
        description="Optional application route for deeper inspection of this stage",
        example="/assets/G-02",
    )
    action_label: Optional[str] = Field(
        default=None,
        description="Optional clickable label for routing",
        example="Inspect Asset G-02",
    )


class OperationalDecisionItem(BaseModel):
    """Actionable decision recommendation linking into existing platform capabilities."""
    id: str = Field(..., description="Unique decision identifier", example="DEC-01-INSPECT-G02")
    title: str = Field(..., description="Action title", example="Inspect Asset G-02")
    rationale: str = Field(..., description="Operational rationale for taking this action")
    action_type: str = Field(
        ...,
        description="Action category: INSPECT, SIMULATE, RECOVERY, RESILIENCE, ADVISORY",
        example="INSPECT",
    )
    target_route: str = Field(
        ...,
        description="Target client route to navigate to",
        example="/assets/G-02",
    )
    button_label: str = Field(
        ...,
        description="Text displayed on interactive button",
        example="Inspect Asset G-02",
    )
    is_primary: bool = Field(
        default=False,
        description="Whether this is the recommended first-order decision",
    )


class OperationalInsightResponse(BaseModel):
    """Top-level aggregated operational intelligence response for a station."""
    station_id: str = Field(..., description="Target station identifier", example="STATION-BHARATI")
    station_name: str = Field(..., description="Human readable station name", example="Bharati Research Station")
    primary_condition_id: str = Field(
        ...,
        description="Identifier for the primary operational condition or asset",
        example="G-02",
    )
    severity: str = Field(
        ...,
        description="Overall priority severity: CRITICAL, WARNING, NOMINAL",
        example="CRITICAL",
    )
    status_label: str = Field(
        ...,
        description="Concise operational posture label",
        example="HIGH ATTENTION · SINGLE FAULT VULNERABLE",
    )
    headline: str = Field(
        ...,
        description="High-level operational narrative headline",
        example="Generator G-02 Degradation Coupled with Blizzard Threatens Life Support Heating",
    )
    summary: str = Field(
        ...,
        description="Executive summary synthesizing change, context, and immediate action",
    )
    causal_chain: list[CausalStageItem] = Field(
        ...,
        description="Ordered 7-stage deterministic causal narrative (CHANGE -> CONTEXT -> DEPENDENCY -> RISK -> CONSEQUENCE -> SCENARIO -> ACTION)",
    )
    decisions: list[OperationalDecisionItem] = Field(
        ...,
        description="Actionable, non-actuating decision recommendations",
    )
    provenance: ProvenanceSchema = Field(
        ...,
        description="Full telemetry provenance and data honesty metadata",
    )
