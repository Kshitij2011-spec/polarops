"""Common Pydantic schemas for PolarOps data provenance and error payloads."""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.enums import Quality, TruthType


class ProvenanceSchema(BaseModel):
    """Telemetry data provenance and scientific honesty metadata."""

    source: str = Field(description="Telemetry sensor or computational origin identifier")
    timestamp: datetime = Field(description="Time of observation in UTC")
    freshness_seconds: float = Field(
        default=1.0, description="Elapsed seconds since telemetry measurement was sampled"
    )
    quality: Quality = Field(
        default=Quality.GOOD, description="Quality indicator for the reading"
    )
    truth_type: TruthType = Field(
        default=TruthType.MEASURED, description="Provenance category (MEASURED, DERIVED, FORECAST, SCENARIO)"
    )
    confidence: float = Field(
        default=1.0, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0"
    )


class ErrorDetail(BaseModel):
    """Structured error payload."""

    code: str
    message: str
    details: Optional[Any] = None
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Standard HTTP 4xx/5xx error response wrapper."""

    error: ErrorDetail


class HealthResponse(BaseModel):
    """Typed response schema for the service health-check endpoint."""

    status: str = Field(description="Service liveness status — always 'ok' when the API is reachable")
    service: str = Field(description="Service identifier")
