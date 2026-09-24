/**
 * Searchable Institutional Memory & Operational Precedent Archive API
 * Owner: Tanvi (Decision Lead)
 */

import { API_BASE, handleApiResponse } from "./client";

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

export async function searchOperationalMemory(
  query?: string,
  stationId: string = "STATION-BHARATI"
): Promise<MemorySearchResponse> {
  let url = `${API_BASE}/memory?station_id=${encodeURIComponent(stationId)}`;
  if (query && query.trim()) {
    url += `&q=${encodeURIComponent(query.trim())}`;
  }
  const res = await fetch(url);
  return handleApiResponse<MemorySearchResponse>(res, "Failed to search operational memory");
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
  return handleApiResponse<OperationalMemory>(res, "Failed to record operational memory");
}
