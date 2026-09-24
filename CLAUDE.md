# CLAUDE.md — PolarOps UI Design & Frontend Architecture Guide

> **Context**: SIH 2026 (SIH26060) — Digital Platform for efficient remote management of Indian Antarctic Research Stations (Bharati & Maitri) for the **National Centre for Polar and Ocean Research (NCPOR)**, Ministry of Earth Sciences, Government of India.
> **Scope**: Visual Design System, Information Architecture, Screen Specifications, Component Guidelines, and UI Generation Prompts for Claude.

---

## 1. Executive Summary & Brand Identity

**PolarOps** is an **Operational Digital Twin & Mission Control Platform** for isolated Antarctic research stations operating in sub-zero (-40°C), blizzard-prone, satellite-constrained environments.

When an operational change occurs at the station, PolarOps executes the core loop:
$$\text{SENSE} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{PREDICT} \longrightarrow \text{SIMULATE} \longrightarrow \text{DECIDE} \longrightarrow \text{LEARN}$$

### Visual Tone & Aesthetic Direction
- **Calm Authority & Mission-Critical Precision**: Operators make high-stakes life-support and energy decisions under extreme fatigue and stress. The UI must eliminate cognitive clutter and visual noise.
- **Scientific & Industrial SCADA Aesthetic**: Inspired by modern SCADA HMI panels, observatory telemetry dashboards, aviation weather briefing consoles (NOAA, ESA), and institutional command desks.
- **High Data Density with Strict Hierarchy**: Information-dense yet instantly legible. Operators need scannable health summaries, synchronized time-series sensor graphs, spatial topologies, and dependency blast radiuses.

### Anti-Patterns — NEVER USE in PolarOps
- ❌ **NO SaaS Marketing Glitz**: No purple/indigo/pink gradient buttons, floating glow blobs, or marketing hero copy.
- ❌ **NO Glassmorphism**: No heavy frosted blur backgrounds (`backdrop-blur-xl` over saturated graphics) that compromise text contrast.
- ❌ **NO Generic Emojis**: Never use emojis (🚨, ⚠️, ❄️, ⚡) as UI icons. Use clean **Lucide React** stroke icons (`ShieldAlert`, `AlertTriangle`, `Activity`, `Flame`, `Zap`, `Radio`).
- ❌ **NO Conversational AI Chatbot Popups**: PolarOps is a deterministic digital twin. Insights come from explainable decision engines, causal graphs, and mathematical balance models, NOT chat bubbles.
- ❌ **NO Naked Telemetry**: Never show a raw number without its engineering unit, status color, and telemetry provenance metadata (`MEASURED`, `DERIVED`, `FORECAST`, `SCENARIO`).

---

## 2. Design System & Semantic Token Reference

All styles use **Tailwind CSS v4** mapped to CSS custom properties defined in `index.css`. Components must **never** hardcode arbitrary Tailwind colors (e.g. `bg-blue-500`, `text-red-400`); always use the semantic tokens.

### A. Color Palettes

