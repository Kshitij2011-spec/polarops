import React from "react";
import { ContinuityWorkspace, type ContinuityWorkspaceProps } from "@/features/continuity";

/**
 * ContinuityWorkspaceSkeleton — Mounted directly by Route "/continuity".
 * Delegates directly to the fully-implemented ContinuityWorkspace feature.
 */
export function ContinuityWorkspaceSkeleton(props: ContinuityWorkspaceProps) {
  return <ContinuityWorkspace {...props} />;
}
