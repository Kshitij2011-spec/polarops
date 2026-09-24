/**
 * Counterfactual Scenario Simulation & Decision Intelligence API
 * Owner: Tanvi (Decision Lead)
 */

import { API_BASE, handleApiResponse } from "./client";
import type { OperationalDifferenceItem, OperationalCapabilityItem, CoordinationConstraintItem, CrossStationConsiderationItem } from "./station";

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

export async function simulateScenario(request: ScenarioSimulateRequest): Promise<ScenarioSimulateResponse> {
  const res = await fetch(`${API_BASE}/scenarios/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleApiResponse<ScenarioSimulateResponse>(res, "Simulation request failed");
}

export async function simulateCrossStationScenario(
  payload: CrossStationScenarioRequest
): Promise<CrossStationScenarioResponse> {
  const res = await fetch(`${API_BASE}/scenarios/cross-station`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleApiResponse<CrossStationScenarioResponse>(res, "Failed to simulate cross-station scenario");
}
