import { useQuery } from "@tanstack/react-query";
import { fetchScienceInstruments, type ScienceInstrument } from "../lib/api";

export function useScienceInstruments(stationId: string = "STATION-BHARATI") {
  return useQuery<ScienceInstrument[], Error>({
    queryKey: ["science-instruments", stationId],
    queryFn: () => fetchScienceInstruments(stationId),
    staleTime: 4_000,
    refetchInterval: 8_000,
  });
}
