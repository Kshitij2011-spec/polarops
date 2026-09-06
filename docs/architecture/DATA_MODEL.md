# Data Model Specification

## 1. Provenance & Data Honesty Metadata Schema

Every telemetry reading, calculation, or scenario output incorporates standard provenance metadata:

```json
{
  "source": "sensor:g02:temp_01",
  "timestamp": "2026-09-06T12:00:00Z",
  "freshness_seconds": 1.2,
  "quality": "GOOD",
  "truth_type": "MEASURED",
  "confidence": 0.98
}
```

### Truth Types (`truth_type`)
- `MEASURED`: Direct raw sensor telemetry.
- `DERIVED`: Computed metric (e.g. calculated thermal demand, overall health score).
- `FORECAST`: Projected future value (e.g. 72-hour fuel runway projection).
- `SCENARIO`: Simulated metric under a what-if operational condition.

---

## 2. Core Entities & Attributes

### Station & Topology
- **Station**: `id`, `name` (e.g. "Bharati", "Maitri"), `code`, `coordinates`, `environment_mode` (SUMMER/WINTER).
- **Building / Module**: `id`, `station_id`, `name`, `type` (MAIN_HABITAT, POWER_HOUSE, FUEL_FARM, SCIENCE_LAB).
- **Zone**: `id`, `building_id`, `name`, `occupancy`, `target_temp_celsius`, `criticality_level`.

### Asset & Subsystem Topology
- **Asset**: `id`, `zone_id`, `name`, `code` (e.g., `G-02`), `category` (GENERATOR, BOILER, WATER_MAKER, COMM_DOME, HVAC), `status` (NOMINAL, WARNING, CRITICAL, SHUTDOWN, MAINTENANCE), `health_score` (0-100), `installed_date`, `specs_json`.
- **Subsystem**: `id`, `name`, `code` (e.g., `POWER_GEN`, `THERMAL_LOOP_A`), `criticality` (LIFE_SUPPORT, CRITICAL, STANDARD, DEFERRABLE).
- **Service**: `id`, `name`, `description` (e.g., "Habitat Thermal Supply", "Life Support Power", "Satellite Data Uplink").

### Telemetry & Sensors
- **Sensor**: `id`, `asset_id`, `name`, `metric_key` (e.g. `vibration_mm_s`, `coolant_temp_c`, `fuel_flow_l_h`), `unit`, `min_threshold`, `max_threshold`, `critical_threshold`.
- **Measurement**: `id`, `sensor_id`, `value`, `timestamp`, `quality`, `truth_type`, `confidence`.

### Dependencies
- **AssetDependency**: `parent_asset_id`, `child_asset_id`, `dependency_type` (ELECTRICAL, THERMAL, FUEL, DATA, PHYSICAL), `impact_factor` (0.0 to 1.0), `is_redundant`.
- **AssetServiceMap**: `asset_id`, `service_id`, `criticality_weight`.

### Energy & Fuel Resources
- **EnergyResource**: `id`, `station_id`, `type` (DIESEL_LFO, SOLAR_ARRAY, BATTERY_BANK), `current_capacity`, `max_capacity`, `unit` (LITERS, KWH).
- **FuelRunwayLog**: `id`, `timestamp`, `current_stock_liters`, `burn_rate_l_h`, `projected_runway_days`, `ambient_temp_c`, `truth_type`.

### Maintenance & Inventory
- **MaintenanceWorkOrder**: `id`, `asset_id`, `title`, `priority` (LOW, MEDIUM, HIGH, EMERGENCY), `status` (PENDING, IN_PROGRESS, COMPLETED, BLOCKED_PARTS), `created_at`, `assigned_to`.
- **SparePart**: `id`, `part_number`, `name`, `compatible_assets`, `min_stock_level`.
- **InventoryItem**: `id`, `spare_part_id`, `location`, `quantity_available`, `quantity_reserved`.
- **ResupplyOpportunity**: `id`, `vessel_name`, `eta_date`, `manifest_items_json`, `status` (SCHEDULED, IN_TRANSIT, DELAYED).

### Operations, Incidents & Memory
- **Incident**: `id`, `station_id`, `title`, `severity` (MINOR, MAJOR, CRITICAL), `status` (ACTIVE, CONTAINED, RESOLVED), `affected_assets_json`, `created_at`.
- **OperationalAction**: `id`, `incident_id`, `scenario_id`, `action_type`, `description`, `executed_by`, `executed_at`, `outcome_status`.
- **OperationalMemory`: `id`, `event_type`, `context_summary`, `lessons_learned`, `created_at`.

### Offline & Synchronization
- **SyncQueueItem**: `id`, `client_timestamp`, `payload_type`, `payload_json`, `priority` (1-10), `checksum_sha256`, `sync_status` (QUEUED, SENT, ACKNOWLEDGED, RECONCILED).

---

## 3. Entity Relationship Diagram (Conceptual)

```text
Station ───< Building ───< Zone ───< Asset ───< Sensor ───< Measurement
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
   AssetDependency             MaintenanceWorkOrder      AssetServiceMap
   (Asset → Asset)                    │                          │
                                      ▼                          ▼
                                 SparePart                    Service
                                      │                          │
                                      ▼                          ▼
                                InventoryItem             Incident Context
```
