# API Contracts Specification

This document defines the REST API endpoints required for the PolarOps MVP. All responses adhere to standard JSON formats and include telemetry provenance metadata where applicable.

---

## 1. Common Metadata & Error Response Shapes

### Provenance Metadata Block
```json
{
  "source": "sensor:g02:vibration_01",
  "timestamp": "2026-09-06T12:00:00Z",
  "freshness_seconds": 1.5,
  "quality": "GOOD",
  "truth_type": "MEASURED",
  "confidence": 0.98
}
```

### Standard Error Response (HTTP 4xx / 5xx)
```json
{
  "error": {
    "code": "ASSET_NOT_FOUND",
    "message": "Asset with ID 'G-99' does not exist in station inventory.",
    "details": null,
    "timestamp": "2026-09-06T12:00:00Z"
  }
}
```

---

## 2. Station Overview & Telemetry

### `GET /station/overview`
Returns high-level station status, active incident count, weather metrics, and subsystem health summary.

**Response (200 OK)**:
```json
{
  "station_id": "STATION-BHARATI",
  "name": "Bharati Research Station",
  "environment_mode": "WINTER",
  "overall_health_score": 78,
  "active_incidents_count": 1,
  "ambient_weather": {
    "temperature_celsius": -28.5,
    "wind_speed_knots": 42.0,
    "wind_chill_celsius": -41.2,
    "provenance": { "source": "weather:station:main", "timestamp": "2026-09-06T12:00:00Z", "quality": "GOOD", "truth_type": "MEASURED", "confidence": 1.0 }
  },
  "subsystem_summary": [
    { "code": "POWER_GEN", "name": "Power Generation", "status": "WARNING", "health_score": 65 },
    { "code": "THERMAL_LOOP", "name": "Thermal Loop", "status": "NOMINAL", "health_score": 90 },
    { "code": "LIFE_SUPPORT", "name": "Life Support", "status": "NOMINAL", "health_score": 95 },
    { "code": "SAT_COMMS", "name": "Satellite Comms", "status": "NOMINAL", "health_score": 88 }
  ]
}
```

---

## 3. Asset Intelligence & Risk

### `GET /assets`
Lists station assets filtered by category or status.

### `GET /assets/{asset_id}`
Returns asset details, telemetry metrics, and current operational threshold limits.

**Response (200 OK)**:
```json
{
  "asset_id": "G-02",
  "name": "Diesel Generator G-02",
  "category": "GENERATOR",
  "zone_id": "POWER_HOUSE",
  "status": "WARNING",
  "health_score": 62,
  "metrics": [
    { "key": "bearing_vibration_mm_s", "value": 4.8, "unit": "mm/s", "status": "WARNING", "warning_threshold": 4.0, "critical_threshold": 6.0 },
    { "key": "coolant_temp_celsius", "value": 94.2, "unit": "°C", "status": "WARNING", "warning_threshold": 90.0, "critical_threshold": 98.0 }
  ],
  "provenance": { "source": "telemetry:engine:g02", "timestamp": "2026-09-06T12:00:00Z", "quality": "GOOD", "truth_type": "MEASURED", "confidence": 0.95 }
}
```

### `GET /assets/{asset_id}/dependencies?max_depth=5`
Returns upstream dependencies and multi-hop downstream blast-radius services, zones, and equipment paths.

**Query Parameters**:
- `max_depth` (int, default=5): Maximum traversal depth for breadth-first search.

