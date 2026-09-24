import React from "react";
import { TwinWorkspace, type TwinWorkspaceProps } from "@/features/twin/TwinWorkspace";

export interface TwinWorkspaceSkeletonProps extends TwinWorkspaceProps {}

/**
 * TwinWorkspaceSkeleton is the workspace bridge component mounted by the /twin route.
 * Renders the reimagined Command + Digital Twin experience (Owner: Dhruv).
 */
export function TwinWorkspaceSkeleton({
  initialAsset = "G-02",
  initialView = "topology",
}: TwinWorkspaceSkeletonProps) {
  return <TwinWorkspace initialAsset={initialAsset} initialView={initialView} />;
}
