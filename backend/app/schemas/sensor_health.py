"""Pydantic schemas for B6 Digital Twin Data Quality / Sensor Health.

These schemas expose deterministic sensor freshness and health classification
derived from actual Measurement timestamps and quality fields.

Health (FRESH / STALE / UNKNOWN) represents *recency* only.
Quality (GOOD / SUSPECT / BAD) represents *signal trustworthiness* only.
They are orthogonal and must never be conflated.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ProvenanceSchema


class SensorHealthSchema(BaseModel):
    """Per-sensor health record derived from the latest Measurement.

    Fields:
        sensor_id       — Sensor primary key.
        sensor_name     — Human-readable sensor descriptor.
        metric_key      — Telemetry channel key (e.g. 'efficiency_pct').
        last_seen_at    — Effective last-seen time (latest Measurement.timestamp).
                          None when no usable measurement exists.
        freshness_seconds — Elapsed seconds since latest measurement.
                            0.0 for future timestamps. 1.0 fallback when no
                            measurement is available.
        health          — Recency classification: FRESH | STALE | UNKNOWN.
        quality         — Measurement signal quality: GOOD | SUSPECT | BAD.
                          Preserved from actual Measurement.quality.
        truth_type      — Provenance category: MEASURED | DERIVED | etc.
        confidence      — 0.0–1.0 confidence following the B5 convention
                          (GOOD→1.0, SUSPECT→0.7, BAD→0.2).
        provenance      — Full canonical provenance metadata.
    """

    sensor_id: str = Field(description="Sensor primary key")
    sensor_name: str = Field(description="Human-readable sensor name")
    metric_key: str = Field(description="Telemetry metric key")
    last_seen_at: Optional[datetime] = Field(
        default=None,
        description="Effective last-seen timestamp (latest Measurement.timestamp)",
    )
    freshness_seconds: float = Field(
        description="Elapsed seconds since latest measurement (0.0 for future timestamps)"
    )
    health: str = Field(
        description="Recency classification: FRESH, STALE, or UNKNOWN"
    )
    quality: str = Field(
        description="Measurement quality preserved from actual reading: GOOD, SUSPECT, or BAD"
    )
    truth_type: str = Field(
        description="Provenance truth type: MEASURED, DERIVED, etc."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score (GOOD→1.0, SUSPECT→0.7, BAD→0.2)",
    )
    provenance: ProvenanceSchema = Field(description="Canonical telemetry provenance metadata")


class AssetSensorHealthResponse(BaseModel):
    """Asset-level sensor health collection.

    Aggregates all sensor health summaries for an asset, enabling the
    Digital Twin to surface data-quality state across all instrumentation
    on a given piece of equipment.
    """

    asset_id: str = Field(description="Asset primary key")
    asset_name: str = Field(description="Asset display name")
    sensor_count: int = Field(description="Total number of sensors on this asset")
    sensors: List[SensorHealthSchema] = Field(
        default_factory=list,
        description="Per-sensor health records ordered by metric_key",
    )