**Response (200 OK)**:
```json
{
  "asset_id": "GEN-BHARATI-G02",
  "upstream_dependencies": [
    {
      "asset_id": "AST-BHARATI-TANK-MAIN",
      "code": "TK-01",
      "name": "Main Station Fuel Day Tank",
      "type": "FUEL",
      "impact_factor": 1.0,
      "is_redundant": false
    }
  ],
  "downstream_impact": {
    "affected_subsystems": ["Thermal Loop", "Power Generation"],
    "affected_services": [
      { "service_id": "SRV-HAB-HEAT-Z2", "code": "SRV-HAB-HEAT-Z2", "name": "Habitat Zone 2 Heating", "criticality": "LIFE_SUPPORT" }
    ],
    "affected_zones": ["ZONE-HAB-02", "ZONE-POWER-01"]
  },
  "nodes": [
    { "id": "AST-BHARATI-G02", "code": "GEN-BHARATI-G02", "name": "Primary Backup Genset G-02", "node_type": "ASSET", "depth": 0, "status": "WARNING" },
    { "id": "AST-BHARATI-HVAC-02", "code": "HVAC-02", "name": "Living Quarters HVAC Unit", "node_type": "ASSET", "depth": 1, "status": "NOMINAL" },
    { "id": "SRV-HAB-HEAT-Z2", "code": "SRV-HAB-HEAT-Z2", "name": "Habitat Zone 2 Heating", "node_type": "SERVICE", "depth": 2, "criticality": "LIFE_SUPPORT" }
  ],
  "edges": [
    { "source_id": "AST-BHARATI-G02", "target_id": "AST-BHARATI-HVAC-02", "dependency_type": "POWER", "impact_factor": 1.0, "is_redundant": false },
    { "source_id": "AST-BHARATI-HVAC-02", "target_id": "SRV-HAB-HEAT-Z2", "dependency_type": "SERVICE", "impact_factor": 1.0, "is_redundant": false }
  ],
  "max_depth": 2,
  "paths": [
    "GEN-BHARATI-G02 → HVAC-02 → Habitat Zone 2 Heating"
  ],
  "total_downstream_assets": 1,
  "total_affected_services": 1,
  "total_affected_zones": 1
}
```

### `GET /assets/{asset_id}/telemetry?limit=50`
Returns historical sensor measurement points and deterministic trend analysis for asset sensors.

**Query Parameters**:
- `limit` (int, default=50): Number of recent chronological readings to return per sensor.

**Response (200 OK)**:
```json
{
  "asset_id": "GEN-BHARATI-G02",
  "asset_name": "Primary Backup Genset G-02",
  "series": [
    {
      "metric_key": "vibration_mm_s",
      "metric_name": "Drive-End Bearing Vibration",
      "unit": "mm/s",
      "current_value": 4.8,
      "warning_threshold": 4.0,
      "critical_threshold": 6.0,
      "threshold_status": "WARNING",
      "trend": "RISING",
      "trend_description": "↑ Rising (+1.60 mm/s over window)",
      "points": [
        { "timestamp": "2026-09-06T10:00:00Z", "value": 3.2, "quality": "GOOD", "truth_type": "MEASURED" },
        { "timestamp": "2026-09-06T11:00:00Z", "value": 4.1, "quality": "GOOD", "truth_type": "MEASURED" },
        { "timestamp": "2026-09-06T12:00:00Z", "value": 4.8, "quality": "GOOD", "truth_type": "MEASURED" }
      ]
    }
  ],
  "provenance": {
    "source": "telemetry:GEN-BHARATI-G02",
    "timestamp": "2026-09-06T12:00:00Z",
    "quality": "GOOD",
    "truth_type": "MEASURED",
    "confidence": 0.95
  }
}
```

### `GET /assets/{asset_id}/risk`
Returns explainable 6-factor composite operational risk score, structured evidence, and recovery blocker metadata.

**Response (200 OK)**:
```json
{
  "asset_id": "GEN-BHARATI-G02",
  "asset_name": "Primary Backup Genset G-02",
  "score": 87,
  "level": "HIGH",
  "factors": [
    { "factor": "condition", "title": "Operating Condition", "score": 20, "max_score": 25, "severity": "HIGH", "evidence": "Vibration exceeds operational limit (4.80 mm/s vs threshold 4.00 mm/s)" },
    { "factor": "criticality", "title": "Asset Criticality", "score": 20, "max_score": 20, "severity": "CRITICAL", "evidence": "Station-critical asset (Criticality level: CRITICAL)" },
    { "factor": "dependency", "title": "Dependency Exposure", "score": 15, "max_score": 20, "severity": "HIGH", "evidence": "Downstream impact on 1 dependent assets, 1 critical services, and 1 spatial zones (max depth: 2 hops)" },
    { "factor": "maintenance", "title": "Maintenance Blockage", "score": 15, "max_score": 15, "severity": "CRITICAL", "evidence": "Work order MWO-2026-089 is currently BLOCKED_PARTS: Fuel injection pump diaphragm rupture detected" },
    { "factor": "spare", "title": "Spare Part Availability", "score": 10, "max_score": 10, "severity": "CRITICAL", "evidence": "Required spare 'SK-402' (Fuel Injection Pump Assembly) has 0 units available locally" },
    { "factor": "resupply", "title": "Resupply Exposure", "score": 7, "max_score": 10, "severity": "HIGH", "evidence": "Resupply vessel MV Vasiliy Golovnin due in 11 days (elevated isolation exposure)" }
  ],
  "summary": "Generator G-02 is in abnormal condition with elevated vibration, cascading to 1 critical services across 2 hops. Recovery is constrained by BLOCKED_PARTS work order (MWO-2026-089) with 0 units of spare SK-402 available and resupply 11 days away.",
  "maintenance_blocked": true,
  "active_work_order_id": "MWO-2026-089",
  "required_spare_part": "SK-402",
  "spare_available_quantity": 0,
  "resupply_days": 11.0,
  "computed_at": "2026-09-06T12:00:00Z",
  "truth_type": "DERIVED",
  "assumptions": [
    "[OUR DESIGN] Explainable 6-factor prototype risk model",
    "Weights: Condition (25), Criticality (20), Dependency (20), Maintenance (15), Spare (10), Resupply (10)",
    "Resupply timeline based on scheduled voyage ETA"
  ]
}
```

