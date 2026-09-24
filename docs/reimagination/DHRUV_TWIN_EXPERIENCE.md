# PolarOps Digital Twin & System Intelligence Experience
**Role:** Dhruv Nayak — Digital Twin & System Intelligence Experience Owner  
**Branch:** `reimagine/dhruv-twin`  
**Baseline:** `5c692ec` (*baseline/phase4-5c692ec*)  
**Scope:** Reimagined Digital Twin Philosophy, Mental Model, Operator Workflow, Operational Topology Graph, and 3D Spatial Rigor.

---

## 1. Executive Philosophy: The Digital Twin Equation

In conventional industrial software, a "digital twin" is often reduced to either a static 3D mesh spinning in WebGL or a dense dashboard of detached sensor cards. In extreme Antarctic station operations, both approaches fail operators:
- A decorative 3D model hides causal dependencies and provides zero operational reasoning.
- A table of raw transducer cards forces cognitive overload during high-stress threshold breaches.

For PolarOps, the Digital Twin is defined by a strict operational equation:

$$\mathbf{Digital\ Twin} = \mathbf{Data} + \mathbf{State} + \mathbf{Relationships} + \mathbf{Reasoning}$$

```
   ┌──────────────────────────────────────────────────────────────┐
   │                         DIGITAL TWIN                         │
   ├──────────────────────────────┬───────────────────────────────┤
   │ DATA                         │ STATE                         │
   │ Calibrated transducer series │ Deterministic health scores,  │
   │ Provenance & quality flags   │ Threshold status (NOMINAL/    │
   │ Ambient weather telemetry    │ WARNING/CRITICAL), Headroom   │
   ├──────────────────────────────┼───────────────────────────────┤
   │ RELATIONSHIPS                │ REASONING                     │
   │ Multi-hop dependency graph   │ Risk Intelligence 2.0         │
   │ Upstream suppliers           │ Ranked causal drivers         │
   │ Downstream blast radius      │ Supply chain constraints      │
   │ Energy & thermal couplings   │ Deterministic explanations    │
   └──────────────────────────────┴───────────────────────────────┘
```

The Digital Twin is not a page; it is the **authoritative living representation of the station's physical, functional, and operational reality**.

---

## 2. Operator Mental Model: The 10 Fundamental Inquiries

Before drawing a single wireframe or writing a React component, every UI surface is designed by answering the 10 fundamental operational questions:

| # | Invariant Operational Question | PolarOps Domain Realization |
|---|---|---|
| **1** | **Who is the operator?** | The Station Expedition Engineer (on-station at Bharati/Maitri) and the Antarctic Operations Controller (NCPOR Headquarters, Goa). They operate under isolation, extreme fatigue, and satellite communication constraints. |
| **2** | **What job are they performing?** | Guaranteeing continuous station life support, electrical power generation, habitat thermal envelope, and science payload continuity in sub-zero polar conditions. |
| **3** | **What situation triggers this workflow?** | A sensor threshold breach (e.g. G-02 bearing vibration exceeding 4.0 mm/s), severe katabatic wind advisory, single-point redundancy loss ($N-0$), or supply-chain stockout alert. |
| **4** | **What must they understand within 5 seconds?** | 1. **What is failing?** (Generator G-02 bearing vibration anomaly).<br>2. **What is the station posture?** ($N-0$ single-point failure on Grid A).<br>3. **What is our headroom?** (Thermal hold hours: 6.2h, Generation reserve: 20 kW). |
| **5** | **What should they inspect next?** | The immediate transducer trendline (linear regression trend: `RISING` at 4.8 mm/s) and the upstream fuel/cooling feed integrity to rule out external mechanical starvation. |
| **6** | **What relationships matter?** | The electrical feed to Research Lab PDU, the exhaust thermal heat-recovery loop to Habitat Zone 2 Heating, and the dependence on Auxiliary Boiler B-01 as the sole thermal backup. |
| **7** | **What constraints matter?** | Physical logistics blockers: On-station stock for Rotary Seal Kit `SK-402` is **0 units**, maintenance work order `MWO-2026-089` is `BLOCKED_PARTS`, and resupply vessel *MV Vasiliy Golovnin* is 11.0 days away. |
| **8** | **What decision is eventually required?** | Whether to: (a) dispatch G-01 to carry full electrical load, (b) preheat Auxiliary Boiler B-01 to pick up Zone 2 thermal load, (c) shed non-critical science radar (35 kW), or (d) request emergency air-lift contingency. |
| **9** | **What evidence supports that decision?** | Deterministic 6-factor risk breakdown (score: 82/100, `CRITICAL`), BFS graph traversal proving Zone 2 habitat freeze risk, and verified transducer readings with `MEASURED` provenance. |
| **10** | **What happens afterward?** | Operator logs decision to Action Ledger, system reconciles offline sync queues via SHA-256 state hashes, creates Operational Memory entry, and updates station operational headroom. |

