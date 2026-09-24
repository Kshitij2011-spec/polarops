/**
 * API client utility for PolarOps frontend.
 *
 * Uses the Vite proxy (/api → backend) so we never need to
 * hardcode the backend host in production builds.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface HealthResponse {
  status: string;
  service: string;
}

export type StationStatus = "NOMINAL" | "DEGRADED" | "CRITICAL" | "OFFLINE";
export type EnvironmentMode = "SUMMER" | "WINTER" | "TRANSITION";

export interface Provenance {
  source: string;
  timestamp: string;
  freshness_seconds?: number | null;
  quality: "GOOD" | "SUSPECT" | "BAD" | "NOMINAL" | "DEGRADED" | "STALE";
  truth_type: "MEASURED" | "DERIVED" | "SIMULATED" | "ESTIMATED" | "OVERRIDDEN";
  confidence: number;
}

export interface AmbientWeather {
  temperature_celsius: number;
  wind_speed_knots: number;
  wind_chill_celsius: number;
  conditions: string;
  provenance: Provenance;
}

export interface SubsystemSummaryItem {
  code: string;
  name: string;
  status: string;
  health_score: number;
}

export interface CriticalEventItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  asset_id?: string | null;
  location?: string | null;
  description: string;
}

export interface StationOverview {
  station_id: string;
  name: string;
  status: StationStatus;
  environment_mode: EnvironmentMode;
  overall_health_score: number;
  active_incidents_count: number;
  fuel_runway_days?: number | null;
  fuel_quantity_liters?: number | null;
  connectivity_status: string;
  ambient_weather: AmbientWeather;
  subsystem_summary: SubsystemSummaryItem[];
  critical_events: CriticalEventItem[];
}

export interface AssetListItem {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  health_score: number;
  criticality: string;
  zone_id?: string | null;
}

export interface AssetMetric {
  key: string;
  name: string;
  value: number;
  unit: string;
  status: string;
  warning_threshold?: number | null;
  critical_threshold?: number | null;
}

export interface AssetDetail {
  asset_id: string;
  code: string;
  name: string;
  category: string;
  zone_id?: string | null;
  status: string;
  health_score: number;
  criticality: string;
  metrics: AssetMetric[];
  provenance: Provenance;
}

// ── MULTI-HOP DEPENDENCIES ────────────────────────────────────────────────

export interface DependencyNode {
  id: string;
  code: string;
  name: string;
  node_type: string; // "ASSET", "SERVICE", "ZONE"
  category?: string | null;
  criticality?: string | null;
  depth: number;
  status?: string | null;
}

export interface DependencyEdge {
  source_id: string;
  target_id: string;
  dependency_type: string;
  impact_factor: number;
  is_redundant: boolean;
}

export interface DownstreamServiceImpact {
  service_id: string;
  code: string;
  name: string;
  criticality: string;
}

export interface DownstreamImpact {
  affected_subsystems: string[];
  affected_services: DownstreamServiceImpact[];
  affected_zones: string[];
}

export interface UpstreamDependencyItem {
  asset_id: string;
  code: string;
  name: string;
  type: string;
  impact_factor: number;
  is_redundant: boolean;
}

export interface AssetDependencies {
  asset_id: string;
  upstream_dependencies: UpstreamDependencyItem[];
  downstream_impact: DownstreamImpact;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  max_depth: number;
  paths: string[];
  total_downstream_assets: number;
  total_affected_services: number;
  total_affected_zones: number;
}

// ── TELEMETRY TIME SERIES ─────────────────────────────────────────────────

export interface TelemetryPoint {
  timestamp: string;
  value: number;
  quality: string;
  truth_type: string;
}

export interface AssetTelemetrySeries {
  metric_key: string;
  metric_name: string;
  unit: string;
  current_value: number;
  warning_threshold?: number | null;
  critical_threshold?: number | null;
  threshold_status: string;
  trend: "RISING" | "FALLING" | "STABLE";
  trend_description: string;
  points: TelemetryPoint[];
}

export interface AssetTelemetry {
  asset_id: string;
  asset_name: string;
  series: AssetTelemetrySeries[];
  provenance: Provenance;
}

// ── EXPLAINABLE RISK (RISK INTELLIGENCE 2.0) ───────────────────────────────

export interface RiskFactorItem {
  factor: string;
  title: string;
  score: number;
  max_score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
}

export interface RiskDriverItem {
  rank: number;
  factor: string;
  title: string;
  score: number;
  max_score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
  threshold?: string | null;
  trend: "DEGRADING" | "IMPROVING" | "STABLE";
  derivation_rule: string;
  truth_type: string;
  provenance_source: string;
}

export interface FailureExposureItem {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  affected_critical_services: string[];
  affected_zones: string[];
  redundancy_posture: string;
  generation_reserve_kw?: number | null;
  summary: string;
  truth_type: string;
}

export interface RecoveryExposureItem {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  work_order_status?: string | null;
  work_order_id?: string | null;
  spare_part_number?: string | null;
  spare_part_name?: string | null;
  spare_available_quantity: number;
  resupply_vessel_name?: string | null;
  resupply_days?: number | null;
  recovery_bottleneck: string;
  truth_type: string;
}

export interface EnvironmentalAmplificationItem {
  ambient_temp_celsius: number;
  wind_speed_knots: number;
  wind_chill_celsius: number;
  weather_condition: string;
  amplification_level: "NONE" | "MODERATE" | "SEVERE";
  amplification_factor: number;
  explanation: string;
  truth_type: string;
}

export interface OperationalHeadroomItem {
  rating: "NOMINAL" | "NARROW" | "COMPRESSED" | "CRITICAL";
  generation_reserve_kw: number;
  generation_headroom_label: string;
  fuel_runway_days: number;
  recovery_buffer_days: number;
  thermal_hold_hours: number;
  summary: string;
  truth_type: string;
}

export interface RiskConcentrationItem {
  direct_dependents: string[];
  indirect_dependents: string[];
  critical_services: string[];
  affected_zones: string[];
  primary_domain: string;
  max_depth: number;
  summary: string;
  truth_type: string;
}

export interface RiskProjectionItem {
  scenario_id: string;
  name: string;
  condition: string;
  current_risk_score: number;
  projected_risk_score: number;
  score_delta: number;
  projected_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  operational_impact: string;
  headroom_effect: string;
  truth_type: string;
}

export interface RiskStateTransitionItem {
  current_state: "NOMINAL" | "WATCH" | "ELEVATED" | "HIGH" | "CRITICAL";
  state_trend: "ESCALATING" | "STABLE" | "DE-ESCALATING";
  ladder: string[];
  triggered_by: string[];
  next_threshold_trigger?: string | null;
  truth_type: string;
}

export interface AssetRisk {
  asset_id: string;
  asset_name: string;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: RiskFactorItem[];
  summary: string;
  maintenance_blocked: boolean;
  active_work_order_id?: string | null;
  required_spare_part?: string | null;
  spare_available_quantity: number;
  resupply_days?: number | null;
  computed_at: string;
  truth_type: string;
  assumptions: string[];

  // ── Risk Intelligence 2.0 Layers ──────────────────────────────────────
  drivers?: RiskDriverItem[];
  failure_exposure?: FailureExposureItem | null;
  recovery_exposure?: RecoveryExposureItem | null;
  environmental_amplification?: EnvironmentalAmplificationItem | null;
  headroom?: OperationalHeadroomItem | null;
  concentration?: RiskConcentrationItem | null;
  projections?: RiskProjectionItem[];
  state_transition?: RiskStateTransitionItem | null;
}

// ── API ENDPOINT CALLS ────────────────────────────────────────────────────

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`);
  }
  return res.json() as Promise<HealthResponse>;
}

export async function fetchStationOverview(stationId: string): Promise<StationOverview> {
  const res = await fetch(`${API_BASE}/station/overview?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch station overview (${res.status})`);
  }
  return res.json() as Promise<StationOverview>;
}

export async function fetchAssets(stationId: string): Promise<AssetListItem[]> {
  const res = await fetch(`${API_BASE}/assets?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch assets (${res.status})`);
  }
  return res.json() as Promise<AssetListItem[]>;
}

export async function fetchAssetDetail(assetId: string): Promise<AssetDetail> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch asset detail (${res.status})`);
  }
  return res.json() as Promise<AssetDetail>;
}

export async function fetchAssetDependencies(assetId: string, maxDepth: number = 5): Promise<AssetDependencies> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}/dependencies?max_depth=${maxDepth}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch asset dependencies (${res.status})`);
  }
  return res.json() as Promise<AssetDependencies>;
}

export async function fetchAssetTelemetry(assetId: string, limit: number = 50): Promise<AssetTelemetry> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}/telemetry?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch asset telemetry (${res.status})`);
  }
  return res.json() as Promise<AssetTelemetry>;
}

export async function fetchAssetRisk(assetId: string): Promise<AssetRisk> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}/risk`);
  if (!res.ok) {
    throw new Error(`Failed to fetch asset risk analysis (${res.status})`);
  }
  return res.json() as Promise<AssetRisk>;
}

// ── DAY 3 RESOURCE & SCENARIO INTERFACES ──────────────────────────────────

export interface FuelStatus {
  station_id: string;
  resource_type: string;
  current_stock_liters: number;
  max_capacity_liters: number;
  burn_rate_liters_per_hour: number;
  projected_runway_days: number;
  winter_target_days: number;
  resupply_gap_days: number;
  provenance: Provenance;
}

export interface InventorySpareItem {
  id: string;
  spare_part_id: string;
  part_number: string;
  name: string;
  description: string;
  criticality: string;
  quantity_available: number;
  quantity_reserved: number;
  reorder_threshold: number;
  location: string;
  status: "AVAILABLE" | "RESERVED" | "CRITICAL_SHORTAGE";
  work_order_ids: string[];
}

export interface ResupplyOpportunityItem {
  id: string;
  vessel_name: string;
  expected_date: string;
  eta_days: number;
  spare_part_id: string;
  spare_part_number: string;
  spare_part_name: string;
  quantity: number;
  delay_days: number;
  status: string;
}

export interface AssetRecoveryExposure {
  asset_id: string;
  asset_name: string;
  criticality: string;
  active_work_order_id?: string | null;
  work_order_title?: string | null;
  work_order_status?: string | null;
  required_spare_part_number?: string | null;
  required_spare_part_name?: string | null;
  quantity_required: number;
  quantity_available: number;
  quantity_reserved: number;
  resupply_vessel_name?: string | null;
  resupply_eta_days?: number | null;
  exposure_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasoning: string;
  assumptions: string[];
  provenance: Provenance;
}

export interface EnergyModel {
  station_id: string;
  outside_temp_celsius: number;
  thermal_demand_kw: number;
  baseline_electrical_load_kw: number;
  projected_electrical_load_kw: number;
  total_generation_capacity_kw: number;
  available_generation_capacity_kw: number;
  online_generators_count: number;
  fuel_burn_rate_lph: number;
  remaining_fuel_liters: number;
  projected_runway_days: number;
  weather_context: string;
  assumptions: string[];
  truth_type: string;
}

export interface ScenarioMetricDelta {
  name: string;
  baseline_value: number;
  scenario_value: number;
  delta: number;
  unit: string;
  impact_direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  description: string;
}

export interface ScenarioAffectedService {
  service_id: string;
  code: string;
  name: string;
  criticality: string;
  baseline_status: string;
  scenario_status: string;
  degradation_rationale: string;
}

export interface ScenarioDecisionOption {
  code: string;
  title: string;
  category: string;
  description: string;
  operational_impact: string;
  risk_reduction_tier: "HIGH" | "MEDIUM" | "LOW";
  requires_human_approval: boolean;
  disclaimer: string;
}

export interface ScenarioSimulateRequest {
  station_id?: string;
  scenario_type?: string;
  target_asset_id?: string;
  duration_hours?: number;
  ambient_temp_celsius?: number | null;
}

export interface ScenarioSimulateResponse {
  scenario_id: string;
  station_id: string;
  scenario_type: string;
  target_asset_id: string;
  target_asset_name: string;
  duration_hours: number;
  ambient_temp_celsius: number;
  baseline_summary: string;
  scenario_summary: string;
  deltas: ScenarioMetricDelta[];
  affected_services: ScenarioAffectedService[];
  affected_assets_count: number;
  baseline_risk_score: number;
  scenario_risk_score: number;
  risk_delta: number;
  baseline_risk_level: string;
  scenario_risk_level: string;
  decision_options: ScenarioDecisionOption[];
  thermal_demand_kw: number;
  projected_load_kw: number;
  available_capacity_kw: number;
  reserve_margin_kw: number;
  reserve_margin_percent: number;
  recovery_constraints: RecoveryConstraint[];
  assumptions: string[];
  computed_at: string;
  truth_type: string;
  source_context: string[];
}

// ── DAY 3 FETCHERS ────────────────────────────────────────────────────────

export async function fetchFuelStatus(stationId: string = "STATION-BHARATI"): Promise<FuelStatus> {
  const res = await fetch(`${API_BASE}/resources/fuel?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch fuel status (${res.status})`);
  }
  return res.json() as Promise<FuelStatus>;
}

export async function fetchInventory(stationId: string = "STATION-BHARATI"): Promise<InventorySpareItem[]> {
  const res = await fetch(`${API_BASE}/resources/inventory?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch warehouse inventory (${res.status})`);
  }
  return res.json() as Promise<InventorySpareItem[]>;
}

export async function fetchResupply(stationId: string = "STATION-BHARATI"): Promise<ResupplyOpportunityItem[]> {
  const res = await fetch(`${API_BASE}/resources/resupply?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch resupply logistics (${res.status})`);
  }
  return res.json() as Promise<ResupplyOpportunityItem[]>;
}

export async function fetchEnergyModel(
  stationId: string = "STATION-BHARATI",
  ambientTempOverride?: number
): Promise<EnergyModel> {
  let url = `${API_BASE}/resources/energy?station_id=${encodeURIComponent(stationId)}`;
  if (ambientTempOverride !== undefined) {
    url += `&ambient_temp_override=${encodeURIComponent(ambientTempOverride)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch energy model (${res.status})`);
  }
  return res.json() as Promise<EnergyModel>;
}

export async function fetchRecoveryExposure(assetId: string): Promise<AssetRecoveryExposure> {
  const res = await fetch(`${API_BASE}/resources/recovery/${encodeURIComponent(assetId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch recovery exposure (${res.status})`);
  }
  return res.json() as Promise<AssetRecoveryExposure>;
}

export async function simulateScenario(request: ScenarioSimulateRequest): Promise<ScenarioSimulateResponse> {
  const res = await fetch(`${API_BASE}/scenarios/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail ?? `Simulation request failed with status ${res.status}`);
  }
  return res.json() as Promise<ScenarioSimulateResponse>;
}

// ── DAY 4 RESILIENCE, SCIENCE CONTINUITY, INCIDENTS & MEMORY ────────

export type CommsLinkStatus = "ONLINE" | "OFFLINE" | "RESTORING" | "SYNCING";
export type SyncStatus = "PENDING" | "TRANSFERRING" | "VERIFIED" | "ACKNOWLEDGED" | "RECONCILED" | "FAILED_RETRY";
export type IncidentSeverity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR";
export type IncidentStatus = "ACTIVE" | "CONTAINED" | "RESOLVED";

export interface SyncQueueItem {
  id: string;
  station_id: string;
  event_type: string;
  payload_json: string;
  priority: number;
  priority_label: string;
  status: SyncStatus;
  checksum_sha256: string;
  is_checksum_verified: boolean;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface SyncQueueListResponse {
  station_id: string;
  total_count: number;
  pending_count: number;
  reconciled_count: number;
  failed_count: number;
  items: SyncQueueItem[];
}

export interface CommsLinkStatusResponse {
  link_id: string;
  station_id: string;
  name: string;
  status: CommsLinkStatus;
  last_sync_at: string | null;
  latency_ms: number;
  bandwidth_kbps: number;
  pending_queue_count: number;
  is_local_operation_active: boolean;
  provenance: Provenance;
}

export interface RestoreLinkResponse {
  link_status: CommsLinkStatus;
  items_processed: number;
  items_reconciled: number;
  items_failed: number;
  details: SyncQueueItem[];
}

export interface ScienceObservation {
  id: number;
  instrument_id: string;
  timestamp: string;
  measurement_value: number;
  unit: string;
  quality: string;
  source: string;
  truth_type: string;
  is_buffered: boolean;
  sync_status: string;
}

export interface ScienceInstrument {
  id: string;
  station_id: string;
  code: string;
  name: string;
  instrument_type: string;
  health: string;
  power_status: string;
  calibration_status: string;
  last_seen_at: string | null;
  metadata_completeness: string;
  buffered_observations_count: number;
  recent_observations: ScienceObservation[];
  truth_type: string;
}

export interface IncidentAction {
  id: string;
  incident_id?: string | null;
  action_code: string;
  description: string;
  executed_by: string;
  executed_at: string;
  outcome_status: string;
}

export interface IncidentListItem {
  id: string;
  station_id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string | null;
  started_at: string;
  resolved_at: string | null;
  actions_count: number;
}

export interface IncidentDetail {
  id: string;
  station_id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string | null;
  description: string;
  started_at: string;
  resolved_at: string | null;
  affected_assets: Array<{
    asset_id: string;
    name: string;
    criticality: string;
    distance: number;
    impact_factor: number;
  }>;
  affected_services: Array<{
    service_id: string;
    name: string;
    criticality: string;
    status: string;
    rationale: string;
  }>;
  modeled_risk_score: number;
  available_response_options: Array<{
    code: string;
    title: string;
    category: string;
    description: string;
    risk_reduction_tier: string;
  }>;
  actions: IncidentAction[];
  truth_type: string;
}

export interface OperationalMemory {
  id: string;
  station_id: string;
  event_type: string;
  title: string;
  context_summary: string;
  lessons_learned: string;
  decision?: string | null;
  action_taken?: string | null;
  outcome?: string | null;
  created_at: string;
}

export interface MemorySearchResponse {
  query: string | null;
  total_count: number;
  memories: OperationalMemory[];
}

export async function fetchResilienceStatus(stationId: string = "STATION-BHARATI"): Promise<CommsLinkStatusResponse> {
  const res = await fetch(`${API_BASE}/resilience/status?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) throw new Error(`Failed to fetch comms link status (${res.status})`);
  return res.json() as Promise<CommsLinkStatusResponse>;
}

export async function fetchSyncQueue(stationId: string = "STATION-BHARATI"): Promise<SyncQueueListResponse> {
  const res = await fetch(`${API_BASE}/resilience/queue?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) throw new Error(`Failed to fetch sync queue (${res.status})`);
  return res.json() as Promise<SyncQueueListResponse>;
}

export async function simulateOffline(stationId: string = "STATION-BHARATI"): Promise<CommsLinkStatusResponse> {
  const res = await fetch(`${API_BASE}/resilience/simulate-offline?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to simulate offline state (${res.status})`);
  return res.json() as Promise<CommsLinkStatusResponse>;
}

export async function restoreAndSync(stationId: string = "STATION-BHARATI"): Promise<RestoreLinkResponse> {
  const res = await fetch(`${API_BASE}/resilience/restore?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to restore comms link (${res.status})`);
  return res.json() as Promise<RestoreLinkResponse>;
}

export async function retryQueueItem(queueId: string): Promise<SyncQueueItem> {
  const res = await fetch(`${API_BASE}/resilience/retry/${encodeURIComponent(queueId)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to retry queue item (${res.status})`);
  return res.json() as Promise<SyncQueueItem>;
}

export async function resetResilienceSimulation(stationId: string = "STATION-BHARATI"): Promise<{ status: string; message: string; link_status: CommsLinkStatus; active_queue_count: number }> {
  const res = await fetch(`${API_BASE}/resilience/reset?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to reset resilience simulation (${res.status})`);
  return res.json();
}

export async function createResilienceEvent(event: {
  station_id?: string;
  event_type: string;
  priority: number;
  payload: Record<string, unknown>;
}): Promise<SyncQueueItem> {
  const res = await fetch(`${API_BASE}/resilience/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      station_id: event.station_id ?? "STATION-BHARATI",
      event_type: event.event_type,
      priority: event.priority,
      payload: event.payload,
    }),
  });
  if (!res.ok) throw new Error(`Failed to queue event (${res.status})`);
  return res.json() as Promise<SyncQueueItem>;
}

export async function fetchScienceInstruments(stationId: string = "STATION-BHARATI"): Promise<ScienceInstrument[]> {
  const res = await fetch(`${API_BASE}/science/instruments?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) throw new Error(`Failed to fetch science instruments (${res.status})`);
  return res.json() as Promise<ScienceInstrument[]>;
}

export async function fetchInstrumentObservations(instrumentId: string): Promise<ScienceInstrument> {
  const res = await fetch(`${API_BASE}/science/instruments/${encodeURIComponent(instrumentId)}/observations`);
  if (!res.ok) throw new Error(`Failed to fetch instrument observations (${res.status})`);
  return res.json() as Promise<ScienceInstrument>;
}

export async function bufferScienceObservation(data: {
  instrument_id: string;
  measurement_value: number;
  unit?: string;
}): Promise<ScienceObservation> {
  const res = await fetch(`${API_BASE}/science/observations/buffer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to buffer science observation (${res.status})`);
  return res.json() as Promise<ScienceObservation>;
}

export async function fetchIncidents(stationId: string = "STATION-BHARATI"): Promise<IncidentListItem[]> {
  const res = await fetch(`${API_BASE}/incidents?station_id=${encodeURIComponent(stationId)}`);
  if (!res.ok) throw new Error(`Failed to fetch incidents (${res.status})`);
  return res.json() as Promise<IncidentListItem[]>;
}

export async function fetchIncidentDetail(incidentId: string): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}`);
  if (!res.ok) throw new Error(`Failed to fetch incident detail (${res.status})`);
  return res.json() as Promise<IncidentDetail>;
}

export async function createIncident(data: {
  station_id?: string;
  title: string;
  severity?: IncidentSeverity;
  location?: string;
  description: string;
  primary_asset_id?: string;
}): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      station_id: data.station_id ?? "STATION-BHARATI",
      title: data.title,
      severity: data.severity ?? "MAJOR",
      location: data.location ?? "Powerhouse Gen Bay 2",
      description: data.description,
      primary_asset_id: data.primary_asset_id ?? "G-02",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create incident (${res.status})`);
  return res.json() as Promise<IncidentDetail>;
}

export async function logIncidentAction(incidentId: string, data: {
  action_code: string;
  description: string;
  executed_by?: string;
  outcome_status?: string;
}): Promise<IncidentAction> {
  const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to log incident action (${res.status})`);
  return res.json() as Promise<IncidentAction>;
}

export async function updateIncidentStatus(incidentId: string, status: IncidentStatus): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update incident status (${res.status})`);
  return res.json() as Promise<IncidentDetail>;
}

export async function searchOperationalMemory(query?: string, stationId: string = "STATION-BHARATI"): Promise<MemorySearchResponse> {
  let url = `${API_BASE}/memory?station_id=${encodeURIComponent(stationId)}`;
  if (query && query.trim()) {
    url += `&q=${encodeURIComponent(query.trim())}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to search operational memory (${res.status})`);
  return res.json() as Promise<MemorySearchResponse>;
}

export async function recordOperationalMemory(data: {
  station_id?: string;
  event_type: string;
  title: string;
  incident_id?: string;
  decision: string;
  action_taken: string;
  outcome: string;
  lesson: string;
}): Promise<OperationalMemory> {
  const res = await fetch(`${API_BASE}/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      station_id: data.station_id ?? "STATION-BHARATI",
      event_type: data.event_type,
      title: data.title,
      incident_id: data.incident_id,
      decision: data.decision,
      action_taken: data.action_taken,
      outcome: data.outcome,
      lesson: data.lesson,
    }),
  });
  if (!res.ok) throw new Error(`Failed to record operational memory (${res.status})`);
  return res.json() as Promise<OperationalMemory>;
}

// ── OPERATIONAL EVENT STREAM & EXPLAINABILITY (DAY 2) ─────────────────────────

export interface OperationalEvent {
  id: string;
  timestamp: string;
  station_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  title: string;
  summary: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "SYSTEM";
  truth_type: string;
  metadata?: Record<string, unknown> | null;
  is_synthetic: boolean;
}

export interface EventListResponse {
  events: OperationalEvent[];
  total_count: number;
  station_id: string;
  simulation_active: boolean;
  last_updated: string;
}

export interface ExplanationEvidence {
  factor: string;
  metric: string;
  value: string | number | boolean;
  threshold?: string | number | null;
  status: "NOMINAL" | "WARNING" | "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
  detail: string;
}

export interface ExplanationConsequence {
  domain: string;
  impact: string;
  blast_radius_depth: number;
  description: string;
}

export interface RecoveryConstraint {
  constraint_type: string;
  resource_id?: string | null;
  description: string;
  impact_level: "LOW" | "MEDIUM" | "HIGH" | "BLOCKING";
}

export interface RecommendedNextStep {
  action_code: string;
  title: string;
  description: string;
  target_route: string;
  action_type: "INSPECT" | "SIMULATE" | "REVIEW" | "MITIGATE";
}

export interface ExplanationResponse {
  subject: string;
  domain: string;
  entity_id: string;
  station_id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  summary: string;
  why_it_matters: string;
  evidence: ExplanationEvidence[];
  consequences: ExplanationConsequence[];
  recovery_constraints: RecoveryConstraint[];
  recommended_next_steps: RecommendedNextStep[];
  confidence: number;
  truth_type: string;
  source_context: string[];
  timestamp: string;
}

export async function fetchOperationalEvents(params?: {
  station_id?: string;
  severity?: string;
  event_type?: string;
  limit?: number;
  offset?: number;
}): Promise<EventListResponse> {
  const station = params?.station_id ?? "STATION-BHARATI";
  let url = `${API_BASE}/events?station_id=${encodeURIComponent(station)}`;
  if (params?.severity) {
    url += `&severity=${encodeURIComponent(params.severity)}`;
  }
  if (params?.event_type) {
    url += `&event_type=${encodeURIComponent(params.event_type)}`;
  }
  if (params?.limit) {
    url += `&limit=${params.limit}`;
  }
  if (params?.offset) {
    url += `&offset=${params.offset}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch operational events (${res.status})`);
  return res.json() as Promise<EventListResponse>;
}

export async function fetchExplanation(
  domain: string,
  entityId: string,
  stationId: string = "STATION-BHARATI"
): Promise<ExplanationResponse> {
  const url = `${API_BASE}/explain/${encodeURIComponent(domain)}/${encodeURIComponent(entityId)}?station_id=${encodeURIComponent(stationId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorBody.detail || `Failed to fetch operational explanation (${res.status})`);
  }
  return res.json() as Promise<ExplanationResponse>;
}

export async function simulateDemoEvent(
  stepIndex?: number,
  stationId: string = "STATION-BHARATI"
): Promise<OperationalEvent> {
  const res = await fetch(`${API_BASE}/events/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step_index: stepIndex,
      station_id: stationId,
    }),
  });
  if (!res.ok) throw new Error(`Failed to simulate demo event (${res.status})`);
  return res.json() as Promise<OperationalEvent>;
}

export async function resetDemoEvents(
  stationId: string = "STATION-BHARATI"
): Promise<{ status: string; message: string; events_reset_count: number }> {
  const res = await fetch(`${API_BASE}/events/reset?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to reset events (${res.status})`);
  return res.json() as Promise<{ status: string; message: string; events_reset_count: number }>;
}

// ==========================================
// DAY 4: MULTI-STATION COORDINATION & COMPARISON
// ==========================================

export interface OperationalCapabilityItem {
  domain: string;
  name: string;
  headroom_score: number;
  status: "NOMINAL" | "CONSTRAINED" | "CRITICAL" | string;
  summary: string;
  calculation_basis?: string;
  metrics: Record<string, string | number | boolean>;
}

export interface OperationalDifferenceItem {
  dimension: string;
  title: string;
  station_a_value: string;
  station_b_value: string;
  delta_summary: string;
  pressure_direction: "BHARATI_HIGHER" | "MAITRI_HIGHER" | "BALANCED" | string;
  significance: "CRITICAL" | "MODERATE" | "INFORMATIONAL" | string;
}

export interface CoordinationConstraintItem {
  constraint_type: string;
  name: string;
  status: "RESTRICTED" | "IMPASSABLE" | "NOMINAL" | "DEGRADED" | string;
  impact: string;
  details: string;
  provenance_type?: string;
  validation_status?: string;
}

export interface CrossStationConsiderationItem {
  id: string;
  category: string;
  title: string;
  recommendation: string;
  rationale: string;
  prerequisites: string[];
  feasibility_status: "FEASIBLE_WITH_CONSTRAINTS" | "RESTRICTED" | "ADVISORY_ONLY" | string;
}

export interface RecoveryChainItem {
  station_id: string;
  asset_id: string;
  asset_code: string;
  technical_condition: string;
  material_constraint: string;
  local_availability: string;
  maintenance_constraint: string;
  resupply_dependency: string;
  recovery_exposure: string;
  recovery_status: "CONSTRAINED" | "NOMINAL" | "BLOCKED" | "WATCH" | string;
  timing_confidence: string;
  timing_disclaimer: string;
}

export interface StationPortfolioItem {
  station_id: string;
  code: string;
  name: string;
  status: StationStatus;
  overall_health: number;
  fuel_runway_days?: number | null;
  fuel_quantity_liters?: number | null;
  temperature_celsius: number;
  wind_speed_knots: number;
  conditions: string;
  comms_status: string;
  active_incidents_count: number;
  critical_spares_available: number;
  capabilities: OperationalCapabilityItem[];
}

export interface StationComparisonResponse {
  station_a: StationPortfolioItem;
  station_b: StationPortfolioItem;
  capabilities_summary: Array<Record<string, string | number>>;
  differences: OperationalDifferenceItem[];
  constraints: CoordinationConstraintItem[];
  considerations: CrossStationConsiderationItem[];
  recovery_chain?: RecoveryChainItem[];
  higher_pressure_station_id: string;
  pressure_rationale: string;
  provenance: Provenance;
}

export interface CrossStationScenarioRequest {
  disrupted_station_id?: string;
  support_station_id?: string;
  scenario_type?: string;
  target_asset_id?: string;
  duration_hours?: number;
  ambient_temp_celsius?: number | null;
}

export interface CrossStationScenarioResponse {
  scenario_id: string;
  scenario_type: string;
  disrupted_station_id: string;
  disrupted_station_name: string;
  support_station_id: string;
  support_station_name: string;
  disruption_summary: string;
  support_capacity_summary: string;
  differences: OperationalDifferenceItem[];
  capabilities: OperationalCapabilityItem[];
  constraints: CoordinationConstraintItem[];
  considerations: CrossStationConsiderationItem[];
  decision_options: ScenarioDecisionOption[];
  affected_services: ScenarioAffectedService[];
  reserve_margin_disrupted_kw: number;
  reserve_margin_support_kw: number;
  truth_type: string;
  source_context: string[];
  disclaimer: string;
  computed_at: string;
}

export async function fetchStationComparison(
  stationA: string = "STATION-BHARATI",
  stationB: string = "STATION-MAITRI"
): Promise<StationComparisonResponse> {
  const url = `${API_BASE}/station/comparison?station_a_id=${encodeURIComponent(stationA)}&station_b_id=${encodeURIComponent(stationB)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch station comparison (${res.status})`);
  return res.json() as Promise<StationComparisonResponse>;
}

export async function evaluateStationComparison(
  stationA: string = "STATION-BHARATI",
  stationB: string = "STATION-MAITRI"
): Promise<StationComparisonResponse> {
  const url = `${API_BASE}/station/comparison/evaluate?station_a_id=${encodeURIComponent(stationA)}&station_b_id=${encodeURIComponent(stationB)}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to evaluate station comparison (${res.status})`);
  return res.json() as Promise<StationComparisonResponse>;
}

export async function simulateCrossStationScenario(
  payload: CrossStationScenarioRequest
): Promise<CrossStationScenarioResponse> {
  const res = await fetch(`${API_BASE}/scenarios/cross-station`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorBody.detail || `Failed to simulate cross-station scenario (${res.status})`);
  }
  return res.json() as Promise<CrossStationScenarioResponse>;
}

// ── Operational Intelligence & Causal Reasoning Types ───────────────────

export interface CausalStageItem {
  stage: "CHANGE" | "CONTEXT" | "DEPENDENCY" | "RISK" | "CONSEQUENCE" | "SCENARIO" | "ACTION" | string;
  title: string;
  headline: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "NOMINAL" | "INFO" | string;
  truth_type: "MEASURED" | "DERIVED" | "SCENARIO" | "FORECAST" | string;
  supporting_metrics: Record<string, any>;
  target_route?: string | null;
  action_label?: string | null;
}

export interface OperationalDecisionItem {
  id: string;
  title: string;
  rationale: string;
  action_type: "INSPECT" | "SIMULATE" | "RECOVERY" | "RESILIENCE" | "ADVISORY" | string;
  target_route: string;
  button_label: string;
  is_primary: boolean;
}

export interface OperationalInsightResponse {
  station_id: string;
  station_name: string;
  primary_condition_id: string;
  severity: "CRITICAL" | "WARNING" | "NOMINAL" | string;
  status_label: string;
  headline: string;
  summary: string;
  causal_chain: CausalStageItem[];
  decisions: OperationalDecisionItem[];
  provenance: Provenance;
}

export async function fetchOperationalIntelligence(
  stationId: string = "STATION-BHARATI"
): Promise<OperationalInsightResponse> {
  const url = `${API_BASE}/intelligence/narrative?station_id=${encodeURIComponent(stationId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch operational intelligence (${res.status})`);
  return res.json() as Promise<OperationalInsightResponse>;
}



