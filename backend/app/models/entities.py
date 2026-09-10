"""SQLAlchemy ORM models representing the canonical Antarctic Operational Digital Twin domain.

Covers stations, topology, assets, sensors, time-series measurements, dependencies,
maintenance, inventory, resupply, energy/fuel, weather, science, comms, sync queue,
and incidents.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import (
    AssetCategory,
    AssetStatus,
    Criticality,
    DependencyType,
    EnvironmentMode,
    IncidentSeverity,
    IncidentStatus,
    LifecycleStatus,
    MaintenancePriority,
    MaintenanceStatus,
    Quality,
    ResupplyStatus,
    StationStatus,
    SyncStatus,
    TruthType,
)


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


# ── 1. STATION & TOPOLOGY ──────────────────────────────────────────


class Station(Base):
    """Antarctic research station facility."""

    __tablename__ = "stations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    location: Mapped[str] = mapped_column(String(256))
    status: Mapped[StationStatus] = mapped_column(
        String(32), default=StationStatus.NOMINAL
    )
    environment_mode: Mapped[EnvironmentMode] = mapped_column(
        String(16), default=EnvironmentMode.WINTER
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    buildings: Mapped[list["Building"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )
    services: Mapped[list["Service"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )
    assets: Mapped[list["Asset"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )
    energy_resources: Mapped[list["EnergyResource"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )
    weather_observations: Mapped[list["WeatherObservation"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )
    scientific_instruments: Mapped[list["ScientificInstrument"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )
    communication_links: Mapped[list["CommunicationLink"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )
    incidents: Mapped[list["Incident"]] = relationship(
        back_populates="station", cascade="all, delete-orphan"
    )


class Building(Base):
    """Structural module or building at a station."""

    __tablename__ = "buildings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    building_type: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    station: Mapped["Station"] = relationship(back_populates="buildings")
    zones: Mapped[list["Zone"]] = relationship(
        back_populates="building", cascade="all, delete-orphan"
    )


class Zone(Base):
    """Sub-area or compartment within a building."""

    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    occupancy: Mapped[int] = mapped_column(Integer, default=0)
    target_temp_celsius: Mapped[float] = mapped_column(Float, default=20.0)
    criticality: Mapped[Criticality] = mapped_column(
        String(32), default=Criticality.STANDARD
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    building: Mapped["Building"] = relationship(back_populates="zones")
    assets: Mapped[list["Asset"]] = relationship(back_populates="zone")


class Service(Base):
    """Operational station capability supported by assets (e.g. Life Support Heating)."""

    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    code: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criticality: Mapped[Criticality] = mapped_column(
        String(32), default=Criticality.STANDARD
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    station: Mapped["Station"] = relationship(back_populates="services")


# ── 2. ASSETS, SENSORS & MEASUREMENTS ─────────────────────────────


class Asset(Base):
    """Physical machinery, infrastructure, or payload asset."""

    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    building_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("buildings.id"), nullable=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("zones.id"), nullable=True, index=True
    )
    code: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(128))
    category: Mapped[AssetCategory] = mapped_column(String(32), index=True)
    status: Mapped[AssetStatus] = mapped_column(
        String(32), default=AssetStatus.NOMINAL, index=True
    )
    health_score: Mapped[int] = mapped_column(Integer, default=100)
    criticality: Mapped[Criticality] = mapped_column(
        String(32), default=Criticality.STANDARD
    )
    commissioned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    source: Mapped[str] = mapped_column(String(128), default="SYNTHETIC_SIMULATION")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    station: Mapped["Station"] = relationship(back_populates="assets")
    zone: Mapped[Optional["Zone"]] = relationship(back_populates="assets")
    sensors: Mapped[list["Sensor"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan"
    )
    work_orders: Mapped[list["MaintenanceWorkOrder"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan"
    )
    dependencies_out: Mapped[list["AssetDependency"]] = relationship(
        foreign_keys="[AssetDependency.source_asset_id]",
        back_populates="source_asset",
        cascade="all, delete-orphan",
    )
    dependencies_in: Mapped[list["AssetDependency"]] = relationship(
        foreign_keys="[AssetDependency.target_asset_id]",
        back_populates="target_asset",
    )


class AssetDependency(Base):
    """Relational dependency link between equipment and downstream assets or services."""

    __tablename__ = "asset_dependencies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"), index=True)
    target_asset_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("assets.id"), nullable=True, index=True
    )
    target_service_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("services.id"), nullable=True, index=True
    )
    dependency_type: Mapped[DependencyType] = mapped_column(String(32))
    impact_factor: Mapped[float] = mapped_column(Float, default=1.0)
    is_redundant: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    source_asset: Mapped["Asset"] = relationship(
        foreign_keys=[source_asset_id], back_populates="dependencies_out"
    )
    target_asset: Mapped[Optional["Asset"]] = relationship(
        foreign_keys=[target_asset_id], back_populates="dependencies_in"
    )
    target_service: Mapped[Optional["Service"]] = relationship()


class Sensor(Base):
    """Telemetry instrumentation sensor mounted on an asset."""

    __tablename__ = "sensors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    metric_key: Mapped[str] = mapped_column(String(64), index=True)
    unit: Mapped[str] = mapped_column(String(32))
    min_threshold: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_threshold: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    warning_threshold: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    critical_threshold: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    asset: Mapped["Asset"] = relationship(back_populates="sensors")
    measurements: Mapped[list["Measurement"]] = relationship(
        back_populates="sensor", cascade="all, delete-orphan"
    )


class Measurement(Base):
    """Time-series telemetry reading with complete data provenance metadata."""

    __tablename__ = "measurements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sensor_id: Mapped[str] = mapped_column(ForeignKey("sensors.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, default=utc_now
    )
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(32))
    quality: Mapped[Quality] = mapped_column(String(16), default=Quality.GOOD)
    source: Mapped[str] = mapped_column(String(128), default="SYNTHETIC_SIMULATION")
    truth_type: Mapped[TruthType] = mapped_column(
        String(16), default=TruthType.MEASURED, index=True
    )
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    sensor: Mapped["Sensor"] = relationship(back_populates="measurements")

    __table_args__ = (
        Index("ix_measurements_sensor_timestamp", "sensor_id", "timestamp"),
    )


# ── 3. MAINTENANCE, SPARES & INVENTORY ─────────────────────────────


class SparePart(Base):
    """Catalog entry for replacement component / spare."""

    __tablename__ = "spare_parts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    part_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criticality: Mapped[Criticality] = mapped_column(
        String(32), default=Criticality.STANDARD
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    inventory_items: Mapped[list["InventoryItem"]] = relationship(
        back_populates="spare_part", cascade="all, delete-orphan"
    )


class MaintenanceWorkOrder(Base):
    """Operational maintenance or repair task."""

    __tablename__ = "maintenance_work_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"), index=True)
    title: Mapped[str] = mapped_column(String(128))
    priority: Mapped[MaintenancePriority] = mapped_column(
        String(16), default=MaintenancePriority.MEDIUM, index=True
    )
    status: Mapped[MaintenanceStatus] = mapped_column(
        String(32), default=MaintenanceStatus.PENDING, index=True
    )
    required_action: Mapped[str] = mapped_column(Text)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    due_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    asset: Mapped["Asset"] = relationship(back_populates="work_orders")
    required_spares: Mapped[list["MaintenanceSpare"]] = relationship(
        back_populates="work_order", cascade="all, delete-orphan"
    )


class MaintenanceSpare(Base):
    """Join entity linking work orders to required spare parts."""

    __tablename__ = "maintenance_spares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    work_order_id: Mapped[str] = mapped_column(
        ForeignKey("maintenance_work_orders.id"), index=True
    )
    spare_part_id: Mapped[str] = mapped_column(
        ForeignKey("spare_parts.id"), index=True
    )
    quantity_required: Mapped[int] = mapped_column(Integer, default=1)

    work_order: Mapped["MaintenanceWorkOrder"] = relationship(
        back_populates="required_spares"
    )
    spare_part: Mapped["SparePart"] = relationship()


class InventoryItem(Base):
    """Station stock levels for a specific spare part."""

    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    spare_part_id: Mapped[str] = mapped_column(ForeignKey("spare_parts.id"), index=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    quantity_available: Mapped[int] = mapped_column(Integer, default=0)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0)
    reorder_threshold: Mapped[int] = mapped_column(Integer, default=1)
    location: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    spare_part: Mapped["SparePart"] = relationship(back_populates="inventory_items")


class ResupplyOpportunity(Base):
    """Scheduled resupply vessel voyage providing critical replacement stock."""

    __tablename__ = "resupply_opportunities"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    spare_part_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("spare_parts.id"), nullable=True, index=True
    )
    vessel_name: Mapped[str] = mapped_column(String(128))
    expected_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    delay_days: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[ResupplyStatus] = mapped_column(
        String(32), default=ResupplyStatus.SCHEDULED
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    spare_part: Mapped[Optional["SparePart"]] = relationship()


# ── 4. ENERGY, FUEL & WEATHER ─────────────────────────────────────


class EnergyResource(Base):
    """Station power/fuel storage reservoir (e.g. Diesel fuel tanks, Battery banks)."""

    __tablename__ = "energy_resources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    resource_type: Mapped[str] = mapped_column(String(64))  # DIESEL_LFO, BATTERY, SOLAR
    current_quantity: Mapped[float] = mapped_column(Float)
    max_capacity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(32))  # LITERS, KWH
    burn_rate_per_hour: Mapped[float] = mapped_column(Float, default=0.0)
    source: Mapped[str] = mapped_column(String(128), default="SYNTHETIC_SIMULATION")
    truth_type: Mapped[TruthType] = mapped_column(
        String(16), default=TruthType.MEASURED
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    station: Mapped["Station"] = relationship(back_populates="energy_resources")


class WeatherObservation(Base):
    """Meteorological telemetry from station weather mast."""

    __tablename__ = "weather_observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, default=utc_now
    )
    temperature_celsius: Mapped[float] = mapped_column(Float)
    wind_speed_knots: Mapped[float] = mapped_column(Float)
    wind_chill_celsius: Mapped[float] = mapped_column(Float)
    conditions: Mapped[str] = mapped_column(String(128))  # BLIZZARD, OVERCAST, CLEAR
    source: Mapped[str] = mapped_column(String(128), default="SYNTHETIC_SIMULATION")
    truth_type: Mapped[TruthType] = mapped_column(
        String(16), default=TruthType.MEASURED
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    station: Mapped["Station"] = relationship(back_populates="weather_observations")


# ── 5. SCIENCE EXPERIMENTS ─────────────────────────────────────────


class ScientificInstrument(Base):
    """Antarctic research instrument payload (e.g. Auroral Radar, Seismometer)."""

    __tablename__ = "scientific_instruments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    code: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(128))
    instrument_type: Mapped[str] = mapped_column(String(64))
    health: Mapped[str] = mapped_column(String(32), default="NOMINAL")
    power_status: Mapped[str] = mapped_column(
        String(32), default="ACTIVE"
    )  # ACTIVE, STANDBY, OFF
    calibration_status: Mapped[str] = mapped_column(String(32), default="CALIBRATED")
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    source: Mapped[str] = mapped_column(String(128), default="SYNTHETIC_SIMULATION")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    station: Mapped["Station"] = relationship(back_populates="scientific_instruments")
    observations: Mapped[list["ScientificObservation"]] = relationship(
        back_populates="instrument", cascade="all, delete-orphan"
    )


class ScientificObservation(Base):
    """Scientific experiment observation stream."""

    __tablename__ = "scientific_observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    instrument_id: Mapped[str] = mapped_column(
        ForeignKey("scientific_instruments.id"), index=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, default=utc_now
    )
    measurement_value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(32))
    quality: Mapped[Quality] = mapped_column(String(16), default=Quality.GOOD)
    source: Mapped[str] = mapped_column(String(128), default="SYNTHETIC_SIMULATION")
    truth_type: Mapped[TruthType] = mapped_column(
        String(16), default=TruthType.MEASURED
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    instrument: Mapped["ScientificInstrument"] = relationship(
        back_populates="observations"
    )


# ── 6. COMMS & OFFLINE SYNC QUEUE ──────────────────────────────────


class CommunicationLink(Base):
    """Satellite or high-frequency link to mainland HQ."""

    __tablename__ = "communication_links"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(32), default="ONLINE")  # ONLINE, OFFLINE, DEGRADED
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    latency_ms: Mapped[int] = mapped_column(Integer, default=580)
    bandwidth_kbps: Mapped[int] = mapped_column(Integer, default=2048)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    station: Mapped["Station"] = relationship(back_populates="communication_links")


class SyncQueueItem(Base):
    """Prioritized offline queue item buffered during communication blackout."""

    __tablename__ = "sync_queue_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    payload_json: Mapped[str] = mapped_column(Text)
    priority: Mapped[int] = mapped_column(Integer, default=5, index=True)  # 0=Critical, 10=Low
    status: Mapped[SyncStatus] = mapped_column(
        String(32), default=SyncStatus.QUEUED, index=True
    )
    checksum_sha256: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


# ── 7. INCIDENTS, ACTIONS & OPERATIONAL MEMORY ─────────────────────


class Incident(Base):
    """Station operational anomaly or emergency incident."""

    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    title: Mapped[str] = mapped_column(String(256))
    severity: Mapped[IncidentSeverity] = mapped_column(
        String(16), default=IncidentSeverity.MINOR, index=True
    )
    status: Mapped[IncidentStatus] = mapped_column(
        String(16), default=IncidentStatus.ACTIVE, index=True
    )
    location: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    station: Mapped["Station"] = relationship(back_populates="incidents")
    actions: Mapped[list["OperationalAction"]] = relationship(
        back_populates="incident", cascade="all, delete-orphan"
    )


class OperationalAction(Base):
    """Specific response or countermeasure executed during an incident or scenario."""

    __tablename__ = "operational_actions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    incident_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("incidents.id"), nullable=True, index=True
    )
    action_code: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text)
    executed_by: Mapped[str] = mapped_column(String(64))
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    outcome_status: Mapped[str] = mapped_column(String(32), default="SUCCESS")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    incident: Mapped[Optional["Incident"]] = relationship(back_populates="actions")


class OperationalMemory(Base):
    """Institutional memory entry capturing lessons learned and decision rationales."""

    __tablename__ = "operational_memory"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(256))
    context_summary: Mapped[str] = mapped_column(Text)
    lessons_learned: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class EventLog(Base):
    """Audit log of cross-domain operational station events."""

    __tablename__ = "event_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True, default="TELEMETRY_CHANGE")
    category: Mapped[str] = mapped_column(String(64), index=True, default="OPERATIONAL")
    severity: Mapped[str] = mapped_column(String(16), default="INFO")
    entity_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    message: Mapped[str] = mapped_column(String(512))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, default=utc_now
    )
    source: Mapped[str] = mapped_column(String(128), default="SYNTHETIC_SIMULATION")
    truth_type: Mapped[str] = mapped_column(String(32), default="MEASURED")
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# ── 8. LIFECYCLE METADATA ────────────────────────────────────────────


class ComponentLifecycle(Base):
    """Lifecycle metadata record for a versioned model, schema, or configuration component.

    Tracks which version of a component was effective over a given time interval,
    enabling historical provenance traces to answer:

        "Which version produced this operational data, and was it valid at that time?"

    Design invariants
    -----------------
    * component_type + component_name together identify a component family.
    * version and schema_version are separate concepts (never overloaded).
    * Effective intervals are half-open: [effective_from, effective_to).
      At exactly effective_to the OLD version is NO LONGER valid.
    * Two records for the same component family MUST NOT have overlapping
      effective intervals.  The service layer enforces this before insert.
    * Records are never deleted — RETIRED records remain for historical provenance.
    """

    __tablename__ = "component_lifecycles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    component_type: Mapped[str] = mapped_column(String(64), index=True)
    component_name: Mapped[str] = mapped_column(String(128), index=True)
    version: Mapped[str] = mapped_column(String(64))
    schema_version: Mapped[str] = mapped_column(String(64))
    status: Mapped[LifecycleStatus] = mapped_column(
        String(16), default=LifecycleStatus.ACTIVE, index=True
    )
    effective_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True
    )
    effective_to: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index(
            "ix_component_lifecycles_type_name",
            "component_type",
            "component_name",
        ),
    )
