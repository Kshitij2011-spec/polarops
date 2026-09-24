import { useQuery } from "@tanstack/react-query";
import { fetchStationOverview, type StationOverview } from "../lib/api";

export function useStationOverview(stationId: string) {
  return useQuery<StationOverview, Error>({
    queryKey: ["station-overview", stationId],
    queryFn: () => fetchStationOverview(stationId),
    staleTime: 10_000, // 10s
    refetchInterval: 30_000, // 30s background poll
  });
}
