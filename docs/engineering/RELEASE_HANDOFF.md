# PolarOps (SIH26060) — Engineering Release Handoff

## A. Release Information
- **Project**: PolarOps / SIH26060 (Antarctic Research Station Operational Digital Twin)
- **Release**: `v1.0-release-candidate`
- **Frozen Commit**: `c4842be` (`release: production hardening after approved UX redesign`)
- **Current Status**: Release Candidate Frozen & Verified
- **Baseline Rollback Checkpoints**:
  - `v0-baseline-approved` (Commit `9e06d8e`)
  - `v0-baseline-pre-implementation` (Commit `9e06d8e`)

---

## B. Product Thesis
PolarOps is an **Operational Digital Twin and Decision-Support Layer** purpose-built for isolated polar environments (Bharati and Maitri stations). It does **NOT** replace industrial SCADA controllers, computerized maintenance management systems (CMMS), raw science data repositories, or local human agency. PolarOps ingests multi-domain operational telemetry, evaluates cascading failure blast radiuses via deterministic BFS dependency traversal, models environmental amplification and logistics exposure, and presents actionable recommendations. Physical equipment actuation always requires authenticated on-station human authorization.

---

## C. Approved Human-Centered UX Model
The user interface has been manually reviewed and approved by the project owner. It strictly follows a **cognitive progressive disclosure architecture**:

```
Situation (What is happening right now?)
  ↓
Meaning (Why does this matter to the station?)
  ↓
Impact (What critical systems are at risk?)
  ↓
Constraint (What prevents immediate resolution?)
  ↓
Next Action (What should the operator do next?)
  ↓
Deep Evidence (Underlying telemetry, calculations & dependency graph)
```

### Four Progressive Disclosure Levels
1. **Level 1 — Immediate Situation**: High-visibility status summary, headline health score, and operational headroom (`34% (CONSTRAINED)`).
2. **Level 2 — Human Operator Briefing**: Plain-language narrative answering *What is happening?*, *Why does this matter?*, *What is affected?*, and *What blocks recovery?*.
3. **Level 3 — Supporting Operational Context**: Upstream/downstream dependencies, ambient polar weather factors, logistics schedules, and 5-milestone recovery timelines.
4. **Level 4 — Deep Engineering Evidence**: Raw sensor time-series, multi-factor risk engine breakdown (0–100), BFS graph traversal paths, SHA-256 telemetry checksums, and provenance metadata.

---

## D. Major Operational Surfaces
- **`/` (Station Command Center)**: Unified situational awareness for the active station (Bharati or Maitri). Features the 3-question hero briefing, operational headroom badge, 7-stage causal narrative, cross-station status card, and canonical event stream.
- **`/assets/G-02` (Asset Intelligence)**: In-depth diagnostic view for primary Generator G-02. Leads with the plain-language conclusion and 6-factor Risk Engine (91/100 HIGH RISK), followed by BFS blast radius (Life Support HVAC, Water Production), and telemetry trends.
- **`/resources` (Logistics, Fuel & Recovery Intelligence)**: Energy consumption modeling, fuel autonomy projections, and the 5-milestone recovery logistics banner answering *"Can we fix Generator G-02?"*.
- **`/scenarios` (What-If Scenario Simulation)**: Cross-domain operational scenario evaluation (e.g., 72h Generator G-02 Failure during Severe Blizzard) with side-by-side baseline vs. outage comparisons.
- **`/resilience` (Disruption Resilience & Offline Continuity)**: Air-gapped operational mode with 5 core offline briefing questions, P0–P3 prioritized telemetry buffer, SHA-256 data integrity verification, and science continuity preservation for instrument S-17.
- **`/stations` (Station Portfolio Operational Coordination)**: Multi-station comparison answering *"Which station has more operational room right now?"* across 5 capability headroom domains (Power, Thermal, Fuel, Life Support, Maintenance) without autonomous actuation.

