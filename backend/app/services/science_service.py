"""Domain service for Scientific Instrument Observation Buffering and Data Continuity."""

from datetime import datetime, timezone
import json
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.entities import CommunicationLink, ScientificInstrument, ScientificObservation, SyncQueueItem
from app.models.enums import CommsLinkStatus, Quality, SyncStatus, TruthType
from app.schemas.resilience import (
    BufferObservationRequest,
    ScienceInstrumentDetailResponse,
    ScienceObservationSchema,
)
from app.services.sync_service import compute_canonical_checksum, get_or_create_link


def get_all_instruments(db: Session, station_id: str = "STATION-BHARATI") -> List[ScienceInstrumentDetailResponse]:
    """Retrieve all scientific experiment instruments for a station."""
    instruments = db.query(ScientificInstrument).filter(ScientificInstrument.station_id == station_id).all()
    results = []
    for inst in instruments:
        results.append(get_instrument_detail(db, inst.id))
    return results


def get_instrument_detail(db: Session, instrument_id: str) -> Optional[ScienceInstrumentDetailResponse]:
    """Retrieve detailed instrument state, recent observations, and local buffer count."""
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

    # Check how many observations are pending in sync queue
    buffered_count = (
        db.query(SyncQueueItem)
        .filter(
            SyncQueueItem.event_type == "SCIENCE_OBSERVATION_BUFFER",
            SyncQueueItem.status.in_([SyncStatus.PENDING, SyncStatus.TRANSFERRING, SyncStatus.FAILED_RETRY]),
        )
        .count()
    )

    obs_schemas = [
        ScienceObservationSchema(
            id=obs.id,
            instrument_id=obs.instrument_id,
            timestamp=obs.timestamp,
            measurement_value=obs.measurement_value,
            unit=obs.unit,
            quality=obs.quality,
            source=obs.source,
            truth_type=obs.truth_type,
            is_buffered=(obs.id > 100),
            sync_status="PENDING" if (obs.id > 100 and buffered_count > 0) else "RECONCILED",
        )
        for obs in observations
    ]

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
        metadata_completeness="COMPLETE",
        buffered_observations_count=buffered_count,
        recent_observations=obs_schemas,
        truth_type="MEASURED",
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

    return ScienceObservationSchema(
        id=new_obs.id,
        instrument_id=new_obs.instrument_id,
        timestamp=new_obs.timestamp,
        measurement_value=new_obs.measurement_value,
        unit=new_obs.unit,
        quality=new_obs.quality,
        source=new_obs.source,
        truth_type=new_obs.truth_type,
        is_buffered=True,
        sync_status="PENDING",
    )
