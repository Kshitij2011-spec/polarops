import { useQuery } from "@tanstack/react-query";
import { fetchEnergyModel, type EnergyModel } from "../lib/api";

export function useEnergyModel(stationId: string = "STATION-BHARATI", ambientTempOverride?: number) {
  return useQuery<EnergyModel, Error>({
    queryKey: ["energy-model", stationId, ambientTempOverride],
    queryFn: () => fetchEnergyModel(stationId, ambientTempOverride),
    staleTime: 20_000,
    retry: 2,
  });
}
