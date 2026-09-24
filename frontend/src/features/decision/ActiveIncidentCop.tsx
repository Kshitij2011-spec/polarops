import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldAlert,
  Sliders,
  Send,
  User,
  ArrowRight,
  Flame,
  FileText,
  Activity,
  Box,
} from "lucide-react";
import type { IncidentDetail, IncidentListItem } from "@/lib/api/incidents";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { IncidentTimeline } from "./IncidentTimeline";

interface ActiveIncidentCopProps {
  incidents: IncidentListItem[];
  activeIncident: IncidentDetail;
  onSelectIncident: (id: string) => void;
  onLogAction: (actionCode: string, description: string, executedBy: string) => Promise<void> | void;
  onSwitchToScenario: (targetAssetId?: string) => void;
  isLoggingAction?: boolean;
}

export function ActiveIncidentCop({
  incidents,
  activeIncident,
  onSelectIncident,
  onLogAction,
  onSwitchToScenario,
  isLoggingAction = false,
}: ActiveIncidentCopProps) {
  const [quickActionCode, setQuickActionCode] = useState("DISPATCH_G01_PRIORITY");
  const [actionDescription, setActionDescription] = useState("");
  const [executedBy, setExecutedBy] = useState("Station Commander");

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDescription.trim()) return;
    await onLogAction(quickActionCode, actionDescription.trim(), executedBy);
    setActionDescription("");
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "MAJOR":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Incident Context Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400">
              <AlertOctagon size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-slate-100">
                  {activeIncident.id}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadgeClass(activeIncident.severity)}`}>
                  {activeIncident.severity} SEVERITY
                </span>
                <StatusBadge status={activeIncident.status} />
                <TruthBadge type="MEASURED" source="incident:active_cop" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">{activeIncident.title}</h2>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                <span>Location: {activeIncident.location || "Station Powerhouse"}</span>
                <span>•</span>
                <span>Started: {new Date(activeIncident.started_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Incident Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Switch Incident:</span>
            <select
              value={activeIncident.id}
              onChange={(e) => onSelectIncident(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.id} — {inc.title} ({inc.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Causal Narrative & Core Constraint */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-3.5 rounded bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Observed Situation & Causal Mechanism
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeIncident.description}
            </p>
          </div>

          <div className="p-3.5 rounded bg-red-950/30 border border-red-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold block mb-1">
                Composite Modeled Risk
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-extrabold text-red-400">
                  {activeIncident.modeled_risk_score}
                </span>
                <span className="font-mono text-xs text-red-300/80">/ 100 CRITICAL</span>
              </div>
              <span className="text-[11px] text-slate-300 mt-1 block">
                N-0 electrical redundancy; habitat heating decaying under cold gradient.
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSwitchToScenario("G-02")}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition-colors"
            >
              <Sliders size={14} />
              <span>Simulate What-If Countermeasures</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Downstream Blast Radius & Degrading Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Affected Assets */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Box size={16} className="text-cyan-400" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Directly Affected Physical Equipment ({activeIncident.affected_assets.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Multi-Hop Topological Cascade</span>
          </div>

          <div className="space-y-2">
            {activeIncident.affected_assets.map((asset) => (
              <div
                key={asset.asset_id}
                className="p-3 rounded bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {asset.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">({asset.asset_id})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span>Criticality: {asset.criticality}</span>
                    <span>•</span>
                    <span>Hop Distance: {asset.distance}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-red-400">
                    Impact Factor: {asset.impact_factor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Services */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-amber-400" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Degrading Life-Support & Science Services ({activeIncident.affected_services.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Station Survivability Blast</span>
          </div>

          <div className="space-y-2">
            {activeIncident.affected_services.map((srv) => (
              <div
                key={srv.service_id}
                className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">{srv.name}</span>
                  <StatusBadge status={srv.status} />
                </div>
                <p className="text-[11px] text-slate-400 font-sans">{srv.rationale}</p>
                <span className="text-[10px] font-mono text-slate-500 block">
                  Criticality: {srv.criticality}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Chronological Sequence Timeline */}
      <IncidentTimeline incident={activeIncident} />

      {/* 4. Action Ledger & Human Action Dispatcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
          <FileText size={18} className="text-cyan-400" />
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Human Action Execution Ledger & Dispatch
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every authorized operational or maintenance command is cryptographically stamped and committed to the station ledger.
            </p>
          </div>
        </div>

        {/* Action dispatch form */}
        <form onSubmit={handleActionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Action Protocol Code:
              </label>
              <select
                value={quickActionCode}
                onChange={(e) => setQuickActionCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                {activeIncident.available_response_options.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} — {opt.title}
                  </option>
                ))}
                <option value="CUSTOM_PHYSICAL_MAINTENANCE">CUSTOM_PHYSICAL_MAINTENANCE</option>
                <option value="DECLARE_STATION_EMERGENCY">DECLARE_STATION_EMERGENCY</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Executed / Authorized By:
              </label>
              <input
                type="text"
                value={executedBy}
                onChange={(e) => setExecutedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
                placeholder="Station Commander"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Operational Action Summary:
              </label>
              <input
                type="text"
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Technician dispatched to inspect bearing lubrication filter..."
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-mono text-slate-400">
              Actions committed here buffer to P0 Priority Queue if offline.
            </span>
            <button
              type="submit"
              disabled={isLoggingAction || !actionDescription.trim()}
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              <span>{isLoggingAction ? "Logging Action..." : "Commit Action to Ledger"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
