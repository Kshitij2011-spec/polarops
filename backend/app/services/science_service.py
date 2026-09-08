"""Domain service for Scientific Instrument Observation Buffering and Data Continuity."""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.entities import (
    CommunicationLink,
    ScientificInstrument,
    ScientificObservation,
    SyncQueueItem,
)
from app.models.enums import CommsLinkStatus, Quality, SyncStatus, TruthType
from app.schemas.common import ProvenanceSchema
from app.schemas.resilience import (
    BufferObservationRequest,
    ScienceInstrumentDetailResponse,
    ScienceObservationSchema,
)
from app.services.sync_service import compute_canonical_checksum, get_or_create_link


def _utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetime is UTC-aware for safe subtraction and comparison."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def evaluate_observation_metadata_completeness(obs: ScientificObservation) -> str:
    """Evaluate deterministic completeness of an observation's metadata.

    Returns COMPLETE, PARTIAL, or MISSING based on populated required fields:
    instrument_id, timestamp, measurement_value, unit, quality, source, truth_type.
    """
    required_fields = [
        obs.instrument_id,
        obs.timestamp,
        obs.measurement_value,
        obs.unit,
        obs.quality,
        obs.source,
        obs.truth_type,
    ]
    populated = sum(1 for f in required_fields if f is not None and str(f).strip() != "")
    if populated == 0:
        return "MISSING"
    if populated == len(required_fields):
        return "COMPLETE"
    return "PARTIAL"


def evaluate_instrument_metadata_completeness(
    inst: ScientificInstrument,
    recent_observations: Optional[List[ScientificObservation]] = None,
) -> str:
    """Evaluate deterministic completeness of an instrument and its observations.

    Checks:
    id, station_id, code, name, instrument_type, calibration_status, last_seen_at.
    If observations are present, incorporates observation field completeness.
    """
    required_fields = [
        inst.id,
        inst.station_id,
        inst.code,
        inst.name,
        inst.instrument_type,
        inst.calibration_status,
        inst.last_seen_at,
    ]
    populated = sum(1 for f in required_fields if f is not None and str(f).strip() != "")
    total = len(required_fields)

    if recent_observations:
        for obs in recent_observations:
            obs_req = [
                obs.instrument_id,
                obs.timestamp,
                obs.measurement_value,
                obs.unit,
                obs.quality,
                obs.source,
                obs.truth_type,
            ]
            populated += sum(1 for f in obs_req if f is not None and str(f).strip() != "")
            total += len(obs_req)

    if populated == 0:
        return "MISSING"
    if populated == total:
        return "COMPLETE"
    return "PARTIAL"


def build_observation_provenance(
    obs: ScientificObservation,
    is_buffered: bool = False,
) -> ProvenanceSchema:
    """Construct canonical ProvenanceSchema for a scientific observation.

    - Timestamp comes from the observation timestamp if available.
    - Naive SQLite timestamps are made timezone-aware (UTC).
    - Future timestamps clamp freshness to 0.0 seconds.
    - Missing timestamps fall back to current UTC time with 1.0s default freshness.
    - Buffered state preserves truth_type (MEASURED remains MEASURED).
    - Measurement quality (GOOD, SUSPECT, BAD) is preserved directly and determines confidence.
    """
    now_utc = datetime.now(timezone.utc)
    obs_ts = _utc(obs.timestamp)

    if obs_ts is not None:
        freshness = max(0.0, (now_utc - obs_ts).total_seconds())
        provenance_ts = obs_ts
    else:
        freshness = 1.0
        provenance_ts = now_utc

    # Resolve Quality
    raw_qual = obs.quality
    if isinstance(raw_qual, Quality):
        qual = raw_qual
    elif raw_qual and str(raw_qual).upper() in Quality.__members__:
        qual = Quality(str(raw_qual).upper())
    else:
        qual = Quality.GOOD

    # Resolve TruthType (buffered observations remain MEASURED if direct measurement)
    raw_truth = obs.truth_type
    if isinstance(raw_truth, TruthType):
        truth = raw_truth
    elif raw_truth and str(raw_truth).upper() in TruthType.__members__:
        truth = TruthType(str(raw_truth).upper())
    else:
        truth = TruthType.MEASURED

    source = obs.source or ("LOCAL_EDGE_BUFFER" if is_buffered else f"sensor:{obs.instrument_id}")
    confidence = 1.0 if qual == Quality.GOOD else 0.7 if qual == Quality.SUSPECT else 0.2

    return ProvenanceSchema(
        source=source,
        timestamp=provenance_ts,
        freshness_seconds=round(freshness, 2),
        quality=qual,
        truth_type=truth,
        confidence=confidence,
    )


def get_all_instruments(db: Session, station_id: str = "STATION-BHARATI") -> List[ScienceInstrumentDetailResponse]:
    """Retrieve all scientific experiment instruments for a station."""
    instruments = db.query(ScientificInstrument).filter(ScientificInstrument.station_id == station_id).all()
    results = []
    for inst in instruments:
        detail = get_instrument_detail(db, inst.id)
        if detail:
            results.append(detail)
    return results


