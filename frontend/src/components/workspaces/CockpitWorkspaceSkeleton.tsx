import React from "react";
import { DecisionCockpitWorkspace, type DecisionCockpitWorkspaceProps } from "@/features/decision";

/**
 * CockpitWorkspaceSkeleton — Mounted directly by Route "/cockpit".
 * Delegates directly to the fully-implemented DecisionCockpitWorkspace feature.
 */
export function CockpitWorkspaceSkeleton(props: DecisionCockpitWorkspaceProps) {
  return <DecisionCockpitWorkspace {...props} />;
}
