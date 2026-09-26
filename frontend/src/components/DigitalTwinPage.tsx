import React, { useState, useMemo } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  Activity,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Wrench,
  Clock,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useAssetDetail } from "@/hooks/useAssetDetail";
import { useAssetTelemetry } from "@/hooks/useAssetTelemetry";
import { useAssetRisk } from "@/hooks/useAssetRisk";
import { useAssetDependencies } from "@/hooks/useAssetDependencies";
import { useOperationalEvents } from "@/hooks/useOperationalEvents";
import { useStation, STATIONS, type StationId } from "@/context/StationContext";
import { OperationalTopology } from "./OperationalTopology";
import { TelemetryTrendCard } from "./TelemetryTrendCard";
import { StatusBadge } from "./polarops";
import { ExplanationDrawer } from "./polarops";
import { TruthBadge } from "./TruthBadge";

const STAGE_DEFINITIONS: Record<string, string> = {
  NOMINAL: "Equipment operates within standard design parameters. Normal telemetry margins and scheduled routine maintenance.",
  WATCH: "Minor variance detected. Heightened supervisory polling and baseline deviation monitoring active.",
  ELEVATED: "Single sensor or condition threshold breach. Advisory active, operational headroom reduced.",
  HIGH: "Multiple telemetry threshold breaches or constrained recovery path. Redundancy at risk.",
  CRITICAL: "Active failure mode or severe multi-factor breach. Immediate operational intervention required.",
};

function getLadderStepColor(step: string, isCurrent: boolean) {
  switch (step) {
    case "CRITICAL":
      return isCurrent
        ? "border-rose-500/80 bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold ring-2 ring-rose-500/40 shadow-xs"
        : "border-rose-300/40 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600/70 dark:text-rose-400/70";
    case "HIGH":
      return isCurrent
        ? "border-orange-500/80 bg-orange-500/15 text-orange-700 dark:text-orange-400 font-bold ring-2 ring-orange-500/40 shadow-xs"
        : "border-orange-300/40 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600/70 dark:text-orange-400/70";
    case "ELEVATED":
      return isCurrent
        ? "border-amber-500/80 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold ring-2 ring-amber-500/40 shadow-xs"
        : "border-amber-300/40 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600/70 dark:text-amber-400/70";
    case "WATCH":
      return isCurrent
        ? "border-sky-500/80 bg-sky-500/15 text-sky-700 dark:text-sky-400 font-bold ring-2 ring-sky-500/40 shadow-xs"
        : "border-sky-300/40 dark:border-sky-900/40 bg-sky-50/50 dark:bg-sky-950/20 text-sky-600/70 dark:text-sky-400/70";
    case "NOMINAL":
    default:
      return isCurrent
        ? "border-emerald-500/80 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/40 shadow-xs"
        : "border-emerald-300/40 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600/70 dark:text-emerald-400/70";
  }
}

