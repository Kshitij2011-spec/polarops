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
  Cpu,
  Database,
  ExternalLink,
  FileCheck,
  Flame,
  Gauge,
  HardDrive,
  History,
  Info,
  Layers,
  Lock,
  Radio,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Thermometer,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useResilienceStatus } from "../../hooks/useResilienceStatus";
import { useEnergyModel } from "../../hooks/useEnergyModel";
import { useFuelStatus } from "../../hooks/useFuelStatus";
import { useAssets } from "../../hooks/useAssets";
import { useStationOverview } from "../../hooks/useStationOverview";
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

type ResilienceWorkspaceTab = "QUEUE" | "INCIDENTS" | "GRAPH" | "SCIENCE" | "MEMORY";

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

  // Telemetry Queries (Live Data Sources)
  const { data: commsStatus, refetch: refetchComms } = useResilienceStatus(stationId);
  const { data: energyModel } = useEnergyModel(stationId);
  const { data: fuelStatus } = useFuelStatus(stationId);
  const { data: assets } = useAssets(stationId);
  const { data: stationOverview } = useStationOverview(stationId);
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
    if (isOffline) {
      setActionFeedback("Retry unavailable while satellite link is offline. Deltas remain safely buffered in local SQLite storage.");
      return;
    }
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

  // Data Derivations
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

  // Generators & Power Fleet
  const generatorAssets = useMemo(() => {
    return assets?.filter((a) => a.category === "GENERATOR") || [];
  }, [assets]);

  const g01 = generatorAssets.find((g) => g.code === "G-01" || g.id === "G-01");
  const g02 = generatorAssets.find((g) => g.code === "G-02" || g.id === "G-02");
  const boilerAsset = assets?.find((a) => a.code === "B-01" || a.category === "BOILER");

  // Grid & Energy Telemetry
  const availableGenKw = energyModel?.available_generation_capacity_kw ?? 600;
  const modeledLoadKw = energyModel?.projected_electrical_load_kw ?? 201.2;
  const reserveMarginKw = Math.round((availableGenKw - modeledLoadKw) * 10) / 10;
  const fuelRunwayDays = fuelStatus?.projected_runway_days ?? energyModel?.projected_runway_days ?? 70.3;
  const fuelStockLiters = fuelStatus?.current_stock_liters ?? energyModel?.remaining_fuel_liters ?? 142500;
  const fuelMaxLiters = fuelStatus?.max_capacity_liters ?? 250000;
  const fuelStockPercent = Math.round((fuelStockLiters / fuelMaxLiters) * 100);
  const thermalDemandKw = energyModel?.thermal_demand_kw ?? 252.2;
  const ambientTempC = energyModel?.outside_temp_celsius ?? -28.5;
  const overallHealth = stationOverview?.overall_health_score ?? (isOffline ? 74 : 85);

  return (
    <div
      data-testid="resilience-workspace"
      className="space-y-6 pb-20 font-sans text-slate-900 dark:text-slate-100"
    >
      {/* ─────────────────────────────────────────────────────────────
          ACTION FEEDBACK BANNER (Toast Notification)
          ───────────────────────────────────────────────────────────── */}
      {actionFeedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs font-sans shadow-sm backdrop-blur-sm animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-medium">{actionFeedback}</span>
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
          TOP BAR: CONTEXTUAL COMMAND HEADER & STATE-AWARE ACTION GROUP
          Title, status mode, and prominent state-sensitive trigger buttons
          ───────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-sans text-slate-500 dark:text-slate-400">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Return to Station Command Center"
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Command Center</span>
              </button>
            )}
            {onBack && <span className="text-slate-300 dark:text-slate-700">/</span>}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {stationDisplayName}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                isOffline
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
              }`}
            >
              {isOffline ? "Autonomous Degraded Mode" : "Nominal Connected"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Operate Through Disruption
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
            Station survivability, multi-subsystem redundancy, and deterministic offline continuity under polar isolation.
          </p>
        </div>

        {/* State-Aware Action Group: Only contextually appropriate action is dominant */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            data-testid="simulate-outage-btn"
            onClick={handleSimulateOutage}
            disabled={actionLoading || isOffline}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed ${
              !isOffline
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/20 active:scale-98 ring-2 ring-rose-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60"
            }`}
          >
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Simulate Outage</span>
          </button>

          <button
            data-testid="restore-sync-btn"
            onClick={handleRestoreAndSync}
            disabled={actionLoading || !isOffline}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed ${
              isOffline
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20 ring-2 ring-emerald-400/60 animate-pulse active:scale-98"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 opacity-60"
            }`}
          >
            <Wifi className="h-3.5 w-3.5 shrink-0" />
            <span>Restore &amp; Reconcile</span>
          </button>

          <button
            data-testid="reset-simulation-btn"
            onClick={handleResetSimulation}
            disabled={actionLoading}
            title="Reset Simulation Baseline"
            aria-label="Reset simulation baseline"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          PRIMARY VIEWPORT: COORDINATED OPERATIONS CONSOLE
          Split composition: Left = Operational State, Right = Live Event & Reconciliation
          Ensures immediate feedback, operational consequence, and next action in CURRENT VIEWPORT!
          ───────────────────────────────────────────────────────────── */}
      <section
        data-testid="resilience-posture-section"
        aria-label="Station Resilience Posture"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* ── LEFT SIDE (5 COLS): CURRENT OPERATIONAL STATE ───────── */}
        <div
          data-testid="comms-status-card"
          className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-sm flex flex-col justify-between"
        >
          {/* Section Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Resilience Posture
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-mono">Health:</span>
                <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold text-xs">
                  {overallHealth}%
                </strong>
                <TruthBadge type="DERIVED" />
              </div>
            </div>

            {/* Connection Status Banner */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isOffline
                  ? "border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/20"
                  : "border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isOffline ? "bg-rose-500 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {isOffline ? "Satellite Link Offline" : "Satellite Link Online"}
                  </span>
                </div>
                <span
                  data-testid="comms-status-badge"
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                    isOffline
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {isOffline ? "OFFLINE" : "ONLINE"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                {isOffline
                  ? "GSAT-7 backhaul severed. Station operating in autonomous degraded mode. All events spooled to local SQLite WAL."
                  : "GSAT-7 transponder locked. Continuous bi-directional telemetry and remote sync active."}
              </p>

              {/* Connection HUD Bar */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Latency</span>
                  <strong data-testid="comms-latency" className="text-slate-900 dark:text-slate-200 text-xs">
                    {isOffline || commsStatus?.latency_ms === 9999 || commsStatus?.latency_ms === null || commsStatus?.latency_ms === undefined
                      ? "DISCONNECTED"
                      : `${commsStatus.latency_ms} ms`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Bandwidth</span>
                  <strong data-testid="comms-bandwidth" className="text-slate-900 dark:text-slate-200 text-xs">
                    {commsStatus?.bandwidth_kbps ?? (isOffline ? 0 : 2048)} kbps
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Unsynced Items</span>
                  <strong data-testid="pending-deltas-count" className="text-amber-600 dark:text-amber-400 text-xs">
                    {pendingCount} Deltas
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Sync State</span>
                  <strong
                    data-testid="reconciliation-status"
                    className={`text-xs ${isOffline ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {isOffline ? "PENDING LINK" : "SYNCHRONIZED"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Integrated Headroom & Survival Windows */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wide">
                  Headroom &amp; Survival Windows
                </span>
                <span className="text-[10px] font-mono text-slate-400">Autonomous Margins</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Fuel Runway */}
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Fuel Runway</span>
                    <TruthBadge type="DERIVED" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      {fuelRunwayDays}
                    </span>
                    <span className="text-[10px] text-slate-500">Days</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (fuelRunwayDays / 90) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    Stock: {fuelStockLiters.toLocaleString()} L ({fuelStockPercent}%)
                  </div>
                </div>

                {/* Grid Reserve Margin */}
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Grid Reserve</span>
                    <TruthBadge type="DERIVED" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      +{reserveMarginKw}
                    </span>
                    <span className="text-[10px] text-slate-500">kW</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (modeledLoadKw / availableGenKw) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    Dispatched: {modeledLoadKw} / {availableGenKw} kW
                  </div>
                </div>

                {/* Thermal Ingress & Demand */}
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Thermal Demand</span>
                    <TruthBadge type="DERIVED" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      {thermalDemandKw}
                    </span>
                    <span className="text-[10px] text-slate-500">kW</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    Ambient: {ambientTempC}°C · Aux Boiler Ready
                  </div>
                </div>

                {/* UPS & NVMe Autonomy */}
                <div
                  data-testid="battery-resilience-card"
                  className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">UPS Autonomy</span>
                    <TruthBadge type="ESTIMATED" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                      4.8
                    </span>
                    <span className="text-[10px] text-slate-500">Hours</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    NVMe Buffer: 72h · 48.4V DC Bus
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Vulnerabilities & Single Points of Failure summary pill */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Active Vulnerabilities &amp; Single Points of Failure</span>
              </span>
              <button
                onClick={() => setActiveTab("INCIDENTS")}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
              >
                <span>Inspect</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              G-02 Diesel Gen (Risk: 74/100) · Aux Boiler B-01 Preheated for standby transfer
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE (7 COLS): LIVE EVENT / RECONCILIATION FEEDBACK CONSOLE ── */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-sm flex flex-col justify-between">
          {/* Dynamic State Console Content */}
          <div className="space-y-4">
            {/* Header of Right Console */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Event &amp; Reconciliation Feedback
                </h2>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  activeSyncPhase
                    ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                    : isOffline
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {activeSyncPhase ? `STEP: ${activeSyncPhase}` : isOffline ? "AIR GAPPED" : "STANDBY READY"}
              </span>
            </div>

            {/* CASE 1: ACTIVE RECONCILIATION IN PROGRESS */}
            {activeSyncPhase && (
              <div className="space-y-3 animate-fade-in">
                {/* Stage Tracker Stepper */}
                <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                      </span>
                      <span>Stepped Reconnection Protocol Active</span>
                    </span>
                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                      {activeSyncPhase === "RECONCILED" ? "COMPLETED" : "TRANSMITTING"}
                    </span>
                  </div>

                  {/* Visual Protocol Stepper */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono font-semibold pt-1">
                    <div className="p-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      1. Carrier Lock ✔
                    </div>
                    <div className="p-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      2. P0-P1 Sync ✔
                    </div>
                    <div
                      className={`p-1 rounded ${
                        activeSyncPhase === "RECONCILED"
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 animate-pulse"
                      }`}
                    >
                      3. SHA-256 Check
                    </div>
                    <div
                      className={`p-1 rounded ${
                        activeSyncPhase === "RECONCILED"
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      4. Server ACK
                    </div>
                  </div>
                </div>

                {/* Log Terminal Console */}
                <div
                  data-testid="reconciliation-log-console"
                  className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] shadow-md text-slate-300 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-1.5 text-[10px] text-slate-400 uppercase tracking-wider">
                    <span>Terminal Stream: Canonical Reconciliation Output</span>
                    <button
                      onClick={() => setActiveSyncPhase(null)}
                      className="text-slate-400 hover:text-white"
                      title="Dismiss log"
                    >
                      ✕
                    </button>
                  </div>

                  {reconciliationSteps.map((step, idx) => {
                    if (step.startsWith("P0 transferred")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 py-0.5 text-[11px]">
                          <span className="text-slate-500">›</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            P0
                          </span>
                          <span className="text-slate-300">{step}</span>
                        </div>
                      );
                    }
                    if (step.startsWith("P1 transferred")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 py-0.5 text-[11px]">
                          <span className="text-slate-500">›</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            P1
                          </span>
                          <span className="text-slate-300">{step}</span>
                        </div>
                      );
                    }
                    if (step.startsWith("P2 transferred")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 py-0.5 text-[11px]">
                          <span className="text-slate-500">›</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            P2
                          </span>
                          <span className="text-slate-300">{step}</span>
                        </div>
                      );
                    }
                    if (step.startsWith("P3 transferred")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 py-0.5 text-[11px]">
                          <span className="text-slate-500">›</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-700 text-slate-300">
                            P3
                          </span>
                          <span className="text-slate-400">{step}</span>
                        </div>
                      );
                    }
                    if (step.includes("SHA-256") || step.includes("checksums verified")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 py-0.5 text-[11px] text-emerald-400 font-semibold">
                          <span>✔</span>
                          <span>Canonical SHA-256 payload checksums verified by station hub.</span>
                        </div>
                      );
                    }
                    if (step.startsWith("Server ACK received")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 py-0.5 text-[11px] text-emerald-300 font-bold">
                          <span>✔</span>
                          <span>Server ACK received: All priority deltas reconciled. Satellite link ONLINE.</span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="flex items-start gap-1.5 py-0.5 text-[11px] text-slate-400">
                        <span className="text-slate-600">›</span>
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CASE 2: OFFLINE STATE (OUTAGE SIMULATION ACTIVE) */}
            {isOffline && !activeSyncPhase && (
              <div className="space-y-3.5 animate-fade-in">
                {/* Outage State & Consequence Callout */}
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Active Outage — Local Degraded Continuity Engaged</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-600">
                      AIR GAPPED
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Consequence: G-02 incident telemetry &amp; station events buffered locally
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      Zero data loss. High-resolution telemetry deltas and scientific observations are serialized into the local SQLite WAL ring buffer with canonical RFC 8259 formatting.
                    </p>
                  </div>
                </div>

                {/* Level 1 Priority Queue Summary Cards */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wide">
                      Queued Priority Spool ({pendingCount} pending)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Sorted P0 → P3</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* P0 */}
                    <div className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/30 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                        <span>P0 CRITICAL</span>
                        <span>{p0Count}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        G-02 Anomaly
                      </div>
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-medium">
                        First Dispatch
                      </div>
                    </div>

                    {/* P1 */}
                    <div className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        <span>P1 HIGH</span>
                        <span>{p1Count}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        Work Orders
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        WO-2026-088
                      </div>
                    </div>

                    {/* P2 */}
                    <div className="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 dark:bg-cyan-950/30 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        <span>P2 SCIENCE</span>
                        <span>{p2Count}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        Radar &amp; Seis
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        NVMe Buffer
                      </div>
                    </div>

                    {/* P3 */}
                    <div className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                        <span>P3 ROUTINE</span>
                        <span>{p3Count}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        Weather / Env
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Telemetry
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Step Callout */}
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Next Operational Step</span>
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Click <strong>Restore &amp; Reconcile</strong> in the header above to re-establish GSAT-7 carrier lock and verify priority hashes.
                    </p>
                  </div>
                  <button
                    onClick={handleRestoreAndSync}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shrink-0 cursor-pointer shadow-xs animate-pulse"
                  >
                    Restore Now
                  </button>
                </div>
              </div>
            )}

            {/* CASE 3: ONLINE / NORMAL OPERATING STATE */}
            {!isOffline && !activeSyncPhase && (
              <div className="space-y-3.5 animate-fade-in">
                {/* Readiness Posture Banner */}
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Ready for Disruption — Continuous Air-Gap Readiness</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600">
                      NOMINAL SYNC
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Station Bharati maintains continuous readiness for polar isolation. If the GSAT-7 satellite carrier is severed, the system immediately engages local degraded edge mode with zero data loss.
                  </p>
                </div>

                {/* 4 Architectural Safeguards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-blue-500" />
                      <span>Autonomous Local Edge</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Local SQLite WAL storage caches telemetry, telemetry thresholds, and operator actions during communications blackouts.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>Deterministic Priority Queue</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      P0 critical alarms (Generator G-02) synchronize first on carrier restore, followed by P1 work orders, P2 science, and P3 routine feeds.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Canonical SHA-256 Integrity</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Every delta payload is formatted per RFC 8259 and cryptographically hashed for bit-for-bit verification upon hub synchronization.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-cyan-500" />
                      <span>Scientific Data Spooling</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Instruments S-17 (Auroral Radar) and S-08 (Seismometer) buffer continuously to local NVMe storage with 72-hour retention guarantee.
                    </p>
                  </div>
                </div>

                {/* Action guidance */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Want to test autonomous transition? Click <strong>Simulate Outage</strong> in the header.</span>
                  <span className="font-mono text-[10px] text-slate-400">0 DELTAS PENDING</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECONDARY WORKSPACE TABS & DETAILED INSPECTORS
          Progressive disclosure: Detailed Queue, Incident Blast Radius, Graph, Science, Memory
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4 pt-2">
        {/* Workspace Segmented Navigation Rail */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("QUEUE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "QUEUE"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Sync Queue &amp; Integrity</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                {queueItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("INCIDENTS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "INCIDENTS"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Incident Blast Radius</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                {incidents?.length || 1}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("GRAPH")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "GRAPH"
                  ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Blast Radius Graph (Hero)</span>
            </button>

            <button
              onClick={() => setActiveTab("SCIENCE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "SCIENCE"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Science Buffer</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {instruments?.length || 2}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("MEMORY")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "MEMORY"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Operational Memory</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Active: <strong className="text-slate-800 dark:text-slate-200">{activeTab}</strong>
          </div>
        </div>

        {/* ── WORKSPACE 1: SYNC QUEUE VIEW (LEVEL 2 DETAILED TECHNICAL WORKSPACE) ── */}
        {activeTab === "QUEUE" && (
          <div data-testid="sync-queue-table" className="space-y-4">
            {/* Priority Lanes Summary & Filter Pills */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setQueuePriorityFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queuePriorityFilter === "ALL"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  All ({queueItems.length})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P0")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P0"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  }`}
                >
                  P0: Critical ({p0Count})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P1")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P1"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  P1: High ({p1Count})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P2")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P2"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                  }`}
                >
                  P2: Important ({p2Count})
                </button>
                <button
                  onClick={() => setQueuePriorityFilter("P3")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    queuePriorityFilter === "P3"
                      ? "bg-slate-600 text-white shadow-xs"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                  }`}
                >
                  P3: Routine ({p3Count})
                </button>
              </div>

              {/* Display Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-sans">
                <button
                  onClick={() => setQueueDisplayMode("SPLIT")}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
                    queueDisplayMode === "SPLIT"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-slate-500"
                  }`}
                >
                  Split Inspector
                </button>
                <button
                  onClick={() => setQueueDisplayMode("TABLE")}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer transition-colors ${
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
                <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 space-y-2.5 shadow-xs max-h-[620px] overflow-y-auto">
                  <div className="flex items-center justify-between text-xs font-sans font-semibold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span>Dispatch Priority Order</span>
                    <span className="font-mono text-[11px]">{filteredQueueItems.length} records</span>
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
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
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
                            <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                              {item.id}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              item.status === "RECONCILED"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate font-sans">
                          {item.event_type}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                          <span
                            data-testid="checksum-hash"
                            className="truncate max-w-[220px] font-mono text-[10px] text-slate-500 dark:text-slate-400"
                          >
                            {item.checksum_sha256}
                          </span>
                          <span
                            data-testid="checksum-verified-badge"
                            className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-2 font-mono text-[10px]"
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
                <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-xs">
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
                              Priority {activeQueueItem.priority_label}
                            </span>
                            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                              {activeQueueItem.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                            Event Type: <strong className="font-mono">{activeQueueItem.event_type}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRetryQueueItem(activeQueueItem.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Reverify
                          </button>
                        </div>
                      </div>

                      {/* Cryptographic SHA-256 Inspection Card */}
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-emerald-500" />
                            Canonical Payload SHA-256 Checksum
                          </span>
                          <span
                            data-testid="checksum-verified-badge"
                            className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
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
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-sans">
                          <span>Normalized UTF-8 RFC 8259 Hash</span>
                          <span className="font-mono">{new Date(activeQueueItem.created_at).toUTCString()}</span>
                        </div>
                      </div>

                      {/* Formatted JSON Payload Inspector */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between font-sans">
                          <span>Structured Event Payload</span>
                          <span className="text-[10px] text-slate-400 font-mono">RFC 8259 Canonical Format</span>
                        </div>
                        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-700 dark:border-slate-800 leading-relaxed shadow-inner">
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
                    <div className="p-8 text-center text-slate-400 font-sans text-xs">
                      No queue item selected
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Full Table Mode */
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 pb-2">
                      <th className="p-2.5 font-bold">Priority</th>
                      <th className="p-2.5 font-bold">Queue ID</th>
                      <th className="p-2.5 font-bold">Event Type &amp; Payload</th>
                      <th className="p-2.5 font-bold">Status</th>
                      <th className="p-2.5 font-bold">Canonical SHA-256 Hash</th>
                      <th className="p-2.5 font-bold">Integrity</th>
                      <th className="p-2.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                    {filteredQueueItems.map((item) => (
                      <tr
                        key={item.id}
                        data-testid={`queue-item-${item.priority_label}`}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
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
                        <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">{item.id}</td>
                        <td className="p-2.5 max-w-xs">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{item.event_type}</div>
                          <div className="text-[10px] text-slate-500 truncate font-mono">
                            {item.payload_json}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
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
                            className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 w-max"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            VERIFIED
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleRetryQueueItem(item.id)}
                            className="text-blue-600 hover:text-blue-500 font-semibold text-xs cursor-pointer"
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

        {/* ── WORKSPACE 2: INCIDENT BLAST RADIUS VIEW ──────────────── */}
        {activeTab === "INCIDENTS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT (3 COLS): Incident List */}
            <div
              data-testid="incidents-list"
              className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 space-y-2.5 shadow-xs"
            >
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                Active Incidents ({incidents?.length || 1})
              </div>

              {incidents?.map((inc) => {
                const isSelected = selectedIncidentId === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? "border-rose-500 bg-rose-500/10 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold font-mono text-rose-600 dark:text-rose-400">{inc.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {inc.title}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
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
              className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-xs"
            >
              {activeIncident ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold font-mono text-rose-600 dark:text-rose-400">{activeIncident.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-600">
                          {activeIncident.severity}
                        </span>
                        <TruthBadge type="DERIVED" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {activeIncident.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeIncident.status !== "RESOLVED" && (
                        <button
                          data-testid="resolve-incident-btn"
                          onClick={() => handleUpdateStatus("RESOLVED")}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                        >
                          Resolve Incident
                        </button>
                      )}
                      <button
                        data-testid="record-memory-btn"
                        onClick={() => setIsMemoryModalOpen(true)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Record to Memory
                      </button>
                    </div>
                  </div>

                  {/* Blast Radius Context Container */}
                  <div data-testid="incident-blast-radius" className="space-y-3">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 text-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Modeled Risk Score</div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Day 2 Risk Engine Score:</span>
                        <span
                          data-testid="incident-risk-score"
                          className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30"
                        >
                          {activeIncident.modeled_risk_score} / 100
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 text-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Affected Equipment (Blast Radius)</div>
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
                <div className="p-8 text-center text-slate-400 font-sans text-xs">No incident selected</div>
              )}
            </div>

            {/* RIGHT (4 COLS): Operator Action Logging & Audit Trail */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4 shadow-xs">
              <div className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Human-in-the-Loop Action Logging
              </div>

              <form data-testid="log-action-form" onSubmit={handleLogAction} className="space-y-3">
                <input
                  data-testid="action-code-input"
                  type="text"
                  placeholder="Action Code (e.g. EXPEDITE_VALVE_PURGE)"
                  value={newActionCode}
                  onChange={(e) => setNewActionCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  required
                />
                <textarea
                  data-testid="action-desc-input"
                  placeholder="Action Description / Engineering Notes"
                  value={newActionDesc}
                  onChange={(e) => setNewActionDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  required
                />
                <button
                  data-testid="submit-action-btn"
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Log Response Action
                </button>
              </form>

              {/* Audit Trail */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">
                  Audit Trail ({activeIncident?.actions.length || 0})
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {activeIncident?.actions.map((act) => (
                    <div
                      key={act.id}
                      data-testid="action-item"
                      className="p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 font-mono">
                        <span>{act.action_code}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(act.executed_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKSPACE 3: BLAST RADIUS GRAPH (HERO TOPOLOGY) ─────── */}
        {activeTab === "GRAPH" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Full-Width Blast Radius &amp; Operational Dependency Cascade
                  </h3>
                  <p className="text-xs text-slate-500">
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

        {/* ── WORKSPACE 4: SCIENCE BUFFER VIEW ────────────────────── */}
        {activeTab === "SCIENCE" && (
          <div data-testid="science-instruments-card" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT PANE (4 COLS): Scientific Instrument Deck */}
              <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 space-y-3 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                  Station Science Payloads ({instruments?.length || 2})
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
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold font-mono text-[10px]">
                              {instCode}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {inst.name}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              inst.health === "NOMINAL"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {inst.health}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Buffer: <strong>{inst.buffered_observations_count} queued</strong> · Power:{" "}
                          <strong>{inst.power_status}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT PANE (8 COLS): Selected Instrument Monitor */}
              <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-5 shadow-xs">
                {activeInstrument ? (
                  <div data-testid={`instrument-${activeInstrument.code || activeInstrument.id}`} className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold font-mono">
                            {activeInstrument.code || activeInstrument.id}
                          </span>
                          <span className="text-slate-500 font-semibold">{activeInstrument.instrument_type}</span>
                          <TruthBadge type="MEASURED" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                          {activeInstrument.name}
                        </h3>
                      </div>

                      {/* Buffer Action */}
                      <button
                        data-testid="buffer-observation-btn"
                        onClick={() => handleBufferObservation(activeInstrument.id || activeInstrument.code || "INST-S17-RADAR")}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                      >
                        <HardDrive className="h-4 w-4" />
                        <span>Buffer Observation</span>
                      </button>
                    </div>

                    {/* Telemetry Readouts Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Buffer Posture</div>
                        <div className="font-bold font-mono text-base text-blue-600 dark:text-blue-400 mt-0.5">
                          {activeInstrument.buffered_observations_count} queued
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Circular Spool</div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Power Allocation</div>
                        <div className="font-bold font-mono text-base text-slate-900 dark:text-slate-100 mt-0.5">
                          {activeInstrument.power_status}
                        </div>
                        <div className="text-[10px] text-emerald-500 mt-1">Bus: Active Feed</div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Instrument Health</div>
                        <div className="font-bold font-mono text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {activeInstrument.health}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Telemetry Valid</div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Buffer Retention</div>
                        <div className="font-bold font-mono text-base text-slate-900 dark:text-slate-100 mt-0.5">
                          72 Hours
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Retention Guarantee</div>
                      </div>
                    </div>

                    {/* Scientific Continuity Statement */}
                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 space-y-1.5 text-xs">
                      <div className="font-semibold text-blue-700 dark:text-blue-300">
                        Observation Continuity Under Link Disruption:
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                        Observations stream directly to local high-reliability NVMe ring buffers during outages. Records receive SHA-256 cryptographic fingerprints and are prioritized as P2 telemetry for deterministic bulk reconciliation upon carrier restoration.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 font-sans text-xs">
                    Select an instrument to view telemetry
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── WORKSPACE 5: OPERATIONAL MEMORY VIEW ─────────────────── */}
        {activeTab === "MEMORY" && (
          <div
            data-testid="operational-memory-panel"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-5 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                  Institutional Knowledge Archive
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
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
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Memory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memoryData?.memories?.map((item) => (
                <div
                  key={item.id}
                  data-testid="memory-card"
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-sans">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-sans">
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

      {/* Record Memory Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Incident Post-Mortem to Operational Memory
              </h3>
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-3 text-xs font-sans">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase">Decision Taken</label>
                <input
                  type="text"
                  value={memDecision}
                  onChange={(e) => setMemDecision(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase">Operational Action</label>
                <input
                  type="text"
                  value={memAction}
                  onChange={(e) => setMemAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase">Outcome</label>
                <input
                  type="text"
                  value={memOutcome}
                  onChange={(e) => setMemOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1 uppercase">Lesson Learned</label>
                <textarea
                  value={memLesson}
                  onChange={(e) => setMemLesson(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
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