| Token | Light Theme (`:root`) | Dark Theme (`.dark`) | Purpose / Application |
|---|---|---|---|
| `--bg-primary` | `#f8f9fb` (Off-white) | `#0f1117` (Deep charcoal) | Main canvas background |
| `--bg-secondary` | `#ffffff` (Pure white) | `#181b24` (Elevated charcoal) | Cards, panels, tables, modal containers |
| `--bg-tertiary` | `#f0f2f5` (Cool gray) | `#1e2230` (Muted recess) | Inputs, recessed metrics, code blocks |
| `--bg-elevated` | `#ffffff` (Elevated) | `#242838` (Elevated layer) | Popovers, dropdown menus, slide-out drawers |
| `--fg-primary` | `#1a1d23` (Near-black) | `#e4e8f0` (High-contrast white) | Primary headings, titles, key readings |
| `--fg-secondary` | `#4a5060` (Medium slate) | `#9ca3b4` (Muted silver) | Body text, card labels, secondary attributes |
| `--fg-muted` | `#7a8194` (Subtle slate) | `#6b7280` (Dim slate) | Timestamps, metadata tags, axis markers |
| `--border-default` | `#d8dce6` (Clean border) | `#2a2f3e` (Subtle border) | Standard card borders, divider lines |
| `--border-subtle` | `#e8ecf2` (Light divider) | `#1f2433` (Deep divider) | Inner row dividers, quiet borders |
| `--border-strong` | `#b0b8c8` (Active border) | `#3d4556` (Active highlight) | Focused items, active tabs, hovered cards |
| `--accent` | `#2563a8` (Navy Blue) | `#5b9cf5` (Cold Polar Blue) | Primary interactive actions, active pills |
| `--accent-fg` | `#ffffff` | `#0f1117` | Text on top of accent fill |
| `--status-nominal` | `#16804a` (Forest green) | `#34d399` (Mint green) | Nominal, OK, Online, Healthy (>80%) |
| `--status-nominal-bg` | `#ecfdf5` | `#0a2e1f` | Nominal badge & alert background |
| `--status-warning` | `#b45309` (Amber) | `#fbbf24` (Safety amber) | Warning, Degraded, Approaching Limit |
| `--status-warning-bg` | `#fffbeb` | `#2a2008` | Warning badge & alert background |
| `--status-critical` | `#c4342d` (Safety red) | `#f87171` (Signal red) | Critical, Alarm, Breached Limit, Offline |
| `--status-critical-bg` | `#fef2f2` | `#2a0f0f` | Critical alert container background |
| `--status-info` | `#2563a8` (Tech blue) | `#5b9cf5` (Ice blue) | Telemetry info, calculated metrics |
| `--status-info-bg` | `#eff6ff` | `#0f1a2e` | Info badge background |
| `--status-scenario` | `#7c3aed` (Violet) | `#a78bfa` (Light violet) | What-If simulation mode indicators |
| `--status-scenario-bg`| `#f5f3ff` | `#1a1033` | Simulation banner background |

### B. Typography Rules

PolarOps enforces a strict dual-font stack:
1. **Sans-Serif (`Inter`, `ui-sans-serif`)**: Used for all UI chrome, headings, explanations, narrative logs, buttons, and navigation.
2. **Monospace (`JetBrains Mono`, `Fira Code`, `monospace`)**: **Strictly required** for:
   - Engineering metrics and numerical values (`94.2°C`, `4.8 mm/s`, `225 kW`, `142,500 L`)
   - Asset and part identifiers (`G-02`, `MWO-2026-089`, `SK-402`, `S-17`)
   - Timestamps and UTC durations (`14:28:05 UTC`, `+8.5d`, `680ms`)
   - Status codes and truth types (`MEASURED`, `DERIVED`, `P0_CRITICAL`)
   - Cryptographic hashes and coordinates (`sha256:4a8b...`, `69°24'S, 76°11'E`)

### C. Geometry & Elevation
- **Border Radius**: Use `rounded-md` (6px) for cards and modals, `rounded` (4px) for badges and buttons, `rounded-full` **strictly for status indicator dots**.
- **Shadows**: Minimize shadows. Use `shadow-none` for flat panels, `shadow-sm` for popovers, and `shadow-lg` for slide-out drawers.
- **Card Nesting**: Maximum 1 level of card nesting to avoid visually heavy "card inside card inside card" layouts.

---

## 3. Data Honesty & Provenance Specification

PolarOps operates under strict scientific data integrity rules. Any telemetry card, metric display, or event badge must present its **telemetry metadata**:

```typescript
interface TelemetryProvenance {
  source: string;        // e.g. "PLC-G02-VIB01", "MET-STATION-EAST", "SIM-ENGINE-BFS"
  timestamp: string;     // ISO 8601 UTC
  freshness: "LIVE" | "STALE" | "CACHED" | "OFFLINE";
  quality: "GOOD" | "DEGRADED" | "UNCERTAIN" | "INVALID";
  truth_type: "MEASURED" | "DERIVED" | "FORECAST" | "SCENARIO";
  confidence: number;    // 0 to 100 percentage
}
```

