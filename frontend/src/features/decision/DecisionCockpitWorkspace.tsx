import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Sliders,
  History,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Activity,
  Layers,
} from "lucide-react";
import { useStation } from "@/context/StationContext";
import { fetchIncidents, fetchIncidentDetail, logIncidentAction } from "@/lib/api/incidents";
import { createResilienceEvent } from "@/lib/api/resilience";
import type { ScenarioDecisionOption } from "@/lib/api/decision";
import { ActiveIncidentCop } from "./ActiveIncidentCop";
import { ScenarioSandbox } from "./ScenarioSandbox";
import { OperationalMemoryBrowser } from "./OperationalMemoryBrowser";

export interface DecisionCockpitWorkspaceProps {
  initialIncident?: string;
  initialMode?: "active" | "sim" | "memory";
  targetAsset?: string;
}

export function DecisionCockpitWorkspace({
  initialIncident = "INC-2026-003",
  initialMode = "active",
  targetAsset = "G-02",
}: DecisionCockpitWorkspaceProps) {
  const { activeStationId } = useStation();
  const [activeMode, setActiveMode] = useState<"active" | "sim" | "memory">(initialMode);
  const [activeIncidentId, setActiveIncidentId] = useState<string>(initialIncident);
  const [currentTargetAsset, setCurrentTargetAsset] = useState<string>(targetAsset);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // 1. Fetch incidents list for the active station
  const {
    data: incidents = [],
    isLoading: isLoadingIncidents,
    refetch: refetchIncidents,
  } = useQuery({
    queryKey: ["incidents", activeStationId],
    queryFn: () => fetchIncidents(activeStationId),
  });

  // Ensure activeIncidentId is valid
  useEffect(() => {
    if (incidents.length > 0 && !incidents.some((i) => i.id === activeIncidentId)) {
      const first = incidents[0];
      if (first) {
        setActiveIncidentId(first.id);
      }
    }
  }, [incidents, activeIncidentId]);

  // 2. Fetch active incident details
  const {
    data: activeIncident,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ["incident-detail", activeIncidentId],
    queryFn: () => fetchIncidentDetail(activeIncidentId),
    enabled: Boolean(activeIncidentId),
  });

  // 3. Action dispatch mutation (bridges scenario & incident COP)
  const logActionMutation = useMutation({
    mutationFn: async ({
      actionCode,
      description,
      executedBy,
    }: {
      actionCode: string;
      description: string;
      executedBy: string;
    }) => {
      // 1. Commit action to backend incident service
      await logIncidentAction(activeIncidentId, {
        action_code: actionCode,
        description,
        executed_by: executedBy,
      });

      // 2. Always buffer into P0 Resilience Priority Queue for edge safety
      try {
        await createResilienceEvent({
          station_id: activeStationId,
          event_type: "INCIDENT_ACTION_DISPATCHED",
          priority: 0, // P0 Critical
          payload: {
            incident_id: activeIncidentId,
            action_code: actionCode,
            description,
            authorized_by: executedBy,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("Resilience event buffering notice:", err);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["incident-detail", activeIncidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents", activeStationId] });
      setActionNotice(`Action ${vars.actionCode} successfully authorized and committed to ledger!`);
      setTimeout(() => setActionNotice(null), 4000);
    },
  });

  const handleCommitScenarioAction = async (option: ScenarioDecisionOption, operatorRole: string) => {
    await logActionMutation.mutateAsync({
      actionCode: option.code,
      description: `Authorized countermeasure package: ${option.title} (${option.operational_impact})`,
      executedBy: operatorRole,
    });
    // Switch to active COP to see the action committed in the sequence timeline
    setActiveMode("active");
  };

  const handleManualActionLog = async (actionCode: string, description: string, executedBy: string) => {
    await logActionMutation.mutateAsync({
      actionCode,
      description,
      executedBy,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100">
      {/* Cockpit Mode Sub-Header Bar */}
      <div className="bg-slate-950/95 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={18} className="text-red-400 shrink-0" />
          <div>
            <h1 className="font-mono text-xs font-bold tracking-wider text-slate-100 uppercase">
              Incident + Decision Cockpit
            </h1>
            <span className="text-[10px] font-mono text-slate-400">
              Station: {activeStationId} • Active Crisis & Causal Mitigation Spine
            </span>
          </div>
        </div>

        {/* 3-Mode Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveMode("active")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-1.5 transition-all ${
              activeMode === "active"
                ? "bg-red-500/20 text-red-300 font-bold border border-red-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Active Incident COP</span>
            {incidents.filter((i) => i.status === "ACTIVE").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-600 text-white font-mono">
                {incidents.filter((i) => i.status === "ACTIVE").length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("sim")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-1.5 transition-all ${
              activeMode === "sim"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders size={14} />
            <span>What-If Sandbox</span>
            <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
              SCENARIO
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("memory")}
            className={`px-3.5 py-2.5 min-h-[44px] rounded flex items-center gap-1.5 transition-all ${
              activeMode === "memory"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History size={14} />
            <span>Institutional Memory</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast Banner */}
      {actionNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-500 text-emerald-200 px-6 py-2.5 text-xs font-mono font-bold flex items-center justify-between animate-in slide-in-from-top-2">
          <span>✓ {actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-400 hover:text-emerald-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {activeMode === "active" && (
          <>
            {isLoadingDetail ? (
              <div className="p-12 text-center font-mono text-xs text-slate-400">
                Loading Common Operating Picture for incident {activeIncidentId}...
              </div>
            ) : activeIncident ? (
              <ActiveIncidentCop
                incidents={incidents}
                activeIncident={activeIncident}
                onSelectIncident={(id) => setActiveIncidentId(id)}
                onLogAction={handleManualActionLog}
                onSwitchToScenario={(assetId) => {
                  if (assetId) setCurrentTargetAsset(assetId);
                  setActiveMode("sim");
                }}
                isLoggingAction={logActionMutation.isPending}
              />
            ) : (
              <div className="p-12 text-center rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400">
                No active incidents recorded for {activeStationId}.
              </div>
            )}
          </>
        )}

        {activeMode === "sim" && (
          <ScenarioSandbox
            stationId={activeStationId}
            activeIncidentId={activeIncidentId}
            initialAssetId={currentTargetAsset}
            onCommitDecisionAction={handleCommitScenarioAction}
          />
        )}

        {activeMode === "memory" && (
          <OperationalMemoryBrowser
            stationId={activeStationId}
            activeIncidentId={activeIncidentId}
          />
        )}
      </div>
    </div>
  );
}
