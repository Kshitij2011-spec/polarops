# PolarOps Final Experience & Operational Journey Map

**Author:** Kshitij Parkhe (Product Owner & System Integration Lead)  
**Contributors:** Dhruv (Twin Lead), Tanvi (Decision Lead)  
**Date:** September 2026  
**Status:** AUTHORITATIVE & FINAL  
**Repository Branch:** `reimagine/product-blueprint`  
**Baseline:** `5c692ec` (`baseline/phase4-5c692ec`)  
**Target Repository Artifact:** `docs/reimagination/FINAL_EXPERIENCE_MAP.md`

---

## 1. The Definitive Acceptance Journey: Generator G-02 Anomaly

This walkthrough serves as the **core acceptance test** for the PolarOps product architecture. It demonstrates how an operator navigates from initial anomaly detection to physical containment, counterfactual simulation, human approval, and institutional learning across the three macro-workspaces without ever losing context.

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Chief Engineer / Shift Commander
    participant Shell as Global Command Shell
    participant W1 as Workspace 1: Command + Twin (/twin)
    participant Drawer as 5-Stage Explanation Drawer
    participant W2 as Workspace 2: Decision Cockpit (/cockpit)
    participant W3 as Workspace 3: Continuity & Logistics (/continuity)
    participant Backend as PolarOps FastAPI Backend

    Operator->>Shell: 03:00 AM Scan — Ambient -42°C, Blizzard Alert Active
    Shell-->>Operator: Amber Link: DEGRADED (1,850ms) · Alert: G-02 Vibration Surge
    Operator->>W1: Focuses on Generator G-02 Node in Living Topology DAG
    W1-->>Operator: Right Inspector opens: Vibration 4.8 mm/s · Risk 91/100 · N-0 Warning
    Operator->>W1: Toggles "Downstream Blast Radius"
    W1-->>Operator: Visual DAG pulses red: Electrical Bus-01, HVAC-02, Habitat Zone 2
    Operator->>Drawer: Clicks "INSPECT CAUSAL TRACE (WHY?)"
    Drawer-->>Operator: Slide-out 5-step evidence: Stator temp 98.2°C, bearing wear, work order blocked
    Operator->>W3: Clicks "CHECK SPARE AVAILABILITY" (Handoff to /continuity?asset=G-02)
    W3-->>Operator: Warehouse Bin M-2: SK-402 bearing count = 0! Ship ETA 11 days
    Operator->>W2: Clicks "SIMULATE MITIGATION" (Handoff to /cockpit?mode=sim&asset=G-02)
    W2-->>Operator: Scenario Sandbox pre-seeded: "Trip G-02 under -42°C weather"
    Operator->>W2: Clicks "RUN SIMULATION"
    Backend-->>W2: In-Memory Delta: Reserve margin drops to 50 kW; thermal hold = 3.8 hrs
    W2-->>Operator: Generates Vetted Decision Package: Dispatch G-01 + Preheat B-01 + Shed Science Radar
    Operator->>W2: Executes "Hold-to-Confirm" on Decision Package (1.5-second press)
    W2->>Backend: Dispatches commands; appends to Immutable Action Execution Ledger
    Backend-->>Shell: Local SQLite logs P0 packet; SHA-256 hash queued for store-and-forward
    Operator->>W1: Returns to /twin: G-01 online; G-02 throttled to 35%; vibration drops to 3.1 mm/s
    Operator->>W2: Navigates to Memory (/cockpit?mode=memory)
    W2->>Backend: Posts debrief lesson: "Throttling G-02 to 35% extends bearing life 14 days"
