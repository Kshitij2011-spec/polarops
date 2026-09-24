/**
 * Digital Twin, Asset Intelligence, Dependencies & Risk 2.0 API
 * Owner: Dhruv (Twin Lead)
 */

import { API_BASE, handleApiResponse, type Provenance } from "./client";

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

  drivers?: RiskDriverItem[];
  failure_exposure?: FailureExposureItem | null;
  recovery_exposure?: RecoveryExposureItem | null;
  environmental_amplification?: EnvironmentalAmplificationItem | null;
  headroom?: OperationalHeadroomItem | null;
  concentration?: RiskConcentrationItem | null;
  projections?: RiskProjectionItem[];
  state_transition?: RiskStateTransitionItem | null;
}

export async function fetchAssets(stationId: string): Promise<AssetListItem[]> {
  const res = await fetch(`${API_BASE}/assets?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<AssetListItem[]>(res, `Failed to fetch assets for ${stationId}`);
}

export async function fetchAssetDetail(assetId: string): Promise<AssetDetail> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}`);
  return handleApiResponse<AssetDetail>(res, `Failed to fetch asset detail for ${assetId}`);
}

export async function fetchAssetDependencies(assetId: string, maxDepth: number = 5): Promise<AssetDependencies> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}/dependencies?max_depth=${maxDepth}`);
  return handleApiResponse<AssetDependencies>(res, `Failed to fetch asset dependencies for ${assetId}`);
}

export async function fetchAssetTelemetry(assetId: string, limit: number = 50): Promise<AssetTelemetry> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}/telemetry?limit=${limit}`);
  return handleApiResponse<AssetTelemetry>(res, `Failed to fetch asset telemetry for ${assetId}`);
}

export async function fetchAssetRisk(assetId: string): Promise<AssetRisk> {
  const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(assetId)}/risk`);
  return handleApiResponse<AssetRisk>(res, `Failed to fetch asset risk analysis for ${assetId}`);
}
