# PolarOps Operational Capability Map & Backend Contract Audit

**Role Owner:** Tanvi — Decision Support, Resource / Recovery & Continuity Experience Owner  
**Repository Baseline:** `5c692ec` (Canonical Phase 4 Integration Baseline)  
**Branch:** `reimagine/tanvi-decision`  
**Status:** Canonical Backend & Operational Capability Map (Pre-Implementation Lock)  

---

## 1. Scope & Verification Objective

This document provides a factual, non-fabricated audit of all backend services, database models, schemas, and API contracts available at baseline `5c692ec` for the **Decision Support, Resources, Recovery, Scenarios, and Continuity** domain.

No hypothetical or simulated backend features are documented as "existing" unless verified by direct inspection of `backend/app/`.

---

## 2. Capability Matrix Summary

| Domain Area | Canonical Endpoint | HTTP Method | Service Implementation | Capability Status | Truth Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fuel Runway** | `/api/resources/fuel` | `GET` | `resource_service.py` | **AVAILABLE** | `DERIVED` |
| **Warehouse Inventory** | `/api/resources/inventory` | `GET` | `resource_service.py` | **AVAILABLE** | `MEASURED` |
| **Resupply Logistics** | `/api/resources/resupply` | `GET` | `resource_service.py` | **AVAILABLE** | `ESTIMATED` |
| **Energy & Thermal Balance** | `/api/resources/energy` | `GET` | `energy_service.py` | **AVAILABLE** | `DERIVED` |
| **Asset Recovery Exposure** | `/api/resources/recovery/{asset_id}`| `GET` | `resource_service.py` | **AVAILABLE** | `DERIVED` |
| **What-If Scenario Simulation** | `/api/scenarios/simulate` | `POST` | `scenario_service.py` | **AVAILABLE** | `SCENARIO` |
| **Cross-Station Scenario** | `/api/scenarios/cross-station` | `POST` | `scenario_service.py` | **AVAILABLE** | `SCENARIO` |
| **Satellite Link Status** | `/api/resilience/status` | `GET` | `sync_service.py` | **AVAILABLE** | `MEASURED` |
| **Priority Sync Queue** | `/api/resilience/queue` | `GET` | `sync_service.py` | **AVAILABLE** | `DERIVED` |
| **Offline Link Failure Simulation** | `/api/resilience/simulate-offline` | `POST` | `sync_service.py` | **AVAILABLE** | `MEASURED` |
| **Queue Local Offline Event** | `/api/resilience/events` | `POST` | `sync_service.py` | **AVAILABLE** | `MEASURED` |
| **Link Reconnect & Priority Sync** | `/api/resilience/restore` | `POST` | `sync_service.py` | **AVAILABLE** | `DERIVED` |
| **Retry Failed Queue Item** | `/api/resilience/retry/{queue_id}` | `POST` | `sync_service.py` | **AVAILABLE** | `DERIVED` |
| **Reset Resilience Simulation** | `/api/resilience/reset` | `POST` | `sync_service.py` | **AVAILABLE** | `MEASURED` |
| **Incident List & Detail** | `/api/incidents` & `/{id}` | `GET` | `incident_service.py` | **AVAILABLE** | `DERIVED` |
| **Open Incident** | `/api/incidents` | `POST` | `incident_service.py` | **AVAILABLE** | `MEASURED` |
| **Log Incident Action** | `/api/incidents/{id}/actions` | `POST` | `incident_service.py` | **AVAILABLE** | `MEASURED` |
| **Update Incident Status** | `/api/incidents/{id}/status` | `PATCH` | `incident_service.py` | **AVAILABLE** | `MEASURED` |
| **Operational Memory Search** | `/api/memory` | `GET` | `incident_service.py` | **AVAILABLE** | `MEASURED` |
| **Record Operational Memory** | `/api/memory` | `POST` | `incident_service.py` | **AVAILABLE** | `MEASURED` |

---

## 3. Deep Service & Contract Specifications

