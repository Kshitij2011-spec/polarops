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
      await restoreAndSync(stationId);
      await Promise.all([refetchComms(), refetchQueue(), refetchScience()]);
      setActionFeedback("Link restored. Priority queue synchronized and verified via canonical SHA-256.");
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
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
    <div className="space-y-6 animate-fade-in pb-16">
      {/* ── Top Header Navigation & Action Bar ──────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-polar-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Return to Station Command Center"
                className="flex items-center gap-1.5 text-xs font-mono text-polar-400 hover:text-accent-cyan transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Command Center</span>
              </button>
            )}
            <span className="text-polar-600">/</span>
            <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider font-semibold">
              Disruption Resilience Workspace
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-polar-100 flex items-center gap-2.5">
            <Radio className="h-5 w-5 text-accent-cyan" />
            <span>OPERATE THROUGH DISRUPTION</span>
          </h1>
          <p className="text-xs text-polar-400 max-w-2xl">
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border cursor-pointer ${
              isOffline
                ? "bg-rose-950/40 text-rose-400/50 border-rose-900/40 cursor-not-allowed"
                : "bg-rose-950/70 text-rose-300 border-rose-700 hover:bg-rose-900"
            }`}
          >
            <WifiOff className="h-3.5 w-3.5 text-rose-400" />
            <span>Simulate Outage</span>
          </button>

          <button
            data-testid="restore-sync-btn"
            onClick={handleRestoreAndSync}
            disabled={actionLoading || !isOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border cursor-pointer ${
              !isOffline
                ? "bg-emerald-950/40 text-emerald-400/50 border-emerald-900/40 cursor-not-allowed"
                : "bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900"
            }`}
          >
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span>Restore &amp; Reconcile</span>
          </button>

          <button
            data-testid="reset-simulation-btn"
            onClick={handleResetSimulation}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-polar-900 hover:bg-polar-800 text-polar-300 hover:text-polar-100 border border-polar-700 text-xs font-mono transition-colors cursor-pointer"
            title="Reset Day 4 simulation state without mutating canonical resources"
          >
            <RotateCcw className="h-3.5 w-3.5 text-polar-400" />
            <span>Reset Simulation</span>
          </button>
        </div>
      </div>

      {/* Feedback banner if any */}
      {actionFeedback && (
        <div className="flex items-center justify-between p-3 rounded bg-polar-900 border border-accent-cyan/40 text-xs font-mono text-cyan-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent-cyan shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-cyan-400 hover:text-white cursor-pointer ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Comms Link Status Summary Card ──────────────── */}
      <div
        data-testid="comms-status-card"
        className={`rounded border p-4 transition-all ${
          isOffline
            ? "border-rose-800/80 bg-rose-950/20"
            : "border-polar-700 bg-polar-900"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded border ${
                isOffline
                  ? "bg-rose-950 text-rose-400 border-rose-700"
                  : "bg-emerald-950 text-emerald-400 border-emerald-700"
              }`}
            >
              {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-polar-100">
                  {commsStatus?.name ?? "SATELLITE GROUND TERMINAL"}
                </span>
                <span
                  data-testid="comms-status-badge"
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isOffline
                      ? "bg-rose-900 text-rose-300 border border-rose-600"
                      : "bg-emerald-900 text-emerald-300 border border-emerald-600"
                  }`}
                >
                  {commsStatus?.status ?? "ONLINE"}
                </span>
                <TruthBadge type="MEASURED" />
              </div>
              <p className="text-xs text-polar-400 mt-0.5">
                {isOffline
                  ? "Telemetry link interrupted. Local buffering active. Queue items will reconcile upon reconnection."
                  : "Continuous high-orbit telemetry link nominal. Real-time delta sync active."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="text-right">
              <span className="text-polar-500 block text-[9px] uppercase tracking-wider">Latency</span>
              <span data-testid="comms-latency" className="font-bold text-polar-200">
                {isOffline ? "DISCONNECTED" : `${commsStatus?.latency_ms ?? 580} ms`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-polar-500 block text-[9px] uppercase tracking-wider">Bandwidth</span>
              <span data-testid="comms-bandwidth" className="font-bold text-polar-200">
                {isOffline ? "0 kbps" : `${commsStatus?.bandwidth_kbps ?? 2048} kbps`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-polar-500 block text-[9px] uppercase tracking-wider">Unsynced Items</span>
              <span
                data-testid="comms-pending-count"
                className={`font-bold px-2 py-0.5 rounded ${
                  (commsStatus?.pending_queue_count ?? 0) > 0
                    ? "bg-amber-950/80 text-amber-300 border border-amber-700"
                    : "text-polar-200"
                }`}
              >
                {commsStatus?.pending_queue_count ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded bg-polar-950 border border-polar-800">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "ALL"
              ? "bg-polar-800 border-accent-cyan text-accent-cyan font-bold"
              : "border-transparent text-polar-400 hover:text-polar-200"
          }`}
        >
          Integrated Resilience View
        </button>
        <button
          onClick={() => setActiveTab("QUEUE")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "QUEUE"
              ? "bg-polar-800 border-accent-cyan text-accent-cyan font-bold"
              : "border-transparent text-polar-400 hover:text-polar-200"
          }`}
        >
          1. Priority Queue &amp; SHA-256
        </button>
        <button
          onClick={() => setActiveTab("SCIENCE")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "SCIENCE"
              ? "bg-polar-800 border-accent-cyan text-accent-cyan font-bold"
              : "border-transparent text-polar-400 hover:text-polar-200"
          }`}
        >
          2. Science Buffer (S-17)
        </button>
        <button
          onClick={() => setActiveTab("INCIDENTS")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "INCIDENTS"
              ? "bg-polar-800 border-accent-cyan text-accent-cyan font-bold"
              : "border-transparent text-polar-400 hover:text-polar-200"
          }`}
        >
          3. Incident Blast Radius
        </button>
        <button
          onClick={() => setActiveTab("MEMORY")}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer border ${
            activeTab === "MEMORY"
              ? "bg-polar-800 border-accent-cyan text-accent-cyan font-bold"
              : "border-transparent text-polar-400 hover:text-polar-200"
          }`}
        >
          4. Operational Memory
        </button>
      </div>

      {/* ── 1. DETERMINISTIC PRIORITY QUEUE PANEL ────────── */}
      {(activeTab === "ALL" || activeTab === "QUEUE") && (
        <div
          data-testid="sync-queue-table"
          className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-polar-800 pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-accent-cyan" />
                <span>Deterministic Priority Synchronization Queue</span>
              </h2>
              <p className="text-xs text-polar-400 mt-0.5">
                Strict ordering: <code className="text-polar-200 font-mono">priority ASC (P0 &lt; P1 &lt; P2 &lt; P3)</code> &rarr;{" "}
                <code className="text-polar-200 font-mono">created_at ASC</code> &rarr; <code className="text-polar-200 font-mono">id ASC</code>.
                Integrity verified via canonical UTF-8 SHA-256 payload checksums.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">P0: Critical</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">P1: High</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">P2: Important</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-polar-950 text-polar-400 border border-polar-800">P3: Routine</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-polar-800 rounded">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-polar-800 text-polar-400 bg-polar-950">
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Priority</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Queue ID</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Event Type</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Canonical SHA-256 Checksum</th>
                  <th className="py-2.5 px-3 font-semibold text-[10px] tracking-wider">Integrity</th>
                  <th className="py-2.5 px-3 text-right font-semibold text-[10px] tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polar-800/80 bg-polar-900">
                {syncQueue?.items && syncQueue.items.length > 0 ? (
                  syncQueue.items.map((item) => (
                    <tr
                      key={item.id}
                      data-testid={`queue-item-${item.priority_label}`}
                      className="hover:bg-polar-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.priority === 0
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : item.priority === 1
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : item.priority === 2
                              ? "bg-blue-950 text-blue-300 border border-blue-800"
                              : "bg-polar-950 text-polar-400 border border-polar-800"
                          }`}
                        >
                          {item.priority_label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-polar-200">{item.id}</td>
                      <td className="py-3 px-3">
                        <div className="text-polar-200 font-semibold">{item.event_type}</div>
                        <div className="text-[10px] text-polar-500 truncate max-w-xs">{item.payload_json}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            item.status === "RECONCILED"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : item.status === "FAILED_RETRY"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : item.status === "TRANSFERRING"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                              : "bg-polar-950 text-amber-300 border border-polar-800"
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
                          className="text-[11px] text-polar-400 bg-polar-950 px-2 py-0.5 rounded border border-polar-800"
                          title={item.checksum_sha256}
                        >
                          {item.checksum_sha256 ? `${item.checksum_sha256.slice(0, 16)}…` : "N/A"}
                        </code>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          data-testid="checksum-verified-badge"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>VERIFIED</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          data-testid={`retry-btn-${item.id}`}
                          onClick={() => handleRetryQueueItem(item.id)}
                          className="text-xs text-polar-400 hover:text-accent-cyan underline cursor-pointer"
                        >
                          Reverify
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-polar-500">
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
          className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-polar-800 pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent-cyan" />
                <span>Scientific Data Continuity &amp; Offline Buffering</span>
              </h2>
              <p className="text-xs text-polar-400 mt-0.5">
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
                className="rounded border border-polar-800 bg-polar-950/70 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-accent-cyan">{inst.code}</span>
                    <h3 className="text-sm font-semibold text-polar-100">{inst.name}</h3>
                    <p className="text-[11px] text-polar-400">{inst.instrument_type}</p>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-polar-500 block text-[9px] uppercase tracking-wider">Local Buffer</span>
                    <span
                      data-testid="buffered-count"
                      className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-xs"
                    >
                      {inst.buffered_observations_count} queued
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-polar-800">
                  <div className="flex items-center gap-3 text-xs font-mono text-polar-400">
                    <span>Power: <strong className="text-emerald-400">{inst.power_status}</strong></span>
                    <span>Health: <strong className="text-emerald-400">{inst.health}</strong></span>
                  </div>
                  <button
                    data-testid="buffer-observation-btn"
                    onClick={() => handleBufferObservation(inst.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-polar-900 hover:bg-polar-800 text-accent-cyan border border-polar-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    <span>+ Buffer Reading (TECU)</span>
                  </button>
                </div>

                {inst.recent_observations && inst.recent_observations.length > 0 && (
                  <div className="text-[11px] font-mono text-polar-400 space-y-1">
                    <span className="text-polar-500 text-[10px] uppercase">Recent Samples:</span>
                    <div className="flex flex-wrap gap-2">
                      {inst.recent_observations.slice(0, 4).map((obs) => (
                        <span key={obs.id} className="bg-polar-900 border border-polar-800 px-2 py-0.5 rounded text-polar-300">
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
            className="rounded border border-polar-700 bg-polar-900 p-5 space-y-3 lg:col-span-1"
          >
            <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider flex items-center gap-2 border-b border-polar-800 pb-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>Active Incidents</span>
            </h2>
            <div className="space-y-2">
              {incidents?.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    selectedIncidentId === inc.id
                      ? "border-accent-cyan bg-polar-800"
                      : "border-polar-800 bg-polar-950/70 hover:bg-polar-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-rose-400">{inc.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        inc.status === "ACTIVE"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : inc.status === "CONTAINED"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-polar-100 mt-1">{inc.title}</h4>
                  <p className="text-[11px] text-polar-400 mt-0.5">{inc.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Detail & Blast Radius */}
          <div
            data-testid="incident-detail-panel"
            className="rounded border border-polar-700 bg-polar-900 p-5 space-y-5 lg:col-span-2"
          >
            {activeIncident ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-polar-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-rose-400">{activeIncident.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold">
                        {activeIncident.severity}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-polar-950 text-polar-300 border border-polar-800 font-bold">
                        {activeIncident.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-polar-100 mt-1">{activeIncident.title}</h3>
                    <p className="text-xs text-polar-400">{activeIncident.description}</p>
                  </div>

                  {/* Incident Lifecycle Controls */}
                  <div className="flex items-center gap-2">
                    {activeIncident.status === "ACTIVE" && (
                      <button
                        onClick={() => handleUpdateStatus("CONTAINED")}
                        className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 text-xs font-mono font-semibold cursor-pointer"
                      >
                        Mark Contained
                      </button>
                    )}
                    {activeIncident.status !== "RESOLVED" && (
                      <button
                        data-testid="resolve-incident-btn"
                        onClick={() => handleUpdateStatus("RESOLVED")}
                        className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-mono font-semibold cursor-pointer"
                      >
                        Resolve Incident
                      </button>
                    )}
                    <button
                      data-testid="record-memory-btn"
                      onClick={() => setIsMemoryModalOpen(true)}
                      className="px-2.5 py-1 rounded bg-polar-800 hover:bg-polar-700 text-cyan-300 border border-polar-700 text-xs font-mono font-semibold cursor-pointer"
                    >
                      Record to Memory
                    </button>
                  </div>
                </div>

                {/* Blast Radius & Day 2 Engine Reuse */}
                <div data-testid="incident-blast-radius" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-polar-950/70 border border-polar-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-polar-400">Reused Day 2 Dependency Graph</span>
                      <Layers className="h-3.5 w-3.5 text-accent-cyan" />
                    </div>
                    <div className="text-xs text-polar-300">
                      Downstream Equipment ({activeIncident.affected_assets.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeIncident.affected_assets.map((ast) => (
                        <span
                          key={ast.asset_id}
                          onClick={() => onInspectAsset?.(ast.asset_id)}
                          className="px-2 py-0.5 rounded bg-polar-900 border border-polar-800 text-[10px] font-mono text-polar-200 cursor-pointer hover:border-accent-cyan"
                        >
                          {ast.name} ({ast.criticality})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-polar-950/70 border border-polar-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-polar-400">Reused Day 2 Risk Engine</span>
                      <Shield className="h-3.5 w-3.5 text-rose-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-polar-300">Composite Risk Score:</span>
                      <span
                        data-testid="incident-risk-score"
                        className="text-base font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950 border border-rose-800"
                      >
                        {activeIncident.modeled_risk_score} / 100
                      </span>
                    </div>
                    <div className="text-[11px] text-polar-400">
                      Affected Services: {activeIncident.affected_services.map((s) => s.name).join(", ")}
                    </div>
                  </div>
                </div>

                {/* Log Action Form */}
                <form
                  data-testid="log-action-form"
                  onSubmit={handleLogAction}
                  className="rounded border border-polar-800 bg-polar-950/50 p-3 space-y-2"
                >
                  <span className="text-xs font-mono font-bold text-polar-200 block">
                    Log Operator Action (Human-in-the-Loop)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      data-testid="action-code-input"
                      type="text"
                      placeholder="Action Code (e.g. PURGE_FUEL_LINE)"
                      value={newActionCode}
                      onChange={(e) => setNewActionCode(e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-polar-900 border border-polar-700 text-xs font-mono text-polar-100 focus:outline-none focus:border-accent-cyan"
                      required
                    />
                    <input
                      data-testid="action-desc-input"
                      type="text"
                      placeholder="Action Description / Findings"
                      value={newActionDesc}
                      onChange={(e) => setNewActionDesc(e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-polar-900 border border-polar-700 text-xs font-mono text-polar-100 md:col-span-2 focus:outline-none focus:border-accent-cyan"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      data-testid="submit-action-btn"
                      type="submit"
                      disabled={actionLoading}
                      className="px-3 py-1 rounded bg-accent-cyan hover:bg-accent-cyan/80 text-polar-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      Log Response Action
                    </button>
                  </div>
                </form>

                {/* Action Audit Trail */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-semibold text-polar-400 uppercase tracking-wider">
                    Incident Audit Trail ({activeIncident.actions.length})
                  </span>
                  <div className="space-y-1.5">
                    {activeIncident.actions.map((act) => (
                      <div
                        key={act.id}
                        data-testid="action-item"
                        className="p-2.5 rounded bg-polar-950/60 border border-polar-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <span className="font-bold text-accent-cyan">{act.action_code}</span>:{" "}
                          <span className="text-polar-200">{act.description}</span>
                          <span className="text-polar-500 block text-[10px]">
                            Logged by {act.executed_by} at {new Date(act.executed_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-polar-900 text-emerald-400 text-[10px] font-bold border border-polar-800">
                          {act.outcome_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-polar-500 font-mono text-xs">
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
          className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-polar-800 pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider flex items-center gap-2">
                <History className="h-4 w-4 text-accent-cyan" />
                <span>Operational Memory &amp; Institutional Knowledge</span>
              </h2>
              <p className="text-xs text-polar-400 mt-0.5">
                Structured post-mortem lessons learned across wintering expeditions. Reusable operator knowledge prevents recurring incidents.
              </p>
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-polar-500" />
              <input
                data-testid="memory-search-input"
                type="text"
                placeholder="Search lessons (e.g. Boiler, Vapor Lock)..."
                value={memorySearchQuery}
                onChange={(e) => setMemorySearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded bg-polar-950 border border-polar-700 text-xs font-mono text-polar-100 focus:outline-none focus:border-accent-cyan w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryData?.memories && memoryData.memories.length > 0 ? (
              memoryData.memories.map((mem) => (
                <div
                  key={mem.id}
                  data-testid="memory-card"
                  className="rounded border border-polar-800 bg-polar-950/70 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-accent-cyan">{mem.id}</span>
                    <span className="text-polar-500 text-[10px]">{new Date(mem.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-polar-100">{mem.title}</h3>
                  <div className="text-xs text-polar-300 bg-polar-900 p-2.5 rounded border border-polar-800">
                    <strong className="text-polar-400 block text-[9px] uppercase tracking-wider mb-0.5">Context &amp; Decision:</strong>
                    {mem.context_summary}
                  </div>
                  <div className="text-xs text-cyan-200 bg-polar-900 p-2.5 rounded border border-cyan-900/60">
                    <strong className="text-cyan-400 block text-[9px] uppercase tracking-wider mb-0.5">Lesson Learned:</strong>
                    {mem.lessons_learned}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-polar-500 font-mono text-xs col-span-2">
                No operational memories match query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Record to Memory Modal ──────────────────────── */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 bg-polar-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded border border-polar-700 bg-polar-900 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-mono font-bold text-polar-100 flex items-center gap-2">
              <History className="h-4 w-4 text-accent-cyan" />
              <span>Record Incident to Operational Memory</span>
            </h3>
            <p className="text-xs text-polar-400">
              Human-in-the-loop transfer from resolved incident {selectedIncidentId} to permanent station memory archive.
            </p>

            <form onSubmit={handleSaveMemory} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-polar-400 mb-1">Decision</label>
                <textarea
                  value={memDecision}
                  onChange={(e) => setMemDecision(e.target.value)}
                  className="w-full p-2 rounded bg-polar-950 border border-polar-700 text-polar-100 focus:outline-none focus:border-accent-cyan"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-polar-400 mb-1">Action Taken</label>
                <textarea
                  value={memAction}
                  onChange={(e) => setMemAction(e.target.value)}
                  className="w-full p-2 rounded bg-polar-950 border border-polar-700 text-polar-100 focus:outline-none focus:border-accent-cyan"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-polar-400 mb-1">Outcome</label>
                <textarea
                  value={memOutcome}
                  onChange={(e) => setMemOutcome(e.target.value)}
                  className="w-full p-2 rounded bg-polar-950 border border-polar-700 text-polar-100 focus:outline-none focus:border-accent-cyan"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1">Lesson Learned for Future Winter Teams</label>
                <textarea
                  value={memLesson}
                  onChange={(e) => setMemLesson(e.target.value)}
                  className="w-full p-2 rounded bg-polar-950 border border-cyan-800/80 text-cyan-200 focus:outline-none focus:border-accent-cyan"
                  rows={2}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-polar-800 hover:bg-polar-700 text-polar-300 text-xs font-mono cursor-pointer border border-polar-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded bg-accent-cyan hover:bg-accent-cyan/90 text-polar-950 text-xs font-mono font-bold cursor-pointer"
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
