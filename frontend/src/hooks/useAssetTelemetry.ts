import { useQuery } from "@tanstack/react-query";
import { fetchAssetTelemetry, type AssetTelemetry } from "../lib/api";

export function useAssetTelemetry(assetId: string, limit: number = 25) {
  return useQuery<AssetTelemetry, Error>({
    queryKey: ["asset-telemetry", assetId, limit],
    queryFn: () => fetchAssetTelemetry(assetId, limit),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