### 3.1 Fuel Runway & Diesel Reserves
- **Route:** `GET /api/resources/fuel`
- **Query Params:** `station_id: str = "STATION-BHARATI"`
- **Response Schema:** `FuelStatusResponse` (`app.schemas.resource`)
- **Key Fields:**
  - `current_stock_liters: float` (e.g. 142,500.0 L)
  - `max_capacity_liters: float` (e.g. 200,000.0 L)
  - `burn_rate_liters_per_hour: float` (e.g. 65.5 L/h or 84.5 L/h)
  - `projected_runway_days: float` (Formula: `current_stock / (burn_rate * 24.0)`)
  - `winter_target_days: float = 90.0`
  - `resupply_gap_days: float` (`runway_days - winter_target_days`)
  - `provenance: ProvenanceSchema` (`source: "resource:fuel_calc"`, `truth_type: DERIVED`)
- **Operational Reality:** Diesel Light Fuel Oil (LFO) is the single energy lifeline for both electricity generation and hydronic habitat heating. Running out of diesel in winter means station freeze-out within 24–48 hours.

### 3.2 Warehouse Inventory & Critical Spares
- **Route:** `GET /api/resources/inventory`
- **Query Params:** `station_id: str = "STATION-BHARATI"`
- **Response Schema:** `list[InventorySpareItem]` (`app.schemas.resource`)
- **Key Fields:**
  - `id: str`, `spare_part_id: str`, `part_number: str` (e.g. "SK-402", "INJ-NOZ-01", "OIL-FLT-H5")
  - `name: str`, `description: str`, `criticality: str`
  - `quantity_available: int`, `quantity_reserved: int`, `reorder_threshold: int`
  - `location: str` (e.g. "WH-SHELF-B3", "POWERHOUSE-LOCKER-A")
  - `status: str` ("AVAILABLE", "RESERVED", "CRITICAL_SHORTAGE")
  - `work_order_ids: list[str]`
- **Operational Reality:** When `quantity_available <= 0`, maintenance on associated equipment is completely blocked until the next resupply ship or emergency air-drop.

### 3.3 Resupply Logistics & Expedition Voyage
- **Route:** `GET /api/resources/resupply`
- **Query Params:** `station_id: str = "STATION-BHARATI"`
- **Response Schema:** `list[ResupplyOpportunityItem]` (`app.schemas.resource`)
- **Key Fields:**
  - `id: str`, `vessel_name: str` (e.g. "MV Vasiliy Golovnin")
  - `expected_date: datetime`, `eta_days: float` (calculated relative to simulated window; baseline ~11.0 days)
  - `spare_part_id: str`, `spare_part_number: str`, `spare_part_name: str`
  - `quantity: int`, `delay_days: int`, `status: str` ("SCHEDULED", "IN_TRANSIT", "DELAYED", "ARRIVED")
- **Operational Reality:** Resupply vessels can only navigate Antarctic pack ice during the polar summer (December – March). A delay in an inbound ship can trap the wintering team with zero parts for 9 months.

### 3.4 Deterministic Energy & Thermal Model
- **Route:** `GET /api/resources/energy`
- **Query Params:** `station_id: str`, `ambient_temp_override: Optional[float] = None`
- **Response Schema:** `EnergyModelResponse` (`app.schemas.resource`)
- **Deterministic Formulas Implemented in `energy_service.py`:**
  1. *Thermal Demand:* $Q_{\text{thermal}} = 5.2 \times \max(0, 20.0 - T_{\text{ambient}})\text{ kW}$
  2. *Electrical Load:* $P_{\text{electrical}} = 180.0 + 2.5 \times \max(0, -20.0 - T_{\text{ambient}})\text{ kW}$
  3. *Generator Dispatch Capacity:* $\sum \text{Rated Capacity of online generators (300 kW each)}$
  4. *Fuel Burn Rate:* $\text{Burn} = 25.0 + 0.265 \times P_{\text{dispatched}}\text{ L/h}$
  5. *Runway:* $\text{Runway} = \text{Remaining Fuel} / (\text{Burn Rate} \times 24)\text{ days}$
- **Truth Type:** Strictly `DERIVED` with explicit assumptions array.

### 3.5 Asset Recovery Exposure
- **Route:** `GET /api/resources/recovery/{asset_id}`
- **Response Schema:** `AssetRecoveryExposureResponse` (`app.schemas.resource`)
- **Exposure Evaluation Rules:**
  - `CRITICAL` asset + `BLOCKED_PARTS` work order + warehouse stockout ($=0$) $\longrightarrow$ `exposure_level: "HIGH"`
  - Lower criticality asset + `BLOCKED_PARTS` + stockout $\longrightarrow$ `exposure_level: "MEDIUM"`
  - Active work order with parts in stock $\longrightarrow$ `exposure_level: "LOW"`
  - Nominal asset with no maintenance blockers $\longrightarrow$ `exposure_level: "LOW"`