### Visual Representation (`TruthBadge.tsx`)
- `MEASURED` (Cyan/Blue): Direct raw sensor telemetry from station hardware.
- `DERIVED` (Teal/Emerald): Calculated through validated thermal/electrical equations.
- `FORECAST` (Amber): Projected trend over upcoming 24h–90d operational horizon.
- `SCENARIO` (Purple): In-memory what-if simulation outcome.

---

## 4. Full Route & Screen Architecture

PolarOps consists of **6 primary operational views** plus **1 global causal reasoning drawer**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MISSION CONTROL BAR                             │
│ Station Switcher [Bharati | Maitri] │ Winter Ops │ Comms: Online │ Dark/Light │
├─────────────────────────────────────────────────────────────────────────────┤
│ [1] Command Center    │ [2] Asset Intel │ [3] Resources │ [4] Scenarios     │
│ [5] Resilience & Sync │ [6] Multi-Station Overview       │ WHY? Drawer [▶]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 1: Command Center (`/`) — Common Operational Picture

**Objective**: Give the Station Commander an instantaneous 5-second situational readout of whole-station health, environmental threats, and high-priority anomalies.

#### Key UI Sections:
1. **Station Status KPI Strip (Top Row - 4 Cards)**:
   - **Station Health Index**: Single hero score (e.g. `85/100 · WARNING`), active issues count (1 Critical, 2 Degraded), trend sparkline.
   - **Fuel & Winter Runway**: Remaining liters (`142,500 L`), days of fuel remaining (`70.3d`), target winter reserve (`90.0d`), burn rate (`84.5 L/h`), next resupply ETA (`11d`).
   - **Antarctic Climate & Wind Chill**: Exterior temp (`-28.5°C`), wind speed (`42 kt Blizzard Warning`), wind chill index (`-41.2°C`), solar radiation (`0 W/m² Polar Night`).
   - **Comms & Satellite Uplink**: Link state (`ONLINE · VSAT Ku-band`), latency (`680 ms`), packet loss (`0.2%`), queued unsynced items (`0 items`).
2. **Critical Operational Event Hero Card (Hero Anomaly)**:
   - Urgent banner alerting on **Diesel Generator G-02** bearing vibration anomaly (`4.8 mm/s` against `4.0 mm/s` threshold, coolant temp `94.2°C`).
   - Immediate downstream impact warning: *Risk to Thermal Loop B and Habitat Zone 2 heating*.
   - Direct CTAs: `[Inspect Asset G-02]` and `[WHY? Explain Causal Chain]`.
3. **Station Spatial Schematic & Topology**:
   - Interactive 2D architectural map of station layout divided into 3 physical zones:
     - **Zone 1: Powerhouse & Fuel Farm** (G-01 100%, G-02 62% Degraded, Day Tank 91%).
     - **Zone 2: Habitat & Life Support** (HVAC-1 96%, Loop B 74%, Potable Water Nominal).
     - **Zone 3: Science Labs & Satellite Comm** (VSAT Ku-band 100%, S-17 Auroral Radar 100%).
   - Clickable nodes with status colors that open asset details.
4. **Subsystem Health Matrix**:
   - 4 engineering tiles: **Power Generation** (84%), **Thermal Management** (78%), **Life Support & Water** (88%), **Satellite Communications** (92%).
5. **Live Chronological Activity Stream**:
   - Filterable operational event timeline (`All`, `Warnings & Critical`, `System & Comms`).
   - Interactive demo controls: `[Advance Demo Event]` and `[Reset Timeline]`.
   - Each event features an actionable `[WHY?]` button triggering the Explanation Drawer.

---

### Screen 2: Asset Intelligence (`/assets/:id`, e.g. `/assets/G-02`)

