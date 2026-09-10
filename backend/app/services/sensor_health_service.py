"""B6 — Digital Twin Data Quality / Sensor Health Service.

Purpose
-------
Provide deterministic sensor freshness evaluation and health classification
for the PolarOps Digital Twin.  Sensor health answers the question:

    "Is the telemetry coming from this sensor current enough to trust?"

It is deliberately separate from measurement *quality* (GOOD / SUSPECT / BAD),
which answers:

    "Was the signal trustworthy when it was captured?"

Both dimensions are important and must remain orthogonal.  A measurement can be:

    GOOD + STALE     — was valid when captured but is now old
    SUSPECT + FRESH  — recent but flagged questionable by the sensor
    BAD   + STALE    — old AND of poor quality

Do not conflate the two.

Stale Threshold
---------------
Seed telemetry is generated at ~1-hour intervals.  Two hours (7 200 s) is
chosen as the stale boundary because:

  * Normal reporting cycle = 3 600 s (1 hour)
  * One missed cycle is tolerated before raising an alarm
  * Freshness < 7 200 s → FRESH
  * Freshness ≥ 7 200 s → STALE

This constant is centralised here.  Do not scatter 7200 throughout the
codebase — import SENSOR_STALE_THRESHOLD_SECONDS from this module.

Confidence Convention
---------------------
Reuses the B5 established scale so the codebase has a single convention:

    Quality.GOOD    → 1.0
    Quality.SUSPECT → 0.7
    Quality.BAD     → 0.2

Truth Types
-----------
  * Direct sensor readings remain  truth_type = MEASURED
  * Derived health calculations    truth_type = DERIVED
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.entities import Asset, Measurement, Sensor
from app.models.enums import Quality, TruthType
from app.schemas.common import ProvenanceSchema
from app.schemas.sensor_health import AssetSensorHealthResponse, SensorHealthSchema

# ── Centralized stale threshold ────────────────────────────────────────────
# 7 200 s = 2 hours.  See module docstring for rationale.
SENSOR_STALE_THRESHOLD_SECONDS: float = 7_200.0


def _utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Return a UTC-aware copy of *dt*, handling naive (SQLite) timestamps.

    SQLite stores datetimes without timezone info.  This helper makes them
    UTC-aware so that subtraction against ``datetime.now(timezone.utc)``
    is always safe.

    Returns None if *dt* is None.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def compute_sensor_freshness(
    latest_ts: Optional[datetime],
    now_utc: datetime,
) -> float:
    """Return elapsed seconds since *latest_ts* relative to *now_utc*.

    Rules:
      * Real past timestamp  → actual age in seconds (≥ 0.0)
      * Future timestamp     → 0.0  (clamped, not negative)
      * Missing timestamp    → 1.0  (safe fallback; matches ProvenanceSchema default)

    Args:
        latest_ts: The latest measurement timestamp (may be None or naive).
        now_utc:   Reference UTC time (caller is responsible for supplying
                   ``datetime.now(timezone.utc)`` to avoid multiple calls).

    Returns:
        Non-negative float representing staleness in seconds.
    """
    ts = _utc(latest_ts)
    if ts is None:
        return 1.0
    return max(0.0, (now_utc - ts).total_seconds())


def evaluate_sensor_health(
    latest_ts: Optional[datetime],
    now_utc: datetime,
) -> str:
    """Classify sensor recency as FRESH, STALE, or UNKNOWN.

    This evaluation is based exclusively on the *age* of the latest
    measurement.  It does not inspect or modify measurement quality.

    States:
        FRESH   — usable timestamp, freshness < SENSOR_STALE_THRESHOLD_SECONDS
        STALE   — usable timestamp, freshness ≥ SENSOR_STALE_THRESHOLD_SECONDS
        UNKNOWN — no usable timestamp

    Args:
        latest_ts: The latest measurement timestamp (may be None or naive).
        now_utc:   Reference UTC time.

    Returns:
        One of "FRESH", "STALE", "UNKNOWN".
    """
    ts = _utc(latest_ts)
    if ts is None:
        return "UNKNOWN"
    freshness = max(0.0, (now_utc - ts).total_seconds())
    return "FRESH" if freshness < SENSOR_STALE_THRESHOLD_SECONDS else "STALE"


def _confidence_from_quality(quality: Quality) -> float:
    """Map measurement quality to the canonical B5 confidence convention.

    Reuses the established project scale so there is a single convention:

        Quality.GOOD    → 1.0
        Quality.SUSPECT → 0.7
        Quality.BAD     → 0.2

    Args:
        quality: A Quality enum member.

    Returns:
        Confidence score in [0.0, 1.0].
    """
    if quality == Quality.GOOD:
        return 1.0
    if quality == Quality.SUSPECT:
        return 0.7
    return 0.2  # Quality.BAD


def _resolve_quality(raw: object) -> Quality:
    """Coerce a raw quality value (enum member or string) to Quality.

    Handles both ORM-returned enum instances and raw string column values,
    which can differ depending on SQLite vs PostgreSQL dialect.
    """
    if isinstance(raw, Quality):
        return raw
    try:
        return Quality(str(raw).upper())
    except (ValueError, KeyError):
        return Quality.GOOD


def _resolve_truth_type(raw: object) -> TruthType:
    """Coerce a raw truth_type value to TruthType.

    Same coercion rationale as ``_resolve_quality``.
    """
    if isinstance(raw, TruthType):
        return raw
    try:
        return TruthType(str(raw).upper())
    except (ValueError, KeyError):
        return TruthType.MEASURED


def build_sensor_provenance(
    sensor: "Sensor",
    latest_measurement: Optional["Measurement"],
    now_utc: datetime,
) -> ProvenanceSchema:
    """Build a canonical ProvenanceSchema for a sensor's latest measurement.

    Semantics:
      * If a real measurement exists, use its actual source, timestamp,
        quality, truth_type, and confidence.
      * If no measurement is available, fall back gracefully without
        fabricating values.

    The truth_type is always MEASURED for a direct sensor reading because
    the measurement itself is a direct physical observation.

    Args:
        sensor:              The ORM Sensor object.
        latest_measurement:  The most recent Measurement row, or None.
        now_utc:             Reference UTC time (pre-computed by the caller).

    Returns:
        A populated ProvenanceSchema using canonical provenance fields.
    """
    if latest_measurement is not None:
        ts = _utc(latest_measurement.timestamp)
        freshness = compute_sensor_freshness(ts, now_utc)
        qual = _resolve_quality(latest_measurement.quality)
        truth = _resolve_truth_type(latest_measurement.truth_type)
        source = latest_measurement.source or f"sensor:{sensor.id}"
        confidence = _confidence_from_quality(qual)
        provenance_ts = ts or now_utc
    else:
        # No measurement — safe defaults; do not fabricate data.
        freshness = 1.0
        qual = Quality.GOOD
        truth = TruthType.MEASURED
        source = f"sensor:{sensor.id}"
        confidence = 1.0
        provenance_ts = now_utc

    return ProvenanceSchema(
        source=source,
        timestamp=provenance_ts,
        freshness_seconds=round(freshness, 2),
        quality=qual,
        truth_type=truth,
        confidence=confidence,
    )


def get_sensor_health_summary(
    db: Session,
    sensor_id: str,
) -> Optional[SensorHealthSchema]:
    """Retrieve the sensor health summary for a single sensor.

    The effective last-seen time is derived from the latest Measurement
    timestamp; no persistent last_seen_at column exists on the Sensor model.

    Args:
        db:        Database session.
        sensor_id: Sensor primary key.

    Returns:
        SensorHealthSchema or None if the sensor does not exist.
    """
    sensor: Optional[Sensor] = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if sensor is None:
        return None

    latest_measurement: Optional[Measurement] = (
        db.query(Measurement)
        .filter(Measurement.sensor_id == sensor_id)
        .order_by(Measurement.timestamp.desc())
        .first()
    )

    now_utc = datetime.now(timezone.utc)
    latest_ts = _utc(latest_measurement.timestamp) if latest_measurement else None
    freshness = compute_sensor_freshness(latest_ts, now_utc)
    health = evaluate_sensor_health(latest_ts, now_utc)

    qual = _resolve_quality(latest_measurement.quality) if latest_measurement else Quality.GOOD
    truth = _resolve_truth_type(latest_measurement.truth_type) if latest_measurement else TruthType.MEASURED
    confidence = _confidence_from_quality(qual)

    provenance = build_sensor_provenance(sensor, latest_measurement, now_utc)

    return SensorHealthSchema(
        sensor_id=sensor.id,
        sensor_name=sensor.name,
        metric_key=sensor.metric_key,
        last_seen_at=latest_ts,
        freshness_seconds=round(freshness, 2),
        health=health,
        quality=str(qual),
        truth_type=str(truth),
        confidence=confidence,
        provenance=provenance,
    )


def get_asset_sensor_health(
    db: Session,
    asset_id: str,
) -> Optional[AssetSensorHealthResponse]:
    """Retrieve sensor health summaries for all sensors on an asset.

    Retrieves all sensors for the asset, then for each sensor fetches the
    latest measurement.  The queries are bounded by the number of sensors
    on the asset (typically 2–5 for PolarOps assets), so N+1 is acceptable
    at the current scale.  No caching or background workers are introduced.

    Args:
        db:       Database session.
        asset_id: Asset primary key or code.

    Returns:
        AssetSensorHealthResponse or None if the asset is not found.
    """
    asset: Optional[Asset] = (
        db.query(Asset)
        .filter((Asset.id == asset_id) | (Asset.code == asset_id))
        .first()
    )
    if asset is None:
        return None

    now_utc = datetime.now(timezone.utc)
    sensor_summaries: list[SensorHealthSchema] = []

    for sensor in sorted(asset.sensors, key=lambda s: s.metric_key):
        latest_measurement: Optional[Measurement] = (
            db.query(Measurement)
            .filter(Measurement.sensor_id == sensor.id)
            .order_by(Measurement.timestamp.desc())
            .first()
        )

        latest_ts = _utc(latest_measurement.timestamp) if latest_measurement else None
        freshness = compute_sensor_freshness(latest_ts, now_utc)
        health = evaluate_sensor_health(latest_ts, now_utc)

        qual = _resolve_quality(latest_measurement.quality) if latest_measurement else Quality.GOOD
        truth = _resolve_truth_type(latest_measurement.truth_type) if latest_measurement else TruthType.MEASURED
        confidence = _confidence_from_quality(qual)

        provenance = build_sensor_provenance(sensor, latest_measurement, now_utc)

        sensor_summaries.append(
            SensorHealthSchema(
                sensor_id=sensor.id,
                sensor_name=sensor.name,
                metric_key=sensor.metric_key,
                last_seen_at=latest_ts,
                freshness_seconds=round(freshness, 2),
                health=health,
                quality=str(qual),
                truth_type=str(truth),
                confidence=confidence,
                provenance=provenance,
            )
        )

    return AssetSensorHealthResponse(
        asset_id=asset.id,
        asset_name=asset.name,
        sensor_count=len(sensor_summaries),
        sensors=sensor_summaries,
    )
