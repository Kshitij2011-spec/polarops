# Operational User Journeys

This document defines the four core user journeys that demonstrate the operational digital twin capabilities during station management.

---

## Journey A — Hero Generator Risk & Decision Support (Primary Journey)

- **Goal**: Detect generator anomaly, understand cascading thermal dependencies, verify missing spare parts, simulate shutdown consequences, and record an approved countermeasure.
- **Actor**: Station Commander / Chief Engineer.
- **Trigger**: Anomaly alarm on Diesel Generator `G-02` (vibration 4.8 mm/s, coolant 94.2°C).
- **Steps**:
  1. Operator opens **Command Center** dashboard; notices red/warning badge on Power Subsystem and `G-02`.
  2. Clicks `G-02` card to open **Asset Intelligence Detail** view.
  3. Views live telemetry vs threshold limits (Vibration 4.8 mm/s vs 4.0 limit).
  4. Clicks **"Why is this High Risk?"** to inspect explainable risk factor breakdown.
  5. Navigates to **Dependency Graph View**; sees `G-02` feeds Thermal Loop B which services Habitat Zone 2.
  6. Opens **Maintenance & Inventory Tab**; checks seal kit `SK-402`. System shows `Quantity Available: 0`.
  7. Views **Resupply Exposure**; next vessel *MV Vasiliy Golovnin* is 45 days away.
  8. Clicks **"Simulate G-02 Shutdown"** in Scenario Engine.
  9. Observes projected outcome: Zone 2 habitat drops to freezing in 14.5 hours; fuel runway extends by +8.5 days.
  10. System presents **Recommended Action**: "Shift 30% thermal load to Auxiliary Boiler B-01".
  11. Operator clicks **"Approve Countermeasure"**.
  12. System logs action into **Operational Memory** and clears critical alert status.
- **System Behavior**:
  - Telemetry service updates `G-02` risk score to 74 (`truth_type: MEASURED`).
  - Dependency BFS engine traverses `G-02` → `THERMAL_LOOP_B` → `HABITAT_HEATING_Z2` → `ZONE-HABITAT-2`.
  - Scenario Engine computes thermal decay curve in memory.
  - Decision logger creates `OperationalAction` and `OperationalMemory` records.
- **User-Visible Result**: Clear progression from alert → cause → dependency → risk → inventory check → simulation → human decision → audit record.
- **Acceptance Criteria**: Entire journey completes in <2 minutes without browser reload or UI error.

---

## Journey B — Communication Failure & Priority Sync (Resilience Journey)

- **Goal**: Maintain local operational continuity during satellite blackout and cleanly reconcile queued events upon link restoration.
- **Actor**: Station Operations Officer / HQ Inspector.
- **Trigger**: Satellite comms link drops (`link_state: OFFLINE`).
- **Steps**:
  1. Comms indicator toggles to **OFFLINE (Local Mode)**.
  2. Operator creates a maintenance log and updates inventory allocation locally.
  3. UI displays **Local Sync Queue Counter** incrementing (`P1 High - 2 items queued`).
  4. Comms link is restored (`link_state: ONLINE`).
  5. Sync simulator initiates priority queue flush (`P0 Critical` → `P1 High` → `P2 Important`).
  6. Backend verifies SHA-256 payload checksums and returns ACK reconciliation.
  7. UI updates status banner to **SYNCHRONIZED**.
- **System Behavior**:
  - LocalStorage / IndexedDB buffers outgoing API mutations.
  - Sync state machine transitions `ONLINE` → `OFFLINE` → `QUEUED` → `TRANSFERRING` → `RECONCILED`.
  - SHA-256 checksum mismatch triggers automated retry.
- **User-Visible Result**: Seamless local operation during blackout; visual progress bar during queue flush and reconciliation.
- **Acceptance Criteria**: Zero lost user actions during simulated link failure; SHA-256 checksum verification passes cleanly.

---

## Journey C — Science Payload Continuity & Power Rationing

- **Goal**: Ration electrical power during energy degradation while preserving critical scientific observations.
- **Actor**: Scientific Expedition Lead.
- **Trigger**: Station energy degradation warning (single generator operation).
- **Steps**:
  1. Science Lead navigates to **Science Workspace**.
  2. Views active experiment payloads: Auroral Radar (35 kW), Seismometer (2 kW), Micro-meteorology (5 kW).
  3. System prompts power rationing recommendation: "Shed Auroral Radar to preserve habitat thermal stability".
  4. Lead toggles Auroral Radar to **STANDBY / DEFERRED**.
  5. System reroutes 35 kW capacity to Main Habitat Power Bank.
  6. Data collected prior to standby is safely queued in local observation buffer.
- **System Behavior**:
  - Updates payload operational state and updates energy allocation.
  - Buffers radar data frames locally without dropping past telemetry logs.
- **User-Visible Result**: Clear trade-off visualization between life support power vs scientific experiment priority.
- **Acceptance Criteria**: Toggling experiment power immediately updates available fuel runway and station power margin.

---

## Journey D — Incident Triage & Operational Memory

- **Goal**: Log a station incident, identify affected assets/services, record response actions, and build institutional memory.
- **Actor**: Station Commander.
- **Trigger**: Unplanned water treatment pipe freeze.
- **Steps**:
  1. Commander clicks **"Log Incident"** on Command Center.
  2. Enters incident details: "Water Line Freeze in Building B".
  3. System auto-selects affected asset (`WTP-01`) and flags downstream service (`POTABLE_WATER_SUPPLY`).
  4. Commander assigns emergency work order to Chief Engineer.
  5. Engineer marks action complete: "Heat trace cable re-energized; flow restored".
  6. Commander closes incident; system generates **Operational Memory Summary** for future station crews.
- **System Behavior**:
  - Incident record created with severity `MAJOR`.
  - Relates incident to `Asset` and `Service` models.
  - Appends lessons learned entry to `OperationalMemory` store.
- **User-Visible Result**: Complete incident lifecycle visible on timeline widget.
- **Acceptance Criteria**: Closed incidents remain searchable in Operational Memory for future scenario planning.