**Objective**: Deep diagnostic workbench for station engineers to inspect telemetry anomalies, evaluate failure probability, trace graph dependencies, and identify supply bottlenecks.

#### Key UI Sections:
1. **Asset Header & Criticality Dossier**:
   - Asset tag `G-02` (Cummins QSK60 Marine Diesel Generator, 300 kW).
   - Location: `Building A — Powerhouse Gen Bay 2`.
   - Health score: `62/100 (Degraded)`, Criticality: `CRITICAL TIER-1 (Life Support Linked)`.
2. **24-Hour Multi-Channel Synchronized Sensor Telemetry**:
   - 4 synchronized time-series charts with clear nominal/critical threshold dashed lines:
     - **Bearing Vibration**: Rising from 2.1 → 4.8 mm/s (Alarm limit: 4.0 mm/s).
     - **Coolant Temperature**: Rising from 82.0°C → 94.2°C (Warning limit: 90.0°C).
     - **Thermal Fuel Efficiency**: Dropping from 38.5% → 32.4%.
     - **Electrical Output Load**: Steady at 225 kW (Nominal).
3. **Deterministic Risk Scoring Engine**:
   - Composite Risk Score: `91/100 (HIGH RISK)`.
   - Transparent 6-factor mathematical weight matrix breakdown:
     - Sensor limit violation (weight 0.30): Score 95
     - Downstream service criticality (weight 0.25): Score 90
     - Time in degraded state (weight 0.15): Score 85
     - Environmental stress factor (weight 0.15): Score 90
     - Maintenance overdue factor (weight 0.10): Score 70
     - Redundancy buffer depletion (weight 0.05): Score 80
4. **Relational BFS Dependency Blast Radius Graph**:
   - Visual multi-hop dependency cascade showing how G-02 failure propagates physically:
     $$\text{Asset: G-02} \longrightarrow \text{Loop: Thermal Loop B} \longrightarrow \text{Subsystem: HVAC Zone 2} \longrightarrow \text{Zone: Living Quarters (24 Personnel)}$$
   - Node tags show redundancy status: *Auxiliary Boiler B-01 is available at 50% capacity*.
5. **Maintenance & Logistics Recovery Bottlenecks**:
   - Active Work Order: `MWO-2026-089` (Status: `BLOCKED_PARTS`).
   - Warehouse Inventory: Part `SK-402 (High-Temp Rotary Seal Kit)` — Stock: `0 Units (STOCKOUT / BLOCKING)`.
   - Inbound Resupply Ship: `MV Vasiliy Golovnin` — Position: Southern Ocean — `ETA: 10.1 Days (Window closing in 14d due to pack ice)`.

---

### Screen 3: Resources & Logistics (`/resources`)

**Objective**: Comprehensive balance modeling for energy, fuel consumption, spare parts inventory, and expedition resupply coordination.

#### Key Tabs:
1. **Energy & Fuel Balance Model**:
   - Diesel inventory gauge: `142,500 L / 250,000 L capacity (57.0%)`.
   - Daily burn rate breakdown: Base Power (1,200 L/d) + Heat Tracing (528 L/d) + Science (300 L/d) = `2,028 L/day`.
   - Runway comparison: Current `70.3 days` vs Winter Target `90.0 days` (`-19.7 days deficit`).
2. **Deterministic Thermal Demand Model**:
   - Mathematical model comparing ambient outside temp (`-28.5°C`) vs target indoor comfort (`+20.0°C`).
   - Thermal power required: `252.2 kW_th`.
   - Heat recovery status: G-01 heat exchanger recovering `140 kW_th`; G-02 degraded heat exchanger recovering only `62 kW_th` (`-48 kW_th shortfall`).
3. **Critical Spares & Warehouse Inventory**:
   - Filterable data table of parts with stock count, minimum safe threshold, criticality rating, and linked assets:
     - `SK-402`: Rotary Seal Kit (0 in stock, Min 2, Critical)
     - `FL-108`: Oil Filter Element (4 in stock, Min 3, Nominal)
     - `GS-204`: Cylinder Head Gasket (1 in stock, Min 2, Warning)
