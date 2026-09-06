import { useQuery } from "@tanstack/react-query";
import { fetchResilienceStatus, type CommsLinkStatusResponse } from "../lib/api";

export function useResilienceStatus(stationId: string = "STATION-BHARATI") {
  return useQuery<CommsLinkStatusResponse, Error>({
    queryKey: ["resilience-status", stationId],
    queryFn: () => fetchResilienceStatus(stationId),
    staleTime: 2_000,
    refetchInterval: 5_000,
  });
}
