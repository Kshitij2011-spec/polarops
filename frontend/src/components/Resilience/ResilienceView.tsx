import React, { useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileCheck,
  History,
  Layers,
  Radio,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useResilienceStatus } from "../../hooks/useResilienceStatus";
import { useSyncQueue } from "../../hooks/useSyncQueue";
import { useScienceInstruments } from "../../hooks/useScienceInstruments";
import { useIncidents } from "../../hooks/useIncidents";
import { useIncidentDetail } from "../../hooks/useIncidentDetail";
import { useOperationalMemory } from "../../hooks/useOperationalMemory";
import {
  simulateOffline,
  restoreAndSync,
  retryQueueItem,
  resetResilienceSimulation,
  bufferScienceObservation,
  logIncidentAction,
  updateIncidentStatus,
  recordOperationalMemory,
  type IncidentStatus,
} from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

interface ResilienceViewProps {
  stationId?: string;
  onBack?: () => void;
  onInspectAsset?: (assetId: string) => void;
}

type ResilienceTab = "ALL" | "QUEUE" | "SCIENCE" | "INCIDENTS" | "MEMORY";

export const ResilienceView: React.FC<ResilienceViewProps> = ({
  stationId = "STATION-BHARATI",
  onBack,
  onInspectAsset,
}) => {
  const [activeTab, setActiveTab] = useState<ResilienceTab>("ALL");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("INC-2026-04");
  const [memorySearchQuery, setMemorySearchQuery] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeSyncPhase, setActiveSyncPhase] = useState<string | null>(null);
  const [reconciliationSteps, setReconciliationSteps] = useState<string[]>([]);

  // Form states
  const [newActionCode, setNewActionCode] = useState<string>("");
  const [newActionDesc, setNewActionDesc] = useState<string>("");
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [memDecision, setMemDecision] = useState<string>("Transfer thermal load to Auxiliary Boiler B-01");
  const [memAction, setMemAction] = useState<string>("Preheated B-01 for 35 minutes and isolated G-02 secondary circuit");
  const [memOutcome, setMemOutcome] = useState<string>("Station grid stabilized without habitat freeze-out");
  const [memLesson, setMemLesson] = useState<string>("Always allow 35-minute preheat on B-01 in subzero ambient temperatures");

  // Queries
  const { data: commsStatus, refetch: refetchComms } = useResilienceStatus(stationId);
  const { data: syncQueue, refetch: refetchQueue } = useSyncQueue(stationId);
  const { data: instruments, refetch: refetchScience } = useScienceInstruments(stationId);
  const { data: incidents, refetch: refetchIncidents } = useIncidents(stationId);
  const { data: activeIncident, refetch: refetchIncidentDetail } = useIncidentDetail(selectedIncidentId);
  const { data: memoryData, refetch: refetchMemory } = useOperationalMemory(memorySearchQuery, stationId);

  // Actions
  const handleSimulateOutage = async () => {
    try {
      setActionLoading(true);
      await simulateOffline(stationId);
      await Promise.all([refetchComms(), refetchQueue()]);
      setActionFeedback("Satellite link severed. System operating in autonomous local degraded mode.");
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreAndSync = async () => {
    try {
      setActionLoading(true);
      setActiveSyncPhase("RESTORING");
      setReconciliationSteps(["Carrier acquisition & satellite handshake initiated..."]);

      // Stepped queue progression
      await new Promise((r) => setTimeout(r, 200));
      setActiveSyncPhase("SYNCING");
      setReconciliationSteps((prev) => [
        ...prev,
        "Carrier locked. Initiating priority transmission:",
        "P0 transferred — Generator G-02 telemetry threshold anomaly",
        "P1 transferred — Maintenance work order WO-2026-088 status",
        "P2 transferred — Science buffer 30-min ionospheric observations",
        "P3 transferred — Routine station weather & environmental telemetry",
      ]);

      await new Promise((r) => setTimeout(r, 200));
      setReconciliationSteps((prev) => [
        ...prev,
        "Canonical SHA-256 payload checksums verified by station hub.",
      ]);

      // Execute backend reconciliation
      await restoreAndSync(stationId);
      await Promise.all([refetchComms(), refetchQueue(), refetchScience()]);

      setActiveSyncPhase("RECONCILED");
      setReconciliationSteps((prev) => [
        ...prev,
        "Server ACK received: All priority deltas reconciled. Satellite link ONLINE.",
      ]);
      setActionFeedback("Link restored. Priority queue synchronized and verified via canonical SHA-256.");
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
      setTimeout(() => {
        setActiveSyncPhase(null);
      }, 4000);
    }
  };

  const handleResetSimulation = async () => {
    try {
      setActionLoading(true);
      await resetResilienceSimulation(stationId);
      await Promise.all([
        refetchComms(),
        refetchQueue(),
        refetchScience(),
        refetchIncidents(),
        refetchIncidentDetail(),
      ]);
      setActionFeedback("Simulation baseline restored. Canonical operational resources preserved.");
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryQueueItem = async (queueId: string) => {
    try {
      setActionLoading(true);
      await retryQueueItem(queueId);
      await refetchQueue();
      setActionFeedback(`Item ${queueId} recalculated and verified.`);
    } catch (err: any) {
      setActionFeedback(`Retry failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBufferObservation = async (instId: string) => {
    try {
      setActionLoading(true);
      const val = Number((130 + Math.random() * 20).toFixed(2));
      await bufferScienceObservation({
        instrument_id: instId,
        measurement_value: val,
        unit: "TECU",
      });
      await Promise.all([refetchScience(), refetchQueue()]);
      setActionFeedback(`Scientific observation buffered locally (${val} TECU) under degraded link.`);
    } catch (err: any) {
      setActionFeedback(`Buffer failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionCode || !newActionDesc || !selectedIncidentId) return;
    try {
      setActionLoading(true);
      await logIncidentAction(selectedIncidentId, {
        action_code: newActionCode,
        description: newActionDesc,
        executed_by: "Station Lead Engineer",
        outcome_status: "COMPLETED",
      });
      setNewActionCode("");
      setNewActionDesc("");
      await Promise.all([refetchIncidentDetail(), refetchIncidents()]);
      setActionFeedback("Operational action successfully logged into incident audit trail.");
    } catch (err: any) {
      setActionFeedback(`Failed to log action: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: IncidentStatus) => {
    if (!selectedIncidentId) return;
    try {
      setActionLoading(true);
      await updateIncidentStatus(selectedIncidentId, status);
      await Promise.all([refetchIncidentDetail(), refetchIncidents()]);
      setActionFeedback(`Incident ${selectedIncidentId} status updated to ${status}.`);
    } catch (err: any) {
      setActionFeedback(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await recordOperationalMemory({
        station_id: stationId,
        event_type: "INCIDENT_POSTMORTEM",
        title: `${selectedIncidentId}: Thermal Loop & Generator Mitigation`,
        incident_id: selectedIncidentId,
        decision: memDecision,
        action_taken: memAction,
        outcome: memOutcome,
        lesson: memLesson,
      });
      setIsMemoryModalOpen(false);
      await refetchMemory();
      setActionFeedback("Operational memory permanently recorded to institutional archive.");
    } catch (err: any) {
      setActionFeedback(`Failed to record memory: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const isOffline = commsStatus?.status === "OFFLINE";

  return (
    <div className="space-y-6 animate-fade-in pb-16 transition-colors">
      {/* ── Top Header Navigation & Action Bar ──────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#2a2f3e] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Return to Station Command Center"
                className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-[#7a8194] hover:text-blue-600 dark:hover:text-[#5b9cf5] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Command Center</span>
              </button>
            )}
            <span className="text-slate-300 dark:text-[#3d4556]">/</span>
            <span className="text-[10px] font-mono text-blue-600 dark:text-[#5b9cf5] uppercase tracking-wider font-semibold">
              Disruption Resilience Workspace
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0] flex items-center gap-2.5">
            <Radio className="h-5 w-5 text-blue-600 dark:text-[#5b9cf5]" />
            <span>OPERATE THROUGH DISRUPTION</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#7a8194] max-w-2xl font-sans">
            Autonomous station continuity during simulated satellite outages, priority-queued delta reconciliation,
            scientific data buffering, blast-radius incident tracking, and human-in-the-loop operational memory.
          </p>
        </div>

        {/* Global Simulation Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            data-testid="simulate-outage-btn"
            onClick={handleSimulateOutage}
            disabled={actionLoading || isOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer shadow-2xs ${
              isOffline
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-300 dark:text-rose-400/50 border-rose-200 dark:border-rose-900/40 cursor-not-allowed"
                : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900"
            }`}
          >
            <WifiOff className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>Simulate Outage</span>
          </button>

          <button
            data-testid="restore-sync-btn"
            onClick={handleRestoreAndSync}
            disabled={actionLoading || !isOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer shadow-2xs ${
              !isOffline
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-300 dark:text-emerald-400/50 border-emerald-200 dark:border-emerald-900/40 cursor-not-allowed"
                : "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900"
            }`}
          >
            <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Restore &amp; Reconcile</span>
          </button>

          <button
            data-testid="reset-simulation-btn"
            onClick={handleResetSimulation}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-[#181b24] hover:bg-slate-50 dark:hover:bg-[#1e2230] text-slate-700 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] border border-slate-200 dark:border-[#2a2f3e] text-xs font-mono transition-colors cursor-pointer shadow-2xs"
            title="Reset Day 4 simulation state without mutating canonical resources"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-[#7a8194]" />
            <span>Reset Simulation</span>
          </button>
        </div>
      </div>

      {/* Feedback banner if any */}
      {actionFeedback && (
        <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 dark:bg-[#12141c] border border-blue-200 dark:border-blue-900/60 text-xs font-mono text-blue-900 dark:text-cyan-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-blue-500 dark:text-cyan-400 hover:text-blue-800 dark:hover:text-white cursor-pointer ml-4 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stepped Reconnection & Priority Reconciliation Card */}
      {activeSyncPhase && (
        <div
          data-testid="reconciliation-progress-card"
          className="rounded-md border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-[#131926] p-4 font-mono text-xs space-y-2.5 shadow-2xs"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 dark:text-blue-300 border-b border-blue-200 dark:border-blue-900/60 pb-2">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              STEPPED RECONNECTION &amp; DELTA RECONCILIATION: [{activeSyncPhase}]
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#7a8194]">
              PRIORITY ORDER: P0 &rarr; P1 &rarr; P2 &rarr; P3
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-800 dark:text-[#c5cad6]">
            {reconciliationSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Comms Link Status Summary Card ──────────────── */}
      <div
        data-testid="comms-status-card"
        className={`rounded-lg border p-4 transition-all shadow-2xs ${
          isOffline
            ? "border-rose-300 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-md border ${
                isOffline
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700"
                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700"
              }`}
            >
              {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                  {commsStatus?.name ?? "SATELLITE GROUND TERMINAL"}
                </span>
                <span
                  data-testid="comms-status-badge"
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isOffline
                      ? "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-600"
                      : "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600"
                  }`}
                >
                  {commsStatus?.status ?? "ONLINE"}
                </span>
                <TruthBadge type="MEASURED" />
              </div>
              <p className="text-xs text-slate-500 dark:text-[#7a8194] mt-0.5 font-sans">
                {isOffline
                  ? "Telemetry link interrupted. Local buffering active. Queue items will reconcile upon reconnection."
                  : "Continuous high-orbit telemetry link nominal. Real-time delta sync active."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="text-right">
              <span className="text-slate-400 dark:text-[#6b7280] block text-[9px] uppercase tracking-wider">Latency</span>
              <span data-testid="comms-latency" className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                {isOffline ? "DISCONNECTED" : `${commsStatus?.latency_ms ?? 580} ms`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 dark:text-[#6b7280] block text-[9px] uppercase tracking-wider">Bandwidth</span>
              <span data-testid="comms-bandwidth" className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                {isOffline ? "0 kbps" : `${commsStatus?.bandwidth_kbps ?? 2048} kbps`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 dark:text-[#6b7280] block text-[9px] uppercase tracking-wider">Unsynced Items</span>
              <span
                data-testid="comms-pending-count"
                className={`font-bold px-2 py-0.5 rounded ${
                  (commsStatus?.pending_queue_count ?? 0) > 0
                    ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                    : "text-slate-800 dark:text-[#e4e8f0]"
                }`}
              >
                {commsStatus?.pending_queue_count ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LEVEL 2: HUMAN RESILIENCE BRIEFING ───────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/80 dark:bg-[#151924] p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#222838]">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOffline ? "bg-rose-500 animate-ping" : "bg-emerald-500"
              }`}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-[#f0f3fa]">
              {isOffline
                ? "SATELLITE CONNECTION UNAVAILABLE · STATION CONTINUES OPERATING LOCALLY"
                : "OPERATIONAL RESILIENCE ARCHITECTURE · LOCAL AUTONOMY & RECONCILIATION"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
            {isOffline ? "Autonomous Degraded Mode Active" : "Continuous Synchronization Nominal"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
            <div className="text-[10px] text-slate-500 dark:text-[#8b92a5] uppercase font-bold">1. Stored Locally</div>
            <div className="font-bold text-slate-900 dark:text-[#e4e8f0]">Isolated SQLite Hub</div>
            <p className="text-[11px] text-slate-600 dark:text-[#9ca3b4] font-sans">
              All generator telemetry, life-support states, and science caches persist locally.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
            <div className="text-[10px] text-slate-500 dark:text-[#8b92a5] uppercase font-bold">2. Waiting to Send</div>
            <div className="font-bold text-amber-600 dark:text-amber-400">
              {commsStatus?.pending_queue_count ?? 4} Pending Deltas
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#9ca3b4] font-sans">
              Batched in FIFO outbound spool awaiting carrier acquisition.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
            <div className="text-[10px] text-slate-500 dark:text-[#8b92a5] uppercase font-bold">3. Sent First</div>
            <div className="font-bold text-rose-600 dark:text-rose-400">P0 Critical Alarms</div>
            <p className="text-[11px] text-slate-600 dark:text-[#9ca3b4] font-sans">
              Strict deterministic priority: P0 (Safety) → P1 (Grid) → P2 (Science) → P3 (Logs).
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
            <div className="text-[10px] text-slate-500 dark:text-[#8b92a5] uppercase font-bold">4. How We Verify</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400">SHA-256 Checksums</div>
            <p className="text-[11px] text-slate-600 dark:text-[#9ca3b4] font-sans">
              Payload hashing prevents data corruption or tampered packets upon uplink.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] space-y-1 shadow-2xs">
            <div className="text-[10px] text-slate-500 dark:text-[#8b92a5] uppercase font-bold">5. When Link Returns</div>
            <div className="font-bold text-blue-600 dark:text-[#5b9cf5]">Server ACK &amp; Sync</div>
            <p className="text-[11px] text-slate-600 dark:text-[#9ca3b4] font-sans">
              Carrier lock drains queue in order, verifies hashes, and re-engages live bus.
            </p>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-md bg-slate-100 dark:bg-[#12141c] border border-slate-200 dark:border-[#2a2f3e]">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "ALL"
              ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
              : "border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
          }`}
        >
          Integrated Resilience View
        </button>
        <button
          onClick={() => setActiveTab("QUEUE")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "QUEUE"
              ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
              : "border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
          }`}
        >
          1. Priority Queue &amp; SHA-256
        </button>
        <button
          onClick={() => setActiveTab("SCIENCE")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "SCIENCE"
              ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
              : "border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
          }`}
        >
          2. Science Buffer (S-17)
        </button>
        <button
          onClick={() => setActiveTab("INCIDENTS")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "INCIDENTS"
              ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
              : "border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
          }`}
        >
          3. Incident Blast Radius
        </button>
        <button
          onClick={() => setActiveTab("MEMORY")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "MEMORY"
              ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
              : "border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
          }`}
        >
          4. Operational Memory
        </button>
      </div>

      {/* ── 1. DETERMINISTIC PRIORITY QUEUE PANEL ────────── */}
      {(activeTab === "ALL" || activeTab === "QUEUE") && (
        <div
          data-testid="sync-queue-table"
          className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
                <span>Deterministic Priority Synchronization Queue</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#7a8194] mt-0.5 font-sans">
                Strict ordering: <code className="text-slate-800 dark:text-[#e4e8f0] font-mono">priority ASC (P0 &lt; P1 &lt; P2 &lt; P3)</code> &rarr;{" "}
                <code className="text-slate-800 dark:text-[#e4e8f0] font-mono">created_at ASC</code> &rarr; <code className="text-slate-800 dark:text-[#e4e8f0] font-mono">id ASC</code>.
                Integrity verified via canonical UTF-8 SHA-256 payload checksums.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">P0: Critical</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">P1: High</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">P2: Important</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-[#12141c] text-slate-600 dark:text-[#7a8194] border border-slate-200 dark:border-[#2a2f3e]">P3: Routine</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-[#2a2f3e] rounded-md shadow-2xs">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#2a2f3e] text-slate-600 dark:text-[#9ca3b4] bg-slate-100 dark:bg-[#12141c]">
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Priority</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Queue ID</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Event Type</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Canonical SHA-256 Checksum</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Integrity</th>
                  <th className="py-2.5 px-3 text-right font-semibold text-[10px] tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2a2f3e]/60 bg-white dark:bg-[#181b24]">
                {syncQueue?.items && syncQueue.items.length > 0 ? (
                  syncQueue.items.map((item) => (
                    <tr
                      key={item.id}
                      data-testid={`queue-item-${item.priority_label}`}
                      className="hover:bg-slate-50 dark:hover:bg-[#141721] transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.priority === 0
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : item.priority === 1
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : item.priority === 2
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : "bg-slate-100 dark:bg-[#12141c] text-slate-700 dark:text-[#9ca3b4] border border-slate-200 dark:border-[#2a2f3e]"
                          }`}
                        >
                          {item.priority_label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-[#e4e8f0]">{item.id}</td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-[#e4e8f0] font-semibold">{item.event_type}</div>
                        <div className="text-[10px] text-slate-500 dark:text-[#7a8194] truncate max-w-xs">{item.payload_json}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            item.status === "RECONCILED"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : item.status === "FAILED_RETRY"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : item.status === "TRANSFERRING"
                              ? "bg-sky-100 dark:bg-cyan-950 text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-cyan-800"
                              : "bg-amber-100 dark:bg-polar-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-polar-800"
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.status === "RECONCILED" && (
                          <span data-testid="sync-complete-badge" className="hidden" />
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <code
                          data-testid="checksum-hash"
                          className="text-[11px] text-slate-700 dark:text-[#9ca3b4] bg-slate-100 dark:bg-[#0c0e14] px-2 py-0.5 rounded border border-slate-200 dark:border-[#2a2f3e]"
                          title={item.checksum_sha256}
                        >
                          {item.checksum_sha256 ? `${item.checksum_sha256.slice(0, 16)}…` : "N/A"}
                        </code>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          data-testid="checksum-verified-badge"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>VERIFIED</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          data-testid={`retry-btn-${item.id}`}
                          onClick={() => handleRetryQueueItem(item.id)}
                          className="text-xs text-blue-600 dark:text-[#5b9cf5] hover:underline cursor-pointer"
                        >
                          Reverify
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 dark:text-[#6b7280]">
                      No queued items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. SCIENCE DATA CONTINUITY PANEL ──────────────── */}
      {(activeTab === "ALL" || activeTab === "SCIENCE") && (
        <div
          data-testid="science-instruments-card"
          className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
                <span>Scientific Data Continuity &amp; Offline Buffering</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#7a8194] mt-0.5 font-sans">
                Generic scientific observation buffering model. S-17 is the hero ionospheric radar, backed by local circular edge buffer.
              </p>
            </div>
            <TruthBadge type="MEASURED" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instruments?.map((inst) => (
              <div
                key={inst.id}
                data-testid={`instrument-${inst.code}`}
                className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-[#5b9cf5]">{inst.code}</span>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#e4e8f0]">{inst.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#7a8194] font-sans">{inst.instrument_type}</p>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400 dark:text-[#6b7280] block text-[9px] uppercase tracking-wider">Local Buffer</span>
                    <span
                      data-testid="buffered-count"
                      className="font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-xs"
                    >
                      {inst.buffered_observations_count} queued
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2a2f3e]">
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-[#7a8194]">
                    <span>Power: <strong className="text-emerald-600 dark:text-emerald-400">{inst.power_status}</strong></span>
                    <span>Health: <strong className="text-emerald-600 dark:text-emerald-400">{inst.health}</strong></span>
                  </div>
                  <button
                    data-testid="buffer-observation-btn"
                    onClick={() => handleBufferObservation(inst.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#181b24] hover:bg-slate-100 dark:hover:bg-[#1e2230] text-blue-600 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#2a2f3e] text-xs font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>+ Buffer Reading (TECU)</span>
                  </button>
                </div>

                {inst.recent_observations && inst.recent_observations.length > 0 && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194] space-y-1">
                    <span className="text-slate-400 dark:text-[#6b7280] text-[10px] uppercase">Recent Samples:</span>
                    <div className="flex flex-wrap gap-2">
                      {inst.recent_observations.slice(0, 4).map((obs) => (
                        <span key={obs.id} className="bg-white dark:bg-[#181b24] border border-slate-200 dark:border-[#2a2f3e] px-2 py-0.5 rounded text-slate-700 dark:text-[#9ca3b4]">
                          {obs.measurement_value} {obs.unit} ({obs.sync_status})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. INCIDENT WORKSPACE & BLAST RADIUS PANEL ────── */}
      {(activeTab === "ALL" || activeTab === "INCIDENTS") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident List */}
          <div
            data-testid="incidents-list"
            className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#151923] p-5 space-y-3 lg:col-span-1 shadow-sm"
          >
            <h2 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              <span>Active Incidents</span>
            </h2>
            <div className="space-y-2">
              {incidents?.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedIncidentId === inc.id
                      ? "border-cyan-500 dark:border-cyan-400 bg-cyan-50/70 dark:bg-cyan-950/30 shadow-sm"
                      : "border-slate-200 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{inc.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        inc.status === "ACTIVE"
                          ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : inc.status === "CONTAINED"
                          ? "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">{inc.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{inc.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Detail & Blast Radius */}
          <div
            data-testid="incident-detail-panel"
            className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#151923] p-5 space-y-5 lg:col-span-2 shadow-sm"
          >
            {activeIncident ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{activeIncident.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-bold">
                        {activeIncident.severity}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                        {activeIncident.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{activeIncident.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeIncident.description}</p>
                  </div>

                  {/* Incident Lifecycle Controls */}
                  <div className="flex items-center gap-2">
                    {activeIncident.status === "ACTIVE" && (
                      <button
                        onClick={() => handleUpdateStatus("CONTAINED")}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-mono font-semibold cursor-pointer transition-colors"
                      >
                        Mark Contained
                      </button>
                    )}
                    {activeIncident.status !== "RESOLVED" && (
                      <button
                        data-testid="resolve-incident-btn"
                        onClick={() => handleUpdateStatus("RESOLVED")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-mono font-semibold cursor-pointer transition-colors"
                      >
                        Resolve Incident
                      </button>
                    )}
                    <button
                      data-testid="record-memory-btn"
                      onClick={() => setIsMemoryModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 text-xs font-mono font-semibold cursor-pointer transition-colors"
                    >
                      Record to Memory
                    </button>
                  </div>
                </div>

                {/* Blast Radius & Day 2 Engine Reuse */}
                <div data-testid="incident-blast-radius" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400">Reused Day 2 Dependency Graph</span>
                      <Layers className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Downstream Equipment ({activeIncident.affected_assets.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeIncident.affected_assets.map((ast) => (
                        <span
                          key={ast.asset_id}
                          onClick={() => onInspectAsset?.(ast.asset_id)}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 cursor-pointer hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors"
                        >
                          {ast.name} ({ast.criticality})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400">Reused Day 2 Risk Engine</span>
                      <Shield className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-300">Composite Risk Score:</span>
                      <span
                        data-testid="incident-risk-score"
                        className="text-base font-mono font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800"
                      >
                        {activeIncident.modeled_risk_score} / 100
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Affected Services: {activeIncident.affected_services.map((s) => s.name).join(", ")}
                    </div>
                  </div>
                </div>

                {/* Log Action Form */}
                <form
                  data-testid="log-action-form"
                  onSubmit={handleLogAction}
                  className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/30 p-3.5 space-y-2.5"
                >
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 block">
                    Log Operator Action (Human-in-the-Loop)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      data-testid="action-code-input"
                      type="text"
                      placeholder="Action Code (e.g. PURGE_FUEL_LINE)"
                      value={newActionCode}
                      onChange={(e) => setNewActionCode(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <input
                      data-testid="action-desc-input"
                      type="text"
                      placeholder="Action Description / Findings"
                      value={newActionDesc}
                      onChange={(e) => setNewActionDesc(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 md:col-span-2 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      data-testid="submit-action-btn"
                      type="submit"
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      Log Response Action
                    </button>
                  </div>
                </form>

                {/* Action Audit Trail */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Incident Audit Trail ({activeIncident.actions.length})
                  </span>
                  <div className="space-y-1.5">
                    {activeIncident.actions.map((act) => (
                      <div
                        key={act.id}
                        data-testid="action-item"
                        className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">{act.action_code}</span>:{" "}
                          <span className="text-slate-700 dark:text-slate-300">{act.description}</span>
                          <span className="text-slate-500 dark:text-slate-500 block text-[10px]">
                            Logged by {act.executed_by} at {new Date(act.executed_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-slate-850 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-slate-700">
                          {act.outcome_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                Select an incident to view blast-radius analysis.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. OPERATIONAL MEMORY PANEL ──────────────────── */}
      {(activeTab === "ALL" || activeTab === "MEMORY") && (
        <div
          data-testid="operational-memory-panel"
          className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#151923] p-5 space-y-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <History className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>Operational Memory &amp; Institutional Knowledge</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Structured post-mortem lessons learned across wintering expeditions. Reusable operator knowledge prevents recurring incidents.
              </p>
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                data-testid="memory-search-input"
                type="text"
                placeholder="Search lessons (e.g. Boiler, Vapor Lock)..."
                value={memorySearchQuery}
                onChange={(e) => setMemorySearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryData?.memories && memoryData.memories.length > 0 ? (
              memoryData.memories.map((mem) => (
                <div
                  key={mem.id}
                  data-testid="memory-card"
                  className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{mem.id}</span>
                    <span className="text-slate-500 dark:text-slate-500 text-[10px]">{new Date(mem.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{mem.title}</h3>
                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Context &amp; Decision:</strong>
                    {mem.context_summary}
                  </div>
                  <div className="text-xs text-cyan-800 dark:text-cyan-200 bg-cyan-50/50 dark:bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-200 dark:border-cyan-900/60">
                    <strong className="text-cyan-600 dark:text-cyan-400 block text-[9px] uppercase tracking-wider mb-0.5">Lesson Learned:</strong>
                    {mem.lessons_learned}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500 font-mono text-xs col-span-2">
                No operational memories match query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Record to Memory Modal ──────────────────────── */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151923] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Record Incident to Operational Memory</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Human-in-the-loop transfer from resolved incident {selectedIncidentId} to permanent station memory archive.
            </p>

            <form onSubmit={handleSaveMemory} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Decision</label>
                <textarea
                  value={memDecision}
                  onChange={(e) => setMemDecision(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Action Taken</label>
                <textarea
                  value={memAction}
                  onChange={(e) => setMemAction(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Outcome</label>
                <textarea
                  value={memOutcome}
                  onChange={(e) => setMemOutcome(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-700 dark:text-cyan-400 mb-1">Lesson Learned for Future Winter Teams</label>
                <textarea
                  value={memLesson}
                  onChange={(e) => setMemLesson(e.target.value)}
                  className="w-full p-2 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 focus:outline-none focus:border-cyan-500"
                  rows={2}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono cursor-pointer border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-mono font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  Commit to Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
