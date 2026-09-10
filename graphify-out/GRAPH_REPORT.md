# Graph Report - PolarOps  (2026-09-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1164 nodes · 2838 edges · 59 communities (50 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 208 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8d03293`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sync_service.py
- api.ts
- asset.py
- event_service.py
- models/__init__.py
- explainability_service.py
- station_service.py
- incident_service.py
- lucide-react
- ResilienceView.tsx
- ProvenanceSchema
- resources.py
- main.py
- science_service.py
- App.tsx
- asset_service.py
- Asset
- @tanstack/react-query
- entities.py
- resource_service.py
- test_day4_multi_station.py
- compilerOptions
- test_explainability.py
- TruthBadge.tsx
- OperationalMemorySchema
- test_day2_intelligence.py
- scenario_service.py
- package.json
- compilerOptions
- OperationalEventType
- useTheme.tsx
- @playwright/test
- Incident
- test_domain_models.py
- simulate_operational_scenario
- TestClient
- test_risk_intelligence.py
- StationsView.tsx
- scenarios.py
- test_assets_api.py
- devDependencies
- dependencies
- ScenariosView.tsx
- Settings
- scripts
- vercel.json
- test_station_api.py
- .oxlintrc.json
- env.py
- test_health.py
- health_check
- tsconfig.json
- polarops-backend

## God Nodes (most connected - your core abstractions)
1. `ProvenanceSchema` - 37 edges
2. `Asset` - 35 edges
3. `seed_database()` - 35 edges
4. `Base` - 34 edges
5. `TruthType` - 33 edges
6. `Quality` - 27 edges
7. `calculate_asset_risk()` - 27 edges
8. `lucide-react` - 24 edges
9. `SyncStatus` - 23 edges
10. `Incident` - 23 edges

## Surprising Connections (you probably didn't know these)
- `explain_communication()` --uses--> `SyncQueueItem`  [INFERRED]
  backend/app/services/explainability_service.py → backend/app/models/entities.py
- `explain_science()` --uses--> `SyncQueueItem`  [INFERRED]
  backend/app/services/explainability_service.py → backend/app/models/entities.py
- `get_instrument_detail()` --uses--> `SyncQueueItem`  [INFERRED]
  backend/app/services/science_service.py → backend/app/models/entities.py
- `explain_communication()` --uses--> `CommsLinkStatus`  [INFERRED]
  backend/app/services/explainability_service.py → backend/app/models/enums.py
- `explain_communication()` --uses--> `SyncStatus`  [INFERRED]
  backend/app/services/explainability_service.py → backend/app/models/enums.py

## Import Cycles
- None detected.

## Communities (59 total, 3 thin omitted)

### Community 0 - "sync_service.py"
Cohesion: 0.08
Nodes (63): get_link_status(), get_priority_queue(), get, post, Session, queue_local_event(), API router for Communication Resilience, Priority Queue, and Offline Sync., Return satellite communication link status, latency, and unsynced queue count. (+55 more)

### Community 1 - "api.ts"
Cohesion: 0.04
Nodes (52): CriticalEvents(), CriticalEventsProps, useHealthCheck(), useOperationalIntelligence(), AmbientWeather, AssetMetric, CausalStageItem, CommsLinkStatus (+44 more)

### Community 2 - "asset.py"
Cohesion: 0.07
Nodes (54): get_asset_by_id(), get_asset_dependency_tree(), get_asset_risk_assessment(), get_asset_telemetry(), get_assets_list(), get, Session, Asset intelligence, multi-hop dependency, telemetry trends, and explainable… (+46 more)

### Community 3 - "event_service.py"
Cohesion: 0.08
Nodes (48): list_events(), get, post, Session, API router for Canonical Operational Event Stream and demo simulation., Retrieve chronologically ordered operational events for the station., Generate or advance a deterministic demonstration operational event., Reset the operational event stream for the specified station back to the… (+40 more)

