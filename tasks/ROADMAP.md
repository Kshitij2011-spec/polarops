# Project Development Roadmap & Milestone Schedule

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                    6-DAY BUILD ROADMAP                                    │
├──────────┬──────────────────────────────────────┬───────────────────────┬─────────────────┤
│ Day      │ Core Milestone Focus                 │ Key Deliverable       │ Primary Journey │
├──────────┼──────────────────────────────────────┼───────────────────────┼─────────────────┤
│ DAY 0    │ Foundation & Repository Bootstrap    │ Scaffolding & Setup   │ Setup & Config  │
│ DAY 1    │ Station Command Center & Telemetry   │ Main Dashboard UI     │ Journey A       │
│ DAY 2    │ Asset Intelligence & Risk Engine     │ Dependency Graph UI   │ Journey A       │
│ DAY 3    │ Energy Runway & Scenario Engine      │ G-02 Hero Simulation  │ Journey A       │
│ DAY 4    │ Offline Sync & Science/Incident Work │ Local Priority Queue  │ Journeys B, C, D│
│ DAY 5    │ Integration, E2E QA & Visual Polish  │ Pitch-Ready Twin      │ Full Suite      │
└──────────┴──────────────────────────────────────┴───────────────────────┴─────────────────┘
```

---

## Milestone & Task-System Architecture

Every day's progress is structured as bounded tasks tracked in `tasks/`:
`Day → Milestone → Task IDs → Acceptance Criteria → Convergence Review`

---

## Day-by-Day Milestone Plan

### DAY 0 — Foundation & Repository Bootstrap (CURRENT PHASE)
- **Goal**: Establish project operating infrastructure and initialize clean, runnable frontend and backend project scaffolding.
- **Inputs**: [PRD.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/product/PRD.md), [ARCHITECTURE.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/ARCHITECTURE.md), [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md).
- **Task Milestones**:
  - `T-001` (Doc Audit): Project intelligence & architecture lock *(Complete)*.
  - `T-002` (Agent Skills): Establish skills and task management templates *(Complete)*.
  - `T-003` (Frontend Scaffold): Initialize React + TypeScript + Vite + Tailwind + Lucide setup in `frontend/`.
  - `T-004` (Backend Scaffold): Initialize FastAPI + Pydantic v2 + SQLite/PostgreSQL setup in `backend/`.
  - `T-005` (Health Check): Verify end-to-end frontend-to-backend connectivity and test runners.
- **Acceptance Criteria**: Both frontend and backend start cleanly with automated health checks passing.
- **Convergence Target**: `T-005` convergence review passes.

---

### DAY 1 — Station Command Center & Unified View
- **Goal**: Deliver unified operational situation awareness dashboard.
- **Inputs**: [USER_JOURNEYS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/product/USER_JOURNEYS.md) (Journey A), [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md) (`GET /station/overview`).
- **Task Milestones**:
  - `T-101`: Base application layout frame (Navigation, Station switcher: Bharati / Maitri, Season mode: Summer/Winter).
  - `T-102`: Command Center status cards (Ambient weather, overall health score, active alert badges, fuel runway widget).
  - `T-103`: Subsystem status grid (Power Gen, Thermal Loop, Life Support, Water Treatment, Satellite Comms).
  - `T-104`: Telemetry ingestion & polling service with explicit provenance metadata tags.
- **Acceptance Criteria**: Station Commander can monitor real-time station metrics and identify degraded subsystem states in <3 seconds.
- **Convergence Target**: Playwright test for Command Center view passes.

---

### DAY 2 — Asset Intelligence, Dependency Graph & Risk Engine
- **Goal**: Enable root-cause identification and downstream blast-radius analysis for station equipment.
- **Inputs**: [DATA_MODEL.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/DATA_MODEL.md), [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md) (`/assets`, `/dependencies`, `/risk`).
- **Task Milestones**:
  - `T-201`: Asset Detail drawer/page showing live telemetry metric charts and threshold baselines.
  - `T-202`: Relational Dependency Graph Engine in backend Python (`dependency_service.py` using BFS traversal).
  - `T-203`: Interactive Frontend Node/Edge dependency graph visualizer.
  - `T-204`: Explainable Risk Engine scoring composite risk (0–100) with weighted factor breakdown modal.
- **Acceptance Criteria**: Clicking `G-02` displays vibration anomaly (4.8 mm/s), traverses to `Thermal Loop B` → `Habitat Zone 2`, and breaks down the 74/100 risk score.
- **Convergence Target**: Unit tests for BFS graph traversal and Playwright asset flow pass.

---

### DAY 3 — Cross-Domain Resource Runway & Scenario Simulation Engine
- **Goal**: Connect fuel runway, inventory availability, and what-if simulation for the G-02 hero scenario.
- **Inputs**: [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md) (`/resources/fuel`, `/resources/inventory`, `/scenarios/simulate`).
- **Task Milestones**:
  - `T-301`: Energy & Fuel Runway calculation model (Diesel stock, burn rate, ambient temperature impact).
  - `T-302`: Maintenance Work Order & Spare Parts inventory view (Seal kit `SK-402`, *MV Vasiliy Golovnin* 45-day ETA).
  - `T-303`: In-memory What-If Scenario Simulation engine for generator trip / thermal decay.
  - `T-304`: Scenario simulation interactive UI panel with countermeasure recommendations ("Shift thermal load to Boiler B-01").
- **Acceptance Criteria**: Operator can simulate G-02 failure, view habitat temperature drop curve, and approve recommended countermeasure.
- **Convergence Target**: Unit test for scenario simulator and Playwright scenario flow pass.

---

### DAY 4 — Offline Synchronization, Science Continuity & Incident Workspace
- **Goal**: Demonstrate edge resilience during satellite blackouts, science payload power rationing, and institutional memory.
- **Inputs**: [OFFLINE_SYNC.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/OFFLINE_SYNC.md), [USER_JOURNEYS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/product/USER_JOURNEYS.md) (Journeys B, C, D).
- **Task Milestones**:
  - `T-401`: Local-first priority queue sync simulator (LocalStorage queue, SHA-256 hash generation, P0–P3 sorting).
  - `T-402`: Network offline toggle & visual queue flush reconciliation banner.
  - `T-403`: Science Payload Continuity workspace (power rationing toggle for Auroral Radar / Seismometer).
  - `T-404`: Incident Workspace & Operational Memory log for recording human decisions and lessons learned.
- **Acceptance Criteria**: Disconnecting network buffers actions with SHA-256 signatures; restoring network flushes queue cleanly with zero data loss.
- **Convergence Target**: Playwright tests for offline sync and science continuity pass.

---

### DAY 5 — System Integration, E2E QA & Visual Polish
- **Goal**: Full system integration, end-to-end verification, and pitch-ready visual styling.
- **Inputs**: [DEMO_SCRIPT.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/product/DEMO_SCRIPT.md), [TEST_STRATEGY.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/engineering/TEST_STRATEGY.md).
- **Task Milestones**:
  - `T-501`: Comprehensive E2E Playwright test suite execution across all four user journeys.
  - `T-502`: Polar dark-theme styling polish, micro-animations, glassmorphic cards, and responsive checks.
  - `T-503`: Complete build, typecheck, and test suite verification (`tsc`, `npm run build`, `pytest`).
  - `T-504`: Deterministic 3-minute pitch demonstration rehearsal matching [DEMO_SCRIPT.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/product/DEMO_SCRIPT.md).
- **Acceptance Criteria**: 100% bug-free execution of the 3-minute hero demonstration with zero console or build warnings.
- **Convergence Target**: Complete system convergence review signed off.
