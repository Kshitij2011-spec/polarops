import {
  ArrowLeft,
  Layers,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";
import { TruthBadge } from "./TruthBadge";

export interface AssetPlaceholderProps {
  assetId: string;
  onBack: () => void;
}

export function AssetPlaceholder({ assetId, onBack }: AssetPlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Back button navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Back to Station Command Center"
          className="flex items-center gap-2 rounded-lg border border-polar-700 bg-polar-800/80 px-3.5 py-1.5 text-xs font-mono font-medium text-polar-300 hover:text-polar-100 hover:border-polar-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Station Command Center</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-polar-400 font-mono">ASSET ROUTE:</span>
          <span className="rounded bg-polar-800 px-2 py-0.5 text-xs font-mono text-accent-cyan border border-polar-700">
            /assets/{assetId}
          </span>
        </div>
      </div>

      {/* Asset Header Card */}
      <div className="rounded-xl border border-amber-800/80 bg-gradient-to-br from-polar-850 via-polar-800 to-amber-950/20 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-amber-950 px-2 py-0.5 text-xs font-mono font-bold text-amber-300 border border-amber-800">
                CRITICALITY: L1
              </span>
              <span className="rounded bg-polar-800 px-2 py-0.5 text-xs font-mono text-polar-300 border border-polar-700">
                ID: {assetId}
              </span>
              <TruthBadge type="MEASURED" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-polar-100 mt-2">
              Primary Backup Genset G-02
            </h1>
            <p className="text-xs text-polar-400 mt-1">
              Larsemann Hills Powerhouse &middot; Zone 1 &middot; 120 kW Cummins Diesel Generator
            </p>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-sm font-mono font-bold text-amber-300">
                DEGRADED &middot; 62% HEALTH
              </span>
            </div>
            <div className="text-xs text-rose-400 font-mono mt-1">
              High Trip Probability Under Impending Blizzard
            </div>
          </div>
        </div>

        {/* Telemetry Metric Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-polar-700">
          <div className="rounded-lg bg-polar-900/80 p-3 border border-polar-700">
            <div className="flex items-center justify-between text-xs text-polar-400">
              <span>Drive-End Bearing Vibration</span>
              <TruthBadge type="MEASURED" />
            </div>
            <div className="text-xl font-mono font-bold text-rose-400 mt-1">
              4.8 mm/s
            </div>
            <div className="text-[10px] text-polar-500 font-mono mt-0.5">
              Warning: 4.0 mm/s &middot; Trip: 7.0 mm/s
            </div>
          </div>

          <div className="rounded-lg bg-polar-900/80 p-3 border border-polar-700">
            <div className="flex items-center justify-between text-xs text-polar-400">
              <span>Coolant Temperature</span>
              <TruthBadge type="MEASURED" />
            </div>
            <div className="text-xl font-mono font-bold text-amber-400 mt-1">
              94.2°C
            </div>
            <div className="text-[10px] text-polar-500 font-mono mt-0.5">
              Warning: 90.0°C &middot; Trip: 105.0°C
            </div>
          </div>

          <div className="rounded-lg bg-polar-900/80 p-3 border border-polar-700">
            <div className="flex items-center justify-between text-xs text-polar-400">
              <span>Fuel Consumption / Efficiency</span>
              <TruthBadge type="DERIVED" />
            </div>
            <div className="text-xl font-mono font-bold text-accent-cyan mt-1">
              32.4% (31.5 L/h)
            </div>
            <div className="text-[10px] text-polar-500 font-mono mt-0.5">
              Nominal: 38.0% &middot; Inefficient fuel burn
            </div>
          </div>
        </div>
      </div>

      {/* Day 2 Milestone Preview Banner */}
      <div className="rounded-xl border border-polar-600 bg-polar-800/80 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-polar-700">
          <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/40">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-mono text-polar-100">
                DAY 2 MILESTONE: ASSET INTELLIGENCE &amp; DEPENDENCY RISK ENGINE
              </h2>
              <span className="rounded bg-accent-cyan/20 px-2 py-0.5 text-[10px] font-mono text-accent-cyan border border-accent-cyan/40 font-bold">
                NEXT MILESTONE
              </span>
            </div>
            <p className="text-xs text-polar-400 mt-0.5">
              Full diagnostic workspace, multi-sensor timeline analysis, relational BFS dependency mapping, and cascading risk simulation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-lg border border-polar-700/80 bg-polar-900/60 p-4">
            <div className="flex items-center gap-2 text-accent-cyan mb-2">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-mono font-bold">BFS Dependency Graph</span>
            </div>
            <p className="text-xs text-polar-400">
              Downstream blast-radius visualization tracing G-02 to Zone 2 heating loops, desalination, and clean lab power.
            </p>
          </div>

          <div className="rounded-lg border border-polar-700/80 bg-polar-900/60 p-4">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs font-mono font-bold">Explainable Risk Scoring</span>
            </div>
            <p className="text-xs text-polar-400">
              Deterministic degradation equation (vibration + thermal stress + zero spare bearings + 11-day resupply window).
            </p>
          </div>

          <div className="rounded-lg border border-polar-700/80 bg-polar-900/60 p-4">
            <div className="flex items-center gap-2 text-accent-green mb-2">
              <Wrench className="h-4 w-4" />
              <span className="text-xs font-mono font-bold">Prescriptive Maintenance</span>
            </div>
            <p className="text-xs text-polar-400">
              Recommended actions: de-rate load to 65 kW, schedule emergency bearing lubrication before blizzard peak.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-polar-700 flex justify-end">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg bg-polar-700 hover:bg-polar-600 text-polar-100 px-4 py-2 text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Station Command Center</span>
          </button>
        </div>
      </div>
    </div>
  );
}
