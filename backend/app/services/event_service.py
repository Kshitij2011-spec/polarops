"""Domain service for Canonical Operational Event Stream management, querying, and deterministic simulation."""

from datetime import datetime, timedelta, timezone
import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.entities import EventLog, Station
from app.models.enums import Quality, TruthType
from app.schemas.common import ProvenanceSchema
from app.schemas.events import (
    EventListResponse,
    OperationalEventSchema,
    ResetEventsResponse,
)


def _to_event_schema(ev: EventLog) -> OperationalEventSchema:
    """Convert an EventLog ORM model to OperationalEventSchema."""
    meta_dict = None
    if ev.metadata_json:
        try:
            meta_dict = json.loads(ev.metadata_json)
        except Exception:
            meta_dict = {"raw": ev.metadata_json}

    return OperationalEventSchema(
        id=ev.id,
        timestamp=ev.timestamp,
        station_id=ev.station_id,
        event_type=ev.event_type or "TELEMETRY_CHANGE",
        severity=ev.severity or "INFO",
        entity_type=ev.entity_type,
        entity_id=ev.entity_id,
        title=ev.title or ev.message,
        summary=ev.summary or ev.message,
        source=ev.source or "SYNTHETIC_SIMULATION",
        truth_type=ev.truth_type or "MEASURED",
        metadata=meta_dict,
    )


