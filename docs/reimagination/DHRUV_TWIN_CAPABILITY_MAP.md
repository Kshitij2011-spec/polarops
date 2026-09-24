# PolarOps Digital Twin & System Intelligence Capability Map
**Role:** Dhruv Nayak — Digital Twin & System Intelligence Experience Owner  
**Branch:** `reimagine/dhruv-twin`  
**Baseline:** `5c692ec` (*baseline/phase4-5c692ec*)  
**Scope:** Exhaustive Backend Capability Audit, Data Provenance Categorization, and API-to-Twin Traceability Matrix.

---

## 1. Domain Capability Audit Matrix

Every operational facet of PolarOps is audited across 6 essential epistemological categories:
- **Known**: Verified ground truth stored in primary database entities (nameplates, physical locations, nominal ratings, stock counts).
- **Derived**: Deterministic algorithmic outputs calculated by Python domain engines (BFS traversal, 6-factor composite risk, thermal energy equations).
- **Historical**: Chronological time-series measurements, event streams, and audit ledgers.
- **Scenario-Based**: In-memory simulations evaluating counterfactual operational conditions (equipment trips, cold snaps, resupply delays).
- **Actionable**: Executable operational decisions and physical control levers available to the station engineer.
- **Provenance-Aware**: Explicit metadata classifying truth type (`MEASURED`, `DERIVED`, `SCENARIO`, `SYNTHETIC_SIMULATION`), quality (`GOOD`, `SUSPECT`, `BAD`), source, freshness, and calculation confidence.

---

### 1.1 Assets

- **Backend Anchor**: `app.models.entities.Asset`, `app.services.asset_service`, `app.api.assets`
- **Primary Schema**: `AssetDetailResponse`, `AssetListItem`
- **Known**: Asset ID (`G-02`), station ID (`STATION-BHARATI`), building ID (`BLD-POWER-PLANT`), zone ID (`ZONE-GEN-HALL`), equipment category (`GENERATOR`), criticality (`CRITICAL`), nameplate capacity (300 kW), commissioning date ($base - 1200\text{d}$).
- **Derived**: Health score ($62/100$), operational status (`WARNING`), current load factor ($82\%$), maintenance urgency rating.
- **Historical**: Commissioning timestamp, last inspection date, total operational runtime hours.
- **Scenario-Based**: Asset operational state under forced-outage simulation (`asset_offline_ids` in scenario engine).
- **Actionable**: Toggle operating state (`NOMINAL`, `MAINTENANCE`, `SHUTDOWN`), assign work order, trigger recalibration sequence.
- **Provenance-Aware**: `provenance.source` (`SYNTHETIC_SIMULATION`), `truth_type` (`MEASURED`), `freshness_sec`, `quality` (`GOOD`).

---

### 1.2 Telemetry

- **Backend Anchor**: `app.models.entities.Measurement`, `app.models.entities.Sensor`, `app.services.telemetry_service`
- **Primary Schema**: `AssetTelemetryResponse`, `AssetTelemetrySeries`, `TelemetryPoint`
- **Known**: Transducer ID (`SENS-G02-VIB`), metric key (`bearing_vibration_mm_s`), physical unit (`mm/s`), sensor calibration limits ($0.0 - 10.0\text{ mm/s}$), warning threshold ($4.0\text{ mm/s}$), critical threshold ($6.0\text{ mm/s}$).
- **Derived**: Current value ($4.8\text{ mm/s}$), threshold status (`WARNING`), linear regression trend direction (`RISING`), trend description (*"Bearing vibration increased by 0.6 mm/s over last 6 samples"*).
- **Historical**: 50 chronological time-series points with exact timestamps, measurement values, and quality flags.
- **Scenario-Based**: Accelerated degradation modeling and artificial noise injection during offline resilience tests.
- **Actionable**: Acknowledge threshold breach, initiate high-frequency acoustic monitoring, trigger physical sensor calibration.
- **Provenance-Aware**: Every telemetry point contains `truth_type` (`MEASURED`), `quality` (`GOOD`/`SUSPECT`/`BAD`), and sensor hardware identifier.

