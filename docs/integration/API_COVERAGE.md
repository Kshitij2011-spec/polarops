# PolarOps API Coverage & Integration Matrix

This document tracks all 41 backend endpoints across 13 domains, their client bindings in `frontend/src/lib/api.ts`, their integration into the new PolarOps frontend, and verification status.

## Status Legend
- ✅ **ACTIVE REAL**: Fully integrated, wired to UI, backed by real backend API and verified.
- 🟡 **STAGED CLIENT**: Fully typed in `frontend/src/lib/api.ts` and hook ready; scheduled for route integration in designated phase.
- ⚪ **INTERNAL / UTILITY**: Background or diagnostic endpoint.

---

## Complete Endpoint Mapping

| # | Domain | Method | Endpoint | Client Function (`api.ts`) | Target UI Route / Component | Phase | Status |
|---|--------|--------|----------|----------------------------|-----------------------------|-------|--------|
| 1 | Health | GET | `/health` | `fetchHealth()` | `Sidebar` & `Header` | Phase 1 | ✅ ACTIVE REAL |
| 2 | Station | GET | `/stations/{id}/overview` | `fetchStationOverview()` | `/command-center` Metrics & Status | Phase 2 | 🟡 STAGED CLIENT |
| 3 | Station | GET | `/stations/compare` | `fetchStationComparison()` | `/stations` Portfolio Comparison | Phase 10 | 🟡 STAGED CLIENT |
| 4 | Station | POST | `/stations/compare/evaluate` | `evaluateStationComparison()` | `/stations` Headroom Evaluation | Phase 10 | 🟡 STAGED CLIENT |
| 5 | Station | POST | `/stations/compare/scenario` | `simulateCrossStationScenario()` | `/stations` Cross-Station Sim | Phase 10 | 🟡 STAGED CLIENT |
| 6 | Assets | GET | `/stations/{id}/assets` | `fetchAssets()` | `/digital-twin` Asset Explorer | Phase 3 | 🟡 STAGED CLIENT |
| 7 | Assets | GET | `/assets/{id}` | `fetchAssetDetail()` | `/digital-twin` Selected Asset Card | Phase 3 | 🟡 STAGED CLIENT |
| 8 | Assets | GET | `/assets/{id}/dependencies` | `fetchAssetDependencies()` | `/digital-twin` Dependency Topology | Phase 4 | 🟡 STAGED CLIENT |
| 9 | Assets | GET | `/assets/{id}/telemetry` | `fetchAssetTelemetry()` | `/digital-twin` Telemetry History | Phase 3 | 🟡 STAGED CLIENT |
| 10 | Assets | GET | `/assets/{id}/risk` | `fetchAssetRisk()` | `/digital-twin` 6-Factor Risk Card | Phase 3 | 🟡 STAGED CLIENT |
| 11 | Assets | GET | `/assets/{id}/recovery-exposure` | `fetchRecoveryExposure()` | `/resources` Spares & Recovery | Phase 5 | 🟡 STAGED CLIENT |
| 12 | Resources | GET | `/resources/fuel` | `fetchFuelStatus()` | `/resources` Fuel Autonomy Gauges | Phase 5 | 🟡 STAGED CLIENT |
| 13 | Resources | GET | `/resources/inventory` | `fetchInventory()` | `/resources` Warehouse & Spares | Phase 5 | 🟡 STAGED CLIENT |
| 14 | Resources | GET | `/resources/resupply` | `fetchResupply()` | `/resources` Supply Windows | Phase 5 | 🟡 STAGED CLIENT |
| 15 | Resources | POST | `/resources/energy-model` | `fetchEnergyModel()` | `/resources` Thermal & Electrical Load | Phase 5 | 🟡 STAGED CLIENT |
| 16 | Scenarios | POST | `/scenarios/simulate` | `simulateScenario()` | `/scenarios` Simulation Engine | Phase 6 | 🟡 STAGED CLIENT |
| 17 | Explainability | GET | `/explain/asset/{id}` | `fetchExplanation("ASSET", id)` | `ExplanationDrawer` (5-step trace) | Phase 4 | 🟡 STAGED CLIENT |
| 18 | Explainability | GET | `/explain/incident/{id}` | `fetchExplanation("INCIDENT", id)` | `ExplanationDrawer` (5-step trace) | Phase 4 | 🟡 STAGED CLIENT |
| 19 | Explainability | GET | `/explain/station/{id}` | `fetchExplanation("STATION", id)` | `ExplanationDrawer` (5-step trace) | Phase 4 | 🟡 STAGED CLIENT |
| 20 | Resilience | GET | `/resilience/comms/status` | `fetchResilienceStatus()` | `/resilience` & `/offline` | Phase 8 | 🟡 STAGED CLIENT |
| 21 | Resilience | GET | `/resilience/sync/queue` | `fetchSyncQueue()` | `/offline` Priority Store & Fwd | Phase 8 | 🟡 STAGED CLIENT |
| 22 | Resilience | POST | `/resilience/comms/simulate-offline` | `simulateOffline()` | `/offline` Outage Toggle | Phase 8 | 🟡 STAGED CLIENT |
| 23 | Resilience | POST | `/resilience/comms/restore-and-sync` | `restoreAndSync()` | `/offline` Reconnect & Sync | Phase 8 | 🟡 STAGED CLIENT |
| 24 | Resilience | POST | `/resilience/sync/retry/{id}` | `retryQueueItem()` | `/offline` Queue Retry Action | Phase 8 | 🟡 STAGED CLIENT |
| 25 | Resilience | POST | `/resilience/reset-simulation` | `resetResilienceSimulation()` | `/offline` Reset Control | Phase 8 | 🟡 STAGED CLIENT |
| 26 | Resilience | POST | `/resilience/events` | `createResilienceEvent()` | `/offline` Offline Action Logging | Phase 8 | 🟡 STAGED CLIENT |
| 27 | Science | GET | `/science/instruments` | `fetchScienceInstruments()` | `/resources` Science Load | Phase 10 | 🟡 STAGED CLIENT |
| 28 | Science | GET | `/science/instruments/{id}` | `fetchInstrumentObservations()` | `/resources` Instrument Details | Phase 10 | 🟡 STAGED CLIENT |
| 29 | Science | POST | `/science/observations/buffer` | `bufferScienceObservation()` | `/offline` Science Data Buffering | Phase 10 | 🟡 STAGED CLIENT |
| 30 | Incidents | GET | `/incidents` | `fetchIncidents()` | `/alerts` Event Stream | Phase 9 | 🟡 STAGED CLIENT |
| 31 | Incidents | GET | `/incidents/{id}` | `fetchIncidentDetail()` | `/alerts` Incident Inspection | Phase 9 | 🟡 STAGED CLIENT |
| 32 | Incidents | POST | `/incidents` | `createIncident()` | `/alerts` Create Incident | Phase 9 | 🟡 STAGED CLIENT |
| 33 | Incidents | POST | `/incidents/{id}/actions` | `logIncidentAction()` | `/alerts` Action Ledger | Phase 9 | 🟡 STAGED CLIENT |
| 34 | Incidents | PATCH | `/incidents/{id}/status` | `updateIncidentStatus()` | `/alerts` Triage / Resolution | Phase 9 | 🟡 STAGED CLIENT |
| 35 | Memory | GET | `/memory/search` | `searchOperationalMemory()` | `/reports` Operational Memory | Phase 9 | 🟡 STAGED CLIENT |
| 36 | Memory | POST | `/memory/records` | `recordOperationalMemory()` | `/reports` Capture Decision Record | Phase 9 | 🟡 STAGED CLIENT |
| 37 | Events | GET | `/events/` | `fetchOperationalEvents()` | `/command-center` Activity Stream | Phase 2 | 🟡 STAGED CLIENT |
| 38 | Events | POST | `/events/demo/simulate-event` | `simulateDemoEvent()` | Settings / Interactive Demo | Phase 2 | 🟡 STAGED CLIENT |
| 39 | Events | POST | `/events/demo/reset` | `resetDemoEvents()` | Settings / Interactive Demo | Phase 2 | 🟡 STAGED CLIENT |
| 40 | Intelligence | GET | `/intelligence/narrative` | `fetchOperationalIntelligence()` | `/command-center` Causal Intelligence | Phase 2 | 🟡 STAGED CLIENT |
| 41 | Root | GET | `/` | Direct Root Ping | API Metadata / Docs Link | Phase 1 | ⚪ INTERNAL / UTILITY |