4. **Expedition Resupply Logistics (`MV Vasiliy Golovnin`)**:
   - Voyage progress tracker: Cape Town $\to$ Southern Ocean $\to$ Prydz Bay (Bharati).
   - Weather window analysis: Sea-ice satellite forecast and offloading viability window.

---

### Screen 4: What-If Scenario Simulator (`/scenarios`)

**Objective**: Stateless in-memory simulation engine allowing the Station Commander to test contingency decisions before executing them in physical reality.

#### Key Interactive Controls:
- **Scenario Preset Selector**:
  - `Generator G-02 Sudden Trip / Complete Shutdown`
  - `Catabatic Storm Cold Snap (-45°C extreme)`
  - `Satellite Uplink 72-Hour Blackout`
  - `Custom Scenario Builder`
- **Parameter Sliders**:
  - Ambient Temperature: `-15°C` to `-50°C` (default: `-28.5°C`)
  - Target Asset Outage: `G-02 (Diesel Gen)` or `G-01` or `Boiler B-01`
  - Simulation Horizon: `24 Hours`, `48 Hours`, `72 Hours`
- **Output Delta Comparison Cards (Baseline vs Simulated)**:
  - Generation Capacity: `600 kW` $\to$ `300 kW` ($\Delta -50\%$)
  - Thermal Margin: `+45 kW_th` $\to$ `-38 kW_th` (Deficit triggers electric heater fallback)
  - Fuel Runway: `70.3 Days` $\to$ `78.8 Days` ($+8.5$ days saved due to single-engine load)
  - Habitat Temp Decay: Drops from `+21°C` to `+14°C` in 14.5 hours without auxiliary boiler.
- **Cross-Domain Energy Reserve Margin Gauge**:
  - Visual color-coded gauge bar with a hard `25% Minimum Safety Margin` threshold line.
- **Explainable Countermeasure Recommendation**:
  - Step 1: *Reroute 30% thermal load to Auxiliary Boiler B-01*.
  - Step 2: *Shed non-critical scientific payload (S-17 Auroral Radar, -35 kW)*.
  - Action Button: `[Approve & Record Countermeasure in Operational Memory]`.

---

### Screen 5: Resilience & Disruption Workspace (`/resilience`)

**Objective**: Operational continuity during total satellite communication blackout, scientific observation edge buffering, and human-in-the-loop incident triage.

#### Key Tabs:
1. **Deterministic Priority Sync Queue (P0 to P3)**:
   - Interactive simulation controls: `[Simulate Satellite Outage]`, `[Restore Link & Reconcile]`, `[Inject Test Telemetry]`.
   - Visual priority queue ordered deterministically:
     - **P0 Critical** (Life support alarms, generator trips) $\to$ Instant burst upon link restoration.
     - **P1 High** (Station commander maintenance approvals, fuel transfers).
     - **P2 Important** (Routine hourly telemetry logs, inventory consumptions).
     - **P3 Routine** (Bulk scientific observation data frames).
   - **Cryptographic Tamper-Verification**: Each payload displays its canonical UTF-8 SHA-256 checksum (e.g. `sha256:4f8e...`) verified against local edge logs.
2. **Science Continuity & Edge Observation Buffer**:
   - Hero payload: **S-17 High-Frequency Auroral Radar** (35 kW draw).
   - Edge buffer storage gauge: `412.5 GB / 1000 GB (41.2% utilized)`.
   - Power rationing trade-off toggle: *Switch radar to Low-Power Standby (5 kW) during energy emergencies while continuously buffering magnetosphere data*.
3. **Incident Workspace & Blast Radius**:
   - Active Incident `INC-2026-04` (Generator G-02 Coolant Leak & Vibration Surge).
   - State machine badges: `[ACTIVE] → [CONTAINED] → [RESOLVED]`.
   - Operator actions log with timestamp and officer ID.
