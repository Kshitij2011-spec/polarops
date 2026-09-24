/**
 * Fuel Runway, Energy Model, Warehouse Spares & Resupply API
 * Owner: Tanvi (Decision & Logistics Lead)
 */

import { API_BASE, handleApiResponse, type Provenance } from "./client";

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

export async function fetchFuelStatus(stationId: string = "STATION-BHARATI"): Promise<FuelStatus> {
  const res = await fetch(`${API_BASE}/resources/fuel?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<FuelStatus>(res, `Failed to fetch fuel status for ${stationId}`);
}

export async function fetchInventory(stationId: string = "STATION-BHARATI"): Promise<InventorySpareItem[]> {
  const res = await fetch(`${API_BASE}/resources/inventory?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<InventorySpareItem[]>(res, `Failed to fetch warehouse inventory for ${stationId}`);
}

export async function fetchResupply(stationId: string = "STATION-BHARATI"): Promise<ResupplyOpportunityItem[]> {
  const res = await fetch(`${API_BASE}/resources/resupply?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<ResupplyOpportunityItem[]>(res, `Failed to fetch resupply logistics for ${stationId}`);
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
  return handleApiResponse<EnergyModel>(res, `Failed to fetch energy model for ${stationId}`);
}

export async function fetchRecoveryExposure(assetId: string): Promise<AssetRecoveryExposure> {
  const res = await fetch(`${API_BASE}/resources/recovery/${encodeURIComponent(assetId)}`);
  return handleApiResponse<AssetRecoveryExposure>(res, `Failed to fetch recovery exposure for ${assetId}`);
}
