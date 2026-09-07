"""Deterministic and idempotent database seeder for PolarOps Antarctic Digital Twin.

Populates the canonical Bharati and Maitri research station datasets, including
the Generator G-02 hero scenario (vibration anomaly, downstream thermal dependency,
blocked work order, 0 available local inventory, and 11-day vessel resupply).
"""

from datetime import datetime, timedelta, timezone
import hashlib
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models import (
    Asset,
    AssetCategory,
    AssetDependency,
    AssetStatus,
    Building,
    CommunicationLink,
    Criticality,
    DependencyType,
    EnergyResource,
    EnvironmentMode,
    EventLog,
    Incident,
    IncidentSeverity,
    IncidentStatus,
    InventoryItem,
    MaintenancePriority,
    MaintenanceSpare,
    MaintenanceStatus,
    MaintenanceWorkOrder,
    Measurement,
    OperationalMemory,
    Quality,
    ResupplyOpportunity,
    ResupplyStatus,
    ScientificInstrument,
    ScientificObservation,
    Sensor,
    Service,
    SparePart,
    Station,
    StationStatus,
    SyncQueueItem,
    SyncStatus,
    TruthType,
    WeatherObservation,
    Zone,
)


def ensure_maitri_canonical_state(db: Session) -> None:
    """Ensure STATION-MAITRI has full canonical operational state populated idempotently."""
    base_time = datetime.now(timezone.utc).replace(second=0, microsecond=0)

    # 1. Station
    maitri = db.query(Station).filter(Station.id == "STATION-MAITRI").first()
    if not maitri:
        maitri = Station(
            id="STATION-MAITRI",
            code="MAITRI",
            name="Maitri Research Station",
            location="Schirmacher Oasis (70°46'S, 11°44'E)",
            status=StationStatus.NOMINAL,
            environment_mode=EnvironmentMode.WINTER,
            created_at=base_time - timedelta(days=365 * 3),
            updated_at=base_time,
        )
        db.add(maitri)
        db.flush()

    # 2. Building & Zone
    bld_maitri = db.query(Building).filter(Building.id == "BLD-MAITRI-MAIN").first()
    if not bld_maitri:
        bld_maitri = Building(
            id="BLD-MAITRI-MAIN",
            station_id="STATION-MAITRI",
            name="Maitri Main Station Complex",
            building_type="HABITAT_OPS",
            created_at=base_time - timedelta(days=365),
        )
        db.add(bld_maitri)
        db.flush()

    zone_maitri = db.query(Zone).filter(Zone.id == "ZONE-MAITRI-HAB").first()
    if not zone_maitri:
        zone_maitri = Zone(
            id="ZONE-MAITRI-HAB",
            building_id="BLD-MAITRI-MAIN",
            name="Maitri Primary Living & Ops Habitat",
            occupancy=18,
            target_temp_celsius=20.0,
            criticality=Criticality.LIFE_SUPPORT,
            created_at=base_time - timedelta(days=365),
        )
        db.add(zone_maitri)
        db.flush()

    # 3. Energy Resource (Fuel Runway ~133.1 days, +43.1 days headroom)
    energy_maitri = db.query(EnergyResource).filter(EnergyResource.id == "ENG-MAITRI-DIESEL").first()
    if not energy_maitri:
        energy_maitri = EnergyResource(
            id="ENG-MAITRI-DIESEL",
            station_id="STATION-MAITRI",
            resource_type="DIESEL_LFO",
            current_quantity=198000.0,
            max_capacity=240000.0,
            burn_rate_per_hour=62.0,
            unit="LITERS",
            source="SYNTHETIC_SIMULATION",
            truth_type=TruthType.MEASURED,
            updated_at=base_time,
        )
        db.add(energy_maitri)

    # 4. Weather Observation (-18.2°C, 14.5 kt wind)
    weather_maitri = (
        db.query(WeatherObservation)
        .filter(WeatherObservation.station_id == "STATION-MAITRI")
        .first()
    )
    if not weather_maitri:
        weather_maitri = WeatherObservation(
            station_id="STATION-MAITRI",
            timestamp=base_time,
            temperature_celsius=-18.2,
            wind_speed_knots=14.5,
            wind_chill_celsius=-24.8,
            conditions="CLEAR_OASIS",
            source="SYNTHETIC_SIMULATION",
            truth_type=TruthType.MEASURED,
            created_at=base_time,
        )
        db.add(weather_maitri)

    # 5. Communication Link
    comm_maitri = (
        db.query(CommunicationLink)
        .filter(CommunicationLink.station_id == "STATION-MAITRI")
        .first()
    )
    if not comm_maitri:
        comm_maitri = CommunicationLink(
            id="LINK-MAITRI-SAT-01",
            station_id="STATION-MAITRI",
            name="Maitri Inmarsat/Iridium Primary Terminal",
            status="ONLINE",
            last_sync_at=base_time,
            latency_ms=640,
            bandwidth_kbps=512,
            created_at=base_time - timedelta(days=180),
            updated_at=base_time,
        )
        db.add(comm_maitri)

    # 6. Assets (Generators, Boiler, Pump)
    maitri_assets = [
        ("MAITRI-GEN-01", "GEN-01", "Maitri Main Generator 1 (150 kVA)", AssetCategory.GENERATOR, AssetStatus.NOMINAL, 100, Criticality.CRITICAL),
        ("MAITRI-GEN-02", "GEN-02", "Maitri Standby Generator 2 (150 kVA)", AssetCategory.GENERATOR, AssetStatus.NOMINAL, 100, Criticality.CRITICAL),
        ("MAITRI-BLR-01", "BLR-01", "Maitri Central Hydronic Boiler", AssetCategory.BOILER, AssetStatus.NOMINAL, 96, Criticality.CRITICAL),
        ("MAITRI-WP-01", "WP-01", "Lake Priyadarshini Intake Water Pump", AssetCategory.PUMP, AssetStatus.NOMINAL, 98, Criticality.LIFE_SUPPORT),
    ]
    for a_id, code, name, cat, stat, health, crit in maitri_assets:
        existing_asset = db.query(Asset).filter(Asset.id == a_id).first()
        if not existing_asset:
            db.add(
                Asset(
                    id=a_id,
                    station_id="STATION-MAITRI",
                    building_id="BLD-MAITRI-MAIN",
                    zone_id="ZONE-MAITRI-HAB",
                    code=code,
                    name=name,
                    category=cat,
                    status=stat,
                    health_score=health,
                    criticality=crit,
                    commissioned_at=base_time - timedelta(days=700),
                    source="SYNTHETIC_SIMULATION",
                    created_at=base_time - timedelta(days=700),
                    updated_at=base_time,
                )
            )

    # 7. Inventory Spare (SK-402 with 2 units available at Maitri!)
    inv_maitri = db.query(InventoryItem).filter(InventoryItem.id == "INV-MAITRI-SK402").first()
    if not inv_maitri:
        sp_sk = db.query(SparePart).filter(SparePart.id == "SP-SK-402").first()
        if not sp_sk:
            sp_sk = SparePart(
                id="SP-SK-402",
                part_number="SK-402",
                name="High-Torque Rotary Bearing & Seal Kit",
                description="Heavy-duty bearing assembly with fluorocarbon seals for marine/polar diesel gensets.",
                category="MECHANICAL",
                created_at=base_time - timedelta(days=180),
            )
            db.add(sp_sk)
            db.flush()

        inv_maitri = InventoryItem(
            id="INV-MAITRI-SK402",
            spare_part_id="SP-SK-402",
            station_id="STATION-MAITRI",
            quantity_available=2,
            quantity_reserved=0,
            reorder_threshold=1,
            location="Maitri Powerhouse Spares Locker M-2",
            updated_at=base_time,
        )
        db.add(inv_maitri)

    # 8. Science Instrument
    inst_maitri = db.query(ScientificInstrument).filter(ScientificInstrument.id == "MAITRI-INST-MAG-01").first()
    if not inst_maitri:
        db.add(
            ScientificInstrument(
                id="MAITRI-INST-MAG-01",
                station_id="STATION-MAITRI",
                code="MAG-01",
                name="Schirmacher Geomagnetic Fluxgate Magnetometer",
                instrument_type="MAGNETOMETER",
                health="NOMINAL",
                power_status="ACTIVE",
                calibration_status="CALIBRATED",
                source="SYNTHETIC_SIMULATION",
                created_at=base_time - timedelta(days=200),
            )
        )

    db.commit()