def get_operational_events(
    db: Session,
    station_id: str = "STATION-BHARATI",
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> EventListResponse:
    """Query operational event stream with deterministic reverse-chronological ordering."""
    # Resolve station
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        station = db.query(Station).filter(Station.code == station_id.upper()).first()
    target_station_id = station.id if station else station_id

    # Auto-seed baseline events if timeline is unpopulated
    if db.query(EventLog).filter(EventLog.station_id == target_station_id).count() == 0:
        reset_operational_events(db, target_station_id)

    query = db.query(EventLog).filter(EventLog.station_id == target_station_id)

    if severity:
        query = query.filter(EventLog.severity == severity.upper())

    if event_type:
        query = query.filter(EventLog.event_type == event_type.upper())

    # Deterministic ordering: latest timestamp first, then largest ID first
    query = query.order_by(EventLog.timestamp.desc(), EventLog.id.desc())

    total = query.count()
    items = query.offset(offset).limit(limit).all()

    schema_events = [_to_event_schema(it) for it in items]

    return EventListResponse(
        station_id=target_station_id,
        total_count=total,
        events=schema_events,
        provenance=ProvenanceSchema(
            source="event_service:operational_stream",
            timestamp=datetime.now(timezone.utc),
            freshness_seconds=0.1,
            quality=Quality.GOOD,
            truth_type=TruthType.MEASURED,
            confidence=1.0,
        ),
    )


def record_operational_event(
    db: Session,
    station_id: str,
    event_type: str,
    severity: str,
    title: str,
    summary: str,
    message: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    source: str = "SYNTHETIC_SIMULATION",
    truth_type: str = "MEASURED",
    metadata: Optional[Dict[str, Any]] = None,
    timestamp: Optional[datetime] = None,
) -> OperationalEventSchema:
    """Record a new operational event into the canonical EventLog table."""
    meta_str = json.dumps(metadata, sort_keys=True) if metadata else None
    ev = EventLog(
        station_id=station_id,
        event_type=event_type,
        category=entity_type or "OPERATIONAL",
        severity=severity,
        entity_type=entity_type,
        entity_id=entity_id,
        title=title,
        summary=summary,
        message=message or f"{title}: {summary}",
        timestamp=timestamp or datetime.now(timezone.utc),
        source=source,
        truth_type=truth_type,
        metadata_json=meta_str,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _to_event_schema(ev)


# Bounded deterministic demo progression sequence
DEMO_STEPS = [
    {
        "event_type": "TELEMETRY_CHANGE",
        "severity": "WARNING",
        "entity_type": "ASSET",
        "entity_id": "G-02",
        "title": "G-02 bearing vibration elevated to 4.8 mm/s",
        "summary": "Drive-end bearing accelerometer observed persistent elevation (4.8 mm/s vs 4.0 mm/s limit).",
        "truth_type": "MEASURED",
        "metadata": {"metric": "bearing_vibration_mm_s", "value": 4.8, "threshold": 4.0},
    },
    {
        "event_type": "THRESHOLD_BREACH",
        "severity": "WARNING",
        "entity_type": "ASSET",
        "entity_id": "G-02",
        "title": "G-02 vibration crossed warning limit",
        "summary": "Bearing vibration exceeded 4.0 mm/s warning threshold for > 15 consecutive minutes.",
        "truth_type": "MEASURED",
        "metadata": {"limit": 4.0, "current": 4.8, "duration_minutes": 18},
    },
    {
        "event_type": "RISK_CHANGE",
        "severity": "WARNING",
        "entity_type": "ASSET",
        "entity_id": "G-02",
        "title": "G-02 condition risk increased to 78/100",
        "summary": "6-factor composite risk model escalated generator status from NOMINAL to WARNING.",
        "truth_type": "DERIVED",
        "metadata": {"composite_risk": 78, "health_score": 62, "critical_factors": ["vibration", "temperature"]},
    },
    {
        "event_type": "DEPENDENCY_EXPOSURE",
        "severity": "WARNING",
        "entity_type": "SERVICE",
        "entity_id": "ZONE_2_HEATING",
        "title": "Habitat Zone 2 heating dependency exposed",
        "summary": "Thermal Loop B heat recovery margin degraded; dependent living quarters heating at risk.",
        "truth_type": "DERIVED",
        "metadata": {"impacted_service": "Heating - Living Quarters", "affected_zone": "Habitat Zone 2", "blast_depth": 2},
    },
    {
        "event_type": "MAINTENANCE_BLOCKED",
        "severity": "WARNING",
        "entity_type": "RESOURCE",
        "entity_id": "SK-402",
        "title": "SK-402 Rotary Seal Kit stockout blocks repair",
        "summary": "Bharati Central Spares inventory has 0 local units; preventive overhaul deferred until resupply.",
        "truth_type": "MEASURED",
        "metadata": {"part_id": "SK-402", "quantity_available": 0, "quantity_required": 1},
    },
    {
        "event_type": "RESUPPLY_CHANGE",
        "severity": "INFO",
        "entity_type": "RESOURCE",
        "entity_id": "RESUPPLY-GOLOVNIN",
        "title": "MV Vasiliy Golovnin ETA confirmed in 11 days",
        "summary": "Indian Antarctic Expedition logistics ship carrying 4x SK-402 kits on schedule.",
        "truth_type": "FORECAST",
        "metadata": {"vessel": "MV Vasiliy Golovnin", "eta_days": 11, "cargo_includes": ["SK-402", "DIESEL_LFO"]},
    },
    {
        "event_type": "WEATHER_CHANGE",
        "severity": "INFO",
        "entity_type": "ENVIRONMENT",
        "entity_id": "WEATHER",
        "title": "Weather: ambient temperature -28.5°C; wind 42 kt",
        "summary": "Blizzard warning active in Larsemann Hills sector; wind chill reached -41.2°C.",
        "truth_type": "MEASURED",
        "metadata": {"temperature_c": -28.5, "wind_speed_kt": 42.0, "wind_chill_c": -41.2},
    },
    {
        "event_type": "SCIENCE_BUFFER_EVENT",
        "severity": "INFO",
        "entity_type": "SCIENCE",
        "entity_id": "INST-S17-RADAR",
        "title": "S-17 Auroral Radar buffered 146 TECU sweeps",
        "summary": "High-frequency ionospheric sweeps stored in circular edge buffer with priority P2 tag.",
        "truth_type": "MEASURED",
        "metadata": {"instrument": "INST-S17-RADAR", "tecu": 146.2, "buffer_pct": 42.0},
    },
    {
        "event_type": "COMMUNICATION_STATE",
        "severity": "SYSTEM",
        "entity_type": "COMMS",
        "entity_id": "VSAT_UPLINK",
        "title": "VSAT Ku-Band satellite carrier online",
        "summary": "Primary geostationary carrier nominal; RTT latency 680 ms, packet loss 0.2%.",
        "truth_type": "MEASURED",
        "metadata": {"carrier": "VSAT Ku-Band", "latency_ms": 680, "status": "ONLINE"},
    },
]


def simulate_demo_event(
    db: Session,
    station_id: str = "STATION-BHARATI",
    step_index: Optional[int] = None,
) -> OperationalEventSchema:
    """Advance the deterministic demo progression sequence or insert a specific step."""
    # Count current non-baseline demo events to pick next step if unspecified
    if step_index is None:
        count = db.query(EventLog).filter(EventLog.station_id == station_id).count()
        step_index = count % len(DEMO_STEPS)
    else:
        step_index = step_index % len(DEMO_STEPS)

    step_data = DEMO_STEPS[step_index]

    return record_operational_event(
        db=db,
        station_id=station_id,
        event_type=step_data["event_type"],
        severity=step_data["severity"],
        title=step_data["title"],
        summary=step_data["summary"],
        entity_type=step_data["entity_type"],
        entity_id=step_data["entity_id"],
        source="SYNTHETIC_SIMULATION",
        truth_type=step_data["truth_type"],
        metadata=step_data["metadata"],
        timestamp=datetime.now(timezone.utc),
    )


def reset_operational_events(db: Session, station_id: str = "STATION-BHARATI") -> ResetEventsResponse:
    """Reset event timeline for a station back to the canonical deterministic baseline."""
    # Delete existing events for station
    db.query(EventLog).filter(EventLog.station_id == station_id).delete()
    db.commit()

    # Re-seed canonical baseline events with realistic staggered timestamps
    now = datetime.now(timezone.utc)
    base_events = [
        (
            "COMMUNICATION_STATE", "SYSTEM", "COMMS", "VSAT_UPLINK",
            "VSAT Ku-Band satellite carrier online",
            "Carrier established at 680 ms latency with 99.8% nominal packet delivery.",
            "MEASURED", now - timedelta(minutes=45),
            {"carrier": "VSAT Ku-Band", "latency_ms": 680}
        ),
        (
            "SCIENCE_BUFFER_EVENT", "INFO", "SCIENCE", "INST-S17-RADAR",
            "S-17 Auroral Radar sampling nominal",
            "Instrument active sampling 146.2 TECU ionospheric sweeps; edge buffer nominal.",
            "MEASURED", now - timedelta(minutes=30),
            {"tecu": 146.2, "buffer_percent": 42.0}
        ),
        (
            "WEATHER_CHANGE", "INFO", "ENVIRONMENT", "WEATHER",
            "Ambient temperature decreased to -28.5°C",
            "Winter blizzard conditions approaching; wind speed 42 kt, wind chill -41.2°C.",
            "MEASURED", now - timedelta(minutes=22),
            {"temperature_c": -28.5, "wind_chill_c": -41.2}
        ),
        (
            "TELEMETRY_CHANGE", "INFO", "RESOURCE", "DIESEL_LFO",
            "Fuel runway projected at 70.3 days",
            "Winter target requires 90 days; resupply window ETA 11 days provides buffer.",
            "DERIVED", now - timedelta(minutes=15),
            {"runway_days": 70.3, "target_days": 90.0, "resupply_days": 11.0}
        ),
        (
            "INVENTORY_SHORTAGE", "WARNING", "RESOURCE", "SK-402",
            "SK-402 Rotary Seal Kit zero local stock",
            "Central spares bin SK-402 depleted; recovery chain dependent on maritime resupply.",
            "MEASURED", now - timedelta(minutes=10),
            {"part_id": "SK-402", "stock": 0, "resupply_eta_days": 11}
        ),
        (
            "DEPENDENCY_EXPOSURE", "WARNING", "SERVICE", "ZONE_2_HEATING",
            "Habitat Zone 2 heating dependency exposed",
            "Generator G-02 thermal loop heat margin degraded; secondary heating circuit exposed.",
            "DERIVED", now - timedelta(minutes=6),
            {"affected_zone": "Habitat Zone 2", "loop": "Thermal Loop B"}
        ),
        (
            "RISK_CHANGE", "WARNING", "ASSET", "G-02",
            "G-02 condition risk increased to 78/100",
            "Composite risk elevated due to persistent bearing vibration and high coolant temp.",
            "DERIVED", now - timedelta(minutes=3),
            {"risk_score": 78, "health_score": 62}
        ),
        (
            "THRESHOLD_BREACH", "WARNING", "ASSET", "G-02",
            "G-02 bearing vibration crossed warning limit",
            "Bearing vibration reached 4.8 mm/s, exceeding warning threshold limit of 4.0 mm/s.",
            "MEASURED", now - timedelta(minutes=1),
            {"metric": "bearing_vibration_mm_s", "value": 4.8, "threshold": 4.0}
        ),
    ]

    count = 0
    for ev_type, sev, ent_type, ent_id, title, summary, truth, ts, meta in base_events:
        record_operational_event(
            db=db,
            station_id=station_id,
            event_type=ev_type,
            severity=sev,
            title=title,
            summary=summary,
            entity_type=ent_type,
            entity_id=ent_id,
            source="SYNTHETIC_SIMULATION",
            truth_type=truth,
            metadata=meta,
            timestamp=ts,
        )
        count += 1

    return ResetEventsResponse(
        station_id=station_id,
        status="RESET_TO_CANONICAL_BASELINE",
        events_count=count,
        timestamp=now,
    )
