# PolarOps — Type & API Contract Compatibility Audit
**Phase 0 Output · Document 5 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Executive Summary

A comprehensive field-by-field audit was conducted comparing the **Backend Pydantic Schemas** (`backend/app/schemas/`), the **Proven Old Frontend Types** (`frontend/src/lib/api.ts`), and the **New Frontend Data Structures** (`src/` on `integration/polarops-insight`).

### Critical Finding
The new frontend was developed in complete isolation from the backend Pydantic schemas. It defines no API interfaces and binds its views to hardcoded string tuples and ad-hoc objects originally imported from `demo-data.ts`.  
**Zero types in the new frontend currently match the backend contracts directly.**  
However, the existing `frontend/src/lib/api.ts` (1,277 lines) on `main` already contains **100% accurate, complete TypeScript interfaces** matching every backend schema.

---

## 2. Explicit Contract Mismatch Table

| Domain / Entity | Backend Pydantic Field & Type | New Frontend Representation | Compatibility Issue | Remediation Required |
|---|---|---|---|---|
| **Station Overview** | `environment_mode: EnvironmentMode` (`"SUMMER" \| "WINTER"`) | `season: "WINTER"` | Field rename & loose string | Map `environment_mode` to display string |
| **Station Overview** | `headline_health_score: int` (0–100) | Missing (Not displayed) | Missing metric | Bind to station health card/badge |
| **Station Overview** | `operational_headroom_pct: float` | Missing (Not displayed) | Missing metric | Bind to operational status strip |
| **Station Overview** | `operational_headroom_status: str` | Missing (Not displayed) | Missing metric | Bind to status label |
| **Station Overview** | `weather: AmbientWeatherSchema` (`temperature_celsius`, `wind_speed_knots`, `wind_chill_celsius`, `blizzard_active`) | `demoMetrics[3]` (`value: "−21.4 °C"`) | Flat single string vs structured weather object | Extract `temperature_celsius` and `wind_speed_knots` |
| **Station Overview** | `subsystems: list[SubsystemSummarySchema]` (`subsystem_id`, `name`, `status`, `health_score`) | Absent from overview KPIs | Missing structured subsystem data | Connect to topology or subsystem panel |
| **Station Overview** | `critical_event: Optional[CriticalEventSchema]` | Hardcoded `demoG02.name` | Static text vs dynamic incident object | Bind to active critical event from response |
| **Station Overview** | `provenance: ProvenanceSchema` | Text badge `"MEASURED · DEMO"` | Missing real provenance metadata | Expose `truth_type`, `source`, `timestamp` |
| **Station Portfolio** | `differences: list[OperationalDifferenceItem]` | Absent | Missing multi-station comparison fields | Add comparison drawer or tab |
| **Station Portfolio** | `headroom_comparison: list[OperationalCapabilityItem]` (5 domains: Power, Thermal, Fuel, Life Support, Maintenance) | Static 4 numbers: Connectivity, Personnel, Power, Alerts | Complete domain mismatch | Replace mock numbers with 5-domain headroom |
| **Asset Detail** | `sensors: list[SensorTelemetrySummary]` | `telemetry: [string, string][]` | Typed sensor list vs text tuple array | Map sensor name, value, and deviation |
| **Asset Detail** | `metrics: list[AssetMetricSchema]` | `condition: [string, string][]` | Typed metrics vs text tuple array | Map metric label, value, unit |
| **Asset Dependencies** | `direct_dependencies: list[DependencyNode]`, `cascade_paths: list[DependencyEdge]`, `blast_radius_nodes: list[DependencyNode]` | `demoDependencies: [string, string, string][]` | Graph object (nodes & edges) vs 3-element text array | Map BFS nodes and edges into dependency cards |
| **Asset Telemetry** | `history: list[TelemetryPointSchema]` (`timestamp: datetime`, `value: float`, `status: str`) | 11 static bar heights in JSX `[4,7,10,15,23,35,24,16,10,6,4]` | Real timestamp/float time-series vs CSS bar heights | Bind to Recharts `ResponsiveContainer` / `LineChart` |
| **Asset Risk** | `overall_risk_score: int` (0–100), `risk_factors: list[RiskFactorBreakdown]`, `primary_driver: str`, `mathematical_explanation: str` | Missing (Only text `"+3.1% deviation"`) | Entire 6-factor composite risk engine is unrepresented | Create Risk Engine card matching approved UX |
| **Resources (Fuel)** | `current_stock_liters: float`, `daily_burn_rate_liters: float`, `estimated_runway_days: float`, `target_reserve_days: float` | `demoResources[0]` (`"1,320 L/day"`, `"81 days"`, `68%`) | Real floats vs hardcoded string literals | Map exact numbers and runway calculations |
| **Resources (Inventory)**| `list[InventorySpareItem]` (`part_number`, `description`, `stock_level`, `reorder_threshold`, `criticality`) | Missing | Table completely missing | Render inventory table |
| **Resources (Resupply)** | `list[ResupplyOpportunityItem]` (`carrier_name`, `carrier_type`, `eta_days`, `status`, `manifest_items`) | Missing | Logistics details missing | Render resupply vessel/flight card |
| **Resources (Energy)** | `EnergyModelResponse` (`thermal_demand_kw`, `electrical_demand_kw`, `total_generation_capacity_kw`) | Missing | Complete balance model missing | Render energy and thermal balance card |
| **Resources (Recovery)**| `AssetRecoveryExposureResponse` (`milestones: list[RecoveryChainMilestone]`, `is_blocked: bool`, `blocking_reason: str`) | Missing | 5-milestone recovery chain missing | Render recovery status banner |
| **Scenarios (Simulate)** | Request: `ScenarioSimulateRequest` (`scenario_type`, `duration_hours`, `load_shedding_percentage`); Response: `ScenarioSimulateResponse` | Mock click sets static JSX text | No request payload; static text response | Wire form inputs to request payload and render dynamic deltas |
| **Resilience (Status)** | `link_status: CommsLinkStatus` (`"ONLINE"` \| `"OFFLINE"`), `latency_ms: float`, `active_queue_count: int` | `demoOfflineState` string object | Typed status and floats vs static date text | Map real comms status and latency |
| **Resilience (Queue)** | `SyncQueueItemSchema`: `priority: int` (0–3), `sync_status: SyncStatus` (`"PENDING"`, `"TRANSFERRING"`, `"VERIFIED"`, `"ACKNOWLEDGED"`, `"RECONCILED"`), `payload_checksum_sha256: str` | `demoSyncQueue`: `priority: "CRITICAL" \| "ROUTINE"`, `state: "PENDING SYNC" \| "ACKNOWLEDGED"` | Integer 0–3 priority vs string; `state` vs `sync_status`; missing SHA-256 | Map P0–P3 badges, map `sync_status`, expose verified SHA-256 hashes |
| **Incidents / Alerts** | `IncidentListItemResponse` (`incident_id: str`, `title: str`, `severity: IncidentSeverity`, `status: IncidentStatus`, `created_at: datetime`) | `demoAlerts`: `id: number`, `level: "CRITICAL" \| "WARNING" \| "INFO"`, `text: str`, `time: str` | ID type (UUID/str vs int); `level` vs `severity`; `text` vs `title`; missing `status` | Map `incident_id` to string, map severity tiers, expose status transitions |
| **Explainability** | `ExplanationResponse` (`domain`, `entity_id`, `headline_narrative`, `cognitive_steps: list[CognitiveStep]`, `evidence: list[EvidenceItem]`, `consequences: list[ConsequenceItem]`, `constraints: list[ConstraintItem]`, `recommended_actions: list[ActionItem]`) | `sections: [string, string, string][]` | Structured multi-tier response vs 5 static string triplets | Dynamically populate `ExplanationDrawer` from API response |
| **Operational Events** | `OperationalEventSchema` (`event_id`, `event_type`, `severity`, `title`, `summary`, `timestamp`, `truth_type`, `metadata_json`) | `demoActivities: [string, string, string][]` | Typed operational event with metadata vs 3-tuple text | Render real activity stream with severity and provenance badges |

