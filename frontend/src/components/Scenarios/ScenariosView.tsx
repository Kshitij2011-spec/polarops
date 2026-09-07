import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Play,
  ShieldAlert,
  Thermometer,
} from "lucide-react";
import { useScenarioSimulation } from "../../hooks/useScenarioSimulation";
import type { ScenarioSimulateResponse } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface ScenariosViewProps {
  stationId: string;
  onBack: () => void;
  onInspectAsset?: (assetId: string) => void;
}

export function ScenariosView({ stationId, onBack }: ScenariosViewProps) {
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
    <div className="space-y-6 animate-fade-in pb-16">
      {/* ── Top Navigation & Route Bar ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          aria-label="Return to Station Command Center"
          className="flex items-center gap-2 rounded border border-polar-800 bg-polar-900 px-3 py-1.5 text-xs font-mono text-polar-300 hover:text-polar-100 hover:border-polar-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Station Command Center</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-polar-400">ROUTE:</span>
          <span className="rounded bg-polar-950 px-2 py-0.5 text-accent-cyan border border-polar-800">
            /scenarios
          </span>
          <TruthBadge type="SCENARIO" />
        </div>
      </div>

      {/* ── Scenario Configurator Header ───────────────── */}
      <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-polar-950 px-2 py-0.5 text-[10px] font-mono font-bold text-accent-cyan border border-polar-800 tracking-wider">
                WHAT-IF CONSEQUENCE SIMULATOR
              </span>
              <span className="text-xs font-mono text-polar-400">{stationId}</span>
            </div>
            <h1 className="text-xl font-bold font-mono text-polar-100 mt-1">
              Cross-Domain Scenario Engine
            </h1>
            <p className="text-xs text-polar-400">
              Stateless in-memory consequence modeling: simulates generation dispatch, dependency blast radius, fuel runway, and risk escalation.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-950/30 border border-amber-800/80 rounded p-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Stateless Simulator: Current database state is completely preserved.</span>
          </div>
        </div>

        {/* ── Interactive Input Form ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-polar-800">
          {/* 1. Scenario Type */}
          <div className="space-y-1.5">
            <label htmlFor="scenario-type-select" className="text-[10px] font-mono text-polar-400 uppercase tracking-wider">SCENARIO TYPE</label>
            <select
              id="scenario-type-select"
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full rounded border border-polar-700 bg-polar-950 px-3 py-2 text-xs font-mono text-polar-200 focus:outline-none focus:border-accent-cyan"
            >
              <option value="GENERATOR_FAILURE">Generator Failure (Asset Offline)</option>
            </select>
          </div>

          {/* 2. Target Asset */}
          <div className="space-y-1.5">
            <label htmlFor="target-asset-select" className="text-[10px] font-mono text-polar-400 uppercase tracking-wider">TARGET ASSET</label>
            <select
              id="target-asset-select"
              value={targetAssetId}
              onChange={(e) => setTargetAssetId(e.target.value)}
              className="w-full rounded border border-polar-700 bg-polar-950 px-3 py-2 text-xs font-mono text-polar-200 focus:outline-none focus:border-accent-cyan"
            >
              <option value="G-02">Generator G-02 (Hero Anomaly)</option>
              <option value="G-01">Generator G-01 (Primary Genset)</option>
            </select>
          </div>

          {/* 3. Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-polar-400 uppercase tracking-wider">FAILURE DURATION</label>
            <div className="flex gap-2">
              {[24.0, 48.0, 72.0].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationHours(d)}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold rounded border transition-colors cursor-pointer ${
                    durationHours === d
                      ? "bg-polar-800 border-accent-cyan text-accent-cyan"
                      : "bg-polar-950 border-polar-800 text-polar-400 hover:text-polar-200 hover:border-polar-700"
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
              className="w-full flex items-center justify-center gap-2 rounded bg-accent-cyan hover:bg-accent-cyan/90 text-polar-950 px-4 py-2 text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {simulationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Computing Models...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-polar-950" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ambient Temperature Adjustment Slider */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono border-t border-polar-800/60">
          <div className="flex items-center gap-2 text-polar-400">
            <Thermometer className="h-4 w-4 text-cyan-400" />
            <span>Simulated Ambient Cold Snap:</span>
            <span className="font-bold text-polar-100">{tempOverride}°C</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-50"
              max="-15"
              step="0.5"
              value={tempOverride}
              onChange={(e) => setTempOverride(parseFloat(e.target.value))}
              className="w-48 accent-accent-cyan cursor-pointer"
            />
            <button
              onClick={() => setTempOverride(-28.5)}
              className="text-[11px] text-polar-500 hover:text-polar-300 underline"
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
          <div className="rounded border border-polar-700 bg-polar-900 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-polar-950 text-accent-cyan border border-polar-800">
                  {result.scenario_id}
                </span>
                <span className="text-xs font-mono text-polar-200">
                  {result.target_asset_name} ({result.target_asset_id}) OFFLINE FOR {result.duration_hours}H
                </span>
              </div>
              <TruthBadge type="SCENARIO" />
            </div>

            <p className="text-xs text-polar-300 leading-relaxed font-mono">
              {result.scenario_summary}
            </p>
          </div>

          {/* ── BASELINE VS SCENARIO COMPARISON MATRIX ──── */}
          <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-polar-800 pb-3">
              <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider">
                Baseline vs. Simulated Scenario Impact Deltas
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono text-polar-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400"></span> Baseline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span> Scenario
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {result.deltas.map((delta, idx) => (
                <div
                  key={idx}
                  className="rounded border border-polar-800 bg-polar-950/70 p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="text-[10px] font-mono text-polar-400 uppercase tracking-wider truncate">
                    {delta.name}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs font-mono text-polar-400">
                        {delta.baseline_value} {delta.unit}
                      </div>
                      <div className="text-base font-bold font-mono text-polar-100">
                        {delta.scenario_value} {delta.unit}
                      </div>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        delta.impact_direction === "NEGATIVE"
                          ? "bg-rose-950 text-rose-300 border-rose-800"
                          : delta.impact_direction === "POSITIVE"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-polar-900 text-polar-300 border-polar-700"
                      }`}
                    >
                      {delta.delta > 0 ? `+${delta.delta}` : delta.delta}
                    </span>
                  </div>

                  <p className="text-[10px] text-polar-500 font-mono leading-tight">
                    {delta.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── EXPOSED DEPENDENT SERVICES ──────────────────── */}
          <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-polar-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider">
                  Downstream Services Exposed by Outage
                </h2>
              </div>
              <span className="text-xs font-mono text-polar-400">
                {result.affected_services.length} Exposed
              </span>
            </div>

            <div className="space-y-3">
              {result.affected_services.map((srv, idx) => (
                <div
                  key={idx}
                  className="rounded border border-rose-900/60 bg-rose-950/20 p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-polar-100">{srv.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-polar-900 text-polar-300 border border-polar-700">
                        {srv.code}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                        {srv.criticality}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400">{srv.baseline_status}</span>
                      <ArrowRight className="h-3 w-3 text-polar-500" />
                      <span className="text-rose-400 font-bold">{srv.scenario_status}</span>
                    </div>
                  </div>

                  <p className="text-xs text-polar-300 leading-relaxed font-mono">
                    {srv.degradation_rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── DETERMINISTIC DECISION-SUPPORT OPTIONS ─────── */}
          <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-polar-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider">
                  Prototype Decision-Support Countermeasures
                </h2>
              </div>
              <span className="text-[11px] font-mono text-polar-400">Human-in-the-loop Advisory</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.decision_options.map((opt, idx) => (
                <div
                  key={idx}
                  className="rounded border border-polar-800 bg-polar-950/70 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
                          {opt.category.replace("_", " ")}
                        </span>
                        <h3 className="text-xs font-bold font-mono text-polar-100 mt-0.5">
                          {opt.title}
                        </h3>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${
                          opt.risk_reduction_tier === "HIGH"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : "bg-cyan-950 text-cyan-300 border-cyan-800"
                        }`}
                      >
                        {opt.risk_reduction_tier} REDUCTION
                      </span>
                    </div>

                    <p className="text-xs text-polar-300 leading-relaxed font-mono">
                      {opt.description}
                    </p>

                    <div className="rounded bg-polar-900 border border-polar-800 p-2.5 text-[11px] font-mono text-polar-300">
                      <strong className="text-polar-200">Operational Consequence:</strong> {opt.operational_impact}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-polar-800 text-[10px] font-mono text-amber-400/80">
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