export function DigitalTwinPage() {
  const search = useSearch({ from: "/digital-twin" });
  const navigate = useNavigate();
  const stationCtx = useStation();

  // Active Station Context with URL query param support
  const urlStation = search.station;
  const currentStationId: StationId =
    urlStation === "STATION-MAITRI" || urlStation === "STATION-BHARATI"
      ? urlStation
      : stationCtx?.activeStationId || "STATION-BHARATI";

  const activeStation = STATIONS[currentStationId] || STATIONS["STATION-BHARATI"];

  // Real backend queries
  const {
    data: assetList,
    isLoading: assetsLoading,
    isError: assetsError,
    refetch: refetchAssets,
  } = useAssets(currentStationId);

  // Normalize search asset: default to G-02 for Bharati, or first asset for Maitri
  const fallbackAsset = currentStationId === "STATION-MAITRI" ? "GEN-01" : "G-02";
  const searchAsset = search.asset && search.asset !== "power" ? search.asset : undefined;

  const [selectedAssetId, setSelectedAssetId] = useState<string>(searchAsset || fallbackAsset);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [explanationOpen, setExplanationOpen] = useState(false);

  // Collapsible Recent Operational Events (Default state: COLLAPSED per spec)
  const [eventsExpanded, setEventsExpanded] = useState(false);

  // Collapsible State Transition Details (Default state: COLLAPSED per spec)
  const [transitionDetailsExpanded, setTransitionDetailsExpanded] = useState(false);
  const [selectedLadderStage, setSelectedLadderStage] = useState<string | null>(null);

  // Reset stage selection when asset changes
  React.useEffect(() => {
    setSelectedLadderStage(null);
  }, [selectedAssetId]);

  // When asset list loads or station changes, verify selectedAssetId belongs to station
  React.useEffect(() => {
    if (assetList && assetList.length > 0) {
      const exists = assetList.some(
        (a) => a.code === selectedAssetId || a.id === selectedAssetId
      );
      if (!exists && assetList[0]) {
        const nextAsset = assetList[0].code;
        setSelectedAssetId(nextAsset);
        setSelectedNodeId(undefined);
      }
    }
  }, [assetList, currentStationId, selectedAssetId]);

  // Sync state if search param changed externally
  React.useEffect(() => {
    if (search.asset && search.asset !== selectedAssetId) {
      setSelectedAssetId(search.asset);
    }
  }, [search.asset, selectedAssetId]);

  // Asset intelligence queries
  const {
    data: assetDetail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useAssetDetail(selectedAssetId);

  const {
    data: telemetry,
    isLoading: telemLoading,
    isError: telemError,
    refetch: refetchTelem,
  } = useAssetTelemetry(selectedAssetId, 50);

  const {
    data: risk,
    isError: riskError,
    refetch: refetchRisk,
  } = useAssetRisk(selectedAssetId);

  const {
    data: deps,
    isError: depsError,
    refetch: refetchDeps,
  } = useAssetDependencies(selectedAssetId, 5);

  const {
    data: eventsData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useOperationalEvents(currentStationId, 8);

  const handleSelectAsset = (assetCode: string) => {
    setSelectedAssetId(assetCode);
    setSelectedNodeId(undefined);
    navigate({
      to: "/digital-twin",
      search: { station: currentStationId, asset: assetCode },
    });
  };

  const handleSelectStation = (newStationId: StationId) => {
    if (stationCtx?.setActiveStationId) {
      stationCtx.setActiveStationId(newStationId);
    }
    const defaultAsset = newStationId === "STATION-MAITRI" ? "GEN-01" : "G-02";
    setSelectedAssetId(defaultAsset);
    setSelectedNodeId(undefined);
    navigate({
      to: "/digital-twin",
      search: { station: newStationId, asset: defaultAsset },
    });
  };

  const handleRetryAll = () => {
    refetchAssets();
    refetchDetail();
    refetchTelem();
    refetchRisk();
    refetchDeps();
    refetchEvents();
  };

  const anyError = assetsError || detailError || telemError || riskError || depsError;

  // Derivations for system summary
  const totalAssets = assetList?.length ?? 0;
  const issuesCount = useMemo(() => {
    return assetList?.filter((a) => a.status !== "NOMINAL").length ?? 0;
  }, [assetList]);

  const nominalCount = totalAssets - issuesCount;
  const twinStateStatus = issuesCount > 0 ? "WARNING" : "NOMINAL";

  // Data Freshness formatted time - driven by actual telemetry or asset record
  const lastTimestamp = useMemo(() => {
    if (telemetry?.provenance?.timestamp) {
      try {
        const d = new Date(telemetry.provenance.timestamp);
        return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")} UTC`;
      } catch {
        return "MEASURED UTC";
      }
    }
    if (assetDetail?.provenance?.timestamp) {
      try {
        const d = new Date(assetDetail.provenance.timestamp);
        return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")} UTC`;
      } catch {
        return "RECORDED UTC";
      }
    }
    return "HISTORICAL";
  }, [telemetry, assetDetail]);

  const recentEventsList = eventsData?.events?.slice(0, 3) || [];

  return (
    <div
      className="space-y-4 animate-fade-in pb-16 font-sans text-slate-800 dark:text-slate-200"
      data-testid="digital-twin-page"
    >
      {/* ── 01: COMPACT OPERATIONAL HEADER ───────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-sans text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Digital Twin
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {activeStation.name}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Station Asset Graph
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Boxes className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Station Digital Twin
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
            Real-time physical asset topology, thermal/power bus telemetry, and cross-subsystem dependencies.
          </p>
        </div>

        {/* Station Selector, Live Status, Truth Type, and Refresh */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Station Selector Toggle */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => handleSelectStation("STATION-BHARATI")}
              data-testid="twin-station-tab-bharati"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                currentStationId === "STATION-BHARATI"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bharati
            </button>
            <button
              onClick={() => handleSelectStation("STATION-MAITRI")}
              data-testid="twin-station-tab-maitri"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                currentStationId === "STATION-MAITRI"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Maitri
            </button>
          </div>

          {/* Live Synchronized Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px] tracking-wide">STABLE</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Live Twin</span>
            <span className="text-muted-foreground font-mono text-[11px]">· {lastTimestamp}</span>
          </div>

          <TruthBadge type="MEASURED" />

          {/* Refresh Action */}
          <button
            onClick={handleRetryAll}
            title="Synchronize Telemetry & Topology"
            aria-label="Synchronize telemetry and topology"
            className="p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${detailLoading || telemLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Global Error Banner if any critical query fails */}
      {anyError && (
        <div className="p-3 border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <h4 className="font-semibold text-xs text-rose-800 dark:text-rose-300">
                TELEMETRY SYNCHRONIZATION ADVISORY
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                One or more asset intelligence feeds encountered a retrieval delay from the backend.
              </p>
            </div>
          </div>
          <button
            onClick={handleRetryAll}
            className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-mono font-bold rounded-lg hover:opacity-90 shrink-0 cursor-pointer"
          >
            RETRY SYNC
          </button>
        </div>
      )}

      {/* ── 02: TOPOLOGY / DIGITAL TWIN CARD (PRIMARY VISUAL FOCUS) ────── */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-3">
        {/* Compact Card Header */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white uppercase">
              STATION TOPOLOGY & EQUIPMENT MAP · {activeStation.name.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE TOPOLOGY
            </span>
          </div>
        </div>

        {/* Integrated Asset Selector Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-primary" /> MONITORED ASSETS:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {assetsLoading ? (
                <span className="text-xs font-mono text-muted-foreground animate-pulse">
                  Synchronizing asset directory...
                </span>
              ) : assetList && assetList.length > 0 ? (
                assetList.map((a) => {
                  const isSelected = a.code === selectedAssetId || a.id === selectedAssetId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleSelectAsset(a.code)}
                      data-testid={`asset-tab-${a.code}`}
                      className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span>{a.code}</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          a.status === "CRITICAL"
                            ? "bg-rose-500"
                            : a.status === "WARNING"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    </button>
                  );
                })
              ) : (
                <span className="text-xs font-mono text-muted-foreground">
                  No assets found for {currentStationId}
                </span>
              )}
            </div>
          </div>

          {/* Quick jump to G-02 focus if available and not currently active */}
          {selectedAssetId !== "G-02" && assetList?.some((a) => a.code === "G-02") && (
            <button
              onClick={() => handleSelectAsset("G-02")}
              className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              FOCUS ON G-02 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Primary Interactive Topology Visualization */}
        <div data-testid="level-4-topology" className="w-full">
          <OperationalTopology
            assetId={selectedAssetId}
            large
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            onInspectAsset={(code) => handleSelectAsset(code)}
          />
        </div>
      </section>

      {/* ── 03: TWIN STATE CARDS (CURRENT OVERALL TWIN STATE) ───────────── */}
      <section aria-label="System Summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Twin State */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
            <span>TWIN STATE</span>
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <StatusBadge value={twinStateStatus} />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {issuesCount}
            </span>{" "}
            active {issuesCount === 1 ? "issue" : "issues"} detected
          </p>
        </div>

        {/* Card 2: Systems Health */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
            <span>SYSTEMS</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="font-mono text-lg font-bold text-slate-900 dark:text-white">
            {nominalCount} <span className="text-xs font-normal text-muted-foreground">/ {totalAssets} nominal</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {issuesCount} constrained {issuesCount === 1 ? "subsystem" : "subsystems"}
          </p>
        </div>

        {/* Card 3: Data Freshness */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
            <span>DATA FRESHNESS</span>
            <Clock className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="font-mono text-lg font-bold text-slate-900 dark:text-white">
            {lastTimestamp}
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {telemetry?.provenance?.source || assetDetail?.provenance?.source || "STATION REGISTRY"}
          </p>
        </div>

        {/* Card 4: System Risk */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
            <span>SYSTEM RISK</span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="font-mono text-lg font-bold text-rose-600 dark:text-rose-400">
            {risk?.score ?? "--"}{" "}
            <span className="text-xs font-normal text-muted-foreground">/ 100</span>
          </div>
          <p className="text-xs text-muted-foreground truncate font-mono" title={risk?.failure_exposure?.redundancy_posture}>
            {risk?.failure_exposure?.redundancy_posture || (assetDetail?.criticality === "CRITICAL" ? "N+1 Critical Redundancy" : "Standard Subsystem Integration")}
          </p>
        </div>
      </section>

      {/* ── 04: MONITORED ASSETS GRAPHS (SELECTED ASSET & TELEMETRY) ───── */}
      <section
        data-testid="level-1-briefing"
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-4"
      >
        {detailLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ) : assetDetail ? (
          <div className="space-y-4">
            {/* Asset Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
                    SELECTED ASSET INTELLIGENCE
                  </span>
                  <span className="text-muted-foreground text-[10px] font-mono">
                    · {currentStationId}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {assetDetail.name} ({assetDetail.code})
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                  {risk?.summary ||
                    `${assetDetail.name} operational status is ${assetDetail.status}. Monitored under station critical infrastructure guidelines.`}
                </p>
              </div>

              {/* Health Score & Status Badge */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted-foreground">HEALTH SCORE</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {assetDetail.health_score}
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </div>
                </div>

                <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-700" />

                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted-foreground">RISK LEVEL</div>
                  <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                    {risk?.score ?? "--"}
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </div>
                </div>

                <StatusBadge value={assetDetail.status} />
              </div>
            </div>

            {/* Metadata Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-muted-foreground block text-[10px] font-sans">
                  CATEGORY & CRITICALITY
                </span>
                <strong className="text-slate-900 dark:text-slate-100 text-xs block mt-0.5">
                  {assetDetail.category} · {assetDetail.criticality}
                </strong>
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-muted-foreground block text-[10px] font-sans">
                  REDUNDANCY POSTURE
                </span>
                <strong className="text-amber-600 dark:text-amber-400 text-xs block mt-0.5">
                  {risk?.failure_exposure?.redundancy_posture || (assetDetail.criticality === "CRITICAL" ? "N+1 Active (Nominal Redundancy)" : "Standard Subsystem Integration")}
                </strong>
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-muted-foreground block text-[10px] font-sans">
                  PROVENANCE TRUTH TYPE
                </span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-xs block mt-0.5">
                  {assetDetail.provenance.truth_type} · {assetDetail.provenance.quality}
                </strong>
              </div>
            </div>

            {/* Level 2: Sensor Telemetry & Evidence Sparklines */}
            <div data-testid="level-2-telemetry" className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
                    LEVEL 2 · CONDITION & EVIDENCE
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Sensor Telemetry & Trend Analysis
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold">
                  {telemetry?.series?.length
                    ? `${telemetry.series.length} ACTIVE TRANSDUCER CHANNELS`
                    : "0 ACTIVE TRANSDUCER CHANNELS"}
                </span>
              </div>

              {telemLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : telemetry && telemetry.series && telemetry.series.length > 0 ? (
                /* State 1: Asset has active time-series telemetry streams */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {telemetry.series.map((s) => (
                    <TelemetryTrendCard
                      key={s.metric_key}
                      series={s}
                      provenanceSource={telemetry.provenance?.source}
                      truthType={telemetry.provenance?.truth_type}
                    />
                  ))}
                </div>
              ) : assetDetail.metrics && assetDetail.metrics.length > 0 ? (
                /* State 2: Asset has supported current metrics but no time-series trend */
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                        SENSOR TELEMETRY
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-medium">
                      Current channels: {assetDetail.metrics.length}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    No historical trend available for this asset. Displaying current telemetry readings:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {assetDetail.metrics.map((m) => {
                      let statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
                      if (m.status === "CRITICAL") statusColor = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30";
                      else if (m.status === "WARNING") statusColor = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30";

                      return (
                        <div
                          key={m.key}
                          data-testid={`telemetry-card-${m.key}`}
                          className="p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                                {m.key}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5 truncate">
                                {m.name}
                              </h4>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                              {m.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                              {m.value.toFixed(1)}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">{m.unit}</span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                            <span>SOURCE: {assetDetail.provenance.source}</span>
                            <span className="text-emerald-500 font-bold">CURRENT</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* State 3: Asset genuinely has no historical telemetry instrumented */
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                        SENSOR TELEMETRY
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-medium">
                      Current channels: 0
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    No historical trend available for this asset.
                  </p>

                  {/* Compact Current Condition & Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[9px] uppercase font-sans text-muted-foreground block">
                        CURRENT CONDITION
                      </span>
                      <div className="mt-1 flex items-center">
                        <StatusBadge value={assetDetail.status} />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[9px] uppercase font-sans text-muted-foreground block">
                        HEALTH ASSESSMENT
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                        {assetDetail.health_score}
                        <span className="text-[10px] text-muted-foreground font-normal">/100</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[9px] uppercase font-sans text-muted-foreground block">
                        RISK EXPOSURE
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-sm block mt-0.5">
                        {risk?.score ?? 0}
                        <span className="text-[10px] text-muted-foreground font-normal">/100</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[9px] uppercase font-sans text-muted-foreground block">
                        FACILITY ZONE
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block mt-1 truncate" title={assetDetail.zone_id || "Main Facility"}>
                        {assetDetail.zone_id || "Main Facility"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>

      {/* ── 05: OPERATIONAL DEPENDENCY ─────────────────────────────────── */}
      <section
        data-testid="operational-dependency-section"
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] font-sans tracking-wider text-primary uppercase font-semibold">
              OPERATIONAL DEPENDENCY
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
              Multi-Hop System Impact
            </h3>
          </div>
          <span className="text-[10px] font-sans font-medium text-muted-foreground px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
            DEPTH: {deps?.max_depth ?? 2} HOPS
          </span>
        </div>

        {/* Visual Flow: ASSET -> SYSTEM -> DEPENDENCY -> OPERATIONAL IMPACT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 font-sans text-xs">
          {/* Step 1: Asset */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 flex flex-col justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-sans font-semibold">
              01 · TARGET ASSET
            </span>
            <div className="mt-1 flex items-center justify-between gap-1">
              {(() => {
                const rawName = assetDetail?.name || selectedAssetId;
                const assetCode = assetDetail?.code || selectedAssetId;
                if (assetCode && rawName.endsWith(` ${assetCode}`)) {
                  const prefix = rawName.slice(0, -assetCode.length);
                  return (
                    <span className="font-sans font-semibold text-slate-900 dark:text-white text-xs truncate">
                      <span>{prefix}</span>
                      <span className="font-mono text-[11px] font-bold">{assetCode}</span>
                    </span>
                  );
                }
                return (
                  <span className="font-sans font-semibold text-slate-900 dark:text-white text-xs truncate">
                    {rawName}
                  </span>
                );
              })()}
              <span className="font-sans font-semibold [&_.status-badge]:font-sans [&_.status-badge]:font-semibold">
                <StatusBadge value={assetDetail?.status || "NOMINAL"} />
              </span>
            </div>
          </div>

          {/* Step 2: System / Redundancy */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-sans font-semibold">
              02 · SUBSYSTEM ROLE
            </span>
            <span
              className="font-sans font-semibold text-slate-900 dark:text-white text-xs block mt-1 truncate"
              title={
                assetDetail
                  ? `${assetDetail.category.replace(/_/g, " ")} · ${risk?.failure_exposure?.redundancy_posture || (assetDetail.criticality === "CRITICAL" ? "N+1 Active" : "Standard Feed")}`
                  : "Subsystem Integration"
              }
            >
              {assetDetail
                ? `${assetDetail.category.replace(/_/g, " ")} · ${risk?.failure_exposure?.redundancy_posture || (assetDetail.criticality === "CRITICAL" ? "N+1 Active" : "Standard Feed")}`
                : "Subsystem Integration"}
            </span>
          </div>

          {/* Step 3: Dependent Services */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-sans font-semibold">
              03 · DEPENDENT EQUIPMENT & PATHS
            </span>
            <span
              className="font-sans font-semibold text-slate-900 dark:text-white text-xs block mt-1 truncate"
              title={
                deps?.downstream_impact?.affected_services && deps.downstream_impact.affected_services.length > 0
                  ? deps.downstream_impact.affected_services.map((s) => s.name || s.code).join(" · ")
                  : deps?.downstream_impact?.affected_subsystems && deps.downstream_impact.affected_subsystems.length > 0
                  ? deps.downstream_impact.affected_subsystems.join(" · ")
                  : deps?.upstream_dependencies && deps.upstream_dependencies.length > 0
                  ? `Fed by ${deps.upstream_dependencies.map((u) => u.name || u.code).join(" · ")}`
                  : "Isolated Boundary (No Direct Cascade)"
              }
            >
              {deps?.downstream_impact?.affected_services && deps.downstream_impact.affected_services.length > 0
                ? deps.downstream_impact.affected_services.map((s) => s.name || s.code).join(" · ")
                : deps?.downstream_impact?.affected_subsystems && deps.downstream_impact.affected_subsystems.length > 0
                ? deps.downstream_impact.affected_subsystems.join(" · ")
                : deps?.upstream_dependencies && deps.upstream_dependencies.length > 0
                ? `Fed by ${deps.upstream_dependencies.map((u) => u.name || u.code).join(" · ")}`
                : "Isolated Boundary (No Direct Cascade)"}
            </span>
          </div>

          {/* Step 4: Operational Impact */}
          <div
            className={`p-2.5 rounded-xl border ${
              (risk?.score ?? 0) > 50
                ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300"
                : assetDetail?.status === "WARNING"
                ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300"
                : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider block font-sans font-semibold">
              04 · OPERATIONAL IMPACT
            </span>
            <span
              className="font-sans font-semibold text-xs block mt-1 truncate leading-normal"
              title={
                (risk?.score ?? 0) > 50
                  ? (risk?.summary || "Winter-Load Resilience Compressed")
                  : assetDetail?.status !== "NOMINAL"
                  ? (risk?.summary || "Subsystem operating under elevated monitoring.")
                  : "Nominal Station Load (100% Headroom)"
              }
            >
              {(risk?.score ?? 0) > 50
                ? (risk?.summary || "Winter-Load Resilience Compressed")
                : assetDetail?.status !== "NOMINAL"
                ? (risk?.summary || "Subsystem operating under elevated monitoring.")
                : "Nominal Station Load (100% Headroom)"}
            </span>
          </div>
        </div>

        {/* Quick Link to Resources */}
        <div className="pt-1">
          <button
            onClick={() =>
              navigate({
                to: "/resources",
                search: { asset: selectedAssetId },
              })
            }
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-sans font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span className="font-sans">View Spares & Logistics in Resources</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      </section>

      {/* ── 06 & 07: CAUSAL RISK & STATE TRANSITION (ADJACENT 2-COLUMN CARDS) ── */}
      <div data-testid="level-3-risk" className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Causal Risk Card */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
                  CAUSAL RISK
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ranked Risk Drivers & System Exposure
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                SCORE: {risk?.score ?? 0} / 100
              </span>
            </div>

            {/* Ranked Risk Drivers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  RANKED RISK DRIVERS
                </span>
                <span className="text-muted-foreground text-[10px]">DETERMINISTIC CAUSAL WEIGHTING</span>
              </div>

              <div className="space-y-1.5">
                {(risk?.drivers || []).slice(0, 2).map((driver) => {
                  const pct = ((driver.score / driver.max_score) * 100).toFixed(0);
                  return (
                    <div
                      key={driver.rank}
                      className="p-2 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          #{driver.rank} {driver.title}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shrink-0">
                          {driver.score} / {driver.max_score} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-rose-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Exposure Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div className="p-2 border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[10px]">
                  <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" /> FAILURE EXPOSURE
                </span>
                <div className="text-[10px] text-muted-foreground truncate" title={risk?.failure_exposure?.affected_critical_services?.join(" · ")}>
                  {risk?.failure_exposure?.affected_critical_services?.join(" · ") || "None"}
                </div>
              </div>

              <div className="p-2 border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[10px]">
                  <Wrench className="w-3 h-3 text-amber-500 shrink-0" /> RECOVERY EXPOSURE
                </span>
                <div className="text-[10px] text-muted-foreground truncate" title={risk?.recovery_exposure?.spare_part_number || "Standard store"}>
                  {risk?.recovery_exposure?.spare_part_number
                    ? `${risk.recovery_exposure.spare_part_number} (${risk.recovery_exposure.spare_available_quantity ?? 0} in stock)`
                    : risk?.recovery_exposure?.work_order_status || "Standard maintenance spares available"}
                </div>
              </div>

              <div className="p-2 border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3 text-primary shrink-0" /> OPERATIONAL HEADROOM
                </span>
                <div className="text-[10px] text-muted-foreground truncate">
                  {risk?.headroom?.generation_reserve_kw != null
                    ? `${risk.headroom.generation_reserve_kw} kW reserve`
                    : "Nominal reserve"} · {risk?.headroom?.thermal_hold_hours != null
                    ? `${risk.headroom.thermal_hold_hours}h thermal buffer`
                    : "Stable thermal margin"}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] text-muted-foreground">
              Deterministic causal derivation active.
            </div>
            <button
              onClick={() => setExplanationOpen(true)}
              data-testid="open-explanation-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/25 transition-colors cursor-pointer shrink-0"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>View explanation →</span>
            </button>
          </div>
        </section>

        {/* State Transition Card */}
        <section
          data-testid="state-transition-section"
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5"
        >
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] font-sans tracking-widest text-primary uppercase font-bold">
                  STATE TRANSITION
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                  Equipment Degradation Ladder
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  risk?.state_transition?.state_trend === "ESCALATING"
                    ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30"
                    : risk?.state_transition?.state_trend === "DE-ESCALATING"
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                    : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                {risk?.state_transition?.state_trend || "STABLE"}
              </span>
            </div>

            {/* Horizontal State Transition Ladder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold tracking-wider text-slate-700 dark:text-slate-300">
                  STATE TRANSITION LADDER
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">
                  CURRENT:{" "}
                  <strong
                    className={`font-sans font-bold ${
                      (risk?.state_transition?.current_state || risk?.level) === "CRITICAL"
                        ? "text-rose-600 dark:text-rose-400"
                        : (risk?.state_transition?.current_state || risk?.level) === "HIGH"
                        ? "text-orange-600 dark:text-orange-400"
                        : (risk?.state_transition?.current_state || risk?.level) === "ELEVATED"
                        ? "text-amber-600 dark:text-amber-400"
                        : (risk?.state_transition?.current_state || risk?.level) === "WATCH"
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {risk?.state_transition?.current_state || risk?.level || "NOMINAL"}
                  </strong>
                </span>
              </div>

              {/* 5 State Stage Buttons with Connectors */}
              <div className="flex items-center justify-between gap-1 sm:gap-1.5">
                {(risk?.state_transition?.ladder || ["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"]).map(
                  (step, idx, arr) => {
                    const isCurrent = (risk?.state_transition?.current_state || risk?.level) === step;
                    const isSelected = selectedLadderStage === step;
                    return (
                      <React.Fragment key={step}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLadderStage(selectedLadderStage === step ? null : step)
                          }
                          title={`Click to inspect stage criteria: ${step}`}
                          className={`flex-1 p-2 rounded-xl border text-center font-sans transition-all flex flex-col justify-center items-center min-h-[58px] cursor-pointer hover:opacity-95 ${
                            isSelected && !isCurrent ? "ring-2 ring-primary/40 shadow-xs" : ""
                          } ${getLadderStepColor(step, isCurrent)}`}
                        >
                          <span className="block text-[11px] font-bold tracking-tight">{step}</span>
                          {isCurrent ? (
                            <span
                              className={`mt-1 inline-block text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white shadow-xs ${
                                step === "CRITICAL"
                                  ? "bg-rose-600 dark:bg-rose-500"
                                  : step === "HIGH"
                                  ? "bg-orange-600 dark:bg-orange-500"
                                  : step === "ELEVATED"
                                  ? "bg-amber-600 dark:bg-amber-500"
                                  : step === "WATCH"
                                  ? "bg-sky-600 dark:bg-sky-500"
                                  : "bg-emerald-600 dark:bg-emerald-500"
                              }`}
                            >
                              CURRENT
                            </span>
                          ) : (
                            <span className="text-[10px] opacity-40 mt-0.5">·</span>
                          )}
                        </button>
                        {idx < arr.length - 1 && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hidden sm:block shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  }
                )}
              </div>

              {/* Selected Stage Detail Callout (when inspecting non-current ladder stage) */}
              {selectedLadderStage &&
                selectedLadderStage !== (risk?.state_transition?.current_state || risk?.level || "NOMINAL") && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-start justify-between gap-2 animate-in fade-in-50 duration-150 font-sans">
                    <div className="space-y-0.5">
                      <span className="font-sans text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase block">
                        STAGE CRITERIA · {selectedLadderStage}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs font-sans">
                        {STAGE_DEFINITIONS[selectedLadderStage]}
                      </p>
                      <span className="text-[10px] text-muted-foreground block font-sans">
                        Current equipment operating state remains:{" "}
                        <strong className="text-foreground font-bold">
                          {risk?.state_transition?.current_state || risk?.level || "NOMINAL"}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLadderStage(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
            </div>

            {/* Current State Summary Card */}
            {(() => {
              const currentSt = risk?.state_transition?.current_state || risk?.level || "NOMINAL";
              const triggers = risk?.state_transition?.triggered_by || [];
              const isNominal = currentSt === "NOMINAL";

              // Parse triggers into category and sub-items for progressive disclosure
              const parsedTriggerItems = triggers.map((t) => {
                const colonIdx = t.indexOf(":");
                if (colonIdx > 0 && colonIdx < 35) {
                  const category = t.slice(0, colonIdx).trim();
                  const rawDetail = t.slice(colonIdx + 1).trim();
                  const subItems = rawDetail.includes(";")
                    ? rawDetail.split(";").map((s) => s.trim()).filter(Boolean)
                    : [rawDetail];
                  return { category, detail: rawDetail, subItems };
                }
                return { category: "Operational Factor", detail: t, subItems: [t] };
              });

              let mainTriggerTitle = "Condition anomaly";
              if (isNominal) {
                mainTriggerTitle = "Nominal operating parameters";
              } else if (parsedTriggerItems[0]?.category) {
                mainTriggerTitle = parsedTriggerItems[0].category;
              }

              // Extract sub-items for condition breaches
              const conditionSubItems = (parsedTriggerItems[0]?.subItems || []).map((sub) => sub);

              // Partition remaining triggers into operational effect, resupply constraint, and other contributing factors
              let dependencyTriggerText = "";
              let resupplyTriggerText = "";
              const otherContributingTriggers: string[] = [];

              parsedTriggerItems.slice(1).forEach((item) => {
                const catLower = item.category.toLowerCase();
                if (catLower.includes("dependency") || catLower.includes("service")) {
                  dependencyTriggerText = item.detail;
                } else if (catLower.includes("resupply") || catLower.includes("logistics")) {
                  resupplyTriggerText = item.detail;
                } else {
                  otherContributingTriggers.push(`${item.category}: ${item.detail}`);
                }
              });

              // Clean contributing list
              const contributingList = isNominal
                ? []
                : [
                    ...(conditionSubItems.length > 1 ? conditionSubItems : []),
                    ...otherContributingTriggers,
                  ];

              if (!isNominal && contributingList.length === 0 && parsedTriggerItems[0]?.detail) {
                contributingList.push(parsedTriggerItems[0].detail);
              }

              // Contributing factors count
              const contributingFactorsCount = isNominal
                ? 0
                : conditionSubItems.length > 1
                ? conditionSubItems.length
                : Math.max(triggers.length - 1, 1);

              // Operational effect text
              const operationalEffectText =
                dependencyTriggerText ||
                risk?.failure_exposure?.summary ||
                (isNominal
                  ? "All downstream critical station life-support and mission services operating normally."
                  : "Downstream impact on critical station services.");

              // Recovery constraint text
              const recoveryConstraintText =
                resupplyTriggerText ||
                risk?.recovery_exposure?.recovery_bottleneck ||
                (isNominal
                  ? "No active logistics or resupply bottlenecks detected."
                  : "Resupply / maintenance dependency constrained by logistics window.");

              return (
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        CURRENT STATE
                      </span>
                      <span
                        className={`text-xs font-sans font-bold px-2 py-0.5 rounded border ${
                          currentSt === "CRITICAL"
                            ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30"
                            : currentSt === "HIGH"
                            ? "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30"
                            : currentSt === "ELEVATED"
                            ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30"
                            : currentSt === "WATCH"
                            ? "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30"
                            : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        }`}
                      >
                        {currentSt}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans text-muted-foreground">
                        TRUTH:{" "}
                        <span className="font-mono font-semibold">
                          {risk?.state_transition?.truth_type || "DERIVED"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="text-muted-foreground">Main operational trigger:</span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-full sm:max-w-[280px]">
                        {mainTriggerTitle}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground">Contributing factors:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        <span className="font-mono font-bold">{contributingFactorsCount}</span>{" "}
                        {contributingFactorsCount === 1 ? "contributing factor" : "contributing factors"}
                      </span>
                    </div>
                  </div>

                  {/* Progressive Disclosure Toggle */}
                  <button
                    type="button"
                    onClick={() => setTransitionDetailsExpanded(!transitionDetailsExpanded)}
                    aria-expanded={transitionDetailsExpanded}
                    data-testid="toggle-transition-details-btn"
                    className="w-full mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer font-sans"
                  >
                    <span className="font-bold text-[11px] tracking-wider uppercase font-sans">
                      WHY IS THE TWIN IN THIS STATE?
                    </span>
                    <span className="inline-flex items-center gap-1 font-sans font-normal text-muted-foreground text-xs">
                      {transitionDetailsExpanded ? "Hide transition details" : "View transition details"}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          transitionDetailsExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>

                  {/* Expanded Breakdown (Structured - No giant red paragraph) */}
                  {transitionDetailsExpanded && (
                    <div
                      data-testid="transition-details-expanded"
                      className="pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3 animate-in fade-in-50 duration-200 font-sans"
                    >
                      {/* 1. TRIGGER */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle
                            className={`w-3.5 h-3.5 shrink-0 ${
                              currentSt === "CRITICAL"
                                ? "text-rose-500"
                                : currentSt === "NOMINAL"
                                ? "text-emerald-500"
                                : "text-amber-500"
                            }`}
                          />
                          <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                            TRIGGER
                          </span>
                        </div>
                        <p className="pl-5 text-xs font-semibold text-slate-900 dark:text-white font-sans">
                          {mainTriggerTitle}
                        </p>
                      </div>

                      {/* 2. CONTRIBUTING FACTORS */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                        <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 block">
                          CONTRIBUTING FACTORS
                        </span>
                        {contributingList.length > 0 ? (
                          <ul className="space-y-1.5 pl-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                            {contributingList.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary text-[11px] mt-0.5">•</span>
                                <span className="leading-relaxed">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="pl-2 text-xs text-slate-500 dark:text-slate-400 font-sans">
                            None — all monitored telemetry and condition factors operating within nominal baseline margins.
                          </p>
                        )}
                      </div>

                      {/* 3. OPERATIONAL EFFECT */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                        <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 block">
                          OPERATIONAL EFFECT
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-2 font-sans">
                          {operationalEffectText}
                        </p>
                      </div>

                      {/* 4. RECOVERY CONSTRAINT */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                        <span className="text-[10px] font-sans uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 block">
                          RECOVERY CONSTRAINT
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-2 font-sans">
                          {recoveryConstraintText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Next Threshold Callout */}
            {risk?.state_transition?.next_threshold_trigger && (
              <div
                data-testid="next-threshold-callout"
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-sans uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>NEXT THRESHOLD</span>
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200">
                  {risk.state_transition.next_threshold_trigger}
                </p>
              </div>
            )}
          </div>

          {/* State Transition Footer Note */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-sans">
            <span className="text-muted-foreground font-sans">
              State trend:{" "}
              <strong className="font-semibold text-slate-900 dark:text-white">
                {risk?.state_transition?.state_trend || "STABLE"}
              </strong>
            </span>
            <span className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">
              LADDER DEPTH: 5 STAGES
            </span>
          </div>
        </section>
      </div>

      {/* ── 08: RECENT OPERATIONAL EVENTS (COLLAPSIBLE DROPDOWN - DEFAULT COLLAPSED) ─ */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
        <button
          onClick={() => setEventsExpanded(!eventsExpanded)}
          aria-expanded={eventsExpanded}
          data-testid="events-collapsible-btn"
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              RECENT OPERATIONAL EVENTS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              {recentEventsList.length} EVENTS
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                eventsExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Collapsible Content */}
        {eventsExpanded && (
          <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 animate-fade-in">
            {eventsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : recentEventsList.length > 0 ? (
              <div className="space-y-2">
                {recentEventsList.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            evt.severity === "CRITICAL"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : evt.severity === "WARNING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {evt.severity}
                        </span>
                        {evt.entity_id && (
                          <span className="font-mono text-[9.5px] text-primary">
                            [{evt.entity_id}]
                          </span>
                        )}
                      </div>
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {evt.title}
                      </h5>
                      <p className="text-[10.5px] text-muted-foreground line-clamp-1">
                        {evt.summary}
                      </p>
                    </div>

                    <span className="font-mono text-[9.5px] text-muted-foreground shrink-0 mt-0.5">
                      {new Date(evt.timestamp).toISOString().slice(11, 16)} UTC
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-muted-foreground">
                No recent events logged for {currentStationId}.
              </div>
            )}

            {/* Compact Causal Reasoning Action */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">
                Root-cause model available
              </span>
              <button
                onClick={() => setExplanationOpen(true)}
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer text-xs"
              >
                Inspect Causal Model <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 09: EXPLANATION DRAWER ─────────────────────────────────────── */}
      <ExplanationDrawer
        open={explanationOpen}
        setOpen={setExplanationOpen}
        domain="ASSET"
        entityId={selectedAssetId}
        stationId={currentStationId}
      />
    </div>
  );
}
