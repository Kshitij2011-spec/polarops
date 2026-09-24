/**
 * Edge Resilience, Satellite Comms Link & Store-and-Forward Sync API
 * Owner: Tanvi (Resilience & Edge Architecture Lead)
 */

import { API_BASE, handleApiResponse, type Provenance } from "./client";

export type CommsLinkStatus = "ONLINE" | "OFFLINE" | "RESTORING" | "SYNCING";
export type SyncStatus = "PENDING" | "TRANSFERRING" | "VERIFIED" | "ACKNOWLEDGED" | "RECONCILED" | "FAILED_RETRY";

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

export async function fetchResilienceStatus(stationId: string = "STATION-BHARATI"): Promise<CommsLinkStatusResponse> {
  const res = await fetch(`${API_BASE}/resilience/status?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<CommsLinkStatusResponse>(res, "Failed to fetch comms link status");
}

export async function fetchSyncQueue(stationId: string = "STATION-BHARATI"): Promise<SyncQueueListResponse> {
  const res = await fetch(`${API_BASE}/resilience/queue?station_id=${encodeURIComponent(stationId)}`);
  return handleApiResponse<SyncQueueListResponse>(res, "Failed to fetch sync queue");
}

export async function simulateOffline(stationId: string = "STATION-BHARATI"): Promise<CommsLinkStatusResponse> {
  const res = await fetch(`${API_BASE}/resilience/simulate-offline?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  return handleApiResponse<CommsLinkStatusResponse>(res, "Failed to simulate offline state");
}

export async function restoreAndSync(stationId: string = "STATION-BHARATI"): Promise<RestoreLinkResponse> {
  const res = await fetch(`${API_BASE}/resilience/restore?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  return handleApiResponse<RestoreLinkResponse>(res, "Failed to restore comms link");
}

export async function retryQueueItem(queueId: string): Promise<SyncQueueItem> {
  const res = await fetch(`${API_BASE}/resilience/retry/${encodeURIComponent(queueId)}`, {
    method: "POST",
  });
  return handleApiResponse<SyncQueueItem>(res, "Failed to retry queue item");
}

export async function resetResilienceSimulation(stationId: string = "STATION-BHARATI"): Promise<{
  status: string;
  message: string;
  link_status: CommsLinkStatus;
  active_queue_count: number;
}> {
  const res = await fetch(`${API_BASE}/resilience/reset?station_id=${encodeURIComponent(stationId)}`, {
    method: "POST",
  });
  return handleApiResponse<{ status: string; message: string; link_status: CommsLinkStatus; active_queue_count: number }>(
    res,
    "Failed to reset resilience simulation"
  );
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
  return handleApiResponse<SyncQueueItem>(res, "Failed to queue resilience event");
}
