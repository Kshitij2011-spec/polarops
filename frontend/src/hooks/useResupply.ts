import { useQuery } from "@tanstack/react-query";
import { fetchResupply, type ResupplyOpportunityItem } from "../lib/api";

export function useResupply(stationId: string = "STATION-BHARATI") {
  return useQuery<ResupplyOpportunityItem[], Error>({
    queryKey: ["resupply-logistics", stationId],
    queryFn: () => fetchResupply(stationId),
    staleTime: 60_000,
    retry: 2,
  });
}
