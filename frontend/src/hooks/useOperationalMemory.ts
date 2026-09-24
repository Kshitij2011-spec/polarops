import { useQuery } from "@tanstack/react-query";
import { searchOperationalMemory, type MemorySearchResponse } from "../lib/api";

export function useOperationalMemory(query?: string, stationId: string = "STATION-BHARATI") {
  return useQuery<MemorySearchResponse, Error>({
    queryKey: ["operational-memory", query, stationId],
    queryFn: () => searchOperationalMemory(query, stationId),
    staleTime: 5_000,
  });
}