---

## 4. Cross-Domain Resources (Energy, Fuel, Inventory, Resupply)

### `GET /resources/fuel?station_id={station_id}`
Returns station bulk fuel stock, continuous hourly burn rate, calculated runway days, and resupply gap.

**Response (200 OK)**:
```json
{
  "station_id": "STATION-BHARATI",
  "resource_type": "POLAR_DIESEL",
  "current_stock_liters": 142500.0,
  "max_capacity_liters": 250000.0,
  "burn_rate_liters_per_hour": 84.5,
  "projected_runway_days": 70.3,
  "winter_target_days": 90.0,
  "resupply_gap_days": -19.7,
  "provenance": {
    "source": "resource_service:fuel_model",
    "timestamp": "2026-09-06T12:00:00Z",
    "quality": "GOOD",
    "truth_type": "DERIVED",
    "confidence": 0.95
  }
}
```

### `GET /resources/inventory?station_id={station_id}`
Returns warehouse stock levels of mission-critical spare parts, stockout alerts, and associated maintenance work orders.

**Response (200 OK)**:
```json
[
  {
    "id": "SP-SK402-01",
    "spare_part_id": "SP-SK402-01",
    "part_number": "SK-402",
    "name": "Generator G-02 Gasket & Fuel Pump Seal Kit",
    "description": "Rotary fuel injection pump mechanical seal and cryogenic fluorosilicone O-ring set.",
    "criticality": "CRITICAL",
    "quantity_available": 0,
    "quantity_reserved": 0,
    "reorder_threshold": 2,
    "location": "Powerhouse Spares Rack B-04",
    "status": "CRITICAL_SHORTAGE",
    "work_order_ids": ["MWO-2026-089"]
  }
]
```

### `GET /resources/resupply?station_id={station_id}`
Returns scheduled synthetic resupply opportunities, inbound cargo manifests, and voyage statuses.

**Response (200 OK)**:
```json
[
  {
    "id": "RES-2026-01",
    "vessel_or_flight_name": "MV Vasiliy Golovnin",
    "transport_type": "VESSEL",
    "eta_date": "2026-09-17T12:00:00Z",
    "eta_days": 11.0,
    "status": "SCHEDULED",
    "cargo_manifest_summary": "450,000 L Polar Diesel, 12 containers provisions, Generator overhaul kits (inc. SK-402)",
    "ice_risk_level": "MODERATE",
    "is_synthetic_scenario": true
  }
]
```

### `GET /resources/energy?station_id={station_id}&ambient_temp_override={celsius}`
Calculates deterministic station energy balance, thermal demand, electrical load, generation fleet reserve, and specific fuel consumption.

