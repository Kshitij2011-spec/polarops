# PolarOps Reimagination Decisions & Architectural Resolution Log

**Author:** Kshitij Parkhe (Product Owner & System Integration Lead)  
**Contributors:** Dhruv (Twin Lead), Tanvi (Decision Lead)  
**Date:** September 2026  
**Repository Branch:** `reimagine/product-blueprint`  
**Baseline:** `5c692ec` (`baseline/phase4-5c692ec`)  
**Target Repository Artifact:** `docs/reimagination/REIMAGINATION_DECISIONS.md`

---

## 1. Executive Summary

This document serves as the formal **Architectural Decision Record (ADR)** for the PolarOps Product Reimagination. It resolves all agreements, contradictions, duplicated concepts, and competing proposals surfaced in the independent domain audits authored by Kshitij, Dhruv, and Tanvi.

---

## 2. Resolution of the 10 Major Architectural Conflicts

### Decision 1: The Four Unified Operational Workspaces
- **Status:** APPROVED & ADOPTED.
- **Context:** The legacy frontend had 11 disconnected routes. Kshitij proposed 4 workspaces; Dhruv proposed centering everything on the Digital Twin; Tanvi proposed an incident-to-decision linear pipeline.
- **Resolution:** We establish exactly **Four Dedicated Operational Workspaces**:
  1. `Workspace 1: Situational Command` (`/command-center`) — Station health, headroom, active incident COP, action ledger.
  2. `Workspace 2: Systems Twin & Topology Canvas` (`/digital-twin`) — Physical schematics, living topology DAG, asset inspector.
  3. `Workspace 3: Life Support & Logistics` (`/resources`) — Fuel runway, thermal balance, critical warehouse spares, resupply vessel.
  4. `Workspace 4: Decision & Simulation Studio` (`/scenarios`) — Counterfactual sandbox, multi-station fleet aid, institutional memory.
- **Consequences:** Eliminates route hopping; maps 1:1 to the 4 operational personas and JTBD.

---

### Decision 2: Topology Canvas + Contextual Inspector Form-Factor
- **Status:** APPROVED & ADOPTED (Dhruv Proposal).
- **Context:** Should asset details be a separate modal, sub-page, or side panel?
- **Resolution:** In Workspace 2, the primary canvas is the **Living Topology Graph** (Left/Center), while selecting any node opens the **Contextual Asset Inspector** (Right, 380px fixed width). The canvas dynamically refits, highlighting upstream suppliers in cyan and downstream blast radius in red.
- **Consequences:** Zero page reloads when exploring connected assets; immediate access to 50-pt SVG sparklines and 6-factor risk drivers.

---

### Decision 3: The Counterfactual Decision Pipeline
- **Status:** APPROVED & ADOPTED (Tanvi Proposal).
- **Context:** Earlier scenario prototypes treated simulation as a simple form returning raw JSON deltas.
- **Resolution:** Scenario simulation is structured as an operational decision pipeline:
  $$\text{CURRENT BASELINE} \longrightarrow \text{WHAT-IF INJECTION} \longrightarrow \text{DOWNSTREAM IMPACT} \longrightarrow \text{RECOVERY CONSTRAINTS} \longrightarrow \text{VETTED OPTIONS} \longrightarrow \text{HUMAN APPROVAL}$$
- **Consequences:** Simulations directly produce actionable mitigation packages with trade-off matrices, requiring explicit two-step human approval.

---

### Decision 4: Active Incident COP & Action Ledger in Workspace 1
- **Status:** APPROVED & ADOPTED.
- **Context:** Tanvi proposed a dedicated Incident Workspace; Kshitij proposed merging alerts into Command Center.
- **Resolution:** We eliminate the `/alerts` page. In Workspace 1, when an incident is active, the **Incident Common Operating Picture (COP)** and **Action Execution Ledger** dominate the primary work area. When no incident is active, the view displays the baseline operational health matrix and recent event activity.
- **Consequences:** Eliminates split-attention cognitive failure; commanders triage emergencies directly alongside station reserve headroom.

---

### Decision 5: The Dual Role of Operational Memory
- **Status:** APPROVED & ADOPTED.
- **Context:** Should `/reports` remain a page? Where does `/memory` live?
- **Resolution:** The legacy `/reports` route is retired. Operational Memory operates in two modalities:
  1. *Contextual Precedent:* Automatically queried and rendered inside active incident triage and scenario review.
  2. *Historical Knowledge Archive:* A dedicated searchable tab inside Workspace 4 (`/memory?q=...`) for seasonal debriefs.
