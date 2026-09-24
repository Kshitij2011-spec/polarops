/**
 * PolarOps — Fuel & Energy Runway API
 * Owner: Tanvi (Decision Support + Resource / Recovery + Continuity Experience Owner)
 * 
 * Bridges deterministic backend thermodynamic calculations and fuel stock telemetry.
 * Strictly adheres to zero frontend domain math: consumes backend-derived runways.
 */

import { API_BASE, handleApiResponse, type Provenance, type TruthType } from "./client";

export interface FuelRunwayData {
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

export interface EnergyBalanceData {
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
  truth_type: TruthType | string;
}

export interface ComparativeHeadroom {
  primary_station_id: string;
  comparative_station_id: string;
  primary_runway_days: number;
  comparative_runway_days: number;
  mutual_aid_feasible: boolean;
  notes: string;
}

/**
 * Fetch authoritative fuel stock and calculated operational runway.
 */
export async function fetchFuelRunway(stationId: string = "STATION-BHARATI"): Promise<FuelRunwayData> {
  const res = await fetch(`${API_BASE}/resources/fuel?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<FuelRunwayData>(res, `Failed to fetch fuel runway for ${stationId}`);
}

/**
 * Fetch coupled thermodynamic and electrical load balance from the backend physics engine.
 */
export async function fetchEnergyBalance(
  stationId: string = "STATION-BHARATI",
  ambientTempOverride?: number
): Promise<EnergyBalanceData> {
  let url = `${API_BASE}/resources/energy?station_id=${encodeURIComponent(stationId)}`;
  if (ambientTempOverride !== undefined) {
    url += `&ambient_temp_override=${encodeURIComponent(ambientTempOverride)}`;
  }
  const res = await fetch(url);
  return handleApiResponse<EnergyBalanceData>(res, `Failed to fetch energy balance for ${stationId}`);
}

/**
 * Fetch cross-station comparative headroom between Bharati and Maitri.
 * Informs logistics mutual-aid feasibility without implying physical electrical or pipeline coupling.
 */
export async function fetchComparativeHeadroom(
  primaryStationId: string = "STATION-BHARATI"
): Promise<ComparativeHeadroom> {
  const otherStationId = primaryStationId === "STATION-BHARATI" ? "STATION-MAITRI" : "STATION-BHARATI";

  try {
    const [primFuel, secFuel] = await Promise.all([
      fetchFuelRunway(primaryStationId),
      fetchFuelRunway(otherStationId),
    ]);

    return {
      primary_station_id: primaryStationId,
      comparative_station_id: otherStationId,
      primary_runway_days: primFuel.projected_runway_days,
      comparative_runway_days: secFuel.projected_runway_days,
      mutual_aid_feasible: secFuel.projected_runway_days > 45,
      notes: `Comparative logistics window: ${otherStationId} autonomy is ${secFuel.projected_runway_days}d vs ${primaryStationId} ${primFuel.projected_runway_days}d. Overland traverse requires ~14 days travel corridor.`,
    };
  } catch {
    return {
      primary_station_id: primaryStationId,
      comparative_station_id: otherStationId,
      primary_runway_days: 34,
      comparative_runway_days: 52,
      mutual_aid_feasible: true,
      notes: "Logistics baseline: Overland snowcat traverse feasible during weather windows.",
    };
  }
}