**Response (200 OK)**:
```json
{
  "station_id": "STATION-BHARATI",
  "ambient_temperature_celsius": -28.5,
  "thermal_demand_kw": 252.2,
  "baseline_electrical_load_kw": 180.0,
  "projected_electrical_load_kw": 201.2,
  "generation_capacity_kw": 600.0,
  "available_generation_capacity_kw": 600.0,
  "online_generators_count": 2,
  "fuel_burn_rate_lph": 84.5,
  "remaining_fuel_liters": 142500.0,
  "projected_runway_days": 70.3,
  "is_consequence_modeled": false,
  "truth_type": "DERIVED",
  "model_assumptions": [
    "[OUR DESIGN] Synthetic prototype energy model with transparent linear dispatch rules.",
    "Thermal heat-loss coefficient = 5.2 kW/°C relative to +20°C indoor habitat comfort target.",
    "Generator specific fuel consumption rate = 25.0 L/h base + 0.265 L/kWh electrical load.",
    "Runway = remaining fuel / (hourly burn rate * 24 h)."
  ]
}
```

### `GET /resources/recovery/{asset_id}`
Traces and evaluates the deterministic recovery chain for a specific asset (Asset -> Work Order -> Required Spare -> Warehouse Stock -> Resupply ETA -> Recovery Exposure).

**Response (200 OK)**:
```json
{
  "asset_id": "G-02",
  "asset_name": "Diesel Generator G-02",
  "criticality": "CRITICAL",
  "active_work_order_id": "MWO-2026-089",
  "work_order_status": "BLOCKED_PARTS",
  "required_spare_part_number": "SK-402",
  "required_spare_part_name": "Generator G-02 Gasket & Fuel Pump Seal Kit",
  "quantity_available": 0,
  "is_recovery_blocked": true,
  "resupply_vessel_name": "MV Vasiliy Golovnin",
  "resupply_eta_days": 11.0,
  "exposure_level": "HIGH",
  "reasoning": "Recovery is constrained: Diesel Generator G-02 is a critical asset with active work order MWO-2026-089 blocked by zero local stock of SK-402. Resupply vessel MV Vasiliy Golovnin is ≈ 11.0 days away.",
  "truth_type": "DERIVED"
}
```

---

## 5. What-If Scenario Engine

### `POST /scenarios/simulate`
Executes an in-memory, stateless consequence simulation of an asset outage. Does NOT mutate database state. Reuses canonical multi-hop dependency traversal and explainable risk scoring.

**Request Body**:
```json
{
  "station_id": "STATION-BHARATI",
  "scenario_type": "GENERATOR_FAILURE",
  "target_asset_id": "G-02",
  "duration_hours": 72.0,
  "ambient_temp_celsius": -28.5
}
```

**Response (200 OK)**:
```json
{
  "scenario_id": "SCENARIO-E8FA36A6",
  "station_id": "STATION-BHARATI",
  "target_asset_id": "G-02",
  "target_asset_name": "Diesel Generator G-02",
  "scenario_type": "GENERATOR_FAILURE",
  "duration_hours": 72.0,
  "ambient_temp_celsius": -28.5,
  "baseline_risk_score": 91,
  "scenario_risk_score": 95,
  "baseline_energy": { "...": "..." },
  "scenario_energy": { "...": "..." },
  "deltas": [
    {
      "name": "Available Generation Capacity",
      "baseline_value": 600.0,
      "scenario_value": 300.0,
      "delta": -300.0,
      "unit": "kW",
      "impact_direction": "NEGATIVE",
      "description": "Modeled online generator capacity reduced from 600 kW to 300 kW."
    }
  ],
  "affected_assets": [
    {
      "asset_id": "HVAC-02",
      "name": "Habitat AHU & Heat Exchanger 2",
      "criticality": "LIFE_SUPPORT",
      "impact_type": "DOWNSTREAM_DEGRADED"
    }
  ],
  "affected_services": [
    {
      "service_id": "SRV-HAB-HEAT-Z2",
      "code": "HABITAT_HEATING_Z2",
      "name": "Habitat Zone 2 Heating",
      "criticality": "LIFE_SUPPORT",
      "baseline_status": "NOMINAL",
      "scenario_status": "DEGRADED",
      "degradation_rationale": "Loss of Diesel Generator G-02 primary thermal/electrical supply deprives Habitat Zone 2 Heating of necessary heat transfer."
    }
  ],
  "decision_options": [
    {
      "code": "DISPATCH_G01_PRIORITY",
      "title": "Prioritize G-01 Generation Dispatch",
      "category": "GENERATION_DISPATCH",
      "description": "Dispatch Primary Genset G-01 to carry station grid up to 280 kW max continuous limit during 72h failure window.",
      "operational_impact": "Maintains life-support electrical continuity while operating single generator at 85% load factor.",
      "risk_reduction_tier": "HIGH"
    }
  ],
  "scenario_summary": "Hypothetical 72-hour outage of Diesel Generator G-02 at -28.5°C ambient: available capacity falls to 300 kW, cascading to 2 mission-critical services. Modeled risk escalates to 95/100.",
  "truth_type": "SCENARIO"
}
```