### Community 4 - "models/__init__.py"
Cohesion: 0.10
Nodes (43): Base, Shared declarative base for all ORM models., ensure_maitri_canonical_state(), Session, Deterministic and idempotent database seeder for PolarOps Antarctic Digital…, Populate database with deterministic synthetic Antarctic station data., Ensure STATION-MAITRI has full canonical operational state populated…, seed_database() (+35 more)

### Community 5 - "explainability_service.py"
Cohesion: 0.12
Nodes (43): get_explanation(), post_explanation(), get, post, Session, API router for Deterministic Operational Explainability Layer., Retrieve structured deterministic operational explanation for an entity across…, Query structured deterministic explanation via JSON request payload. (+35 more)

### Community 6 - "station_service.py"
Cohesion: 0.10
Nodes (40): evaluate_station_comparison_explicit(), get_station_comparison_endpoint(), get_station_situation_overview(), get, post, Session, Station situation awareness and environment API router., Return high-level situation awareness metrics, weather, and subsystem status. (+32 more)

### Community 7 - "incident_service.py"
Cohesion: 0.09
Nodes (39): get_incident(), IncidentStatusUpdateRequest, list_incidents(), log_action(), open_incident(), patch_incident_status(), BaseModel, get (+31 more)

### Community 8 - "lucide-react"
Cohesion: 0.10
Nodes (27): AssetHeader(), AssetHeaderProps, AssetIntelligenceView(), AssetIntelligenceViewProps, DependencyBlastRadius(), DependencyBlastRadiusProps, MaintenanceRecoveryCard(), MaintenanceRecoveryCardProps (+19 more)

### Community 9 - "ResilienceView.tsx"
Cohesion: 0.09
Nodes (30): ResilienceTab, ResilienceView(), ResilienceViewProps, useIncidentDetail(), useIncidents(), useOperationalMemory(), useResilienceStatus(), useScienceInstruments() (+22 more)

### Community 10 - "ProvenanceSchema"
Cohesion: 0.10
Nodes (31): get_operational_intelligence(), get, Session, Retrieve synthesized 7-stage deterministic causal narrative for station…, Quality, Telemetry data quality assessment., ErrorDetail, ErrorResponse (+23 more)

### Community 11 - "resources.py"
Cohesion: 0.11
Nodes (31): get_energy_balance(), get_fuel_status(), get_inventory_items(), get_recovery_exposure(), get_resupply_opportunities(), get, Session, Cross-domain resources, fuel runway, warehouse inventory, and resupply… (+23 more)

### Community 12 - "main.py"
Cohesion: 0.11
Nodes (22): Health check endpoint., API router for Incident Workspace and Response Actions., Operational Intelligence consolidation and causal reasoning API router., API router for Operational Memory and Institutional Knowledge., Application configuration loaded from environment variables., get_db(), Database engine, session factory, and base model. Provides the SQLAlchemy…, FastAPI dependency yielding a database session. (+14 more)

### Community 13 - "science_service.py"
Cohesion: 0.13
Nodes (28): buffer_observation(), get_instrument_observations(), list_science_instruments(), get, post, Session, API router for Scientific Instrument Continuity and Observation Buffering., Retrieve all scientific experiment instruments and data buffer statuses. (+20 more)

### Community 14 - "App.tsx"
Cohesion: 0.11
Nodes (21): App(), getAssetIdFromPath(), getViewFromPath(), Footer(), FooterProps, PrivacyPolicy(), PrivacyPolicyProps, StationSchematic() (+13 more)

### Community 15 - "asset_service.py"
Cohesion: 0.11
Nodes (26): AssetMetricSchema, DependencyEdge, DependencyNode, DownstreamImpact, DownstreamServiceImpact, Latest reading and threshold boundaries for an asset sensor., Upstream asset required for this equipment's operation., Service affected by this asset. (+18 more)

### Community 16 - "Asset"
Cohesion: 0.08
Nodes (27): Asset, Physical machinery, infrastructure, or payload asset., Unit and integration tests for Day 4 Resilience, Science Continuity, Incidents,…, Verify that canonical SHA-256 serialization produces identical hashes…, Verify retrying a failed queue item recomputes checksum and reconciles item., Verify science instruments listing and generic offline observation buffering., Verify incident creation, Day 2 dependency/risk engine reuse, and action…, Verify explicit human-controlled memory recording and deterministic search. (+19 more)

