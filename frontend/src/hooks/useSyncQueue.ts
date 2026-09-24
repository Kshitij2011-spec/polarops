import { useQuery } from "@tanstack/react-query";
import { fetchSyncQueue, type SyncQueueListResponse } from "../lib/api";

export function useSyncQueue(stationId: string = "STATION-BHARATI") {
  return useQuery<SyncQueueListResponse, Error>({
    queryKey: ["resilience-queue", stationId],
    queryFn: () => fetchSyncQueue(stationId),
    staleTime: 2_000,
    refetchInterval: 4_000,
  });
}
