# Research & Architectural Assumptions

This document categorizes all operational data, research assumptions, and design decisions into explicit classification tiers.

---

## 1. Known Facts from Research (Antarctic Operational Context)
- **Extreme Environment**: Antarctic research stations (Maitri at 70°S, Bharati at 69°S) face winter temperatures dropping below -40°C, catabatic winds exceeding 100 knots, and total winter isolation (March to October).
- **Resource Criticality**: Polar diesel (LFO) is the primary survival lifeline for both electrical generation and building heating. Fuel consumption spikes exponentially during severe cold snaps.
- **Communication Constraints**: Satellite communication (Iridium / Inmarsat / VSAT) experiences high latency, periodic solar interference, and severe bandwidth bottlenecks (often kilobits/sec). Edge autonomy is essential.
- **Resupply Logistics**: Resupply vessels (e.g. MV Vasiliy Golovnin) visit only once per summer season. Spare parts missing from station inventory cannot be replenished for months.

---

## 2. Our Antarctic Operational Adaptation
- **Dual Station Support**: Platform supports multi-station navigation (Bharati main focus, expandable to Maitri).
- **Life Support Dependency Focus**: Priority is given to thermal loops and electrical power feeding living quarters and emergency shelters.
- **Science vs Life Support Trade-off**: Under energy rationing, non-essential scientific experiments (e.g. radar/lidar payloads) can be shed to protect habitat thermal stability.

---

## 3. Our Design Decisions
- **Tech Stack**: React + TypeScript + Vite (Frontend) and FastAPI + Python (Backend), backed by PostgreSQL / Supabase.
- **Relational BFS Risk Engine**: Dependency graph and risk scoring rely on deterministic relational BFS traversal rather than opaque black-box machine learning models to guarantee explainability for operators.
- **Interactive Scenario Simulation**: What-If scenario engine operates entirely in memory on the backend to allow instant simulation feedback in the UI without modifying persistent station state (stateless guarantee).
- **Advisory Prototype Decision Support**: All generated decision options are deterministic rule-based countermeasures; no autonomous actuation or dispatching is performed.

---

## 4. Deterministic Prototype Energy & Recovery Models [OUR DESIGN]

### 4.1 Synthetic Prototype Energy Balance Model
The energy model is a transparent linear prototype designed for operational decision support, not physical thermodynamic certification:
1. **Thermal Demand Equation**:
   $$\text{Thermal Demand (kW)} = \max\left(50.0, (20.0 - T_{\text{ambient}}) \times 5.2\right)$$
   - Indoor habitat comfort target: $+20.0^\circ\text{C}$.
   - Station thermal loss coefficient: $K_{\text{loss}} = 5.2\text{ kW/}^\circ\text{C}$.
2. **Electrical Load Dispatch**:
   - Baseline electrical load: $180.0\text{ kW}$.
   - Cold snap auxiliary heating: If $T_{\text{ambient}} < -20.0^\circ\text{C}$, auxiliary heat tracing and glycol circulation pumps add $( -20.0 - T_{\text{ambient}} ) \times 1.8\text{ kW}$.
   - Total electrical load: $\text{Load} = 180.0 + \text{Auxiliary Heating Load}$.
3. **Specific Fuel Consumption Rate (SFCR)**:
   $$\text{Burn Rate (L/h)} = 25.0 + (0.265 \times \text{Electrical Load (kW)})$$
   - Base idle/parasitic consumption: $25.0\text{ L/h}$.
   - Marginal load coefficient: $0.265\text{ L/kWh}$.
4. **Canonical Fuel Runway**:
   $$\text{Runway (Days)} = \frac{\text{Current Tank Stock (L)}}{\text{Hourly Burn Rate (L/h)} \times 24}$$
   - Winter baseline target: $90.0\text{ days}$.
   - Resupply gap: $\text{Runway (Days)} - 90.0\text{ days}$.

### 4.2 Deterministic Recovery Exposure Model
Evaluates asset recovery vulnerability without stochastic simulations:
- Input parameters: Asset criticality, active work order status, local spare stock count, inbound vessel ETA.
- Rule: If asset criticality is `CRITICAL` or `HIGH`, active work order is `BLOCKED_PARTS`, local spare available count is $0$, and resupply vessel ETA $> 7$ days $\to$ Exposure is evaluated as `HIGH`.
- Clearly labeled as `[OUR DESIGN] Evaluated Prototype Model`.

---

## 5. Synthetic Demonstration & Modeled Data Classifications

Every metric in the PolarOps system strictly maps to one of these metadata classifications:

| Operational Metric / Feature | Classification | Description / Source |
| :--- | :--- | :--- |
| **Generator Telemetry (Vibration, Temp)** | `Synthetic Demonstration` | Modeled dataset generated for G-01, G-02, G-03 demonstration |
| **Fuel Level (142,500 L)** | `Measured (Synthetic)` | Modeled initial station tank level from telemetry table |
| **Fuel Runway (70.3 Days)** | `Derived` | Calculated dynamically from fuel stock / burn rate math |
| **Energy Balance Model** | `Derived (Prototype)` | Calculated via linear thermal/electrical demand model |
| **Recovery Exposure** | `Derived (Prototype)` | Evaluated via deterministic spare stock and work order chain |
| **G-02 Anomaly / Failure** | `Scenario` | Interactive what-if simulation parameter |
| **Scenario Metric Deltas** | `Scenario` | In-memory projected consequence outputs |
| **Composite Risk Score** | `Derived` | Calculated via 6-factor explainable risk formula |
| **Resupply Logistics Schedule** | `Synthetic Demonstration` | Modeled synthetic vessel schedule for MV Vasiliy Golovnin |
| **Decision-Support Countermeasures** | `Prototype Advisory` | Rule-based advisory options; human-in-the-loop only |

---

## 5. Items Requiring Future Validation
- Exact NCPOR telemetry protocol standards (Modbus TCP / MQTT / OPC-UA).
- Actual NCPOR inventory part numbering and ERP schema compatibility.
- Precise physical telemetry frequency and bandwidth thresholds for satellite links.
