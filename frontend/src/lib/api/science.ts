/**
 * Scientific Instruments, Observations & Deferrable Load Buffering API
 * Owner: Tanvi (Logistics & Mission Continuity Lead)
 */

import { API_BASE, handleApiResponse } from "./client";

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

export async function fetchScienceInstruments(stationId: string = "STATION-BHARATI"): Promise<ScienceInstrument[]> {
  const res = await fetch(`${API_BASE}/science/instruments?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<ScienceInstrument[]>(res, `Failed to fetch science instruments for ${stationId}`);
}

export async function fetchInstrumentObservations(instrumentId: string): Promise<ScienceInstrument> {
  const res = await fetch(`${API_BASE}/science/instruments/${encodeURIComponent(instrumentId)}/observations`);
  return handleApiResponse<ScienceInstrument>(res, `Failed to fetch observations for instrument ${instrumentId}`);
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
  return handleApiResponse<ScienceObservation>(res, "Failed to buffer science observation");
}
