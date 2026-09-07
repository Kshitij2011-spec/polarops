"""Pydantic v2 validation schemas for Canonical Operational Event Stream."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ProvenanceSchema


class OperationalEventSchema(BaseModel):
    """Canonical representation of an operational event across domains."""

    id: int
    timestamp: datetime
    station_id: str
    event_type: str = Field(..., description="Classification e.g. THRESHOLD_BREACH, RISK_CHANGE")
    severity: str = Field(default="INFO", description="Severity e.g. INFO, WARNING, CRITICAL, SYSTEM")
    entity_type: Optional[str] = Field(default=None, description="Entity domain e.g. ASSET, SERVICE, RESOURCE, COMMS, SCIENCE")
    entity_id: Optional[str] = Field(default=None, description="Target entity code e.g. G-02, SK-402, VSAT_UPLINK")
    title: str = Field(..., description="Concise human-readable event title")
    summary: str = Field(..., description="Operational summary describing what occurred")
    source: str = Field(default="SYNTHETIC_SIMULATION", description="Originating subsystem or simulation stream")
    truth_type: str = Field(default="MEASURED", description="MEASURED, DERIVED, or SYNTHETIC_SIMULATION")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Arbitrary key-value metrics and thresholds")

    model_config = ConfigDict(from_attributes=True)


class EventListResponse(BaseModel):
    """Paginated list response of operational events with provenance."""

    station_id: str
    total_count: int
    events: List[OperationalEventSchema]
    provenance: Optional[ProvenanceSchema] = None


class SimulateEventRequest(BaseModel):
    """Request payload for advancing or triggering a deterministic demo event."""

    station_id: str = Field(default="STATION-BHARATI")
    event_step: Optional[int] = Field(default=None, description="Specific deterministic step index (0-indexed)")
    advance_timeline: bool = Field(default=True, description="Advance the station demo step sequence")


class ResetEventsResponse(BaseModel):
    """Response returned when resetting the demonstration event timeline."""

    station_id: str
    status: str = "RESET_TO_CANONICAL_BASELINE"
    events_count: int
    timestamp: datetime