4. **Operational Memory Repository**:
   - Searchable institutional archive of historical Antarctic incidents and lessons learned (e.g. *"Winter 2024: Similar G-02 vibration traced to worn isolation damper mountings"*).

---

### Screen 6: Multi-Station Fleet Overview (`/stations`)

**Objective**: Side-by-side strategic comparison between India's two active Antarctic stations: **Bharati** (Larsemann Hills) and **Maitri** (Schirmacher Oasis).

#### Key Information Elements:
- Comparative KPI cards: Health index, fuel runway, personnel count, exterior temperature.
- Inter-station logistics & mutual resupply distance (approx 3,000 km air transit).
- Satellite footprint & communication window overlaps.

---

### Global Drawer: Deterministic Explanation Drawer ("WHY?" Engine)

**Objective**: Slide-out panel (accessible from any alert, metric, or event) providing full deterministic transparency into the system's causal reasoning.

#### The 6-Stage Causal Chain:
1. **Stage 1: Primary Trigger** (e.g. Raw sensor reading `4.8 mm/s` on bearing transducer).
2. **Stage 2: Anomaly Classification** (Exceeded ISO 10816-3 vibration limit by 20%).
3. **Stage 3: Physical Dependency Traversal** (BFS path from G-02 to Thermal Loop B to Habitat Zone 2).
4. **Stage 4: Operational Risk Score Impact** (Risk jumped from 25 to 91 based on weighted matrix).
5. **Stage 5: Supply Chain & Logistic Bottleneck** (Seal Kit SK-402 out of stock; vessel 10d away).
6. **Stage 6: Recommended Human Countermeasure** (Shift load to Boiler B-01, shed radar payload).

---

## 5. UI Implementation & Component Guidelines

When writing React & Tailwind code for PolarOps, adhere strictly to these patterns:

### 1. Cards and Containers
```tsx
// Correct PolarOps card pattern
<div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4 shadow-none">
  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-3">
    <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--fg-muted)]">
      Subsystem Telemetry
    </h3>
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--status-nominal-bg)] text-[var(--status-nominal)] border border-[var(--status-nominal-muted)]">
      MEASURED
    </span>
  </div>
  {/* Content */}
</div>
```

### 2. Metric Display Pattern
```tsx
// Always pair numeric value (JetBrains Mono) with descriptive label (Inter) and unit
<div className="flex flex-col">
  <span className="text-xs text-[var(--fg-muted)] uppercase font-sans">Coolant Temperature</span>
  <div className="flex items-baseline gap-1 mt-0.5">
    <span className="text-2xl font-mono font-bold text-[var(--fg-primary)]">94.2</span>
    <span className="text-xs font-mono text-[var(--fg-secondary)]">°C</span>
  </div>
  <span className="text-[11px] font-mono text-[var(--status-warning)] mt-1 flex items-center gap-1">
    <AlertTriangle className="w-3 h-3 inline" /> +4.2°C above threshold (90.0°C)
  </span>
</div>
```

### 3. Priority Badge Pattern
```tsx
// For Priority Queues (P0-P3)
const priorityStyles = {
  P0: "bg-red-500/10 text-red-500 border-red-500/30",
  P1: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  P2: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  P3: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};
```

---

## 6. Ready-to-Use UI Design Prompts for Claude

When asking Claude to generate or redesign specific PolarOps interfaces, copy and paste these pre-formulated prompts:

