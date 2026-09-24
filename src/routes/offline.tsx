import { createFileRoute } from "@tanstack/react-router";
import { OfflinePage } from "@/components/polarops";

export const Route = createFileRoute("/offline")({
  head: () => ({ meta: [
    { title: "Offline Analog — PolarOps" },
    { name: "description", content: "Local-first Antarctic station operations and synchronization demonstration." },
    { property: "og:title", content: "PolarOps Offline Analog" },
    { property: "og:description", content: "Local-first Antarctic station operations and synchronization demonstration." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: OfflinePage,
});