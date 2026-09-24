import { useQuery } from "@tanstack/react-query";
import { fetchAssetDetail, type AssetDetail } from "../lib/api";

export function useAssetDetail(assetId: string) {
  return useQuery<AssetDetail, Error>({
    queryKey: ["asset-detail", assetId],
    queryFn: () => fetchAssetDetail(assetId),
    staleTime: 15_000,
  });
}
