# PolarOps — Backend Capability & Endpoint Inventory
**Phase 0 Output · Document 2 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Domain Service & Architecture Overview

The PolarOps backend is built with **FastAPI** and **SQLAlchemy**, exposing 41 distinct operational endpoints across 13 core domains. The backend adheres strictly to the **Domain Logic Ownership** rule: all calculations, risk scoring, BFS graph traversals, and scenario simulations are performed server-side.

| Domain | Router File | Primary Service File | Key Schemas | Database Tables Used | Test File |
|---|---|---|---|---|---|
| **Health** | `health.py` | Built-in | None (`dict`) | None | `test_health.py` |
| **Station** | `station.py` | `station_service.py` | `station.py` | `stations`, `weather_observations`, `assets`, `services` | `test_station_api.py` |
| **Assets** | `assets.py` | `asset_service.py`, `dependency_service.py`, `risk_service.py`, `telemetry_service.py` | `asset.py` | `assets`, `sensors`, `measurements`, `asset_dependencies`, `services` | `test_assets_api.py`, `test_risk_intelligence.py` |
| **Resources** | `resources.py` | `resource_service.py`, `energy_service.py` | `resource.py` | `energy_resources`, `inventory_items`, `spare_parts`, `resupply_opportunities`, `maintenance_work_orders` | `test_domain_models.py`, `test_day3_scenarios.py` |
| **Scenarios** | `scenarios.py` | `scenario_service.py` | `scenario.py` | In-memory traversal over `assets`, `energy_resources`, `weather_observations` | `test_day3_scenarios.py`, `test_day3_scenarios_cross_domain.py` |
| **Resilience & Sync** | `resilience.py` | `sync_service.py` | `resilience.py` | `communication_links`, `sync_queue_items` | `test_day4_resilience.py` |
| **Science Continuity** | `science.py` | `science_service.py` | `resilience.py` | `scientific_instruments`, `scientific_observations` | `test_day4_resilience.py` |
| **Incidents & Actions** | `incidents.py` | `incident_service.py` | `resilience.py` | `incidents`, `operational_actions` | `test_day4_resilience.py` |
| **Operational Memory** | `memory.py` | `incident_service.py` | `resilience.py` | `operational_memory` | `test_day4_resilience.py` |
| **Events** | `events.py` | `event_service.py` | `events.py` | `event_logs` | `test_events.py` |
| **Explainability** | `explainability.py` | `explainability_service.py` | `explainability.py` | Composite multi-domain lookup | `test_explainability.py` |
| **Operational Intelligence** | `intelligence.py` | `intelligence_service.py` | `intelligence.py` | Composite 7-stage synthesis | `test_operational_intelligence.py`, `test_day2_intelligence.py` |
| **Visitor & Analytics** | `visitor.py` | `visitor_session_service.py`, `mailgun_service.py` | `visitor.py` | In-memory session tracking + Mailgun API | `test_visitor_alerts.py` |

---

## 2. Complete Endpoint Inventory Matrix

