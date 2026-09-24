import { useQuery } from "@tanstack/react-query";
import { fetchAssetDependencies, type AssetDependencies } from "../lib/api";

export function useAssetDependencies(assetId: string, maxDepth: number = 5) {
  return useQuery<AssetDependencies, Error>({
    queryKey: ["asset-dependencies", assetId, maxDepth],
    queryFn: () => fetchAssetDependencies(assetId, maxDepth),
    staleTime: 30_000,
  });
}
