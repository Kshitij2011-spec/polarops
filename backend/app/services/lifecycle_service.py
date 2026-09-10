"""B7 — Model / Schema Lifecycle Metadata Service.

Purpose
-------
Provide deterministic lifecycle management for versioned operational components
(models, schemas, configurations).  The service answers:

    "Which version of a component was active at a given historical timestamp?"

and

    "What is the preferred current ACTIVE version of a component?"

Design Invariants
-----------------
1. Effective intervals are half-open: [effective_from, effective_to).
   At exactly ``effective_to`` the old version is NO LONGER valid.

2. Two records for the same component family (component_type + component_name)
   MUST NOT have overlapping effective intervals.  This service enforces the
   constraint before any insert via ``_check_overlap()``.

3. Adjacent intervals are valid:
     v1: [2026-01-01, 2026-06-01)
     v2: [2026-06-01, None)
   is correct.  At exactly 2026-06-01 only v2 is applicable.

4. RETIRED records are NEVER deleted — they remain for historical provenance.

5. Current-version resolution prefers ACTIVE over DEPRECATED/RETIRED.  It
   never selects a DEPRECATED or RETIRED record as the "current" version even
   if no ACTIVE record exists (it returns None instead).

UTC Normalization
-----------------
SQLite stores datetimes without timezone info.  The ``_utc()`` helper converts
naive datetimes to UTC-aware, following the same established pattern as B5/B6.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.entities import ComponentLifecycle
from app.models.enums import LifecycleStatus
from app.schemas.lifecycle import (
    LifecycleCreateRequest,
    LifecycleListResponse,
    LifecycleRecordSchema,
    LifecycleResolveResponse,
)


# ---------------------------------------------------------------------------
# UTC normalization (same pattern as B5/B6 — centralised here for lifecycle)
# ---------------------------------------------------------------------------


def _utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Return a UTC-aware copy of *dt*, handling naive (SQLite) timestamps.

    SQLite stores datetimes without timezone info.  This helper makes them
    UTC-aware so that comparisons against ``datetime.now(timezone.utc)`` and
    other UTC-aware datetimes are always safe.

    Returns None if *dt* is None.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# ---------------------------------------------------------------------------
# Validity check
# ---------------------------------------------------------------------------


def is_valid_at(record: ComponentLifecycle, ts: datetime) -> bool:
    """Return True if *record* is valid at timestamp *ts*.

    Validity rule (half-open interval):
        effective_from <= ts < effective_to
    Or when effective_to is None (open-ended):
        effective_from <= ts

    Both *record* timestamps and *ts* are normalised to UTC before comparison.

    Args:
        record: A ComponentLifecycle ORM instance.
        ts:     The query timestamp (must be UTC-aware or naive-UTC).

    Returns:
        bool
    """
    ts_utc = _utc(ts)
    from_utc = _utc(record.effective_from)
    to_utc = _utc(record.effective_to)

    if ts_utc is None or from_utc is None:
        return False

    if ts_utc < from_utc:
        return False

    if to_utc is not None and ts_utc >= to_utc:
        return False

    return True


# ---------------------------------------------------------------------------
# Overlap detection
# ---------------------------------------------------------------------------


def _check_overlap(
    db: Session,
    component_type: str,
    component_name: str,
    effective_from: datetime,
    effective_to: Optional[datetime],
    exclude_id: Optional[str] = None,
) -> Optional[ComponentLifecycle]:
    """Return an existing record that overlaps the proposed interval, or None.

    Two intervals [A_from, A_to) and [B_from, B_to) overlap iff:
        A_from < B_to  AND  B_from < A_to
    where None effective_to is treated as +∞.

    Args:
        db:              Database session.
        component_type:  Component type being checked.
        component_name:  Component name being checked.
        effective_from:  Proposed interval start (UTC-aware or naive-UTC).
        effective_to:    Proposed interval end, or None for open-ended.
        exclude_id:      Optional record ID to exclude (used for updates).

    Returns:
        The first conflicting ComponentLifecycle record found, or None.
    """
    from_utc = _utc(effective_from)
    to_utc = _utc(effective_to)

    # Fetch all records for this component family
    query = db.query(ComponentLifecycle).filter(
        ComponentLifecycle.component_type == component_type,
        ComponentLifecycle.component_name == component_name,
    )
    if exclude_id:
        query = query.filter(ComponentLifecycle.id != exclude_id)

    for existing in query.all():
        ex_from = _utc(existing.effective_from)
        ex_to = _utc(existing.effective_to)

        # Check overlap: A_from < B_to AND B_from < A_to
        # None (open-ended) effective_to is treated as +∞
        a_ends_before_b_starts = (to_utc is not None) and (to_utc <= ex_from)
        b_ends_before_a_starts = (ex_to is not None) and (ex_to <= from_utc)

        if not a_ends_before_b_starts and not b_ends_before_a_starts:
            return existing

    return None


# ---------------------------------------------------------------------------
# ORM → Schema conversion
# ---------------------------------------------------------------------------


def _to_schema(record: ComponentLifecycle) -> LifecycleRecordSchema:
    """Convert a ComponentLifecycle ORM instance to a Pydantic schema."""
    return LifecycleRecordSchema(
        id=record.id,
        component_type=record.component_type,
        component_name=record.component_name,
        version=record.version,
        schema_version=record.schema_version,
        status=LifecycleStatus(record.status),
        effective_from=_utc(record.effective_from),
        effective_to=_utc(record.effective_to),
        description=record.description,
        created_at=_utc(record.created_at),
    )


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------


def create_lifecycle_record(
    db: Session,
    req: LifecycleCreateRequest,
) -> LifecycleRecordSchema:
    """Persist a new lifecycle record after validating uniqueness and overlap.

    Raises:
        ValueError: If the ID already exists, or if the proposed interval
                    overlaps an existing record for the same component family.

    Args:
        db:  Database session.
        req: Validated create request.

    Returns:
        The persisted LifecycleRecordSchema.
    """
    # 1. ID uniqueness
    existing_id = db.query(ComponentLifecycle).filter(ComponentLifecycle.id == req.id).first()
    if existing_id is not None:
        raise ValueError(f"Lifecycle record with id='{req.id}' already exists.")

    # 2. Overlap check
    conflict = _check_overlap(
        db=db,
        component_type=req.component_type,
        component_name=req.component_name,
        effective_from=req.effective_from,
        effective_to=req.effective_to,
    )
    if conflict is not None:
        raise ValueError(
            f"Interval [{req.effective_from}, {req.effective_to}) overlaps existing record "
            f"'{conflict.id}' [{conflict.effective_from}, {conflict.effective_to}) "
            f"for component '{req.component_type}/{req.component_name}'."
        )

    # 3. Persist
    record = ComponentLifecycle(
        id=req.id,
        component_type=req.component_type,
        component_name=req.component_name,
        version=req.version,
        schema_version=req.schema_version,
        status=req.status,
        effective_from=req.effective_from,
        effective_to=req.effective_to,
        description=req.description,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_schema(record)


def get_lifecycle_record(db: Session, record_id: str) -> Optional[LifecycleRecordSchema]:
    """Fetch a single lifecycle record by its primary key.

    Args:
        db:        Database session.
        record_id: Lifecycle record primary key.

    Returns:
        LifecycleRecordSchema or None if not found.
    """
    record = (
        db.query(ComponentLifecycle)
        .filter(ComponentLifecycle.id == record_id)
        .first()
    )
    return _to_schema(record) if record is not None else None


def list_lifecycle_records(
    db: Session,
    component_type: Optional[str] = None,
    component_name: Optional[str] = None,
    status: Optional[LifecycleStatus] = None,
) -> LifecycleListResponse:
    """List lifecycle records with optional filters.

    Results are ordered by (component_type, component_name, effective_from).

    Args:
        db:             Database session.
        component_type: Optional filter by component type.
        component_name: Optional filter by component name.
        status:         Optional filter by lifecycle status.

    Returns:
        LifecycleListResponse with total count and matching items.
    """
    query = db.query(ComponentLifecycle)
    if component_type is not None:
        query = query.filter(ComponentLifecycle.component_type == component_type)
    if component_name is not None:
        query = query.filter(ComponentLifecycle.component_name == component_name)
    if status is not None:
        query = query.filter(ComponentLifecycle.status == status)

    query = query.order_by(
        ComponentLifecycle.component_type,
        ComponentLifecycle.component_name,
        ComponentLifecycle.effective_from,
    )

    records = query.all()
    return LifecycleListResponse(
        total=len(records),
        items=[_to_schema(r) for r in records],
    )


# ---------------------------------------------------------------------------
# Version resolution
# ---------------------------------------------------------------------------


def resolve_version_at(
    db: Session,
    component_type: str,
    component_name: str,
    timestamp: datetime,
) -> LifecycleResolveResponse:
    """Find the lifecycle record applicable at a given historical timestamp.

    The overlap invariant guarantees at most one record is valid at any given
    timestamp for a specific component family.

    DEPRECATED and RETIRED records remain historically resolvable — they are
    not excluded from historical lookups.  Only current-version selection
    (``resolve_current_version``) excludes DEPRECATED/RETIRED.

    Args:
        db:             Database session.
        component_type: Component type to resolve.
        component_name: Component name to resolve.
        timestamp:      The historical timestamp to evaluate against.

    Returns:
        LifecycleResolveResponse describing the resolution outcome.
    """
    ts_utc = _utc(timestamp)
    now_utc = datetime.now(timezone.utc)

    records = (
        db.query(ComponentLifecycle)
        .filter(
            ComponentLifecycle.component_type == component_type,
            ComponentLifecycle.component_name == component_name,
        )
        .order_by(ComponentLifecycle.effective_from)
        .all()
    )

    matched: Optional[ComponentLifecycle] = None
    for record in records:
        if is_valid_at(record, ts_utc):
            matched = record
            break

    if matched is None:
        return LifecycleResolveResponse(
            component_type=component_type,
            component_name=component_name,
            query_timestamp=ts_utc,
            resolved_record=None,
            resolution_note=(
                f"No lifecycle record for '{component_type}/{component_name}' "
                f"is valid at {ts_utc.isoformat()}."
            ),
            is_current=False,
        )

    # Determine whether this is also the "current" active version
    matched_to_utc = _utc(matched.effective_to)
    is_current = (
        matched.status == LifecycleStatus.ACTIVE
        and (matched_to_utc is None or matched_to_utc > now_utc)
    )

    return LifecycleResolveResponse(
        component_type=component_type,
        component_name=component_name,
        query_timestamp=ts_utc,
        resolved_record=_to_schema(matched),
        resolution_note=(
            f"Resolved to version '{matched.version}' (schema '{matched.schema_version}') "
            f"[{_utc(matched.effective_from).isoformat()}, "
            f"{matched_to_utc.isoformat() if matched_to_utc else 'open'}). "
            f"Status: {matched.status}."
        ),
        is_current=is_current,
    )


def resolve_current_version(
    db: Session,
    component_type: str,
    component_name: str,
) -> LifecycleResolveResponse:
    """Return the preferred current ACTIVE version for a component family.

    Selection rules:
    1. Only ACTIVE records are considered.
    2. Among ACTIVE records valid now, the one with the most recent
       ``effective_from`` is preferred.
    3. If no ACTIVE record is valid now, returns a response with
       ``resolved_record=None``.

    DEPRECATED and RETIRED records are never returned as the "current" version,
    even if they are the only records for the component family.

    Args:
        db:             Database session.
        component_type: Component type to resolve.
        component_name: Component name to resolve.

    Returns:
        LifecycleResolveResponse with is_current=True if a record was found.
    """
    now_utc = datetime.now(timezone.utc)

    active_records = (
        db.query(ComponentLifecycle)
        .filter(
            ComponentLifecycle.component_type == component_type,
            ComponentLifecycle.component_name == component_name,
            ComponentLifecycle.status == LifecycleStatus.ACTIVE,
        )
        .order_by(ComponentLifecycle.effective_from.desc())
        .all()
    )

    matched: Optional[ComponentLifecycle] = None
    for record in active_records:
        if is_valid_at(record, now_utc):
            matched = record
            break

    if matched is None:
        return LifecycleResolveResponse(
            component_type=component_type,
            component_name=component_name,
            query_timestamp=now_utc,
            resolved_record=None,
            resolution_note=(
                f"No ACTIVE lifecycle record for '{component_type}/{component_name}' "
                f"is currently valid.  DEPRECATED/RETIRED records are not selected "
                f"as the current version."
            ),
            is_current=False,
        )

    return LifecycleResolveResponse(
        component_type=component_type,
        component_name=component_name,
        query_timestamp=now_utc,
        resolved_record=_to_schema(matched),
        resolution_note=(
            f"Current ACTIVE version is '{matched.version}' "
            f"(schema '{matched.schema_version}'), "
            f"effective from {_utc(matched.effective_from).isoformat()}."
        ),
        is_current=True,
    )
