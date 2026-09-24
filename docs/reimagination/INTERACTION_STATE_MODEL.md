# PolarOps Interaction State & Context Model

**Author:** Kshitij Parkhe (Product Owner & System Integration Lead)  
**Contributors:** Dhruv (Twin Lead), Tanvi (Decision Lead)  
**Date:** September 2026  
**Repository Branch:** `reimagine/product-blueprint`  
**Baseline:** `5c692ec` (`baseline/phase4-5c692ec`)  
**Target Repository Artifact:** `docs/reimagination/INTERACTION_STATE_MODEL.md`

---

## 1. Universal Context Hierarchy

In mission-critical operations, **context fragmentation is fatal**. If an engineer identifies a failing generator in the topology view, navigates to the resource view to check spare parts, and the application forgets which generator was selected, the engineer is forced to manually re-filter and re-orient.

PolarOps implements a **Strict Three-Tier Context Architecture**:

```mermaid
graph TD
    subgraph TIER1["1. URL-Persisted Context (Bookmarkable & Shareable)"]
        U1["station: ?station=STATION-BHARATI"]
        U2["asset: ?asset=G-02"]
        U3["incident: ?incident=INC-2026-003"]
        U4["workspace: /command-center, /digital-twin, /resources, /scenarios"]
        U5["drawer: ?drawer=explain&domain=ASSET&id=G-02"]
    end

    subgraph TIER2["2. Global Client State (Application Lifetime)"]
        G1["comms_link_status: ONLINE | DEGRADED | OFFLINE"]
        G2["offline_sync_queue: P0-P3 items with SHA-256 hashes"]
        G3["user_role: COMMANDER | CHIEF_ENG | SCIENCE | LOGISTICS"]
        G4["topology_cache: pre-fetched graph nodes & edges"]
    end

    subgraph TIER3["3. Transient Component State (View Lifetime)"]
        C1["canvas_zoom_pan: { x: 420, y: 180, zoom: 1.2 }"]
        C2["sparkline_hover_time: 2026-09-24T14:22:10Z"]
        C3["uncommitted_scenario_sliders: { temp: -42, load: 380 }"]
        C4["expanded_table_rows: Set<string>"]
    end

    TIER1 --> TIER2 --> TIER3
```

---

## 2. URL-Persisted Context Rules

1. **Station Context (`?station=...`):**
   - Universal query parameter present across all routes.
   - Values: `STATION-BHARATI` (default) | `STATION-MAITRI`.
   - Changing the station in the Global Header dropdown updates the query param and reactively invalidates all TanStack Query caches, re-hydrating the entire application with the new station's data.
2. **Entity Context (`?asset=...`):**
   - Persists the currently selected asset code (e.g. `G-02`).
   - Cross-workspace persistence: An operator selecting `G-02` in `/digital-twin`, then clicking `/resources`, will find the resource view immediately pre-focused on G-02's spare parts and recovery exposure.
3. **Incident Context (`?incident=...`):**
   - Persists the currently active incident ID (e.g. `INC-2026-003`).
   - Direct deep-links allow remote NCPOR engineers in Goa to open the exact Common Operating Picture and Action Ledger being viewed by the station commander.
4. **Drawer Context (`?drawer=...`):**
   - Persists slide-out drawer states:
     - `?drawer=explain&domain=ASSET&id=G-02` (5-Stage Explanation Drawer).
     - `?drawer=resilience` (Edge Resilience Cockpit).
   - Dismissing the drawer via `Esc` or close button removes the drawer query parameter without reloading the page.

---

## 3. Operational State Machines

### 3.1 Incident Lifecycle State Machine (`incident_service.py`)

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Sensor Threshold Breach / Manual Declaration
    ACTIVE --> CONTAINED: Mitigation Action Executed (e.g. G-01 Synced, G-02 Throttled)
    CONTAINED --> ACTIVE: Secondary Failure / Cascade Breach
    CONTAINED --> RESOLVED: Equipment Repaired / Spare Installed
    RESOLVED --> [*]: Post-Mortem Debrief Logged to Operational Memory
```

- **`ACTIVE`:** Emergency status; high-contrast crimson accents; auditory warning chime; primary Common Operating Picture expanded; actions ledger unlocked.
- **`CONTAINED`:** Hazard neutralized but redundancy compromised; amber warning accents; system monitors for secondary thermal or electrical drift.
- **`RESOLVED`:** Normal operating envelope restored; green accents; system prompts operator to launch the **Post-Mortem Authoring Modal** to log lessons learned to `/memory`.

---

### 3.2 7-Stage Resilience & Edge Continuity State Machine (`sync_service.py`)

```mermaid
stateDiagram-v2
    NORMAL: 1. NORMAL (Online, 580ms latency)
    DEGRADED: 2. DEGRADED (Latency >2000ms, Packet Loss)
    LOCAL: 3. LOCAL (Carrier Lost, Edge Autonomy Active)
    QUEUED: 4. QUEUED (P0-P3 Offline Queue Accumulating)
    RECONNECTING: 5. RECONNECTING (Satellite Handshake Initializing)
    SYNCHRONIZING: 6. SYNCHRONIZING (P0-P3 Transferred, SHA-256 Verified)
    RECONCILED: 7. RECONCILED (Audit Logged, Normal Stream Restored)

    [*] --> NORMAL
    NORMAL --> DEGRADED: Atmospheric Jitter / Solar Flare
    DEGRADED --> LOCAL: Satellite Link Severance
    LOCAL --> QUEUED: Operator Dispatches Local Action / Work Order
    QUEUED --> RECONNECTING: Carrier Signal Locked
    RECONNECTING --> SYNCHRONIZING: Uplink Handshake Acknowledged
    SYNCHRONIZING --> RECONCILED: All Checksums Verified
    RECONCILED --> NORMAL: Return to Baseline
