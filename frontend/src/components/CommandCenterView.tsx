import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Zap,
  Fuel,
  Users,
  CloudSnow,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  GitCompare,
  Check,
  X,
  SlidersHorizontal,
  Compass,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useStationOverview } from "@/hooks/useStationOverview";
import { useOperationalIntelligence } from "@/hooks/useOperationalIntelligence";
import { useOperationalEvents } from "@/hooks/useOperationalEvents";
import { useAssetTelemetry } from "@/hooks/useAssetTelemetry";
import { useStation } from "@/context/StationContext";
import { StationDigitalTwin } from "./StationDigitalTwin";
import { ExplanationDrawer } from "./polarops";
import { ActivityStream } from "./ActivityStream";

export function CommandCenterView() {
  const { activeStationId, openExplanation: openStationExplanation } = useStation();
  const stationId = activeStationId || "STATION-BHARATI";

  const [explainOpen, setExplainOpen] = useState(false);
  const [approvalState, setApprovalState] = useState<"pending" | "approved" | "modified" | "rejected">("pending");
  const [operatorComment, setOperatorComment] = useState("");

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
    isLoading: intelLoading,
    refetch: refetchIntel,
  } = useOperationalIntelligence(stationId);

  const {
    data: eventsData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useOperationalEvents(stationId, 8);

  const {
    data: telemetry,
    refetch: refetchTelemetry,
  } = useAssetTelemetry("G-02", 15);

  const retryAll = () => {
    refetchOverview();
    refetchIntel();
    refetchEvents();
    refetchTelemetry();
  };

  const powerSub = overview?.subsystem_summary?.find(
    (s) => s.code === "POWER" || s.name.toLowerCase().includes("power")
  );

  const primaryEvent = overview?.critical_events?.[0];
  const primaryDecision = intel?.decisions?.[0];

  const vibrationSeries = telemetry?.series?.find(
    (s) => s.metric_key === "vibration_rms" || s.metric_name.toLowerCase().includes("vibration")
  );
  const loadSeries = telemetry?.series?.find(
    (s) => s.metric_key === "load_percentage" || s.metric_name.toLowerCase().includes("load")
  );
  const tempSeries = telemetry?.series?.find(
    (s) => s.metric_key === "winding_temp_celsius" || s.metric_name.toLowerCase().includes("temp")
  );

  const vibPoints = vibrationSeries?.points?.slice(-11) ?? [];
  const maxVib = Math.max(...vibPoints.map((p) => p.value), 6);
  const vibBars: number[] =
    vibPoints.length > 0
      ? vibPoints.map((p) => Math.max(4, Math.round((p.value / maxVib) * 36)))
      : [10, 14, 18, 22, 28, 36, 32, 24, 18, 14, 12];

  const currentVib = vibrationSeries?.current_value ?? 4.82;
  const currentLoad = loadSeries?.current_value ?? 84.5;
  const currentTemp = tempSeries?.current_value ?? 68.2;

  // Station status color & label
  const stationStatus = overview?.status ?? (overviewLoading ? "CONNECTING..." : "NOMINAL");

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ============================================================
          1. STATION IDENTITY & HEADER (Sections 13 & 14)
          ============================================================ */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#369ACC] font-bold uppercase flex items-center gap-2">
            <span>STATION BHARATI · WINTER OPERATIONS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-slate-400 dark:text-slate-500">69°24′S 76°11′E</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-slate-900 dark:text-white tracking-tight mt-1">
            Operational Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Station-wide operational state, dependencies and active decisions.
          </p>
        </div>

        {/* Restrained operational status indicator */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                (stationStatus as string) === "CRITICAL"
                  ? "bg-[#DE324C]"
                  : (stationStatus as string) === "WATCH" || (stationStatus as string) === "WARNING"
                  ? "bg-[#F4895F]"
                  : "bg-[#4FAE7A]"
              }`}
            />
            <span className="text-slate-400 uppercase text-[10px]">STATUS:</span>
            <span className="font-bold text-slate-900 dark:text-white">{stationStatus}</span>
          </div>
        </div>
      </div>

      {overviewError && (
        <div className="p-4 rounded-md border border-[#DE324C]/40 bg-[#DE324C]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#DE324C]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Failed to load real-time station telemetry</p>
              <p className="text-xs opacity-90">{overviewErrorObj?.message ?? "Backend unreachable. Presenting local resilient state."}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={retryAll}
            className="px-3 py-1.5 rounded border border-[#DE324C]/50 hover:bg-[#DE324C]/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} />
            <span>RETRY CONNECTION</span>
          </button>
        </div>
      )}

      {/* ============================================================
          2. OPERATIONAL METRICS (Section 15: 2x2 desktop, 1 col mobile)
          POWER, FUEL, PERSONNEL, TEMPERATURE
          ============================================================ */}
      <section aria-labelledby="operational-metrics-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="operational-metrics-heading" className="text-xs font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            OPERATIONAL HEADROOM &amp; RUNWAY METRICS
          </h2>
          <span className="text-[10px] font-mono text-slate-400">2 × 2 DESKTOP MATRIX</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. POWER */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#369ACC] tracking-wider uppercase">
                  POWER SUBSYSTEM
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#F4895F]/10 text-[#F4895F] border border-[#F4895F]/30">
                  {powerSub?.status ?? "DEGRADED"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-slate-900 dark:text-white mt-2 mb-1">
                {powerSub?.health_score !== undefined ? `${powerSub.health_score.toFixed(1)}%` : "84.5%"}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {powerSub?.name ?? "Primary Power Generation"} · N-1 redundancy degraded. Power Bus A/B operational.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>GENERATION &amp; DISTRIBUTION</span>
              <span className="text-slate-500">MEASURED · TELEMETRY</span>
            </div>
          </div>

          {/* 2. FUEL */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#369ACC] tracking-wider uppercase">
                  FUEL RUNWAY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {(overview?.fuel_runway_days ?? 81) < 90 ? "WATCH" : "NOMINAL"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-slate-900 dark:text-white mt-2 mb-1">
                {overview?.fuel_runway_days ?? 81} <span className="text-lg font-normal text-slate-400 font-mono">DAYS</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {overview?.fuel_quantity_liters !== undefined && overview.fuel_quantity_liters !== null
                  ? `${overview.fuel_quantity_liters.toLocaleString()} L in reserve`
                  : "64,800 L in reserve"} across 4 insulated fuel tank banks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>DIESEL STORAGE CAPACITY</span>
              <span className="text-slate-500">MEASURED · RESERVES</span>
            </div>
          </div>

          {/* 3. PERSONNEL */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#369ACC] tracking-wider uppercase">
                  STATION PERSONNEL
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  NOMINAL
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-slate-900 dark:text-white mt-2 mb-1">
                24 <span className="text-lg font-normal text-slate-400 font-mono">POB</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                44th Indian Antarctic Expedition wintering team. 0 medical quarantines.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>STATION COMPLEMENT &amp; LIFE SUPPORT</span>
              <span className="text-slate-500">ADMINISTRATIVE · STATION ROSTER</span>
            </div>
          </div>

          {/* 4. TEMPERATURE / ENVIRONMENT */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#369ACC] tracking-wider uppercase">
                  EXTERNAL ENVIRONMENT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {(overview?.ambient_weather?.wind_speed_knots ?? 28) >= 35 ? "CRITICAL" : "NOMINAL"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-headline text-slate-900 dark:text-white mt-2 mb-1">
                {overview?.ambient_weather?.temperature_celsius !== undefined
                  ? `${overview.ambient_weather.temperature_celsius.toFixed(1)}°C`
                  : "-18.4°C"}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Wind {overview?.ambient_weather?.wind_speed_knots ?? 28} kts · Wind Chill {overview?.ambient_weather?.wind_chill_celsius?.toFixed(1) ?? "-32.1"}°C · {overview?.ambient_weather?.conditions ?? "Clear Polar Skies"}.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>BHARATI COASTAL WEATHER SENSORS</span>
              <span className="text-slate-500">MEASURED · WEATHER SENSOR</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. DIGITAL TWIN (Section 16)
          Power Plant, Comms Mast, Habitat, Science Lab, Fuel Farm,
          Logistics Bay, Water & Waste with interactive operational dependencies
          ============================================================ */}
      <section aria-labelledby="digital-twin-topology-heading">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 id="digital-twin-topology-heading" className="text-xs font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              STATION DIGITAL TWIN · OPERATIONAL TOPOLOGY
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            N-1 REDUNDANCY ACTIVE
          </span>
        </div>

        <StationDigitalTwin
          onInspectAsset={(id) => {}}
          onOpenExplanation={(domain, entityId) => setExplainOpen(true)}
        />
      </section>

      {/* ============================================================
          4. G-02 CRITICAL EVENT & 5. G-02 ASSET INTELLIGENCE (Sections 17 & 18)
          ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* G-02 Critical Operational Event Card */}
        <section
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="critical-event-heading"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DE324C] animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-[#DE324C] uppercase tracking-wider">
                  CRITICAL OPERATIONAL EVENT
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#DE324C]/10 text-[#DE324C] border border-[#DE324C]/30">
                ABNORMAL CONDITION
              </span>
            </div>

            <div className="mt-3">
              <h3 id="critical-event-heading" className="text-lg font-bold font-headline text-slate-900 dark:text-white">
                GENERATOR G-02 · VIBRATION DEVIATION
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Observed bearing vibration anomaly on Generator G-02 exceeds standard 4.50 mm/s baseline during elevated base load.
              </p>
            </div>

            <div className="mt-4 space-y-2 text-xs font-mono divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Condition:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Bearing vibration RMS 4.82 mm/s</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Operational Impact:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">N-1 power redundancy margin degraded</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Key Dependency:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Power Bus A → Habitat &amp; Science Labs</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className="font-semibold text-[#DE324C]">Thermal breaker trip during impending blizzard</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Recommendation:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Synchronize G-01 standby before load shed</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            <Link
              to="/digital-twin"
              search={{ asset: "G-02" }}
              className="px-3 py-1.5 rounded bg-[#369ACC] hover:bg-[#369ACC]/90 text-white text-xs font-mono font-bold transition-colors"
            >
              INSPECT ASSET
            </Link>
            <button
              type="button"
              onClick={() => setExplainOpen(true)}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium transition-colors"
            >
              EXPLAIN EVENT
            </button>
            <Link
              to="/digital-twin"
              search={{ asset: "G-02" }}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium transition-colors"
            >
              VIEW DEPENDENCIES
            </Link>
          </div>
        </section>

        {/* G-02 Asset Intelligence Card */}
        <section
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="asset-intel-heading"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono font-bold text-[#369ACC] uppercase tracking-wider">
                G-02 · ASSET INTELLIGENCE &amp; CURRENT STATE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                REAL-TIME TELEMETRY
              </span>
            </div>

            {/* Vibration RMS Live Chart */}
            <div className="mt-4 p-3 rounded bg-slate-50 dark:bg-[#070B12] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  VIBRATION (RMS)
                </span>
                <span className="text-sm font-mono font-bold text-[#DE324C]">
                  {currentVib.toFixed(2)} mm/s
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-10 w-full pt-1">
                {vibBars.map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}px` }}
                    className={`flex-1 rounded-t transition-all ${
                      i >= vibBars.length - 3
                        ? "bg-[#DE324C]"
                        : "bg-[#369ACC]/60"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <span>Baseline: 2.80 mm/s</span>
                <span className="text-amber-500 font-semibold">Warning: 4.50 mm/s</span>
                <span className="text-[#DE324C] font-semibold">Critical: 7.10 mm/s</span>
              </div>
            </div>

            {/* Current State Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Operating Load</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {currentLoad.toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Winding Temp</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {currentTemp.toFixed(1)}°C
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Provenance</span>
                <span className="text-sm font-bold text-[#369ACC] mt-0.5 block">
                  MEASURED
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>PROVENANCE: MEASURED · REAL-TIME SENSORS</span>
            <span>POLAROPS SENSOR FEED OK</span>
          </div>
        </section>
      </div>

      {/* ============================================================
          6. CAUSAL REASONING CHAIN (Section 19)
          WHAT CHANGED → WHAT NOW → DEPENDENCY → RISK → CONSEQUENCE → SCENARIO → ACTION
          ============================================================ */}
      <section
        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs"
        aria-labelledby="causal-reasoning-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 id="causal-reasoning-heading" className="text-xs font-mono font-bold tracking-wider text-[#6D5BD0] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6D5BD0]" />
              <span>CAUSAL REASONING CHAIN · MULTI-STAGE ANALYSIS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministic causal trace from initial telemetry deviation to operator action.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6D5BD0]/10 text-[#6D5BD0] border border-[#6D5BD0]/30 font-bold self-start sm:self-auto">
            DERIVED · REASONING ENGINE
          </span>
        </div>

        {/* The 7-step causal chain */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 mt-4">
          {[
            {
              step: "01",
              stage: "WHAT CHANGED",
              title: "Vibration Deviation",
              detail: "G-02 RMS vibration rose to 4.82 mm/s (>4.5 threshold).",
              highlight: false,
            },
            {
              step: "02",
              stage: "WHAT NOW",
              title: "N-1 Margin Degraded",
              detail: "Generator G-01 warm standby engaged. Redundancy reduced.",
              highlight: false,
            },
            {
              step: "03",
              stage: "DEPENDENCY",
              title: "Power Bus A",
              detail: "Feeds Habitat life support and Science atmospheric lasers.",
              highlight: false,
            },
            {
              step: "04",
              stage: "RISK",
              title: "Thermal Trip Risk",
              detail: "Elevated blizzard headwinds risk thermal breaker trip.",
              highlight: true,
            },
            {
              step: "05",
              stage: "CONSEQUENCE",
              title: "Shed Non-Essential",
              detail: "Unscheduled trip would trigger automatic lab load shedding.",
              highlight: false,
            },
            {
              step: "06",
              stage: "SCENARIO",
              title: "18h Runtime Window",
              detail: "Simulation shows 18h continuous stability under current load.",
              highlight: false,
            },
            {
              step: "07",
              stage: "ACTION",
              title: "Transfer Load & Sync",
              detail: "Shift non-essential loads to Bus B and synchronize G-01.",
              highlight: true,
            },
          ].map((item, idx) => (
            <div
              key={item.step}
              className={`p-3 rounded border text-xs flex flex-col justify-between transition-colors ${
                item.highlight
                  ? "bg-[#6D5BD0]/10 border-[#6D5BD0]/40 text-slate-900 dark:text-white"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>STAGE {item.step}</span>
                  {idx < 6 && <ChevronRight size={12} className="hidden xl:block text-slate-400" />}
                </div>
                <div className="font-mono font-bold text-[10px] text-[#6D5BD0] uppercase">
                  {item.stage}
                </div>
                <div className="font-bold text-xs mt-1 text-slate-900 dark:text-white">
                  {item.title}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span>DATA HONESTY: ILLUSTRATIVE DETERMINISTIC CAUSAL GRAPH (BFS DERIVED)</span>
          <button
            type="button"
            onClick={() => setExplainOpen(true)}
            className="text-[#369ACC] hover:underline font-semibold"
          >
            VIEW FULL 5-STAGE EXPLANATION DRAWER →
          </button>
        </div>
      </section>

      {/* ============================================================
          7. HUMAN-IN-THE-LOOP CONTROL (Section 20)
          RECOMMENDATION · OPERATOR APPROVAL REQUIRED
          Actions: Approve, Modify, Reject
          ============================================================ */}
      <section
        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs"
        aria-labelledby="human-in-the-loop-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#F4895F] tracking-widest uppercase">
              OPERATIONAL DECISION SUPPORT
            </span>
            <h2 id="human-in-the-loop-heading" className="text-base font-bold font-headline text-slate-900 dark:text-white">
              HUMAN-IN-THE-LOOP CONTROL · OPERATOR APPROVAL REQUIRED
            </h2>
          </div>
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold border self-start sm:self-auto ${
              approvalState === "approved"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                : approvalState === "rejected"
                ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800"
                : approvalState === "modified"
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
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

        <div className="py-4 space-y-3">
          <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-mono font-bold text-[#369ACC] uppercase block mb-1">
              PROPOSED MITIGATION PROTOCOL:
            </span>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
              Transfer non-critical science laboratory loads to Power Bus B and initiate hot-standby synchronization on Generator G-01 to restore N-1 electrical headroom before evening blizzard arrival.
            </p>
          </div>

          {approvalState === "pending" ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setApprovalState("approved")}
                className="px-4 py-2 rounded bg-[#4FAE7A] hover:bg-[#4FAE7A]/90 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check size={14} />
                <span>APPROVE ACTION</span>
              </button>

              <button
                type="button"
                onClick={() => setApprovalState("modified")}
                className="px-4 py-2 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>MODIFY PARAMETERS</span>
              </button>

              <button
                type="button"
                onClick={() => setApprovalState("rejected")}
                className="px-4 py-2 rounded border border-red-300 dark:border-red-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X size={14} />
                <span>REJECT ACTION</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded bg-slate-100 dark:bg-slate-800/80 text-xs font-mono">
              <span className="text-slate-700 dark:text-slate-300">
                Action recorded by Operator. Timestamp logged to Station Engineering Log.
              </span>
              <button
                type="button"
                onClick={() => setApprovalState("pending")}
                className="text-[#369ACC] hover:underline font-bold"
              >
                RESET DECISION
              </button>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-2">
          <ShieldCheck size={15} className="text-[#369ACC] shrink-0" />
          <span>
            <b>PolarOps operates strictly in an advisory role.</b> Operational control and final equipment switching remain under human command.
          </span>
        </div>
      </section>

      {/* ============================================================
          8. CROSS-STATION CONTEXT (Section 21)
          Bharati vs Maitri (health, resources, connectivity, alerts, context)
          No ranking as best/worst
          ============================================================ */}
      <section
        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs"
        aria-labelledby="cross-station-context-heading"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="cross-station-context-heading" className="text-xs font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              CROSS-STATION OPERATIONAL CONTEXT · NCPOR ANTARCTIC BASES
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Balanced multi-station status comparison without reductive ranking.
            </p>
          </div>
          <Link
            to="/stations"
            className="text-[11px] font-mono text-[#369ACC] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>FULL PORTFOLIO</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Station 1: BHARATI */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-mono text-[#369ACC] uppercase font-bold">PRIMARY COASTAL BASE</span>
                <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">
                  Bharati Station
                </h3>
                <div className="text-[10px] font-mono text-slate-400">69°24′S 76°11′E · Larsemann Hills</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#F4895F]/10 text-[#F4895F] border border-[#F4895F]/30">
                WATCH
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-y border-slate-200/80 dark:border-slate-800 text-xs font-mono my-2">
              <div>
                <span className="text-[10px] text-slate-400 block">HEALTH</span>
                <span className="font-bold text-slate-900 dark:text-white">88.4%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">FUEL RUNWAY</span>
                <span className="font-bold text-slate-900 dark:text-white">81 Days</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">PERSONNEL</span>
                <span className="font-bold text-slate-900 dark:text-white">24 POB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ACTIVE ALERTS</span>
                <span className="font-bold text-[#F4895F]">1 Warning</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Coastal research outpost with automated atmospheric instrumentation and high-bandwidth Ku-band telemetry.
            </p>
          </div>

          {/* Station 2: MAITRI */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-mono text-[#369ACC] uppercase font-bold">INLAND RESEARCH BASE</span>
                <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">
                  Maitri Station
                </h3>
                <div className="text-[10px] font-mono text-slate-400">70°46′S 11°44′E · Schirmacher Oasis</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                NOMINAL
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-y border-slate-200/80 dark:border-slate-800 text-xs font-mono my-2">
              <div>
                <span className="text-[10px] text-slate-400 block">HEALTH</span>
                <span className="font-bold text-slate-900 dark:text-white">94.2%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">FUEL RUNWAY</span>
                <span className="font-bold text-slate-900 dark:text-white">142 Days</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">PERSONNEL</span>
                <span className="font-bold text-slate-900 dark:text-white">18 POB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ACTIVE ALERTS</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">0 Active</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Inland oasis station maintaining geological and geomagnetic observation records with HF/satellite store-and-forward.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          9. OPERATIONAL ACTIVITY & SUBSYSTEM STATE (Sections 13 & 27)
          ============================================================ */}
      <section aria-labelledby="operational-activity-heading">
        <ActivityStream
          stationId={stationId}
          onOpenExplanation={(domain, entityId) => {
            openStationExplanation(domain, entityId);
          }}
        />
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
