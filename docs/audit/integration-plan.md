# PolarOps — Phased Integration & Migration Plan
**Phase 0 Output · Document 9 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Architectural Strategy & Guiding Principles

1. **Zero Backend Changes Required:** The existing 41 endpoints in `backend/` provide 100% of the data models, calculations, and simulations required by the PolarOps mission.
2. **Directory & Build Normalization (Phase 1 Prerequisite):** The new frontend must be normalized into `frontend/` (or configured cleanly) to preserve Vite SPA compatibility, Vercel deployment settings, and Playwright E2E infrastructure.
3. **Reuse Proven Infrastructure:** The 1,277-line typed API client (`api.ts`) and React Query hooks from `main:frontend/` will be preserved and wired into the new Insight UI components.
4. **Cognitive Progressive Disclosure:** Every screen must uphold the approved progressive disclosure model: *Situation → Meaning → Impact → Constraint → Next Action → Deep Evidence*.

---

## 2. Twelve Implementation Phases

### Phase 1: Workspace Normalization, API Client & Type Contracts
- **Objective:** Fix the compilation break in `6048a3b`, restore standard directory layout, establish the typed API client, and configure React Query.
- **Files Likely to Change:**
  - `frontend/src/lib/api.ts` (API client & TypeScript contracts)
  - `frontend/src/lib/queryClient.ts` (React Query setup)
  - `frontend/package.json` & `frontend/vite.config.ts` (Dependency harmonization)
- **Backend Endpoints Involved:** `GET /health`
- **Frontend Components:** Root layout, health status indicator.
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `npm run build` succeeds; `fetchHealth()` verified with vitest/pytest.
- **Rollback Method:** `git checkout HEAD` on integration branch.
- **Acceptance Criteria:** Application compiles cleanly; health check indicator reflects real backend status.

### Phase 2: Core Station Overview & Command Center
- **Objective:** Connect `/command-center` and `/` to real station situation metrics, weather, and the 7-stage causal narrative.
- **Files Likely to Change:**
  - `frontend/src/components/insight/CommandCenterView.tsx`
  - `frontend/src/hooks/useStationOverview.ts`
  - `frontend/src/hooks/useOperationalIntelligence.ts`
- **Backend Endpoints Involved:**
  - `GET /station/overview`
  - `GET /intelligence/narrative`
  - `GET /events`
- **Frontend Components:** 4 top KPI cards, Causal Reasoning accordion, Activity Stream.
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/command_center.spec.ts`
- **Rollback Method:** Git revert of Phase 2 commit.
- **Acceptance Criteria:** Real outdoor temp, wind speed, headline health score, and dynamic 7-stage narrative render without mock data.

### Phase 3: Assets, Telemetry Trends & 6-Factor Risk Intelligence
- **Objective:** Wire Generator G-02 diagnostic panel, live sensor time-series trends (Recharts), and the 6-factor composite risk breakdown card.
- **Files Likely to Change:**
  - `frontend/src/components/insight/AssetDetailView.tsx`
  - `frontend/src/components/insight/TelemetryCharts.tsx`
  - `frontend/src/components/insight/RiskEngineCard.tsx`
  - `frontend/src/hooks/useAssetDetail.ts`, `useAssetTelemetry.ts`, `useAssetRisk.ts`
- **Backend Endpoints Involved:**
  - `GET /assets`
  - `GET /assets/{asset_id}`
  - `GET /assets/{asset_id}/telemetry`
  - `GET /assets/{asset_id}/risk`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/asset_intelligence.spec.ts`
- **Acceptance Criteria:** G-02 displays live 91/100 HIGH RISK score with 6 mathematical factor weights; Recharts renders real 24h vibration & temperature lines.

### Phase 4: Dependency Blast Radius & Explainability Layer
- **Objective:** Replace static SVG coordinates with dynamic BFS graph traversal and connect the Explanation Drawer to the structured explainability endpoint.
- **Files Likely to Change:**
  - `frontend/src/components/insight/DigitalTwinTopology.tsx`
  - `frontend/src/components/insight/ExplanationDrawer.tsx`
  - `frontend/src/hooks/useAssetDependencies.ts`
- **Backend Endpoints Involved:**
  - `GET /assets/{asset_id}/dependencies`
  - `GET /explain/{domain}/{entity_id}`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** Visual inspection of BFS cascade paths; deep links `/digital-twin?asset=power`.
- **Acceptance Criteria:** Clicking G-02 dynamically highlights downstream HVAC and Water plants; Explanation Sheet displays live 5-question cognitive reasoning.

### Phase 5: Resources, Fuel Runway & Recovery Logistics
- **Objective:** Wire fuel storage runway, thermal/electrical energy balance model, critical spare parts inventory, and inbound resupply vessel status.
- **Files Likely to Change:**
  - `frontend/src/components/insight/ResourcesView.tsx`
  - `frontend/src/hooks/useFuelStatus.ts`, `useInventory.ts`, `useResupply.ts`, `useEnergyModel.ts`, `useRecoveryExposure.ts`
