import { createFileRoute } from "@tanstack/react-router";
import { DigitalTwinPage } from "@/components/polarops";

export const Route = createFileRoute("/digital-twin")({
  validateSearch: (search: Record<string, unknown>): { asset?: string } => ({
    asset: typeof search["asset"] === "string" ? search["asset"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Digital Twin — PolarOps" },
      { name: "description", content: "Interactive Bharati station operational topology." },
      { property: "og:title", content: "PolarOps Digital Twin" },
      { property: "og:description", content: "Interactive Bharati station operational topology." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DigitalTwinPage,
});