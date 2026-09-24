/**
 * Station Overview, Events, and Multi-Station Coordination API
 * Owner: Kshitij (Product Owner & System Integration Lead)
 */

import { API_BASE, handleApiResponse, type Provenance, type StationStatus, type EnvironmentMode } from "./client";

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

export async function fetchStationOverview(stationId: string): Promise<StationOverview> {
  const res = await fetch(`${API_BASE}/station/overview?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<StationOverview>(res, `Failed to fetch station overview for ${stationId}`);
}

export async function fetchStationComparison(
  stationA: string = "STATION-BHARATI",
  stationB: string = "STATION-MAITRI"
): Promise<StationComparisonResponse> {
  const url = `${API_BASE}/station/comparison?station_a_id=${encodeURIComponent(stationA)}&station_b_id=${encodeURIComponent(stationB)}`;
  const res = await fetch(url);
  return handleApiResponse<StationComparisonResponse>(res, "Failed to fetch station comparison");
}

export async function evaluateStationComparison(
  stationA: string = "STATION-BHARATI",
  stationB: string = "STATION-MAITRI"
): Promise<StationComparisonResponse> {
  const url = `${API_BASE}/station/comparison/evaluate?station_a_id=${encodeURIComponent(stationA)}&station_b_id=${encodeURIComponent(stationB)}`;
  const res = await fetch(url, { method: "POST" });
  return handleApiResponse<StationComparisonResponse>(res, "Failed to evaluate station comparison");
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
  if (params?.severity) url += `&severity=${encodeURIComponent(params.severity)}`;
  if (params?.event_type) url += `&event_type=${encodeURIComponent(params.event_type)}`;
  if (params?.limit) url += `&limit=${params.limit}`;
  if (params?.offset) url += `&offset=${params.offset}`;
  const res = await fetch(url);
  return handleApiResponse<EventListResponse>(res, "Failed to fetch operational events");
}

export async function simulateDemoEvent(
  stepIndex?: number,
  stationId: string = "STATION-BHARATI"
): Promise<OperationalEvent> {
  const res = await fetch(`${API_BASE}/events/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step_index: stepIndex, station_id: stationId }),
  });
  return handleApiResponse<OperationalEvent>(res, "Failed to simulate demo event");
}

export async function resetDemoEvents(
  stationId: string = "STATION-BHARATI"
): Promise<{ status: string; message: string; events_reset_count: number }> {
  const res = await fetch(`${API_BASE}/events/reset?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  return handleApiResponse<{ status: string; message: string; events_reset_count: number }>(res, "Failed to reset events");
}

export async function fetchOperationalIntelligence(
  stationId: string = "STATION-BHARATI"
): Promise<OperationalInsightResponse> {
  const url = `${API_BASE}/intelligence/narrative?station_id=${encodeURIComponent(stationId)}`;
  const res = await fetch(url);
  return handleApiResponse<OperationalInsightResponse>(res, "Failed to fetch operational intelligence");
}
