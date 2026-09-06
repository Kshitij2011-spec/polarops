import { useQuery } from "@tanstack/react-query";
import { fetchAssets, type AssetListItem } from "../lib/api";

export function useAssets(stationId: string) {
  return useQuery<AssetListItem[], Error>({
    queryKey: ["station-assets", stationId],
    queryFn: () => fetchAssets(stationId),
    staleTime: 15_000,
  });
}
