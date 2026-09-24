import { createFileRoute } from "@tanstack/react-router";
import { ResourcesPage } from "@/components/polarops";

export const Route = createFileRoute("/resources")({
  validateSearch: (search: Record<string, unknown>): { asset?: string } => ({
    asset: typeof search["asset"] === "string" ? search["asset"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Resources & Recovery — PolarOps" },
      { name: "description", content: "Station operational resources, fuel runway, critical spares, and recovery intelligence." },
      { property: "og:title", content: "PolarOps Resources & Recovery" },
      { property: "og:description", content: "Station operational resources, fuel runway, critical spares, and recovery intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResourcesPage,
});