---

### 1.3 Risk (Composite Score & Level)

- **Backend Anchor**: `app.services.risk_service.calculate_asset_risk`, `app.api.assets`
- **Primary Schema**: `AssetRiskResponse`
- **Known**: Factor weightings, baseline risk floor ($0-100$ scale), station risk policies, nominal operating boundaries.
- **Derived**: Composite operational risk score ($82/100$), discrete risk level (`CRITICAL`), natural language risk summary, maintenance blockage flag (`maintenance_blocked = True`).
- **Historical**: Timestamped calculation record (`computed_at`), historical risk trend across operational shifts.
- **Scenario-Based**: Projected composite risk score under synthetic disaster conditions (`projected_risk_score`).
- **Actionable**: Execute high-tier risk reduction protocols (preheating backup boiler B-01, shedding radar load).
- **Provenance-Aware**: `truth_type` (`DERIVED`), explicit `assumptions` list detailing evaluation basis and calculation parameters.

---

### 1.4 Risk Drivers (Risk Intelligence 2.0)

- **Backend Anchor**: `app.services.risk_service._build_risk_drivers`, `app.schemas.asset.RiskDriverItem`
- **Primary Schema**: `RiskDriverItem`, `RiskStateTransitionItem`
- **Known**: The 6 standard risk evaluation dimensions:
  1. *Condition & Telemetry Severity*
  2. *Maintenance & Work Order Blockers*
  3. *Spare Parts & Inventory Runway*
  4. *Redundancy Posture ($N-0$ vs $N-1$)*
  5. *Environmental & Katabatic Amplification*
  6. *Station Operational Headroom*
