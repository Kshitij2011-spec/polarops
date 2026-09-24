import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  Activity,
  Zap,
  Flame,
  Fuel,
  ShieldAlert,
  HelpCircle,
  Wrench,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Building2,
  Table,
  Eye,
  AlertTriangle,
  Wind,
} from "lucide-react";
import { useStation } from "@/context/StationContext";
import { fetchStationOverview } from "@/lib/api/station";
import {
  fetchAssets,
  fetchAssetDependencies,
  fetchAssetDetail,
  fetchAssetRisk,
} from "@/lib/api/twin";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { TopologyCanvas } from "@/components/topology/TopologyCanvas";
import { TopologyTreeGrid } from "@/components/topology/TopologyTreeGrid";
import { AssetInspector } from "@/components/twin/AssetInspector";
import { StationSpatialSchematic } from "@/components/twin/StationSpatialSchematic";

export interface TwinWorkspaceProps {
  initialAsset?: string;
  initialView?: "topology" | "schematic" | "matrix";
}

export function TwinWorkspace({
  initialAsset = "G-02",
  initialView = "topology",
}: TwinWorkspaceProps) {
  const { activeStationId, openExplanation } = useStation();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAsset);
  const [activeView, setActiveView] = useState<"topology" | "schematic" | "matrix">(initialView);

  // Sync state if initialAsset prop changes
  useEffect(() => {
    if (initialAsset) setSelectedAssetId(initialAsset);
  }, [initialAsset]);

  // Sync state if initialView prop changes
  useEffect(() => {
    if (initialView) setActiveView(initialView);
  }, [initialView]);

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

  // Fetch selected asset dependencies
  const { data: dependencies, isLoading: depsLoading } = useQuery({
    queryKey: ["asset-dependencies", selectedAssetId],
    queryFn: () => fetchAssetDependencies(selectedAssetId, 5),
    enabled: Boolean(selectedAssetId),
  });

  return (
    <div
      className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100 font-mono select-none"
      role="region"
      aria-label="Command & Digital Twin Workspace"
    >
      {/* 1. Station Situational Headroom Bar */}
      <div
        role="toolbar"
        className="bg-slate-950/95 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0"
        aria-label="Station Operational Headroom Bar"
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-sky-400 shrink-0" />
            <span className="font-bold tracking-wider text-slate-200 uppercase text-xs">
              Command + Digital Twin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">POSTURE:</span>
            <StatusBadge status={stationOverview?.status || "NOMINAL"} size="sm" />
          </div>

          {/* Reserve Margin */}
          <div className="flex items-center gap-1.5" title="Electrical Generation Reserve Margin">
            <Zap size={14} className="text-amber-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">RESERVE MARGIN:</span>
            <span className="font-bold text-slate-100">350 kW (42%)</span>
          </div>

          {/* Thermal Hold Time */}
          <div className="flex items-center gap-1.5" title="Thermal Hold Time before interior freezing">
            <Flame size={14} className="text-red-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">THERMAL HOLD:</span>
            <span className="font-bold text-slate-100">14.2 Hours</span>
          </div>

          {/* Fuel Runway */}
          <div className="hidden md:flex items-center gap-1.5" title="Arctic Diesel Fuel Runway">
            <Fuel size={14} className="text-emerald-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">FUEL RUNWAY:</span>
            <span className="font-bold text-emerald-400">
              {stationOverview?.fuel_runway_days ?? 184} Days
            </span>
          </div>

          {/* Weather Exposure */}
          <div className="hidden lg:flex items-center gap-1.5 text-sky-300 text-[11px]" title="Blizzard Gale Warning">
            <Wind size={13} className="text-sky-400" />
            <span>-38°C • 48 kts</span>
          </div>
        </div>

        {/* View Switcher: Living DAG vs 2D Isometric Schematic vs Tabular TreeGrid */}
        <div
          className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800"
          role="tablist"
          aria-label="Digital Twin View Modes"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "topology"}
            onClick={() => setActiveView("topology")}
            className={`min-h-[32px] px-3 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeView === "topology"
                ? "bg-sky-950 text-sky-300 font-bold border border-sky-800/80"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={13} />
            <span>Living Topology DAG</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === "schematic"}
            onClick={() => setActiveView("schematic")}
            className={`min-h-[32px] px-3 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeView === "schematic"
                ? "bg-sky-950 text-sky-300 font-bold border border-sky-800/80"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 size={13} />
            <span>2D Station Schematic</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === "matrix"}
            onClick={() => setActiveView("matrix")}
            className={`min-h-[32px] px-3 py-1 text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeView === "matrix"
                ? "bg-sky-950 text-sky-300 font-bold border border-sky-800/80"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Table size={13} />
            <span>Accessible TreeGrid</span>
          </button>
        </div>
      </div>

      {/* 2. Situational Active Anomaly Callout Banner */}
      <div
        className="bg-amber-950/40 border-b border-amber-900/60 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={15} className="text-amber-400 shrink-0 animate-pulse" />
          <span className="text-slate-300">
            <strong className="text-amber-300">ACTIVE ANOMALY:</strong> Machine{" "}
            <span className="font-bold text-slate-100">G-02 (Diesel Genset 2)</span> bearing vibration
            at <span className="text-amber-400 font-bold">4.8 mm/s</span> (Warning threshold 3.5 mm/s crossed).
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedAssetId("G-02")}
            className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/80 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Focus G-02 Anomaly</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* 3. Main Split View: Viewport Area (Left) + Contextual Inspector (Right) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Viewport */}
        <section
          className="flex-1 flex flex-col min-h-0 relative border-b lg:border-b-0 lg:border-r border-slate-800"
          aria-label="Active Digital Twin Visualizer"
        >
          {activeView === "topology" && (
            <TopologyCanvas
              dependencies={dependencies}
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={setSelectedAssetId}
              onSwitchToTable={() => setActiveView("matrix")}
            />
          )}

          {activeView === "schematic" && (
            <StationSpatialSchematic
              stationId={activeStationId}
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={setSelectedAssetId}
            />
          )}

          {activeView === "matrix" && (
            <TopologyTreeGrid
              dependencies={dependencies}
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={setSelectedAssetId}
              onSwitchToCanvas={() => setActiveView("topology")}
            />
          )}
        </section>

        {/* Right Inspector Drawer / Panel */}
        <AssetInspector
          assetId={selectedAssetId}
          stationId={activeStationId}
          onOpenExplanation={openExplanation}
          onSelectRelatedAsset={setSelectedAssetId}
        />
      </div>
    </div>
  );
}
