# PolarOps — Backend Capability to New Frontend Coverage Matrix
**Phase 0 Output · Document 4 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Classification Categories & Rules

Every backend capability and endpoint must end up in **exactly one** of the following classifications:

- **Cat A: Already fully represented in new frontend** — UI exists, real API hook exists, data is bound and validated.
- **Cat B: Partially represented** — Visual UI exists in the new frontend, but data is currently hardcoded or static; requires API client and data hook wiring.
- **Cat C: Backend integration missing** — UI component exists and is ready for data, but the network request, transform, and hook are absent.
- **Cat D: UI missing** — Backend capability has NO corresponding screen, component, or panel in the new frontend.
- **Cat E: Needs adapter/transform only** — Backend provides the exact data, and UI has matching slots, but field names, types, or shapes require a translation layer.
- **Cat F: Needs interaction/mutation wiring** — A button or user action exists in the UI, but it mutates local mock state rather than triggering the backend mutation endpoint.
- **Cat G: Internal endpoint not intended for direct UI use** — Service-to-service, database seed, or low-level diagnostic endpoint.
- **Cat H: Needs clarification** — Unresolved product or design ambiguity.

---

## 2. Complete Coverage Matrix (41 Endpoints)

| # | Backend Endpoint | Category | Old Frontend Representation | New Frontend UI Location | New FE Hook Status | Gap Description | Implementation Priority |
|---|---|---|---|---|---|---|---|
| 1 | `GET /health` | **Cat C** | `useHealthCheck` (Status dot in header) | Bottom sidebar dot ("AODT CORE ONLINE") | Missing hook | Hook missing; need to bind online status dot to real `/health` response. | Phase 1 (P0) |
| 2 | `GET /station/overview` | **Cat B** | `useStationOverview` (`StatusSummary`, `SubsystemGrid`, `StationSchematic`) | `/command-center` (4 KPI cards, Topology mini-view) | Missing hook | UI has 4 metric cards, but expects different labels/units; needs adapter from `StationOverviewResponse`. | Phase 2 (P0) |
| 3 | `GET /station/comparison` | **Cat B** | `useOperationalIntelligence` (`StationsView`) | `/stations` (Bharati & Maitri cards) | Missing hook | Cards show basic static stats; missing 5-domain headroom comparison (Power, Thermal, Fuel, Life Support, Maintenance). | Phase 9 (P1) |
| 4 | `POST /station/comparison/evaluate` | **Cat F** | Button in `StationsView` | `/stations` ("OPEN STATION" button only) | Missing hook & action | "Trigger Comparison Evaluation" button is missing; needs explicit action to log canonical timeline event. | Phase 9 (P1) |
| 5 | `GET /assets` | **Cat D** | `useAssets` (Asset selector in header/schematic) | Absent (Only G-02 is represented in mock) | Missing hook & UI | Asset listing/filter dropdown is missing in new frontend; only hardcoded G-02 exists. | Phase 3 (P0) |
| 6 | `GET /assets/{asset_id}` | **Cat B** | `useAssetDetail` (`AssetIntelligenceView`) | `/command-center` ("CRITICAL OPERATIONAL EVENT" card) | Missing hook | UI shows G-02 name & telemetry list; needs deep-linked view `/assets/{id}` and live telemetry binding. | Phase 3 (P0) |
| 7 | `GET /assets/{asset_id}/dependencies` | **Cat B** | `useAssetDependencies` (`DependencyBlastRadius`) | `/command-center` ("OPERATIONAL DEPENDENCY MODEL") & `/digital-twin` | Missing hook | Hardcoded 3 rows of dependencies; needs to render real BFS nodes/edges from `AssetDependenciesResponse`. | Phase 4 (P0) |
| 8 | `GET /assets/{asset_id}/telemetry` | **Cat B** | `useAssetTelemetry` (`TelemetryTrends` Recharts) | `/command-center` ("VIBRATION" 11 static bars) | Missing hook | Static `<i>` CSS bars; needs real Recharts time-series line chart bound to sensor history. | Phase 3 (P0) |
| 9 | `GET /assets/{asset_id}/risk` | **Cat D** | `useAssetRisk` (`RiskEngineCard`) | Absent (Only text "+3.1% deviation") | Missing hook & UI | 6-factor composite risk breakdown (0–100 score, mathematical weights, radar/bar breakdown) is missing. | Phase 3 (P0) |
| 10 | `GET /resources/fuel` | **Cat B** | `useFuelStatus` (`ResourcesView` Fuel Tab) | `/resources` ("FUEL" card: 68%, 1,320 L/day, 81 days) | Missing hook | Fuel card exists with hardcoded numbers; needs binding to `FuelStatusResponse` (runway, stock, burn rate). | Phase 5 (P0) |
| 11 | `GET /resources/inventory` | **Cat D** | `useInventory` (`ResourcesView` Spares Table) | Absent (Only abstract "LOGISTICS" card) | Missing hook & UI | Warehouse spare parts inventory table (critical spares, part numbers, stock vs reorder threshold) is missing. | Phase 5 (P1) |
| 12 | `GET /resources/resupply` | **Cat D** | `useResupply` (`ResourcesView` Logistics Banner) | Absent | Missing hook & UI | Vessel/flight resupply logistics card (MV Vasiliy Golovnin ETA, weather window, manifests) is missing. | Phase 5 (P1) |
| 13 | `GET /resources/energy` | **Cat D** | `useEnergyModel` (`ResourcesView` Energy Tab) | Absent (Only abstract "POWER" card) | Missing hook & UI | Comprehensive thermal and electrical energy balance model with ambient temp override is missing. | Phase 5 (P1) |
| 14 | `GET /resources/recovery/{asset_id}` | **Cat D** | `useRecoveryExposure` (`MaintenanceRecoveryCard`) | Absent | Missing hook & UI | 5-milestone recovery chain for blocked work orders (MWO-G02-01) is missing from resources/asset views. | Phase 5 (P1) |
| 15 | `POST /scenarios/simulate` | **Cat F** | `useScenarioSimulation` (`ScenariosView`) | `/scenarios` ("RUN SCENARIO" button) | Missing hook & action | "RUN SCENARIO" currently renders a static text string; needs POST mutation call and side-by-side delta display. | Phase 6 (P0) |
| 16 | `POST /scenarios/cross-station` | **Cat D** | `simulateCrossStationScenario()` (`ScenariosView`) | Absent | Missing hook & UI | Multi-station What-If simulation (evaluating inter-station aid or spare transfer) is missing in new scenarios UI. | Phase 6 (P1) |
| 17 | `GET /resilience/status` | **Cat B** | `useResilienceStatus` (`ResilienceView`) | `/offline` (Comms status & "STORE & FORWARD" panel) | Missing hook | Hardcoded text "ONLINE DEMO"; needs real connection to satellite link status, latency, and mode. | Phase 7 (P0) |
| 18 | `GET /resilience/queue` | **Cat B** | `useSyncQueue` (`ResilienceView`) | `/offline` ("PENDING SYNC" Priority Queue) | Missing hook | Shows 3 static items; needs binding to real `SyncQueueListResponse` with P0–P3 priorities and SHA-256 hashes. | Phase 7 (P0) |
| 19 | `POST /resilience/simulate-offline` | **Cat F** | "Simulate Outage" button (`ResilienceView`) | `/offline` ("ENTER OFFLINE MODE" button) | Missing action wiring | Button currently toggles local React context; needs to invoke `POST /resilience/simulate-offline` to flip backend link. | Phase 7 (P0) |
| 20 | `POST /resilience/restore` | **Cat F** | "Restore & Sync" button (`ResilienceView`) | `/offline` ("RECONNECT & SYNCHRONIZE" button) | Missing action wiring | Button runs fake `window.setTimeout()` sequence; needs to invoke backend restore and display verified SHA-256. | Phase 7 (P0) |
| 21 | `POST /resilience/events` | **Cat D** | "Buffer Local Event" form (`ResilienceView`) | Absent | Missing hook & UI | Form to queue an offline operational event into the priority buffer is missing in the new offline view. | Phase 7 (P1) |
| 22 | `POST /resilience/retry/{queue_id}` | **Cat D** | "Retry Item" button in queue table | Absent | Missing hook & UI | Retry action button on failed transmission items is missing from the queue list. | Phase 7 (P1) |
| 23 | `POST /resilience/reset` | **Cat D** | "Reset Resilience Simulation" button | Absent | Missing hook & UI | Action button to reset resilience state to deterministic baseline is missing. | Phase 7 (P1) |
| 24 | `GET /science/instruments` | **Cat D** | `useScienceInstruments` (`ResilienceView`) | Absent | Missing hook & UI | Scientific instrument continuity table (monitoring S-17 Riometer, buffer capacity, data points) is missing. | Phase 9 (P1) |
| 25 | `GET /science/instruments/{id}/observations` | **Cat D** | `fetchInstrumentObservations()` | Absent | Missing hook & UI | Observation buffer time-series for science instruments is missing. | Phase 9 (P2) |
| 26 | `POST /science/observations/buffer` | **Cat D** | "Buffer Observation" button | Absent | Missing hook & UI | Manual trigger to buffer a scientific observation during offline mode is missing. | Phase 9 (P2) |
| 27 | `GET /incidents` | **Cat B** | `useIncidents` (`ResilienceView` Incidents Tab) | `/alerts` (Alert list with 3 static items) | Missing hook | Alert page exists, but shows 3 hardcoded alerts; needs binding to canonical `GET /incidents` endpoint. | Phase 8 (P0) |
| 28 | `GET /incidents/{incident_id}` | **Cat D** | `useIncidentDetail` (`IncidentDetailModal`) | Absent | Missing hook & UI | Deep-dive Common Operating Picture (COP) for a specific incident with blast radius is missing. | Phase 8 (P1) |
| 29 | `POST /incidents` | **Cat D** | "Open Incident" modal form | Absent | Missing hook & UI | Form to log/create an operational incident is missing. | Phase 8 (P2) |
| 30 | `POST /incidents/{incident_id}/actions` | **Cat D** | "Log Action" modal form | Absent | Missing hook & UI | Form to record an operator response action against an incident is missing. | Phase 8 (P1) |
| 31 | `PATCH /incidents/{incident_id}/status` | **Cat F** | Status dropdown (ACTIVE -> CONTAINED -> RESOLVED) | `/alerts` ("MARK AS REVIEWED" button) | Missing action wiring | Button appends to local array; needs to invoke backend status transition endpoint. | Phase 8 (P0) |
| 32 | `GET /memory` | **Cat D** | `useOperationalMemory` (`ResilienceView` Memory Tab) | Absent | Missing hook & UI | Institutional knowledge and post-mortem search interface is completely missing from new frontend. | Phase 8 (P1) |
| 33 | `POST /memory` | **Cat D** | "Record Memory" modal form | Absent | Missing hook & UI | Form to record a post-mortem lesson into operational memory is missing. | Phase 8 (P2) |
| 34 | `GET /events` | **Cat B** | `fetchOperationalEvents` (`ActivityStream`) | `/command-center` ("OPERATIONAL ACTIVITY") | Missing hook | UI has 4-item static list; needs binding to real chronological event stream with severity filters. | Phase 2 (P0) |
| 35 | `POST /events/simulate` | **Cat D** | "Advance Demo Event" button (`ActivityStream`) | Absent | Missing hook & UI | Interactive demo control to advance event timeline step is missing. | Phase 2 (P1) |
| 36 | `POST /events/reset` | **Cat D** | "Reset Events" button (`ActivityStream`) | Absent | Missing hook & UI | Control to reset event stream to canonical baseline is missing. | Phase 2 (P1) |
| 37 | `GET /explain/{domain}/{entity_id}` | **Cat B** | `fetchExplanation` (`ExplanationDrawer`) | `/command-center` (`ExplanationDrawer` Sheet) | Missing hook | Sheet displays 5 hardcoded questions; needs dynamic binding to real structured explanation API response. | Phase 4 (P0) |
| 38 | `POST /explain` | **Cat G** | Internal programmatic query helper | None (UI uses GET) | Not needed | Programmatic POST query payload for explanation; UI uses GET endpoint. | Phase 4 (P2) |
| 39 | `GET /intelligence/narrative` | **Cat B** | `useOperationalIntelligence` (`CrossStationContextCard`) | `/command-center` ("CAUSAL REASONING" accordion) | Missing hook | Accordion shows 6 hardcoded steps; needs binding to backend 7-stage causal narrative synthesis. | Phase 2 (P0) |
| 40 | `POST /visitor/event` | **Cat C** | `useVisitorSession` (Auto-beacon on navigation) | Absent | Missing hook | Silent background session beaconing hook needs to be ported into new app root shell. | Phase 10 (P1) |
| 41 | `POST /visitor/complete` | **Cat C** | `useVisitorSession` (Beacon on unload/timeout) | Absent | Missing hook | Session completion beacon hook needs to be ported into new app root shell. | Phase 10 (P1) |

---

## 3. Summary of Endpoint Categorization

| Category | Endpoint Count | Percentage |
|---|---|---|
| **Cat A (Already fully represented)** | 0 | 0.0% |
| **Cat B (Partially represented / Mocked UI)** | 14 | 34.1% |
| **Cat C (Backend integration missing)** | 3 | 7.3% |
| **Cat D (UI completely missing in new frontend)** | 18 | 43.9% |
| **Cat E (Needs adapter/transform only)** | 0 | 0.0% |
| **Cat F (Needs interaction/mutation wiring)** | 5 | 12.2% |
| **Cat G (Internal / non-direct UI endpoint)** | 1 | 2.4% |
| **Cat H (Needs clarification)** | 0 | 0.0% |
| **Total Endpoints** | **41** | **100.0%** |
