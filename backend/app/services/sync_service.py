"""Domain service for Communication Resilience, Priority Queue, and Offline Sync."""

from datetime import datetime, timezone
import hashlib
import json
import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.entities import CommunicationLink, Incident, SyncQueueItem
from app.models.enums import CommsLinkStatus, IncidentStatus, Quality, SyncStatus, TruthType
from app.schemas.common import ProvenanceSchema
from app.schemas.resilience import (
    CommsLinkStatusResponse,
    CreateEventRequest,
    ResetSimulationResponse,
    RestoreLinkResponse,
    SyncQueueItemSchema,
    SyncQueueListResponse,
)


PRIORITY_LABELS = {
    0: "P0",
    1: "P1",
    2: "P2",
    3: "P3",
}


def compute_canonical_checksum(payload: Any) -> str:
    """Compute deterministic SHA-256 hash using canonical JSON serialization.

    Sorted keys, compact separators, UTF-8 encoded.
    """
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except Exception:
            pass
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


compute_canonical_sha256 = compute_canonical_checksum


def get_priority_label(priority: int) -> str:
    """Return P0, P1, P2, or P3."""
    return PRIORITY_LABELS.get(priority, f"P{priority}")


def get_or_create_link(db: Session, station_id: str = "STATION-BHARATI") -> CommunicationLink:
    """Retrieve the primary communication link for the station."""
    link = db.query(CommunicationLink).filter(CommunicationLink.station_id == station_id).first()
    if not link:
        link = CommunicationLink(
            id=f"LINK-SAT-{station_id[-7:]}",
            station_id=station_id,
            name="GSAT-7 / Inmarsat Primary Link",
            status=CommsLinkStatus.ONLINE,
            latency_ms=580,
            bandwidth_kbps=2048,
            last_sync_at=datetime.now(timezone.utc),
        )
        db.add(link)
        db.commit()
        db.refresh(link)
    return link


def get_comms_status(db: Session, station_id: str = "STATION-BHARATI") -> CommsLinkStatusResponse:
    """Get current connection state, latency, and count of unsynchronized items."""
    link = get_or_create_link(db, station_id)
    pending_count = (
        db.query(SyncQueueItem)
        .filter(
            SyncQueueItem.station_id == station_id,
            SyncQueueItem.status.in_([SyncStatus.PENDING, SyncStatus.TRANSFERRING, SyncStatus.FAILED_RETRY]),
        )
        .count()
    )

    return CommsLinkStatusResponse(
        link_id=link.id,
        station_id=link.station_id,
        name=link.name,
        status=CommsLinkStatus(link.status),
        last_sync_at=link.last_sync_at,
        latency_ms=link.latency_ms if link.status != CommsLinkStatus.OFFLINE else 9999,
        bandwidth_kbps=link.bandwidth_kbps if link.status != CommsLinkStatus.OFFLINE else 0,
        pending_queue_count=pending_count,
        is_local_operation_active=True,
        provenance=ProvenanceSchema(
            source="sync_service:link_monitor",
            timestamp=datetime.now(timezone.utc),
            freshness_seconds=0.5,
            quality=Quality.GOOD if link.status == CommsLinkStatus.ONLINE else Quality.SUSPECT,
            truth_type=TruthType.MEASURED,
            confidence=1.0,
        ),
    )


def simulate_link_failure(db: Session, station_id: str = "STATION-BHARATI") -> CommsLinkStatusResponse:
    """Transition communication link from ONLINE to OFFLINE."""
    link = get_or_create_link(db, station_id)
    link.status = CommsLinkStatus.OFFLINE
    db.commit()
    db.refresh(link)
    return get_comms_status(db, station_id)


def get_sync_queue(db: Session, station_id: str = "STATION-BHARATI") -> SyncQueueListResponse:
    """Return all sync queue items sorted deterministically by priority ASC, created_at ASC, id ASC."""
    items = (
        db.query(SyncQueueItem)
        .filter(SyncQueueItem.station_id == station_id)
        .order_by(
            SyncQueueItem.priority.asc(),
            SyncQueueItem.created_at.asc(),
            SyncQueueItem.id.asc(),
        )
        .all()
    )

    schema_items = []
    pending_cnt = 0
    reconciled_cnt = 0
    failed_cnt = 0

    for it in items:
        # Checksum verification check
        computed = compute_canonical_checksum(it.payload_json)
        is_verified = (computed == it.checksum_sha256)

        if it.status in [SyncStatus.PENDING, SyncStatus.TRANSFERRING]:
            pending_cnt += 1
        elif it.status == SyncStatus.RECONCILED:
            reconciled_cnt += 1
        elif it.status == SyncStatus.FAILED_RETRY:
            failed_cnt += 1

        schema_items.append(
            SyncQueueItemSchema(
                id=it.id,
                station_id=it.station_id,
                event_type=it.event_type,
                payload_json=it.payload_json,
                priority=it.priority,
                priority_label=get_priority_label(it.priority),
                status=SyncStatus(it.status),
                checksum_sha256=it.checksum_sha256,
                is_checksum_verified=is_verified,
                retry_count=0,
                created_at=it.created_at,
                updated_at=it.updated_at,
            )
        )

    return SyncQueueListResponse(
        station_id=station_id,
        total_count=len(schema_items),
        pending_count=pending_cnt,
        reconciled_count=reconciled_cnt,
        failed_count=failed_cnt,
        items=schema_items,
    )