def get_instrument_detail(db: Session, instrument_id: str) -> Optional[ScienceInstrumentDetailResponse]:
    """Retrieve detailed instrument state, recent observations, and local buffer count.

    Buffering is derived from the actual SyncQueueItem state:
    - Normal observation (no queue item or reconciled) -> is_buffered = False
    - Actually queued observation (PENDING, TRANSFERRING, FAILED_RETRY) -> is_buffered = True
    - Synchronized/recovered observation (RECONCILED) -> is_buffered = False
    Database ID thresholds (obs.id > 100) are NEVER used.
    """
    inst = db.query(ScientificInstrument).filter(ScientificInstrument.id == instrument_id).first()
    if not inst:
        return None

    observations = (
        db.query(ScientificObservation)
        .filter(ScientificObservation.instrument_id == instrument_id)
        .order_by(ScientificObservation.timestamp.desc())
        .limit(10)
        .all()
    )

    # Gather queue items associated with this station's science observation buffer
    obs_ids = [obs.id for obs in observations]
    qitem_ids = [f"QITEM-SCI-{oid}" for oid in obs_ids]

    sync_items = (
        db.query(SyncQueueItem)
        .filter(
            SyncQueueItem.station_id == inst.station_id,
            (SyncQueueItem.id.in_(qitem_ids)) | (SyncQueueItem.event_type == "SCIENCE_OBSERVATION_BUFFER"),
        )
        .all()
    )

    # Map observation_id -> SyncQueueItem
    obs_sync_map: Dict[int, SyncQueueItem] = {}
    for item in sync_items:
        if item.id.startswith("QITEM-SCI-"):
            try:
                oid = int(item.id.replace("QITEM-SCI-", ""))
                obs_sync_map[oid] = item
            except ValueError:
                pass
        elif item.payload_json:
            try:
                payload = json.loads(item.payload_json)
                oid = payload.get("observation_id")
                if oid is not None and oid not in obs_sync_map:
                    obs_sync_map[int(oid)] = item
            except Exception:
                pass

    # Count how many observations are pending in sync queue
    buffered_count = (
        db.query(SyncQueueItem)
        .filter(
            SyncQueueItem.station_id == inst.station_id,
            SyncQueueItem.event_type == "SCIENCE_OBSERVATION_BUFFER",
            SyncQueueItem.status.in_([SyncStatus.PENDING, SyncStatus.TRANSFERRING, SyncStatus.FAILED_RETRY]),
        )
        .count()
    )

    obs_schemas = []
    for obs in observations:
        qitem = obs_sync_map.get(obs.id)
        if qitem:
            is_active_buffered = qitem.status in [
                SyncStatus.PENDING,
                SyncStatus.TRANSFERRING,
                SyncStatus.FAILED_RETRY,
            ]
            sync_st = str(qitem.status.value if hasattr(qitem.status, "value") else qitem.status)
        else:
            is_active_buffered = False
            sync_st = "RECONCILED"

        completeness = evaluate_observation_metadata_completeness(obs)
        prov = build_observation_provenance(obs, is_buffered=is_active_buffered)

        obs_schemas.append(
            ScienceObservationSchema(
                id=obs.id,
                instrument_id=obs.instrument_id,
                timestamp=obs.timestamp,
                measurement_value=obs.measurement_value,
                unit=obs.unit,
                quality=str(obs.quality.value if hasattr(obs.quality, "value") else obs.quality),
                source=obs.source,
                truth_type=str(obs.truth_type.value if hasattr(obs.truth_type, "value") else obs.truth_type),
                is_buffered=is_active_buffered,
                sync_status=sync_st,
                metadata_completeness=completeness,
                provenance=prov,
            )
        )

    inst_completeness = evaluate_instrument_metadata_completeness(inst, observations)

    now_utc = datetime.now(timezone.utc)
    inst_seen = _utc(inst.last_seen_at)
    inst_freshness = max(0.0, (now_utc - inst_seen).total_seconds()) if inst_seen else 1.0

    return ScienceInstrumentDetailResponse(
        id=inst.id,
        station_id=inst.station_id,
        code=inst.code,
        name=inst.name,
        instrument_type=inst.instrument_type,
        health=inst.health,
        power_status=inst.power_status,
        calibration_status=inst.calibration_status,
        last_seen_at=inst.last_seen_at,
        metadata_completeness=inst_completeness,
        buffered_observations_count=buffered_count,
        recent_observations=obs_schemas,
        truth_type=str(TruthType.MEASURED),
        provenance=ProvenanceSchema(
            source=f"science_service:{inst.code}",
            timestamp=inst_seen or now_utc,
            freshness_seconds=round(inst_freshness, 2),
            quality=Quality.GOOD if inst.health == "NOMINAL" else Quality.SUSPECT,
            truth_type=TruthType.MEASURED,
            confidence=1.0 if inst.health == "NOMINAL" else 0.8,
        ),
    )


