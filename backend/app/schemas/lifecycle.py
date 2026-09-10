"""Pydantic schemas for B7 Model / Schema Lifecycle Metadata.

These schemas expose deterministic lifecycle management for versioned
operational components (models, schemas, configurations).

Key design decisions
--------------------
* ``version`` and ``schema_version`` are distinct fields — never overloaded.
* Effective intervals are half-open: [effective_from, effective_to).
  At exactly ``effective_to`` the old version is no longer valid.
* ``LifecycleStatus`` mirrors the enum in ``app.models.enums``.
* ``ProvenanceSchema`` from B3/B8 is deliberately NOT reused here — lifecycle
  metadata has its own resolve/response shapes, decoupled from telemetry provenance.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.enums import LifecycleStatus


class LifecycleRecordSchema(BaseModel):
    """Full lifecycle record for a versioned component.

    Fields
    ------
    id              — Stable string primary key (e.g. ``'LC-001'``).
    component_type  — Broad category: ``MODEL``, ``SCHEMA``, ``CONFIG``, etc.
    component_name  — Human-readable component identifier (e.g. ``'risk-engine'``).
    version         — Component/model version string (e.g. ``'2.1.0'``).
    schema_version  — Schema version string (e.g. ``'1.2'``).  Separate from
                      ``version``; a model may change version without changing
                      its schema contract, or vice versa.
    status          — Lifecycle status: ACTIVE | DEPRECATED | RETIRED.
    effective_from  — UTC start of validity (inclusive).
    effective_to    — UTC end of validity (exclusive).  ``None`` = open-ended
                      (component is still valid into the future).
    description     — Optional free-text annotation.
    created_at      — Record insertion timestamp.
    """

    id: str = Field(description="Stable string primary key")
    component_type: str = Field(description="Broad category: MODEL, SCHEMA, CONFIG, etc.")
    component_name: str = Field(description="Human-readable component identifier")
    version: str = Field(description="Component/model version string (e.g. '2.1.0')")
    schema_version: str = Field(
        description="Schema version string (e.g. '1.2'). Distinct from component version."
    )
    status: LifecycleStatus = Field(description="Lifecycle status: ACTIVE, DEPRECATED, or RETIRED")
    effective_from: datetime = Field(description="UTC start of validity (inclusive)")
    effective_to: Optional[datetime] = Field(
        default=None,
        description="UTC end of validity (exclusive). None = open-ended.",
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional free-text annotation",
    )
    created_at: datetime = Field(description="Record insertion timestamp (UTC)")


class LifecycleCreateRequest(BaseModel):
    """Request body to register a new lifecycle record.

    The caller is responsible for ensuring:
    * ``id`` is unique across all lifecycle records.
    * The effective interval does not overlap any existing record for the
      same ``component_type`` + ``component_name`` pair.
      The service will reject overlapping intervals with HTTP 409.
    """

    id: str = Field(description="Stable string primary key (e.g. 'LC-001')")
    component_type: str = Field(description="Broad category: MODEL, SCHEMA, CONFIG, etc.")
    component_name: str = Field(description="Human-readable component identifier")
    version: str = Field(description="Component/model version string (e.g. '2.1.0')")
    schema_version: str = Field(
        description="Schema version string (e.g. '1.2'). Distinct from component version."
    )
    status: LifecycleStatus = Field(
        default=LifecycleStatus.ACTIVE,
        description="Lifecycle status: ACTIVE, DEPRECATED, or RETIRED",
    )
    effective_from: datetime = Field(description="UTC start of validity (inclusive)")
    effective_to: Optional[datetime] = Field(
        default=None,
        description="UTC end of validity (exclusive). None = open-ended.",
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional free-text annotation",
    )


class LifecycleListResponse(BaseModel):
    """Paginated list of lifecycle records."""

    total: int = Field(description="Total number of matching records")
    items: List[LifecycleRecordSchema] = Field(
        default_factory=list,
        description="Lifecycle records matching the requested filters",
    )


class LifecycleResolveResponse(BaseModel):
    """Result of a version-resolution query.

    Answers: "Which component version was applicable at *timestamp*?"

    Fields
    ------
    component_type   — Component family type queried.
    component_name   — Component family name queried.
    query_timestamp  — The timestamp that was used for resolution.
    resolved_record  — The lifecycle record applicable at that timestamp, or
                       ``None`` if no record covers the timestamp.
    resolution_note  — Human-readable explanation of why this record was
                       selected (or why nothing was found).
    is_current       — ``True`` when the resolved record is an ACTIVE record
                       with an open-ended (or future) ``effective_to``.
    """

    component_type: str = Field(description="Component family type queried")
    component_name: str = Field(description="Component family name queried")
    query_timestamp: datetime = Field(description="Timestamp used for resolution (UTC)")
    resolved_record: Optional[LifecycleRecordSchema] = Field(
        default=None,
        description="The lifecycle record applicable at query_timestamp, or None",
    )
    resolution_note: str = Field(
        description="Human-readable explanation of the resolution outcome"
    )
    is_current: bool = Field(
        default=False,
        description="True when the resolved record is the current preferred ACTIVE version",
    )
