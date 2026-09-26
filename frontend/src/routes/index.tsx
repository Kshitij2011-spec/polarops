import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PolarOps — Antarctic Operational Digital Twin" },
      {
        name: "description",
        content: "Understand station conditions, trace operational dependencies, and support resilient decisions under Antarctic constraints.",
      },
      { property: "og:title", content: "PolarOps — Antarctic Operational Digital Twin" },
      {
        property: "og:description",
        content: "Operational decision-support platform for Antarctic research stations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});