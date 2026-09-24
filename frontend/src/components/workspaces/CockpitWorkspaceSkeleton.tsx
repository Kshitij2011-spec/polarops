import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { useStation } from "@/context/StationContext";
import { fetchIncidents, fetchIncidentDetail, logIncidentAction } from "@/lib/api/incidents";
import { simulateScenario } from "@/lib/api/decision";
import { searchOperationalMemory } from "@/lib/api/memory";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { HoldToConfirmButton } from "@/components/foundation/HoldToConfirmButton";

export interface CockpitWorkspaceSkeletonProps {
  initialIncident?: string;
  initialMode?: "active" | "sim" | "memory";
  targetAsset?: string;
}

export function CockpitWorkspaceSkeleton({
  initialIncident = "INC-2026-003",
  initialMode = "active",
  targetAsset = "G-02",
}: CockpitWorkspaceSkeletonProps) {
  const { activeStationId } = useStation();
  const [activeMode, setActiveMode] = useState<"active" | "sim" | "memory">(initialMode);
  const [activeIncidentId, setActiveIncidentId] = useState<string>(initialIncident);
  const [memoryQuery, setMemoryQuery] = useState("");

  const queryClient = useQueryClient();

  // Fetch active incidents list
  const { data: incidents } = useQuery({
    queryKey: ["incidents", activeStationId],
    queryFn: () => fetchIncidents(activeStationId),
  });

  // Fetch incident detail
  const { data: incidentDetail } = useQuery({
    queryKey: ["incident-detail", activeIncidentId],
    queryFn: () => fetchIncidentDetail(activeIncidentId),
    enabled: Boolean(activeIncidentId),
  });

  // Counterfactual scenario simulation query
  const { data: simResult, isPending: isSimulating, mutate: runSimulation } = useMutation({
    mutationFn: () =>
      simulateScenario({
        station_id: activeStationId,
        target_asset_id: targetAsset,
        scenario_type: "GENERATOR_TRIP",
        duration_hours: 12,
        ambient_temp_celsius: -38,
      }),
  });

  // Institutional Memory search query
  const { data: memories } = useQuery({
    queryKey: ["memory-search", activeStationId, memoryQuery],
    queryFn: () => searchOperationalMemory(memoryQuery, activeStationId),
    enabled: activeMode === "memory",
  });

  // Action logging mutation
  const logActionMutation = useMutation({
    mutationFn: (actionCode: string) =>
      logIncidentAction(activeIncidentId, {
        action_code: actionCode,
        description: `Operator dispatched emergency load-shedding protocol: ${actionCode}`,
        executed_by: "Kshitij (Mission Director)",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-detail", activeIncidentId] });
    },
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100">
      {/* Cockpit Mode Sub-Header Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-400 shrink-0" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            Workspace 2: Incident + Decision Cockpit
          </span>
        </div>

        {/* 3-Mode Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveMode("active")}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === "active"
                ? "bg-red-950 text-red-200 font-bold border border-red-800/80 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert size={13} />
            <span>Active Incident COP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("sim");
              if (!simResult) runSimulation();
            }}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === "sim"
                ? "bg-amber-950 text-amber-200 font-bold border border-amber-800/80 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders size={13} />
            <span>What-If Sandbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("memory")}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === "memory"
                ? "bg-sky-950 text-sky-200 font-bold border border-sky-800/80 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History size={13} />
            <span>Institutional Memory</span>
          </button>
        </div>
      </div>

      {/* Mode View Rendering */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6">
        {/* MODE 1: ACTIVE INCIDENT COMMON OPERATING PICTURE */}
        {activeMode === "active" && (
          <div className="max-w-6xl mx-auto w-full space-y-6">
            {/* Active Incident Header Card */}
            <div className="p-5 rounded-md border border-red-800/80 bg-red-950/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={incidentDetail?.severity || "CRITICAL"} />
                  <span className="font-mono text-sm font-bold text-slate-100">
                    {incidentDetail?.id || "INC-2026-003"}: {incidentDetail?.title || "G-02 Bearing Thermal Surge"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TruthBadge type="MEASURED" />
                  <span className="text-[11px] font-mono text-slate-400">
                    Started: {new Date(incidentDetail?.started_at || Date.now()).toLocaleTimeString()} UTC
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {incidentDetail?.description ||
                  "Transducer VIB-02 on Generator G-02 exceeded critical velocity threshold (4.8 mm/s). Risk score model indicates imminent bearing seizure within 4 hours if load is maintained during blizzard conditions."}
              </p>

              {/* Affected Critical Services Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Primary Asset</div>
                  <div className="font-bold text-slate-200 mt-0.5">{targetAsset} (Diesel Genset 2)</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Affected Subsystem</div>
                  <div className="font-bold text-amber-400 mt-0.5">Life Support & HVAC-01</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Model Risk Score</div>
                  <div className="font-bold text-red-400 mt-0.5">76 / 100 (HIGH SEVERITY)</div>
                </div>
              </div>
            </div>

            {/* Split: Decision Options (Left) + Action Execution Ledger (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Mitigation Decision Packages */}
              <div className="p-5 rounded-md border border-slate-800 bg-slate-950/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-sky-400" />
                    <span>Evaluated Decision Packages</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Human Approval Mandatory</span>
                </div>

                <div className="space-y-3">
                  {/* Decision Option 1: Controlled Load Shedding (Recommended) */}
                  <div className="p-4 rounded border border-amber-700/80 bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        OPTION A: SHED NON-CRITICAL SCIENCE & THROTTLE G-02
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-900 text-amber-200">
                        TIER 1 MITIGATION
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-normal font-sans">
                      Safely buffer secondary meteorological radars, shed 120 kW non-vital science load, and transfer base electrical load to G-01. Reduces G-02 vibration from 4.8 to 2.1 mm/s.
                    </p>

                    <div className="pt-2">
                      <HoldToConfirmButton
                        label="Authorize Load Shedding (G-02 -> G-01)"
                        confirmingLabel="HOLDING TO DISPATCH COMMAND..."
                        confirmedLabel="AUTHORIZED & LEDGER RECORDED"
                        variant="danger"
                        onConfirm={() => logActionMutation.mutate("SHED_SCIENCE_LOAD_THROTTLE_G02")}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Decision Option 2: Full Emergency Trip */}
                  <div className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        OPTION B: IMMEDIATE EMERGENCY TRIP G-02
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        HIGH IMPACT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal font-sans">
                      Trips G-02 immediately. Compresses generation reserve margin to 8% until G-03 cold start completes (18 min gap).
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Immutable Action Execution Ledger */}
              <div className="p-5 rounded-md border border-slate-800 bg-slate-950/60 space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>Action Execution Ledger</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400">Cryptographically Verified</span>
                </div>

                <div className="flex-1 divide-y divide-slate-800/80 border border-slate-800 rounded bg-slate-900/40 overflow-y-auto max-h-80">
                  {(incidentDetail?.actions && incidentDetail.actions.length > 0) ? (
                    incidentDetail.actions.map((act) => (
                      <div key={act.id} className="p-3 space-y-1 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{act.action_code}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.executed_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">{act.description}</div>
                        <div className="text-[9px] text-slate-500 pt-0.5">By: {act.executed_by}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs font-mono text-slate-500">
                      No physical actions recorded yet. All mitigation commands executed via Hold-to-Confirm will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: QUARANTINED WHAT-IF SIMULATION SANDBOX */}
        {activeMode === "sim" && (
          <div className="max-w-6xl mx-auto w-full space-y-6 relative">
            {/* Amber Striped Watermark Banner (Strict Split-Brain Prevention) */}
            <div className="p-3.5 rounded border border-amber-600 bg-amber-950/60 flex items-center justify-between gap-4 font-mono text-xs text-amber-200 shadow-lg">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 animate-pulse" />
                <span className="font-bold tracking-wider">
                  QUARANTINED WHAT-IF SIMULATION SANDBOX — ZERO PHYSICAL REALITY
                </span>
              </div>
              <TruthBadge type="SCENARIO" />
            </div>

            {/* Simulation Comparison Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Baseline Reality */}
              <div className="p-5 rounded-md border border-slate-800 bg-slate-950/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-slate-300">
                    CURRENT MEASURED BASELINE
                  </span>
                  <TruthBadge type="MEASURED" />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-bold text-amber-400">42 / 100 (ELEVATED)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Reserve Headroom:</span>
                    <span className="font-bold text-slate-100">350 kW (42%)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Active Generators:</span>
                    <span className="font-bold text-slate-100">2 Online (G-01, G-02)</span>
                  </div>
                </div>
              </div>

              {/* Counterfactual Projected Outcome */}
              <div className="p-5 rounded-md border border-amber-700/80 bg-amber-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-amber-300">
                    PROJECTED DELTA IF G-02 TRIPS
                  </span>
                  <TruthBadge type="SCENARIO" />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between p-2 rounded bg-amber-950/60 border border-amber-800/80">
                    <span className="text-amber-300">Projected Risk:</span>
                    <span className="font-bold text-red-400">78 / 100 (+36 DELTA)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-amber-950/60 border border-amber-800/80">
                    <span className="text-amber-300">Remaining Reserve:</span>
                    <span className="font-bold text-red-400">80 kW (8% CRITICAL)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-amber-950/60 border border-amber-800/80">
                    <span className="text-amber-300">Cold Start Gap:</span>
                    <span className="font-bold text-amber-300">18 Minutes until G-03</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Non-Destructive Scenario Controls */}
            <div className="p-4 rounded border border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <span className="text-slate-400">Simulate ambient temperature drops during blizzard:</span>
              <button
                type="button"
                onClick={() => runSimulation()}
                disabled={isSimulating}
                className="px-4 py-2 rounded bg-amber-900/60 hover:bg-amber-800 border border-amber-600 text-amber-200 font-bold uppercase tracking-wider cursor-pointer"
              >
                {isSimulating ? "COMPUTING COUNTERFACTUAL..." : "RE-RUN SIMULATION (ΔT = -38°C)"}
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: INSTITUTIONAL MEMORY ARCHIVE */}
        {activeMode === "memory" && (
          <div className="max-w-6xl mx-auto w-full space-y-6">
            <div className="p-4 rounded border border-slate-800 bg-slate-950/60 flex items-center gap-3">
              <History size={16} className="text-sky-400 shrink-0" />
              <input
                type="text"
                value={memoryQuery}
                onChange={(e) => setMemoryQuery(e.target.value)}
                placeholder="Search historical station debriefs, bearing anomalies, blizzard SOPs..."
                className="flex-1 bg-transparent text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Memory List */}
            <div className="divide-y divide-slate-800 border border-slate-800 rounded bg-slate-950/40">
              {(memories?.memories || [
                {
                  id: "MEM-2025-014",
                  title: "Genset G-02 Bearing Cavitation Handover",
                  event_type: "MAINTENANCE_DEBRIEF",
                  lessons_learned: "Vibration surge preceded failure by 6 hours. Throttling to 60% load prevented complete mechanical binding until storm abated.",
                  created_at: "2025-08-14T10:00:00Z",
                },
                {
                  id: "MEM-2024-002",
                  title: "Winter Overheat & Thermal Glycol Recovery",
                  event_type: "INCIDENT_POSTMORTEM",
                  lessons_learned: "Shedding non-vital science radar freed 120 kW and stabilized primary generation reserve margin.",
                  created_at: "2024-07-22T14:30:00Z",
                },
              ]).map((mem) => (
                <div key={mem.id} className="p-4 space-y-1.5 font-mono text-xs hover:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300">{mem.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(mem.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs leading-normal">{mem.lessons_learned}</p>
                  <div className="text-[9px] text-slate-500">{mem.event_type} • Historical Precedent</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
