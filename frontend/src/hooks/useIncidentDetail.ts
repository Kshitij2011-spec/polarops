import { useQuery } from "@tanstack/react-query";
import { fetchIncidentDetail, type IncidentDetail } from "../lib/api";

export function useIncidentDetail(incidentId?: string | null) {
  return useQuery<IncidentDetail, Error>({
    queryKey: ["incident-detail", incidentId],
    queryFn: () => fetchIncidentDetail(incidentId!),
    enabled: Boolean(incidentId),
    staleTime: 2_000,
  });
}
