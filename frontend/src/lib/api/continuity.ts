/**
 * PolarOps — Continuity & Logistics API
 * Owner: Tanvi (Decision Support + Resource / Recovery + Continuity Experience Owner)
 * 
 * Provides unified access to recovery exposures, critical spares, maritime resupply windows,
 * edge priority queues, and scientific instrument continuity.
 */

import { API_BASE, handleApiResponse, type Provenance } from "./client";
import type { AssetRecoveryExposure, InventorySpareItem, ResupplyOpportunityItem } from "./resources";
import type { CommsLinkStatusResponse, SyncQueueItem, RestoreLinkResponse } from "./resilience";

export interface ScienceInstrumentContinuity {
  id: string;
  name: string;
  code: string;
  station_id: string;
  subsystem_code?: string;
  priority_tier?: number;
  status?: "ONLINE" | "BUFFERING" | "SHED" | "OFFLINE" | string;
  power_status?: string;
  calibration_status?: string;
  instrument_type?: string;
  power_draw_kw?: number;
  buffer_capacity_mb?: number;
  buffer_used_mb?: number;
  buffer_percent?: number;
  buffered_observations_count?: number;
  observations_count?: number;
  last_observation_at?: string | null;
}

/**
 * Fetch asset-specific recovery chain and supply exposure.
 */
export async function fetchAssetRecovery(assetId: string): Promise<AssetRecoveryExposure> {
  const res = await fetch(`${API_BASE}/resources/recovery/${encodeURIComponent(assetId)}`);
  return handleApiResponse<AssetRecoveryExposure>(res, `Failed to fetch recovery exposure for ${assetId}`);
}

/**
 * Fetch warehouse inventory spares with operational status.
 */
export async function fetchSparesInventory(
  stationId: string = "STATION-BHARATI"
): Promise<InventorySpareItem[]> {
  const res = await fetch(`${API_BASE}/resources/inventory?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<InventorySpareItem[]>(res, `Failed to fetch spares inventory for ${stationId}`);
}

/**
 * Fetch inbound resupply vessels and aviation transport constraints.
 */
export async function fetchResupplyLogistics(
  stationId: string = "STATION-BHARATI"
): Promise<ResupplyOpportunityItem[]> {
  const res = await fetch(`${API_BASE}/resources/resupply?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<ResupplyOpportunityItem[]>(res, `Failed to fetch resupply logistics for ${stationId}`);
}

/**
 * Fetch satellite edge link status, latency, and unsynced count.
 */
export async function fetchEdgeCommsStatus(
  stationId: string = "STATION-BHARATI"
): Promise<CommsLinkStatusResponse> {
  const res = await fetch(`${API_BASE}/resilience/status?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<CommsLinkStatusResponse>(res, `Failed to fetch comms resilience status for ${stationId}`);
}

/**
 * Fetch sorted priority sync queue items for the station.
 */
export async function fetchSyncQueueItems(
  stationId: string = "STATION-BHARATI"
): Promise<SyncQueueItem[]> {
  const res = await fetch(`${API_BASE}/resilience/queue?station_id=${encodeURIComponent(stationId)}`);
  const data = await handleApiResponse<{ total_count: number; items: SyncQueueItem[] }>(
    res,
    `Failed to fetch sync queue for ${stationId}`
  );
  return data.items || [];
}

/**
 * Trigger priority-aware link restoration and SHA-256 batch reconciliation.
 */
export async function restoreAndSyncQueue(
  stationId: string = "STATION-BHARATI"
): Promise<RestoreLinkResponse> {
  const res = await fetch(`${API_BASE}/resilience/restore?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  return handleApiResponse<RestoreLinkResponse>(res, "Failed to restore and synchronize queue");
}

/**
 * Fetch scientific experiment instruments, buffer status, and load-shedding configurations.
 */
export async function fetchScienceInstruments(
  stationId: string = "STATION-BHARATI"
): Promise<ScienceInstrumentContinuity[]> {
  const res = await fetch(`${API_BASE}/science/instruments?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<ScienceInstrumentContinuity[]>(res, `Failed to fetch science instruments for ${stationId}`);
}