- **Derived**: Exact score per driver ($0-25\text{ pts}$), maximum score, severity rating (`CRITICAL`/`HIGH`/`MEDIUM`/`LOW`), derivation rule equation, state transition ladder (`NOMINAL` $\rightarrow$ `WATCH` $\rightarrow$ `ELEVATED` $\rightarrow$ `HIGH` $\rightarrow$ `CRITICAL`), discrete trigger facts (*"Bearing vibration 4.8 mm/s > 4.0 mm/s limit"*).
- **Historical**: State transition velocity (rate of escalation across previous 24 hours).
- **Scenario-Based**: Driver score deltas under resupply delay or cold-snap scenarios.
- **Actionable**: Address specific leading driver (e.g. prioritize spare part resupply to reduce driver #2 from 20p to 0p).
- **Provenance-Aware**: Explicit `provenance_source` per driver (`SENS-G02-VIB`, `INV-SK402`, `WEATHER-BHARATI`), `truth_type` (`DERIVED`).

---

### 1.5 Dependencies

- **Backend Anchor**: `app.models.entities.AssetDependency`, `app.services.dependency_service`
- **Primary Schema**: `UpstreamDependencyItem`, `DependencyEdge`
- **Known**: Source asset ID, target asset ID, target service ID, physical dependency type (`ELECTRICAL`, `THERMAL`, `FUEL`, `DATA`, `PHYSICAL`), impact factor ($0.0 - 1.0$), redundancy flag (`is_redundant`).
- **Derived**: Upstream supplier chain (inbound diesel fuel piping, lube oil circuit, primary cooling water), cycle-safe path validation.
- **Historical**: Relationship creation date, historical coupling failures.
- **Scenario-Based**: Dynamic edge severing during simulation (modeling a ruptured hydronic thermal loop).
- **Actionable**: Cross-tie redundant lines, switch generator bus couplers, isolate damaged pipe sections.
- **Provenance-Aware**: Physical relationship verified against station engineering schematics; tagged as `MEASURED` structural topology.

---

### 1.6 Blast Radius

- **Backend Anchor**: `app.services.dependency_service.traverse_asset_dependencies`
- **Primary Schema**: `AssetDependenciesResponse`, `DownstreamImpact`, `DependencyNode`
- **Known**: Target equipment, services (`HABITAT_HEATING_Z2`, `POTABLE_WATER`), station zones (`ZONE-HAB-02`, `ZONE-RADAR-LAB`).
- **Derived**: Multi-hop BFS discovered blast radius, maximum graph depth ($depth=3$), path enumeration ($G\text{-}02 \rightarrow HVAC\text{-}02 \rightarrow SRV\text{-}HAB\text{-}HEAT\text{-}Z2$), total downstream assets count, total affected mission-critical services, total affected crew zones.
- **Historical**: Previous blast-radius events logged during prior station generator overhauls.
- **Scenario-Based**: Blast-radius expansion when concurrent secondary failures occur (e.g. G-02 failure combined with B-01 ignition failure).
- **Actionable**: Preemptively evacuate compromised habitat zones, re-route electrical feeders to secondary buses.
- **Provenance-Aware**: Traversal executed deterministically in Python; `truth_type` (`DERIVED`), zero stochastic hallucination.

---

### 1.7 Explainability

- **Backend Anchor**: `app.services.explainability_service`, `app.api.explainability`
- **Primary Schema**: `ExplanationResponse`, `ExplanationEvidence`, `RecoveryConstraint`, `RecommendedNextStep`
- **Known**: Static equipment design constraints, manufacturer overhaul guidelines, threshold definitions.
- **Derived**: Structured 5-step causal decision narrative:
  1. *Headline & Executive Briefing*
  2. *Observable Telemetry Evidence* (exact values, thresholds, deltas)
  3. *Physical Root Cause Mechanism*
  4. *Cascading Downstream Consequences*
  5. *Recovery Constraints & Recommended Countermeasures*
- **Historical**: Explanation generation timestamp, reference incident records from station history.
- **Scenario-Based**: Counterfactual explanations (*"Why did scenario COLD_SNAP_72H cause critical headroom collapse?"*).
- **Actionable**: Concrete recommended next steps with explicit verification procedures.
- **Provenance-Aware**: Confidence score ($0.95$), `truth_type` (`DERIVED`), strict adherence to database facts with zero generative LLM hallucination.

---

### 1.8 Station (Overview & Capabilities)

- **Backend Anchor**: `app.models.entities.Station`, `app.services.station_service`, `app.api.station`
- **Primary Schema**: `StationOverviewResponse`, `SubsystemSummaryItem`, `StationComparisonResponse`
- **Known**: Station ID (`STATION-BHARATI`, `STATION-MAITRI`), coordinates (Bharati: $69^\circ 24'\text{S}, 76^\circ 11'\text{E}$; Maitri: $70^\circ 46'\text{S}, 11^\circ 44'\text{E}$), physical elevation, winter/summer operating mode, commissioned date.
- **Derived**: Overall station readiness score ($78\%$), active incidents count, active subsystem health matrix (`POWER_GEN`: WARNING, `THERMAL_LOOP`: WARNING, `WATER_LIFE_SUPPORT`: NOMINAL).
- **Historical**: Station seasonal log records, annual fuel consumption totals.
- **Scenario-Based**: Multi-station mutual aid evaluation (evaluating whether Maitri can supply spare SK-402 via traverse to Bharati).
- **Actionable**: Declare station emergency state, switch station seasonal mode, request inter-station resupply.
- **Provenance-Aware**: Station location and equipment registry verified; `truth_type` (`MEASURED`).

---

### 1.9 Energy & Environment

- **Backend Anchor**: `app.services.energy_service.calculate_energy_balance`, `app.models.entities.WeatherObservation`
- **Primary Schema**: `EnergyModelResponse`, `WeatherObservation`
- **Known**: Station base electrical load ($180.0\text{ kW}$), indoor target temperature ($20.0^\circ\text{C}$), station heat loss coefficient ($5.2\text{ kW/}^\circ\text{C}$), auxiliary electric heat-tracing slope ($2.5\text{ kW/}^\circ\text{C}$ below $-20^\circ\text{C}$), diesel generator specific fuel consumption ($0.265\text{ L/kWh}$ + $25\text{ L/h}$ idle).
- **Derived**:
  - Thermal demand: $Q_{th} = 5.2 \times (20.0 - T_{ambient})\text{ kW}$
  - Modeled electrical demand: $P_{elec} = 180.0 + 2.5 \times \max(0, -20.0 - T_{ambient})\text{ kW}$
  - Generator fleet capacity, total fuel burn rate ($L/\text{h}$), fuel runway in days.
- **Historical**: Historical weather trends (ambient temperature, wind speed in knots, barometric pressure, wind chill).
- **Scenario-Based**: Overriding ambient temperature (e.g. $-42^\circ\text{C}$) to preview instant thermal demand surge ($322.4\text{ kW}$) and accelerated fuel depletion.
- **Actionable**: Engage auxiliary thermal boilers, dispatch secondary diesel generators, initiate building zone heat setback.
- **Provenance-Aware**: Weather readings tagged with station weather station sensor ID, `truth_type` (`MEASURED`); energy equations tagged as `DERIVED` model.

---

### 1.10 Resource Relationships (Fuel, Spares, Resupply, Recovery)

- **Backend Anchor**: `app.services.resource_service`, `app.api.resources`
- **Primary Schema**: `FuelStatusResponse`, `InventorySpareItem`, `ResupplyOpportunityItem`, `AssetRecoveryExposureResponse`
- **Known**: Fuel tank capacities ($220,000\text{ L}$ capacity, $142,500\text{ L}$ current), warehouse bin locations (`Spares Bin M-2`), spare part specifications (`SK-402`), inbound vessel schedules (*MV Vasiliy Golovnin*, ETA 11 days).
- **Derived**:
  - Fuel autonomy runway ($70.3\text{ days}$ vs $90\text{-day}$ winter policy minimum).
  - Recovery exposure score: `HIGH` (Zero local stock of SK-402, work order `MWO-2026-089` blocked).
  - Resupply window viability margin ($11.0\text{ days}$ voyage time vs $70.3\text{ days}$ fuel runway).
- **Historical**: Fuel burn rates across previous months, spare part depletion history, past vessel arrival variance.
- **Scenario-Based**: Simulating maritime resupply delay (+14 days due to pack-ice ridge consolidation).
- **Actionable**: Approve emergency air-drop requisition, execute inter-station inventory transfer, reschedule preventive work orders.
- **Provenance-Aware**: Physical warehouse stock inventory verified; vessel AIS tracking coordinates tagged with `MEASURED` provenance.

---

### 1.11 Incident Relationships

- **Backend Anchor**: `app.services.incident_service`, `app.api.incidents`
- **Primary Schema**: `IncidentDetailResponse`, `IncidentActionSchema`, `OperationalMemorySchema`
- **Known**: Incident ID (`INC-2026-003`), station ID, severity (`CRITICAL`), root asset ID (`G-02`), creation timestamp.
- **Derived**: Multi-hop affected equipment list, degraded service rationales, composite modeled risk during active incident ($85/100$), ranked mitigation decision options (`DISPATCH_G01_PRIORITY`, `AUX_BOILER_B01_TRANSFER`, `SHED_SCIENCE_RADAR_LOAD`, `ESCALATE_AIRLIFT_SPARE`).
- **Historical**: Action execution ledger (who executed what command at what second), previous incident resolution duration.
- **Scenario-Based**: Pre-incident scenario evaluation assessing blast radius before declaring incident status.
- **Actionable**: Execute decision option, append action ledger entry, transition incident lifecycle state (`ACTIVE` $\rightarrow$ `CONTAINED` $\rightarrow$ `RESOLVED`).
- **Provenance-Aware**: Cryptographic action verification, immutable audit ledger, operator identity provenance.

---

## 2. API-to-Digital-Twin Traceability Matrix

This table maps every backend endpoint to its consuming Digital Twin capability and UI manifestation:

| Endpoint | Method | Python Backend Service | Digital Twin UI Capability | UI Manifestation |
|---|---|---|---|---|
| `/assets` | GET | `asset_service.list_assets` | Station Asset Hierarchy | Asset switcher dropdown, status pill strip |
| `/assets/{id}` | GET | `asset_service.get_asset` | Equipment Identity & State | Inspector header, nameplate card, N-0 badge |
| `/assets/{id}/telemetry` | GET | `telemetry_service.get_asset_telemetry_history` | Live Signal Dynamics | 50-pt SVG sparklines, threshold bands, trend glyphs |
| `/assets/{id}/dependencies` | GET | `dependency_service.traverse_asset_dependencies` | Living Topology Canvas | Interactive BFS node-edge graph, blast-radius glow |
| `/assets/{id}/risk` | GET | `risk_service.calculate_asset_risk` | Risk Intelligence 2.0 | State ladder, ranked drivers, headroom strip |
| `/resources/recovery/{id}` | GET | `resource_service.get_asset_recovery_exposure` | Supply Chain Bottleneck | Spares stockout pill, resupply countdown timer |
| `/explain/asset/{id}` | GET | `explainability_service.explain_asset` | 5-Step Causal Reasoning | Slide-out explanation drawer with physical evidence |
| `/station/overview` | GET | `station_service.get_station_overview` | Station Situation Awareness | Global status banner, life-safety headroom bar |
| `/resources/energy` | GET | `energy_service.calculate_energy_balance` | Thermal & Grid Modeling | Heat loss gauge, generator dispatch balance |
| `/resources/fuel` | GET | `resource_service.get_station_fuel_status` | Autonomy Runway Analysis | Fuel depletion projection curve |
| `/resources/inventory` | GET | `resource_service.list_station_inventory` | Critical Spares Audit | Warehouse bin availability inspector |
| `/resources/resupply` | GET | `resource_service.list_station_resupply` | Logistics Logistics Runway | Vessel tracking route, ETA confidence badge |
| `/scenarios/simulate` | POST | `scenario_service.simulate_scenario` | What-If Headroom Sandbox | Counterfactual comparison overlay |
| `/incidents/{id}` | GET | `incident_service.get_incident_detail` | Common Operating Picture | Incident blast radius, action ledger |
| `/incidents/{id}/actions` | POST | `incident_service.add_incident_action` | Action Execution | Decision dispatch button with verification confirmation |

---

## 3. Frontend Architecture Recommendations for Digital Twin

Based on this backend capability audit, the following engineering directives govern the UI implementation:

1. **Unify Topology and Inspector**: Never separate the dependency graph from the asset inspector into different routes. Selecting a node on the canvas must immediately drive the right-hand inspector without page reloads.
2. **Surface Risk Intelligence 2.0 Drivers**: The 6-factor ranked drivers must be prominently displayed as a ranked ladder with explicit evidence strings and derivation rules, not buried behind nested accordions.
3. **Connect Supply Chain Constraints Directly to Assets**: Equipment cards must not stop at electrical/thermal telemetry. The critical spare part stock status (`SK-402: 0 Available`) and resupply vessel ETA must be physically attached to the asset inspection card.
4. **Implement Dual-Flow Tracing**: Operators must be able to toggle between *Upstream Inflow* (fuel, cooling, power feeds) and *Downstream Blast Radius* (buses, HVAC, life support) with one click.
5. **Enforce Absolute Data Honesty**: All UI cards rendering telemetry or risk must display their provenance badge (`MEASURED` vs `DERIVED` vs `SCENARIO`) to maintain scientific integrity in accordance with repository standards.
