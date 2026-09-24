import { createFileRoute } from "@tanstack/react-router";
import { CockpitWorkspaceSkeleton } from "@/components/workspaces/CockpitWorkspaceSkeleton";

export type CockpitSearch = {
  station?: string;
  incident?: string;
  mode?: "active" | "sim" | "memory";
  asset?: string;
};

export const Route = createFileRoute("/cockpit")({
  validateSearch: (search: Record<string, unknown>): CockpitSearch => ({
    station: typeof search["station"] === "string" ? search["station"] : "STATION-BHARATI",
    incident: typeof search["incident"] === "string" ? search["incident"] : "INC-2026-003",
    mode:
      search["mode"] === "sim" || search["mode"] === "memory"
        ? (search["mode"] as "sim" | "memory")
        : "active",
    asset: typeof search["asset"] === "string" ? search["asset"] : "G-02",
  }),
  head: () => ({
    meta: [
      { title: "Incident + Decision Cockpit — PolarOps" },
      {
        name: "description",
        content:
          "Investigate active station crises, stress-test counterfactual failure scenarios, and authorize mitigation decisions.",
      },
      { property: "og:title", content: "PolarOps Incident + Decision Cockpit" },
      {
        property: "og:description",
        content: "Common operating picture, what-if counterfactual simulation, and immutable action ledger.",
      },
    ],
  }),
  component: CockpitWorkspaceRoute,
});

function CockpitWorkspaceRoute() {
  const search = Route.useSearch();
  return (
    <CockpitWorkspaceSkeleton
      initialIncident={search.incident}
      initialMode={search.mode}
      targetAsset={search.asset}
    />
  );
}
