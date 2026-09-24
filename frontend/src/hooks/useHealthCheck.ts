import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "../lib/api";
import type { HealthResponse } from "../lib/api";

export function useHealthCheck() {
  return useQuery<HealthResponse, Error>({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 15_000,
    retry: 2,
  });
}
