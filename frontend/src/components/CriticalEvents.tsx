import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  ExternalLink,
  HelpCircle,
  Layers,
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Wind,
  Wrench,
} from "lucide-react";
import type { CausalStageItem, CriticalEventItem, OperationalDecisionItem } from "../lib/api";
import { useOperationalIntelligence } from "../hooks/useOperationalIntelligence";

export interface CriticalEventsProps {
  events: CriticalEventItem[];
  stationId?: string;
  onInspectAsset?: (assetId: string) => void;
  onOpenExplanation?: (domain: string, entityId: string) => void;
  onNavigateRoute?: (route: string) => void;
}

export function CriticalEvents({
  events,
  stationId = "STATION-BHARATI",
  onInspectAsset,
  onOpenExplanation,
  onNavigateRoute,
}: CriticalEventsProps) {
  const { data: insight } = useOperationalIntelligence(stationId);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [showAllStages, setShowAllStages] = useState<boolean>(true);

  // Fallback if data is still loading
  const isCritical = insight?.severity === "CRITICAL" || (events && events.length > 0);
  const isMaitri = stationId.toUpperCase().includes("MAITRI");

  const handleRoute = (route: string) => {
    if (onNavigateRoute) {
      onNavigateRoute(route);
    } else if (route.startsWith("/assets/") && onInspectAsset) {
      onInspectAsset(route.replace("/assets/", ""));
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "CHANGE":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case "CONTEXT":
        return <Wind className="h-4 w-4 text-sky-500" />;
      case "DEPENDENCY":
        return <Network className="h-4 w-4 text-amber-500" />;
      case "RISK":
        return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      case "CONSEQUENCE":
        return <TrendingDown className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
      case "SCENARIO":
        return <Layers className="h-4 w-4 text-blue-500" />;
      case "ACTION":
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      default:
        return <Cpu className="h-4 w-4 text-slate-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-900/60";
      case "WARNING":
        return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60";
      case "NOMINAL":
        return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60";
      default:
        return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800";
    }
  };

  const getTruthBadge = (truthType: string) => {
    switch (truthType.toUpperCase()) {
      case "MEASURED":
        return "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "DERIVED":
        return "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      case "SCENARIO":
        return "bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    }
  };

  return (
    <section
      data-testid="operational-intelligence-surface"
      className={`rounded-xl border transition-all shadow-sm ${
        isCritical
          ? "border-amber-300 dark:border-amber-900/80 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-[#181b24]"
          : "border-emerald-300 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-[#181b24]"
      }`}
    >
      {/* ── LEVEL 1: IMMEDIATE SITUATION AWARENESS & PRIMARY ACTIONS ── */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#2a2f3e]">
        {/* ROW 1: Posture & Station Identity Tags (Left) + Actions Bar (Right) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-[#2a2f3e]/80">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase border shadow-2xs ${
                isCritical
                  ? "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-900"
                  : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900"
              }`}
            >
              {isCritical ? (
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              {isCritical
                ? "CRITICAL OPERATIONAL EVENT · NO POWER REDUNDANCY"
                : "NOMINAL OPERATIONAL POSTURE · FULL REDUNDANCY"}
            </span>

            <span className="text-xs font-mono font-bold text-slate-700 dark:text-[#c9d1d9] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#21262d] border border-slate-200 dark:border-[#30363d]">
              {insight?.station_name ?? (isMaitri ? "Maitri Station" : "Bharati Station")}
            </span>

            <span
              className={`text-[11px] font-mono font-bold rounded px-2 py-0.5 border ${
                isCritical
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              }`}
            >
              {insight?.status_label ?? (isCritical ? "SINGLE FAULT VULNERABLE" : "FLEET NOMINAL")}
            </span>
          </div>

          {/* Quick Actions Bar — Primary CTA + Subordinate Secondary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PRIMARY ACTION: Inspect Asset Intelligence (G-02) */}
            {isCritical && (
              <button
                onClick={() => {
                  if (onInspectAsset) onInspectAsset("G-02");
                  else handleRoute("/assets/G-02");
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:shadow-md ring-1 ring-amber-400"
              >
                <span>Inspect Asset G-02 (Asset Intelligence)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {/* SECONDARY ACTION 1: WHY? Explanation Button */}
            <button
              onClick={() =>
                onOpenExplanation?.(
                  "ASSET",
                  insight?.primary_condition_id === "G-02" || isCritical ? "G-02" : "STATION"
                )
              }
              data-testid="critical-event-why-btn"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#383f52] bg-white dark:bg-[#181b24] hover:bg-slate-100 dark:hover:bg-[#222736] text-slate-800 dark:text-[#c9d1d9] px-3 py-2 text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
              title="Open deterministic operational explanation drawer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Why is this high risk?</span>
            </button>

            {/* SECONDARY ACTION 2: Explore Scenarios */}
            <button
              onClick={() => handleRoute("/scenarios")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#383f52] bg-white dark:bg-[#181b24] hover:bg-slate-100 dark:hover:bg-[#222736] text-slate-800 dark:text-[#c9d1d9] px-3 py-2 text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              <span>Simulate 72h Outage</span>
            </button>

            {/* SECONDARY ACTION 3: Check Spares & Recovery */}
            <button
              onClick={() => handleRoute("/resources?tab=spares")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#383f52] bg-white dark:bg-[#181b24] hover:bg-slate-100 dark:hover:bg-[#222736] text-slate-800 dark:text-[#c9d1d9] px-3 py-2 text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-500" />
              <span>Check Spares &amp; Recovery</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Main Story (Left ~58%) & Supporting Operational Context (Right ~42%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 items-start">
          {/* Main Operational Story */}
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-[#f0f6fc] font-mono tracking-tight leading-snug">
              {insight?.headline ??
                (isCritical
                  ? "Generator G-02 Bearing Vibration Anomaly Coupled with Blizzard Threatens Life Support Heating"
                  : "Maitri Power Generation Fleet Operating at 100% Capacity with Zero Thermal Bottlenecks")}
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-[#9ca3b4] font-sans leading-relaxed">
              {insight?.summary ??
                (isCritical
                  ? "Primary generator G-02 exhibits mechanical degradation while approaching blizzard winds elevate habitat thermal load to 252.2 kW. Multi-hop BFS dependencies identify Life Support Zone 2 heating exposure."
                  : "Maitri exhibits full dual-generator redundancy with 133.1 days fuel runway and 2x SK-402 seal kits in inventory.")}
            </p>
          </div>

          {/* Supporting Operational Context (Existing 3 Briefing Questions) */}
          <div className="lg:col-span-5 space-y-2.5">
            {/* Question 1: What is happening? */}
            <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white/80 dark:bg-[#161922] p-3 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-[#e4e8f0]">
                <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-3 w-3" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-[#8b949e]">
                  1. What is happening?
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-[#c9d1d9] font-sans leading-relaxed">
                {isCritical
                  ? "Primary generator G-02 bearing vibration has reached 4.8 mm/s, operating above warning threshold (4.5 mm/s)."
                  : "Primary generator fleet is operating at 100% capacity with all bearing vibrations below 1.8 mm/s."}
              </p>
            </div>

            {/* Question 2: Why does it matter? */}
            <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white/80 dark:bg-[#161922] p-3 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-[#e4e8f0]">
                <div className="p-1 rounded bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                  <Wind className="h-3 w-3" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-[#8b949e]">
                  2. Why does it matter?
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-[#c9d1d9] font-sans leading-relaxed">
                {isCritical
                  ? "Blizzard winds (42 kt) increase heating demand to 252.2 kW. Multi-hop dependencies show G-02 failure starves Life Support Zone 2."
                  : "Full dual-generator redundancy (N+1) with 133.1 days fuel runway in calm Oasis microclimate."}
              </p>
            </div>

            {/* Question 3: What is blocking recovery? */}
            <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white/80 dark:bg-[#161922] p-3 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-[#e4e8f0]">
                <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Wrench className="h-3 w-3" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-[#8b949e]">
                  3. What blocks recovery?
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-[#c9d1d9] font-sans leading-relaxed">
                {isCritical
                  ? "Required seal kit SK-402 is out of stock at Bharati. Station risk is 91/100 until replacement arrives or backup preheats."
                  : "2x SK-402 seal kits stored in local inventory. Station holds surplus operational headroom."}
              </p>
            </div>
          </div>
        </div>

        {/* ── LEVEL 3: HERO CAUSAL PROGRESSION PIPELINE BAR ── */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#2a2f3e]/60">
          <div className="text-[11px] font-mono text-slate-500 dark:text-[#8b949e] mb-2 flex items-center justify-between">
            <span className="font-bold tracking-wider uppercase text-slate-700 dark:text-[#c9d1d9]">
              HERO CAUSAL CHAIN · WHAT CHANGED → WHAT NOW
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 dark:text-[#7a8194] hidden sm:inline">
                Deterministic 7-Stage Traversal
              </span>
              <button
                onClick={() => setShowAllStages(!showAllStages)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-[#21262d] text-slate-700 dark:text-[#8b949e] px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer"
                title={showAllStages ? "Collapse Causal Pipeline Evidence" : "Expand Full Causal Pipeline Evidence"}
              >
                <Database className="h-3 w-3 text-blue-500" />
                <span>{showAllStages ? "Compact Evidence" : "7-Stage Evidence"}</span>
                {showAllStages ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { key: "CHANGE", label: "1. CHANGE", sub: isCritical ? "G-02 Vibration 4.8 mm/s" : "Nominal Fleet", sev: isCritical ? "CRITICAL" : "NOMINAL" },
              { key: "CONTEXT", label: "2. CONTEXT", sub: isCritical ? "Blizzard 42 kt / -28.5°C" : "Oasis Calm / 133d Fuel", sev: isCritical ? "WARNING" : "NOMINAL" },
              { key: "DEPENDENCY", label: "3. DEPENDENCY", sub: isCritical ? "Zone 2 Heating Cogeneration" : "N+1 Power Redundancy", sev: isCritical ? "CRITICAL" : "NOMINAL" },
              { key: "RISK", label: "4. RISK", sub: isCritical ? "91/100 · SK-402 Stockout" : "12/100 · 2 Spares", sev: isCritical ? "CRITICAL" : "NOMINAL" },
              { key: "CONSEQUENCE", label: "5. CONSEQUENCE", sub: isCritical ? "N-0 · No backup generator" : "+420 kW Reserve Headroom", sev: isCritical ? "CRITICAL" : "NOMINAL" },
              { key: "SCENARIO", label: "6. SCENARIO", sub: isCritical ? "72h Outage → 98.8 kW" : "Resupply Independence", sev: isCritical ? "CRITICAL" : "NOMINAL" },
              { key: "ACTION", label: "7. ACTION", sub: isCritical ? "Inspect / Preheat Boiler B-01" : "Cross-Station Readiness", sev: isCritical ? "WARNING" : "NOMINAL" },
            ].map((step, idx) => (
              <button
                key={step.key}
                onClick={() => setExpandedStage(expandedStage === step.key ? null : step.key)}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  expandedStage === step.key
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-400 shadow-xs"
                    : step.sev === "CRITICAL"
                    ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
                    : step.sev === "WARNING"
                    ? "border-amber-300 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/15 hover:border-amber-400"
                    : "border-slate-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-slate-400 dark:hover:border-[#58a6ff]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className={step.sev === "CRITICAL" ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-[#c9d1d9]"}>
                    {step.label}
                  </span>
                  {idx < 6 && <span className="text-slate-300 dark:text-slate-600 hidden lg:inline">→</span>}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#8b949e] font-sans truncate mt-1" title={step.sub}>
                  {step.sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LEVEL 4: 7-STAGE DETAILED CAUSAL EVIDENCE PIPELINE ── */}
      {showAllStages && insight?.causal_chain && (
        <div className="p-4 sm:p-6 space-y-3 bg-white/60 dark:bg-[#12141c]/60 border-b border-slate-200 dark:border-[#2a2f3e]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-[#c9d1d9] flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-blue-500" />
              <span>DETERMINISTIC CAUSAL REASONING PIPELINE</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
              {insight.causal_chain.length} stages evaluated &middot; 100% deterministic
            </span>
          </div>

          <div className="space-y-2.5">
            {insight.causal_chain.map((stage: CausalStageItem) => {
              const isSelected = expandedStage === stage.stage;
              return (
                <div
                  key={stage.stage}
                  className={`rounded-lg border p-3.5 transition-all ${
                    isSelected
                      ? "border-blue-400 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs"
                      : "border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] hover:border-slate-300 dark:hover:border-[#383f52]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#21262d] border border-slate-200 dark:border-[#30363d] mt-0.5">
                        {getStageIcon(stage.stage)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                            {stage.stage} &middot; {stage.title}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(
                              stage.severity
                            )}`}
                          >
                            {stage.severity}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getTruthBadge(
                              stage.truth_type
                            )}`}
                          >
                            [{stage.truth_type}]
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 dark:text-[#c9d1d9] font-sans">
                          {stage.headline}
                        </p>

                        <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-sans leading-relaxed pt-0.5">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    {/* Stage Action Link */}
                    {stage.target_route && (
                      <button
                        onClick={() => handleRoute(stage.target_route!)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#21262d] dark:hover:bg-[#30363d] text-slate-700 dark:text-[#c9d1d9] px-2.5 py-1.5 text-xs font-mono font-semibold border border-slate-300 dark:border-[#30363d] transition-colors cursor-pointer self-start shadow-2xs"
                      >
                        <span>{stage.action_label || "Inspect Evidence"}</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* Supporting Metrics Pills */}
                  {stage.supporting_metrics && Object.keys(stage.supporting_metrics).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-[#2a2f3e]/60 text-xs font-mono">
                      {Object.entries(stage.supporting_metrics).slice(0, 4).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded bg-slate-50 dark:bg-[#0f1117] px-2.5 py-1.5 border border-slate-200 dark:border-[#2a2f3e]"
                        >
                          <span className="text-slate-500 dark:text-[#7a8194] truncate text-[11px]">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="font-bold text-slate-800 dark:text-[#e4e8f0] text-[11px] ml-1">
                            {Array.isArray(val)
                              ? `${val.length} items`
                              : typeof val === "boolean"
                              ? val ? "YES" : "NO"
                              : typeof val === "number"
                              ? val % 1 !== 0 ? val.toFixed(1) : val
                              : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── OPERATIONAL DECISION RECOMMENDATIONS ── */}
      {insight?.decisions && insight.decisions.length > 0 && (
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#2a2f3e] bg-slate-50/60 dark:bg-[#151922]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-[#c9d1d9] flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>RECOMMENDED OPERATIONAL DECISIONS (NON-ACTUATING ADVISORY)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400 dark:text-[#7a8194]">
              Zero Autonomous Control · Human-in-the-Loop
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {insight.decisions.map((dec: OperationalDecisionItem) => (
              <div
                key={dec.id}
                className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                  dec.is_primary
                    ? "border-amber-400 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs"
                    : "border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                      {dec.title}
                    </span>
                    {dec.is_primary && (
                      <span className="rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[10px] font-bold px-1.5 py-0.5">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-sans leading-relaxed">
                    {dec.rationale}
                  </p>
                </div>

                <button
                  onClick={() => handleRoute(dec.target_route)}
                  className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs ${
                    dec.is_primary
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-[#21262d] dark:hover:bg-[#30363d] text-slate-800 dark:text-[#c9d1d9] border border-slate-300 dark:border-[#30363d]"
                  }`}
                >
                  <span>{dec.button_label === "Inspect Asset G-02" ? "Review G-02 Diagnostics" : dec.button_label}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EPISTEMIC DATA HONESTY & PROVENANCE BAR ── */}
      <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-[#10121a] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-[#c9d1d9]">
            PROVENANCE:
          </span>
          <span>{insight?.provenance.source ?? "intelligence_service"}</span>
          <span>&middot;</span>
          <span>Freshness: {insight?.provenance.freshness_seconds ?? 1.0}s</span>
          <span>&middot;</span>
          <span>Confidence: {((insight?.provenance.confidence ?? 1.0) * 100).toFixed(0)}%</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 dark:text-[#6b7280]">
          <span>[PROVEN IN RESEARCH/DEPLOYMENT]</span>
          <span>&middot;</span>
          <span>[SYNTHETIC DEMONSTRATION]</span>
        </div>
      </div>
    </section>
  );
}