| # | Domain | Method | Route | Parameters & Body | Response Schema | Mutates State? | Deterministic? | Provenance Tier | Old FE Hook / Function | New FE Status | Backend Test Coverage |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Health | `GET` | `/health` | None | `dict` (`status`, `service`) | No | Yes | N/A | `fetchHealth()` / `useHealthCheck` | Missing | `test_health.py` |
| 2 | Station | `GET` | `/station/overview` | `station_id: str` (Query) | `StationOverviewResponse` | No | Yes | `MEASURED` & `DERIVED` | `fetchStationOverview()` / `useStationOverview` | Mocked (`demoMetrics`, `demoStationData`) | `test_station_api.py` |
| 3 | Station | `GET` | `/station/comparison` | `station_a_id`, `station_b_id`, `record_event: bool` | `StationComparisonResponse` | Optional | Yes | `DERIVED` | `fetchStationComparison()` / `useOperationalIntelligence` | Mocked (`demoStationData`) | `test_day4_multi_station.py` |
| 4 | Station | `POST` | `/station/comparison/evaluate` | `station_a_id`, `station_b_id` | `StationComparisonResponse` | Yes (Logs event) | Yes | `DERIVED` | `evaluateStationComparison()` | Missing | `test_day4_multi_station.py` |
| 5 | Assets | `GET` | `/assets` | `station_id`, `category?`, `status?` | `list[AssetListItem]` | No | Yes | `MEASURED` | `fetchAssets()` / `useAssets` | Missing | `test_assets_api.py` |
| 6 | Assets | `GET` | `/assets/{asset_id}` | `asset_id: str` (Path) | `AssetDetailResponse` | No | Yes | `MEASURED` | `fetchAssetDetail()` / `useAssetDetail` | Mocked (`demoG02` tuple) | `test_assets_api.py` |
| 7 | Assets | `GET` | `/assets/{asset_id}/dependencies` | `asset_id: str`, `max_depth: int = 5` | `AssetDependenciesResponse` | No | Yes | `DERIVED` | `fetchAssetDependencies()` / `useAssetDependencies` | Mocked (`demoDependencies`) | `test_assets_api.py` |
| 8 | Assets | `GET` | `/assets/{asset_id}/telemetry` | `asset_id: str`, `limit: int = 50` | `AssetTelemetryResponse` | No | Yes | `MEASURED` | `fetchAssetTelemetry()` / `useAssetTelemetry` | Mocked (Static SVG bars) | `test_assets_api.py` |
| 9 | Assets | `GET` | `/assets/{asset_id}/risk` | `asset_id: str` (Path) | `AssetRiskResponse` | No | Yes | `DERIVED` | `fetchAssetRisk()` / `useAssetRisk` | Missing (No 6-factor card) | `test_risk_intelligence.py` |
| 10 | Resources | `GET` | `/resources/fuel` | `station_id: str` (Query) | `FuelStatusResponse` | No | Yes | `MEASURED` & `FORECAST` | `fetchFuelStatus()` / `useFuelStatus` | Mocked (`demoResources[0]`) | `test_domain_models.py` |
| 11 | Resources | `GET` | `/resources/inventory` | `station_id: str` (Query) | `list[InventorySpareItem]` | No | Yes | `MEASURED` | `fetchInventory()` / `useInventory` | Missing | `test_domain_models.py` |
| 12 | Resources | `GET` | `/resources/resupply` | `station_id: str` (Query) | `list[ResupplyOpportunityItem]` | No | Yes | `FORECAST` | `fetchResupply()` / `useResupply` | Missing | `test_domain_models.py` |
| 13 | Resources | `GET` | `/resources/energy` | `station_id: str`, `ambient_temp_override?` | `EnergyModelResponse` | No | Yes | `DERIVED` | `fetchEnergyModel()` / `useEnergyModel` | Missing | `test_domain_models.py` |
| 14 | Resources | `GET` | `/resources/recovery/{asset_id}` | `asset_id: str` (Path) | `AssetRecoveryExposureResponse` | No | Yes | `DERIVED` | `fetchRecoveryExposure()` / `useRecoveryExposure` | Missing | `test_domain_models.py` |
| 15 | Scenarios | `POST` | `/scenarios/simulate` | Body: `ScenarioSimulateRequest` | `ScenarioSimulateResponse` | No (In-memory) | Yes | `SYNTHETIC_SIMULATION` | `simulateScenario()` / `useScenarioSimulation` | Mocked (Static string on click) | `test_day3_scenarios.py` |
| 16 | Scenarios | `POST` | `/scenarios/cross-station` | Body: `CrossStationScenarioRequest` | `CrossStationScenarioResponse` | No (In-memory) | Yes | `SYNTHETIC_SIMULATION` | `simulateCrossStationScenario()` | Missing | `test_day3_scenarios_cross_domain.py` |
| 17 | Resilience | `GET` | `/resilience/status` | `station_id: str` (Query) | `CommsLinkStatusResponse` | No | Yes | `MEASURED` | `fetchResilienceStatus()` / `useResilienceStatus` | Mocked (`demoOfflineState`) | `test_day4_resilience.py` |
| 18 | Resilience | `GET` | `/resilience/queue` | `station_id: str` (Query) | `SyncQueueListResponse` | No | Yes | `MEASURED` | `fetchSyncQueue()` / `useSyncQueue` | Mocked (`demoSyncQueue`) | `test_day4_resilience.py` |
| 19 | Resilience | `POST` | `/resilience/simulate-offline` | `station_id: str` (Query) | `CommsLinkStatusResponse` | Yes (Mutates link) | Yes | `SYNTHETIC_SIMULATION` | `simulateOffline()` | Mocked (Local state switch) | `test_day4_resilience.py` |
| 20 | Resilience | `POST` | `/resilience/restore` | `station_id: str` (Query) | `RestoreLinkResponse` | Yes (Mutates link & queue) | Yes | `DERIVED` (SHA-256) | `restoreAndSync()` | Mocked (Local `setTimeout`) | `test_day4_resilience.py` |
| 21 | Resilience | `POST` | `/resilience/events` | Body: `CreateEventRequest` | `SyncQueueItemSchema` | Yes (Inserts queue item) | Yes | `MEASURED` | `createResilienceEvent()` | Missing | `test_day4_resilience.py` |
| 22 | Resilience | `POST` | `/resilience/retry/{queue_id}` | `queue_id: str` (Path) | `SyncQueueItemSchema` | Yes (Updates status) | Yes | `DERIVED` | `retryQueueItem()` | Missing | `test_day4_resilience.py` |
| 23 | Resilience | `POST` | `/resilience/reset` | `station_id: str` (Query) | `ResetSimulationResponse` | Yes (Resets state) | Yes | `SYNTHETIC_SIMULATION` | `resetResilienceSimulation()` | Missing | `test_day4_resilience.py` |
| 24 | Science | `GET` | `/science/instruments` | `station_id: str` (Query) | `list[ScienceInstrumentDetailResponse]` | No | Yes | `MEASURED` | `fetchScienceInstruments()` / `useScienceInstruments` | Missing | `test_day4_resilience.py` |
| 25 | Science | `GET` | `/science/instruments/{instrument_id}/observations` | `instrument_id: str` (Path) | `ScienceInstrumentDetailResponse` | No | Yes | `MEASURED` | `fetchInstrumentObservations()` | Missing | `test_day4_resilience.py` |
| 26 | Science | `POST` | `/science/observations/buffer` | Body: `BufferObservationRequest` | `ScienceObservationSchema` | Yes (Buffers observation) | Yes | `MEASURED` | `bufferScienceObservation()` | Missing | `test_day4_resilience.py` |
| 27 | Incidents | `GET` | `/incidents` | `station_id: str` (Query) | `list[IncidentListItemResponse]` | No | Yes | `MEASURED` | `fetchIncidents()` / `useIncidents` | Mocked (`demoAlerts` 3 items) | `test_day4_resilience.py` |
| 28 | Incidents | `GET` | `/incidents/{incident_id}` | `incident_id: str` (Path) | `IncidentDetailResponse` | No | Yes | `DERIVED` | `fetchIncidentDetail()` / `useIncidentDetail` | Missing | `test_day4_resilience.py` |
| 29 | Incidents | `POST` | `/incidents` | Body: `IncidentCreateRequest` | `IncidentDetailResponse` | Yes (Creates incident) | Yes | `MEASURED` | `createIncident()` | Missing | `test_day4_resilience.py` |
| 30 | Incidents | `POST` | `/incidents/{incident_id}/actions` | `incident_id: str`, Body: `IncidentActionCreateRequest` | `IncidentActionSchema` | Yes (Logs action) | Yes | `MEASURED` | `logIncidentAction()` | Missing | `test_day4_resilience.py` |
| 31 | Incidents | `PATCH` | `/incidents/{incident_id}/status` | `incident_id: str`, Body/Query: `status` | `IncidentDetailResponse` | Yes (Updates status) | Yes | `DERIVED` | `updateIncidentStatus()` | Mocked (Local array in Alerts) | `test_day4_resilience.py` |
| 32 | Memory | `GET` | `/memory` | `q?: str`, `station_id: str` | `MemorySearchResponse` | No | Yes | `DERIVED` | `searchOperationalMemory()` / `useOperationalMemory` | Missing | `test_day4_resilience.py` |
| 33 | Memory | `POST` | `/memory` | Body: `CreateMemoryRequest` | `OperationalMemorySchema` | Yes (Stores memory) | Yes | `DERIVED` | `recordOperationalMemory()` | Missing | `test_day4_resilience.py` |
| 34 | Events | `GET` | `/events` (`/api/v1/events`) | `station_id`, `severity?`, `event_type?`, `limit`, `offset` | `EventListResponse` | No | Yes | `MEASURED` | `fetchOperationalEvents()` | Mocked (`demoActivities`) | `test_events.py` |
| 35 | Events | `POST` | `/events/simulate` (`/api/v1/events/simulate`) | Body: `SimulateEventRequest` | `OperationalEventSchema` | Yes (Advances demo) | Yes | `SYNTHETIC_SIMULATION` | `simulateDemoEvent()` | Missing | `test_events.py` |
| 36 | Events | `POST` | `/events/reset` (`/api/v1/events/reset`) | `station_id: str` (Query) | `ResetEventsResponse` | Yes (Resets event log) | Yes | `SYNTHETIC_SIMULATION` | `resetDemoEvents()` | Missing | `test_events.py` |
| 37 | Explainability | `GET` | `/explain/{domain}/{entity_id}` | `domain: str`, `entity_id: str`, `station_id: str` | `ExplanationResponse` | No | Yes | `DERIVED` & `ADVISORY` | `fetchExplanation()` | Mocked (Static 5 steps in drawer) | `test_explainability.py` |
| 38 | Explainability | `POST` | `/explain` (`/api/v1/explain`) | Body: `ExplanationQueryRequest` | `ExplanationResponse` | No | Yes | `DERIVED` & `ADVISORY` | `fetchExplanation()` (POST) | Missing | `test_explainability.py` |
| 39 | Intelligence | `GET` | `/intelligence/narrative` (and 3 aliases) | `station_id: str` (Query) | `OperationalInsightResponse` | No | Yes | `DERIVED` & `ADVISORY` | `fetchOperationalIntelligence()` / `useOperationalIntelligence` | Mocked (`demoTimeline`, static text) | `test_operational_intelligence.py` |
| 40 | Visitor | `POST` | `/visitor/event` (`/api/visitor/event`) | Body: `VisitorEventRequest` | `VisitorSessionResponse` | Yes (In-memory + Mailgun) | No (Time-dependent) | N/A | `useVisitorSession` (auto-beacon) | Missing | `test_visitor_alerts.py` |
| 41 | Visitor | `POST` | `/visitor/complete` (`/api/visitor/complete`) | Body: `VisitorCompleteRequest` | `VisitorSessionResponse` | Yes (In-memory + Mailgun) | No (Time-dependent) | N/A | `useVisitorSession` (auto-beacon) | Missing | `test_visitor_alerts.py` |

---

## 3. Key Observations on Backend Endpoints

1. **State Mutation Boundaries:** Exactly 15 endpoints mutate state. All state mutations are deterministic database transactions or in-memory session transitions.
2. **Deterministic Calculations:** 39 out of 41 endpoints are 100% deterministic functions of the database state and request parameters.
3. **Data Provenance:** Every response schema inherits from or contains `ProvenanceSchema`, requiring `truth_type`, `source`, `timestamp`, `freshness`, `quality`, and `confidence`.
4. **Existing Frontend Coverage:** The old frontend consumed **100% of these endpoints** (all 41 endpoints have corresponding TypeScript fetchers in `frontend/src/lib/api.ts` and hooks in `frontend/src/hooks/`).
5. **New Frontend Coverage:** The new frontend currently consumes **0% of these endpoints** directly. All representations are powered by hardcoded static strings and tuples originally defined in `src/lib/demo-data.ts`.