- **Reasoning:** Transparent explainability text articulating the full chain (asset criticality → work order → spare part → warehouse stock → vessel ETA).

### 3.6 What-If Scenario Simulation Engine
- **Route:** `POST /api/scenarios/simulate`
- **Request Schema:** `ScenarioSimulateRequest` (`app.schemas.scenario`)
  - `station_id: str = "STATION-BHARATI"`
  - `scenario_type: str = "GENERATOR_FAILURE"` (MVP verified type)
  - `target_asset_id: str = "G-02"`
  - `duration_hours: float = 72.0` (range 0–720h)
  - `ambient_temp_celsius: Optional[float] = None` (range -70°C to +15°C)
- **Response Schema:** `ScenarioSimulateResponse` (`app.schemas.scenario`)
- **Architectural Guarantees:**
  - **In-Memory & Stateless:** Zero database mutation.
  - **Deltas Provided:** Capacity, Reserve Margin (kW and %), Fleet count, Fuel Burn, Runway, Composite Risk.
  - **Downstream Cascades:** Traverses BFS dependency graph (`traverse_asset_dependencies`) to identify affected life-support services.
  - **Coupled Constraints:** Automatically queries `get_asset_recovery_exposure()` to inject inventory blockers.
  - **Decision Packages:** Generates ranked countermeasure options:
    - `DISPATCH_G01_PRIORITY` (Generation Dispatch)
    - `AUX_BOILER_B01_TRANSFER` (Thermal Management)
    - `SHED_SCIENCE_RADAR_LOAD` (Load Shedding)
    - `ESCALATE_AIRLIFT_SPARE` (Logistics Escalation)
  - **Audit Logging:** Emits a single `SCENARIO_EVALUATED` event into the operational stream for auditability.

### 3.7 Cross-Station Coordination Simulation
- **Route:** `POST /api/scenarios/cross-station`
- **Request Schema:** `CrossStationScenarioRequest` (`app.schemas.scenario`)
  - `disrupted_station_id: str = "STATION-BHARATI"`
  - `support_station_id: str = "STATION-MAITRI"`
  - `target_asset_id: str = "G-02"`
- **Response Schema:** `CrossStationScenarioResponse` (`app.schemas.scenario`)
- **Capabilities:**
  - Evaluates disruption on Station A while modeling headroom and spare stock on Station B.
  - Generates cross-station decision options: `REQ_INTER_STATION_SPARE_ASSESSMENT`, `SYNCHRONIZE_CROSS_STATION_OPERATIONAL_MEMORY`, `COORDINATE_EDGE_TELEMETRY_WATCH`.
  - Enforces physical reality: 3,000 km distance constraint, polar blizzard flight boundaries (<30 kt wind limit).

### 3.8 Resilience, Priority Sync Queue & Cryptographic Integrity
- **Routes:**
  - `GET /api/resilience/status`: Link status, latency, bandwidth, queue count.
  - `GET /api/resilience/queue`: Priority queue sorted deterministically by `priority ASC, created_at ASC, id ASC`.
  - `POST /api/resilience/simulate-offline`: Triggers satellite link severance (`ONLINE` → `OFFLINE`).
  - `POST /api/resilience/events`: Buffers new local event with canonical SHA-256 hash.
  - `POST /api/resilience/restore`: Executes 4-step state machine (`OFFLINE` → `RESTORING` → `SYNCING` → `ONLINE`), verifying SHA-256 checksums.
  - `POST /api/resilience/retry/{queue_id}`: Recomputes hash and retries failed items.
  - `POST /api/resilience/reset`: Resets simulation state to clean deterministic baseline.
- **Canonical Checksum Formula (`sync_service.py`):**
  $$\text{SHA-256}\Big(\text{json.dumps}(payload, \text{sort\_keys}=\text{True}, \text{separators}=(',', ':'))\Big)$$

