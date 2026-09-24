# Asset Intelligence & Digital Twin API Traceability Mapping

This document provides exhaustive, end-to-end traceability for every UI element in the PolarOps Digital Twin (`/digital-twin`) to its backend API endpoint, response schema, and authoritative Python service function.

---

## 1. Traceability Architecture Matrix

| UI Component / Field | API Endpoint | API Response Field | Backend Schema | Backend Service / Function | Operational Semantics |
|---|---|---|---|---|---|
| **Station Asset Selector** | `GET /assets?station_id={station_id}` | `code`, `name`, `category`, `criticality`, `status` | `AssetListItem` | `assets.py:list_assets()` | Populates station asset switch dropdown; displays health and criticality. |
| **Asset Identity & Status Badge** | `GET /assets/{id}` | `asset_id`, `name`, `status`, `health_score`, `criticality` | `AssetDetailResponse` | `assets.py:get_asset()` | Authoritative equipment state (`CRITICAL`, `WARNING`, `NOMINAL`, `OFFLINE`). |
| **Asset Metadata & Provenance** | `GET /assets/{id}` | `provenance.source`, `truth_type`, `quality`, `freshness_sec` | `ProvenanceMetadata` | `assets.py:get_asset()` | Scientific honesty badge: `MEASURED` telemetry vs. `DERIVED` risk models. |
| **Current Operating Metrics** | `GET /assets/{id}` | `metrics[].key`, `value`, `unit`, `status`, `warning_threshold`, `critical_threshold` | `AssetMetric` | `assets.py:get_asset()` | Real-time transducer values (e.g. vibration 4.8 mm/s, exhaust temp 485°C). |
| **Chronological Telemetry Series** | `GET /assets/{id}/telemetry?limit=50` | `series[].points[].timestamp`, `value`, `quality` | `AssetTelemetryResponse` | `telemetry_service.py:get_asset_telemetry_history()` | Real-time and historical trendline/sparkline rendering over the last 50 samples. |
| **Telemetry Trend & Status** | `GET /assets/{id}/telemetry?limit=50` | `series[].trend`, `trend_description`, `threshold_status` | `AssetTelemetrySeries` | `telemetry_service.py:get_asset_telemetry_history()` | Deterministic linear regression trend (`RISING`, `FALLING`, `STABLE`). |
| **Composite Risk Score & Level** | `GET /assets/{id}/risk` | `score` (0-100), `level` (`CRITICAL` / `HIGH` / `ELEVATED` / `WATCH` / `NOMINAL`) | `AssetRiskResponse` | `risk_service.py:calculate_asset_risk()` | Multi-factor weighted composite operational risk score. |
| **State Transition Ladder** | `GET /assets/{id}/risk` | `state_transition.current_state`, `state_trend`, `ladder[]`, `triggered_by[]` | `RiskStateTransitionItem` | `risk_service.py:calculate_asset_risk()` | Deterministic state transition ladder and discrete operational trigger conditions. |
| **Ranked Risk Drivers (Top 6)** | `GET /assets/{id}/risk` | `drivers[].rank`, `factor`, `title`, `score`, `max_score`, `severity`, `evidence`, `derivation_rule` | `RiskDriverItem` | `risk_service.py:calculate_asset_risk()` | Ranked 6-factor risk breakdown (Condition, Maintenance, Spares, Redundancy, Environmental, Runway). |
| **Failure Exposure & Blast Radius** | `GET /assets/{id}/risk` | `failure_exposure.level`, `redundancy_posture`, `affected_critical_services[]`, `affected_zones[]` | `FailureExposureItem` | `risk_service.py:calculate_asset_risk()` | Identifies N-0 single points of failure and compromised habitat zones. |
| **Recovery Exposure & Spare Parts** | `GET /assets/{id}/risk` | `recovery_exposure.work_order_id`, `work_order_status`, `spare_part_number`, `spare_available_quantity`, `resupply_vessel_name`, `resupply_days` | `RecoveryExposureItem` | `risk_service.py:calculate_asset_risk()` | Highlights physical supply-chain bottlenecks (e.g. SK-402 stockout, vessel *Maitri Express* ETA). |
| **Operational Headroom** | `GET /assets/{id}/risk` | `headroom.rating`, `generation_reserve_kw`, `fuel_runway_days`, `thermal_hold_hours` | `OperationalHeadroomItem` | `risk_service.py:calculate_asset_risk()` | Remaining buffer before life-safety margins are breached. |
| **Dependency Graph Nodes** | `GET /assets/{id}/dependencies?max_depth=5` | `nodes[].id`, `code`, `name`, `node_type`, `category`, `criticality`, `depth`, `status` | `DependencyNode` | `dependency_service.py:traverse_asset_dependencies()` | Multi-hop BFS discovered equipment, services, and spatial zones. |
| **Dependency Graph Edges** | `GET /assets/{id}/dependencies?max_depth=5` | `edges[].source_id`, `target_id`, `dependency_type`, `impact_factor`, `is_redundant` | `DependencyEdge` | `dependency_service.py:traverse_asset_dependencies()` | Directed operational connections with physical semantics (`ELECTRICAL`, `THERMAL`, `HYDRAULIC`, `CONTROL`). |
| **Upstream Dependencies** | `GET /assets/{id}/dependencies?max_depth=5` | `upstream_dependencies[].asset_id`, `name`, `type`, `impact_factor` | `UpstreamDependencyItem` | `dependency_service.py:traverse_asset_dependencies()` | Direct parent feed systems supplying the current asset (e.g. fuel feed, cooling lines). |
| **Downstream Impact Summary** | `GET /assets/{id}/dependencies?max_depth=5` | `downstream_impact.affected_subsystems[]`, `affected_services[]`, `affected_zones[]`, `total_downstream_assets` | `DownstreamImpact` | `dependency_service.py:traverse_asset_dependencies()` | Aggregate blast radius scope across station infrastructure. |
| **Causal Explanation Narrative** | `GET /explain/ASSET/{id}?station_id={station_id}` | `explanation_id`, `subject`, `headline`, `steps[]`, `causal_chain[]`, `confidence` | `ExplanationResponse` | `explainability.py:get_domain_explanation()` | 5-step structured decision-support narrative preserving full provenance. |

---

## 2. Progressive Disclosure Hierarchy in Digital Twin

The Digital Twin view is organized into 5 progressive disclosure layers:

1. **Level 1 — Asset Briefing**:
   - Executive summary: What asset is this? What is its operational condition? What is its primary hazard?
   - Key values: Health Score, Status Badge, N-0 Redundancy Posture, Immediate Risk Rating.

2. **Level 2 — Condition & Telemetry Evidence**:
   - Telemetry cards for each sensor channel with current reading, unit, warning/critical thresholds, sparkline history, and linear regression trend (`RISING` / `FALLING` / `STABLE`).
   - Telemetry provenance badge showing data source and quality.

3. **Level 3 — Risk Intelligence 2.0**:
   - State transition ladder with discrete triggers.
   - Ranked 6-factor risk drivers with exact scores, thresholds, derivation rules, and contribution percentages.
   - Failure exposure and supply-chain recovery exposure cards.

4. **Level 4 — Interactive Operational Topology**:
   - Visual multi-hop dependency graph rendering BFS depth tiers.
   - Node selection, connected path highlighting, and downstream blast-radius illumination.
   - Responsive mobile view with structured hierarchy tree.

5. **Level 5 — Deep Decision-Support Explanation**:
   - Slide-out Explanation Drawer detailing observed anomalies, physical failure mechanisms, dependency impacts, and recovery constraints.