### Community 17 - "@tanstack/react-query"
Cohesion: 0.12
Nodes (21): ResourcesView(), ResourcesViewProps, useAssets(), useEnergyModel(), useFuelStatus(), useInventory(), useRecoveryExposure(), useResupply() (+13 more)

### Community 18 - "entities.py"
Cohesion: 0.14
Nodes (23): datetime, SQLAlchemy ORM models representing the canonical Antarctic Operational Digital…, Return timezone-aware current UTC datetime., utc_now(), AssetCategory, AssetStatus, Criticality, EnvironmentMode (+15 more)

### Community 19 - "resource_service.py"
Cohesion: 0.10
Nodes (20): MaintenanceWorkOrder, Operational maintenance or repair task., MaintenanceStatus, Work order lifecycle state., Domain service for fuel reserves, warehouse inventory, resupply logistics, and…, Unit and API integration tests for Day 3 Resources, Energy, and What-If…, Simulations with different durations produce deterministic duration-dependent…, Scenario execution MUST NOT mutate any database entity or baseline operational… (+12 more)

### Community 20 - "test_day4_multi_station.py"
Cohesion: 0.09
Nodes (21): Comprehensive tests for Day 4 Multi-Station Operational Coordination. Tests…, POST /scenarios/cross-station evaluates Bharati disruption against Maitri…, GET /explain/CROSS_STATION/PORTFOLIO returns complete 8-part structured…, Repeated calls to get_station_comparison produce bit-for-bit reproducible…, GET /station/comparison exposes structured 4-part recovery chain for G-02 with…, GET /explain/RECOVERY/G-02 returns deterministic causal explanation for…, Headroom scores have calculation_basis, comms logic is defensible (no arbitrary…, GET /station/comparison returns structured portfolio comparison between Bharati… (+13 more)

### Community 21 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+13 more)

### Community 22 - "test_explainability.py"
Cohesion: 0.10
Nodes (19): Tests for Deterministic Operational Explainability Layer and Cross-Domain…, Test Communication / Resilience explanation., Test Science explanation for hero radar instrument S-17., Test Incident explanation for active hero incident INC-2026-04., Test POST /api/v1/explain query payload., Test unsupported domain returns clean HTTP 400., MANDATORY CROSS-DOMAIN TEST: Proves G-02 explanation explicitly synthesizes…, Test deterministic reproducibility: consecutive queries yield identical results. (+11 more)

### Community 23 - "TruthBadge.tsx"
Cohesion: 0.15
Nodes (15): ActivityStream(), ActivityStreamProps, FilterType, AssetPlaceholderProps, ExplanationDrawer(), ExplanationDrawerProps, TruthBadge(), TruthBadgeProps (+7 more)

### Community 24 - "OperationalMemorySchema"
Cohesion: 0.14
Nodes (18): get, post, Session, Perform keyword search across stored operational memories and post-mortem…, Record an operational memory entry from a resolved incident or post-mortem., record_memory(), search_memory(), CreateMemoryRequest (+10 more)

### Community 25 - "test_day2_intelligence.py"
Cohesion: 0.13
Nodes (16): AssetDependency, Relational dependency link between equipment and downstream assets or services., DependencyType, Nature of upstream/downstream connection between entities., Session, Comprehensive unit & integration tests for Day 2 Asset Intelligence, Multi-Hop…, Nominal asset (G-01) has low risk score and no maintenance blockages., Verify multi-hop BFS dependency traversal returns downstream paths, nodes, and… (+8 more)

### Community 26 - "scenario_service.py"
Cohesion: 0.20
Nodes (15): CrossStationScenarioRequest, CrossStationScenarioResponse, BaseModel, Pydantic v2 schemas for What-If Scenario Simulation., Stateless input specification for a cross-station coordination scenario., Structured response for cross-station coordination scenario evaluation., Comparison delta between baseline operational state and hypothetical scenario…, Mission-critical service impacted by scenario dependency propagation. (+7 more)

### Community 27 - "package.json"
Cohesion: 0.13
Nodes (15): name, private, type, version, oxlint, react-dom, tailwindcss, @tailwindcss/vite (+7 more)

### Community 28 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 29 - "OperationalEventType"
Cohesion: 0.13
Nodes (15): OperationalEventType, Operational event categorization., Unit and API integration tests for Day 3 Cross-Domain Operational Impact &…, GET /explain/scenarios/{id} and POST /explain with domain SCENARIOS return…, Severe cold-snap (-45°C) increases thermal demand and reduces reserve margin…, Scenario simulation includes canonical spare stockout and resupply vessel…, POST /scenarios/simulate calculates generation reserve margin and cold-snap…, Running a scenario simulation logs a SCENARIO_EVALUATED operational event in… (+7 more)

### Community 30 - "useTheme.tsx"
Cohesion: 0.21
Nodes (12): Header(), HeaderProps, ViewMode, applyTheme(), getInitialTheme(), getSystemTheme(), Theme, ThemeContext (+4 more)

### Community 32 - "Incident"
Cohesion: 0.18
Nodes (11): Incident, Measurement, OperationalAction, Time-series telemetry reading with complete data provenance metadata., Station operational anomaly or emergency incident., Specific response or countermeasure executed during an incident or scenario., Tests for database seeding determinism and idempotency., Calling seed_database multiple times does not duplicate records. (+3 more)

### Community 33 - "test_domain_models.py"
Cohesion: 0.17
Nodes (11): Scheduled resupply vessel voyage providing critical replacement stock., ResupplyOpportunity, Unit tests for domain model entities, relationships, and enums., Verify Station -> Building -> Zone hierarchy., Verify Generator G-02 asset configuration and sensors., Verify G-02 dependency links to HVAC unit and Zone 2 heating service., Verify MaintenanceWorkOrder -> SparePart -> Inventory (0) -> Resupply (11d)., test_asset_g02_hero_configuration() (+3 more)

### Community 34 - "simulate_operational_scenario"
Cohesion: 0.20
Nodes (12): calculate_energy_balance(), Session, Compute deterministic station energy balance, thermal demand, generator…, get_asset_recovery_exposure(), Evaluate deterministic recovery constraints, spare stock availability, and…, CrossStationScenarioResponse, ScenarioSimulateRequest, ScenarioSimulateResponse (+4 more)

### Community 35 - "TestClient"
Cohesion: 0.17
Nodes (12): Session, TestClient, Test Maitri station returns nominal operational readiness and does NOT force…, Test Bharati station returns full 7-stage causal narrative focused on G-02…, Test that all specified endpoint aliases return valid intelligence responses., Test invalid station ID gracefully returns 404., Test service handles missing optional records gracefully without crashing., test_operational_intelligence_bharati_critical_path() (+4 more)

### Community 36 - "test_risk_intelligence.py"
Cohesion: 0.21
Nodes (11): Session, TestClient, Comprehensive unit and API tests for Risk Intelligence 2.0. Validates the 4…, Maitri assets dynamically evaluate to nominal operational risk with zero forced…, Verify complete backward compatibility: all original AssetRiskResponse fields…, GET /assets/G-02/risk returns all 4 layers of Risk Intelligence 2.0 with full…, Multiple evaluations of calculate_asset_risk yield identical scores, rankings,…, test_risk_intelligence_backward_compatibility() (+3 more)

### Community 37 - "StationsView.tsx"
Cohesion: 0.31
Nodes (9): CrossStationContextCard(), CrossStationContextCardProps, StationsView(), StationsViewProps, CrossStationScenarioResponse, evaluateStationComparison(), fetchStationComparison(), simulateCrossStationScenario() (+1 more)

### Community 38 - "scenarios.py"
Cohesion: 0.27
Nodes (9): post, Session, What-If Scenario Simulation API router., Execute in-memory, deterministic simulation of hypothetical operational…, Execute stateless deterministic cross-station coordination scenario evaluation.…, simulate_cross_station(), simulate_scenario(), Stateless input specification for an operational what-if simulation. (+1 more)

### Community 39 - "test_assets_api.py"
Cohesion: 0.20
Nodes (9): Integration tests for /assets, /assets/{id}, and /assets/{id}/dependencies…, GET /assets/G-02 returns metrics, warning thresholds, and provenance., GET /assets/G-02/dependencies returns downstream impacted services and zones., GET /assets returns list of station equipment., GET /assets/NONEXISTENT returns 404., test_get_asset_dependencies_g02(), test_get_asset_detail_g02(), test_get_nonexistent_asset() (+1 more)

### Community 40 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, oxlint, @playwright/test, @types/node, @types/react, @types/react-dom, typescript, vite (+1 more)

### Community 41 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, lucide-react, react, react-dom, tailwindcss, @tailwindcss/vite, @tanstack/react-query, zod

### Community 42 - "ScenariosView.tsx"
Cohesion: 0.39
Nodes (6): ScenariosView(), ScenariosViewProps, useScenarioSimulation(), ScenarioSimulateRequest, ScenarioSimulateResponse, simulateScenario()

### Community 43 - "Settings"
Cohesion: 0.29
Nodes (4): Return CORS origins including FRONTEND_ORIGIN when configured., PolarOps backend configuration. All values can be overridden via environment…, Settings, BaseSettings

### Community 44 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test:e2e, test:e2e:ui

### Community 45 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

### Community 46 - "test_station_api.py"
Cohesion: 0.33
Nodes (5): Integration tests for /station/overview endpoint., GET /station/overview with unknown station returns 404., GET /station/overview returns structured situation awareness payload., test_station_overview_bharati(), test_station_overview_not_found()

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 48 - "env.py"
Cohesion: 0.40
Nodes (4): Run migrations in 'offline' mode. This configures the context with just a URL…, Run migrations in 'online' mode. In this scenario we need to create an Engine…, run_migrations_offline(), run_migrations_online()

### Community 49 - "test_health.py"
Cohesion: 0.50
Nodes (3): Health endpoint tests., GET /health returns 200 with expected structure., test_health_returns_ok()

### Community 52 - "health_check"
Cohesion: 0.67
Nodes (3): health_check(), get, Return service health status.

## Knowledge Gaps
- **141 isolated node(s):** `AmbientWeather`, `AssetMetric`, `CommsLinkStatus`, `CoordinationConstraintItem`, `CrossStationConsiderationItem` (+136 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 553 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProvenanceSchema` connect `ProvenanceSchema` to `sync_service.py`, `asset.py`, `event_service.py`, `simulate_operational_scenario`, `station_service.py`, `resources.py`, `asset_service.py`, `entities.py`, `resource_service.py`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Asset` connect `Asset` to `Incident`, `test_domain_models.py`, `asset.py`, `models/__init__.py`, `explainability_service.py`, `station_service.py`, `incident_service.py`, `ProvenanceSchema`, `asset_service.py`, `entities.py`, `resource_service.py`, `test_day4_multi_station.py`, `test_day2_intelligence.py`, `scenario_service.py`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `TruthType` connect `entities.py` to `Incident`, `sync_service.py`, `simulate_operational_scenario`, `event_service.py`, `models/__init__.py`, `asset.py`, `station_service.py`, `test_domain_models.py`, `ProvenanceSchema`, `science_service.py`, `asset_service.py`, `resource_service.py`, `scenario_service.py`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `ProvenanceSchema` (e.g. with `AssetDetailResponse` and `AssetTelemetryResponse`) actually correct?**
  _`ProvenanceSchema` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `Asset` (e.g. with `AssetCategory` and `AssetStatus`) actually correct?**
  _`Asset` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Base` (e.g. with `lifespan()` and `engine()`) actually correct?**
  _`Base` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `TruthType` (e.g. with `EnergyResource` and `Measurement`) actually correct?**
  _`TruthType` has 15 INFERRED edges - model-reasoned connections that need verification._