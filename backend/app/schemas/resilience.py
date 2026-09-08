"""Pydantic schemas for Day 4 Resilience, Science Continuity, Incidents, and Memory."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.enums import CommsLinkStatus, IncidentSeverity, IncidentStatus, SyncStatus
from app.schemas.common import ProvenanceSchema


# ── 1. COMMS LINK & PRIORITY SYNC QUEUE ─────────────────────────────


class SyncQueueItemSchema(BaseModel):
    """Offline priority queue item with canonical SHA-256 integrity hash."""

    id: str
    station_id: str
    event_type: str
    payload_json: str
    priority: int = Field(..., description="0=P0 Critical, 1=P1 High, 2=P2 Important, 3=P3 Routine")
    priority_label: str = Field(..., description="P0, P1, P2, or P3")
    status: SyncStatus
    checksum_sha256: str
    is_checksum_verified: bool = False
    retry_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyncQueueListResponse(BaseModel):
    """Collection of sync queue items sorted deterministically by priority and timestamp."""

    station_id: str
    total_count: int
    pending_count: int
    reconciled_count: int
    failed_count: int
    items: List[SyncQueueItemSchema]


class CommsLinkStatusResponse(BaseModel):
    """Satellite link connection state and queue metrics."""

    link_id: str
    station_id: str
    name: str
    status: CommsLinkStatus
    last_sync_at: Optional[datetime] = None
    latency_ms: int
    bandwidth_kbps: int
    pending_queue_count: int
    is_local_operation_active: bool = True
    provenance: ProvenanceSchema


class CreateEventRequest(BaseModel):
    """Request to create and queue a local event while offline."""

    station_id: str = "STATION-BHARATI"
    event_type: str = Field(..., example="GENERATOR_ANOMALY")
    priority: int = Field(0, ge=0, le=3, description="0=P0 Critical, 1=P1 High, 2=P2 Important, 3=P3 Routine")
    payload: Dict[str, Any] = Field(..., example={"asset_id": "G-02", "alert": "High vibration"})


class RestoreLinkResponse(BaseModel):
    """Result of restoring the communication link and priority sync."""

    link_status: CommsLinkStatus
    items_processed: int
    items_reconciled: int
    items_failed: int
    details: List[SyncQueueItemSchema]


class ResetSimulationResponse(BaseModel):
    """Result of resetting the Day 4 resilience simulation."""

    status: str
    message: str
    link_status: CommsLinkStatus
    active_queue_count: int


# ── 2. SCIENCE DATA CONTINUITY ──────────────────────────────────────


class ScienceObservationSchema(BaseModel):
    """Scientific observation record with buffer status."""

    id: int
    instrument_id: str
    timestamp: datetime
    measurement_value: float
    unit: str
    quality: str
    source: str
    truth_type: str
    is_buffered: bool = False
    sync_status: str = "RECONCILED"
    metadata_completeness: str = "COMPLETE"
    provenance: Optional[ProvenanceSchema] = None

    class Config:
        from_attributes = True


class ScienceInstrumentDetailResponse(BaseModel):
    """Scientific instrument metadata, health, and observation buffer status."""

    id: str
    station_id: str
    code: str
    name: str
    instrument_type: str
    health: str
    power_status: str
    calibration_status: str
    last_seen_at: Optional[datetime] = None
    metadata_completeness: str = "COMPLETE"
    buffered_observations_count: int = 0
    recent_observations: List[ScienceObservationSchema] = []
    truth_type: str = "MEASURED"
    provenance: Optional[ProvenanceSchema] = None

    class Config:
        from_attributes = True


class BufferObservationRequest(BaseModel):
    """Request to buffer a new scientific observation locally while offline."""

    instrument_id: str = Field(..., example="INST-S17-RADAR")
    measurement_value: float = Field(..., example=132.8)
    unit: str = Field(default="TECU", example="TECU")


# ── 3. INCIDENT WORKSPACE & OPERATIONAL MEMORY ──────────────────────


class IncidentActionSchema(BaseModel):
    """Action recorded by an operator against an incident."""

    id: str
    incident_id: Optional[str] = None
    action_code: str
    description: str
    executed_by: str
    executed_at: datetime
    outcome_status: str

    class Config:
        from_attributes = True


class IncidentListItemResponse(BaseModel):
    """Summary item for incident list views."""

    id: str
    station_id: str
    title: str
    severity: IncidentSeverity
    status: IncidentStatus
    location: Optional[str] = None
    started_at: datetime
    resolved_at: Optional[datetime] = None
    actions_count: int = 0

    class Config:
        from_attributes = True


class IncidentDetailResponse(BaseModel):
    """Detailed common operating picture for an active or resolved incident."""

    id: str
    station_id: str
    title: str
    severity: IncidentSeverity
    status: IncidentStatus
    location: Optional[str] = None
    description: str
    started_at: datetime
    resolved_at: Optional[datetime] = None
    affected_assets: List[Dict[str, Any]] = []
    affected_services: List[Dict[str, Any]] = []
    modeled_risk_score: int
    available_response_options: List[Dict[str, Any]] = []
    actions: List[IncidentActionSchema] = []
    truth_type: str = "DERIVED"


class IncidentCreateRequest(BaseModel):
    """Request to open a new operational incident."""

    station_id: str = "STATION-BHARATI"
    title: str = Field(..., min_length=3, example="Generator G-02 Offline")
    severity: IncidentSeverity = IncidentSeverity.MAJOR
    location: Optional[str] = Field(default="Powerhouse Gen Bay 2")
    description: str = Field(..., min_length=5)
    primary_asset_id: Optional[str] = Field(default="G-02")


class IncidentActionCreateRequest(BaseModel):
    """Request to log a new response action against an incident."""

    action_code: str = Field(..., example="INSPECT_G02_PUMP")
    description: str = Field(..., example="Conducted physical inspection of rotary fuel injection pump seal.")
    executed_by: str = Field(default="Station Lead Engineer", example="Station Lead Engineer")
    outcome_status: str = Field(default="IN_PROGRESS", example="IN_PROGRESS")


class OperationalMemorySchema(BaseModel):
    """Structured organizational memory lesson."""

    id: str
    station_id: str
    event_type: str
    title: str
    context_summary: str
    lessons_learned: str
    decision: Optional[str] = None
    action_taken: Optional[str] = None
    outcome: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CreateMemoryRequest(BaseModel):
    """Request to record an operational memory entry from a resolved incident or post-mortem."""

    station_id: str = "STATION-BHARATI"
    event_type: str = Field(..., example="GENERATOR_FAILURE_RECOVERY")
    title: str = Field(..., example="2026 G-02 Fuel Pump Bearing Mitigation")
    incident_id: Optional[str] = Field(default=None, example="INC-2026-04")
    decision: str = Field(..., example="Transfer thermal load to B-01 and prioritize G-01 generation")
    action_taken: str = Field(..., example="Auxiliary Boiler preheat initiated; radar science load shed")
    outcome: str = Field(..., example="Habitat maintained +20C; generator stabilized without freeze-out")
    lesson: str = Field(..., example="Preheat B-01 for 35 min before executing primary generator shutdown in winter")


class MemorySearchResponse(BaseModel):
    """Results of searching stored operational memory records."""

    query: Optional[str] = None
    total_count: int
    memories: List[OperationalMemorySchema]
