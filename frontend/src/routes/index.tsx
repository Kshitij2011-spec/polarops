import { createFileRoute } from "@tanstack/react-router";
import { MissionGateway } from "@/components/workspaces/MissionGateway";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PolarOps — Mission Gateway & Station Selector" },
      {
        name: "description",
        content: "Mission authentication and station selection for Antarctic operations.",
      },
      { property: "og:title", content: "PolarOps — Antarctic Operational Digital Twin" },
      {
        property: "og:description",
        content: "Operational intelligence and resilient decision support for Antarctic missions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionGateway,
});