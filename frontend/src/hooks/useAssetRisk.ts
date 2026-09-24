import { useQuery } from "@tanstack/react-query";
import { fetchAssetRisk, type AssetRisk } from "../lib/api";

export function useAssetRisk(assetId: string) {
  return useQuery<AssetRisk, Error>({
    queryKey: ["asset-risk", assetId],
    queryFn: () => fetchAssetRisk(assetId),
    staleTime: 15_000,
  });
}
