# PolarOps — Definitive MVP Navigation, Demonstration & Testing Guide

> **SIH 2026 · Problem Statement SIH26060**  
> *Digital Platform for Efficient Remote Management of Indian Antarctic Research Stations (Bharati & Maitri)*  
> **Production Deployment:** [https://polarops-two.vercel.app](https://polarops-two.vercel.app)  
> **Backend API:** [https://polarops-api.onrender.com](https://polarops-api.onrender.com)  
> **Interactive Swagger Docs:** [https://polarops-api.onrender.com/docs](https://polarops-api.onrender.com/docs)  
> **GitHub Source Repository:** [https://github.com/Kshitij2011-spec/polarops](https://github.com/Kshitij2011-spec/polarops)

---

## SECTION 1 — WHAT POLAROPS IS

PolarOps is an **Operational Digital Twin** engineered for Indian Antarctic Research Stations (**Bharati** in Larsemann Hills and **Maitri** in Schirmacher Oasis). It gives station commanders, logistics planners, and expedition engineers a unified, explainable decision-support platform designed to withstand severe polar disruptions.

### Core Thesis
> When something changes at an isolated Antarctic station, PolarOps tells the operator:
> 1. **What changed?** (Telemetry anomalies & threshold excursions)
> 2. **What does it affect?** (Multi-hop dependency blast radius & service exposure)
> 3. **What may happen next?** (Cross-domain what-if consequence simulation)
> 4. **What can be done about it?** (Maintenance recovery blockers, logistics runway & operational actions)
> 5. **How to operate through disruption?** (Autonomous local edge operations & prioritized delta sync)
> 6. **What did we learn?** (Human-in-the-loop operational memory for future expedition crews)

### The 6-Step Operational Loop
```text
SENSE → UNDERSTAND → PREDICT → SIMULATE → DECIDE → LEARN
```
- **SENSE:** Real-time continuous sensor metrics, threshold alerts, and station environmental conditions.
- **UNDERSTAND:** Multi-hop relational graph traversal revealing how physical equipment failure cascades into life-support services.
- **PREDICT:** Deterministic multi-factor risk scoring evaluating asset health, ambient cold, and single-point vulnerability.
- **SIMULATE:** Stateless in-memory what-if simulation modeling capacity loss, fuel burn shift, and exposed habitats.
- **DECIDE:** Action logging, maintenance work order visibility, and resilience prioritization.
- **LEARN:** Explicit capture of operational post-mortems and institutional knowledge across wintering teams.

---

## SECTION 2 — HOW TO OPEN THE MVP

### Production URL
Open any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari) and navigate to:
👉 **[https://polarops-two.vercel.app](https://polarops-two.vercel.app)**

### What to Expect on First Load
1. **Initial Connection:** The frontend loads instantly from Vercel's global edge network. A brief spinner displays `CONNECTING TO STATION TELEMETRY BUS…` while querying the live Render backend.
2. **Cold Start Note:** If the Render backend has been idle, the first API request may take 15–30 seconds while the container boots. Subsequent interactions are immediate.
3. **Default Presentation:** The application loads directly into **Bharati Research Station** during mid-winter operations, displaying an active Blizzard Warning, 70.3 days of fuel runway, and an amber warning banner for **Generator G-02**.

### Data Honesty Notice
> [!IMPORTANT]
> **Demonstration Data:** All station sensor telemetry, weather observations, spare parts counts, and maintenance logs are **deterministic synthetic datasets** engineered for reproducible demonstration. No live NCPOR satellite telemetry, physical SCADA bus, or operational station hardware is connected in this prototype. Truth badges (`[MEASURED]`, `[DERIVED]`, `[SCENARIO]`, `[SYNTHETIC]`) throughout the UI explicitly identify the provenance of every data point.

---

## SECTION 3 — THE MAIN NAVIGATION

The top command bar is permanently visible across all views:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Activity] POLAROPS v1.0-MVP   [Command Center] [Resources & Fuel] [What-If Scenarios] [Resilience] │
│                                STATION: [Bharati Station ▼]  [WINTER OPS]  [● ONLINE]  [🔄]  [SYNTHETIC]│
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Top-Level Views

| Navigation Button | Route | Purpose | Key UI Controls |
|---|---|---|---|
| **Command Center** | `/` | Common Operational Picture (COP). Real-time station overview, spatial zone schematic, critical anomaly banner, and subsystem health grid. | Station selector dropdown, "Inspect Asset G-02" button, interactive SVG topology nodes. |
| **Resources & Fuel** | `/resources` | Cross-domain logistics intelligence. Fuel runway projection, warehouse spare parts availability, resupply ship voyage tracking, and recovery chains. | Tab buttons: `Energy & Fuel`, `Inventory & Spares`, `Resupply Logistics`, `G-02 Recovery Chain`. |
| **What-If Scenarios** | `/scenarios` | Predictive simulation engine. Stateless in-memory modeling of generator failures, ambient temperature drops, and service exposure. | Target asset selector (`G-02` / `G-01`), Duration buttons (`24h`, `48h`, `72h`), Cold Snap slider (`-40°C` to `-15°C`), `Run Simulation` button. |
| **Resilience & Disruption** | `/resilience` | Autonomous edge operations. Disrupted satellite comms simulation, deterministic priority queue (P0–P3), SHA-256 checksum verification, science buffering, and incident memory. | `Simulate Outage` button, `Restore & Reconcile` button, `Reset Simulation` button, 4 capability tabs. |
| **Asset Detail** | `/assets/:id` | Deep-dive telemetry, explainable risk scoring, multi-hop dependency blast radius, and maintenance status for a specific equipment asset. | `← Back to Station Command Center` button, 24h telemetry trend charts, dependency graph cards. |

### Header Controls
- **Station Selector Dropdown:** Switch between `Bharati Station (Larsemann Hills)` and `Maitri Station (Schirmacher Oasis)`.
- **Environment Mode Badge:** Displays `WINTER OPS` (cyan snowflake) or `SUMMER OPS` (amber sun).
- **Connectivity Indicator:** Displays pulsating green dot for `ONLINE` or red dot for `OFFLINE`.
- **Telemetry Refresh Button:** Manual refetch button (`Refresh station telemetry`).
- **Brand Logo (`POLAROPS`):** Clicking the brand icon or name returns the user immediately to the Command Center (`/`).

---

## SECTION 4 — RECOMMENDED FIRST-TIME DEMO PATH (5–10 MINUTES)

Follow this 10-step sequence for the strongest end-to-end demonstration:

```text
Command Center (/) 
    ↓ Click "Inspect Asset G-02"
Asset Intelligence (/assets/G-02) 
    ↓ Review 91 Risk & Blast Radius
Resources & Fuel (/resources) 
    ↓ Inspect Inventory & Resupply
What-If Scenarios (/scenarios) 
    ↓ Run 72h Failure Simulation
Resilience & Disruption (/resilience) 
    ↓ Simulate Outage & Buffer Science
Incident Workspace & Operational Memory 
    ↓ Log Action & Record Lesson
Command Center (/) [Closed Loop]
```

### Step 1: Establish Station Context
- **Where am I:** Command Center (`/`).
- **What to look at:** Top status cards (Station Health 85/100, Fuel Runway 70.3 days, Ambient -28.5°C, Wind 42 kt Blizzard).
- **Presenter says:** *"Welcome to PolarOps, the Operational Digital Twin for Indian Antarctic Stations. We are currently monitoring Bharati Station during winter darkness. The station is under a blizzard warning with 42-knot winds and an ambient temperature of -28.5°C."*

### Step 2: Spot the Hero Anomaly
- **Where am I:** Command Center (`/`).
- **What to look at:** The amber **CRITICAL OPERATIONAL EVENT** banner.
- **Presenter says:** *"Our telemetry monitoring detects an active anomaly: Backup Diesel Generator G-02 is experiencing severe bearing vibration at 4.8 mm/s, exceeding its 4.0 mm/s safety threshold."*
- **What to click:** Click **`Inspect Asset G-02`** inside the critical event banner.

### Step 3: Understand Multi-Factor Risk
- **Where am I:** Asset Intelligence (`/assets/G-02`).
- **What to look at:** 24h Telemetry Trends (Vibration 4.8 mm/s RISING, Coolant 94.2°C RISING, Efficiency 32.4% FALLING) and the **91/100 Composite Risk Score**.
- **Presenter says:** *"In a standard SCADA dashboard, an operator just sees a flashing red sensor. In PolarOps, our explainable risk engine computes a 91 out of 100 critical risk score by combining vibration severity, coolant temperature excursion, sub-zero blizzard weather, and single-point heating reliance."*

### Step 4: Trace the Multi-Hop Blast Radius
- **Where am I:** Asset Intelligence (`/assets/G-02`), scroll down to **Multi-Hop Dependency Blast Radius**.
- **What to look at:** Traversal depth showing `G-02` → `Secondary Heat Loop B` → `Habitat Zone 2 Heating` & `Potable Water Melt Tank`.
- **Presenter says:** *"Why does G-02 matter? Tracing relational dependencies across 3 hops reveals that G-02's exhaust heat exchanger directly powers Secondary Heat Loop B, which heats the living quarters in Zone 2 and melts ice for drinking water. If G-02 fails, crew habitat freezes."*

### Step 5: Check Local Spares & Recovery Constraints
- **Where am I:** Asset Intelligence (`/assets/G-02`), scroll to **Maintenance & Recovery Status**.
- **What to look at:** Work Order `MWO-2026-089` (BLOCKED) and Missing Spare `SK-402`.
- **Presenter says:** *"Can we repair G-02 immediately? The system shows work order MWO-2026-089 is blocked because warehouse stock of the required seal kit SK-402 is zero."*

### Step 6: Verify Fuel & Supply Logistics
- **Where am I:** Click **`Resources & Fuel`** in top navigation (`/resources`).
- **What to click:** Click the **`Inventory & Spares`** tab, then the **`Resupply Logistics`** tab.
- **What to look at:** Stock: 0 Units. Inbound vessel: *MV Vasiliy Golovnin* is in transit with ETA ≈ 11 Days carrying replacement seal kits.
- **Presenter says:** *"Switching to Cross-Domain Logistics reveals that the next expedition vessel, MV Vasiliy Golovnin, is still 11 days away across the Southern Ocean. We cannot repair G-02 until the ship arrives."*

### Step 7: Run What-If Scenario Simulation
- **Where am I:** Click **`What-If Scenarios`** in top navigation (`/scenarios`).
- **What to click:** Select **72h** duration, ensure **Generator Failure** on **G-02** is selected, and click **`Run Simulation`**.
- **What to look at:** Impact deltas: Generation Capacity drops from 600 kW to 300 kW (-300 kW), Station reduced to N-0 redundancy, Risk escalates to 95/100, and 2 critical services become degraded.
- **Presenter says:** *"Before taking G-02 offline for emergency inspection, the commander runs a stateless what-if simulation. The engine calculates that a 72-hour shutdown at -28.5°C drops generation capacity by 300 kW, leaves the station on a single generator, and degrades Habitat Zone 2 heating."*

### Step 8: Simulate Satellite Blackout & Edge Continuity
- **Where am I:** Click **`Resilience & Disruption`** in top navigation (`/resilience`).
- **What to click:** Click the red **`Simulate Outage`** button.
- **What to look at:** Connectivity flips to **OFFLINE (Local Autonomous Mode)**. Top indicator turns red. Unsynced items banner appears.
- **Presenter says:** *"Now a severe Antarctic blizzard disrupts satellite uplink. PolarOps immediately transitions to local edge autonomous mode. The station continues monitoring and operating without depending on cloud connectivity."*

### Step 9: Buffer Scientific Observations & Synchronize
- **Where am I:** Resilience Workspace (`/resilience`).
- **What to click:**
  1. Click tab **`2. Science Buffer (S-17)`**.
  2. Click **`+ Buffer Reading (TECU)`** on Auroral Radar S-17. Notice the local buffer increment.
  3. Click the green **`Restore & Reconcile`** button in the header.
- **What to look at:** Link restores to **ONLINE**. The Deterministic Priority Queue synchronizes in strict order (P0 before P1, P2, P3), and all items show **RECONCILED** with verified canonical **SHA-256 checksums**.
- **Presenter says:** *"When satellite link restores, all offline operational events and buffered science readings flush in deterministic priority order. Cryptographic SHA-256 hashes guarantee zero data corruption across the intermittent link."*

### Step 10: Capture Operational Memory
- **Where am I:** Resilience Workspace (`/resilience`), click tab **`4. Operational Memory`**.
- **What to look at:** Search box and post-mortem record `MEM-2025-W02` (*2025 Winter Generator Tripping Incident & Boiler Transfer*).
- **Presenter says:** *"Finally, the operational loop closes with learning. When incidents are resolved, operators record decisions, outcomes, and lessons into institutional memory—ensuring the next expedition crew 6 months from now knows how to handle identical emergencies."*

---

## SECTION 5 — COMMAND CENTER GUIDE (`/`)

The Command Center provides the Common Operational Picture (COP).

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [STATION STATUS]          [FUEL & RUNWAY]            [ENVIRONMENT]       [COMMS]       │
│ WARNING · 85/100          142,500 L · 70.3d          -28.5°C · 42 kt     ONLINE · VSAT │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ⚠️ CRITICAL OPERATIONAL EVENT: Generator G-02 High Vibration Anomaly [Inspect Asset →] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ STATION SPATIAL TOPOLOGY: Zone 1 (Powerhouse) ── Zone 2 (Habitat) ── Zone 3 (Science)  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SUBSYSTEM HEALTH GRID: Power (Degraded) | HVAC (Warning) | Water (Nominal) | Comms     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Interpreting the 4 KPI Cards
1. **Station Status:** Displays composite station health score (85/100 for Bharati) and active issue count. Status is `WARNING` due to G-02 anomaly.
2. **Fuel & Runway:**
   - Remaining stock: `142,500 L` (`[MEASURED]` from tank telemetry).
   - Estimated runway: `≈ 70.3 days` (`[DERIVED]` based on 84.5 L/h burn rate).
   - Target benchmark: 90 days winter baseline (showing a 19.7-day gap until the resupply ship arrives in 11 days).
3. **Environment:**
   - Ambient temperature: `-28.5°C` with wind chill of `-41.2°C` (`[MEASURED]`).
   - Wind speed: `42 kt` with active `BLIZZARD_WARNING` (`[FORECAST]`).
4. **Communications:**
   - Status: `ONLINE` on `VSAT Ku-Band`.
   - Latency / Freshness: `680 ms · Real-time`.
   - Telemetry Quality: `NOMINAL (99.8%)`.

### Spatial Topology Schematic
- **Zone 1 · Powerhouse:** Contains Generator G-01 (100% nominal) and Generator G-02 (62% degraded, flashing amber alert). **Clicking G-02 immediately opens Asset Intelligence.**
- **Zone 2 · Main Habitat & HVAC:** Shows interconnected power buses and thermal heating loops.
- **Zone 3 · Science & Comms:** High-frequency auroral radar mast and satellite dome.

### Station Switching (Bharati vs. Maitri)
Use the `STATION:` dropdown in the header to switch between stations:
- **Bharati Station (Larsemann Hills):** Shows winter blizzard conditions, 85/100 health, active G-02 critical event banner, and degraded powerhouse.
- **Maitri Station (Schirmacher Oasis):** Shows nominal winter operations, 98/100 health, `NO CRITICAL ANOMALIES DETECTED` green banner, and all nominal subsystems.

---

## SECTION 6 — G-02 ASSET INTELLIGENCE GUIDE (`/assets/G-02`)

Generator G-02 is the platform's **hero asset demonstration**.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Station Command Center                        ROUTE: /assets/G-02 [DERIVED]  │
│ [CRITICAL] Diesel Generator G-02                        HEALTH: 62/100 (WARNING)       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 24H TELEMETRY TRENDS:                                                                  │
│ • Vibration: 4.8 mm/s (ABOVE 4.0 LIMIT)  ↑ RISING                                      │
│ • Coolant Temp: 94.2°C (ABOVE 90 LIMIT)  ↑ RISING                                      │
│ • Fuel Efficiency: 32.4% (BELOW 35% MIN) ↓ FALLING                                     │
│ • Electrical Load: 225.0 kW              ↑ NOMINAL                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ DETERMINISTIC OPERATIONAL RISK ENGINE: 91 / 100 [CRITICAL OPERATIONAL RISK]            │
│ 1. Vibration Excursion (+30 pts)  2. Thermal Margin (+20 pts)  3. Extreme Weather (+15)│
│ 4. Single-Point Dependency (+15)  5. Blocked Spare (+10)       6. Deferred MWO (+5)    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ MULTI-HOP DEPENDENCY BLAST RADIUS (Depth: 3 Hops):                                     │
│ G-02 ──[powers]──> Secondary Heat Loop B ──[heats]──> Habitat Zone 2 & Water Melt Tank │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ MAINTENANCE & RECOVERY: Work Order MWO-2026-089 (BLOCKED: Spare SK-402 has 0 stock)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Differences PolarOps Demonstrates
| Standard SCADA Monitoring | PolarOps Digital Twin |
|---|---|
| "Vibration is 4.8 mm/s." | "Vibration is 4.8 mm/s, rising +2.6 mm/s over 24h, combined with 94.2°C coolant and subzero weather." |
| An isolated generator warning. | Multi-hop dependency graph shows failure will freeze Zone 2 habitat and shut down potable water melting. |
| Suggests immediate maintenance. | Discovers maintenance work order MWO-2026-089 is blocked by zero warehouse stock of seal kit SK-402. |
| Unclear operational consequence. | Evaluates recovery exposure as HIGH and tracks the resupply ship 11 days away. |

---

## SECTION 7 — RESOURCES & LOGISTICS GUIDE (`/resources`)

Click **`Resources & Fuel`** in the top navigation to inspect station life-support reserves across 4 dedicated tabs:

### Tab 1: Energy & Fuel (`energy-fuel`)
- **Remaining Fuel Stock:** `142,500 L` (`[MEASURED]`, 57.0% of 250,000 L tank capacity).
- **Estimated Runway:** `≈ 70.3 Days` (`[DERIVED]`). Highlights a 19.7-day gap against the 90-day winter target.
- **Hourly Burn Rate:** `84.5 L/h` (`[DERIVED]`, equivalent to 2,028 L/day).
- **Online Generation Fleet:** `600 kW` across 2 active gensets.
- **Deterministic Thermal Balance Model:** Displays modeled thermal demand (`252.2 kW` to sustain +20°C indoors at -28.5°C outside) and electrical demand (`201.2 kW`).

### Tab 2: Inventory & Spares (`inventory`)
- Displays warehouse critical spares table.
- Highlights part **`SK-402 HERO SPARE`**:
  - Description: *Generator G-02 Gasket & Fuel Pump Seal Kit*.
  - Stock Available: `0 Units` (`CRITICAL SHORTAGE`).
  - Rack Location: *Powerhouse Spares Rack B-04*.

### Tab 3: Resupply Logistics (`resupply`)
- Displays scheduled inbound maritime voyages.
- Highlights expedition vessel **`MV Vasiliy Golovnin`**:
  - Status: `IN_TRANSIT`.
  - Estimated ETA: `≈ 11 Days` (Late Winter Voyage window).
  - Manifest: Carries `2x SK-402` specifically earmarked for G-02 recovery.

### Tab 4: G-02 Recovery Chain (`recovery`)
- Synthesizes the full operational dependency chain in a single 5-step visual flow:
  1. **STEP 1: ASSET** → Diesel Generator G-02 (Critical).
  2. **STEP 2: WORK ORDER** → MWO-2026-089 (Blocked Parts).
  3. **STEP 3: REQUIRED SPARE** → SK-402 (Gasket & Seal Kit).
  4. **STEP 4: WAREHOUSE STOCK** → 0 Units (Critical Shortage).
  5. **STEP 5: INBOUND VESSEL** → MV Vasiliy Golovnin (ETA ≈ 11 Days).
- Evaluates **OPERATIONAL RECOVERY EXPOSURE: HIGH**.

---

## SECTION 8 — SCENARIO SIMULATION GUIDE (`/scenarios`)

Click **`What-If Scenarios`** to access the stateless predictive consequence simulator.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ CONFIGURATOR: [Generator Failure ▼]  TARGET: [G-02 ▼]  DURATION: [24h] [48h] [72h]     │
│ COLD SNAP SLIDER: [-28.5°C ────────●───────]            [ ▶ RUN SIMULATION ]           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SIMULATION RESULTS (Hypothetical 72h Outage of G-02 at -28.5°C):                       │
│ • Generation Capacity: 600 kW ──► 300 kW (-300 kW delta)                               │
│ • Redundancy: 2 Units ──► 1 Unit (N-0 Single Unit Operation)                          │
│ • Composite Risk: 91 ──► 95 (+4 Risk Escalation)                                       │
│ • Downstream Services Exposed (2):                                                     │
│   1. Habitat Zone 2 Heating (LIFE_SUPPORT) ──► DEGRADED                                │
│   2. Potable Water Melt Tank (WATER_SUPPLY) ──► DEGRADED                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### How to Run a Scenario
1. **Scenario Type:** Select `Generator Failure (Asset Offline)` (default).
2. **Target Asset:** Select `Generator G-02 (Hero Anomaly)` or `Generator G-01`.
3. **Failure Duration:** Choose `24h`, `48h`, or `72h`.
4. **Cold Snap Slider:** Drag the slider between `-40.0°C` and `-15.0°C` to model severe weather intensification. Click `Reset to Baseline` to return to current weather (-28.5°C).
5. **Run Simulation:** Click the purple **`Run Simulation`** button.

### Understanding the Results
- **Impact Deltas:** The UI compares current baseline against simulated scenario side-by-side.
- **Service Exposure:** Highlights specific life-support systems that transition from `NOMINAL` to `DEGRADED`.
- **Stateless Guarantee:** Emphasize to viewers that this calculation runs in-memory. **It does not alter live database telemetry or trigger real equipment shutdowns.**

---

## SECTION 9 — RESILIENCE & OFFLINE OPERATIONS GUIDE (`/resilience`)

Click **`Resilience & Disruption`** to demonstrate how PolarOps operates through Antarctic communications blackouts.

### The Two State Machines (Link vs. Queue)
> [!IMPORTANT]
> **Architectural Boundary:** PolarOps strictly separates **Communication Link State** from **Queue Item State**.
> - **Link State:** `ONLINE → OFFLINE → RESTORING → SYNCING → ONLINE`
> - **Queue Item State:** `PENDING → TRANSFERRING → VERIFIED → ACKNOWLEDGED → RECONCILED` (with `FAILED_RETRY`)

```text
COMMS LINK:   [ ONLINE ] ──(Simulate Outage)──► [ OFFLINE ] ──(Restore & Sync)──► [ ONLINE ]
                                                      │                               ▲
QUEUE ITEMS:  [ PENDING ] ────────────► [ TRANSFERRING ] ──► [ VERIFIED ] ────────────┘
                                                      │            ▲
                                                      └──► [ FAILED_RETRY ]
```

### Deterministic Priority Queue (P0–P3)
Queue items are synchronized in strict mathematical order:
1. **Priority Tier (`priority ASC`):**
   - **P0: Critical** (Life-support shutdowns, active fires, explosive risk)
   - **P1: High** (Generator failure, maintenance blockers, urgent medical)
   - **P2: Important** (Science experiment logs, non-critical telemetry)
   - **P3: Routine** (General inventory consumption, housekeeping)
2. **Timestamp (`created_at ASC`):** FIFO within the same priority tier.
3. **Identifier (`id ASC`):** Deterministic tie-breaking.

### Canonical UTF-8 SHA-256 Checksums
Every queue item payload is hashed using a canonical JSON serializer (sorted keys, compact separators, UTF-8 encoding). The SHA-256 hash guarantees that messages stored locally during an outage match the remote server's reconciled copy byte-for-byte upon restoration.

### Interactive Demonstration Controls
- **`Simulate Outage` (Red Button):** Cuts the satellite link. UI switches to `OFFLINE (Local Autonomous Mode)`.
- **`Restore & Reconcile` (Green Button):** Restores connectivity. Flushes all pending and transferring items through SHA-256 verification to `RECONCILED`.
- **`Reset Simulation` (Gray Button):** Resets all Day 4 resilience simulation states back to the canonical baseline without altering core station resources or asset health.

---

## SECTION 10 — SCIENCE DATA CONTINUITY GUIDE

Located under **`Resilience & Disruption` → Tab `2. Science Buffer (S-17)`**.

### Hero Instrument: S-17 Auroral Radar
- **Equipment:** S-17 Auroral Ionospheric Radar Array (RADAR_SPECTROMETER).
- **Status:** Power `ACTIVE`, Health `NOMINAL`.
- **Local Edge Buffer:** Holds observations locally when satellite uplink is lost.

### Demonstrating Scientific Continuity
1. Sever satellite connectivity by clicking **`Simulate Outage`**.
2. Switch to tab **`2. Science Buffer (S-17)`**.
3. Click the **`+ Buffer Reading (TECU)`** button multiple times.
4. Observe the local buffer count increment (e.g. `1 queued`, `2 queued`).
5. Click **`Restore & Reconcile`** in the header.
6. The buffered ionospheric radar readings immediately synchronize into the priority queue with SHA-256 verification, demonstrating scientific data preservation without telemetry loss.

---

## SECTION 11 — INCIDENT WORKSPACE GUIDE

Located under **`Resilience & Disruption` → Tab `3. Incident Blast Radius`**.

### Hero Incident: `INC-2026-04`
- **Title:** *Generator G-02 High Vibration Anomaly & Thermal Loop Degradation*.
- **Severity:** `MAJOR`.
- **Lifecycle Status:** `ACTIVE → CONTAINED → RESOLVED`.

### Reused Day 2 Intelligence
The incident workspace directly reuses the backend dependency BFS traversal and risk engine:
- **Downstream Equipment:** Shows *Habitat Heating Thermal Loop B Unit* and *Research Power Distribution Unit*.
- **Composite Risk Score:** Live `91 / 100`.
- **Affected Services:** *Habitat Zone 2 Heating, Station Main Electrical Grid*.

### Human-in-the-Loop Action Logging
1. Enter an action code (e.g. `PURGE_FUEL_LINE` or `PREHEAT_BOILER_B01`).
2. Enter a description of findings (e.g. `Secondary coolant valve inspected and cleared`).
3. Click **`Log Response Action`**.
4. The action appears immediately in the **Incident Audit Trail** with operator badge and timestamp.

### Critical Rule: Memory Separation
> [!IMPORTANT]
> **Resolving an incident does NOT automatically create operational memory.**  
> Clicking `Resolve Incident` marks the incident resolved in the database. Operational memory requires an explicit human operator decision to document *why* the action succeeded and *what lesson* future expeditions should remember.

---

## SECTION 12 — OPERATIONAL MEMORY GUIDE

Located under **`Resilience & Disruption` → Tab `4. Operational Memory`**.

### Purpose
Antarctic station crews rotate every 6 to 12 months. When an experienced expedition departs, operational wisdom is often lost. PolarOps preserves this knowledge in an indexed, searchable institutional archive.

### Pre-Seeded Institutional Memory
- **Record ID:** `MEM-2025-W02` (Dated August 23, 2025).
- **Title:** *2025 Winter Generator Tripping Incident & Boiler Transfer*.
- **Context & Decision:** During a blizzard, G-01 tripped unexpectedly. The station transferred 30% thermal load to Auxiliary Boiler B-01 and shed the science radar.
- **Lesson Learned:** *Boiler B-01 takes 35 minutes to reach full heating capacity in winter ambient (-30°C). Always initiate boiler preheat sequence before taking primary generator offline.*

### How to Create a New Memory
1. Navigate to tab **`3. Incident Blast Radius`**.
2. Click the blue **`Record to Memory`** button on incident `INC-2026-04`.
3. In the modal, review or edit the 4 structured post-mortem fields:
   - **Decision:** Load transfer to auxiliary heating.
   - **Action Taken:** Specific engineering adjustments made.
   - **Outcome:** Resulting stability of the station grid.
   - **Lesson Learned:** Specific instruction for future expedition engineers.
4. Click **`Save to Memory Archive`**.
5. Switch to tab **`4. Operational Memory`** and search for your lesson using the keyword filter.

---

## SECTION 13 — ONE COMPLETE STORYLINE: "THE G-02 MID-WINTER CRISIS"

Use this cohesive, dramatic narrative during a presentation:

1. **The Situation:** Mid-winter at Bharati Station. Exterior temperature is -28.5°C with a 42-knot blizzard raging outside. The station is sealed and reliant on diesel power for survival.
2. **The Anomaly:** Command Center triggers an alert. Generator G-02's bearing vibration spikes to 4.8 mm/s.
3. **The Hidden Consequence:** An untrained operator might assume a backup generator failure is harmless because G-01 is running. PolarOps' Dependency Engine reveals G-02 provides waste exhaust heat to Secondary Heat Loop B. If G-02 shuts down, Zone 2 living quarters will freeze in subzero cold.
4. **The Supply Bottleneck:** The operator checks if G-02 can be overhauled. Cross-Domain Logistics shows the required seal kit SK-402 has zero warehouse stock. Resupply vessel *MV Vasiliy Golovnin* is 11 days away across frozen seas.
5. **The Simulation:** The commander opens the Scenario Engine and tests a 72-hour shutdown. The simulation confirms generation will drop to 300 kW and living quarters heating will degrade.
6. **The Blizzard Strike:** Mid-crisis, the blizzard severs the satellite link. Comms drop offline.
7. **Local Edge Autonomy:** The station does not crash. PolarOps continues running locally on edge hardware. Science observations continue buffering in RAM and local storage.
8. **Reconnection & Truth:** When satellite link restores, all offline logs and science packets sync automatically in priority order with SHA-256 cryptographic verification.
9. **Mitigation:** The crew transfers heat load to Auxiliary Boiler B-01, preheating it according to lessons learned from the 2025 winter expedition.
10. **Institutional Learning:** The commander logs the containment action and permanently records the operational post-mortem into PolarOps Memory.

---

## SECTION 14 — "WHAT TO CLICK" QUICK REFERENCE

| Operator Goal | Where to Go | What to Click | Expected Result |
|---|---|---|---|
| **Switch Station** | Header | `STATION:` dropdown → select `Maitri Station` | View updates to Maitri (98/100 health, 0 anomalies, green banner). |
| **Inspect G-02 Anomaly** | Command Center (`/`) | Amber banner → `Inspect Asset G-02` | Navigates to `/assets/G-02` with 24h telemetry charts and 91 risk score. |
| **Examine Blast Radius** | Asset View (`/assets/G-02`) | Scroll to `Multi-Hop Dependency Blast Radius` | Visualizes 3-hop cascade from G-02 to Zone 2 habitat and water melt tank. |
| **Check Fuel Runway** | Resources (`/resources`) | `Energy & Fuel` tab | Displays 142,500 L remaining fuel and 70.3 days estimated runway. |
| **Check Missing Spare** | Resources (`/resources`) | `Inventory & Spares` tab | Displays Part `SK-402 HERO SPARE` with 0 available units (Critical Shortage). |
| **Track Resupply Ship** | Resources (`/resources`) | `Resupply Logistics` tab | Displays *MV Vasiliy Golovnin* in transit with ETA ≈ 11 Days carrying SK-402. |
| **Simulate 72h Outage** | Scenarios (`/scenarios`) | Select `72h` → click `Run Simulation` | Displays -300 kW capacity drop, +4 risk escalation, and degraded services. |
| **Simulate Comms Blackout** | Resilience (`/resilience`) | Red `Simulate Outage` button | Connectivity switches to `OFFLINE` (Local Autonomous Mode); top dot turns red. |
| **Buffer Science Data** | Resilience (`/resilience`) | Tab `2. Science Buffer` → `+ Buffer Reading` | Increments local edge buffer count for Auroral Radar S-17. |
| **Restore & Reconcile** | Resilience (`/resilience`) | Green `Restore & Reconcile` button | Link restores to `ONLINE`; priority queue flushes with verified SHA-256 hashes. |
| **Log Incident Action** | Resilience (`/resilience`) | Tab `3. Incident Blast Radius` → fill form → `Log Response Action` | Action appears in live Incident Audit Trail with timestamp. |
| **Search Operational Memory** | Resilience (`/resilience`) | Tab `4. Operational Memory` → type `Boiler` | Filters memory cards to reveal record `MEM-2025-W02`. |
| **Reset Demo State** | Resilience (`/resilience`) | Gray `Reset Simulation` button | Restores all simulation states without mutating canonical database records. |

---

## SECTION 15 — SIH JUDGE WALKTHROUGH (2–3 MINUTES)

Use this compressed, high-impact script when presenting to SIH judges:

```text
⏱️ 0:00 – 0:25 | COMMAND CENTER & PROBLEM STATEMENT
"Good morning, judges. In Antarctica, isolated research stations face extreme sub-zero blizzards, single-point engineering failures, and disrupted satellite links. 
PolarOps is the first Operational Digital Twin built specifically for Indian Antarctic Stations. 
Here on the Command Center for Bharati Station, we see live weather at -28.5°C, 70 days of fuel runway, and an active critical alert on Generator G-02."

⏱️ 0:25 – 0:55 | SENSE & UNDERSTAND (ASSET INTELLIGENCE & RISK)
[Click 'Inspect Asset G-02']
"A standard SCADA dashboard only tells the operator that vibration is 4.8 mm/s. PolarOps explains WHY this matters. 
Our explainable risk engine evaluates 6 weighted factors—including ambient cold and single-point heating reliance—to produce a 91 critical risk score. 
More importantly, our dependency engine traces 3 hops downstream to reveal that G-02's exhaust heats the living quarters in Zone 2. If G-02 fails, crew habitat freezes."

⏱️ 0:55 – 1:25 | PREDICT & SIMULATE (LOGISTICS & WHAT-IF)
[Click 'Resources & Fuel' → 'Resupply Logistics', then click 'What-If Scenarios' → 'Run Simulation']
"Can we fix G-02? Checking logistics shows local spare seals are at zero, and the resupply ship MV Vasiliy Golovnin is 11 days away. 
Before taking equipment offline, the commander runs our What-If Scenario Engine. A 72-hour simulation proves capacity drops by 300 kW, leaving zero generator redundancy."

⏱️ 1:25 – 2:05 | OPERATE THROUGH DISRUPTION (RESILIENCE & EDGE CONTINUITY)
[Click 'Resilience & Disruption' → click 'Simulate Outage']
"Now a severe storm cuts satellite communications. Notice the system instantly transitions to local edge autonomous mode. Station monitoring never stops. 
[Click 'Science Buffer' → click '+ Buffer Reading'] 
Scientific observations from our ionospheric radar buffer locally in edge memory. 
[Click 'Restore & Reconcile'] 
When satellite connectivity returns, our deterministic queue flushes in strict P0 to P3 priority order, validated by canonical SHA-256 checksums."

⏱️ 2:05 – 2:30 | DECIDE & LEARN (INCIDENTS & OPERATIONAL MEMORY)
[Click 'Operational Memory']
"Finally, PolarOps turns operational experience into institutional memory. Searchable post-mortems ensure that lessons learned by today's crew protect the next wintering team 6 months from now. 
PolarOps transforms fragmented sensor data into explainable context, proactive simulation, resilient edge continuity, and perpetual learning. Thank you."
```

---

## SECTION 16 — WHAT NOT TO CLAIM

To maintain absolute scientific and engineering credibility, **never make the following claims during evaluations:**

- ❌ **Do NOT claim live NCPOR telemetry:** We are not tapping into active satellite feeds from Goa or Antarctica. All telemetry is realistic, deterministic synthetic data.
- ❌ **Do NOT claim physical SCADA integration:** The software models Modbus/OPC-UA architectures, but runs on cloud and web demonstration infrastructure.
- ❌ **Do NOT claim real satellite hardware:** Outages and bandwidth constraints are software simulations, not physical Iridium or Inmarsat transceivers.
- ❌ **Do NOT claim autonomous station control:** PolarOps is strictly a **decision-support platform**. It does not remotely actuate physical breakers, start generators, or purge valves without human operators.
- ❌ **Do NOT claim artificial intelligence or LLM generation:** The risk engine, dependency traversal, and scenario simulator are **deterministic, explainable mathematical algorithms** (BFS graph algorithms and linear thermodynamic equations). No unpredictable AI or black-box models are deployed in the current MVP.

---

## SECTION 17 — TESTING THE LIVE MVP YOURSELF (CHECKLIST)

Use this checklist to verify the deployed application yourself:

- [ ] **Open Production App:** Visit [https://polarops-two.vercel.app](https://polarops-two.vercel.app). Ensure page loads cleanly without 404 or white screen.
- [ ] **Verify Header Metadata:** Confirm station is `Bharati Station`, mode is `WINTER OPS`, and connectivity dot is green `ONLINE`.
- [ ] **Test Station Switcher:** Switch dropdown to `Maitri Station`. Confirm station health becomes `98/100` and banner shows `NO CRITICAL ANOMALIES DETECTED`. Switch back to `Bharati Station`.
- [ ] **Open Asset Intelligence:** Click `Inspect Asset G-02` in the critical event banner. Confirm route is `/assets/G-02`.
- [ ] **Verify Telemetry Trends:** Confirm vibration displays `4.8 mm/s` (`ABOVE THRESHOLD`) and coolant displays `94.2°C`.
- [ ] **Verify Explainable Risk:** Confirm composite risk score displays `91` with `CRITICAL OPERATIONAL RISK` label.
- [ ] **Verify Dependency Blast Radius:** Confirm 3-hop graph cards display `Secondary Heat Loop B`, `Habitat Zone 2 Heating`, and `Potable Water Melt Tank`.
- [ ] **Open Resources View:** Click `Resources & Fuel` in header. Confirm route is `/resources`.
- [ ] **Inspect Inventory Tab:** Click `Inventory & Spares`. Confirm Part `SK-402 HERO SPARE` shows `0 Units` available.
- [ ] **Inspect Resupply Tab:** Click `Resupply Logistics`. Confirm vessel `MV Vasiliy Golovnin` displays `ETA ≈ 11 Days`.
- [ ] **Inspect Recovery Chain Tab:** Click `G-02 Recovery Chain`. Confirm 5-step recovery visualization loads.
- [ ] **Run What-If Scenario:** Click `What-If Scenarios` in header. Select `72h` and click `Run Simulation`. Confirm impact deltas show `-300 kW` capacity and `+4` risk escalation.
- [ ] **Simulate Satellite Outage:** Click `Resilience & Disruption`. Click `Simulate Outage`. Confirm connectivity switches to `OFFLINE`.
- [ ] **Buffer Science Reading:** Under Resilience, click tab `2. Science Buffer (S-17)`. Click `+ Buffer Reading (TECU)` twice. Confirm queued count increases.
- [ ] **Restore & Reconcile:** Click `Restore & Reconcile`. Confirm connectivity returns to `ONLINE` and queue items show `RECONCILED` with SHA-256 hashes.
- [ ] **Log Incident Action:** Under Resilience, click tab `3. Incident Blast Radius`. Enter action code `PURGE_FILTER` and description `Cleared ice blockage`. Click `Log Response Action`. Confirm item appears in audit trail.
- [ ] **Search Operational Memory:** Under Resilience, click tab `4. Operational Memory`. Type `Boiler` in search box. Confirm record `MEM-2025-W02` remains visible.
- [ ] **Test Direct Route Refresh (SPA Routing):** While on `/resources` or `/resilience`, hit browser reload (`F5` or `Ctrl+R`). Confirm page reloads cleanly without Vercel 404 error.

---

## SECTION 18 — TROUBLESHOOTING

| Symptom | Probable Cause | Resolution |
|---|---|---|
| **Page displays "Connecting to station telemetry bus..." indefinitely** | Render backend container cold start. Free tier containers spin down when inactive. | Wait 20–30 seconds on first request. Or open [https://polarops-api.onrender.com/health](https://polarops-api.onrender.com/health) in a new tab to wake the backend. |
| **Error banner: "Station Telemetry Feed Unavailable"** | Temporary network interruption between client and Render. | Click the `Retry Telemetry Connection` button in the error card. |
| **Direct browser reload produces Vercel 404 error** | Missing SPA rewrite rules in `vercel.json`. | Verified solved. `frontend/vercel.json` contains `/(.*) -> /index.html` rewrite. |
| **Queue table displays unexpected items after extensive testing** | Residual simulation state from previous test runs. | Click the gray **`Reset Simulation`** button in the top right of the Resilience workspace (`/resilience`). |
| **CORS error in browser console** | Accessing backend from unauthorized preview domain. | Backend supports comma-separated `FRONTEND_ORIGIN` strings configured in Render dashboard. |

---

## SECTION 19 — FUTURE WORK (ROADMAP BEYOND MVP)

The current MVP represents a fully functional, verified digital twin prototype. Future development phases will incorporate:

1. **Physical Edge Gateway & Protocols:** Integration of industrial edge IoT gateways supporting Modbus TCP, OPC-UA, and CAN bus protocols for physical station generators and HVAC controllers.
2. **Real Satellite Link Adapters:** Physical software adapters interfacing with Iridium Certus and Inmarsat BGAN satellite modems to manage physical data throttling and bandwidth budget allocation.
3. **Validated Thermodynamic Models:** Collaboration with NCPOR glaciologists and engineers to replace linear prototype heat-loss equations with dynamic CFD building thermal models calibrated against real Antarctic winter telemetry.
4. **Multi-Station Fleet Federation:** Centralized Antarctic Operations Command in Goa managing simultaneous digital twins for Bharati, Maitri, and future planned stations (e.g. Maitri-II).
5. **Role-Based Access Control (RBAC):** Station Commander, Lead Mechanical Engineer, Science Lead, and Logistics Planner permission tiers with cryptographic CAC/PKI authentication.
6. **Deterministic AI Copilot:** Introduction of an explainable Retrieval-Augmented Generation (RAG) assistant indexing station technical manuals, spare parts catalogs, and historical expedition diaries—strictly bounded by deterministic verification gates.
