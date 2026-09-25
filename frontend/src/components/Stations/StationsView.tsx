import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  HelpCircle,
  Layers,
  Play,
  RefreshCw,
  Radio,
  AlertTriangle,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  fetchStationComparison,
  evaluateStationComparison,
  simulateCrossStationScenario,
  type StationComparisonResponse,
  type CrossStationScenarioResponse,
} from "../../lib/api";
import { TruthBadge } from "../TruthBadge";
import { useStation, type StationId } from "@/context/StationContext";

export interface StationsViewProps {
  onBack: () => void;
  onOpenExplanation?: (domain: string, entityId: string) => void;
}

type ContextSectionFilter = "ALL" | "DIFFERENCES" | "RECOVERY" | "CONSTRAINTS" | "SIMULATION";

export function StationsView({ onBack, onOpenExplanation }: StationsViewProps) {
  const navigate = useNavigate();
  const stationCtx = useStation();
  const activeStationId = stationCtx?.activeStationId || "STATION-BHARATI";

  const [data, setData] = useState<StationComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);
  const [activeSectionFilter, setActiveSectionFilter] = useState<ContextSectionFilter>("ALL");

  // Progressive disclosure states
  const [expandedDifferences, setExpandedDifferences] = useState<Record<string, boolean>>({});
  const [expandedConstraints, setExpandedConstraints] = useState<Record<string, boolean>>({});
  const [expandedAdvisories, setExpandedAdvisories] = useState<Record<string, boolean>>({});
  const [expandedSimOptions, setExpandedSimOptions] = useState<Record<string, boolean>>({});

  // Cross-station scenario state
  const [scenarioDurationHours, setScenarioDurationHours] = useState<number>(72.0);
  const [scenarioTempOverride, setScenarioTempOverride] = useState<number>(-28.5);
  const [simulatingScenario, setSimulatingScenario] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<CrossStationScenarioResponse | null>(null);

  const toggleDifference = (dimension: string) => {
    setExpandedDifferences((prev) => ({ ...prev, [dimension]: !prev[dimension] }));
  };

  const toggleConstraint = (type: string) => {
    setExpandedConstraints((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleAdvisory = (id: string) => {
    setExpandedAdvisories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSimOption = (code: string) => {
    setExpandedSimOptions((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchStationComparison("STATION-BHARATI", "STATION-MAITRI");
      setData(res);
    } catch (err) {
      console.error("Failed to load station comparison:", err);
      setError("Unable to retrieve current station comparison from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, []);

  const handleSelectStation = (stationId: StationId) => {
    if (stationCtx?.setActiveStationId) {
      stationCtx.setActiveStationId(stationId);
    }
    navigate({
      to: "/command-center",
      search: { station: stationId },
    });
  };

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      const res = await evaluateStationComparison("STATION-BHARATI", "STATION-MAITRI");
      setData(res);
      setEvaluationFeedback("Cross-station alignment evaluated and logged to Operational Timeline.");
      setTimeout(() => setEvaluationFeedback(null), 4000);
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRunCrossStationScenario = async () => {
    try {
      setSimulatingScenario(true);
      const res = await simulateCrossStationScenario({
        disrupted_station_id: "STATION-BHARATI",
        support_station_id: "STATION-MAITRI",
        target_asset_id: "G-02",
        duration_hours: scenarioDurationHours,
        ambient_temp_celsius: scenarioTempOverride,
      });
      setScenarioResult(res);
    } catch (err) {
      console.error("Cross-station scenario simulation failed:", err);
    } finally {
      setSimulatingScenario(false);
    }
  };

  if (loading) {
    return (
      <div
        data-testid="stations-loading-indicator"
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center space-y-4"
      >
        <div className="relative inline-flex items-center justify-center">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <Radio className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <div className="space-y-1.5 font-sans">
          <h2 className="text-base font-semibold text-foreground">
            Synchronizing Polar Station Telemetry
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto font-sans">
            Comparing operational state between Station Bharati and Station Maitri...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-white dark:bg-slate-900 p-12 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <div className="space-y-1 font-sans">
          <h2 className="text-lg font-semibold text-foreground">
            Station Data Unavailable
          </h2>
          <p className="text-sm text-muted-foreground font-sans">
            {error || "Unable to retrieve the current station state from backend."}
          </p>
        </div>
        <button
          onClick={loadComparison}
          className="px-5 py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { station_a, station_b } = data;
  const isBharatiActive = activeStationId === "STATION-BHARATI";
  const isMaitriActive = activeStationId === "STATION-MAITRI";

  const g02Recovery = data.recovery_chain?.find(
    (r) => r.asset_code === "G-02" || r.station_id === "STATION-BHARATI"
  );

  return (
    <div className="space-y-12 animate-fade-in pb-24 font-sans text-slate-800 dark:text-slate-200" data-testid="stations-view">
      {/* ── LEVEL 1: Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onBack}
              aria-label="Return to Station Command Center"
              data-testid="stations-back-btn"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Command Center</span>
            </button>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Antarctic Station Network
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            STATIONS
          </h1>
          <p className="text-base text-muted-foreground">
            Cross-station operational overview and resource headroom.
          </p>
        </div>

        {/* Header Right Status & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Network Online</span>
            <span className="text-muted-foreground">· 2 Bases Monitored</span>
          </div>

          <TruthBadge type="DERIVED" />

          <button
            onClick={() => {
              if (onOpenExplanation) {
                onOpenExplanation("CROSS_STATION", "PORTFOLIO");
              } else if (stationCtx?.openExplanation) {
                stationCtx.openExplanation("CROSS_STATION", "PORTFOLIO");
              }
            }}
            data-testid="stations-explain-btn"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 border border-primary/25 transition-colors cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Comparison Context</span>
          </button>

          <button
            onClick={loadComparison}
            title="Refresh Station Telemetry"
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── LEVEL 2: Primary Station Cards (2-Column Grid) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Card 1: BHARATI ─────────────────────────────────────── */}
        <div
          data-testid="station-card-bharati"
          className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 space-y-4 shadow-xs transition-all ${
            isBharatiActive
              ? "border-primary ring-2 ring-primary/20"
              : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          {/* Station Title, Status & Weather */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  BHARATI
                </h2>
                <span className="text-xs text-muted-foreground font-medium">Research Station</span>
                {isBharatiActive && (
                  <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Larsemann Hills · <span className="font-mono">69°24′S 76°11′E</span>
              </p>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>{station_a.status}</span>
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {station_a.temperature_celsius}°C · {station_a.wind_speed_knots} kt BLIZZARD
              </span>
            </div>
          </div>

          {/* Compact Operational Headroom */}
          <div className="py-2.5 px-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                  {station_a.overall_health}%
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Operational Headroom
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">
                Vibration Constraint
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${station_a.overall_health}%` }}
              />
            </div>
          </div>

          {/* 2×2 Clean Metric Grid (No nested cards) */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-0.5">
            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                POWER
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                94%
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-0.5">
                201 / 600 kW
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                FUEL
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                57%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                <span className="font-mono">142,500 L on hand</span> · <span className="font-mono">70.3d runway</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                PERSONNEL
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                52
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Active crew
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                RESILIENCE
              </span>
              <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                87%
              </div>
              <div className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                G-02 STOCKOUT
              </div>
            </div>
          </div>

          {/* Card Footer: Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Comms: <span className="font-mono">{station_a.comms_status}</span> · 1 active incident</span>
            </div>

            <button
              onClick={() => handleSelectStation("STATION-BHARATI")}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
            >
              <span>View Station</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Card 2: MAITRI ───────────────────────────────────────── */}
        <div
          data-testid="station-card-maitri"
          className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 md:p-6 space-y-4 shadow-xs transition-all ${
            isMaitriActive
              ? "border-primary ring-2 ring-primary/20"
              : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          {/* Station Title, Status & Weather */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  MAITRI
                </h2>
                <span className="text-xs text-muted-foreground font-medium">Research Station</span>
                {isMaitriActive && (
                  <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Schirmacher Oasis · <span className="font-mono">70°46′S 11°44′E</span>
              </p>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{station_b.status}</span>
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {station_b.temperature_celsius}°C · {station_b.wind_speed_knots} kt {station_b.conditions}
              </span>
            </div>
          </div>

          {/* Compact Operational Headroom */}
          <div className="py-2.5 px-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                  {station_b.overall_health}%
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Operational Headroom
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                Nominal Fleet
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${station_b.overall_health}%` }}
              />
            </div>
          </div>

          {/* 2×2 Clean Metric Grid (No nested cards) */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-0.5">
            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                POWER
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                90%
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-0.5">
                180 / 600 kW
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                FUEL
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                83%
              </div>
              <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +62.9d reserve surplus
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                PERSONNEL
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                25
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Active crew
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase block">
                RESILIENCE
              </span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                84%
              </div>
              <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                LOCKER M-2 STOCKED
              </div>
            </div>
          </div>

          {/* Card Footer: Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Comms: <span className="font-mono">{station_b.comms_status}</span> · Fleet nominal</span>
            </div>

            <button
              onClick={() => handleSelectStation("STATION-MAITRI")}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
            >
              <span>View Station</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── LEVEL 3: Network Headroom & Capabilities ───────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 md:p-8 space-y-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Network Headroom
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Operational capacity across monitored bases.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            DERIVED
          </span>
        </div>

        {/* Clean Station Comparison Horizontal Rows */}
        <div className="space-y-5">
          {/* Bharati Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                BHARATI
              </span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {station_a.overall_health}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${station_a.overall_health}%` }}
              />
            </div>
          </div>

          {/* Maitri Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                MAITRI
              </span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {station_b.overall_health}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${station_b.overall_health}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5-Domain Capability Breakdown Cards (Compact Summary) */}
        <div
          data-testid="operational-capabilities-section"
          className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Domain Capabilities Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {station_a.capabilities.map((capA, idx) => {
              const capB = station_b.capabilities[idx] ?? capA;
              const delta = capB.headroom_score - capA.headroom_score;
              return (
                <div
                  key={capA.domain}
                  data-testid={`capability-card-${capA.domain.toLowerCase()}`}
                  className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-3"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {capA.name}
                  </div>

                  <div className="space-y-2">
                    {/* Bharati Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Bharati:</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {capA.headroom_score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            capA.headroom_score < 40
                              ? "bg-rose-500"
                              : capA.headroom_score < 70
                              ? "bg-amber-500"
                              : "bg-primary"
                          }`}
                          style={{ width: `${capA.headroom_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Maitri Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Maitri:</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {capB.headroom_score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            capB.headroom_score < 40
                              ? "bg-rose-500"
                              : capB.headroom_score < 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${capB.headroom_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
                    <span
                      className={
                        delta > 0
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : delta < 0
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {delta > 0
                        ? `Maitri +${delta}% headroom`
                        : delta < 0
                        ? `Bharati +${Math.abs(delta)}% headroom`
                        : "Parity"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── LEVEL 4: Cross-Station Operational Context ──────────────── */}
      <div className="space-y-8">
        {/* Modern Segmented Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Operational Context
            </h2>
          </div>

          {/* Clean Segmented Control */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            {(
              [
                ["ALL", "All Views"],
                ["DIFFERENCES", "Differences"],
                ["RECOVERY", "Recovery Chain"],
                ["CONSTRAINTS", "Constraints & Advisory"],
                ["SIMULATION", "Simulation"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveSectionFilter(key)}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  activeSectionFilter === key
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Operational Differences Table */}
        {(activeSectionFilter === "ALL" || activeSectionFilter === "DIFFERENCES") && (
          <div
            data-testid="operational-differences-section"
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-4 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Deterministic Operational Differences
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm" data-testid="differences-table">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Dimension</th>
                    <th className="py-3 px-4">Bharati</th>
                    <th className="py-3 px-4">Maitri</th>
                    <th className="py-3 px-4">Difference</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {data.differences.map((diff) => {
                    const isExpanded = expandedDifferences[diff.dimension];
                    return (
                      <React.Fragment key={diff.dimension}>
                        <tr
                          onClick={() => toggleDifference(diff.dimension)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {diff.title}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {diff.station_a_value}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {diff.station_b_value}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-primary">
                            {diff.delta_summary}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                diff.significance === "CRITICAL"
                                  ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                                  : diff.significance === "MODERATE"
                                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {diff.significance}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? "Hide" : "View details"}</span>
                              <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                            <td colSpan={6} className="py-3 px-6 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Pressure Axis: </span>
                                <span className="font-mono">{diff.pressure_direction.replace(/_/g, " ")}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Operational Significance: </span>
                                <span>{diff.significance} divergence along {diff.title}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 2: Generator G-02 Recovery Section */}
        {(activeSectionFilter === "ALL" || activeSectionFilter === "RECOVERY") && (
          <div
            data-testid="recovery-logistics-intelligence-card"
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                  G-02 Recovery
                </h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                  RECOVERY STATUS: {g02Recovery?.recovery_status ?? "CONSTRAINED"}
                </span>
              </div>

              <button
                onClick={() => {
                  if (onOpenExplanation) {
                    onOpenExplanation("RECOVERY", "G-02");
                  } else if (stationCtx?.openExplanation) {
                    stationCtx.openExplanation("RECOVERY", "G-02");
                  }
                }}
                data-testid="why-recovery-constrained-btn"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/80 transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Why is Recovery Constrained?</span>
              </button>
            </div>

            {/* Concise 2×2 / 4-card Recovery Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Technical Condition */}
              <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    1. TECHNICAL CONDITION
                  </span>
                  <div className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                    Bearing vibration elevated at <span className="font-mono font-semibold">4.8 mm/s</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                  Bearing fatigue (ceiling <span className="font-mono">4.0 mm/s</span>)
                </div>
              </div>

              {/* Material Constraint */}
              <div className="p-5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-2">
                    2. MATERIAL CONSTRAINT
                  </span>
                  <div className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                    <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">SK-402</span> Rotary Fuel Injection Pump Seal Kit
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                  <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">0</span> units available at Bharati (stockout) · Part # <span className="font-mono">SP-SK-402</span>
                </div>
              </div>

              {/* Logistics Constraint */}
              <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary block mb-2">
                    3. LOGISTICS CONSTRAINT
                  </span>
                  <div className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                    Maritime expedition vessel MV Vasiliy Golovnin
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                  Resupply window <span className="font-mono font-medium text-slate-700 dark:text-slate-300">~11 days</span> (weather dependent)
                </div>
              </div>

              {/* Operational Exposure */}
              <div className="p-5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-2">
                    4. OPERATIONAL EXPOSURE
                  </span>
                  <div className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                    Loss of <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">N+1</span> generator redundancy
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                  Single-fault vulnerable microgrid posture under winter load
                </div>
              </div>
            </div>

            {/* Horizontal Recovery Timeline Track */}
            <div className="p-5 md:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                <span className="font-semibold text-slate-900 dark:text-white">
                  DETERMINISTIC RECOVERY STAGES
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  STAGE 2 OF 5: PART UNAVAILABLE
                </span>
              </div>

              {/* Spacious 5-Stage Track */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-center text-xs font-medium">
                <div className="py-2.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                  1. Condition Identified
                </div>
                <div className="py-2.5 px-3 rounded-lg bg-rose-600 text-white shadow-xs font-semibold">
                  2. Part Unavailable
                </div>
                <div className="py-2.5 px-3 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  3. Resupply Window
                </div>
                <div className="py-2.5 px-3 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  4. Part on Site
                </div>
                <div className="py-2.5 px-3 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  5. Overhaul
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 leading-relaxed">
                <span>
                  Current stage: Part unavailable · Next dependency: Resupply (<span className="font-mono font-medium">~11d</span>) · Repair duration requires post-delivery mechanical inspection.
                </span>
                <span className="text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                  Requires future validation
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Coordination Constraints & Advisory Considerations */}
        {(activeSectionFilter === "ALL" || activeSectionFilter === "CONSTRAINTS") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coordination & Logistics Constraints */}
            <div
              data-testid="coordination-constraints-card"
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-5 shadow-xs"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Coordination &amp; Logistics Constraints
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {data.constraints.map((c) => {
                  const isExpanded = expandedConstraints[c.constraint_type];
                  return (
                    <div
                      key={c.constraint_type}
                      className="py-3.5 first:pt-0 last:pb-0 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {c.name}
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            c.status === "RESTRICTED" || c.status === "IMPASSABLE"
                              ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans pl-6">
                        {c.details}
                      </p>

                      <div className="pl-6 pt-0.5">
                        <button
                          type="button"
                          onClick={() => toggleConstraint(c.constraint_type)}
                          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? "Hide details" : "View details →"}</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="ml-6 mt-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs text-muted-foreground animate-fade-in">
                          <div>
                            <strong className="text-slate-700 dark:text-slate-300 font-medium">Operational Impact: </strong>
                            <span>{c.impact}</span>
                          </div>
                          {c.provenance_type && (
                            <div>
                              <strong className="text-slate-700 dark:text-slate-300 font-medium">Source: </strong>
                              <span className="font-mono">{c.provenance_type}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advisory Coordination Considerations */}
            <div
              data-testid="cross-station-considerations-card"
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-5 shadow-xs"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Advisory Coordination Considerations
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {data.considerations.map((item) => {
                  const isExpanded = expandedAdvisories[item.id];
                  return (
                    <div
                      key={item.id}
                      className="py-3.5 first:pt-0 last:pb-0 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0">
                          {item.feasibility_status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                        {item.recommendation}
                      </p>

                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => toggleAdvisory(item.id)}
                          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? "Hide details" : "View details →"}</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs text-muted-foreground animate-fade-in">
                          <div>
                            <strong className="text-slate-700 dark:text-slate-300 font-medium">Rationale: </strong>
                            <span>{item.rationale}</span>
                          </div>
                          {item.prerequisites.length > 0 && (
                            <div>
                              <strong className="text-amber-700 dark:text-amber-400 font-medium">Prerequisites: </strong>
                              <span className="font-mono">{item.prerequisites.join(" · ")}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {evaluationFeedback && (
                <div
                  data-testid="alignment-success-banner"
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium"
                >
                  {evaluationFeedback}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating}
                  data-testid="stations-evaluate-btn"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {evaluating ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Layers className="h-3.5 w-3.5" />
                  )}
                  <span>Record Analysis in Timeline</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Cross-Station Scenario Simulation */}
        {(activeSectionFilter === "ALL" || activeSectionFilter === "SIMULATION") && (
          <div
            data-testid="cross-station-scenario-section"
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-5 shadow-xs"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                <span>Cross-Station Disruption Simulation</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluate cross-station impact under a simulated disruption.
              </p>
            </div>

            {/* Inputs: Clean Horizontal Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Disruption Duration (Hours):
                </label>
                <input
                  type="number"
                  value={scenarioDurationHours}
                  onChange={(e) => setScenarioDurationHours(parseFloat(e.target.value) || 72)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ambient Temperature (°C):
                </label>
                <input
                  type="number"
                  value={scenarioTempOverride}
                  onChange={(e) => setScenarioTempOverride(parseFloat(e.target.value) || -28.5)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunCrossStationScenario}
                  disabled={simulatingScenario}
                  data-testid="run-cross-station-scenario-btn"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {simulatingScenario ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  <span>Run Simulation</span>
                </button>
              </div>
            </div>

            {/* Subtle Minimal Information Line */}
            <div className="text-xs text-muted-foreground font-sans flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Advisory simulation · No physical transfers are executed.</span>
            </div>

            {/* Simulation Results Output */}
            {scenarioResult && (
              <div
                data-testid="cross-station-scenario-results"
                className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-1.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      DISRUPTED STATION: {scenarioResult.disrupted_station_name}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {scenarioResult.disruption_summary}
                    </p>
                    <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                      Remaining Reserve Margin: {scenarioResult.reserve_margin_disrupted_kw} kW
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-1.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      SUPPORT STATION HEADROOM: {scenarioResult.support_station_name}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {scenarioResult.support_capacity_summary}
                    </p>
                    <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      Available Reserve Headroom: +{scenarioResult.reserve_margin_support_kw} kW
                    </div>
                  </div>
                </div>

                {/* Decision Options */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                    SIMULATED DISRUPTION IMPACT — Advisory Options ({scenarioResult.decision_options.length})
                  </div>
                  <div className="space-y-2">
                    {scenarioResult.decision_options.map((opt) => {
                      const isExpanded = expandedSimOptions[opt.code];
                      return (
                        <div
                          key={opt.code}
                          className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {opt.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                              {opt.risk_reduction_tier} RISK REDUCTION
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                            {opt.description}
                          </p>
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => toggleSimOption(opt.code)}
                              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? "Hide details" : "View details →"}</span>
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="mt-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs text-muted-foreground animate-fade-in">
                              {opt.operational_impact && (
                                <div>
                                  <strong className="text-slate-700 dark:text-slate-300 font-medium">Operational Consequence: </strong>
                                  <span>{opt.operational_impact}</span>
                                </div>
                              )}
                              {opt.disclaimer && (
                                <div>
                                  <strong className="text-slate-700 dark:text-slate-300 font-medium">Disclaimer: </strong>
                                  <span>{opt.disclaimer}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