- **Backend Endpoints Involved:**
  - `GET /resources/fuel`
  - `GET /resources/inventory`
  - `GET /resources/resupply`
  - `GET /resources/energy`
  - `GET /resources/recovery/{asset_id}`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/scenarios_and_resources.spec.ts`
- **Acceptance Criteria:** Fuel card reflects real 142,500 L stock and 70.3d runway; warehouse table shows Rotary Seal Kit (0 in stock, BLOCKING); vessel MV Vasiliy Golovnin ETA is displayed.

### Phase 6: What-If Scenario Simulation
- **Objective:** Transform the static scenarios page into an interactive simulation console with slider adjustments and side-by-side delta visualization.
- **Files Likely to Change:**
  - `frontend/src/components/insight/ScenariosView.tsx`
  - `frontend/src/hooks/useScenarioSimulation.ts`
- **Backend Endpoints Involved:**
  - `POST /scenarios/simulate`
  - `POST /scenarios/cross-station`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/scenarios_and_resources.spec.ts`
- **Acceptance Criteria:** Clicking "RUN SCENARIO" submits real payload to backend and renders comparative delta metrics (power, thermal reserve, fuel impact) without page refresh.

### Phase 7: Disruption Resilience & Offline Synchronization
- **Objective:** Connect the Offline Analog workspace to real satellite link simulation, P0–P3 priority queues, and cryptographic SHA-256 verification.
- **Files Likely to Change:**
  - `frontend/src/components/insight/OfflineView.tsx`
  - `frontend/src/hooks/useResilienceStatus.ts`, `useSyncQueue.ts`
- **Backend Endpoints Involved:**
  - `GET /resilience/status`, `GET /resilience/queue`
  - `POST /resilience/simulate-offline`
  - `POST /resilience/restore`
  - `POST /resilience/events`
  - `POST /resilience/reset`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/resilience_and_incidents.spec.ts`
- **Acceptance Criteria:** "ENTER OFFLINE MODE" mutates link to OFFLINE; queued events display real SHA-256 hashes; "RECONNECT & SYNCHRONIZE" verifies checksums against backend.

### Phase 8: Incidents, Operational Alerts & Memory
- **Objective:** Wire the Alerts and Reports screens to the canonical incident workspace, lifecycle status transitions, and institutional memory search.
- **Files Likely to Change:**
  - `frontend/src/components/insight/AlertsView.tsx`
  - `frontend/src/components/insight/MemorySearchView.tsx`
  - `frontend/src/hooks/useIncidents.ts`, `useOperationalMemory.ts`
- **Backend Endpoints Involved:**
  - `GET /incidents`, `PATCH /incidents/{id}/status`, `POST /incidents/{id}/actions`
  - `GET /memory`, `POST /memory`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/resilience_and_incidents.spec.ts`
- **Acceptance Criteria:** Clicking "MARK AS REVIEWED" transitions incident status on backend; operational memory search returns 2026 G-02 playbook lesson.

### Phase 9: Science Continuity & Multi-Station Portfolio
- **Objective:** Wire science instrument buffer tracking (S-17) and cross-station capability headroom evaluation between Bharati and Maitri.
- **Files Likely to Change:**
  - `frontend/src/components/insight/StationsView.tsx`
  - `frontend/src/hooks/useScienceInstruments.ts`
- **Backend Endpoints Involved:**
  - `GET /station/comparison`, `POST /station/comparison/evaluate`
  - `GET /science/instruments`, `POST /science/observations/buffer`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/day4_multi_station.spec.ts`
- **Acceptance Criteria:** Station portfolio displays real 5-domain headroom radar/bars; science instrument S-17 shows real buffer percentage.

### Phase 10: Visitor Session Analytics & Polish
- **Objective:** Port the lightweight, privacy-preserving visitor session alert beaconing into the root layout without interfering with navigation.
- **Files Likely to Change:**
  - `frontend/src/hooks/useVisitorSession.ts`
  - `frontend/src/routes/__root.tsx`
- **Backend Endpoints Involved:**
  - `POST /visitor/event`
  - `POST /visitor/complete`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** `tests/e2e/visitor_session.spec.ts`
- **Acceptance Criteria:** Background heartbeats and route changes trigger anonymous session logging without console errors or user-visible latency.

### Phase 11: Navigation, Loading, Error & Empty States
- **Objective:** Implement comprehensive loading skeletons, empty state fallbacks, and error boundaries across all 11 routes.
- **Files Likely to Change:**
  - `frontend/src/components/ui/skeleton.tsx`
  - `frontend/src/components/insight/ErrorState.tsx`
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:** Simulated network throttling and 500 error injection.
- **Acceptance Criteria:** Zero white-screen flashes, elegant skeleton loaders, and informative error banners when backend is unreachable.

### Phase 12: Production Verification & Final Merge Readiness
- **Objective:** Run full regression suite (pytest + Playwright), verify Vercel build output, test responsive breakpoints, and obtain final user approval.
- **Files Likely to Change:** None (verification phase).
- **Backend Changes Needed?** **NO.**
- **Verification / Tests:**
  - `pytest` → 95/95 passed
  - `npm run test:e2e` → 63/63 passed
  - `npm run build` → Exit code 0
- **Acceptance Criteria:** All 26 Definition of Done criteria fully satisfied.
