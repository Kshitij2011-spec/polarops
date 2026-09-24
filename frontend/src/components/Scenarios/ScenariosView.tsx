import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Package,
  Play,
  ShieldAlert,
  Thermometer,
  Zap,
} from "lucide-react";
import { useScenarioSimulation } from "../../hooks/useScenarioSimulation";
import type { ScenarioSimulateResponse } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface ScenariosViewProps {
  stationId: string;
  onBack: () => void;
  onInspectAsset?: (assetId: string) => void;
  onOpenExplanation?: (domain: string, entityId: string) => void;
}

export function ScenariosView({ stationId, onBack, onOpenExplanation }: ScenariosViewProps) {
  const [scenarioType, setScenarioType] = useState<string>("GENERATOR_FAILURE");
  const [targetAssetId, setTargetAssetId] = useState<string>("G-02");
  const [durationHours, setDurationHours] = useState<number>(72.0);
  const [tempOverride, setTempOverride] = useState<number>(-28.5);
  const [result, setResult] = useState<ScenarioSimulateResponse | null>(null);

  const simulationMutation = useScenarioSimulation();

  const handleRunSimulation = () => {
    simulationMutation.mutate(
      {
        station_id: stationId,
        scenario_type: scenarioType,
        target_asset_id: targetAssetId,
        duration_hours: durationHours,
        ambient_temp_celsius: tempOverride,
      },
      {
        onSuccess: (data) => {
          setResult(data);
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 transition-colors">
      {/* ── Top Navigation & Route Bar ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          aria-label="Return to Station Command Center"
          className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] px-3 py-1.5 text-xs font-mono font-medium text-slate-700 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:border-slate-300 dark:hover:border-[#3d4556] transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Station Command Center</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 dark:text-[#7a8194]">ROUTE:</span>
          <span className="rounded-md bg-white dark:bg-[#181b24] px-2 py-0.5 text-blue-600 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#2a2f3e] shadow-2xs">
            /scenarios
          </span>
          <TruthBadge type="SCENARIO" />
        </div>
      </div>

      {/* ── Scenario Configurator Header ───────────────── */}
      <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-50 dark:bg-[#12141c] px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-[#5b9cf5] border border-blue-200 dark:border-[#2a2f3e] tracking-wider">
                WHAT-IF CONSEQUENCE SIMULATOR
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">{stationId}</span>
            </div>
            <h1 className="text-xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0] mt-1">
              Cross-Domain Scenario Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#7a8194] font-sans">
              Stateless in-memory consequence modeling: simulates generation dispatch, dependency blast radius, fuel runway, and risk escalation.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-md p-2.5 shadow-2xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Stateless Simulator: Current database state is completely preserved.</span>
          </div>
        </div>

        {/* ── Interactive Input Form ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-[#2a2f3e]">
          {/* 1. Scenario Type */}
          <div className="space-y-1.5">
            <label htmlFor="scenario-type-select" className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider block">
              <span className="font-bold text-slate-700 dark:text-[#c4cad7] block">Which disruption?</span>
              <span>SCENARIO TYPE</span>
            </label>
            <select
              id="scenario-type-select"
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#0c0e14] px-3 py-2 text-xs font-mono text-slate-800 dark:text-[#e4e8f0] focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="GENERATOR_FAILURE">Generator Failure (Asset Offline)</option>
            </select>
          </div>

          {/* 2. Target Asset */}
          <div className="space-y-1.5">
            <label htmlFor="target-asset-select" className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider block">
              <span className="font-bold text-slate-700 dark:text-[#c4cad7] block">Which equipment is unavailable?</span>
              <span>TARGET ASSET</span>
            </label>
            <select
              id="target-asset-select"
              value={targetAssetId}
              onChange={(e) => setTargetAssetId(e.target.value)}
              className="w-full rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#0c0e14] px-3 py-2 text-xs font-mono text-slate-800 dark:text-[#e4e8f0] focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="G-02">Generator G-02 (Hero Anomaly)</option>
              <option value="G-01">Generator G-01 (Primary Genset)</option>
            </select>
          </div>

          {/* 3. Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider block">
              <span className="font-bold text-slate-700 dark:text-[#c4cad7] block">How long is it unavailable?</span>
              <span>FAILURE DURATION</span>
            </label>
            <div className="flex gap-2">
              {[24.0, 48.0, 72.0].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationHours(d)}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-md border transition-colors cursor-pointer shadow-2xs ${
                    durationHours === d
                      ? "bg-blue-50 dark:bg-[#1e2230] border-blue-500 dark:border-[#5b9cf5] text-blue-700 dark:text-[#5b9cf5]"
                      : "bg-slate-50 dark:bg-[#0c0e14] border-slate-200 dark:border-[#2a2f3e] text-slate-600 dark:text-[#7a8194] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
                  }`}
                >
                  {d}h
                </button>
              ))}
            </div>
          </div>

          {/* 4. Action Button */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleRunSimulation}
              disabled={simulationMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#5b9cf5] dark:text-[#0f1117] dark:hover:bg-[#7ab4ff] px-4 py-2 text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {simulationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Computing Models...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ambient Temperature Adjustment Slider */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono border-t border-slate-100 dark:border-[#2a2f3e]/60">
          <div className="flex items-center gap-2 text-slate-500 dark:text-[#7a8194]">
            <Thermometer className="h-4 w-4 text-sky-600 dark:text-cyan-400" />
            <span className="font-bold text-slate-700 dark:text-[#c4cad7]">How cold is the station?</span>
            <span>(Simulated Ambient Cold Snap):</span>
            <span className="font-bold text-slate-900 dark:text-[#e4e8f0]">{tempOverride}°C</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-50"
              max="-15"
              step="0.5"
              value={tempOverride}
              onChange={(e) => setTempOverride(parseFloat(e.target.value))}
              className="w-48 accent-blue-600 dark:accent-[#5b9cf5] cursor-pointer"
            />
            <button
              onClick={() => setTempOverride(-28.5)}
              className="text-[11px] text-slate-500 dark:text-[#7a8194] hover:text-slate-800 dark:hover:text-[#e4e8f0] underline cursor-pointer"
            >
              Reset to Baseline (-28.5°C)
            </button>
          </div>
        </div>
      </div>

      {/* ── SIMULATION RESULTS ──────────────────────────── */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Summary Banner */}
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-[#181b24] text-blue-700 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#2a2f3e]">
                  {result.scenario_id}
                </span>
                <span className="text-xs font-mono text-slate-800 dark:text-[#e4e8f0] font-semibold">
                  {result.target_asset_name} ({result.target_asset_id}) OFFLINE FOR {result.duration_hours}H
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onOpenExplanation && (
                  <button
                    data-testid="explain-scenario-btn"
                    onClick={() => onOpenExplanation("SCENARIO", result.scenario_id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#5b9cf5] hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer shadow-2xs"
                    title="Open deterministic scenario operational explanation drawer"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
                    <span>WHY? Explain Disruption</span>
                  </button>
                )}
                <TruthBadge type="SCENARIO" />
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-mono">
              {result.scenario_summary}
            </p>
          </div>

          {/* ── HUMAN OPERATIONAL COMPARISON: CURRENT STATE vs IF THIS HAPPENS ── */}
          <div className="rounded-xl border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/80 dark:bg-[#151924] p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#222838]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-[#f0f3fa]">
                  OPERATIONAL IMPACT SUMMARY &middot; CURRENT BASELINE vs. IF THIS OUTAGE OCCURS
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
                {result.duration_hours}h Duration Projection
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#8b92a5] uppercase font-bold">Generation Available</div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0] flex items-center gap-1.5">
                  <span>600 kW</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-rose-600 dark:text-rose-400 font-black">300 kW</span>
                </div>
                <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold">-300 kW (-50% Capacity Drop)</div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#8b92a5] uppercase font-bold">Operating Margin</div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0] flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">Healthy</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black">Constrained</span>
                </div>
                <div
                  className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium"
                  title="N-0: No backup generator available (Single point of failure)"
                >
                  N-0 &middot; No backup generator available
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#8b92a5] uppercase font-bold">Zone 2 Heating</div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0] flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">Normal</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-rose-600 dark:text-rose-400 font-black">At Risk</span>
                </div>
                <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400">Thermal buffer: 4.2 hours</div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#8b92a5] uppercase font-bold">Operational Risk</div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0] flex items-center gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400">87/100</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="text-rose-600 dark:text-rose-400 font-black">96/100</span>
                </div>
                <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold">+9 pts Critical Escalation</div>
              </div>
            </div>
          </div>

          {/* ── BASELINE VS SCENARIO COMPARISON MATRIX ──── */}
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                Baseline vs. Simulated Scenario Impact Deltas
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-[#7a8194]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-cyan-400"></span> Baseline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400"></span> Scenario
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {result.deltas.map((delta, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3.5 space-y-2 flex flex-col justify-between shadow-2xs"
                >
                  <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider truncate">
                    {delta.name}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-400 dark:text-[#6b7280]">
                        {delta.baseline_value} {delta.unit}
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                        {delta.scenario_value} {delta.unit}
                      </div>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        delta.impact_direction === "NEGATIVE"
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : delta.impact_direction === "POSITIVE"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-[#181b24] text-slate-700 dark:text-[#9ca3b4] border-slate-200 dark:border-[#2a2f3e]"
                      }`}
                    >
                      {delta.delta > 0 ? `+${delta.delta}` : delta.delta}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono leading-tight">
                    {delta.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── EXPOSED DEPENDENT SERVICES ──────────────────── */}
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                  Downstream Services Exposed by Outage
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">
                {result.affected_services.length} Exposed
              </span>
            </div>

            <div className="space-y-3">
              {result.affected_services.map((srv, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 space-y-2 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">{srv.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-[#141721] text-slate-700 dark:text-[#9ca3b4] border border-slate-200 dark:border-[#2a2f3e]">
                        {srv.code}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
                        {srv.criticality}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{srv.baseline_status}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400 dark:text-[#6b7280]" />
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{srv.scenario_status}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-mono">
                    {srv.degradation_rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ENERGY RESERVE MARGIN (CROSS-DOMAIN) ────── */}
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                  Cross-Domain Energy Reserve Margin
                </h2>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  result.reserve_margin_percent < 10
                    ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    : result.reserve_margin_percent < 25
                    ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {result.reserve_margin_percent.toFixed(1)}% MARGIN
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Thermal Demand", value: result.thermal_demand_kw, unit: "kW", color: "text-sky-600 dark:text-cyan-400" },
                { label: "Projected Load", value: result.projected_load_kw, unit: "kW", color: "text-amber-600 dark:text-amber-400" },
                { label: "Available Capacity", value: result.available_capacity_kw, unit: "kW", color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Reserve Margin", value: result.reserve_margin_kw, unit: "kW", color: result.reserve_margin_kw < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3 space-y-1 shadow-2xs"
                >
                  <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider">
                    {item.label}
                  </div>
                  <div className={`text-lg font-bold font-mono ${item.color}`}>
                    {item.value.toFixed(1)} <span className="text-xs font-normal">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
                <span>0 kW</span>
                <span>{result.available_capacity_kw.toFixed(0)} kW capacity</span>
              </div>
              <div className="relative h-4 rounded-full bg-slate-100 dark:bg-[#0c0e14] border border-slate-200 dark:border-[#2a2f3e] overflow-hidden">
                {/* Load fill */}
                <div
                  className={`absolute left-0 top-0 h-full rounded-l-full transition-all ${
                    result.reserve_margin_percent < 10
                      ? "bg-rose-500 dark:bg-rose-500"
                      : result.reserve_margin_percent < 25
                      ? "bg-amber-500 dark:bg-amber-500"
                      : "bg-emerald-500 dark:bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, result.available_capacity_kw > 0 ? (result.projected_load_kw / result.available_capacity_kw) * 100 : 100)}%`,
                  }}
                />
                {/* Reserve zone label */}
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white dark:text-[#e4e8f0] mix-blend-difference">
                  Load: {result.projected_load_kw.toFixed(0)} kW / Reserve: {result.reserve_margin_kw.toFixed(0)} kW
                </div>
              </div>
            </div>
          </div>

          {/* ── RECOVERY CONSTRAINTS (LOGISTICS COUPLING) ── */}
          {result.recovery_constraints && result.recovery_constraints.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                    Recovery Constraints — Logistics & Supply Chain
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">
                  {result.recovery_constraints.length} Constraint{result.recovery_constraints.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {result.recovery_constraints.map((rc, idx) => (
                  <div
                    key={idx}
                    className={`rounded-md border p-3.5 space-y-2 shadow-2xs ${
                      rc.impact_level === "BLOCKING"
                        ? "border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20"
                        : rc.impact_level === "HIGH"
                        ? "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20"
                        : "border-slate-200 dark:border-[#2a2f3e] bg-slate-50/40 dark:bg-[#12141c]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                          {rc.constraint_type.replace(/_/g, " ")}
                        </span>
                        {rc.resource_id && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-[#141721] text-slate-700 dark:text-[#9ca3b4] border border-slate-200 dark:border-[#2a2f3e]">
                            {rc.resource_id}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${
                          rc.impact_level === "BLOCKING"
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                            : rc.impact_level === "HIGH"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : rc.impact_level === "MEDIUM"
                            ? "bg-sky-100 dark:bg-cyan-950 text-sky-800 dark:text-cyan-300 border-sky-200 dark:border-cyan-800"
                            : "bg-slate-100 dark:bg-[#181b24] text-slate-700 dark:text-[#9ca3b4] border-slate-200 dark:border-[#2a2f3e]"
                        }`}
                      >
                        {rc.impact_level}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-mono">
                      {rc.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DETERMINISTIC DECISION-SUPPORT OPTIONS ─────── */}
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                  Prototype Decision-Support Countermeasures
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">Human-in-the-loop Advisory</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.decision_options.map((opt, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-3 flex flex-col justify-between shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-[#5b9cf5] uppercase tracking-wider font-semibold">
                          {opt.category.replace("_", " ")}
                        </span>
                        <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0] mt-0.5">
                          {opt.title}
                        </h3>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${
                          opt.risk_reduction_tier === "HIGH"
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-sky-50 dark:bg-cyan-950 text-sky-700 dark:text-cyan-300 border-sky-200 dark:border-cyan-800"
                        }`}
                      >
                        {opt.risk_reduction_tier} REDUCTION
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-sans">
                      {opt.description}
                    </p>

                    <div className="rounded-md bg-white dark:bg-[#181b24] border border-slate-200 dark:border-[#2a2f3e] p-2.5 text-[11px] font-mono text-slate-700 dark:text-[#9ca3b4] shadow-2xs">
                      <strong className="text-slate-900 dark:text-[#e4e8f0]">Operational Consequence:</strong> {opt.operational_impact}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-[#2a2f3e] text-[10px] font-mono text-amber-700 dark:text-amber-400/80">
                    {opt.disclaimer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
