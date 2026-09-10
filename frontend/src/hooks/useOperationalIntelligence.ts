import { useQuery } from "@tanstack/react-query";
import { fetchOperationalIntelligence, type OperationalInsightResponse } from "../lib/api";

export function useOperationalIntelligence(stationId: string = "STATION-BHARATI") {
  return useQuery<OperationalInsightResponse, Error>({
    queryKey: ["operational-intelligence", stationId],
    queryFn: () => fetchOperationalIntelligence(stationId),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