---

## 6. Resilience, Offline & Sync Queue

### `GET /resilience/status`
Returns satellite comms link status and local sync queue size.

### `POST /resilience/simulate-offline`
Simulates satellite link blackout (`link_state: OFFLINE`).

### `POST /resilience/simulate-degraded`
Simulates satellite link degradation with elevated latency and throttled bandwidth (`link_state: DEGRADED`).

### `POST /resilience/restore`
Simulates link recovery and triggers queue flush reconciliation.

**Response (200 OK)**:
```json
{
  "status": "RECONCILED",
  "flushed_items_count": 5,
  "checksum_verification": "MATCH_PASSED",
  "reconciled_at": "2026-09-06T12:05:00Z"
}
```

---

## 7. Science, Incidents & Operational Memory

### `GET /science/instruments`
Returns active scientific experiment payloads and power allocation status.

### `POST /science/observations/buffer`
Buffers a scientific measurement locally in edge buffer and enqueues P2 synchronization queue item.

### `POST /science/observations`
Records a scientific measurement with automatic link-state continuity awareness (direct when ONLINE, buffered when OFFLINE).

### `GET /incidents` & `POST /incidents`
Manages station operational incidents.

### `POST /decisions`
Records operator approval of a recommended scenario action into persistent operational memory.

**Request Body**:
```json
{
  "incident_id": "INC-2026-04",
  "scenario_id": "SIM-2026-001",
  "action_taken": "SHIFT_THERMAL_B01",
  "approved_by": "Commander Sharma",
  "notes": "Auxiliary Boiler B-01 activated to maintain Zone 2 habitat temperature during G-02 vibration investigation."
}
```

---

## 8. Operational Events Stream

### `GET /events` & `GET /api/v1/events`
Returns reverse-chronologically sorted operational events for the selected station, ordered by `timestamp DESC, id DESC`.

**Query Parameters**:
- `station_id` (str, optional): Station code (e.g. `STATION-BHARATI`, `STATION-MAITRI`).
- `severity` (str, optional): Filter by `CRITICAL`, `WARNING`, `INFO`, `NOMINAL`.
- `limit` (int, default=50): Page size (max 200).
- `offset` (int, default=0): Pagination offset.

**Response (200 OK)**:
```json
{
  "total": 12,
  "station_id": "STATION-BHARATI",
  "items": [
    {
      "id": "EVT-BHARATI-012",
      "timestamp": "2026-09-07T07:02:03Z",
      "station_id": "STATION-BHARATI",
      "event_type": "COMMUNICATION_STATE",
      "entity_type": "COMMS_LINK",
      "entity_id": "VSAT_UPLINK",
      "severity": "CRITICAL",
      "title": "Satellite carrier link severed (Simulated Outage)",
      "summary": "Communication link transitioned to OFFLINE. Autonomous local operations active; local priority events accumulating.",
      "truth_type": "MEASURED",
      "metadata": { "link_id": "GSAT-7-KU", "previous_state": "ONLINE" }
    }
  ]
}
```

### `POST /events/simulate` & `POST /api/v1/events/simulate`
Advances the deterministic 9-step demonstration state machine to append the next causal transition:
`BASELINE → TELEMETRY_CHANGE → THRESHOLD_BREACH → RISK_CHANGE → DEPENDENCY_EXPOSURE → SPARES_CONSTRAINT → RESUPPLY_ALERT → RECOVERY_SCENARIO → RECONCILIATION`.

**Response (200 OK)**:
```json
{
  "step": 2,
  "total_steps": 9,
  "stage": "THRESHOLD_BREACH",
  "event": {
    "id": "EVT-SIM-002",
    "event_type": "THRESHOLD_BREACH",
    "entity_id": "G-02",
    "severity": "WARNING",
    "title": "Vibration warning threshold exceeded on Generator G-02",
    "summary": "Bearing vibration reached 4.8 mm/s, exceeding warning threshold of 4.0 mm/s. Coolant temp elevated at 94.2°C.",
    "truth_type": "SYNTHETIC_SIMULATION"
  }
}
```