- **Consequences:** High-value institutional knowledge is available at the moment of decision, not buried in static PDFs.

---

### Decision 6: Multi-Station Fleet Coordination in Workspace 4
- **Status:** APPROVED & ADOPTED.
- **Context:** The legacy frontend had a separate `/stations` route for portfolio comparison.
- **Resolution:** `/stations` is retired as a standalone route. Multi-station comparison (Bharati vs. Maitri) is consolidated into **Workspace 4: Mode B (Fleet Coordination & Mutual Aid)** alongside cross-station polar traverse airlift simulations. A persistent station dropdown in the header allows switching the active station across all workspaces.
- **Consequences:** Station commanders focus on their local facility; regional fleet comparison is housed within strategic planning.

---

### Decision 7: Edge Resilience as an Ambient Global State & Drawer
- **Status:** APPROVED & ADOPTED.
- **Context:** The legacy frontend had separate `/resilience` and `/offline` routes.
- **Resolution:** Both routes are retired. Resilience is an ambient property:
  - Header pill displays real-time link status (`ONLINE`, `DEGRADED`, `OFFLINE`).
  - Clicking the pill (or `Ctrl+R`) opens the **Edge Resilience & Continuity Cockpit** (slide-out drawer) displaying the 7-stage state machine, P0–P3 priority queue, and SHA-256 verification status.
  - When satellite comms drop, the entire application seamlessly enters Edge Autonomy mode without modal alerts.
- **Consequences:** Eliminates silly "offline pages"; provides robust local autonomy.

---

### Decision 8: Retirement of the Marketing Landing Page
- **Status:** APPROVED & ADOPTED.
- **Context:** Route `/` contained marketing copy, generic hero banners, and "Enter System" buttons.
- **Resolution:** Route `/` is converted into an immediate **Station Selection & Mission Authentication Portal** or direct pass-through to `/command-center?station=STATION-BHARATI`.
- **Consequences:** PolarOps immediately presents operational telemetry; zero consumer marketing fluff.

---

### Decision 9: Strict URL-Persisted Context Model
- **Status:** APPROVED & ADOPTED.
- **Context:** Navigating between routes previously erased the selected asset and filter state.
- **Resolution:** Four critical context parameters are strictly synchronized to the URL: `?station=...`, `?asset=...`, `?incident=...`, and `?drawer=...`.
- **Consequences:** Selecting G-02 in the twin preserves G-02 when switching to resources or scenarios; deep-links allow instant collaboration between station and headquarters.

---

### Decision 10: Strict Rejection of Decorative 3D
- **Status:** APPROVED & ADOPTED (Dhruv Evaluation).
- **Context:** Should PolarOps feature a full 3D station twin?
- **Resolution:** **Hard Rejection of 3D for Primary Operations.** 3D is prohibited for primary alarm monitoring, relational causal tracing, and normal telemetry display. 3D spatial models are permitted strictly as subordinate visual references for physical compartment locations, windward thermal hull gradients, and internal transit tunnel access.
- **Consequences:** Eliminates GPU bloat, saves bandwidth, and prioritizes clear 2D topological schematics.

---

## 3. What We Are NOT Building (Hard Rejections)

To maintain absolute focus and operational purity, the following features and patterns are explicitly rejected:

1. ❌ **Generic CRUD Dashboards:** No raw database tables masquerading as user interfaces.
2. ❌ **Endpoint-Driven UI Cards:** No UI cards that simply dump backend JSON payloads without physical engineering meaning.
3. ❌ **Vanity KPI Walls:** No rows of cards displaying "Total Assets: 24" or "Average Uptime: 99.4%" with zero operational thresholds.
4. ❌ **Autonomous Actuation:** PolarOps will NEVER automatically trip breakers, valve fuel lines, or start generators. It is strictly an advisory decision-support system.
5. ❌ **Black-Box AI / LLM Inferences:** No non-deterministic neural chat widgets. All risk math and recommendations are deterministic linear physics and graph algorithms.
6. ❌ **Heavy Message Broker Infrastructure:** No Kafka, RabbitMQ, Redis, or Neo4j clusters. Local SQLite / PostgreSQL with SQLAlchemy is the verified, rugged architecture.
7. ❌ **Decorative Animations & Spring Physics:** No bouncy cards, parallax scrolls, or particle effects.
8. ❌ **Standalone "Offline" Routes:** No pages you navigate to just to see that you are offline.

---
