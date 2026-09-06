# Product Requirement Document (PRD)

## 1. Product Overview
**Project Name**: SIH 2026 — Antarctic Operational Digital Twin (PolarOps)  
**Target Problem**: SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations (Maitri & Bharati).  
**Core Purpose**: An operational decision-support Digital Twin connecting station conditions, physical dependencies, energy/fuel resources, risk propagation, and incident/scenario management to ensure station and scientific operational continuity.

## 2. Problem Statement
Indian Antarctic Research Stations operate under extreme isolated conditions (sub-zero temperatures, catabatic winds, satellite bandwidth constraints, and 6+ months of total seasonal isolation). Currently, station telemetry, maintenance logs, inventory tracking, and scientific payloads are fragmented. When a subsystem fails (e.g., generator coolant leak), operators lack an integrated model to quickly understand cascading downstream impacts on heating, life support, and active scientific experiments.

## 3. Target Users
1. **Station Commander / Operations Officer**: Needs real-time situation awareness, unified risk overview, and scenario planning.
2. **Station Maintenance / Energy Engineer**: Needs real-time asset health, dependency tracing, spare parts availability, and resupply risk exposure.
3. **Scientific Expedition Lead**: Needs visibility on experiment power allocation, data transmission queues, and environmental environmental safety.
4. **HQ Monitoring Desk (NCPOR / Ministry)**: Needs high-level telemetry feeds, resupply planning intelligence, and sync status updates during comms windows.

## 4. Product Thesis
> *"When something changes at the station, the Digital Twin should tell the operator what changed, what it affects, what may happen next, and what can be done about it."*

The core operational loop is:
**CHANGE → CONTEXT → DEPENDENCY → RISK → CONSEQUENCE → SCENARIO → ACTION → OUTCOME**

## 5. Three Solution Pillars
- **Pillar 1 — UNIFY THE STATION**: One coherent operational view of station state, assets, subsystems, energy, and life support.
- **Pillar 2 — UNDERSTAND & PREDICT IMPACT**: Connect conditions to dependencies, risk propagation, resource consumption, and future consequences.
- **Pillar 3 — OPERATE THROUGH DISRUPTION**: Maintain operational and scientific continuity during communication disruption, extreme weather, and equipment incidents.

## 6. Primary Operational Journey (Hero Scenario)
1. **Command Center**: Operator views station overview; alert triggers on Generator `G-02` (vibration anomaly / coolant temperature spike).
2. **Asset Deep Dive**: Drill down into `G-02` asset detail view showing live telemetry vs threshold baselines.
3. **Dependency Tracing**: System highlights that `G-02` failure directly affects Main Thermal Loop B and Subsystem HVAC-3, placing Life Support Zone 2 at high risk.
4. **Maintenance & Inventory Check**: System queries work orders and spare parts; identifies missing seal kit (`SK-402`) in local inventory.
5. **Resupply Exposure**: Highlights that the next resupply ship (MV Vasiliy Golovnin) is 45 days away.
6. **Scenario Simulation**: Operator simulates "Complete G-02 Shutdown" to evaluate thermal decay and battery backup runway.
7. **Recommended Action & Decision Recording**: System recommends shifting 30% thermal load to Auxiliary Boiler B-01 and shedding non-critical science payload power. Operator approves action; recorded into Operational Memory.

## 7. Secondary Operational Journeys
- **Offline / Sync Queue Journey**: Communication link drops; local telemetry and maintenance decisions queue up locally. Link restores; priority queue uploads with checksum validation and conflict resolution.
- **Science Payload Continuity**: Cold snap warning causes power rationing; system presents trade-offs between continuous climate sensors vs satellite radar payload.

## 8. Data Honesty Rules
All telemetry and operational data MUST carry explicit metadata:
- `source`: Sensor ID / Simulation Engine ID
- `timestamp`: UTC ISO timestamp
- `freshness`: Age in seconds / status (LIVE, STALE, CACHED)
- `quality`: GOOD, DEGRADED, UNCERTAIN, INVALID
- `truth_type`: `MEASURED` (raw sensor), `DERIVED` (calculated metric), `FORECAST` (projected model), `SCENARIO` (what-if simulation)
- `confidence`: Percentage (0-100%)

*Note: Synthetic data must never be claimed to be real NCPOR live feeds.*

## 9. Human-in-the-Loop Principle
The Digital Twin provides explainable recommendations and impact simulations. It NEVER executes physical station controls autonomously. All actions require explicit human operator approval.

## 10. Security & Operational Boundaries
- Role-based access control (Commander view vs Technician edit vs HQ view).
- Offline-first local state persistence with tamper-evident audit logging.
- Edge-to-Cloud sync boundary simulating low-bandwidth satellite links.

## 11. MVP vs Production Distinction
- **MVP (Current)**: High-credibility simulated telemetry, rule-based graph risk engine, realistic interactive UI, local priority queue sync simulator.
- **Production (Future)**: Modbus/OPC-UA IoT station gateway integration, Iridium satellite bandwidth adaptation, hardware-in-the-loop sensor ingestion.

## 12. Explicit Non-Goals
- NOT a pure 3D CAD/BIM viewer without operational intelligence.
- NOT an conversational AI chatbot overlay.
- NOT an autonomous station control system.
- NOT integrated into proprietary internal NCPOR production networks.
