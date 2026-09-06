"""Unit tests for domain model entities, relationships, and enums."""

from app.models import (
    Asset,
    AssetCategory,
    AssetDependency,
    AssetStatus,
    Criticality,
    DependencyType,
    EnvironmentMode,
    InventoryItem,
    MaintenanceWorkOrder,
    Measurement,
    ResupplyOpportunity,
    Station,
    TruthType,
)


def test_station_and_spatial_hierarchy(db_session):
    """Verify Station -> Building -> Zone hierarchy."""
    bharati = db_session.query(Station).filter(Station.id == "STATION-BHARATI").first()
    assert bharati is not None
    assert bharati.code == "BHARATI"
    assert bharati.environment_mode == EnvironmentMode.WINTER

    # Check buildings
    assert len(bharati.buildings) >= 4
    power_plant = next((b for b in bharati.buildings if b.id == "BLD-POWER-PLANT"), None)
    assert power_plant is not None

    # Check zones
    gen_hall = next((z for z in power_plant.zones if z.id == "ZONE-GEN-HALL"), None)
    assert gen_hall is not None
    assert gen_hall.criticality == Criticality.CRITICAL


def test_asset_g02_hero_configuration(db_session):
    """Verify Generator G-02 asset configuration and sensors."""
    g02 = db_session.query(Asset).filter(Asset.id == "G-02").first()
    assert g02 is not None
    assert g02.category == AssetCategory.GENERATOR
    assert g02.status == AssetStatus.WARNING
    assert g02.health_score == 62
    assert g02.criticality == Criticality.CRITICAL

    # Verify sensors
    sensor_keys = [s.metric_key for s in g02.sensors]
    assert "bearing_vibration_mm_s" in sensor_keys
    assert "coolant_temp_celsius" in sensor_keys
    assert "efficiency_pct" in sensor_keys

    # Verify historical telemetry series exists and is ordered
    vib_sensor = next(s for s in g02.sensors if s.metric_key == "bearing_vibration_mm_s")
    measurements = (
        db_session.query(Measurement)
        .filter(Measurement.sensor_id == vib_sensor.id)
        .order_by(Measurement.timestamp.asc())
        .all()
    )
    assert len(measurements) >= 24
    # Check rising trend
    assert measurements[0].value < measurements[-1].value
    assert measurements[-1].value == 4.8
    assert measurements[-1].truth_type == TruthType.MEASURED


def test_asset_relational_dependencies(db_session):
    """Verify G-02 dependency links to HVAC unit and Zone 2 heating service."""
    deps = (
        db_session.query(AssetDependency)
        .filter(AssetDependency.source_asset_id == "G-02")
        .all()
    )
    assert len(deps) >= 2

    thermal_dep = next(
        (
            d
            for d in deps
            if d.dependency_type == DependencyType.THERMAL
            and d.target_asset_id == "HVAC-02"
        ),
        None,
    )
    assert thermal_dep is not None
    assert thermal_dep.is_redundant is False

    service_dep = next(
        (d for d in deps if d.target_service_id == "SRV-HAB-HEAT-Z2"), None
    )
    assert service_dep is not None
    assert service_dep.impact_factor == 0.90


def test_maintenance_spare_inventory_chain(db_session):
    """Verify MaintenanceWorkOrder -> SparePart -> Inventory (0) -> Resupply (11d)."""
    mwo = (
        db_session.query(MaintenanceWorkOrder)
        .filter(MaintenanceWorkOrder.asset_id == "G-02")
        .first()
    )
    assert mwo is not None
    assert mwo.id == "MWO-2026-089"
    assert len(mwo.required_spares) >= 1

    required_spare = mwo.required_spares[0].spare_part
    assert required_spare.part_number == "SK-402"

    # Verify inventory is 0 (hero condition)
    inv = (
        db_session.query(InventoryItem)
        .filter(InventoryItem.spare_part_id == required_spare.id)
        .first()
    )
    assert inv is not None
    assert inv.quantity_available == 0

    # Verify resupply opportunity exists
    resupply = (
        db_session.query(ResupplyOpportunity)
        .filter(ResupplyOpportunity.spare_part_id == required_spare.id)
        .first()
    )
    assert resupply is not None
    assert resupply.vessel_name == "MV Vasiliy Golovnin"
    assert resupply.quantity == 2
