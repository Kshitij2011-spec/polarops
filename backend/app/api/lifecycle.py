"""API router for B7 Model / Schema Lifecycle Metadata.

Endpoints
---------
GET  /lifecycle              — List all lifecycle records (with optional filters).
GET  /lifecycle/resolve      — Resolve the applicable version at a timestamp.
GET  /lifecycle/{id}         — Retrieve a single lifecycle record by ID.
POST /lifecycle              — Register a new lifecycle record.

IMPORTANT: ``/lifecycle/resolve`` is registered BEFORE ``/lifecycle/{id}`` to
prevent FastAPI from treating the literal path segment ``"resolve"`` as a
value for the ``{id}`` path parameter.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import LifecycleStatus
from app.schemas.lifecycle import (
    LifecycleCreateRequest,
    LifecycleListResponse,
    LifecycleRecordSchema,
    LifecycleResolveResponse,
)
from app.services.lifecycle_service import (
    create_lifecycle_record,
    get_lifecycle_record,
    list_lifecycle_records,
    resolve_current_version,
    resolve_version_at,
)

router = APIRouter(prefix="/lifecycle", tags=["Lifecycle Metadata"])


@router.get("", response_model=LifecycleListResponse)
def get_lifecycle_list(
    component_type: Optional[str] = Query(
        default=None,
        description="Filter by component type (e.g. MODEL, SCHEMA, CONFIG)",
    ),
    component_name: Optional[str] = Query(
        default=None,
        description="Filter by component name (e.g. 'risk-engine')",
    ),
    status: Optional[LifecycleStatus] = Query(
        default=None,
        description="Filter by lifecycle status: ACTIVE, DEPRECATED, or RETIRED",
    ),
    db: Session = Depends(get_db),
) -> LifecycleListResponse:
    """List lifecycle records with optional filters.

    Results are ordered by (component_type, component_name, effective_from).
    Returns all records when no filters are provided.
    """
    return list_lifecycle_records(
        db,
        component_type=component_type,
        component_name=component_name,
        status=status,
    )


@router.get("/resolve", response_model=LifecycleResolveResponse)
def resolve_lifecycle_version(
    component_type: str = Query(
        description="Component type to resolve (e.g. MODEL, SCHEMA, CONFIG)"
    ),
    component_name: str = Query(
        description="Component name to resolve (e.g. 'risk-engine')"
    ),
    timestamp: Optional[datetime] = Query(
        default=None,
        description=(
            "ISO 8601 UTC timestamp to resolve against. "
            "Omit to resolve the current preferred ACTIVE version."
        ),
    ),
    db: Session = Depends(get_db),
) -> LifecycleResolveResponse:
    """Resolve the lifecycle version applicable for a component at a given timestamp.

    When ``timestamp`` is omitted, returns the preferred current ACTIVE version.
    When ``timestamp`` is provided, returns the version that was valid at that
    historical moment — including DEPRECATED and RETIRED versions, which remain
    historically traceable.

    Boundary semantics: at exactly ``effective_to`` the old version is no longer
    valid; the new version (with the same ``effective_from``) becomes valid.
    """
    if timestamp is None:
        return resolve_current_version(db, component_type=component_type, component_name=component_name)
    return resolve_version_at(
        db,
        component_type=component_type,
        component_name=component_name,
        timestamp=timestamp,
    )


@router.get("/{record_id}", response_model=LifecycleRecordSchema)
def get_lifecycle_record_by_id(
    record_id: str,
    db: Session = Depends(get_db),
) -> LifecycleRecordSchema:
    """Retrieve a single lifecycle record by its primary key."""
    record = get_lifecycle_record(db, record_id=record_id)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Lifecycle record with id='{record_id}' was not found.",
        )
    return record


@router.post("", response_model=LifecycleRecordSchema, status_code=201)
def register_lifecycle_record(
    req: LifecycleCreateRequest,
    db: Session = Depends(get_db),
) -> LifecycleRecordSchema:
    """Register a new lifecycle record for a versioned component.

    The service validates:
    - ID uniqueness across all lifecycle records.
    - No overlapping effective intervals for the same component family
      (component_type + component_name).

    Returns HTTP 409 if validation fails.
    """
    try:
        return create_lifecycle_record(db, req=req)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
