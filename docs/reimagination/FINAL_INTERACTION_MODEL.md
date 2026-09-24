# PolarOps Final Interaction State & Lifecycle Model

**Author:** Kshitij Parkhe (Product Owner & System Integration Lead)  
**Contributors:** Dhruv (Twin Lead), Tanvi (Decision Lead)  
**Date:** September 2026  
**Status:** AUTHORITATIVE & FINAL  
**Repository Branch:** `reimagine/product-blueprint`  
**Baseline:** `5c692ec` (`baseline/phase4-5c692ec`)  
**Target Repository Artifact:** `docs/reimagination/FINAL_INTERACTION_MODEL.md`

---

## 1. Executive Summary

In mission-critical Antarctic systems, **interaction state must be deterministic, non-destructive, and resilient to packet loss**. An operator executing a load-shedding command or simulating a generator failure must know with certainty:
1. Whether an action has physically mutated station equipment or merely updated an in-memory sandbox.
2. Whether an action has been committed locally or synchronized across the satellite uplink.
3. How to recover immediately from network interruptions without losing uncommitted investigation state.

---

## 2. Core Operational State Machines

### 2.1 Incident Lifecycle State Machine (`incident_service.py`)

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Sensor Threshold Breach / Transducer Surge
    ACTIVE --> CONTAINED: Mitigation Executed (e.g. Standby Generator Synced, Breaker Bypassed)
    CONTAINED --> ACTIVE: Secondary Thermal/Electrical Cascade Breach
    CONTAINED --> RESOLVED: Replacement Spare Installed / Physical Repair Verified
    RESOLVED --> [*]: Post-Mortem Debrief Appended to /memory
```

- **`ACTIVE`:** Emergency status; high-contrast crimson accents; auditory warning chime; primary Common Operating Picture expanded; actions ledger unlocked.
- **`CONTAINED`:** Hazard neutralized but redundancy compromised ($N-0$ state); amber warning accents; system monitors for secondary thermal or electrical drift.
- **`RESOLVED`:** Normal operating envelope restored; green accents; system prompts operator to launch the **Post-Mortem Authoring Modal** to log lessons learned to `/memory`.

---

### 2.2 7-Stage Resilience & Edge Continuity State Machine (`sync_service.py`)

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

#### Deterministic Priority Tiers (P0 – P3):
1. **P0 (Critical Life Support):** Emergency shutdowns, generator trips, breaker transfers, declared incidents. Transferred in Packet 1 immediately upon carrier lock.
2. **P1 (Operational Maintenance):** Work order status changes, warehouse spare part reservations, shift handover notes.
3. **P2 (Science Continuity):** Buffered upper-atmosphere radar and seismograph observation batches.
4. **P3 (Diagnostic Telemetry):** Routine 50-point sensor batches and historical battery voltage time series.

---

### 2.3 Counterfactual Scenario Simulation State Machine (`scenario_service.py`)

```mermaid
stateDiagram-v2
    IDLE: 1. IDLE (Active Station Baseline Displayed)
    CONFIGURING: 2. CONFIGURING (Target Machine, Blizzard Duration, Sliders Adjusted)
    SIMULATING: 3. SIMULATING (Stateless Backend BFS & Physics Calculation)
    RESULTS_READY: 4. RESULTS READY (Delta Matrix, Headroom Shift & Vetted Options Rendered)
    DECISION_PENDING: 5. DECISION PENDING (Hold-to-Confirm Guard Active)
    AUTHORIZED: 6. AUTHORIZED (Command Sent to Action Ledger / Work Order)
    RECORDED: 7. RECORDED (Simulation Parameters & Rationale Saved to Memory)

    [*] --> IDLE
    IDLE --> CONFIGURING: Operator Seeds Scenario (or Clicks "Simulate" on Alarm)
    CONFIGURING --> SIMULATING: Clicks "RUN WHAT-IF SIMULATION"
    SIMULATING --> RESULTS_READY: Response Received (Zero Database Mutation)
    RESULTS_READY --> DECISION_PENDING: Operator Selects Countermeasure Package
    DECISION_PENDING --> AUTHORIZED: 1.5-Second Hold-to-Confirm Executed
    AUTHORIZED --> RECORDED: Appended to Active Incident & Operational Memory
    RECORDED --> IDLE: Sandbox Reset
```

---

### 2.4 Dual-Flow Living Topology State Machine (`dependency_service.py`)

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

### 2.5 Emergency Hold-to-Confirm Interaction State Machine

For high-impact operational commands (e.g. emergency load shedding or generator bypass), standard single-click buttons are dangerous, while multi-step modal dialogs introduce panic-inducing friction:

```mermaid
stateDiagram-v2
    IDLE_BUTTON: RESTING ("HOLD TO CONFIRM LOAD SHEDDING")
    PRESS_START: MOUSE DOWN / KEY HOLD (0ms - Progress Ring Begins Filling)
    FILLING: PROGRESS RING ACTIVE (0ms to 1500ms - Radial Cyan Animation)
    ABORT: RELEASED PREMATURELY (<1500ms - Ring Snaps to 0%, Action Aborted)
    TRIGGERED: REACHED 1500ms (Haptic/Auditory Click - Command Dispatched)

    [*] --> IDLE_BUTTON
    IDLE_BUTTON --> PRESS_START: mousedown / keydown(Space/Enter)
    PRESS_START --> FILLING: Continuous Hold
    FILLING --> ABORT: mouseup / keyup before 1500ms
    ABORT --> IDLE_BUTTON: Reset
    FILLING --> TRIGGERED: Continuous Hold >= 1500ms
    TRIGGERED --> [*]: Dispatched to Ledger
```

---

## 3. Optimistic Updates & Cryptographic Sync Integrity

1. **Local Queue Insertion:** When an operator logs an action while offline, it immediately appends to the UI Action Ledger decorated with an amber `LOCAL QUEUED` badge.
2. **Canonical JSON Serialization:** The payload is serialized deterministically (keys sorted alphabetically, compact separators):
   $$\text{canonical\_payload} = \text{json.dumps}(payload, \text{sort\_keys}=\text{True}, \text{separators}=(',', ':'))$$
3. **SHA-256 Checksum Calculation:** The client computes the SHA-256 hash and stores it alongside the queue item.
4. **Reconciliation Handshake:** Upon link restoration, `POST /api/resilience/restore` transmits the queue. The backend recomputes the hash. If verified, the badge transitions to green `RECONCILED`.

---
