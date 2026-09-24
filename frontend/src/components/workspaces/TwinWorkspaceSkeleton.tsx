import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Layers,
  Activity,
  Zap,
  Flame,
  ShieldAlert,
  HelpCircle,
  Wrench,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
} from "lucide-react";
import { useStation } from "@/context/StationContext";
import { fetchStationOverview } from "@/lib/api/station";
import { fetchAssets, fetchAssetDetail, fetchAssetRisk } from "@/lib/api/twin";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { TruthBadge } from "@/components/foundation/TruthBadge";

export interface TwinWorkspaceSkeletonProps {
  initialAsset?: string;
  initialView?: "topology" | "schematic" | "matrix";
}

export function TwinWorkspaceSkeleton({
  initialAsset = "G-02",
  initialView = "topology",
}: TwinWorkspaceSkeletonProps) {
  const { activeStationId, openExplanation } = useStation();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAsset);
  const [activeView, setActiveView] = useState<"topology" | "schematic" | "matrix">(initialView);

  // Sync selected asset with prop if prop changes
  useEffect(() => {
    if (initialAsset) setSelectedAssetId(initialAsset);
  }, [initialAsset]);

  // Fetch station overview for headroom indicators
  const { data: stationOverview } = useQuery({
    queryKey: ["station-overview", activeStationId],
    queryFn: () => fetchStationOverview(activeStationId),
  });

  // Fetch station assets
  const { data: assets } = useQuery({
    queryKey: ["assets", activeStationId],
    queryFn: () => fetchAssets(activeStationId),
  });

  // Fetch selected asset detail
  const { data: assetDetail } = useQuery({
    queryKey: ["asset-detail", selectedAssetId],
    queryFn: () => fetchAssetDetail(selectedAssetId),
    enabled: Boolean(selectedAssetId),
  });

  // Fetch selected asset risk
  const { data: assetRisk } = useQuery({
    queryKey: ["asset-risk", selectedAssetId],
    queryFn: () => fetchAssetRisk(selectedAssetId),
    enabled: Boolean(selectedAssetId),
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100">
      {/* Station Situational Headroom Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-sky-400 shrink-0" />
            <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
              Workspace 1: Command + Digital Twin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">STATION POSTURE:</span>
            <StatusBadge status={stationOverview?.status || "NOMINAL"} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400 shrink-0" />
            <span className="text-slate-400">RESERVE MARGIN:</span>
            <span className="font-bold text-slate-100">350 kW (42%)</span>
          </div>

          <div className="flex items-center gap-2">
            <Flame size={14} className="text-red-400 shrink-0" />
            <span className="text-slate-400">THERMAL HOLD:</span>
            <span className="font-bold text-slate-100">14.2 Hours</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-400">FUEL RUNWAY:</span>
            <span className="font-bold text-emerald-400">
              {stationOverview?.fuel_runway_days ?? 184} Days
            </span>
          </div>
        </div>

        {/* View Switcher: DAG vs Schematic vs Matrix */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
          {(
            [
              { id: "topology", label: "Living Topology DAG" },
              { id: "schematic", label: "2D Isometric Station" },
              { id: "matrix", label: "Tabular TreeGrid" },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id)}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                activeView === v.id
                  ? "bg-sky-950 text-sky-300 font-bold border border-sky-800/80"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Split: Canvas (Left) + Inspector (Right, 380px) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left: Canvas Area */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-[#090E17] border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {/* Canvas Sub-header */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Layers size={14} className="text-sky-400" />
              <span>LIVING SYSTEMS TOPOLOGY • DOWNSTREAM BLAST RADIUS</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-500">Nodes: {assets?.length ?? 12}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-bold">Flows Active</span>
            </div>
          </div>

          {/* Living Topology DAG Placeholder / Interactive Mesh */}
          <div className="flex-1 p-6 flex flex-col justify-between relative overflow-hidden">
            {/* Background grid markings */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            {/* Simulated Interactive Topology DAG Nodes */}
            <div className="relative z-10 space-y-4">
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                SELECT A MACHINE NODE TO INSPECT TELEMETRY & MULTI-HOP LINEAGE:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
                {(assets || [
                  { id: "G-01", code: "G-01", name: "Diesel Genset 1", criticality: "HIGH", status: "NOMINAL" },
                  { id: "G-02", code: "G-02", name: "Diesel Genset 2", criticality: "CRITICAL", status: "DEGRADED" },
                  { id: "G-03", code: "G-03", name: "Diesel Genset 3", criticality: "MEDIUM", status: "OFFLINE" },
                  { id: "HVAC-01", code: "HVAC-01", name: "Habitat HVAC", criticality: "CRITICAL", status: "NOMINAL" },
                  { id: "RO-01", code: "RO-01", name: "Water Desal RO", criticality: "HIGH", status: "NOMINAL" },
                  { id: "BAT-01", code: "BAT-01", name: "UPS Battery Bank", criticality: "CRITICAL", status: "NOMINAL" },
                ]).map((asset) => {
                  const isSelected = asset.id === selectedAssetId;
                  const isDegraded = asset.status === "DEGRADED" || asset.id === "G-02";

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`p-3 rounded border text-left font-mono transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-sky-950/80 border-sky-400 ring-2 ring-sky-500/20 shadow-lg shadow-sky-950/50"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-100">{asset.code}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isDegraded ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                          }`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-1">{asset.name}</div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[9px]">
                        <span className="text-slate-500 uppercase">{asset.criticality}</span>
                        <span className={isDegraded ? "text-amber-400 font-bold" : "text-emerald-400"}>
                          {isDegraded ? "ANOMALY" : "NOMINAL"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Energy Conduits Legend */}
            <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
              <span className="font-bold text-slate-300 uppercase">Conduit Legend:</span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-1 bg-amber-400 rounded-sm" /> ELECTRICAL (415V)
              </span>
              <span className="flex items-center gap-1.5 text-red-300">
                <span className="w-2.5 h-1 bg-red-400 rounded-sm" /> THERMAL GLYCOL
              </span>
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-1 bg-amber-600 rounded-sm" /> ARCTIC DIESEL
              </span>
              <span className="flex items-center gap-1.5 text-sky-300">
                <span className="w-2.5 h-1 bg-sky-400 rounded-sm" /> SCADA TELEMETRY
              </span>
            </div>
          </div>
        </div>

        {/* Right: 380px Contextual Asset Inspector */}
        <aside
          className="w-full lg:w-[380px] shrink-0 bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col overflow-y-auto"
          aria-label="Asset Telemetry & Risk Inspector"
        >
          {/* Inspector Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-sky-950 border border-sky-800 text-sky-400">
                <Cpu size={16} />
              </div>
              <div>
                <div className="text-xs font-bold font-mono text-slate-100 flex items-center gap-2">
                  <span>{selectedAssetId}</span>
                  <StatusBadge status={assetDetail?.status || (selectedAssetId === "G-02" ? "DEGRADED" : "NOMINAL")} size="sm" />
                </div>
                <div className="text-[11px] text-slate-400">{assetDetail?.name || "Diesel Generator Set 2"}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openExplanation("ASSET", selectedAssetId)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
              title="Explain abnormal condition"
            >
              <HelpCircle size={14} className="text-sky-400" />
              <span>Explain</span>
            </button>
          </div>

          {/* Inspector Body */}
          <div className="p-4 space-y-5 text-xs font-mono flex-1">
            {/* Telemetry Sparkline & Current Values */}
            <div className="space-y-2 p-3 rounded border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity size={14} className="text-amber-400" />
                  BEARING VIBRATION VELOCITY
                </span>
                <TruthBadge type="MEASURED" />
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {selectedAssetId === "G-02" ? "4.8 mm/s" : "1.2 mm/s"}
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  Warning: 3.5 mm/s<br />
                  Critical: 5.0 mm/s
                </div>
              </div>

              {/* Simulated 50-pt SVG sparkline */}
              <div className="pt-2">
                <svg className="w-full h-12 stroke-amber-400 fill-none" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    d={
                      selectedAssetId === "G-02"
                        ? "M0,25 Q20,24 40,20 T70,12 T100,5"
                        : "M0,20 Q20,22 40,19 T70,21 T100,20"
                    }
                    strokeWidth="2"
                  />
                  {/* Warning Threshold Band */}
                  <line x1="0" y1="12" x2="100" y2="12" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2,2" />
                </svg>
                <div className="flex justify-between text-[9px] text-slate-500 pt-1">
                  <span>-4 Hours</span>
                  <span>Now (Surging)</span>
                </div>
              </div>
            </div>

            {/* 6-Factor Risk Drivers Ladder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">6-FACTOR RISK LADDER</span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {assetRisk?.level || (selectedAssetId === "G-02" ? "HIGH (76/100)" : "LOW (14/100)")}
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  { factor: "Bearing Mechanical Degradation", score: "32/40", sev: "CRITICAL" },
                  { factor: "Thermal Overheat Risk", score: "22/25", sev: "HIGH" },
                  { factor: "Weather Amplification (Blizzard)", score: "14/20", sev: "MEDIUM" },
                  { factor: "Spare Parts Availability", score: "8/15", sev: "HIGH" },
                ].map((rf, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate max-w-[200px]">{rf.factor}</span>
                    <span className="text-amber-300 font-bold">{rf.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-Workspace Operational Handoffs */}
            <div className="pt-2 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Cross-Workspace Workflows:
              </div>

              {/* Link to Workspace 2: Simulate Counterfactual Trip */}
              <Link
                to="/cockpit"
                search={{
                  station: activeStationId,
                  asset: selectedAssetId,
                  mode: "sim",
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 text-sky-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-sky-400" />
                  <span className="font-bold">Simulate Trip Consequence</span>
                </div>
                <ArrowRight size={14} />
              </Link>

              {/* Link to Workspace 3: Check Warehouse Spares */}
              <Link
                to="/continuity"
                search={{
                  station: activeStationId,
                  asset: selectedAssetId,
                  tab: "spares",
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-slate-400" />
                  <span className="font-bold">Inspect Spares (SK-402)</span>
                </div>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