### Prompt A: Redesign the PolarOps Command Center (`/`)
```text
Act as a Principal UI/UX Systems Designer specializing in SCADA and mission-critical aerospace/polar operations.
Referencing the PolarOps CLAUDE.md design system:
Design a modern, high-density React 19 + Tailwind CSS component for the PolarOps Command Center dashboard for Indian Antarctic Station Bharati.

Include:
1. Top KPI strip with Station Health (85/100), Fuel Runway (70.3d vs 90d target), Polar Climate (-28.5°C, 42kt blizzard), and VSAT Comms (Online, 680ms).
2. Hero Critical Event card for Diesel Generator G-02 bearing vibration anomaly (4.8 mm/s) with downstream thermal threat and a "WHY? Explain Chain" button.
3. Interactive 2D Spatial Schematic showing Zone 1 (Power), Zone 2 (Habitat), Zone 3 (Science) with color-coded nodes.
4. Subsystem Health Matrix (Power 84%, Thermal 78%, Life Support 88%, Comms 92%).
5. Activity Stream with MEASURED/DERIVED badges and event filter toggles.

Constraints:
- Use CSS variable tokens (--bg-primary, --bg-secondary, --fg-primary, --status-warning, etc.).
- Use Inter for text and JetBrains Mono for numbers/units/IDs.
- Zero purple gradients, zero glassmorphism, zero emojis. Use Lucide React icons.
```

### Prompt B: Design the Asset Intelligence & BFS Blast Radius View (`/assets/G-02`)
```text
Act as a Principal UI/UX Systems Designer.
Referencing the PolarOps CLAUDE.md design system:
Design the React 19 + Tailwind CSS view for Asset Intelligence for Diesel Generator G-02.

Include:
1. Asset dossier header with criticality level (CRITICAL TIER-1) and health score (62/100).
2. Four synchronized 24h telemetry trend cards (Bearing Vibration, Coolant Temp, Fuel Efficiency, Electrical Load) with threshold dashed lines and current values.
3. 6-factor deterministic risk weight matrix card explaining the 91/100 risk score.
4. Visual multi-hop dependency blast radius flow: G-02 -> Thermal Loop B -> Habitat Zone 2 HVAC -> Living Quarters (24 crew).
5. Logistics bottleneck card showing Work Order MWO-2026-089 blocked by 0 units of Seal Kit SK-402, and MV Vasiliy Golovnin ETA 10.1 days.

Constraints:
- Follow strict SCADA dark/light theme tokens.
- Strict data honesty: include telemetry provenance badges on all readings.
```

### Prompt C: Design the What-If Scenario Simulator (`/scenarios`)
```text
Act as a Principal UI/UX Systems Designer.
Referencing the PolarOps CLAUDE.md design system:
Design the React 19 + Tailwind CSS What-If Scenario Simulation interface for PolarOps.

Include:
1. Interactive parameter sidebar: Preset selector, ambient temperature slider (-15°C to -50°C), generator shutdown selector, and duration buttons (24h/48h/72h).
2. Cross-domain energy reserve margin visual gauge bar with a prominent 25% minimum safety margin line.
3. Baseline vs Simulated impact delta comparison cards (Power Capacity 600kW -> 300kW, Fuel Runway 70.3d -> 78.8d, Habitat temperature decay curve).
4. Clear explainable recommended countermeasure banner with human operator approval button.

Constraints:
- Use simulation purple tokens (--status-scenario: #a78bfa, --status-scenario-bg: #1a1033).
- Clean, accessible, responsive layout with JetBrains Mono numbers.
```

### Prompt D: Design the Resilience & Communication Outage Workspace (`/resilience`)
```text
Act as a Principal UI/UX Systems Designer.
Referencing the PolarOps CLAUDE.md design system:
Design the React 19 + Tailwind CSS Resilience & Disruption Workspace for PolarOps.

Include:
1. Comms state simulator banner with [Simulate Outage], [Restore & Reconcile], and status (Online / Offline / Reconciling).
2. Deterministic Priority Queue table grouped into P0 Critical, P1 High, P2 Important, P3 Routine with canonical SHA-256 checksums.
3. Science continuity edge buffer gauge for S-17 Auroral Radar (35 kW) with power-rationing toggle.
4. Incident triage workspace for INC-2026-04 with lifecycle badges (ACTIVE -> CONTAINED -> RESOLVED) and human action log.

Constraints:
- Include cryptographic hash formatting (font-mono text-xs).
- Adhere strictly to the calm authority SCADA theme.
```
