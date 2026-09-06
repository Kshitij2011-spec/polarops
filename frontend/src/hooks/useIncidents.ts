import { useQuery } from "@tanstack/react-query";
import { fetchIncidents, type IncidentListItem } from "../lib/api";

export function useIncidents(stationId: string = "STATION-BHARATI") {
  return useQuery<IncidentListItem[], Error>({
    queryKey: ["incidents", stationId],
    queryFn: () => fetchIncidents(stationId),
    staleTime: 3_000,
    refetchInterval: 6_000,
  });
}
