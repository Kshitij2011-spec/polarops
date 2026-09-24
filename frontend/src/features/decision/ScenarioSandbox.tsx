import React, { useState } from "react";
import {
  Sliders,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
  Thermometer,
  Box,
  Truck,
  CheckCircle2,
} from "lucide-react";
import type {
  ScenarioSimulateResponse,
  ScenarioSimulateRequest,
  ScenarioDecisionOption,
} from "@/lib/api/decision";
import { simulateScenario } from "@/lib/api/decision";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { DecisionPackageCard } from "./DecisionPackageCard";

interface ScenarioSandboxProps {
  stationId: string;
  activeIncidentId: string;
  initialAssetId?: string;
  onCommitDecisionAction: (option: ScenarioDecisionOption, operatorRole: string) => Promise<void> | void;
}

export function ScenarioSandbox({
  stationId,
  activeIncidentId,
  initialAssetId = "G-02",
  onCommitDecisionAction,
}: ScenarioSandboxProps) {
  // Scenario simulation parameters (STRICTLY IN-MEMORY, ZERO MUTATION)
  const [targetAssetId, setTargetAssetId] = useState(initialAssetId);
  const [scenarioType, setScenarioType] = useState("GENERATOR_FAILURE");
  const [durationHours, setDurationHours] = useState(72);
  const [ambientTempOverride, setAmbientTempOverride] = useState(-35);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResponse, setSimResponse] = useState<ScenarioSimulateResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runSimulation = async () => {
    setIsSimulating(true);
    setErrorMsg(null);
    try {
      const res = await simulateScenario({
        station_id: stationId,
        target_asset_id: targetAssetId,
        scenario_type: scenarioType,
        duration_hours: durationHours,
        ambient_temp_celsius: ambientTempOverride,
      });
      setSimResponse(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Simulation failed to evaluate against backend model");
    } finally {
      setIsSimulating(false);
    }
  };

  const applyPreset = (type: string, asset: string, dur: number, temp: number) => {
    setScenarioType(type);
    setTargetAssetId(asset);
    setDurationHours(dur);
    setAmbientTempOverride(temp);
  };

  return (
    <div className="space-y-6">
      {/* 1. Unmistakable Sandbox Warning Banner */}
      <div className="p-4 rounded-lg bg-amber-950/40 border-2 border-dashed border-amber-500/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500 text-slate-950 font-bold">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-amber-300">
                  HYPOTHETICAL SIMULATION SANDBOX
                </span>
                <TruthBadge type="SCENARIO" source="model:scenario_engine" />
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5 font-sans">
                Zero System Mutation. Counterfactual projections evaluated in-memory against deterministic thermodynamic and BFS graph engines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-amber-300/80">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset("GENERATOR_FAILURE", "G-02", 72, -38)}
              className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/40 text-amber-200 text-xs font-mono"
            >
              Cold Snap G-02 Outage
            </button>
            <button
              type="button"
              onClick={() => applyPreset("EXTREME_COLD_SNAP", "G-02", 48, -45)}
              className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/40 text-amber-200 text-xs font-mono"
            >
              -45°C Katabatic Blizzard
            </button>
          </div>
        </div>
      </div>

      {/* 2. Parameters Control Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
          <Sliders size={16} className="text-cyan-400" />
          <span>Counterfactual Stress Parameters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Target Disrupted Asset:
            </label>
            <select
              value={targetAssetId}
              onChange={(e) => setTargetAssetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="G-02">Generator G-02 (Powerhouse)</option>
              <option value="G-01">Generator G-01 (Primary Standby)</option>
              <option value="B-01">Auxiliary Boiler B-01 (Thermal)</option>
              <option value="RADAR-01">Upper Atmosphere Science Radar</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Disruption Scenario Type:
            </label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="GENERATOR_FAILURE">GENERATOR_FAILURE (Total Trip)</option>
              <option value="EXTREME_COLD_SNAP">EXTREME_COLD_SNAP (Katabatic Surge)</option>
              <option value="FUEL_CONTAMINATION">FUEL_CONTAMINATION (Burn Rate Decay)</option>
              <option value="RESUPPLY_DELAY_14D">RESUPPLY_DELAY_14D (Maritime Delay)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-mono text-slate-400">Duration (Hours):</label>
              <span className="font-mono text-xs font-bold text-amber-400">{durationHours}h</span>
            </div>
            <input
              type="range"
              min={1}
              max={168}
              step={1}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-mono text-slate-400">Outside Ambient Temp:</label>
              <span className="font-mono text-xs font-bold text-cyan-400">{ambientTempOverride}°C</span>
            </div>
            <input
              type="range"
              min={-50}
              max={5}
              step={1}
              value={ambientTempOverride}
              onChange={(e) => setAmbientTempOverride(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-950"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-400">
            Triggers deterministic linear energy balance and multi-hop BFS dependency walk.
          </span>
          <button
            type="button"
            onClick={runSimulation}
            disabled={isSimulating}
            className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50"
          >
            <Play size={14} className={isSimulating ? "animate-spin" : ""} />
            <span>{isSimulating ? "Evaluating Physics Engine..." : "Evaluate What-If Scenario"}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 3. Decision-Oriented Results: Baseline vs Scenario */}
      {simResponse && (
        <div className="space-y-6">
          {/* Executive Comparative Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Deterministic Impact & Headroom Deltas (Baseline vs Scenario)
                </h3>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-400 font-bold">
                Risk Surge: {simResponse.baseline_risk_score} → {simResponse.scenario_risk_score} (+{simResponse.risk_delta})
              </span>
            </div>

            {/* Core Operational Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Reserve Margin */}
              <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Grid Reserve Margin
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-2xl font-extrabold text-red-400">
                    {simResponse.reserve_margin_kw.toFixed(1)} kW
                  </span>
                  <span className="text-xs font-mono text-red-400">
                    ({simResponse.reserve_margin_percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Capacity: {simResponse.available_capacity_kw} kW</span>
                  <span>Load: {simResponse.projected_load_kw.toFixed(0)} kW</span>
                </div>
              </div>

              {/* Thermal Demand */}
              <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Thermal Demand Surge
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-2xl font-extrabold text-amber-400">
                    {simResponse.thermal_demand_kw.toFixed(1)} kW
                  </span>
                  <span className="text-xs font-mono text-amber-400">@ {simResponse.ambient_temp_celsius}°C</span>
                </div>
                <span className="mt-2 text-[10px] font-mono text-slate-400 block">
                  Q = 5.2 × (20 - ({simResponse.ambient_temp_celsius})) kW
                </span>
              </div>

              {/* Delta Items */}
              {simResponse.deltas.slice(0, 2).map((delta) => (
                <div key={delta.name} className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    {delta.name}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-extrabold text-slate-100">
                      {delta.scenario_value.toFixed(1)}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold flex items-center ${
                        delta.impact_direction === "NEGATIVE" ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {delta.delta > 0 ? `+${delta.delta.toFixed(1)}` : delta.delta.toFixed(1)} {delta.unit}
                    </span>
                  </div>
                  <span className="mt-2 text-[10px] font-mono text-slate-400 block truncate">
                    Baseline: {delta.baseline_value} {delta.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Degraded Services & Coupled Recovery Constraints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Affected Services */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-amber-400" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                    Degraded Station Services ({simResponse.affected_services.length})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">BFS Downstream Tracing</span>
              </div>

              <div className="space-y-2">
                {simResponse.affected_services.map((srv) => (
                  <div
                    key={srv.service_id}
                    className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-200">{srv.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-400 font-bold uppercase">
                        {srv.scenario_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">{srv.degradation_rationale}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                      <span>Baseline: {srv.baseline_status}</span>
                      <span>•</span>
                      <span>Criticality: {srv.criticality}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupled Recovery Constraints (Parts / Logistics) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-cyan-400" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                    Physical Supply Chain & Recovery Constraints ({simResponse.recovery_constraints.length})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Inventory Exposure</span>
              </div>

              <div className="space-y-2">
                {simResponse.recovery_constraints.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {c.constraint_type}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 font-bold uppercase">
                        {c.impact_level}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">{c.description}</p>
                    {c.resource_id && (
                      <span className="text-[10px] font-mono text-cyan-400 block">
                        Linked Resource: {c.resource_id}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Ranked Decision Packages (Advisory Countermeasures) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Evaluated Decision Packages ({simResponse.decision_options.length} Candidate Countermeasures)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Human-in-the-Loop Review Required
              </span>
            </div>

            <div className="space-y-4">
              {simResponse.decision_options.map((opt) => (
                <DecisionPackageCard
                  key={opt.code}
                  option={opt}
                  activeIncidentId={activeIncidentId}
                  onAuthorize={onCommitDecisionAction}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