```

---

## 2. Step-by-Step Acceptance Phase Trace

| Stage | Operational Action | User Interface Manifestation | State & Truth Type | Data Source & API Binding |
|---|---|---|---|---|
| **1. Detect Anomaly** | Accelerometer triggers threshold alarm. | Flashing amber badge in Global Shell header: `G-02 VIBRATION WARNING`. | State: `DEGRADED`<br>Truth: `MEASURED` | `GET /api/station/overview`<br>`GET /api/events` |
| **2. Inspect G-02** | Operator opens Workspace 1 (`/twin?asset=G-02`). | Canvas auto-centers on G-02 node; 380px Contextual Inspector slides into view on right. | State: `EXPLORATION`<br>Truth: `MEASURED` | `GET /api/assets/G-02`<br>`GET /api/assets/G-02/telemetry` |
| **3. Understand Condition** | Reviews live telemetry and physical degradation. | 50-point vector sparkline shows vibration rising from 2.1 to 4.8 mm/s. Red dotted threshold at 3.5 mm/s. | State: `DEGRADED`<br>Truth: `MEASURED` | `GET /api/assets/G-02/telemetry?limit=50` |
| **4. Inspect Risk** | Evaluates multi-factor risk drivers. | 6-Factor Risk Ladder displays: `VIBRATION_SEVERITY` (Score 91/100, Tribological bearing shear). | State: `HIGH_RISK`<br>Truth: `DERIVED` | `GET /api/assets/G-02/risk` |
| **5. Trace Dependencies** | Toggles "Downstream Blast Radius". | Outbound links to `BUS-01`, `HVAC-02`, and `SRV-HAB-HEAT-Z2` pulse red. Unrelated nodes dim. | State: `BLAST_RADIUS_ACTIVE`<br>Truth: `DERIVED` | `GET /api/assets/G-02/dependencies?max_depth=5` |
| **6. Understand Blast Radius** | Inspects service criticality impact. | Inspector lists: Habitat Heating Zone 2 (Life Support) will lose thermal heat in 3.8 hours. | State: `CRITICAL_EXPOSURE`<br>Truth: `DERIVED` | `dependency_service.py` BFS Traversal |
| **7. Discover Recovery Constraint** | Checks work order and spare parts status. | Inspector alerts: Work order `MWO-2026-089` blocked. Required spare bearing `SK-402` stock = 0. | State: `BLOCKED_PARTS`<br>Truth: `MEASURED` | `GET /api/resources/recovery/G-02` |
| **8. Inspect Spare / Logistics** | Clicks "View Supply Chain" $\longrightarrow$ navigates to `/continuity?asset=G-02`. | Warehouse Bin M-2 confirms stockout. Inbound vessel *MV Vasiliy Golovnin* ETA is 11 days away. | State: `LOGISTICS_BOTTLENECK`<br>Truth: `ESTIMATED` | `GET /api/resources/inventory`<br>`GET /api/resources/resupply` |
| **9. Simulate Consequence** | Clicks "Simulate Mitigation" $\longrightarrow$ navigates to `/cockpit?mode=sim&asset=G-02`. | Opens Counterfactual Sandbox. Unmissable amber banner: `HYPOTHETICAL SIMULATION SANDBOX`. | State: `SANDBOX_ACTIVE`<br>Truth: `SCENARIO` | `POST /api/scenarios/simulate` |
| **10. Compare Options** | Reviews Simulation Delta Matrix. | Dials reveal: Dispatching G-01 + shedding science radar restores reserve to +120 kW and extends thermal hold to 18 hrs. | State: `RESULTS_READY`<br>Truth: `SCENARIO` | `ScenarioSimulateResponse` |
| **11. Human Authorization** | Selects recommended Decision Package. | Hold-to-Confirm Button requires 1.5-second continuous press. Prevents accidental actuation. | State: `DECISION_PENDING`<br>Truth: `HUMAN_APPROVED` | Client Guard Modal |
| **12. Action Recorded** | Command dispatched. | Action appended to chronological Action Execution Ledger with operator ID and UTC timestamp. | State: `EXECUTED`<br>Truth: `MEASURED` | `POST /api/incidents/{id}/actions` |
| **13. Resulting State Observed** | Returns to `/twin`. | G-01 online; G-02 throttled to 35%; vibration stabilizes at 3.1 mm/s; station returns to `NOMINAL`. | State: `NOMINAL`<br>Truth: `MEASURED` | `GET /api/station/overview` |
| **14. Event Becomes Memory** | Navigates to `/cockpit?mode=memory`. | Operator logs post-mortem debrief: "Throttling G-02 to 35% reduces bearing strain to survive until resupply." | State: `ARCHIVED`<br>Truth: `MEASURED` | `POST /api/memory` |

---

## 3. Preserving Context Across All 11 Journeys

The PolarOps context engine guarantees zero mental reconstruction across all operational journeys:
1. **Station Continuity:** Switching stations in the shell dropdown updates all three workspaces simultaneously.
2. **Entity Deep-Linking:** Selecting an asset code anywhere in the app updates `?asset=...`, allowing seamless cross-workspace transitions.
3. **Drawer Overlays:** 5-Stage Explanation and Resilience Cockpit slide out over the active screen using Radix Sheet primitives without resetting form state or unmounting canvas views.
4. **Historical Search Integration:** Searching `/memory?q=...` renders instantly in the side pane without interrupting active incident triage.

---