def buffer_science_observation(db: Session, req: BufferObservationRequest) -> ScienceObservationSchema:
    """Buffer a scientific observation locally while offline, registering a P2 queue item."""
    inst = db.query(ScientificInstrument).filter(ScientificInstrument.id == req.instrument_id).first()
    if not inst:
        raise ValueError(f"Scientific instrument '{req.instrument_id}' not found.")

    now_utc = datetime.now(timezone.utc)
    new_obs = ScientificObservation(
        instrument_id=req.instrument_id,
        timestamp=now_utc,
        measurement_value=req.measurement_value,
        unit=req.unit,
        quality=Quality.GOOD,
        source="LOCAL_EDGE_BUFFER",
        truth_type=TruthType.MEASURED,
        created_at=now_utc,
    )
    db.add(new_obs)
    db.flush()

    # Create associated P2 SyncQueueItem
    payload = {
        "observation_id": new_obs.id,
        "instrument_id": req.instrument_id,
        "instrument_code": inst.code,
        "value": req.measurement_value,
        "unit": req.unit,
        "timestamp": now_utc.isoformat(),
    }
    payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    checksum = compute_canonical_checksum(payload_str)

    queue_item = SyncQueueItem(
        id=f"QITEM-SCI-{new_obs.id}",
        station_id=inst.station_id,
        event_type="SCIENCE_OBSERVATION_BUFFER",
        payload_json=payload_str,
        priority=2,  # P2 Important
        status=SyncStatus.PENDING,
        checksum_sha256=checksum,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(queue_item)
    db.commit()
    db.refresh(new_obs)

    completeness = evaluate_observation_metadata_completeness(new_obs)
    prov = build_observation_provenance(new_obs, is_buffered=True)

    return ScienceObservationSchema(
        id=new_obs.id,
        instrument_id=new_obs.instrument_id,
        timestamp=new_obs.timestamp,
        measurement_value=new_obs.measurement_value,
        unit=new_obs.unit,
        quality=str(new_obs.quality.value if hasattr(new_obs.quality, "value") else new_obs.quality),
        source=new_obs.source,
        truth_type=str(new_obs.truth_type.value if hasattr(new_obs.truth_type, "value") else new_obs.truth_type),
        is_buffered=True,
        sync_status="PENDING",
        metadata_completeness=completeness,
        provenance=prov,
    )


def record_science_observation(
    db: Session,
    req: BufferObservationRequest,
    force_buffer: Optional[bool] = None,
) -> ScienceObservationSchema:
    """Record a scientific observation with communication link continuity awareness.

    - ONLINE: observation accepted normally; is_buffered = False.
    - DEGRADED: observation remains operationally capturable; queued if link capacity
      is constrained (< 512 kbps), otherwise streamed directly.
    - OFFLINE: observation locally buffered in P2 priority queue; is_buffered = True.
    """
    inst = db.query(ScientificInstrument).filter(ScientificInstrument.id == req.instrument_id).first()
    if not inst:
        raise ValueError(f"Scientific instrument '{req.instrument_id}' not found.")

    link = get_or_create_link(db, inst.station_id)

    # Determine buffering based on comms state
    if force_buffer is not None:
        should_buffer = force_buffer
    elif link.status == CommsLinkStatus.OFFLINE:
        should_buffer = True
    elif link.status == CommsLinkStatus.DEGRADED:
        should_buffer = link.bandwidth_kbps < 512
    else:  # ONLINE
        should_buffer = False

    if should_buffer:
        return buffer_science_observation(db, req)

    # Direct observation path
    now_utc = datetime.now(timezone.utc)
    new_obs = ScientificObservation(
        instrument_id=req.instrument_id,
        timestamp=now_utc,
        measurement_value=req.measurement_value,
        unit=req.unit,
        quality=Quality.GOOD,
        source="DIRECT_SENSOR_STREAM" if link.status == CommsLinkStatus.ONLINE else "DEGRADED_STREAM",
        truth_type=TruthType.MEASURED,
        created_at=now_utc,
    )
    db.add(new_obs)
    db.commit()
    db.refresh(new_obs)

    completeness = evaluate_observation_metadata_completeness(new_obs)
    prov = build_observation_provenance(new_obs, is_buffered=False)

    return ScienceObservationSchema(
        id=new_obs.id,
        instrument_id=new_obs.instrument_id,
        timestamp=new_obs.timestamp,
        measurement_value=new_obs.measurement_value,
        unit=new_obs.unit,
        quality=str(new_obs.quality.value if hasattr(new_obs.quality, "value") else new_obs.quality),
        source=new_obs.source,
        truth_type=str(new_obs.truth_type.value if hasattr(new_obs.truth_type, "value") else new_obs.truth_type),
        is_buffered=False,
        sync_status="RECONCILED",
        metadata_completeness=completeness,
        provenance=prov,
    )
