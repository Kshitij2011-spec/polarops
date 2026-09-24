import { createFileRoute } from "@tanstack/react-router";
import { ContinuityWorkspaceSkeleton } from "@/components/workspaces/ContinuityWorkspaceSkeleton";

export type ContinuitySearch = {
  station?: string;
  tab?: "fuel" | "spares" | "resupply" | "resilience";
  asset?: string;
};

export const Route = createFileRoute("/continuity")({
  validateSearch: (search: Record<string, unknown>): ContinuitySearch => ({
    station: typeof search["station"] === "string" ? search["station"] : "STATION-BHARATI",
    tab:
      search["tab"] === "spares" || search["tab"] === "resupply" || search["tab"] === "resilience"
        ? (search["tab"] as "spares" | "resupply" | "resilience")
        : "fuel",
    asset: typeof search["asset"] === "string" ? search["asset"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Continuity + Logistics — PolarOps" },
      {
        name: "description",
        content:
          "Monitor long-horizon survival resources, fuel autonomy, thermodynamic balance, warehouse spares, and satellite edge resilience.",
      },
      { property: "og:title", content: "PolarOps Continuity + Logistics" },
      {
        property: "og:description",
        content: "Fuel runway countdown, coupled energy model, warehouse critical spares, and maritime resupply tracking.",
      },
    ],
  }),
  component: ContinuityWorkspaceRoute,
});

function ContinuityWorkspaceRoute() {
  const search = Route.useSearch();
  return (
    <ContinuityWorkspaceSkeleton
      initialTab={search.tab}
      highlightAsset={search.asset}
    />
  );
}
