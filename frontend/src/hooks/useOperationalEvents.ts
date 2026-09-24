import { useQuery } from "@tanstack/react-query";
import { fetchOperationalEvents, type EventListResponse } from "../lib/api";

export function useOperationalEvents(stationId: string = "STATION-BHARATI", limit: number = 20) {
  return useQuery<EventListResponse, Error>({
    queryKey: ["operational-events", stationId, limit],
    queryFn: () => fetchOperationalEvents({ station_id: stationId, limit }),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
