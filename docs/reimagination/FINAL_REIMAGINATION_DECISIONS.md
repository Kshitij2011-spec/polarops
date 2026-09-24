# PolarOps Final Reimagination Decisions & Authoritative ADR Log

**Author:** Kshitij Parkhe (Product Owner & System Integration Lead)  
**Contributors:** Dhruv (Twin Lead), Tanvi (Decision Lead)  
**Date:** September 2026  
**Status:** AUTHORITATIVE & FINAL (Supersedes all prior draft decision records)  
**Repository Branch:** `reimagine/product-blueprint`  
**Baseline:** `5c692ec` (`baseline/phase4-5c692ec`)  
**Target Repository Artifact:** `docs/reimagination/FINAL_REIMAGINATION_DECISIONS.md`

---

## 1. Executive Summary

This document establishes the binding **Architectural Decision Records (ADRs)** governing the PolarOps product rebuild. All competing proposals, alternative layouts, and draft suggestions from prior phases are formally resolved.

---

## 2. Binding Architectural Decisions

### ADR 1: The Three-Macro-Workspace Architecture
- **Status:** APPROVED & BINDING.
- **Decision:** The application is structured into exactly three macro-workspaces:
  1. `Workspace 1: Command + Digital Twin (/twin)` — Real-time operational state, living topology DAG, asset inspector, 2D isometric schematic.
  2. `Workspace 2: Incident + Decision Cockpit (/cockpit)` — Crisis common operating picture, counterfactual what-if sandbox, hold-to-confirm approval, action ledger, operational memory.
  3. `Workspace 3: Continuity + Logistics (/continuity)` — Fuel runway countdown, coupled energy balance, warehouse spares, maritime resupply, edge resilience.
- **Rationale:** Merges physical relationships with situational command, eliminates route hopping, and aligns 1:1 with operational mental models.

---

### ADR 2: Living Topology DAG & 380px Contextual Inspector
- **Status:** APPROVED & BINDING (Dhruv Proposal).
- **Decision:** Workspace 1 features a dual-pane canvas:
  - Left/Center: Interactive hierarchical Living Topology DAG with dual-flow tracing (upstream power feeds in cyan vs downstream blast radius in red).
  - Right: Fixed 380px Contextual Asset Inspector driven by node selection, displaying nameplate specs, 50-point SVG sparklines with threshold bands, and 6-factor risk drivers.
- **Rationale:** Operators diagnose cascade failures without page reloads or modal obstructions.

---

### ADR 3: Elimination of Split-Brain Telemetry
- **Status:** APPROVED & BINDING.
- **Decision:** Live operational reality (`MEASURED`, `DERIVED`) is strictly quarantined from counterfactual simulation (`SCENARIO`, `SIMULATED`). The sensitivity slider in Workspace 3 operates in an isolated projection sandbox. Simulation mode in Workspace 2 renders a persistent, unmissable amber watermark.
- **Rationale:** Prevents catastrophic confusion between actual station sensor reality and hypothetical scenarios.

---

### ADR 4: 2D Spatial Schematic Policy (No WebGL/Three.js 3D in Initial Rebuild)
- **Status:** APPROVED & BINDING.
- **Decision:** True WebGL / Three.js / React Three Fiber 3D is strictly excluded from the initial production rebuild. Spatial containment and windward blizzard exposure are delivered via an accessible **2D Spatial/Isometric Architectural Cross-Section**.
- **Rationale:** Eliminates GPU bloat, saves bandwidth on degraded satellite links, and prevents high-risk implementation distractions.

---

### ADR 5: Emergency Hold-to-Confirm Interaction
- **Status:** APPROVED & BINDING.
- **Decision:** High-impact mitigation dispatches (e.g. load shedding, generator bypass) require an industrial **Hold-to-Confirm Button** (1.5-second continuous press with visual radial fill).
- **Rationale:** Prevents accidental clicks without the panic and delay of multi-step modal dialogs during a critical emergency.

---

### ADR 6: The 7-Stage Resilience State Machine & Cryptographic Verification
- **Status:** APPROVED & BINDING (Tanvi Proposal).
- **Decision:** Resilience is modeled across 7 deterministic states (`NORMAL`, `DEGRADED`, `LOCAL`, `QUEUED`, `RECONNECTING`, `SYNCHRONIZING`, `RECONCILED`). Actions executed offline buffer into a P0–P3 priority queue with canonical SHA-256 hashes, reconciled automatically upon uplink lock.
- **Rationale:** Guarantees absolute edge continuity during polar satellite blackouts.

---

### ADR 7: Dual-Sided Operational Memory Architecture
- **Status:** APPROVED & BINDING.
- **Decision:** Operational Memory is never mixed into active simulation state. It operates in two modalities:
  1. *Contextual Precedent:* Automatically queried inside active incident triage.
  2. *Historical Archive:* A dedicated searchable tab in Workspace 2 (`/cockpit?mode=memory`) for full-text search over past expedition records.
- **Rationale:** Preserves historical institutional knowledge without confusing it with counterfactual modeling.

---

### ADR 8: Domain-Modular API Architecture
- **Status:** APPROVED & BINDING.
- **Decision:** `frontend/src/lib/api.ts` is refactored into domain-isolated modules under `frontend/src/lib/api/` (`twin.ts`, `decision.ts`, `resources.ts`, `resilience.ts`, `station.ts`), re-exported via `index.ts`.
- **Rationale:** Eliminates merge conflicts when three developers add endpoints concurrently.

---

## 3. Explicit Rejections (What PolarOps is NOT)

1. ❌ **No Generic SaaS Dashboards:** No cosmetic KPI walls or cards without physical thresholds.
2. ❌ **No Standalone "Offline Pages":** Edge autonomy is an ambient system property, not a web page.
3. ❌ **No Standalone "Alerts Pages":** Incidents are managed directly alongside station reserve headroom.
4. ❌ **No Autonomous Control:** PolarOps calculates, simulates, and recommends; human operators retain 100% unilateral authority.
5. ❌ **No Third-Party Message Brokers:** No Kafka, RabbitMQ, Redis, or Neo4j. Local SQLite / PostgreSQL with SQLAlchemy is the rugged Antarctic standard.
6. ❌ **No Non-Deterministic AI Chatbots:** All risk models and decision options are deterministic linear physics and graph algorithms.

---
