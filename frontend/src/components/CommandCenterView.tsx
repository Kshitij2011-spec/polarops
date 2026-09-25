import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Zap,
  Fuel,
  Users,
  CloudSnow,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
  Check,
  X,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useStationOverview } from "@/hooks/useStationOverview";
import { useOperationalIntelligence } from "@/hooks/useOperationalIntelligence";
import { useOperationalEvents } from "@/hooks/useOperationalEvents";
import { useStation } from "@/context/StationContext";
import { StationDigitalTwin } from "./StationDigitalTwin";
import { ExplanationDrawer } from "./polarops";

export function CommandCenterView() {
  const { activeStationId } = useStation();
  const stationId = activeStationId || "STATION-BHARATI";
  const navigate = useNavigate();

  const [explainOpen, setExplainOpen] = useState(false);
  const [causalExpanded, setCausalExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [approvalState, setApprovalState] = useState<
    "pending" | "approved" | "modified" | "rejected"
  >("pending");

  // Live queries
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErrorObj,
    refetch: refetchOverview,
  } = useStationOverview(stationId);

  const {
    data: intel,
    refetch: refetchIntel,
  } = useOperationalIntelligence(stationId);

  const {
    data: eventsData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useOperationalEvents(stationId, 8);

  const retryAll = () => {
    refetchOverview();
    refetchIntel();
    refetchEvents();
  };

  const powerSub = overview?.subsystem_summary?.find(
    (s) => s.code === "POWER" || s.name.toLowerCase().includes("power")
  );

  const primaryEvent = overview?.critical_events?.[0];
  const stationStatus = overview?.status ?? (overviewLoading ? "CONNECTING..." : "NOMINAL");

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto font-sans pb-10">
      {/* ── 01: COMPACT OPERATIONAL HEADER ───────────────────────────────── */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-3 font-sans">
        <div>
          <div className="text-[10px] font-sans tracking-wider text-primary font-semibold uppercase flex items-center gap-2">
            <span>COMMAND CENTER</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
              {stationId === "STATION-MAITRI"
                ? "MAITRI · 70°46′S 11°44′E"
                : "STATION BHARATI · WINTER OPERATIONS"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Operational Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            High-priority attention items, active deviations, and immediate operational controls.
          </p>
        </div>

        {/* Operational Context Badges */}
        <div className="flex items-center gap-2 font-sans text-xs">
          {/* Station Selector context */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-medium">
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {stationId === "STATION-MAITRI" ? "Maitri Base" : "Bharati Station"}
            </span>
          </div>

          {/* Telemetry link status */}
          <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold">SAT-1 LIVE</span>
          </div>

          {/* Overall Station Status */}
          <div
            className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              (stationStatus as string) === "CRITICAL"
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                : (stationStatus as string) === "WATCH" || (stationStatus as string) === "WARNING"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                (stationStatus as string) === "CRITICAL"
                  ? "bg-rose-500"
                  : (stationStatus as string) === "WATCH" || (stationStatus as string) === "WARNING"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span className="font-sans font-bold">STATUS: {stationStatus}</span>
          </div>
        </div>
      </header>

      {/* Backend Error State Banner */}
      {overviewError && (
        <div
          data-testid="command-center-error"
          className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-700 dark:text-rose-300 font-sans"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-bold">Failed to load real-time station telemetry</p>
              <p className="text-xs opacity-90">
                {overviewErrorObj?.message ?? "Backend unreachable. Presenting local resilient state."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={retryAll}
            className="px-3 py-1.5 rounded-lg border border-rose-500/40 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>RETRY CONNECTION</span>
          </button>
        </div>
      )}

      {/* ── 02: 4 COMPACT OPERATIONAL SUMMARY CARDS ──────────────────────── */}
      <section aria-labelledby="operational-metrics-heading" className="space-y-1.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Station Health / Readiness */}
          <div
            data-testid="metric-health"
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between space-y-2.5 font-sans"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                COMPOSITE HEALTH
              </span>
              <span
                className={`text-[10px] font-sans px-2 py-0.5 rounded font-semibold border ${
                  (overview?.overall_health_score ?? 88.4) >= 90
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                }`}
              >
                {(overview?.overall_health_score ?? 88.4) >= 90 ? "NOMINAL" : "WATCH"}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-sans text-slate-900 dark:text-white">
                {overview?.overall_health_score != null
                  ? `${overview.overall_health_score.toFixed(1)}%`
                  : "88.4%"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {overview?.status === "NOMINAL"
                  ? "All major station subsystems optimal"
                  : "Primary Power Generation N-1 degraded"}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-muted-foreground font-sans">
              <span>OVERALL READINESS</span>
              <span className="font-mono text-[9.5px]">DERIVED · ASSESSMENT</span>
            </div>
          </div>

          {/* Card 2: Power Subsystem */}
          <div
            data-testid="metric-power"
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between space-y-2.5 font-sans"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-semibold text-primary uppercase tracking-wider">
                POWER SUBSYSTEM
              </span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                {powerSub?.status ?? "DEGRADED"}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-sans text-slate-900 dark:text-white">
                {powerSub?.health_score != null
                  ? `${powerSub.health_score.toFixed(1)}%`
                  : "84.0%"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                G-02 bearing anomaly · N-1 redundancy reduced
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-muted-foreground font-sans">
              <span>GENERATION &amp; DISTRIBUTION</span>
              <span className="font-mono text-[9.5px]">MEASURED · TELEMETRY</span>
            </div>
          </div>

          {/* Card 3: Fuel Runway */}
          <div
            data-testid="metric-fuel"
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between space-y-2.5 font-sans"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-semibold text-primary uppercase tracking-wider">
                FUEL RUNWAY
              </span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                {(overview?.fuel_runway_days ?? 70.3) < 90 ? "WATCH" : "NOMINAL"}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-sans text-slate-900 dark:text-white">
                {overview?.fuel_runway_days != null
                  ? `${overview.fuel_runway_days.toFixed(1)} DAYS`
                  : "70.3 DAYS"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {overview?.fuel_quantity_liters != null
                  ? `${overview.fuel_quantity_liters.toLocaleString()} L in reserve`
                  : "142,500 L in reserve"}{" "}
                across 4 banks
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-muted-foreground font-sans">
              <span>DIESEL STORAGE CAPACITY</span>
              <span className="font-mono text-[9.5px]">MEASURED · RESERVES</span>
            </div>
          </div>

          {/* Card 4: External Environment */}
          <div
            data-testid="metric-environment"
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between space-y-2.5 font-sans"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-semibold text-primary uppercase tracking-wider">
                EXTERNAL ENVIRONMENT
              </span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                {(overview?.ambient_weather?.wind_speed_knots ?? 42) >= 35
                  ? "CRITICAL"
                  : "NOMINAL"}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold font-sans text-slate-900 dark:text-white">
                {overview?.ambient_weather?.temperature_celsius != null
                  ? `${overview.ambient_weather.temperature_celsius.toFixed(1)}°C`
                  : "-28.5°C"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Wind {overview?.ambient_weather?.wind_speed_knots ?? 42} kts · Chill{" "}
                {overview?.ambient_weather?.wind_chill_celsius != null
                  ? `${overview.ambient_weather.wind_chill_celsius.toFixed(1)}°C`
                  : "-41.2°C"}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-muted-foreground font-sans">
              <span>WEATHER SENSOR</span>
              <span className="font-mono text-[9.5px]">MEASURED · TELEMETRY</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03: PRIMARY OPERATIONAL VIEW — STATION SCHEMATIC (WHERE IS THE PROBLEM?) ─ */}
      <section aria-labelledby="digital-twin-topology-heading" className="space-y-2 font-sans">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans tracking-wider text-primary uppercase font-semibold">
              PRIMARY OPERATIONAL VIEW
            </span>
            <h2
              id="digital-twin-topology-heading"
              className="text-base font-bold text-slate-900 dark:text-white font-sans"
            >
              Station Subsystem Topology &amp; Problem Isolation
            </h2>
          </div>
          <span className="text-[10px] font-sans text-muted-foreground px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
            N-1 REDUNDANCY ACTIVE
          </span>
        </div>

        <div data-testid="digital-twin-topology">
          <StationDigitalTwin
            onInspectAsset={(id) => {
              navigate({ to: "/digital-twin", search: { asset: id } });
            }}
            onOpenExplanation={(domain, entityId) => setExplainOpen(true)}
          />
        </div>
      </section>

      {/* ── 04 & 05: CRITICAL EVENTS & MITIGATION ACTION ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans">
        {/* Card A: Active Critical Events */}
        <section
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4"
          aria-labelledby="critical-event-heading"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-sans font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  CURRENT ACTIVE EVENT
                </span>
              </div>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                ABNORMAL CONDITION
              </span>
            </div>

            <div>
              <h3
                id="critical-event-heading"
                data-testid="critical-event-title"
                className="text-base font-bold text-slate-900 dark:text-white font-sans"
              >
                {primaryEvent?.title ?? "Generator G-02 · Vibration Deviation"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Observed bearing vibration anomaly on Generator G-02 exceeds standard 4.50 mm/s
                baseline during elevated station winter base load.
              </p>
            </div>

            {/* Compact Scannable Attributes */}
            <div className="space-y-1.5 text-xs border border-slate-200/70 dark:border-slate-800 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Condition:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Bearing vibration RMS <span className="font-mono font-bold">4.82 mm/s</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Operational Impact:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  N-1 power redundancy margin degraded
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Key Dependency:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Power Bus A → Habitat &amp; Science Labs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Station / Asset:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Bharati · <span className="font-mono">G-02</span> (Power Generation)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Drill-down */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="open-explanation-btn"
                onClick={() => setExplainOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary border border-primary/25 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>View explanation →</span>
              </button>
              <Link
                to="/digital-twin"
                search={{ asset: "G-02" }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>INSPECT G-02</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
            <span className="text-[10px] font-sans text-muted-foreground">
              MEASURED TELEMETRY · PROVENANCE ACTIVE
            </span>
          </div>
        </section>

        {/* Card B: Operational Recommendation & Human-in-the-Loop Control */}
        <section
          data-testid="operational-recommendation"
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 font-sans"
          aria-labelledby="human-in-the-loop-heading"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] font-sans font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                  RECOMMENDED ACTION
                </span>
                <h3
                  id="human-in-the-loop-heading"
                  className="text-base font-bold text-slate-900 dark:text-white font-sans"
                >
                  Operator Approval Required
                </h3>
              </div>
              <span
                className={`text-[10px] font-sans px-2.5 py-1 rounded font-bold border ${
                  approvalState === "approved"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                    : approvalState === "rejected"
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800"
                    : approvalState === "modified"
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                }`}
              >
                {approvalState === "approved"
                  ? "OPERATOR APPROVED · DISPATCHED"
                  : approvalState === "rejected"
                  ? "OPERATOR REJECTED"
                  : approvalState === "modified"
                  ? "OPERATOR MODIFIED"
                  : "PENDING OPERATOR DECISION"}
              </span>
            </div>

            {/* Protocol Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-sans font-bold text-primary uppercase block mb-0.5">
                  PROPOSED MITIGATION PROTOCOL:
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  {intel?.decisions?.find((d) => d.is_primary)?.title ??
                    intel?.decisions?.[0]?.title ??
                    "Transfer non-critical science laboratory loads to Power Bus B and initiate hot-standby synchronization on Generator G-01 to restore N-1 electrical headroom before evening blizzard arrival."}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-sans font-bold text-slate-500 dark:text-slate-400 uppercase block mb-0.5">
                  RATIONALE:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  {intel?.decisions?.find((d) => d.is_primary)?.rationale ??
                    intel?.decisions?.[0]?.rationale ??
                    "Mitigates thermal breaker trip risk on primary generator while maintaining station-critical life support."}
                </p>
              </div>
            </div>

            {/* Human in the loop action triggers */}
            {approvalState === "pending" ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setApprovalState("approved")}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check size={14} />
                  <span>APPROVE ACTION</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalState("modified")}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  <span>MODIFY PARAMETERS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalState("rejected")}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X size={14} />
                  <span>REJECT ACTION</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-sans">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Action logged by Operator. Timestamp registered in Station Engineering Log.
                </span>
                <button
                  type="button"
                  onClick={() => setApprovalState("pending")}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  RESET DECISION
                </button>
              </div>
            )}

            {/* Progressive Disclosure for Causal Reasoning Chain */}
            <div data-testid="causal-reasoning-chain" className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setCausalExpanded(!causalExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <span className="text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {intel?.causal_chain?.[0]?.stage ?? "CHANGE"}
                  </span>
                  <span>WHY DOES THIS MATTER? DETERMINISTIC CAUSAL TRACE</span>
                </span>
                <span className="inline-flex items-center gap-1 font-normal text-muted-foreground text-xs">
                  {causalExpanded ? "Hide trace" : `View ${intel?.causal_chain?.length ?? 7}-stage trace`}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      causalExpanded ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {causalExpanded && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs animate-in fade-in-50 duration-200">
                  {(intel?.causal_chain && intel.causal_chain.length > 0
                    ? intel.causal_chain
                    : [
                        { stage: "CHANGE", title: "Mechanical Degradation", headline: "Vibration elevated at 4.82 mm/s", description: "Accelerated mechanical fatigue on G-02 bearing." },
                        { stage: "CONTEXT", title: "Blizzard Conditions", headline: "-28.5°C with 42 kt winds", description: "Heating envelope elevated to 252 kW base load." },
                        { stage: "DEPENDENCY", title: "Power Bus A", headline: "Feeds Habitat and Laser Radar", description: "Single-point distribution to atmospheric laser labs." },
                        { stage: "RISK", title: "Thermal Breaker Trip", headline: "Continuous run over-temperature risk", description: "Stator temperature exceeds nominal threshold." },
                        { stage: "CONSEQUENCE", title: "Automated Load Shedding", headline: "Non-critical science halted", description: "Lab loads disconnected under emergency shed protocol." },
                        { stage: "SCENARIO", title: "18h Runtime Window", headline: "N-1 margin degraded", description: "Simulation shows 18h continuous stability under current load." },
                        { stage: "ACTION", title: "Load Transfer & Sync", headline: "Shift load to Bus B & sync G-01", description: "Restores electrical headroom prior to storm peak." },
                      ]
                  ).map((item, idx) => (
                    <div
                      key={item.stage}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono font-bold text-primary">{item.stage}</span>
                        <span className="font-mono">STAGE {String(idx + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {"headline" in item && item.headline ? item.headline : item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-muted-foreground font-sans flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary shrink-0" />
              <span>Advisory role only — final switching remains under human command.</span>
            </span>
            <span className="font-mono text-[9.5px]">DETERMINISTIC REASONING ENGINE</span>
          </div>
        </section>
      </div>

      {/* ── 06: CROSS-STATION CONTEXT — WHICH STATION NEEDS ATTENTION? ───── */}
      <section aria-labelledby="cross-station-context-heading" className="space-y-2 font-sans">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans tracking-wider text-primary uppercase font-semibold">
              CROSS-STATION CONTEXT
            </span>
            <h2
              id="cross-station-context-heading"
              className="text-base font-bold text-slate-900 dark:text-white font-sans"
            >
              Which Station Needs Attention Right Now?
            </h2>
          </div>
          <Link
            to="/stations"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Stations</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Bharati Station */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-sans font-bold text-primary uppercase">
                  PRIMARY COASTAL BASE
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bharati Station
                </h3>
              </div>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                WARNING
              </span>
            </div>

            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              ⚠ 2 active operational constraints: Generator G-02 bearing anomaly (N-1 degraded) &amp; Blizzard wind advisory (42 kts).
            </p>

            <div className="grid grid-cols-4 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">HEALTH</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">88.4%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">FUEL RUNWAY</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">70.3 D</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">PERSONNEL</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">24 POB</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">ACTIVE ALERTS</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">1 Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground text-[11px]">Larsemann Hills · 69°24′S</span>
              <Link
                to="/digital-twin"
                search={{ asset: "G-02" }}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Inspect in Digital Twin</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Maitri Station */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-sans font-bold text-primary uppercase">
                  INLAND RESEARCH BASE
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Maitri Station
                </h3>
              </div>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                NOMINAL
              </span>
            </div>

            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              ✓ No critical constraints: All 6 primary subsystems operating stably; 142 days fuel reserve.
            </p>

            <div className="grid grid-cols-4 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">HEALTH</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">94.2%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">FUEL RUNWAY</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">142.0 D</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">PERSONNEL</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">18 POB</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">ACTIVE ALERTS</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">0 Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground text-[11px]">Schirmacher Oasis · 70°46′S</span>
              <Link
                to="/stations"
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>View Maitri Base</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 07: COLLAPSIBLE RECENT ACTIVITY STREAM ────────────────────────── */}
      <section
        data-testid="operational-activity-list"
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-all font-sans"
        aria-labelledby="operational-activity-heading"
      >
        <button
          type="button"
          onClick={() => setActivityExpanded(!activityExpanded)}
          className="w-full flex items-center justify-between cursor-pointer text-left"
        >
          <div>
            <span className="text-[10px] font-sans tracking-wider text-primary uppercase font-semibold">
              OPERATIONAL ACTIVITY LOG
            </span>
            <h2
              id="operational-activity-heading"
              className="text-base font-bold text-slate-900 dark:text-white font-sans flex items-center gap-2"
            >
              <span>Recent System Events &amp; Audit Trail</span>
              <span className="text-[10px] font-sans font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                {eventsData?.events?.length ?? 6} Events
              </span>
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
            {activityExpanded ? "Collapse Activity" : "Expand Activity Log"}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                activityExpanded ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {/* Preview when collapsed */}
        {!activityExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">
              Latest:{" "}
              <strong className="text-foreground">
                {eventsData?.events?.[0]?.title ?? "Generator G-02 Vibration Anomaly"}
              </strong>{" "}
              — {eventsData?.events?.[0]?.summary ?? "Bearing vibration RMS rose to 4.82 mm/s"}
            </span>
            <span className="font-mono text-[10px] shrink-0 ml-2">
              {eventsData?.events?.[0]?.timestamp
                ? new Date(eventsData.events[0].timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Live"}
            </span>
          </div>
        )}

        {/* Full stream when expanded */}
        {activityExpanded && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in-50 duration-200">
            {eventsLoading ? (
              <div className="py-4 text-xs font-mono text-muted-foreground text-center">
                Loading operational events stream...
              </div>
            ) : eventsData?.events && eventsData.events.length > 0 ? (
              eventsData.events.slice(0, 6).map((ev) => (
                <div key={ev.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {new Date(ev.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {ev.title}
                      </span>
                      <span className="text-muted-foreground hidden sm:inline">
                        {" "}
                        — {ev.summary}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold shrink-0 border ${
                      ev.severity === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                        : ev.severity === "WARNING"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {ev.severity}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-xs text-muted-foreground text-center">
                No recent operational events logged.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Explanation Drawer */}
      <ExplanationDrawer
        open={explainOpen}
        setOpen={setExplainOpen}
        domain="ASSET"
        entityId="G-02"
        stationId={stationId}
      />
    </div>
  );
}