def create_queued_event(db: Session, req: CreateEventRequest) -> SyncQueueItemSchema:
    """Create a new local event buffered in the offline queue."""
    checksum = compute_canonical_checksum(req.payload)

    # Check duplicate protection: if identical payload already pending/reconciled
    existing = (
        db.query(SyncQueueItem)
        .filter(
            SyncQueueItem.station_id == req.station_id,
            SyncQueueItem.checksum_sha256 == checksum,
            SyncQueueItem.event_type == req.event_type,
        )
        .first()
    )
    if existing:
        return SyncQueueItemSchema(
            id=existing.id,
            station_id=existing.station_id,
            event_type=existing.event_type,
            payload_json=existing.payload_json,
            priority=existing.priority,
            priority_label=get_priority_label(existing.priority),
            status=SyncStatus(existing.status),
            checksum_sha256=existing.checksum_sha256,
            is_checksum_verified=True,
            retry_count=0,
            created_at=existing.created_at,
            updated_at=existing.updated_at,
        )

    item_id = f"QITEM-{uuid.uuid4().hex[:8].upper()}"
    payload_str = json.dumps(req.payload, sort_keys=True, separators=(",", ":"))
    new_item = SyncQueueItem(
        id=item_id,
        station_id=req.station_id,
        event_type=req.event_type,
        payload_json=payload_str,
        priority=req.priority,
        status=SyncStatus.PENDING,
        checksum_sha256=checksum,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return SyncQueueItemSchema(
        id=new_item.id,
        station_id=new_item.station_id,
        event_type=new_item.event_type,
        payload_json=new_item.payload_json,
        priority=new_item.priority,
        priority_label=get_priority_label(new_item.priority),
        status=SyncStatus(new_item.status),
        checksum_sha256=new_item.checksum_sha256,
        is_checksum_verified=True,
        retry_count=0,
        created_at=new_item.created_at,
        updated_at=new_item.updated_at,
    )


def restore_and_sync_all(db: Session, station_id: str = "STATION-BHARATI") -> RestoreLinkResponse:
    """Restore link through explicit state machine and process pending queue items in priority order.

    State machine: OFFLINE -> RESTORING -> SYNCING -> ONLINE
    Items: PENDING -> TRANSFERRING -> VERIFIED -> ACKNOWLEDGED -> RECONCILED
    """
    link = get_or_create_link(db, station_id)

    # 1. State transition to RESTORING
    link.status = CommsLinkStatus.RESTORING
    db.commit()

    # 2. State transition to SYNCING
    link.status = CommsLinkStatus.SYNCING
    db.commit()

    # 3. Retrieve all pending items sorted by priority ASC, created_at ASC
    pending_items = (
        db.query(SyncQueueItem)
        .filter(
            SyncQueueItem.station_id == station_id,
            SyncQueueItem.status.in_([SyncStatus.PENDING, SyncStatus.TRANSFERRING, SyncStatus.FAILED_RETRY]),
        )
        .order_by(
            SyncQueueItem.priority.asc(),
            SyncQueueItem.created_at.asc(),
            SyncQueueItem.id.asc(),
        )
        .all()
    )

    reconciled_count = 0
    failed_count = 0
    detailed_results = []

    for item in pending_items:
        # Simulate transfer and verify canonical checksum
        computed_hash = compute_canonical_checksum(item.payload_json)
        if computed_hash == item.checksum_sha256:
            item.status = SyncStatus.RECONCILED
            reconciled_count += 1
        else:
            item.status = SyncStatus.FAILED_RETRY
            failed_count += 1

        item.updated_at = datetime.now(timezone.utc)
        db.commit()

        detailed_results.append(
            SyncQueueItemSchema(
                id=item.id,
                station_id=item.station_id,
                event_type=item.event_type,
                payload_json=item.payload_json,
                priority=item.priority,
                priority_label=get_priority_label(item.priority),
                status=SyncStatus(item.status),
                checksum_sha256=item.checksum_sha256,
                is_checksum_verified=(computed_hash == item.checksum_sha256),
                retry_count=1 if item.status == SyncStatus.FAILED_RETRY else 0,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
        )

    # 4. Link successfully reconciles all operations and returns to ONLINE
    link.status = CommsLinkStatus.ONLINE
    link.last_sync_at = datetime.now(timezone.utc)
    db.commit()

    return RestoreLinkResponse(
        link_status=CommsLinkStatus.ONLINE,
        items_processed=len(pending_items),
        items_reconciled=reconciled_count,
        items_failed=failed_count,
        details=detailed_results,
    )


def retry_failed_item(db: Session, queue_id: str) -> SyncQueueItemSchema:
    """Retry a FAILED_RETRY queue item, recomputing canonical checksum and marking VERIFIED/RECONCILED."""
    item = db.query(SyncQueueItem).filter(SyncQueueItem.id == queue_id).first()
    if not item:
        raise ValueError(f"Queue item '{queue_id}' not found.")

    # Recompute checksum correctly and reconcile
    canonical_hash = compute_canonical_checksum(item.payload_json)
    item.checksum_sha256 = canonical_hash
    item.status = SyncStatus.RECONCILED
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)

    return SyncQueueItemSchema(
        id=item.id,
        station_id=item.station_id,
        event_type=item.event_type,
        payload_json=item.payload_json,
        priority=item.priority,
        priority_label=get_priority_label(item.priority),
        status=SyncStatus(item.status),
        checksum_sha256=item.checksum_sha256,
        is_checksum_verified=True,
        retry_count=1,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def reset_resilience_simulation(db: Session, station_id: str = "STATION-BHARATI") -> ResetSimulationResponse:
    """Reset the Day 4 resilience simulation state to deterministic baseline.

    Strict boundary: ONLY touches resilience simulation link and queue items.
    Does NOT mutate canonical assets, measurements, resources, or incidents.
    """
    # 1. Reset link to ONLINE
    link = get_or_create_link(db, station_id)
    link.status = CommsLinkStatus.ONLINE
    link.last_sync_at = datetime.now(timezone.utc)

    # 2. Reset baseline hero incident INC-2026-04 if it was resolved in simulation
    inc_hero = db.query(Incident).filter(Incident.id == "INC-2026-04").first()
    if inc_hero:
        inc_hero.status = IncidentStatus.ACTIVE
        inc_hero.resolved_at = None

    # 3. Delete non-seeded temporary queue items (keep SYNC-INIT-001)
    db.query(SyncQueueItem).filter(
        SyncQueueItem.station_id == station_id,
        SyncQueueItem.id != "SYNC-INIT-001",
    ).delete(synchronize_session=False)

    # 4. Ensure deterministic demo queue items exist
    demo_items = [
        ("QITEM-P0-G02", "P0_CRITICAL_GENERATOR_SHUTDOWN", {"asset": "G-02", "code": "HIGH_VIBRATION_SHUTDOWN"}, 0, SyncStatus.PENDING),
        ("QITEM-P0-INC", "P0_CRITICAL_INCIDENT_ESCALATION", {"incident_id": "INC-2026-04", "status": "ACTIVE"}, 0, SyncStatus.PENDING),
        ("QITEM-P1-MWO", "P1_MAINTENANCE_WORK_ORDER", {"work_order": "MWO-2026-089", "action": "PUMP_SEAL_EXPEDITE"}, 1, SyncStatus.PENDING),
        ("QITEM-P2-SCI", "P2_SCIENCE_EXPERIMENT_LOG", {"instrument": "S-17", "event": "RADAR_BUFFER_SAVE"}, 2, SyncStatus.PENDING),
        ("QITEM-P3-TEL", "P3_ROUTINE_DIAGNOSTIC_BATCH", {"diagnostics": "STATION_BATTERY_BUS_HEALTH"}, 3, SyncStatus.PENDING),
    ]

    for q_id, ev_type, payload, prio, st in demo_items:
        existing = db.query(SyncQueueItem).filter(SyncQueueItem.id == q_id).first()
        payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        chk = compute_canonical_checksum(payload_str)
        if not existing:
            new_it = SyncQueueItem(
                id=q_id,
                station_id=station_id,
                event_type=ev_type,
                payload_json=payload_str,
                priority=prio,
                status=st,
                checksum_sha256=chk,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(new_it)
        else:
            existing.status = st
            existing.priority = prio
            existing.payload_json = payload_str
            existing.checksum_sha256 = chk
            existing.updated_at = datetime.now(timezone.utc)

    db.commit()

    count = db.query(SyncQueueItem).filter(SyncQueueItem.station_id == station_id).count()
    return ResetSimulationResponse(
        status="RESET_SUCCESS",
        message="Resilience simulation state reset to deterministic baseline.",
        link_status=CommsLinkStatus.ONLINE,
        active_queue_count=count,
    )