### 3.9 Incident Workspace & Response Actions
- **Routes:**
  - `GET /api/incidents`: List station incidents.
  - `GET /api/incidents/{incident_id}`: Detailed Common Operating Picture (blast radius, affected assets, services, modeled risk, available response options, action log).
  - `POST /api/incidents`: Open new operational incident.
  - `POST /api/incidents/{id}/actions`: Record physical or operational actions executed by engineers.
  - `PATCH /api/incidents/{id}/status`: Lifecycle transitions (`ACTIVE` → `CONTAINED` → `RESOLVED`).

### 3.10 Operational Memory & Institutional Lessons
- **Routes:**
  - `GET /api/memory`: Full-text keyword search across stored lessons.
  - `POST /api/memory`: Record structured lessons (`decision`, `action_taken`, `outcome`, `lesson`) from post-mortems.

---

## 4. Data Honesty & Provenance Guarantees

Every payload in Tanvi's domain adheres strictly to the repository's data honesty standard:

1. **Truth Type Categorization:**
   - `MEASURED`: Physical sensor readings, actual warehouse stock counts, recorded incident logs.
   - `DERIVED`: Deterministic physics-based calculations (thermal demand, electrical load, fuel runway, composite risk).
   - `SCENARIO`: Purely hypothetical counterfactual projections. Labeled explicitly with `[SCENARIO]`.
   - `ESTIMATED`: Resupply vessel ETA based on voyage speed and sea-ice reports.
2. **Provenance Metadata Schema:**
   Every core response includes:
   ```json
   {
     "source": "resource:fuel_calc",
     "timestamp": "2026-09-24T17:15:00Z",
     "freshness_seconds": 0.5,
     "quality": "GOOD",
     "truth_type": "DERIVED",
     "confidence": 0.95
   }
   ```
3. **Synthetic Disclaimers:**
   All decision options and scenario outputs include explicit system disclaimers:
   `"[OUR DESIGN] Prototype decision-support option. Advisory only; not an approved emergency procedure."`

---

## 5. Domain Boundaries & Teammate Interface Matrix

### Tanvi's Owned Domain:
- **Decision Support:** Scenario simulation, countermeasure ranking, human approval workflows.
- **Resource Runway:** Fuel stock, hourly burn rates, winter targets, resupply gap calculations.
- **Recovery Logistics:** Asset recovery exposure, spare part stockouts, vessel voyage tracking.
- **Energy Modeling:** Thermal balance, electrical load dispatch, reserve margin calculations.
- **Resilience & Continuity:** Communication link state machine, P0–P3 priority offline queue, canonical SHA-256 integrity verification, incident actions, operational memory.

### Interface with Kshitij (Product Lead / Command Center / Shared Design System):
- **Shared Tokens & Theme:** Polar Dark theme tokens, high-density layouts, typography, and lucide icon sets.
- **Command Center Integration:** Fuel runway summary card, active resilience link badge, critical incident alert badges.
- **Station Switcher:** Station context (`STATION-BHARATI` vs `STATION-MAITRI`) propagated to all resource and scenario endpoints.

### Interface with Dhruv (Digital Twin / Subsystems / Telemetry / Dependency Graph):
- **Asset Telemetry:** Feeding live generator vibration (4.8 mm/s) and exhaust temperatures into risk drivers.
- **Dependency Graph:** Consuming Dhruv's BFS dependency traversal (`dependency_service.py`) inside `simulate_operational_scenario()` to identify downstream life-support services.
- **Subsystem State:** Reflecting power and thermal loop status in the scenario blast-radius view.

---

## 6. What is Explicitly Out of Scope / Non-Existent

To prevent fabrication, the following are explicitly identified as **OUT OF SCOPE** and not supported by the backend:
1. **Autonomous Actuation:** The backend does NOT physically start or stop generators, switch breakers, or valve fuel lines. PolarOps is strictly an advisory decision-support system.
2. **Black-Box AI / LLM Reasoning:** No OpenAI, Claude, or probabilistic neural models are used in the core risk or scenario engines. All math is deterministic linear physics and BFS graph traversal.
3. **Physical Cargo Transfer Simulation:** Cross-station coordination evaluates differences and advisory options; it does not simulate physical trucking or inter-station piping across 3,000 km of ice.
4. **Third-Party Heavy Infrastructure:** No Kafka, Redis, Neo4j, or external message brokers. Local SQLite / PostgreSQL with deterministic SQLAlchemy queries is the verified architecture.
