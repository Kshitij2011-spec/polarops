import { createFileRoute } from "@tanstack/react-router";
import { TwinWorkspaceSkeleton } from "@/components/workspaces/TwinWorkspaceSkeleton";

export type TwinSearch = {
  station?: string;
  asset?: string;
  view?: "topology" | "schematic" | "matrix";
};

export const Route = createFileRoute("/twin")({
  validateSearch: (search: Record<string, unknown>): TwinSearch => ({
    station: typeof search["station"] === "string" ? search["station"] : "STATION-BHARATI",
    asset: typeof search["asset"] === "string" ? search["asset"] : "G-02",
    view:
      search["view"] === "schematic" || search["view"] === "matrix"
        ? (search["view"] as "schematic" | "matrix")
        : "topology",
  }),
  head: () => ({
    meta: [
      { title: "Command + Digital Twin — PolarOps" },
      {
        name: "description",
        content:
          "Monitor station situational headroom, live telemetry, and topological blast radius across Antarctic engineering subsystems.",
      },
      { property: "og:title", content: "PolarOps Command + Digital Twin" },
      {
        property: "og:description",
        content: "Antarctic station operational posture, sensor telemetry, and living topology DAG.",
      },
    ],
  }),
  component: TwinWorkspaceRoute,
});

function TwinWorkspaceRoute() {
  const search = Route.useSearch();
  return (
    <TwinWorkspaceSkeleton
      initialAsset={search.asset}
      initialView={search.view}
    />
  );
}