---

## E. Core Demonstration Storyline (Bharati G-02)
1. **Abnormal Generator Condition**: Generator G-02 experiences severe vibration (7.2 mm/s) and bearing overheating (94.2°C).
2. **Dependency Impact**: Dependency BFS reveals G-02 directly powers Main Power Bus A, which feeds Primary Habitat HVAC and Snow Melt / Potable Water Plant.
3. **Life-Support Consequence**: Habitat temperature reserve is constrained to 4.2 hours before dropping below +18°C survival threshold in -38°C polar conditions.
4. **Recovery Constraint**: On-station spare mechanical seal is unavailable; maintenance crew cannot perform an immediate field overhaul.
5. **Spare / Resupply Problem**: Next polar resupply vessel (*MV Vasiliy Golovnin*) ETA is ≈ 14 days out; approaching winter sea-ice pack precludes emergency maritime docking.
6. **Scenario Simulation**: Operator runs a 72-hour What-If scenario demonstrating thermal load transfer to Auxiliary Boiler B-01 and load shedding non-critical radar instruments.
7. **Recommended Action**: Operator issues advisory procedure: run B-01 auxiliary boiler preheat, throttle radar science load, and transfer life-support load to Generator G-01.
8. **Operational Memory**: Action logged to local incident workspace; historical 2026 G-02 bearing mitigation playbook referenced for institutional continuity.

---

## F. Telemetry Provenance & Data Honesty
Every data point displayed in PolarOps contains explicit provenance metadata:
- **`MEASURED`**: Physical sensor values with verified timestamps and sensor IDs.
- **`DERIVED`**: Values calculated deterministically from raw telemetry (e.g., fuel burn rates, heating degree hours).
- **`FORECAST`**: Projections modeled from environmental trends and fuel reserves.
- **`SIMULATED` / `SYNTHETIC_SIMULATION`**: Demonstration profiles and What-If scenario projections.
- **`ADVISORY`**: Guidance and recommendations generated for human operator evaluation.

> [!IMPORTANT]
> **Zero False Representation**: PolarOps does **not** claim live NCPOR SCADA integration or automated physical actuation. All controls are decision-support advisories requiring human authorization.

---

## G. Current Test Baseline

| Suite | Scope | Result | Execution Time |
| :--- | :--- | :--- | :--- |
| **Playwright E2E** | All 6 operational surfaces (`/`, `/assets/G-02`, `/resources`, `/scenarios`, `/resilience`, `/stations`) | **63 passed / 63 total** | 5.6m |
| **Pytest Backend** | Unit, API contracts, BFS traversal, Risk Intelligence 2.0, multi-station scenarios | **76 passed / 76 total** | 8.09s |
| **Vite Production Build** | Full compilation (`tsc -b && vite build`) | **PASS (Exit 0)** | 1.09s |

---

## H. Known Release Boundaries (Deliberately Out of Scope for MVP)
- Autonomous physical equipment actuation or remote closed-loop control.
- Hardware-in-the-loop SCADA protocol bridges (Modbus TCP, OPC-UA) to physical field PLCs.
- Generic conversational AI chat widgets or non-deterministic LLM hallucinations in risk scoring.
- Heavy distributed infrastructure (Neo4j, Kafka, Redis) — PolarOps deliberately maintains a lightweight, air-gappable architecture.
- Full satellite uplink hardware emulation beyond simulated link degradation and packet queuing.

---

## I. Tomorrow's Starting Point
> **"Start future work from `v1.0-release-candidate` (`c4842be`). Do not revert to the earlier baseline unless explicitly required."**

### Production Environment Mapping (For Future Deployment)
- **Frontend Target**: `https://polarops-two.vercel.app/` *(do not touch legacy polarops.vercel.app)*
- **Backend Target**: `https://polarops-api.onrender.com/`
- **Deployment Rule**: No deployments were executed during this freeze pass. All work remains strictly local.
