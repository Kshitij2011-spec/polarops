import { useQuery } from "@tanstack/react-query";
import { fetchFuelStatus, type FuelStatus } from "../lib/api";

export function useFuelStatus(stationId: string = "STATION-BHARATI") {
  return useQuery<FuelStatus, Error>({
    queryKey: ["fuel-status", stationId],
    queryFn: () => fetchFuelStatus(stationId),
    staleTime: 15_000,
    retry: 2,
  });
}