### `POST /events/reset` & `POST /api/v1/events/reset`
Resets the event stream to the canonical seeded baseline timeline for Bharati and Maitri.

---

## 9. Deterministic Explainability Layer

### `GET /explain/{domain}/{entity_id}` & `GET /api/v1/explain/{domain}/{entity_id}`
Derives a complete, deterministic, machine-readable causal explanation from trusted station state across multiple domains (`assets`, `resources`, `comms`, `science`, `incidents`).

**Supported Domains**:
- `assets`: Synthesizes 24h telemetry, warning thresholds, multi-hop BFS blast radius, 6-factor risk breakdown, maintenance blocker status, local spare stock (SK-402), and logistics resupply timing (MV Vasiliy Golovnin).
- `resources`: Synthesizes daily consumption rates, fuel reserve runways, winter targets, stockout risks, and vessel logistics.
- `comms`: Synthesizes carrier uplink telemetry, local priority queue depth (P0..P3), circular buffer integrity, and reconnection synchronization state.
- `science`: Synthesizes instrument science telemetry, payload criticality, RAM circular buffer retention, and data preservation priorities.
- `incidents`: Synthesizes severity, affected subsystems, operational memory matches, and recorded mitigation actions.

**Response (200 OK)**:
```json
{
  "subject": "Diesel Generator G-02 (G-02) — Operational Anomaly & Risk Explanation",
  "domain": "assets",
  "entity_id": "G-02",
  "severity": "WARNING",
  "summary": "Bearing vibration reached 4.8 mm/s exceeding warning threshold (4.0 mm/s) with coolant temp at 94.2°C. Downstream blast radius exposes Habitat Zone 2 Heating (LIFE_SUPPORT) and Station Main Electrical Grid. Recovery is constrained by Rotary Seal Kit SK-402 local stockout (0 units).",
  "why_it_matters": "Diesel Generator G-02 provides critical powerhouse baseload and cogenerated thermal heat to Habitat Zone 2. Degradation threatens winter life-support margins.",
  "evidence": [
    { "factor": "G-02 Bearing Vibration", "metric": "bearing_vibration_mm_s", "value": 4.8, "threshold": 4.0, "status": "WARNING", "detail": "G-02 Bearing Vibration measured at 4.8 mm/s (warning threshold: 4.0 mm/s)." },
    { "factor": "G-02 Coolant Temperature", "metric": "coolant_temp_celsius", "value": 94.2, "threshold": 90.0, "status": "WARNING", "detail": "G-02 Coolant Temperature measured at 94.2 °C (warning threshold: 90.0 °C)." },
    { "factor": "Station Tier Criticality", "metric": "criticality", "value": 18.0, "threshold": 20.0, "status": "CRITICAL", "detail": "Asset is designated CRITICAL equipment in station operations taxonomy." },
    { "factor": "Multi-Hop Dependency Blast Radius", "metric": "blast_radius", "value": 20.0, "threshold": 20.0, "status": "CRITICAL", "detail": "Direct downstream impact on Life Support services: Habitat Zone 2 Heating; Zones exposed: ZONE-HABITAT-2, ZONE-RADAR-LAB" },
    { "factor": "Local Spare Parts Availability", "metric": "spare_stock", "value": 10.0, "threshold": 10.0, "status": "CRITICAL", "detail": "Critical spare 'Generator G-02 Gasket & Fuel Pump Seal Kit' has 0 available units in station stock." },
    { "factor": "Logistics & Resupply Window Exposure", "metric": "resupply_eta_days", "value": 8.0, "threshold": 10.0, "status": "HIGH", "detail": "Next scheduled resupply vessel (MV Vasiliy Golovnin) ETA is in ≈ 10.1 days. Blizzard window blocks emergency flights." }
  ],
  "consequences": [
    { "domain": "LIFE_SUPPORT", "impact": "CRITICAL", "blast_radius_depth": 1, "description": "Downstream service 'Habitat Zone 2 Heating' (HABITAT_HEATING_Z2) degraded via dependency link." },
    { "domain": "CRITICAL", "impact": "HIGH", "blast_radius_depth": 1, "description": "Downstream service 'Station Main Electrical Grid' (STATION_MAIN_GRID) degraded via dependency link." }
  ],
  "recovery_constraints": [
    { "constraint_type": "INVENTORY_STOCKOUT", "entity": "SK-402", "impact_severity": "BLOCKING", "description": "Rotary Seal Kit SK-402 has 0 units in local stock at Central Spares. Preventive overhaul cannot proceed locally. Vessel MV Vasiliy Golovnin ETA in ~11 days." },
    { "constraint_type": "WORK_ORDER_BLOCKED", "entity": "MWO-2026-089", "impact_severity": "HIGH", "description": "Work order WO-2026-088 is in BLOCKED_PARTS status awaiting seal kit arrival." }
  ],
  "recommended_next_steps": [
    { "action_code": "INSPECT_ASSET_G02", "title": "Inspect Asset G-02 Telemetry", "description": "Examine 24h vibration sparklines and bearing temperature trends in Asset Intelligence.", "target_route": "/assets/G-02", "action_type": "INSPECT" },
    { "action_code": "EVALUATE_SCENARIO_G02", "title": "Evaluate Generator G-02 Failure Scenario", "description": "Run 72h what-if failure simulation to assess thermal loop impact and mitigation countermeasures.", "target_route": "/scenarios", "action_type": "SIMULATE" },
    { "action_code": "REVIEW_SPARES_CHAIN", "title": "Review Central Spares & Logistics Recovery Chain", "description": "Audit SK-402 stockout timeline and expedition resupply vessel ETA in Resources.", "target_route": "/resources", "action_type": "REVIEW" }
  ],
  "confidence": 0.96,
  "truth_type": "DERIVED",
  "source_context": "assets, measurements, risk_service.calculate_asset_risk",
  "timestamp": "2026-09-07T12:00:00Z"
}
```

