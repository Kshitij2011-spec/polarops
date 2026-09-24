import { useQuery } from "@tanstack/react-query";
import { fetchRecoveryExposure, type AssetRecoveryExposure } from "../lib/api";

export function useRecoveryExposure(assetId: string = "G-02") {
  return useQuery<AssetRecoveryExposure, Error>({
    queryKey: ["recovery-exposure", assetId],
    queryFn: () => fetchRecoveryExposure(assetId),
    staleTime: 30_000,
    retry: 2,
  });
}
