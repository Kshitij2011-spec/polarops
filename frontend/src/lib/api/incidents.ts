/**
 * Incidents Common Operating Picture (COP) & Action Execution Ledger API
 * Owner: Tanvi (Decision Lead)
 */

import { API_BASE, handleApiResponse } from "./client";

export type IncidentSeverity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR";
export type IncidentStatus = "ACTIVE" | "CONTAINED" | "RESOLVED";

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

export async function fetchIncidents(stationId: string = "STATION-BHARATI"): Promise<IncidentListItem[]> {
  const res = await fetch(`${API_BASE}/incidents?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<IncidentListItem[]>(res, `Failed to fetch incidents for ${stationId}`);
}

export async function fetchIncidentDetail(incidentId: string): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}`);
  return handleApiResponse<IncidentDetail>(res, `Failed to fetch incident detail for ${incidentId}`);
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
  return handleApiResponse<IncidentDetail>(res, "Failed to create incident");
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
  return handleApiResponse<IncidentAction>(res, `Failed to log action for incident ${incidentId}`);
}

export async function updateIncidentStatus(incidentId: string, status: IncidentStatus): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleApiResponse<IncidentDetail>(res, `Failed to update status for incident ${incidentId}`);
}
