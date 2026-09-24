import React, { useState, useEffect } from "react";
import { useStation } from "@/context/StationContext";
import {
  Flame,
  Wrench,
  Ship,
  Radio,
  Microscope,
  ShieldCheck,
  TrendingDown,
  Layers,
} from "lucide-react";
import { FuelEnergyRunwayCard } from "./FuelEnergyRunwayCard";
import { ResourceRecoveryChain } from "./ResourceRecoveryChain";
import { MaritimeResupplyCard } from "./MaritimeResupplyCard";
import { ResilienceQueueInspector } from "./ResilienceQueueInspector";
import { ScienceContinuityCard } from "./ScienceContinuityCard";

export type ContinuityTab = "fuel" | "spares" | "resupply" | "resilience" | "science";

export interface ContinuityWorkspaceProps {
  initialTab?: "fuel" | "spares" | "resupply" | "resilience";
  highlightAsset?: string;
}

export function ContinuityWorkspace({
  initialTab = "fuel",
  highlightAsset,
}: ContinuityWorkspaceProps) {
  const { activeStationId } = useStation();

  const [activeTab, setActiveTab] = useState<ContinuityTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100">
      {/* Continuity Top Sub-Header Bar */}
      <div className="bg-slate-950/95 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Layers size={18} className="text-cyan-400 shrink-0" />
          <div>
            <h1 className="font-mono text-xs font-bold tracking-wider text-slate-100 uppercase">
              Continuity + Logistics Workspace
            </h1>
            <span className="text-[10px] font-mono text-slate-400">
              Station: {activeStationId} • Long-Horizon Operational Survival Spine
            </span>
          </div>
        </div>

        {/* 5-Tab Segmented Control (Ruggedized 44px+ touch targets) */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("fuel")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-2 transition-all ${
              activeTab === "fuel"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame size={15} />
            <span>Fuel & Energy Runway</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("spares")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-2 transition-all ${
              activeTab === "spares"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench size={15} />
            <span>Recovery & Spares</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resupply")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-2 transition-all ${
              activeTab === "resupply"
                ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Ship size={15} />
            <span>Maritime Resupply</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resilience")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-2 transition-all ${
              activeTab === "resilience"
                ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio size={15} />
            <span>Edge Resilience & Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("science")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-2 transition-all ${
              activeTab === "science"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Microscope size={15} />
            <span>Science Continuity</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {activeTab === "fuel" && <FuelEnergyRunwayCard stationId={activeStationId} />}

        {activeTab === "spares" && (
          <ResourceRecoveryChain
            stationId={activeStationId}
            initialAssetId={highlightAsset || "G-02"}
          />
        )}

        {activeTab === "resupply" && <MaritimeResupplyCard stationId={activeStationId} />}

        {activeTab === "resilience" && <ResilienceQueueInspector stationId={activeStationId} />}

        {activeTab === "science" && <ScienceContinuityCard stationId={activeStationId} />}
      </div>
    </div>
  );
}
