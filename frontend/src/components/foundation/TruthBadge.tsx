import React from "react";
import type { TruthType } from "@/lib/api/client";

export interface TruthBadgeProps {
  type: TruthType | string;
  source?: string;
  confidence?: number;
  className?: string;
  showIcon?: boolean;
}

/**
 * Authoritative TruthBadge (Provenance Semantics)
 * Adheres strictly to Polaris Industrial 2.0 Design System Specification (Section 4).
 * 
 * Ensures data honesty by visually distinguishing measured sensor data from
 * mathematical derivations, weather forecasts, and counterfactual simulations.
 */
export function TruthBadge({
  type,
  source,
  confidence,
  className = "",
  showIcon = true,
}: TruthBadgeProps) {
  const normalizedType = (type || "MEASURED").toUpperCase();

  // Exact styles per FINAL_DESIGN_SYSTEM_SPEC.md Section 4
  const getBadgeStyle = () => {
    switch (normalizedType) {
      case "MEASURED":
        return {
          container: "bg-emerald-950/90 text-emerald-400 border-emerald-800/80 shadow-xs",
          label: "MEASURED",
          tooltip: source ? `Direct physical telemetry transducer: ${source}` : "Direct physical transducer telemetry",
          dot: "bg-emerald-400",
        };
      case "DERIVED":
        return {
          container: "bg-slate-900/95 text-slate-300 border-slate-700/80 shadow-xs",
          label: "DERIVED",
          tooltip: "Deterministic calculation from verified physical equations",
          dot: "bg-slate-400",
        };
      case "FORECAST":
        return {
          container: "bg-sky-950/90 text-sky-300 border-dashed border-sky-700/90 shadow-xs",
          label: "FORECAST",
          tooltip: "Statistical meteorological projection model",
          dot: "bg-sky-400",
        };
      case "SCENARIO":
      case "SIMULATED":
        return {
          container: "bg-amber-950/90 text-amber-300 border-amber-600/90 ring-1 ring-amber-500/20 font-mono tracking-widest",
          label: "SCENARIO",
          tooltip: "Hypothetical counterfactual simulation — zero physical reality",
          dot: "bg-amber-400 animate-pulse",
        };
      case "ESTIMATED":
        return {
          container: "bg-slate-900/95 text-slate-400 border-dotted border-slate-600 shadow-xs",
          label: "ESTIMATED",
          tooltip: "Projection based on external logistics / voyage schedules",
          dot: "bg-slate-400",
        };
      case "OVERRIDDEN":
        return {
          container: "bg-purple-950/90 text-purple-300 border-purple-700/90 shadow-xs",
          label: "OVERRIDDEN",
          tooltip: "Manual operator override bypassing faulty transducer",
          dot: "bg-purple-400",
        };
      default:
        return {
          container: "bg-slate-900 text-slate-400 border-slate-700",
          label: normalizedType,
          tooltip: `Truth type: ${normalizedType}`,
          dot: "bg-slate-500",
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-wider font-semibold border ${style.container} ${className}`}
      title={`${style.tooltip}${confidence !== undefined ? ` (Confidence: ${Math.round(confidence * 100)}%)` : ""}`}
      role="note"
      aria-label={`Data provenance: ${style.label}`}
    >
      {showIcon && <span className={`inline-block w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />}
      <span>{style.label}</span>
      {confidence !== undefined && (
        <span className="opacity-75 text-[9px] font-normal">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
}