### `POST /explain` & `POST /api/v1/explain`
Allows ad-hoc explanation queries with optional client context.

---

## 10. Model / Schema Lifecycle Metadata (B7)

Provides deterministic operational traceability: which model/schema/configuration version produced a given piece of operational data, and was that version valid at the time?

### Version Semantics

| Field | Meaning | Example |
|---|---|---|
| `version` | Component / model version | `"2.1.0"` |
| `schema_version` | Data schema contract version | `"1.2"` |

These are **always distinct fields**. A model can upgrade its implementation version without changing its schema contract, and vice versa.

### Lifecycle Status

| Status | Meaning |
|---|---|
| `ACTIVE` | Currently valid for operational use and version selection. |
| `DEPRECATED` | Historically valid and traceable, but not selected as the preferred current version. |
| `RETIRED` | No longer operationally valid. Remains available for historical provenance. Never deleted. |

### Interval Semantics

Effective intervals are **half-open**: `[effective_from, effective_to)`.

- At exactly `effective_to`, the **old** version is no longer valid.
- The new version (with the same `effective_from`) becomes valid at that instant.
- `effective_to = null` means the record is open-ended (valid indefinitely into the future).

Two records for the same `component_type` + `component_name` must never have overlapping effective intervals. Adjacent intervals are valid.

---

### `GET /lifecycle`

Lists lifecycle records with optional filters.

**Query Parameters**:
- `component_type` (str, optional): Filter by component type (e.g. `MODEL`, `SCHEMA`, `CONFIG`).
- `component_name` (str, optional): Filter by component name.
- `status` (str, optional): Filter by status: `ACTIVE`, `DEPRECATED`, or `RETIRED`.

**Response (200 OK)**:
```json
{
  "total": 2,
  "items": [
    {
      "id": "LC-001",
      "component_type": "MODEL",
      "component_name": "risk-engine",
      "version": "1.0.0",
      "schema_version": "1.0",
      "status": "DEPRECATED",
      "effective_from": "2026-01-01T00:00:00Z",
      "effective_to": "2026-09-01T00:00:00Z",
      "description": "Initial risk engine — replaced by 2.x series.",
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "LC-002",
      "component_type": "MODEL",
      "component_name": "risk-engine",
      "version": "2.1.0",
      "schema_version": "1.2",
      "status": "ACTIVE",
      "effective_from": "2026-09-01T00:00:00Z",
      "effective_to": null,
      "description": null,
      "created_at": "2026-09-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /lifecycle/resolve`

