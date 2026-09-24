import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/polarops";

export const Route = createFileRoute("/command-center")({
  head: () => ({ meta: [
    { title: "Command Center — PolarOps" },
    { name: "description", content: "Bharati station operational command center." },
    { property: "og:title", content: "PolarOps Command Center" },
    { property: "og:description", content: "Bharati station operational command center." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: OverviewPage,
});