---

## 3. Enum Alignment Matrix

| Domain Enum | Backend Values (Pydantic / DB) | New Frontend Values | Status / Resolution |
|---|---|---|---|
| **StationStatus** | `NOMINAL`, `WARNING`, `CRITICAL`, `MAINTENANCE` | `NOMINAL`, `WARNING`, `CRITICAL`, `WATCH`, `ATTENTION`, `INFO` | Mismatch. New FE introduces non-standard `WATCH` and `ATTENTION`. Needs mapping helper. |
| **AssetStatus** | `NOMINAL`, `WARNING`, `CRITICAL`, `SHUTDOWN`, `MAINTENANCE` | Same as above in `StatusBadge` | Needs mapping helper to valid UI colors. |
| **EnvironmentMode** | `SUMMER`, `WINTER` | `"WINTER OPERATIONS"` (loose string) | Map backend string to display label. |
| **SyncStatus** | `PENDING`, `TRANSFERRING`, `VERIFIED`, `ACKNOWLEDGED`, `RECONCILED`, `FAILED_RETRY` | `"PENDING SYNC"`, `"ACKNOWLEDGED"` | Map backend status enum directly to status badge. |
| **PriorityLevel** | `0`, `1`, `2`, `3` | `"CRITICAL"`, `"ROUTINE"` | Map `0` → `P0 (CRITICAL)`, `1` → `P1 (HIGH)`, `2` → `P2 (MEDIUM)`, `3` → `P3 (ROUTINE)`. |
| **IncidentSeverity** | `CRITICAL`, `MAJOR`, `MODERATE`, `MINOR` | `"CRITICAL"`, `"WARNING"`, `"INFO"` | Map `MAJOR` → `WARNING`, `MODERATE` → `WARNING`, `MINOR` → `INFO`. |
| **IncidentStatus** | `ACTIVE`, `CONTAINED`, `RESOLVED` | Local `reviewed: number[]` array | Map backend lifecycle status directly. |
| **TruthType** | `MEASURED`, `DERIVED`, `FORECAST`, `SCENARIO`, `SYNTHETIC_SIMULATION` | `"DEMO"`, `"MEASURED · DEMO"`, `"ILLUSTRATIVE"` | Enforce data honesty rule: use canonical backend provenance labels. |
