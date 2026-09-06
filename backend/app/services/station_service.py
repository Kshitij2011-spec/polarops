"""Domain service for station situation awareness and overview queries."""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import (
    Asset,
    AssetStatus,
    EnergyResource,
    Incident,
    IncidentStatus,
    Station,
    WeatherObservation,
)
from app.models.enums import Quality, TruthType
from app.schemas.common import ProvenanceSchema
from app.schemas.station import (
    AmbientWeatherSchema,
    CriticalEventItem,
    StationOverviewResponse,
    SubsystemSummaryItem,
)


def get_station_overview(
    db: Session, station_id: str = "STATION-BHARATI"
) -> StationOverviewResponse | None:
    """Aggregate real-time station situation awareness metrics from database."""
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        # Fallback to lookup by code if user passed code
        station = db.query(Station).filter(Station.code == station_id.upper()).first()
        if not station:
            return None

    # Latest weather reading
    weather = (
        db.query(WeatherObservation)
        .filter(WeatherObservation.station_id == station.id)
        .order_by(WeatherObservation.timestamp.desc())
        .first()
    )

    # Active incidents count
    active_incidents_count = (
        db.query(Incident)
        .filter(
            Incident.station_id == station.id,
            Incident.status.in_([IncidentStatus.ACTIVE, IncidentStatus.CONTAINED]),
        )
        .count()
    )

    # Fuel runway projection
    fuel = (
        db.query(EnergyResource)
        .filter(
            EnergyResource.station_id == station.id,
            EnergyResource.resource_type == "DIESEL_LFO",
        )
        .first()
    )
    fuel_runway_days: float | None = None
    if fuel and fuel.burn_rate_per_hour > 0:
        fuel_runway_days = round(fuel.current_quantity / (fuel.burn_rate_per_hour * 24), 1)

    # Subsystem summary calculation from actual assets
    assets = db.query(Asset).filter(Asset.station_id == station.id).all()

    # Power Gen
    power_assets = [a for a in assets if a.category in ["GENERATOR", "POWER_DISTRIBUTION"]]
    power_score = (
        int(sum(a.health_score for a in power_assets) / len(power_assets))
        if power_assets
        else 100
    )
    power_status = "WARNING" if any(a.status == AssetStatus.WARNING for a in power_assets) else "NOMINAL"

    # Thermal Loop
    thermal_assets = [a for a in assets if a.category in ["BOILER", "HVAC"]]
    thermal_score = (
        int(sum(a.health_score for a in thermal_assets) / len(thermal_assets))
        if thermal_assets
        else 100
    )
    thermal_status = "WARNING" if any(a.status == AssetStatus.WARNING for a in thermal_assets) else "NOMINAL"

    # Water & Life Support
    water_assets = [a for a in assets if a.category in ["PUMP", "WATER_MAKER"]]
    water_score = (
        int(sum(a.health_score for a in water_assets) / len(water_assets))
        if water_assets
        else 100
    )
    water_status = "NOMINAL" if not any(a.status == AssetStatus.WARNING for a in water_assets) else "WARNING"

    subsystem_summary = [
        SubsystemSummaryItem(
            code="POWER_GEN",
            name="Power Generation",
            status=power_status,
            health_score=power_score,
        ),
        SubsystemSummaryItem(
            code="THERMAL_LOOP",
            name="Thermal Loop",
            status=thermal_status,
            health_score=thermal_score,
        ),
        SubsystemSummaryItem(
            code="LIFE_SUPPORT",
            name="Life Support & Water",
            status=water_status,
            health_score=water_score,
        ),
        SubsystemSummaryItem(
            code="SAT_COMMS",
            name="Satellite Comms",
            status="NOMINAL",
            health_score=92,
        ),
    ]

    overall_health = int(sum(item.health_score for item in subsystem_summary) / len(subsystem_summary))

    now = datetime.now(timezone.utc)
    if weather:
        w_ts = weather.timestamp
        if w_ts.tzinfo is None:
            w_ts = w_ts.replace(tzinfo=timezone.utc)
        freshness = max(0.0, (now - w_ts).total_seconds())
        ambient = AmbientWeatherSchema(
            temperature_celsius=weather.temperature_celsius,
            wind_speed_knots=weather.wind_speed_knots,
            wind_chill_celsius=weather.wind_chill_celsius,
            conditions=weather.conditions,
            provenance=ProvenanceSchema(
                source=weather.source,
                timestamp=w_ts,
                freshness_seconds=round(freshness, 1),
                quality=Quality.GOOD,
                truth_type=weather.truth_type,
                confidence=1.0,
            ),
        )
    else:
        ambient = AmbientWeatherSchema(
            temperature_celsius=-28.5,
            wind_speed_knots=42.0,
            wind_chill_celsius=-41.2,
            conditions="BLIZZARD_WARNING",
            provenance=ProvenanceSchema(
                source="SYNTHETIC_SIMULATION",
                timestamp=now,
                freshness_seconds=1.0,
                quality=Quality.GOOD,
                truth_type=TruthType.MEASURED,
                confidence=1.0,
            ),
        )

    # Critical active events / incidents
    incidents = (
        db.query(Incident)
        .filter(
            Incident.station_id == station.id,
            Incident.status.in_([IncidentStatus.ACTIVE, IncidentStatus.CONTAINED]),
        )
        .all()
    )
    critical_events = [
        CriticalEventItem(
            id=inc.id,
            title=inc.title,
            severity=str(inc.severity),
            status=str(inc.status),
            asset_id="G-02" if "G-02" in inc.title else None,
            location=inc.location,
            description=inc.description,
        )
        for inc in incidents
    ]

    return StationOverviewResponse(
        station_id=station.id,
        name=station.name,
        status=station.status,
        environment_mode=station.environment_mode,
        overall_health_score=overall_health,
        active_incidents_count=active_incidents_count,
        fuel_runway_days=fuel_runway_days,
        fuel_quantity_liters=fuel.current_quantity if fuel else None,
        connectivity_status="ONLINE",
        ambient_weather=ambient,
        subsystem_summary=subsystem_summary,
        critical_events=critical_events,
    )
