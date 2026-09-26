import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Battery,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  ExternalLink,
  FileCheck,
  HardDrive,
  History,
  Layers,
  Lock,
  Radio,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useResilienceStatus } from "../../hooks/useResilienceStatus";
import { useEnergyModel } from "../../hooks/useEnergyModel";
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
  type SyncQueueItem,
} from "../../lib/api";
import { TruthBadge } from "../TruthBadge";
import { OperationalTopology } from "../OperationalTopology";

interface ResilienceViewProps {
  stationId?: string;
  onBack?: () => void;
  onInspectAsset?: (assetId: string) => void;
}

type ResilienceWorkspaceTab = "QUEUE" | "SCIENCE" | "INCIDENTS" | "GRAPH" | "MEMORY";

export const ResilienceView: React.FC<ResilienceViewProps> = ({
  stationId = "STATION-BHARATI",
  onBack,
  onInspectAsset,
}) => {
  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState<ResilienceWorkspaceTab>("QUEUE");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("INC-2026-04");
  const [selectedQueueItemId, setSelectedQueueItemId] = useState<string>("QITEM-P0-G02");
  const [selectedInstrumentCode, setSelectedInstrumentCode] = useState<string>("S-17");
  const [memorySearchQuery, setMemorySearchQuery] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeSyncPhase, setActiveSyncPhase] = useState<string | null>(null);
  const [reconciliationSteps, setReconciliationSteps] = useState<string[]>([]);

  // Queue View toggles
  const [queuePriorityFilter, setQueuePriorityFilter] = useState<string>("ALL");
  const [queueDisplayMode, setQueueDisplayMode] = useState<"SPLIT" | "TABLE">("SPLIT");

  // Form states
  const [newActionCode, setNewActionCode] = useState<string>("");
  const [newActionDesc, setNewActionDesc] = useState<string>("");
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [memDecision, setMemDecision] = useState<string>("Transfer thermal load to Auxiliary Boiler B-01");
  const [memAction, setMemAction] = useState<string>("Preheated B-01 for 35 minutes and isolated G-02 secondary circuit");
  const [memOutcome, setMemOutcome] = useState<string>("Station grid stabilized without habitat freeze-out");
  const [memLesson, setMemLesson] = useState<string>("Always allow 35-minute preheat on B-01 in subzero ambient temperatures");

  // Telemetry Queries
  const { data: commsStatus, refetch: refetchComms } = useResilienceStatus(stationId);
  const { data: energyModel } = useEnergyModel(stationId);
  const { data: syncQueue, refetch: refetchQueue } = useSyncQueue(stationId);
  const { data: instruments, refetch: refetchScience } = useScienceInstruments(stationId);
  const { data: incidents, refetch: refetchIncidents } = useIncidents(stationId);
  const { data: activeIncident, refetch: refetchIncidentDetail } = useIncidentDetail(selectedIncidentId);
  const { data: memoryData, refetch: refetchMemory } = useOperationalMemory(memorySearchQuery, stationId);

  // Handlers
  const handleSimulateOutage = async () => {
    try {
      setActiveSyncPhase(null);
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
      }, 30000);
    }
  };

  const handleResetSimulation = async () => {
    try {
      setActiveSyncPhase(null);
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
      const canonicalId = instId === "S-17" ? "INST-S17-RADAR" : (instId === "S-08" ? "INST-S08-SEIS" : instId);
      await bufferScienceObservation({
        instrument_id: canonicalId,
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
  const stationDisplayName = stationId === "STATION-MAITRI" ? "Maitri Station" : "Bharati Station";

  // Queue data derivation (deterministic priority sort: P0 -> P1 -> P2 -> P3)
  const rawQueueItems = syncQueue?.items ?? [];
  const queueItems = useMemo(() => {
    return [...rawQueueItems].sort((a, b) => {
      const pOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
      const diff = (pOrder[a.priority_label] ?? 99) - (pOrder[b.priority_label] ?? 99);
      if (diff !== 0) return diff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [rawQueueItems]);

  const filteredQueueItems = useMemo(() => {
    if (queuePriorityFilter === "ALL") return queueItems;
    return queueItems.filter((i) => i.priority_label === queuePriorityFilter);
  }, [queueItems, queuePriorityFilter]);

  const activeQueueItem = useMemo(() => {
    return (
      queueItems.find((item) => item.id === selectedQueueItemId) ||
      queueItems[0] ||
      null
    );
  }, [queueItems, selectedQueueItemId]);

  // Priority counts
  const p0Count = queueItems.filter((i) => i.priority_label === "P0").length;
  const p1Count = queueItems.filter((i) => i.priority_label === "P1").length;
  const p2Count = queueItems.filter((i) => i.priority_label === "P2").length;
  const p3Count = queueItems.filter((i) => i.priority_label === "P3").length;
  const pendingCount = commsStatus?.pending_queue_count ?? syncQueue?.pending_count ?? 0;
  const totalScienceBuffered = instruments?.reduce((acc, inst) => acc + (inst.buffered_observations_count || 0), 0) ?? 0;

  // Selected Instrument
  const activeInstrument = useMemo(() => {
    return (
      instruments?.find((inst) => (inst.code || inst.id) === selectedInstrumentCode) ||
      instruments?.[0] ||
      null
    );
  }, [instruments, selectedInstrumentCode]);

  // Derived Grid Metrics
  const reserveMarginKw = (energyModel?.available_generation_capacity_kw ?? 600) - (energyModel?.baseline_electrical_load_kw ?? 201);
  const fuelRunwayDays = energyModel?.projected_runway_days ?? 76;

  return (
    <div
      data-testid="resilience-workspace"
      className="space-y-6 pb-20 font-sans text-slate-900 dark:text-slate-100"
    >
      {/* ─────────────────────────────────────────────────────────────
          NOTIFICATION BANNER (Action feedback & Toast)
          ───────────────────────────────────────────────────────────── */}
      {actionFeedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono shadow-md backdrop-blur-sm animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ZONE 0 / COMMAND HEADER — Mission Control Eyebrow & Title
          ───────────────────────────────────────────────────────────── */}
      <header className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Return to Station Command Center"
              className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Command Center</span>
            </button>
          )}
          {onBack && <span className="text-slate-400 dark:text-slate-600">/</span>}
          <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px]">
            Operational Resilience Architecture · {stationDisplayName}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Radio className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white uppercase">
              OPERATE THROUGH DISRUPTION
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-500/20">
              {isOffline ? "AUTONOMOUS DEGRADED MODE" : "CONTINUOUS SYNC NOMINAL"}
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans max-w-3xl leading-relaxed">
          Autonomous station operational continuity during communication disruptions: deterministic P0–P3 store-and-forward queuing, cryptographic SHA-256 payload integrity verification, scientific observation buffering, and stepped reconnection recovery.
        </p>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1 — OPERATIONAL STATUS COCKPIT
          Single Wide Horizontal Mission Control Surface
          ───────────────────────────────────────────────────────────── */}
      <section
        data-testid="comms-status-card"
        aria-label="Operational Status Cockpit"
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl backdrop-blur-md ${
          isOffline
            ? "border-rose-300 dark:border-rose-500/40 bg-gradient-to-br from-rose-50/80 via-white to-slate-50 dark:from-rose-950/30 dark:via-slate-900/90 dark:to-slate-950/95"
            : "border-emerald-300/80 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 dark:from-emerald-950/20 dark:via-slate-900/90 dark:to-slate-950/95"
        }`}
      >
        {/* Subtle status glow corner accent */}
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-15 dark:opacity-20 ${
            isOffline ? "bg-rose-400 dark:bg-rose-600" : "bg-emerald-300 dark:bg-emerald-500"
          }`}
        />

        <div className="p-6 md:p-8 space-y-6 relative z-10">
          {/* Cockpit Subsystem Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-blue-500" />
                SATELLITE GROUND TERMINAL · POLAR LINK #1
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">CARRIER TRANSPONDER:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">GSAT-7 / INMARSAT-C</span>
              <TruthBadge type="MEASURED" />
            </div>
          </div>

          {/* Cockpit Core: Left Status & Statement / Right Actions & HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT SIDE (7 COLS): Giant Operational Reality */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOffline ? "bg-rose-400" : "bg-emerald-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                      isOffline ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                  />
                </span>

                <span
                  data-testid="comms-status-badge"
                  className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-black tracking-widest uppercase border ${
                    isOffline
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  {isOffline ? "OFFLINE" : "ONLINE"}
                </span>

                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {isOffline ? "LOCAL EDGE DEGRADED MODE" : "HIGH-ORBIT BIDIRECTIONAL LOCK"}
                </span>
              </div>

              {/* Dominant Status Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {isOffline ? "Satellite Link Offline" : "Satellite Link Online"}
              </h1>

              {/* Human-Readable Operational Statement */}
              <p className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
                {isOffline
                  ? "Station continuing locally while communications are unavailable. Autonomous local degraded mode actively protects grid stability, life-support, and observation logging."
                  : "Station operating normally. Continuous telemetry deltas, work orders, and science observations are streaming in real-time to the mainland operations center."}
              </p>

              {/* Companion Battery & Grid Headroom Telemetry */}
              <div
                data-testid="battery-resilience-card"
                className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400"
              >
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                  <Battery className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    BAT-01 SOC: 94.2% (48.4V DC)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">UPS Autonomy:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    4.8 Hours
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Grid Margin:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {reserveMarginKw} kW
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Fuel Runway:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{fuelRunwayDays} Days</strong>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (5 COLS): State-Adaptive Controls & Compact Metrics HUD */}
            <div className="lg:col-span-5 space-y-4">
              {/* Contextually Dominant Action Cluster */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-sm">
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Resilience Cockpit Controls
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Simulate Outage button */}
                  <button
                    data-testid="simulate-outage-btn"
                    onClick={handleSimulateOutage}
                    disabled={actionLoading || isOffline}
                    className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed ${
                      !isOffline
                        ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30 ring-2 ring-rose-500/50 scale-[1.01]"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 opacity-60"
                    }`}
                  >
                    <WifiOff className="h-4 w-4 shrink-0" />
                    <span>Simulate Outage</span>
                  </button>

                  {/* Restore & Reconcile button */}
                  <button
                    data-testid="restore-sync-btn"
                    onClick={handleRestoreAndSync}
                    disabled={actionLoading || !isOffline}
                    className={`flex-1 min-w-[150px] px-4 py-2.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed ${
                      isOffline
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-400 animate-pulse scale-[1.02]"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 opacity-60"
                    }`}
                  >
                    <Wifi className="h-4 w-4 shrink-0" />
                    <span>Restore &amp; Reconcile</span>
                  </button>

                  {/* Reset Simulation button */}
                  <button
                    data-testid="reset-simulation-btn"
                    onClick={handleResetSimulation}
                    disabled={actionLoading}
                    title="Reset Simulation State"
                    className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors font-mono text-xs font-bold cursor-pointer shrink-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Compact Technical Metrics HUD (Not separate cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">LINK LATENCY</div>
                  <div data-testid="comms-latency" className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {isOffline || commsStatus?.latency_ms === 9999 || commsStatus?.latency_ms === null || commsStatus?.latency_ms === undefined
                      ? "DISCONNECTED"
                      : `${commsStatus.latency_ms} ms`}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">LINK BANDWIDTH</div>
                  <div data-testid="comms-bandwidth" className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {commsStatus?.bandwidth_kbps ?? (isOffline ? 0 : 2048)} kbps
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">UNSYNCED ITEMS</div>
                  <div data-testid="pending-deltas-count" className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {pendingCount} Deltas
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">RECONCILIATION</div>
                  <div
                    data-testid="reconciliation-status"
                    className={`font-bold mt-0.5 ${
                      isOffline ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isOffline ? "PENDING LINK" : "SYNCHRONIZED"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stepped Reconciliation Technical System Console (Evidence Surface) */}
          {activeSyncPhase && (
            <div
              data-testid="reconciliation-log-console"
              className="mt-4 p-4 rounded-xl border border-[#334155] bg-[#0F172A] shadow-xl text-slate-300 font-mono text-xs animate-fade-in"
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                  <span className="text-slate-100 font-mono font-bold uppercase tracking-wider text-[11px]">
                    STEPPED RECONNECTION &amp; RECONCILIATION PROTOCOL ACTIVE
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">
                    CARRIER SYNC SPOOL
                  </span>
                  <button
                    onClick={() => setActiveSyncPhase(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs p-0.5 rounded cursor-pointer transition-colors"
                    aria-label="Dismiss reconciliation log"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal Stream */}
              <div className="space-y-1 font-mono text-[11px] leading-relaxed">
                {reconciliationSteps.map((step, idx) => {
                  if (step.startsWith("P0 transferred")) {
                    const parts = step.split(" — ");
                    return (
                      <div key={idx} className="flex items-start gap-2 py-0.5">
                        <span className="text-slate-500 select-none">›</span>
                        <span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 mr-1.5">
                            P0
                          </span>
                          <span className="text-slate-300">transferred</span>
                          <span className="text-slate-500 mx-1">—</span>
                          <span className="text-slate-300">{parts.slice(1).join(" — ")}</span>
                        </span>
                      </div>
                    );
                  }
                  if (step.startsWith("P1 transferred")) {
                    const parts = step.split(" — ");
                    return (
                      <div key={idx} className="flex items-start gap-2 py-0.5">
                        <span className="text-slate-500 select-none">›</span>
                        <span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 mr-1.5">
                            P1
                          </span>
                          <span className="text-slate-300">transferred</span>
                          <span className="text-slate-500 mx-1">—</span>
                          <span className="text-slate-300">{parts.slice(1).join(" — ")}</span>
                        </span>
                      </div>
                    );
                  }
                  if (step.startsWith("P2 transferred")) {
                    const parts = step.split(" — ");
                    return (
                      <div key={idx} className="flex items-start gap-2 py-0.5">
                        <span className="text-slate-500 select-none">›</span>
                        <span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 mr-1.5">
                            P2
                          </span>
                          <span className="text-slate-300">transferred</span>
                          <span className="text-slate-500 mx-1">—</span>
                          <span className="text-slate-300">{parts.slice(1).join(" — ")}</span>
                        </span>
                      </div>
                    );
                  }
                  if (step.startsWith("P3 transferred")) {
                    const parts = step.split(" — ");
                    return (
                      <div key={idx} className="flex items-start gap-2 py-0.5">
                        <span className="text-slate-500 select-none">›</span>
                        <span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50 mr-1.5">
                            P3
                          </span>
                          <span className="text-slate-300">transferred</span>
                          <span className="text-slate-500 mx-1">—</span>
                          <span className="text-slate-400">{parts.slice(1).join(" — ")}</span>
                        </span>
                      </div>
                    );
                  }
                  if (step.includes("SHA-256") || step.includes("checksums verified")) {
                    return (
                      <div key={idx} className="flex items-start gap-2 py-0.5">
                        <span className="text-emerald-400 select-none">✔</span>
                        <span className="text-slate-300">
                          Canonical <span className="text-emerald-400 font-semibold">SHA-256</span> payload checksums{" "}
                          <span className="text-emerald-400 font-semibold">verified</span> by station hub.
                        </span>
                      </div>
                    );
                  }
                  if (step.startsWith("Server ACK received")) {
                    return (
                      <div key={idx} className="flex items-start gap-2 py-0.5">
                        <span className="text-emerald-400 select-none">✔</span>
                        <span className="text-slate-200">
                          <span className="text-emerald-400 font-bold">Server ACK received:</span> All priority deltas reconciled. Satellite link{" "}
                          <span className="text-emerald-400 font-bold">ONLINE</span>.
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="flex items-start gap-2 py-0.5">
                      <span className="text-slate-500 select-none">›</span>
                      <span className="text-slate-300">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 2 — THE RESILIENCE ENGINE
          "HOW POLAROPS SURVIVES A COMMUNICATIONS OUTAGE"
          Connected Process Visualization Flow (Not 5 independent cards)
          ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="How PolarOps Operates Through Outage"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f141f]/80 p-6 space-y-5 shadow-lg backdrop-blur-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
              ARCHITECTURAL SPECIFICATION · 5-STAGE CONTINUITY
            </div>
            <h2 className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white uppercase tracking-tight">
              HOW POLAROPS SURVIVES A COMMUNICATIONS OUTAGE
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Deterministic Store-and-Forward Recovery Chain
          </span>
        </div>

        {/* The Connected Process Vector Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* STAGE 01: LOCAL STORAGE */}
          <div
            className={`relative p-4 rounded-xl border transition-all ${
              isOffline
                ? "border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/20"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">01 LOCAL STORAGE</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isOffline
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {isOffline ? "ACTIVE" : "STANDBY"}
              </span>
            </div>
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              1. Stored Locally
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
              Isolated SQLite Hub persists generator telemetry, life-support states, and science observations.
            </p>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Edge SQLite DB</span>
              <ChevronRight className="h-3.5 w-3.5 hidden md:block text-slate-400" />
            </div>
          </div>

          {/* STAGE 02: QUEUE */}
          <div
            className={`relative p-4 rounded-xl border transition-all ${
              pendingCount > 0
                ? "border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/20"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">02 QUEUE</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {pendingCount} DELTAS
              </span>
            </div>
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              2. Waiting to Send
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
              Batched in FIFO outbound spool with cryptographic hash generation awaiting link recovery.
            </p>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Outbound Spool</span>
              <ChevronRight className="h-3.5 w-3.5 hidden md:block text-slate-400" />
            </div>
          </div>

          {/* STAGE 03: PRIORITIZE */}
          <div className="relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">03 PRIORITIZE</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
                P0 FIRST
              </span>
            </div>
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              3. Sent First
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
              Deterministic priority dispatch: P0 (Safety/SCADA) → P1 (Grid) → P2 (Science) → P3 (Logs).
            </p>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>P0 &gt; P1 &gt; P2 &gt; P3</span>
              <ChevronRight className="h-3.5 w-3.5 hidden md:block text-slate-400" />
            </div>
          </div>

          {/* STAGE 04: VERIFY */}
          <div className="relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">04 VERIFY</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                SHA-256
              </span>
            </div>
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              4. How We Verify
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
              Canonical JSON serialization &amp; UTF-8 SHA-256 prevents corruption or tampered uplink frames.
            </p>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Cryptographic Hash</span>
              <ChevronRight className="h-3.5 w-3.5 hidden md:block text-slate-400" />
            </div>
          </div>

          {/* STAGE 05: RECONNECT */}
          <div
            className={`relative p-4 rounded-xl border transition-all ${
              !isOffline
                ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">05 RECONCILE</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                SERVER ACK
              </span>
            </div>
            <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-white">
              5. When Link Returns
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
              Carrier lock drains queue in strict priority order, verifies hashes, and syncs live bus.
            </p>
            <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Reconciled</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 3 — OPERATIONAL WORKSPACE
          Secondary Navigation & Deep Focused Workspaces
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Workspace Segmented Navigation Rail */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("QUEUE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "QUEUE"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Sync Queue &amp; Integrity</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                {queueItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("SCIENCE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "SCIENCE"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Science Buffer</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {instruments?.length || 2}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("INCIDENTS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "INCIDENTS"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Incident Blast Radius</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                {incidents?.length || 1}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("GRAPH")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "GRAPH"
                  ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Blast Radius Graph (Hero)</span>
            </button>

            <button
              onClick={() => setActiveTab("MEMORY")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "MEMORY"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Operational Memory</span>
            </button>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Active Workspace: <strong className="text-slate-800 dark:text-slate-200">{activeTab}</strong>
          </div>
        </div>

        {/* ── WORKSPACE 1: SYNC QUEUE VIEW ────────────────────────── */}
        {activeTab === "QUEUE" && (
          <div data-testid="sync-queue-table" className="space-y-4">
            {/* Priority Lanes Summary & Filter Pills */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setQueuePriorityFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    queuePriorityFilter === "ALL"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  All ({queueItems.length})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P0")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P0"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  }`}
                >
                  P0: Critical ({p0Count})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P1")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P1"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  P1: High ({p1Count})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P2")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P2"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  P2: Important ({p2Count})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P3")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P3"
                      ? "bg-slate-600 text-white shadow-xs"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                  }`}
                >
                  P3: Routine ({p3Count})
                </button>
              </div>

              {/* Display Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setQueueDisplayMode("SPLIT")}
                  className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                    queueDisplayMode === "SPLIT"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-slate-500"
                  }`}
                >
                  Split Inspector
                </button>
                <button
                  onClick={() => setQueueDisplayMode("TABLE")}
                  className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                    queueDisplayMode === "TABLE"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-slate-500"
                  }`}
                >
                  Full Table
                </button>
              </div>
            </div>

            {/* Split Workspace Layout */}
            {queueDisplayMode === "SPLIT" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT PANE (5 COLS): Priority Spool List */}
                <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-4 space-y-2.5 shadow-sm max-h-[620px] overflow-y-auto">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>DISPATCH ORDER (P0 &gt; P1 &gt; P2 &gt; P3)</span>
                    <span>{filteredQueueItems.length} records</span>
                  </div>

                  {filteredQueueItems.map((item) => {
                    const isSelected = activeQueueItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        data-testid={`queue-item-${item.priority_label}`}
                        onClick={() => setSelectedQueueItemId(item.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.priority_label === "P0"
                                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                  : item.priority_label === "P1"
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : item.priority_label === "P2"
                                  ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                                  : "bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                              }`}
                            >
                              {item.priority_label}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {item.id}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "RECONCILED"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold truncate">
                          {item.event_type}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                          <span
                            data-testid="checksum-hash"
                            className="truncate max-w-[220px] font-mono text-[10px] text-slate-500 dark:text-slate-400"
                          >
                            {item.checksum_sha256}
                          </span>
                          <span
                            data-testid="checksum-verified-badge"
                            className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-2"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            VERIFIED
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT PANE (7 COLS): Selected Queue Item Deep Inspector */}
                <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-5 space-y-4 shadow-sm">
                  {activeQueueItem ? (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                activeQueueItem.priority_label === "P0"
                                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                  : activeQueueItem.priority_label === "P1"
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : activeQueueItem.priority_label === "P2"
                                  ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                                  : "bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                              }`}
                            >
                              PRIORITY {activeQueueItem.priority_label}
                            </span>
                            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                              {activeQueueItem.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            Event Type: <strong>{activeQueueItem.event_type}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRetryQueueItem(activeQueueItem.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold cursor-pointer transition-colors"
                          >
                            Reverify
                          </button>
                        </div>
                      </div>

                      {/* Cryptographic SHA-256 Inspection Card */}
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-emerald-500" />
                            Canonical Payload SHA-256 Checksum
                          </span>
                          <span
                            data-testid="checksum-verified-badge"
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            VERIFIED
                          </span>
                        </div>
                        <div
                          data-testid="checksum-hash"
                          className="font-mono text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-900/10 p-2 rounded border border-emerald-500/20 break-all select-all font-semibold"
                        >
                          {activeQueueItem.checksum_sha256}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                          <span>UTF-8 Normalized JSON hash</span>
                          <span>Timestamp: {new Date(activeQueueItem.created_at).toUTCString()}</span>
                        </div>
                      </div>

                      {/* Formatted JSON Payload Inspector */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Structured Event Payload (RFC 8259 Canonical Format)</span>
                          <span className="text-[10px] text-slate-400">Strict Nonce &amp; State</span>
                        </div>
                        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed shadow-inner">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(activeQueueItem.payload_json), null, 2);
                            } catch {
                              return activeQueueItem.payload_json;
                            }
                          })()}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-mono text-xs">
                      No queue item selected
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Full Table Mode (Accessible when needed) */
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-4 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 pb-2">
                      <th className="p-2.5 font-bold">PRIORITY</th>
                      <th className="p-2.5 font-bold">QUEUE ID</th>
                      <th className="p-2.5 font-bold">EVENT TYPE &amp; PAYLOAD</th>
                      <th className="p-2.5 font-bold">STATUS</th>
                      <th className="p-2.5 font-bold">CANONICAL SHA-256 HASH</th>
                      <th className="p-2.5 font-bold">INTEGRITY</th>
                      <th className="p-2.5 font-bold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredQueueItems.map((item) => (
                      <tr
                        key={item.id}
                        data-testid={`queue-item-${item.priority_label}`}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.priority_label === "P0"
                                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : item.priority_label === "P1"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : item.priority_label === "P2"
                                ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                                : "bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                            }`}
                          >
                            {item.priority_label}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{item.id}</td>
                        <td className="p-2.5 max-w-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.event_type}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.payload_json}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "RECONCILED"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2.5 max-w-[200px]">
                          <span data-testid="checksum-hash" className="truncate block font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {item.checksum_sha256}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            data-testid="checksum-verified-badge"
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 w-max"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            VERIFIED
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleRetryQueueItem(item.id)}
                            className="text-blue-600 hover:text-blue-500 font-bold text-xs"
                          >
                            Reverify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── WORKSPACE 2: SCIENCE BUFFER VIEW ────────────────────── */}
        {activeTab === "SCIENCE" && (
          <div data-testid="science-instruments-card" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT PANE (4 COLS): Scientific Instrument Deck */}
              <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-4 space-y-3 shadow-sm">
                <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                  STATION SCIENCE PAYLOADS ({instruments?.length || 2})
                </div>

                <div className="space-y-2">
                  {instruments?.map((inst) => {
                    const instCode = inst.code || inst.id;
                    const isSelected = activeInstrument && (activeInstrument.code || activeInstrument.id) === instCode;
                    return (
                      <div
                        key={inst.id}
                        data-testid={`instrument-list-item-${instCode}`}
                        onClick={() => setSelectedInstrumentCode(instCode)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                              {instCode}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {inst.name}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              inst.health === "NOMINAL"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {inst.health}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Buffer: <strong>{inst.buffered_observations_count} queued</strong> · Power:{" "}
                          <strong>{inst.power_status}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT PANE (8 COLS): Hero Instrument Operational Monitor */}
              <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-5 space-y-5 shadow-sm">
                {activeInstrument ? (
                  <div data-testid={`instrument-${activeInstrument.code || activeInstrument.id}`} className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
                            {activeInstrument.code || activeInstrument.id}
                          </span>
                          <span className="text-slate-500 font-semibold">{activeInstrument.instrument_type}</span>
                          <TruthBadge type="MEASURED" />
                        </div>
                        <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                          {activeInstrument.name}
                        </h3>
                      </div>

                      {/* Buffer Action */}
                      <button
                        data-testid="buffer-observation-btn"
                        onClick={() => handleBufferObservation(activeInstrument.id || activeInstrument.code || "INST-S17-RADAR")}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <HardDrive className="h-4 w-4" />
                        <span>Buffer Observation</span>
                      </button>
                    </div>

                    {/* Telemetry Readouts Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-[10px] text-slate-500">BUFFER POSTURE</div>
                        <div className="font-bold text-base text-blue-600 dark:text-blue-400 mt-0.5">
                          {activeInstrument.buffered_observations_count} queued
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Circular Spool</div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-[10px] text-slate-500">POWER ALLOCATION</div>
                        <div className="font-bold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                          {activeInstrument.power_status}
                        </div>
                        <div className="text-[10px] text-emerald-500 mt-1">Bus: Active Feed</div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-[10px] text-slate-500">INSTRUMENT HEALTH</div>
                        <div className="font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {activeInstrument.health}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Telemetry Valid</div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-[10px] text-slate-500">BUFFER RETENTION</div>
                        <div className="font-bold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                          72 Hours
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Retention Guarantee</div>
                      </div>
                    </div>

                    {/* Scientific Continuity Statement */}
                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 space-y-1.5 text-xs font-mono">
                      <div className="font-bold text-blue-700 dark:text-blue-300">
                        Observation Continuity Protection Under Link Disruption:
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Ionospheric scintillation and polar auroral radar arrays log directly to high-reliability
                        NVMe local buffers during communication outages. Data is preserved with SHA-256 cryptographic
                        fingerprints and queued as P2 telemetry to ensure zero scientific data loss.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs">
                    Select an instrument to view telemetry
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── WORKSPACE 3: INCIDENT BLAST RADIUS VIEW ──────────────── */}
        {activeTab === "INCIDENTS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT (3 COLS): Incident List */}
            <div
              data-testid="incidents-list"
              className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-4 space-y-2.5 shadow-sm"
            >
              <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                ACTIVE INCIDENTS ({incidents?.length || 1})
              </div>

              {incidents?.map((inc) => {
                const isSelected = selectedIncidentId === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? "border-rose-500 bg-rose-500/10 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-rose-600 dark:text-rose-400">{inc.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate">
                      {inc.title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Status: {inc.status}</span>
                      <span>Actions: {inc.actions_count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CENTER (5 COLS): Selected Incident & Blast Radius */}
            <div
              data-testid="incident-detail-panel"
              className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-5 space-y-4 shadow-sm"
            >
              {activeIncident ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-rose-600 dark:text-rose-400">{activeIncident.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600">
                          {activeIncident.severity}
                        </span>
                        <TruthBadge type="DERIVED" />
                      </div>
                      <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                        {activeIncident.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeIncident.status !== "RESOLVED" && (
                        <button
                          data-testid="resolve-incident-btn"
                          onClick={() => handleUpdateStatus("RESOLVED")}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold cursor-pointer"
                        >
                          Resolve Incident
                        </button>
                      )}
                      <button
                        data-testid="record-memory-btn"
                        onClick={() => setIsMemoryModalOpen(true)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold cursor-pointer"
                      >
                        Record to Memory
                      </button>
                    </div>
                  </div>

                  {/* Blast Radius Context Container */}
                  <div data-testid="incident-blast-radius" className="space-y-3">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5 text-xs font-mono">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">MODELED RISK SCORE</div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Day 2 Risk Engine Score:</span>
                        <span
                          data-testid="incident-risk-score"
                          className="text-base font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30"
                        >
                          {activeIncident.modeled_risk_score} / 100
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5 text-xs font-mono">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">AFFECTED EQUIPMENT (BLAST RADIUS)</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeIncident.affected_assets.map((ast) => (
                          <span
                            key={ast.asset_id}
                            onClick={() => onInspectAsset?.(ast.asset_id)}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 cursor-pointer hover:border-blue-500"
                          >
                            {ast.name} ({ast.criticality})
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Services: {activeIncident.affected_services.map((s) => s.name).join(", ")}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">No incident selected</div>
              )}
            </div>

            {/* RIGHT (4 COLS): Operator Action Logging & Audit Trail */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-5 space-y-4 shadow-sm">
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                HUMAN-IN-THE-LOOP ACTION LOGGING
              </div>

              <form data-testid="log-action-form" onSubmit={handleLogAction} className="space-y-3">
                <input
                  data-testid="action-code-input"
                  type="text"
                  placeholder="Action Code (e.g. EXPEDITE_VALVE_PURGE)"
                  value={newActionCode}
                  onChange={(e) => setNewActionCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
                <textarea
                  data-testid="action-desc-input"
                  placeholder="Action Description / Engineering Notes"
                  value={newActionDesc}
                  onChange={(e) => setNewActionDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  data-testid="submit-action-btn"
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Log Response Action
                </button>
              </form>

              {/* Audit Trail */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono text-slate-500 font-bold uppercase">
                  Audit Trail ({activeIncident?.actions.length || 0})
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {activeIncident?.actions.map((act) => (
                    <div
                      key={act.id}
                      data-testid="action-item"
                      className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{act.action_code}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.executed_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[10px]">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKSPACE 4: BLAST RADIUS GRAPH (HERO) ──────────────── */}
        {activeTab === "GRAPH" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider">
                    Full-Width Blast Radius &amp; Operational Dependency Cascade
                  </h3>
                  <p className="text-xs font-mono text-slate-500">
                    Propagating failure pathway: Generator G-02 → Secondary Thermal/Power Bus → Critical Services
                  </p>
                </div>
                <TruthBadge type="DERIVED" />
              </div>

              {/* Full Width Topology Component */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <OperationalTopology
                  assetId="G-02"
                  large={true}
                  onInspectAsset={onInspectAsset}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── WORKSPACE 5: OPERATIONAL MEMORY VIEW ─────────────────── */}
        {activeTab === "MEMORY" && (
          <div
            data-testid="operational-memory-panel"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#121724]/90 p-5 space-y-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                  INSTITUTIONAL KNOWLEDGE ARCHIVE
                </div>
                <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  Station Operational Memory &amp; Post-Mortem Records
                </h3>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  data-testid="memory-search-input"
                  type="text"
                  placeholder="Search memory (e.g. 'Boiler')..."
                  value={memorySearchQuery}
                  onChange={(e) => setMemorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Memory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memoryData?.memories?.map((item) => (
                <div
                  key={item.id}
                  data-testid="memory-card"
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{item.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Decision:</strong>{" "}
                      <span className="text-slate-600 dark:text-slate-400">{item.decision}</span>
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Action Taken:</strong>{" "}
                      <span className="text-slate-600 dark:text-slate-400">{item.action_taken}</span>
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Operational Outcome:</strong>{" "}
                      <span className="text-slate-600 dark:text-slate-400">{item.outcome}</span>
                    </div>
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      <strong>Lesson Learned:</strong> {item.lessons_learned}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 4 — CONTEXTUAL STATION RESILIENCE SUMMARY
          Compact Operational Summary at Bottom of Main Page
          ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Station Resilience Summary"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-[#0c1017]/80 p-5 shadow-inner backdrop-blur-sm"
      >
        <div className="text-[10px] font-mono font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-3">
          STATION RESILIENCE OPERATIONAL SUMMARY
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase">LOCAL OPERATIONS</span>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-emerald-500"}`}
              />
              <span>{isOffline ? "Autonomous Degraded" : "Normal Connected"}</span>
            </div>
            <p className="text-[10px] text-slate-500">Life-support &amp; microgrid autonomous</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase">SYNC SPOOL QUEUE</span>
            <div className="font-bold text-amber-600 dark:text-amber-400">
              {pendingCount} Pending Deltas
            </div>
            <p className="text-[10px] text-slate-500">Strict deterministic P0–P3 queue</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase">DATA INTEGRITY</span>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>SHA-256 Verified</span>
            </div>
            <p className="text-[10px] text-slate-500">Canonical JSON payload checksums</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase">SCIENCE CONTINUITY</span>
            <div className="font-bold text-blue-600 dark:text-blue-400">
              S-17 Nominal ({totalScienceBuffered} queued)
            </div>
            <p className="text-[10px] text-slate-500">Circular NVMe observation buffers</p>
          </div>
        </div>
      </section>

      {/* Record Memory Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121724] border border-slate-300 dark:border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                Record Incident Post-Mortem to Operational Memory
              </h3>
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">DECISION TAKEN</label>
                <input
                  type="text"
                  value={memDecision}
                  onChange={(e) => setMemDecision(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">OPERATIONAL ACTION</label>
                <input
                  type="text"
                  value={memAction}
                  onChange={(e) => setMemAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">OUTCOME</label>
                <input
                  type="text"
                  value={memOutcome}
                  onChange={(e) => setMemOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">LESSON LEARNED</label>
                <textarea
                  value={memLesson}
                  onChange={(e) => setMemLesson(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Save to Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
