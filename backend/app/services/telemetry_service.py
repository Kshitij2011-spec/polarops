"""Domain service for historical telemetry time-series retrieval and trend calculation."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import Asset, Measurement, Sensor
from app.models.enums import Quality, TruthType
from app.schemas.asset import (
    AssetTelemetryResponse,
    AssetTelemetrySeries,
    TelemetryPoint,
)
from app.schemas.common import ProvenanceSchema
from app.services.sensor_health_service import (
    _confidence_from_quality,
    _resolve_quality,
    _resolve_truth_type,
)


def get_asset_telemetry_history(
    db: Session, asset_id: str, limit_points: int = 50
) -> AssetTelemetryResponse | None:
    """Retrieve chronological sensor measurements, threshold statuses, and deterministic trend calculations."""
    asset = (
        db.query(Asset)
        .filter((Asset.id == asset_id) | (Asset.code == asset_id))
        .first()
    )
    if not asset:
        return None

    series_list: list[AssetTelemetrySeries] = []
    latest_timestamp = asset.updated_at
    latest_source = asset.source
    latest_truth_type = TruthType.MEASURED
    latest_quality = Quality.GOOD

    for sensor in asset.sensors:
        measurements = (
            db.query(Measurement)
            .filter(Measurement.sensor_id == sensor.id)
            .order_by(Measurement.timestamp.desc())
            .limit(limit_points)
            .all()
        )

        if not measurements:
            continue

        measurements.reverse()

        points: list[TelemetryPoint] = []
        for m in measurements:
            ts = m.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            points.append(
                TelemetryPoint(
                    timestamp=ts,
                    value=m.value,
                    quality=str(m.quality),
                    truth_type=str(m.truth_type),
                )
            )

        latest_m = measurements[-1]
        earliest_m = measurements[0]
        curr_val = latest_m.value
        delta = curr_val - earliest_m.value

        latest_timestamp = latest_m.timestamp
        latest_source = latest_m.source
        latest_truth_type = latest_m.truth_type
        # B6 fix: capture actual measurement quality (not hardcoded GOOD)
        latest_quality = _resolve_quality(latest_m.quality)

        # ── Deterministic Trend Calculation ────────────────────────────
        trend = "STABLE"
        if sensor.metric_key == "efficiency_pct":
            if delta <= -2.0:
                trend = "FALLING"
                trend_desc = f"↓ Falling ({delta:+.1f}% drop)"
            elif delta >= 2.0:
                trend = "RISING"
                trend_desc = f"↑ Improving ({delta:+.1f}% gain)"
            else:
                trend = "STABLE"
                trend_desc = "→ Stable efficiency"
        else:
            if delta >= 0.4:
                trend = "RISING"
                trend_desc = f"↑ Rising ({delta:+.1f} {sensor.unit} increase)"
            elif delta <= -0.4:
                trend = "FALLING"
                trend_desc = f"↓ Decreasing ({delta:+.1f} {sensor.unit})"
            else:
                trend = "STABLE"
                trend_desc = f"→ Stable within baseline"

        # ── Threshold Status Evaluation ────────────────────────────────
        thresh_status = "NOMINAL"
        if sensor.critical_threshold is not None:
            if (sensor.metric_key == "efficiency_pct" and curr_val <= sensor.critical_threshold) or (
                sensor.metric_key != "efficiency_pct" and curr_val >= sensor.critical_threshold
            ):
                thresh_status = "CRITICAL"
        if thresh_status == "NOMINAL" and sensor.warning_threshold is not None:
            if (sensor.metric_key == "efficiency_pct" and curr_val <= sensor.warning_threshold) or (
                sensor.metric_key != "efficiency_pct" and curr_val >= sensor.warning_threshold
            ):
                thresh_status = "WARNING"

        series_list.append(
            AssetTelemetrySeries(
                metric_key=sensor.metric_key,
                metric_name=sensor.name,
                unit=sensor.unit,
                current_value=curr_val,
                warning_threshold=sensor.warning_threshold,
                critical_threshold=sensor.critical_threshold,
                threshold_status=thresh_status,
                trend=trend,
                trend_description=trend_desc,
                points=points,
            )
        )

    now = datetime.now(timezone.utc)
    if latest_timestamp and latest_timestamp.tzinfo is None:
        latest_timestamp = latest_timestamp.replace(tzinfo=timezone.utc)
    freshness = (
        max(0.0, (now - latest_timestamp).total_seconds())
        if latest_timestamp
        else 1.0
    )

    # B6 fix: provenance reflects actual measurement quality and confidence
    provenance = ProvenanceSchema(
        source=latest_source,
        timestamp=latest_timestamp or now,
        freshness_seconds=round(freshness, 1),
        quality=latest_quality,
        truth_type=_resolve_truth_type(latest_truth_type),
        confidence=_confidence_from_quality(latest_quality),
    )

    return AssetTelemetryResponse(
        asset_id=asset.id,
        asset_name=asset.name,
        series=series_list,
        provenance=provenance,
    )
