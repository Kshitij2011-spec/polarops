import { useQuery } from "@tanstack/react-query";
import { fetchInventory, type InventorySpareItem } from "../lib/api";

export function useInventory(stationId: string = "STATION-BHARATI") {
  return useQuery<InventorySpareItem[], Error>({
    queryKey: ["warehouse-inventory", stationId],
    queryFn: () => fetchInventory(stationId),
    staleTime: 30_000,
    retry: 2,
  });
}