def seed_database(db: Session | None = None) -> None:
    """Populate database with deterministic synthetic Antarctic station data."""
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        # Check if already seeded to maintain idempotency
        existing_station = db.query(Station).filter(Station.id == "STATION-BHARATI").first()
        if existing_station:
            # Database already initialized with canonical station data.
            # Do NOT wipe or delete existing records on startup/re-seed.
            # Prevents ForeignKeyViolation (operational_actions -> incidents) and
            # preserves user actions, operational memory, queue items, and telemetry.
            inc_hero = db.query(Incident).filter(Incident.id == "INC-2026-04").first()
            if not inc_hero:
                inc_04 = Incident(
                    id="INC-2026-04",
                    station_id="STATION-BHARATI",
                    title="Generator G-02 High Vibration Anomaly & Thermal Loop Degradation",
                    severity=IncidentSeverity.MAJOR,
                    status=IncidentStatus.ACTIVE,
                    location="Powerhouse Gen Bay 2",
                    description="Bearing vibration reached 4.8 mm/s exceeding warning threshold (4.0 mm/s). Risk of thermal drop in Zone 2 habitat if unmitigated.",
                    started_at=datetime.now(timezone.utc) - timedelta(hours=8),
                    created_at=datetime.now(timezone.utc) - timedelta(hours=8),
                    updated_at=datetime.now(timezone.utc),
                )
                db.add(inc_04)
            else:
                inc_hero.status = IncidentStatus.ACTIVE
                inc_hero.resolved_at = None

            ensure_maitri_canonical_state(db)
            db.commit()
            return

        base_time = datetime.now(timezone.utc).replace(second=0, microsecond=0)

        # ── 1. STATIONS ─────────────────────────────────────────
        bharati = Station(
            id="STATION-BHARATI",
            code="BHARATI",
            name="Bharati Research Station",
            location="Larsemann Hills (69°24'S, 76°11'E)",
            status=StationStatus.WARNING,
            environment_mode=EnvironmentMode.WINTER,
            created_at=base_time - timedelta(days=365),
            updated_at=base_time,
        )
        maitri = Station(
            id="STATION-MAITRI",
            code="MAITRI",
            name="Maitri Research Station",
            location="Schirmacher Oasis (70°46'S, 11°44'E)",
            status=StationStatus.NOMINAL,
            environment_mode=EnvironmentMode.WINTER,
            created_at=base_time - timedelta(days=365 * 3),
            updated_at=base_time,
        )
        db.add_all([bharati, maitri])
        db.flush()

        # ── 2. BUILDINGS & ZONES ────────────────────────────────
        b_ops = Building(
            id="BLD-MAIN-OPS",
            station_id="STATION-BHARATI",
            name="Main Operations & Habitat Block",
            building_type="HABITAT_OPS",
            created_at=base_time - timedelta(days=365),
        )
        b_power = Building(
            id="BLD-POWER-PLANT",
            station_id="STATION-BHARATI",
            name="Primary Power Generation Facility",
            building_type="POWER_HOUSE",
            created_at=base_time - timedelta(days=365),
        )
        b_water = Building(
            id="BLD-WATER-PLANT",
            station_id="STATION-BHARATI",
            name="Water Production & Treatment Plant",
            building_type="UTILITIES",
            created_at=base_time - timedelta(days=365),
        )
        b_sci = Building(
            id="BLD-RESEARCH-BLOCK",
            station_id="STATION-BHARATI",
            name="Atmospheric & Space Science Lab",
            building_type="SCIENCE_LAB",
            created_at=base_time - timedelta(days=365),
        )
        db.add_all([b_ops, b_power, b_water, b_sci])
        db.flush()

        z_hab1 = Zone(
            id="ZONE-HABITAT-1",
            building_id="BLD-MAIN-OPS",
            name="Habitat Zone 1 - Crew Quarters",
            occupancy=16,
            target_temp_celsius=20.0,
            criticality=Criticality.LIFE_SUPPORT,
            created_at=base_time,
        )
        z_hab2 = Zone(
            id="ZONE-HABITAT-2",
            building_id="BLD-MAIN-OPS",
            name="Habitat Zone 2 - Living & Mess Area",
            occupancy=24,
            target_temp_celsius=21.0,
            criticality=Criticality.LIFE_SUPPORT,
            created_at=base_time,
        )
        z_gen = Zone(
            id="ZONE-GEN-HALL",
            building_id="BLD-POWER-PLANT",
            name="Main Generator Hall",
            occupancy=2,
            target_temp_celsius=15.0,
            criticality=Criticality.CRITICAL,
            created_at=base_time,
        )
        z_boiler = Zone(
            id="ZONE-BOILER-ROOM",
            building_id="BLD-POWER-PLANT",
            name="Thermal Exchange & Boiler Bay",
            occupancy=1,
            target_temp_celsius=18.0,
            criticality=Criticality.CRITICAL,
            created_at=base_time,
        )
        z_water = Zone(
            id="ZONE-WATER-PLANT",
            building_id="BLD-WATER-PLANT",
            name="RO Filtration & Thermal Desal Room",
            occupancy=1,
            target_temp_celsius=16.0,
            criticality=Criticality.LIFE_SUPPORT,
            created_at=base_time,
        )
        z_radar = Zone(
            id="ZONE-RADAR-LAB",
            building_id="BLD-RESEARCH-BLOCK",
            name="Upper Atmosphere Radar Bay",
            occupancy=2,
            target_temp_celsius=19.0,
            criticality=Criticality.STANDARD,
            created_at=base_time,
        )
        db.add_all([z_hab1, z_hab2, z_gen, z_boiler, z_water, z_radar])
        db.flush()

        # ── 3. SERVICES ─────────────────────────────────────────
        srv_heat_z2 = Service(
            id="SRV-HAB-HEAT-Z2",
            station_id="STATION-BHARATI",
            code="HABITAT_HEATING_Z2",
            name="Habitat Zone 2 Heating",
            description="Essential life support heating supplying living and mess quarters.",
            criticality=Criticality.LIFE_SUPPORT,
            created_at=base_time,
        )
        srv_water = Service(
            id="SRV-POTABLE-WATER",
            station_id="STATION-BHARATI",
            code="POTABLE_WATER",
            name="Potable Water Production",
            description="RO filtration and snowmelt water purification loop.",
            criticality=Criticality.LIFE_SUPPORT,
            created_at=base_time,
        )
        srv_power = Service(
            id="SRV-MAIN-POWER",
            station_id="STATION-BHARATI",
            code="STATION_MAIN_GRID",
            name="Station Main Electrical Grid",
            description="3-phase 415V/50Hz power distribution bus.",
            criticality=Criticality.CRITICAL,
            created_at=base_time,
        )
        srv_comms = Service(
            id="SRV-SAT-COMMS",
            station_id="STATION-BHARATI",
            code="SATELLITE_UPLINK",
            name="Satellite Data & Voice Link",
            description="Continuous telemetry and operational comms to NCPOR Goa.",
            criticality=Criticality.CRITICAL,
            created_at=base_time,
        )
        db.add_all([srv_heat_z2, srv_water, srv_power, srv_comms])
        db.flush()

        # ── 4. ASSETS ───────────────────────────────────────────
        g02 = Asset(
            id="G-02",
            station_id="STATION-BHARATI",
            building_id="BLD-POWER-PLANT",
            zone_id="ZONE-GEN-HALL",
            code="G-02",
            name="Diesel Generator G-02",
            category=AssetCategory.GENERATOR,
            status=AssetStatus.WARNING,
            health_score=62,
            criticality=Criticality.CRITICAL,
            commissioned_at=base_time - timedelta(days=1200),
            source="SYNTHETIC_SIMULATION",
            created_at=base_time,
            updated_at=base_time,
        )
        g01 = Asset(
            id="G-01",
            station_id="STATION-BHARATI",
            building_id="BLD-POWER-PLANT",
            zone_id="ZONE-GEN-HALL",
            code="G-01",
            name="Diesel Generator G-01",
            category=AssetCategory.GENERATOR,
            status=AssetStatus.NOMINAL,
            health_score=94,
            criticality=Criticality.CRITICAL,
            commissioned_at=base_time - timedelta(days=1200),
            source="SYNTHETIC_SIMULATION",
            created_at=base_time,
            updated_at=base_time,
        )
        b01 = Asset(
            id="B-01",
            station_id="STATION-BHARATI",
            building_id="BLD-POWER-PLANT",
            zone_id="ZONE-BOILER-ROOM",
            code="B-01",
            name="Auxiliary Thermal Boiler B-01",
            category=AssetCategory.BOILER,
            status=AssetStatus.NOMINAL,
            health_score=91,
            criticality=Criticality.CRITICAL,
            commissioned_at=base_time - timedelta(days=800),
            source="SYNTHETIC_SIMULATION",
            created_at=base_time,
            updated_at=base_time,
        )
        wp01 = Asset(
            id="WP-01",
            station_id="STATION-BHARATI",
            building_id="BLD-WATER-PLANT",
            zone_id="ZONE-WATER-PLANT",
            code="WP-01",
            name="Water Plant Feed Pump 01",
            category=AssetCategory.PUMP,
            status=AssetStatus.NOMINAL,
            health_score=88,
            criticality=Criticality.LIFE_SUPPORT,
            commissioned_at=base_time - timedelta(days=600),
            source="SYNTHETIC_SIMULATION",
            created_at=base_time,
            updated_at=base_time,
        )
        hvac02 = Asset(
            id="HVAC-02",
            station_id="STATION-BHARATI",
            building_id="BLD-MAIN-OPS",
            zone_id="ZONE-HABITAT-2",
            code="HVAC-02",
            name="Habitat Heating Thermal Loop B Unit",
            category=AssetCategory.HVAC,
            status=AssetStatus.WARNING,
            health_score=65,
            criticality=Criticality.LIFE_SUPPORT,
            commissioned_at=base_time - timedelta(days=1000),
            source="SYNTHETIC_SIMULATION",
            created_at=base_time,
            updated_at=base_time,
        )
        pdu_sci = Asset(
            id="PDU-SCI",
            station_id="STATION-BHARATI",
            building_id="BLD-RESEARCH-BLOCK",
            zone_id="ZONE-RADAR-LAB",
            code="PDU-SCI",
            name="Research Power Distribution Unit",
            category=AssetCategory.POWER_DISTRIBUTION,
            status=AssetStatus.NOMINAL,
            health_score=96,
            criticality=Criticality.STANDARD,
            commissioned_at=base_time - timedelta(days=500),
            source="SYNTHETIC_SIMULATION",
            created_at=base_time,
            updated_at=base_time,
        )
        db.add_all([g02, g01, b01, wp01, hvac02, pdu_sci])
        db.flush()

        # ── 5. ASSET DEPENDENCIES ───────────────────────────────
        dep_g02_hvac = AssetDependency(
            source_asset_id="G-02",
            target_asset_id="HVAC-02",
            dependency_type=DependencyType.THERMAL,
            impact_factor=0.85,
            is_redundant=False,
            description="Exhaust waste heat loop supplies primary thermal input to Habitat Loop B",
            created_at=base_time,
        )
        dep_g02_pdu = AssetDependency(
            source_asset_id="G-02",
            target_asset_id="PDU-SCI",
            dependency_type=DependencyType.ELECTRICAL,
            impact_factor=0.50,
            is_redundant=True,
            description="Phase B electrical feed to Research Lab PDU",
            created_at=base_time,
        )
        dep_g02_srv = AssetDependency(
            source_asset_id="G-02",
            target_service_id="SRV-HAB-HEAT-Z2",
            dependency_type=DependencyType.THERMAL,
            impact_factor=0.90,
            is_redundant=False,
            description="Primary thermal supplier for Zone 2 heating service in winter mode",
            created_at=base_time,
        )
        dep_g01_wp = AssetDependency(
            source_asset_id="G-01",
            target_asset_id="WP-01",
            dependency_type=DependencyType.ELECTRICAL,
            impact_factor=0.70,
            is_redundant=True,
            description="Primary electrical supply to Water Plant Pump 01",
            created_at=base_time,
        )
        dep_b01_hvac = AssetDependency(
            source_asset_id="B-01",
            target_asset_id="HVAC-02",
            dependency_type=DependencyType.THERMAL,
            impact_factor=0.60,
            is_redundant=True,
            description="Auxiliary backup thermal loop capable of picking up Zone 2 load",
            created_at=base_time,
        )
        dep_hvac_srv = AssetDependency(
            source_asset_id="HVAC-02",
            target_service_id="SRV-HAB-HEAT-Z2",
            dependency_type=DependencyType.THERMAL,
            impact_factor=0.95,
            is_redundant=False,
            description="HVAC Heat exchanger delivers forced warm air to Habitat Zone 2",
            created_at=base_time,
        )
        dep_pdu_srv = AssetDependency(
            source_asset_id="PDU-SCI",
            target_service_id="SRV-MAIN-POWER",
            dependency_type=DependencyType.ELECTRICAL,
            impact_factor=0.70,
            is_redundant=True,
            description="Research Lab power distribution bus connection",
            created_at=base_time,
        )
        db.add_all([dep_g02_hvac, dep_g02_pdu, dep_g02_srv, dep_g01_wp, dep_b01_hvac, dep_hvac_srv, dep_pdu_srv])
        db.flush()

        # ── 6. SENSORS & HISTORICAL MEASUREMENTS ─────────────────
        sens_vib = Sensor(
            id="SENS-G02-VIB",
            asset_id="G-02",
            name="G-02 Bearing Vibration",
            metric_key="bearing_vibration_mm_s",
            unit="mm/s",
            min_threshold=0.0,
            max_threshold=10.0,
            warning_threshold=4.0,
            critical_threshold=6.0,
            created_at=base_time,
        )
        sens_temp = Sensor(
            id="SENS-G02-TEMP",
            asset_id="G-02",
            name="G-02 Coolant Temperature",
            metric_key="coolant_temp_celsius",
            unit="°C",
            min_threshold=50.0,
            max_threshold=115.0,
            warning_threshold=90.0,
            critical_threshold=98.0,
            created_at=base_time,
        )
        sens_eff = Sensor(
            id="SENS-G02-EFF",
            asset_id="G-02",
            name="G-02 Fuel Efficiency",
            metric_key="efficiency_pct",
            unit="%",
            min_threshold=20.0,
            max_threshold=100.0,
            warning_threshold=35.0,
            critical_threshold=25.0,
            created_at=base_time,
        )
        sens_load = Sensor(
            id="SENS-G02-LOAD",
            asset_id="G-02",
            name="G-02 Electrical Output Load",
            metric_key="load_kw",
            unit="kW",
            min_threshold=0.0,
            max_threshold=300.0,
            warning_threshold=250.0,
            critical_threshold=285.0,
            created_at=base_time,
        )
        db.add_all([sens_vib, sens_temp, sens_eff, sens_load])
        db.flush()

        # Seed 24 hours of deterministic telemetry trend for G-02 (vibration rising, temp rising, efficiency falling)
        measurements: list[Measurement] = []
        for i in range(24, -1, -1):
            t = base_time - timedelta(hours=i)
            # Deterministic progression curve
            prog = (24 - i) / 24.0  # 0.0 -> 1.0
            vib_val = round(2.2 + 2.6 * (prog**1.4), 2)  # 2.2 -> 4.8 mm/s
            temp_val = round(80.5 + 13.7 * (prog**1.2), 1)  # 80.5 -> 94.2 °C
            eff_val = round(42.0 - 9.6 * (prog**1.1), 1)  # 42.0 -> 32.4 %
            load_val = round(210.0 + 15.0 * (prog**0.8), 1)  # 210 -> 225 kW

            measurements.append(
                Measurement(
                    sensor_id="SENS-G02-VIB",
                    timestamp=t,
                    value=vib_val,
                    unit="mm/s",
                    quality=Quality.GOOD,
                    source="SYNTHETIC_SIMULATION",
                    truth_type=TruthType.MEASURED,
                    confidence=0.98,
                    created_at=t,
                )
            )
            measurements.append(
                Measurement(
                    sensor_id="SENS-G02-TEMP",
                    timestamp=t,
                    value=temp_val,
                    unit="°C",
                    quality=Quality.GOOD,
                    source="SYNTHETIC_SIMULATION",
                    truth_type=TruthType.MEASURED,
                    confidence=0.98,
                    created_at=t,
                )
            )
            measurements.append(
                Measurement(
                    sensor_id="SENS-G02-EFF",
                    timestamp=t,
                    value=eff_val,
                    unit="%",
                    quality=Quality.GOOD,
                    source="SYNTHETIC_SIMULATION",
                    truth_type=TruthType.MEASURED,
                    confidence=0.95,
                    created_at=t,
                )
            )
            measurements.append(
                Measurement(
                    sensor_id="SENS-G02-LOAD",
                    timestamp=t,
                    value=load_val,
                    unit="kW",
                    quality=Quality.GOOD,
                    source="SYNTHETIC_SIMULATION",
                    truth_type=TruthType.MEASURED,
                    confidence=0.99,
                    created_at=t,
                )
            )

        db.add_all(measurements)
        db.flush()

        # ── 7. MAINTENANCE, SPARES, INVENTORY & RESUPPLY ─────────
        sp_sk402 = SparePart(
            id="SP-SK-402",
            part_number="SK-402",
            name="Generator G-02 Gasket & Fuel Pump Seal Kit",
            description="Rotary fuel injection pump mechanical seal and cryogenic fluorosilicone O-ring set.",
            criticality=Criticality.CRITICAL,
            created_at=base_time,
        )
        db.add(sp_sk402)
        db.flush()

        mwo_089 = MaintenanceWorkOrder(
            id="MWO-2026-089",
            asset_id="G-02",
            title="G-02 Fuel Injection Pump & Bearing Seal Replacement",
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.BLOCKED_PARTS,
            required_action="Replace degraded pump mechanical seal to prevent bearing seizure and thermal runaway.",
            assigned_to="Lead Mechanical Eng. Verma",
            due_at=base_time + timedelta(hours=48),
            created_at=base_time - timedelta(hours=6),
            updated_at=base_time,
        )
        db.add(mwo_089)
        db.flush()

        m_spare = MaintenanceSpare(
            work_order_id="MWO-2026-089",
            spare_part_id="SP-SK-402",
            quantity_required=1,
        )
        db.add(m_spare)

        # Local stock is 0 (Hero demonstration condition)
        inv_item = InventoryItem(
            id="INV-BHARATI-SK402",
            spare_part_id="SP-SK-402",
            station_id="STATION-BHARATI",
            quantity_available=0,
            quantity_reserved=0,
            reorder_threshold=1,
            location="Powerhouse Spares Rack B-04",
            updated_at=base_time,
        )
        db.add(inv_item)

        # Scheduled resupply vessel ETA ~11 days
        resupply = ResupplyOpportunity(
            id="RESUPPLY-2026-V01",
            station_id="STATION-BHARATI",
            spare_part_id="SP-SK-402",
            vessel_name="MV Vasiliy Golovnin",
            expected_date=base_time + timedelta(days=11),
            quantity=2,
            delay_days=0,
            status=ResupplyStatus.IN_TRANSIT,
            updated_at=base_time,
        )
        db.add(resupply)
        db.flush()

        # ── 8. ENERGY & FUEL RESOURCE ────────────────────────────
        diesel = EnergyResource(
            id="ENG-BHARATI-DIESEL",
            station_id="STATION-BHARATI",
            resource_type="DIESEL_LFO",
            current_quantity=142500.0,
            max_capacity=250000.0,
            unit="LITERS",
            burn_rate_per_hour=84.5,
            source="SYNTHETIC_SIMULATION",
            truth_type=TruthType.MEASURED,
            updated_at=base_time,
        )
        db.add(diesel)

        # ── 9. WEATHER OBSERVATION ───────────────────────────────
        weather_records = [
            WeatherObservation(
                station_id="STATION-BHARATI",
                timestamp=base_time - timedelta(hours=i),
                temperature_celsius=round(-28.5 + 0.3 * i, 1),
                wind_speed_knots=round(42.0 - 0.8 * i, 1),
                wind_chill_celsius=round(-41.2 + 0.4 * i, 1),
                conditions="BLIZZARD_WARNING" if i <= 3 else "OVERCAST",
                source="SYNTHETIC_SIMULATION",
                truth_type=TruthType.MEASURED,
                created_at=base_time - timedelta(hours=i),
            )
            for i in range(6, -1, -1)
        ]
        db.add_all(weather_records)

        # ── 10. SCIENTIFIC INSTRUMENTS ───────────────────────────
        inst_s17 = ScientificInstrument(
            id="INST-S17-RADAR",
            station_id="STATION-BHARATI",
            code="S-17",
            name="Auroral Ionospheric Radar Array",
            instrument_type="RADAR_SPECTROMETER",
            health="NOMINAL",
            power_status="ACTIVE",
            calibration_status="CALIBRATED",
            last_seen_at=base_time,
            source="SYNTHETIC_SIMULATION",
            created_at=base_time - timedelta(days=90),
        )
        inst_s08 = ScientificInstrument(
            id="INST-S08-SEIS",
            station_id="STATION-BHARATI",
            code="S-08",
            name="Broadband Seismometer Array",
            instrument_type="SEISMOMETER",
            health="NOMINAL",
            power_status="ACTIVE",
            calibration_status="CALIBRATED",
            last_seen_at=base_time,
            source="SYNTHETIC_SIMULATION",
            created_at=base_time - timedelta(days=120),
        )
        db.add_all([inst_s17, inst_s08])
        db.flush()

        sci_obs = [
            ScientificObservation(
                instrument_id="INST-S17-RADAR",
                timestamp=base_time - timedelta(hours=i),
                measurement_value=round(124.5 + 4.2 * (i % 3), 2),
                unit="TECU",
                quality=Quality.GOOD,
                source="SYNTHETIC_SIMULATION",
                truth_type=TruthType.MEASURED,
                created_at=base_time - timedelta(hours=i),
            )
            for i in range(6, -1, -1)
        ]
        db.add_all(sci_obs)

        # ── 11. COMMS LINK & SYNC QUEUE ──────────────────────────
        comm_link = CommunicationLink(
            id="LINK-SAT-01",
            station_id="STATION-BHARATI",
            name="GSAT-7 / Inmarsat Primary Link",
            status="ONLINE",
            last_sync_at=base_time,
            latency_ms=580,
            bandwidth_kbps=2048,
            created_at=base_time - timedelta(days=180),
            updated_at=base_time,
        )
        sync_item = SyncQueueItem(
            id="SYNC-INIT-001",
            station_id="STATION-BHARATI",
            event_type="TELEMETRY_HEARTBEAT",
            payload_json='{"status": "INITIALIZED", "node": "BHARATI_LOCAL"}',
            priority=3,
            status=SyncStatus.RECONCILED,
            checksum_sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            created_at=base_time - timedelta(days=1),
            updated_at=base_time - timedelta(days=1),
        )
        
        # Day 4 deterministic queue baseline items
        p0_g02_payload = '{"asset":"G-02","code":"HIGH_VIBRATION_SHUTDOWN"}'
        p0_inc_payload = '{"incident_id":"INC-2026-04","status":"ACTIVE"}'
        p1_mwo_payload = '{"action":"PUMP_SEAL_EXPEDITE","work_order":"MWO-2026-089"}'
        p2_sci_payload = '{"event":"RADAR_BUFFER_SAVE","instrument":"S-17"}'
        p3_tel_payload = '{"diagnostics":"STATION_BATTERY_BUS_HEALTH"}'

        demo_sync_items = [
            SyncQueueItem(
                id="QITEM-P0-G02",
                station_id="STATION-BHARATI",
                event_type="P0_CRITICAL_GENERATOR_SHUTDOWN",
                payload_json=p0_g02_payload,
                priority=0,
                status=SyncStatus.PENDING,
                checksum_sha256=hashlib.sha256(p0_g02_payload.encode("utf-8")).hexdigest(),
                created_at=base_time - timedelta(hours=3),
                updated_at=base_time - timedelta(hours=3),
            ),
            SyncQueueItem(
                id="QITEM-P0-INC",
                station_id="STATION-BHARATI",
                event_type="P0_CRITICAL_INCIDENT_ESCALATION",
                payload_json=p0_inc_payload,
                priority=0,
                status=SyncStatus.PENDING,
                checksum_sha256=hashlib.sha256(p0_inc_payload.encode("utf-8")).hexdigest(),
                created_at=base_time - timedelta(hours=2, minutes=30),
                updated_at=base_time - timedelta(hours=2, minutes=30),
            ),
            SyncQueueItem(
                id="QITEM-P1-MWO",
                station_id="STATION-BHARATI",
                event_type="P1_MAINTENANCE_WORK_ORDER",
                payload_json=p1_mwo_payload,
                priority=1,
                status=SyncStatus.PENDING,
                checksum_sha256=hashlib.sha256(p1_mwo_payload.encode("utf-8")).hexdigest(),
                created_at=base_time - timedelta(hours=2),
                updated_at=base_time - timedelta(hours=2),
            ),
            SyncQueueItem(
                id="QITEM-P2-SCI",
                station_id="STATION-BHARATI",
                event_type="P2_SCIENCE_EXPERIMENT_LOG",
                payload_json=p2_sci_payload,
                priority=2,
                status=SyncStatus.PENDING,
                checksum_sha256=hashlib.sha256(p2_sci_payload.encode("utf-8")).hexdigest(),
                created_at=base_time - timedelta(hours=1, minutes=30),
                updated_at=base_time - timedelta(hours=1, minutes=30),
            ),
            SyncQueueItem(
                id="QITEM-P3-TEL",
                station_id="STATION-BHARATI",
                event_type="P3_ROUTINE_DIAGNOSTIC_BATCH",
                payload_json=p3_tel_payload,
                priority=3,
                status=SyncStatus.PENDING,
                checksum_sha256=hashlib.sha256(p3_tel_payload.encode("utf-8")).hexdigest(),
                created_at=base_time - timedelta(hours=1),
                updated_at=base_time - timedelta(hours=1),
            ),
        ]
        db.add_all([comm_link, sync_item] + demo_sync_items)

        # ── 12. INCIDENTS, ACTIONS & OPERATIONAL MEMORY ──────────
        inc_04 = Incident(
            id="INC-2026-04",
            station_id="STATION-BHARATI",
            title="Generator G-02 High Vibration Anomaly & Thermal Loop Degradation",
            severity=IncidentSeverity.MAJOR,
            status=IncidentStatus.ACTIVE,
            location="Powerhouse Gen Bay 2",
            description="Bearing vibration reached 4.8 mm/s exceeding warning threshold (4.0 mm/s). Risk of thermal drop in Zone 2 habitat if unmitigated.",
            started_at=base_time - timedelta(hours=8),
            created_at=base_time - timedelta(hours=8),
            updated_at=base_time,
        )
        mem_01 = OperationalMemory(
            id="MEM-2025-W02",
            station_id="STATION-BHARATI",
            event_type="WINTER_THERMAL_LOAD_SHED",
            title="2025 Winter Generator Tripping Incident & Boiler Transfer",
            context_summary="During August 2025 blizzard, G-01 tripped unexpectedly. Station successfully transferred 30% thermal load to Auxiliary Boiler B-01 and shed science radar payload.",
            lessons_learned="Boiler B-01 takes 35 minutes to reach full heating capacity in winter ambient (-30°C). Initiate boiler preheat sequence before taking primary generator offline.",
            created_at=base_time - timedelta(days=380),
        )
        # Canonical Operational Events Seed for Bharati Station (Hero Scenario)
        ev_bharati_1 = EventLog(
            station_id="STATION-BHARATI",
            event_type="COMMUNICATION_STATE",
            category="COMMS",
            severity="SYSTEM",
            entity_type="COMMS",
            entity_id="VSAT_UPLINK",
            title="VSAT Ku-Band satellite carrier online",
            summary="Carrier established at 680 ms latency with 99.8% nominal packet delivery.",
            message="VSAT Ku-Band satellite carrier online: 680 ms latency, 99.8% nominal packet delivery.",
            timestamp=base_time - timedelta(minutes=45),
            source="SYNTHETIC_SIMULATION",
            truth_type="MEASURED",
            metadata_json='{"carrier":"VSAT Ku-Band","latency_ms":680}',
        )
        ev_bharati_2 = EventLog(
            station_id="STATION-BHARATI",
            event_type="SCIENCE_BUFFER_EVENT",
            category="SCIENCE",
            severity="INFO",
            entity_type="SCIENCE",
            entity_id="INST-S17-RADAR",
            title="S-17 Auroral Radar sampling nominal",
            summary="Instrument active sampling 146.2 TECU ionospheric sweeps; edge buffer nominal.",
            message="S-17 Auroral Radar sampling nominal: 146.2 TECU sweeps; edge circular buffer nominal.",
            timestamp=base_time - timedelta(minutes=30),
            source="SYNTHETIC_SIMULATION",
            truth_type="MEASURED",
            metadata_json='{"tecu":146.2,"buffer_percent":42.0}',
        )
        ev_bharati_3 = EventLog(
            station_id="STATION-BHARATI",
            event_type="WEATHER_CHANGE",
            category="ENVIRONMENT",
            severity="INFO",
            entity_type="ENVIRONMENT",
            entity_id="WEATHER",
            title="Ambient temperature decreased to -28.5°C",
            summary="Winter blizzard conditions approaching; wind speed 42 kt, wind chill -41.2°C.",
            message="Weather update: ambient temperature -28.5°C; wind speed 42 kt, wind chill -41.2°C.",
            timestamp=base_time - timedelta(minutes=22),
            source="SYNTHETIC_SIMULATION",
            truth_type="MEASURED",
            metadata_json='{"temperature_c":-28.5,"wind_chill_c":-41.2}',
        )
        ev_bharati_4 = EventLog(
            station_id="STATION-BHARATI",
            event_type="TELEMETRY_CHANGE",
            category="RESOURCE",
            severity="INFO",
            entity_type="RESOURCE",
            entity_id="DIESEL_LFO",
            title="Fuel runway projected at 70.3 days",
            summary="Winter target requires 90 days; resupply window ETA 11 days provides buffer.",
            message="Fuel runway calculated at 70.3 days against 90-day winter target reserve policy.",
            timestamp=base_time - timedelta(minutes=15),
            source="SYNTHETIC_SIMULATION",
            truth_type="DERIVED",
            metadata_json='{"runway_days":70.3,"target_days":90.0,"resupply_days":11.0}',
        )
        ev_bharati_5 = EventLog(
            station_id="STATION-BHARATI",
            event_type="INVENTORY_SHORTAGE",
            category="RESOURCE",
            severity="WARNING",
            entity_type="RESOURCE",
            entity_id="SK-402",
            title="SK-402 Rotary Seal Kit zero local stock",
            summary="Central spares bin SK-402 depleted; recovery chain dependent on maritime resupply.",
            message="Critical spare part SK-402 out of stock; preventive overhaul blocked until resupply.",
            timestamp=base_time - timedelta(minutes=10),
            source="SYNTHETIC_SIMULATION",
            truth_type="MEASURED",
            metadata_json='{"part_id":"SK-402","stock":0,"resupply_eta_days":11}',
        )
        ev_bharati_6 = EventLog(
            station_id="STATION-BHARATI",
            event_type="DEPENDENCY_EXPOSURE",
            category="SERVICE",
            severity="WARNING",
            entity_type="SERVICE",
            entity_id="ZONE_2_HEATING",
            title="Habitat Zone 2 heating dependency exposed",
            summary="Generator G-02 thermal loop heat margin degraded; secondary heating circuit exposed.",
            message="Dependency exposure: Habitat Zone 2 living quarters heating exposed via degraded Loop B.",
            timestamp=base_time - timedelta(minutes=6),
            source="SYNTHETIC_SIMULATION",
            truth_type="DERIVED",
            metadata_json='{"affected_zone":"Habitat Zone 2","loop":"Thermal Loop B"}',
        )
        ev_bharati_7 = EventLog(
            station_id="STATION-BHARATI",
            event_type="RISK_CHANGE",
            category="ASSET",
            severity="WARNING",
            entity_type="ASSET",
            entity_id="G-02",
            title="G-02 condition risk increased to 78/100",
            summary="Composite risk elevated due to persistent bearing vibration and high coolant temp.",
            message="Asset risk escalation: Generator G-02 condition risk calculated at 78/100 (WARNING).",
            timestamp=base_time - timedelta(minutes=3),
            source="SYNTHETIC_SIMULATION",
            truth_type="DERIVED",
            metadata_json='{"risk_score":78,"health_score":62}',
        )
        ev_bharati_8 = EventLog(
            station_id="STATION-BHARATI",
            event_type="THRESHOLD_BREACH",
            category="ASSET_ALERT",
            severity="WARNING",
            entity_type="ASSET",
            entity_id="G-02",
            title="G-02 bearing vibration threshold exceeded",
            summary="Bearing vibration reached 4.8 mm/s, exceeding warning threshold limit of 4.0 mm/s.",
            message="Asset G-02 bearing vibration threshold exceeded: 4.8 mm/s > 4.0 mm/s",
            timestamp=base_time - timedelta(minutes=1),
            source="SYNTHETIC_SIMULATION",
            truth_type="MEASURED",
            metadata_json='{"metric":"bearing_vibration_mm_s","value":4.8,"threshold":4.0}',
        )

        # Operational Events for Maitri Station (Contrast Baseline)
        ev_maitri_1 = EventLog(
            station_id="STATION-MAITRI",
            event_type="COMMUNICATION_STATE",
            category="COMMS",
            severity="SYSTEM",
            entity_type="COMMS",
            entity_id="IRIDIUM_PILOT",
            title="Iridium Pilot backup link active (Maitri)",
            summary="Primary VSAT in scheduled maintenance; secondary Iridium transceiver online at 48 kbps.",
            message="Maitri secondary Iridium link online; scheduled satellite pass completed.",
            timestamp=base_time - timedelta(hours=2),
            source="SYNTHETIC_SIMULATION",
            truth_type="MEASURED",
            metadata_json='{"carrier":"Iridium Pilot","bandwidth_kbps":48}',
        )
        ev_maitri_2 = EventLog(
            station_id="STATION-MAITRI",
            event_type="WEATHER_CHANGE",
            category="ENVIRONMENT",
            severity="INFO",
            entity_type="ENVIRONMENT",
            entity_id="WEATHER",
            title="Maitri weather: -22.1°C, wind 18 kt",
            summary="Schirmacher Oasis conditions calm; low blizzarding probability.",
            message="Maitri ambient weather: -22.1°C; wind speed 18 kt, clear visibility.",
            timestamp=base_time - timedelta(hours=1),
            source="SYNTHETIC_SIMULATION",
            truth_type="MEASURED",
            metadata_json='{"temperature_c":-22.1,"wind_speed_kt":18.0}',
        )

        db.add_all([
            inc_04,
            mem_01,
            ev_bharati_1,
            ev_bharati_2,
            ev_bharati_3,
            ev_bharati_4,
            ev_bharati_5,
            ev_bharati_6,
            ev_bharati_7,
            ev_bharati_8,
            ev_maitri_1,
            ev_maitri_2,
        ])

        ensure_maitri_canonical_state(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        if close_after:
            db.close()


if __name__ == "__main__":
    seed_database()
    print("Deterministic Antarctic station dataset seeded successfully.")
