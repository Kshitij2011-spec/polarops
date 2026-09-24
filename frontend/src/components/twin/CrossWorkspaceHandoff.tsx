import React from "react";
import { Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Wrench,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Zap,
} from "lucide-react";

export interface CrossWorkspaceHandoffProps {
  stationId: string;
  assetId: string;
  assetName?: string;
  criticality?: string;
}

export function CrossWorkspaceHandoff({
  stationId,
  assetId,
  assetName,
  criticality,
}: CrossWorkspaceHandoffProps) {
  return (
    <div
      className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5 font-mono text-xs"
      role="region"
      aria-label="Cross-Workspace Context Handoffs"
    >
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span>Cross-Workspace Context Handoff</span>
        <span className="text-sky-400 font-mono">Entity: {assetId}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Handoff to Workspace 2: Operations Cockpit / Counterfactual Trip Simulation */}
        <Link
          to="/cockpit"
          search={{
            station: stationId,
            asset: assetId,
            mode: "sim",
          }}
          className="p-2.5 rounded bg-sky-950/70 hover:bg-sky-900 border border-sky-800/80 text-sky-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
          title={`Simulate counterfactual trip consequence of ${assetId} in Cockpit`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-sky-900 text-sky-300">
              <TrendingUp size={14} />
            </div>
            <div>
              <div className="font-bold text-xs group-hover:text-white">Simulate Trip in Cockpit</div>
              <div className="text-[10px] text-slate-400">Evaluate N-0 load shed consequence</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-sky-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Handoff to Workspace 3: Station Continuity / Spares & Maintenance */}
        <Link
          to="/continuity"
          search={{
            station: stationId,
            asset: assetId,
            tab: "spares",
          }}
          className="p-2.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
          title={`Inspect warehouse inventory and resupply lead-times for ${assetId} in Continuity`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-800 text-amber-400">
              <Wrench size={14} />
            </div>
            <div>
              <div className="font-bold text-xs group-hover:text-white">Inspect Spares in Continuity</div>
              <div className="text-[10px] text-slate-400">Bearing sleeve SK-402 stockout check</div>
            </div>
          </div>
          <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