```

#### Deterministic Priority Dispatch Rules (P0 – P3):
1. **P0 (Critical Life Support):** Generator emergency shutdowns, incident declarations, life-support breaker trips. Transferred immediately in Packet 1 upon link restoration.
2. **P1 (Operational Actions):** Work order status changes, warehouse inventory reservations, shift handover logs.
3. **P2 (Science Continuity):** Buffered upper-atmosphere radar and seismograph observation batches.
4. **P3 (Diagnostic Telemetry):** Routine 50-point sensor batches and historical battery voltage time series.

---

### 3.3 Counterfactual Scenario Simulation State Machine (`scenario_service.py`)

```mermaid
stateDiagram-v2
    IDLE: 1. IDLE (Active Station Baseline Displayed)
    CONFIGURING: 2. CONFIGURING (Target Asset, Duration, Temp Sliders Adjusted)
    SIMULATING: 3. SIMULATING (Stateless Backend BFS & Physics Calculation)
    RESULTS_READY: 4. RESULTS READY (Delta Matrix, Headroom Shift & Vetted Options Rendered)
    DECISION_PENDING: 5. DECISION PENDING (Human Approval Checklist Guard Active)
    AUTHORIZED: 6. AUTHORIZED (Command Sent to Incident Ledger / Work Order)
    RECORDED: 7. RECORDED (Simulation Parameters & Rationale Saved to Memory)

    [*] --> IDLE
    IDLE --> CONFIGURING: Operator Seeds Scenario (or Clicks "Simulate" on Alarm)
    CONFIGURING --> SIMULATING: Clicks "RUN WHAT-IF SIMULATION"
    SIMULATING --> RESULTS_READY: Response Received (Zero Database Mutation)
    RESULTS_READY --> DECISION_PENDING: Operator Selects Countermeasure Option
    DECISION_PENDING --> AUTHORIZED: Two-Step Human Verification Confirmed
    AUTHORIZED --> RECORDED: Appended to Active Incident & Operational Memory
    RECORDED --> IDLE: Sandbox Reset
```

---

### 3.4 Dual-Flow Living Topology State Machine (`dependency_service.py`)

```mermaid
stateDiagram-v2
    RESTING: RESTING CANVAS (All Subsystems Visible, Normal Flow Animation)
    NODE_SELECTED: NODE FOCUSED (G-02 Clicked, Inspector Opens on Right)
    UPSTREAM_TRACE: UPSTREAM INFLOW (Fuel & Oil Supply Lines Highlighted in Cyan)
    DOWNSTREAM_BLAST: DOWNSTREAM BLAST RADIUS (HVAC, Life Support & Habitats Pulsing Red)
    TREEGRID_VIEW: TABULAR TREEGRID (Accessible Matrix for Keyboard / Screen Readers)

    [*] --> RESTING
    RESTING --> NODE_SELECTED: Node Clicked / Key Press
    NODE_SELECTED --> UPSTREAM_TRACE: Toggle "Inspect Suppliers"
    NODE_SELECTED --> DOWNSTREAM_BLAST: Toggle "Inspect Blast Radius"
    RESTING --> TREEGRID_VIEW: Click "Tabular View" (or Alt+T)
    TREEGRID_VIEW --> RESTING: Toggle Graph View
    NODE_SELECTED --> RESTING: Click Background / Esc
```

---

## 4. Error Recovery & Network Resilience Model

In Antarctica, HTTP request failures are expected daily occurrences, not edge-case bugs:

### 4.1 Zero Modal Crashes
- The application will **never** display an intrusive error dialog stating "Network Error: Failed to fetch".
- If an endpoint times out, the component gracefully falls back to the **Last Verified Cache** from local storage, decorating the card with an amber `STALE (Cached 4m ago)` badge.

### 4.2 Optimistic Updates with Rollback & SHA-256 Queueing
- When an operator logs an incident action while offline:
  1. The action immediately appends to the UI Action Ledger with a purple `LOCAL QUEUED` pill.
  2. The action is written to the browser's IndexedDB / local storage queue with a canonical SHA-256 hash.
  3. When satellite comms reconnect, the background sync worker flushes the queue via `POST /api/resilience/restore`.
  4. If the server verifies the hash, the pill transitions to `RECONCILED` (green).
  5. If the server rejects the hash (rare collision), the item is flagged `FAILED_RETRY` with a dedicated 1-click retry button.

---