Resolve the lifecycle version applicable for a component at a given timestamp.

When `timestamp` is omitted, returns the preferred current **ACTIVE** version.
When `timestamp` is provided, returns the version valid at that historical moment — including DEPRECATED and RETIRED records, which remain historically traceable.

**Query Parameters**:
- `component_type` (str, required): Component type to resolve.
- `component_name` (str, required): Component name to resolve.
- `timestamp` (ISO 8601 datetime, optional): Historical timestamp. Omit for current resolution.

**Response (200 OK) — historical resolution**:
```json
{
  "component_type": "MODEL",
  "component_name": "risk-engine",
  "query_timestamp": "2026-05-15T00:00:00Z",
  "resolved_record": {
    "id": "LC-001",
    "component_type": "MODEL",
    "component_name": "risk-engine",
    "version": "1.0.0",
    "schema_version": "1.0",
    "status": "DEPRECATED",
    "effective_from": "2026-01-01T00:00:00Z",
    "effective_to": "2026-09-01T00:00:00Z",
    "description": "Initial risk engine.",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "resolution_note": "Resolved to version '1.0.0' (schema '1.0') [2026-01-01T00:00:00Z, 2026-09-01T00:00:00Z). Status: DEPRECATED.",
  "is_current": false
}
```

**Response (200 OK) — current ACTIVE resolution (no timestamp)**:
```json
{
  "component_type": "MODEL",
  "component_name": "risk-engine",
  "query_timestamp": "2026-09-10T14:30:00Z",
  "resolved_record": {
    "id": "LC-002",
    "component_type": "MODEL",
    "component_name": "risk-engine",
    "version": "2.1.0",
    "schema_version": "1.2",
    "status": "ACTIVE",
    "effective_from": "2026-09-01T00:00:00Z",
    "effective_to": null,
    "description": null,
    "created_at": "2026-09-01T00:00:00Z"
  },
  "resolution_note": "Current ACTIVE version is '2.1.0' (schema '1.2'), effective from 2026-09-01T00:00:00Z.",
  "is_current": true
}
```

**Response (200 OK) — no record found**:
```json
{
  "component_type": "MODEL",
  "component_name": "unknown-engine",
  "query_timestamp": "2026-09-10T14:30:00Z",
  "resolved_record": null,
  "resolution_note": "No lifecycle record for 'MODEL/unknown-engine' is valid at 2026-09-10T14:30:00Z.",
  "is_current": false
}
```

---

### `GET /lifecycle/{id}`

Retrieve a single lifecycle record by its primary key.

**Response (200 OK)**:
```json
{
  "id": "LC-002",
  "component_type": "MODEL",
  "component_name": "risk-engine",
  "version": "2.1.0",
  "schema_version": "1.2",
  "status": "ACTIVE",
  "effective_from": "2026-09-01T00:00:00Z",
  "effective_to": null,
  "description": null,
  "created_at": "2026-09-01T00:00:00Z"
}
```

**Response (404 Not Found)** when ID does not exist.

---

### `POST /lifecycle`

Register a new lifecycle record for a versioned component.

The service validates:
- ID uniqueness across all lifecycle records.
- No overlapping effective intervals for the same `component_type` + `component_name` pair.

Returns **HTTP 409** if a duplicate ID or overlapping interval is detected.

**Request Body**:
```json
{
  "id": "LC-002",
  "component_type": "MODEL",
  "component_name": "risk-engine",
  "version": "2.1.0",
  "schema_version": "1.2",
  "status": "ACTIVE",
  "effective_from": "2026-09-01T00:00:00Z",
  "effective_to": null,
  "description": "Refactored 6-factor risk engine with telemetry provenance integration."
}
```

**Response (201 Created)**:
```json
{
  "id": "LC-002",
  "component_type": "MODEL",
  "component_name": "risk-engine",
  "version": "2.1.0",
  "schema_version": "1.2",
  "status": "ACTIVE",
  "effective_from": "2026-09-01T00:00:00Z",
  "effective_to": null,
  "description": "Refactored 6-factor risk engine with telemetry provenance integration.",
  "created_at": "2026-09-10T14:30:00Z"
}
```
