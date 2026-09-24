import { useQuery } from "@tanstack/react-query";
import { fetchExplanation, type ExplanationResponse } from "../lib/api";

export function useExplanation(
  domain: string,
  entityId: string,
  stationId: string = "STATION-BHARATI",
  enabled: boolean = true
) {
  return useQuery<ExplanationResponse, Error>({
    queryKey: ["explanation", domain, entityId, stationId],
    queryFn: () => fetchExplanation(domain, entityId, stationId),
    enabled: enabled && !!domain && !!entityId,
    staleTime: 30_000,
  });
}