---

## 3. End-to-End Operator Workflow Architecture

The reimagined interface abandons disconnected tabs and replaces them with an orchestrated, continuous decision loop:

```
[1. DETECT]        [2. INSPECT]        [3. UNDERSTAND]        [4. TRACE]
Condition Alert ──► Live Signals  ──► Risk Intelligence ──► Multi-Hop Blast
(Vibration 4.8)    (Sparklines,       (Ranked Drivers,       Radius (Graph,
                    Thresholds)        State Ladder)          Flows, Edges)
                                                                    │
                                                                    ▼
[8. RESOLVE]       [7. DECIDE]         [6. CONSTRAIN]         [5. EXPLAIN]
Sync Queue Flush◄──Action Ledger  ◄── Supply Chain      ◄── 5-Step Causal
& Memory Log        (Dispatch B-01,     Blockers (SK-402,      Drawer (Why?
                    Shed Radar)         Resupply 11d)          What Next?)
```

### UI Surface Allocation Hierarchy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GLOBAL COMMAND HEADER: Station Selector | Status Badge | Sync Health | Global Search  │
├─────────────────────────────────────────────────────────┬──────────────────────────────┤
│ PRIMARY WORKSPACE (70% Width)                          │ DOCKED INSPECTOR (30% Width) │
│                                                         │                              │
│ ┌─────────────────────────────────────────────────────┐ │ ┌──────────────────────────┐ │
│ │ VIEW MODE: [ Topology Graph | Spatial Layout ]      │ │ │ SELECTED ASSET: G-02     │ │
│ ├─────────────────────────────────────────────────────┤ │ ├──────────────────────────┤ │
│ │                                                     │ │ │ Operational State:       │ │
│ │           LIVING OPERATIONAL TOPOLOGY               │ │ │ CRITICAL (Risk: 82/100)  │ │
│ │                                                     │ │ ├──────────────────────────┤ │
│ │   [Fuel Feed] ──► [G-02] ──► [Power Bus A]          │ │ │ LIVE TRANSDUCER SIGNALS  │ │
│ │                     │                │              │ │ │ Vib: 4.8 mm/s [RISING]   │ │
│ │                     ▼                ▼              │ │ │ Temp: 92°C    [STABLE]   │ │
│ │              [Exhaust Loop]    [Radar PDU]          │ │ ├──────────────────────────┤ │
│ │                     │                               │ │ │ RISK DRIVER LADDER       │ │
│ │                     ▼                               │ │ │ 1. Bearing Condition 25p │ │
│ │              [Zone 2 Heat]                          │ │ │ 2. Recovery Blocker  20p │ │
│ │                                                     │ │ │ 3. N-0 Redundancy    15p │ │
│ │                                                     │ │ ├──────────────────────────┤ │
│ └─────────────────────────────────────────────────────┘ │ │ RECOVERY BLOCKER:        │ │
│                                                         │ │ SK-402 Stock: 0 [BLOCKING]│ │
│ ┌─────────────────────────────────────────────────────┐ │ ├──────────────────────────┤ │
│ │ HEADROOM STRIP: Generation 20kW | Thermal 6.2h      │ │ │ [ OPEN EXPLANATION WHY? ]│ │
│ └─────────────────────────────────────────────────────┘ │ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┴──────────────────────────────┘
```

1. **Primary Workspace (Canvas)**:
   - Contains the **Operational Topology Graph** as the primary default mode, with instant toggle to **Spatial Schematic**.
   - Renders interactive upstream suppliers, active equipment nodes, downstream buses, and affected living zones.
   - Hosts the **Operational Headroom Status Bar** across the bottom edge.
2. **Docked Inspector (Right Panel)**:
   - Contextual to the currently selected node (Asset, Service, or Zone).
   - Displays real-time transducer sparklines, thresholds, and linear regression trends (`RISING`, `FALLING`, `STABLE`).
   - Displays the **Risk Intelligence 2.0 State Transition Ladder** and top ranked causal drivers.
   - Surfaces physical supply chain recovery bottlenecks (Spare parts, work orders, resupply ETA).
3. **Slide-Out Explanation Drawer (`ExplanationDrawer`)**:
   - Deep-dive panel triggered by operator request (`WHY?`).
   - Surfaces structured 5-part causal narratives:
     1. *Observed Anomaly*: Exact sensor breach and telemetry timestamp.
     2. *Physical Mechanism*: Tribological bearing degradation and thermal expansion.
     3. *Cascading Blast Radius*: Upstream dependencies and downstream life support risks.
     4. *Logistics Blockers*: Missing inventory stock and blocked work order.
     5. *Actionable Countermeasures*: Deterministic mitigation alternatives.
4. **Contextual Simulation Overlays**:
   - **What-If Scenario Mode**: Allows operators to simulate asset trips (e.g. "Trip G-02 now") or ambient temperature plummets (-40°C blizzard) to preview headroom collapse before taking irreversible actions.
5. **Global Search & Omnibar**:
   - `Ctrl+K` command palette for instant jumping to any asset (`G-02`), sensor (`SENS-G02-VIB`), service (`HABITAT_HEATING`), work order (`MWO-2026-089`), or spare part (`SK-402`).

---

## 4. Operational Topology Experience Specification

The topology graph is the operational nervous system of PolarOps. It transforms abstract database records into an intuitive, multi-hop operational dependency graph.

### 4.1 Graph Semantics & Layout Rules
- **Hierarchical Directional Flow**: Primary flow runs Left-to-Right or Top-to-Bottom:
  $$\text{Energy Resources} \longrightarrow \text{Prime Movers (Generators/Boilers)} \longrightarrow \text{Distribution (Buses/Loops)} \longrightarrow \text{Consumers (HVAC/Pumps/Radar)} \longrightarrow \text{Station Life Support \& Habitats}$$
- **Cycle Safety**: Cycle-breaking DFS layer assignment backed by backend visited sets (`dependency_service.py`).
- **Default Focus**:
  - On view initialization, the graph automatically centers on the **Highest Operational Risk Asset** (e.g. G-02 with risk 82/100).
  - Operator can re-center with a single keystroke (`Space` or `F`).

### 4.2 Dual-Flow Interactive Tracing: Upstream vs. Downstream
When node `G-02` is selected:
1. **Upstream Dependency Trace (Suppliers)**:
   - Highlights inbound fuel lines from `DIESEL_LFO` storage and lube oil circuits in cold cyan/blue.
   - Answers: *"Is G-02 failing because an upstream supply system is failing?"*
2. **Downstream Blast Radius (Consumers)**:
   - Highlights outbound electrical feed to `PDU-SCI` and thermal exhaust loop to `HVAC-02` and `SRV-HAB-HEAT-Z2` in pulsing amber/red.
   - Inactive or redundant links are styled with dashed strokes; active single-point-of-failure links are solid, high-contrast conduits.
   - Answers: *"If G-02 trips in 20 minutes, exactly what goes dark and who gets cold?"*

### 4.3 Physical Edge Semantics
Edges are strictly typed based on `DependencyType` enum, avoiding generic wire lines:
- **`ELECTRICAL` (Gold / #E5A93C)**: High-voltage station bus feeds; animated directional dash indicates active power flow.
- **`THERMAL` (Crimson / #E05252)**: Hydronic and glycol exhaust waste-heat recovery loops; line thickness indicates kW thermal transfer.
- **`FUEL` (Amber / #D97706)**: Arctic-grade diesel LFO supply piping.
- **`DATA` (Cyan / #0EA5E9)**: Control signals, SCADA sensor loops, and PLC communication.
- **`PHYSICAL` (Slate / #64748B)**: Mechanical couplings and structural mounting.

### 4.4 Redundancy & Single-Point-of-Failure Encoding
- **$N-1$ Redundant Nodes**: Rendered with double-stroke concentric borders, indicating an active standby unit exists (e.g. Generator G-01 is online while G-02 is degraded).
- **$N-0$ Single-Point-of-Failure**: Rendered with sharp warning badge and pulsing hazard halo, indicating that failure directly collapses downstream service with zero backup buffer.

### 4.5 First-Class Accessibility & Tabular Alternate
Visual graphs can create accessibility barriers and fail in low-bandwidth terminal environments. The Digital Twin provides a 1-click **Structured Blast-Radius Matrix**:
- Semantic, keyboard-navigable tree table (`Table` with ARIA treegrid roles).
- Columns: `Level`, `Node Code`, `Type`, `Subsystem`, `Criticality`, `Redundancy State`, `Impact Factor`, `Status`.
- Fully operable via keyboard (`ArrowUp`, `ArrowDown`, `ArrowRight` to expand depth tiers, `Enter` to inspect).

---

## 5. Rigorous 3D Spatial Evaluation

3D representations in SCADA and digital twins are frequently implemented as decorative gimmicks that degrade performance, increase cognitive load, and provide zero decision utility. For PolarOps, 3D is evaluated with ruthless operational criteria:

### 5.1 What Question Does 3D Answer?
3D answers **strictly spatial and physical layout questions** that cannot be answered by topological schematics:
1. *"Where is this equipment physically located inside the station module?"* (e.g. Generator Hall in Lower Ground Block vs Boiler Bay).
2. *"What is the physical containment boundary between this hazard and crew living quarters?"* (e.g. fire/vibration transmission through Bulkhead 3).
3. *"Which side of the station faces the incoming katabatic blizzard, and which thermal envelope zones are on the windward side?"*
4. *"Can maintenance personnel access the unit during a -40°C storm without going outside?"* (External catwalk vs internal pressurized transit tunnel).

### 5.2 When Spatial Context Matters
- **Station Hull Thermal Boundary**: When ambient temperatures drop to -38°C with 45-knot winds, windward habitat pods experience $3\times$ higher heat dissipation than leeward pods. A 3D spatial thermal gradient reveals envelope heat leakage that a 2D line graph cannot convey.
- **Bharati vs Maitri Architecture**:
  - *Bharati Station*: Compact, modular containerized structure elevated on stilts with integrated internal breezeways. Spatial routing of thermal glycol lines between the central powerhouse and the upper living modules is physically constrained.
  - *Maitri Station*: Dispersed huts and modules connected by external heat-traced pipelines over rocky Schirmacher Oasis terrain. Physical distance and pipe freeze risks dominate maintenance decisions.

### 5.3 What 3D Provides Beyond Topology
- Compartment-level volumetric heating requirements ($m^3$).
- Physical proximity of backup assets (e.g. walking distance between Generator Hall and Spares Bin M-2).
- Structural wind-loading and snow-drift accumulation zones.

### 5.4 When 3D MUST NOT Be Used (Hard Rejections)
- **Primary Alarm Monitoring**: Operators must NEVER be forced to rotate, pan, or hunt through a 3D camera view to find an active alarm. Alarm state belongs in the 2D status matrix.
- **Relational Causal Tracing**: 3D spatial views fail at representing multi-hop logical dependencies (e.g. a fuel valve logically controlling a radar calibration service). Multi-hop reasoning belongs exclusively in the **Operational Topology Graph**.
- **Low-Bandwidth Satellite Comms**: When the satellite link degrades to 48 kbps, transmitting heavy 3D GLTF/GLB geometry bundles is prohibited. The 2D SVG canvas and JSON state stream take absolute priority.
- **Purely Decorative Animations**: No spinning station exterior hero widgets, no gratuitous particle smoke from generator exhausts, and no cinematic camera swoops.

---

## 6. Synthesis: The Reimagined Digital Twin Workspace

The PolarOps Digital Twin unifies data, state, relationships, and reasoning into a cohesive operational weapon:
- **Instant Orientation**: A 5-second glance tells the engineer the exact station health, active hazard, and life-safety headroom.
- **Effortless Traversal**: One click traverses from a transducer vibration spike to the downstream living quarters heater, through the empty spare parts shelf, to the supply vessel navigating Antarctic pack ice 11 days away.
- **Uncompromised Truth**: Every number, threshold, and score carries its explicit provenance (`MEASURED` sensor vs `DERIVED` model vs `SCENARIO` projection).

This specification serves as the design constitution for all subsequent frontend components in the PolarOps Digital Twin.
