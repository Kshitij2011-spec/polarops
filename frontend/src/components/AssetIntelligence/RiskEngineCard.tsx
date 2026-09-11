import {
  Info,
  ShieldAlert,
  Zap,
  Wind,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Layers,
  Cpu,
  Package,
} from "lucide-react";
import type { AssetRisk } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface RiskEngineCardProps {
  risk: AssetRisk;
  onOpenExplanation?: (domain: string, entityId: string) => void;
  onNavigate?: (route: string) => void;
}

export function RiskEngineCard({ risk, onOpenExplanation, onNavigate }: RiskEngineCardProps) {
  const isCritical = risk.level === "CRITICAL";
  const isHigh = risk.level === "HIGH";
  const isMedium = risk.level === "MEDIUM";

  const ladder = risk.state_transition?.ladder || ["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"];
  const currentState = risk.state_transition?.current_state || risk.level;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-5">
      {/* ── Card Header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]">
        <div className="flex items-center gap-2">
          <ShieldAlert
            className={`h-4 w-4 ${
              isCritical
                ? "text-rose-600 dark:text-rose-400"
                : isHigh
                ? "text-amber-600 dark:text-amber-400"
                : isMedium
                ? "text-sky-600 dark:text-sky-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-[#e4e8f0]">
            DETERMINISTIC OPERATIONAL RISK &amp; EXPLAINABLE ENGINE
          </h2>
          <TruthBadge type="DERIVED" />
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">
          Risk Intelligence 2.0 &middot; 6-Factor Deterministic Engine &middot; Zero Black-Box ML
        </span>
      </div>

      {/* ── LAYER 1: CURRENT RISK & HERO REASONING DISPLAY ── */}
      <div className="p-4 rounded-md bg-slate-50/70 dark:bg-[#12141c] border border-slate-200 dark:border-[#2a2f3e] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex flex-col items-center justify-center h-16 w-16 rounded-md border font-mono shrink-0 ${
                isCritical
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
                  : isHigh
                  ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                  : isMedium
                  ? "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
              }`}
            >
              <span className="text-2xl font-black leading-none">{risk.score}</span>
              <span className="text-[9px] uppercase font-bold mt-0.5">/ 100</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                  OPERATIONAL RISK LEVEL:
                </span>
                <span
                  className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${
                    isCritical
                      ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                      : isHigh
                      ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                      : isMedium
                      ? "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                      : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                  }`}
                >
                  {risk.level} OPERATIONAL RISK
                </span>

                {risk.state_transition && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-[#1f2433] text-slate-700 dark:text-[#9ca3b4] border border-slate-300 dark:border-[#2f374e]">
                    TREND: {risk.state_transition.state_trend}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-sans max-w-xl leading-relaxed">
                {risk.summary}
              </p>
            </div>
          </div>

          {/* Action Buttons: Consolidated Single Explanation Entry Point */}
          <div className="flex items-center gap-2">
            {onOpenExplanation && (
              <button
                onClick={() => onOpenExplanation("ASSET", risk.asset_id)}
                data-testid="risk-card-why-btn"
                aria-label="View Full Risk Explanation — Why is this high risk?"
                aria-expanded="true"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:shadow-md ring-1 ring-amber-400"
                title="Open authoritative deterministic causal explanation drawer"
              >
                <span>View Full Risk Explanation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Deterministic Risk State Transition Ladder */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#202534] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
            <span className="font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span>OPERATIONAL RISK STATE TRANSITION LADDER</span>
              <TruthBadge type="DERIVED" className="text-[9px]" />
            </span>
            <span>Deterministic State Evolution</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 font-mono text-[10px] text-center">
            {ladder.map((step) => {
              const isActive = step === currentState;
              const isPassed =
                ladder.indexOf(step) < ladder.indexOf(currentState);

              let stepColor =
                "bg-slate-100 text-slate-500 border-slate-200 dark:bg-[#141722] dark:text-[#5c6375] dark:border-[#1e2333]";
              if (isActive) {
                if (step === "CRITICAL") {
                  stepColor =
                    "bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700 font-bold shadow-sm";
                } else if (step === "HIGH") {
                  stepColor =
                    "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-bold shadow-sm";
                } else if (step === "ELEVATED") {
                  stepColor =
                    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 font-bold";
                } else if (step === "WATCH") {
                  stepColor =
                    "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-bold";
                } else {
                  stepColor =
                    "bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-bold shadow-sm";
                }
              } else if (isPassed) {
                stepColor =
                  "bg-slate-200/60 text-slate-600 border-slate-300 dark:bg-[#161a26] dark:text-[#7a8194] dark:border-[#22283a]";
              }

              return (
                <div
                  key={step}
                  className={`py-1.5 px-1 rounded border flex flex-col items-center justify-center transition-colors ${stepColor}`}
                >
                  <span className="truncate">{step}</span>
                  {isActive && (
                    <span className="text-[8px] uppercase tracking-tighter opacity-80">
                      CURRENT
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trigger Conditions */}
          {risk.state_transition && risk.state_transition.triggered_by.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono text-slate-600 dark:text-[#9ca3b4]">
              <span className="font-bold text-slate-700 dark:text-[#c4cad7]">
                TRIGGERED BY:
              </span>
              {risk.state_transition.triggered_by.map((trig, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#181c28] border border-slate-200 dark:border-[#2a2f3e] shadow-2xs"
                >
                  &bull; {trig}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LAYER 2: RANKED RISK DRIVERS MATRIX ─────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#7a8194] px-0.5">
          <span className="font-bold uppercase tracking-wider text-slate-800 dark:text-[#e4e8f0] flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
            <span>RANKED RISK DRIVERS &amp; CONTRIBUTION MATRIX</span>
            <TruthBadge type="DERIVED" className="text-[9px]" />
          </span>
          <span>Ranked by Contribution Points &middot; Deterministic Rules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {(risk.drivers && risk.drivers.length > 0
            ? risk.drivers
            : risk.factors.map((f, idx) => ({
                rank: idx + 1,
                factor: f.factor,
                title: f.title,
                score: f.score,
                max_score: f.max_score,
                severity: f.severity,
                evidence: f.evidence,
                threshold: null,
                trend: "STABLE" as const,
                derivation_rule: "Weighted multi-factor deterministic scoring",
                truth_type: "DERIVED",
                provenance_source: "domain_service",
              }))
          ).map((d) => {
            const pct = Math.round((d.score / d.max_score) * 100);
            const isDegrading = d.trend === "DEGRADING";
            const isImproving = d.trend === "IMPROVING";

            return (
              <div
                key={d.factor}
                className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3 flex flex-col justify-between shadow-2xs hover:border-blue-300 dark:hover:border-[#3d4763] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1 font-mono text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#1f2434] text-[10px] font-bold text-slate-700 dark:text-[#a0a8bd]">
                        #{d.rank}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-[#e4e8f0] truncate">
                        {d.title}
                      </span>
                    </div>

                    <span className="font-bold text-slate-900 dark:text-[#e4e8f0] shrink-0">
                      {d.score}/{d.max_score} pts
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-[#0c0e14] rounded-full h-1.5 overflow-hidden my-1.5 border border-slate-200 dark:border-slate-800">
                    <div
                      className={`h-full transition-all ${
                        d.severity === "CRITICAL"
                          ? "bg-rose-500"
                          : d.severity === "HIGH"
                          ? "bg-amber-500"
                          : d.severity === "MEDIUM"
                          ? "bg-sky-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Badges & Threshold */}
                  <div className="flex items-center justify-between gap-1.5 mt-1 text-[10px] font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold uppercase ${
                        d.severity === "CRITICAL"
                          ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60"
                          : d.severity === "HIGH"
                          ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60"
                          : d.severity === "MEDIUM"
                          ? "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60"
                          : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
                      }`}
                    >
                      {d.severity}
                    </span>

                    <span className="flex items-center gap-1 text-slate-500 dark:text-[#7a8194]">
                      {isDegrading ? (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5 font-semibold">
                          <TrendingUp className="h-3 w-3" /> Degrading
                        </span>
                      ) : isImproving ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-semibold">
                          <TrendingDown className="h-3 w-3" /> Improving
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Minus className="h-3 w-3" /> Stable
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {d.threshold && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-[#1d2230] text-[10px] font-mono text-slate-500 dark:text-[#7a8194] truncate">
                    <span className="text-slate-400 dark:text-[#5f6677]">Threshold: </span>
                    <span className="text-slate-700 dark:text-[#aab2c5] font-semibold">{d.threshold}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LAYER 4: WHERE DOES RISK PROPAGATE & WHAT MAKES RECOVERY HARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Failure Exposure & Blast Radius Concentration */}
        <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#202534] pb-2 text-xs font-mono font-bold">
            <span className="text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-rose-500" />
              <span>WHERE DOES RISK PROPAGATE?</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#7a8194]">
              FAILURE EXPOSURE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {risk.failure_exposure && (
              <div className="p-2.5 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#9ca3b4] text-[11px]">Redundancy Posture:</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      risk.failure_exposure.redundancy_posture.includes("N-0")
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                    title="N-0: No backup generator available (Single point of failure)"
                  >
                    {risk.failure_exposure.redundancy_posture.includes("N-0")
                      ? "N-0 · No backup generator available"
                      : risk.failure_exposure.redundancy_posture}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#9ca3b4] text-[11px]">Downstream Critical Services:</span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                    {risk.failure_exposure.affected_critical_services.length > 0
                      ? risk.failure_exposure.affected_critical_services.join(", ")
                      : "None (Isolated Loop)"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#9ca3b4] text-[11px]">Operational Zones Exposed:</span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                    {risk.failure_exposure.affected_zones.length > 0
                      ? risk.failure_exposure.affected_zones.join(", ")
                      : "None"}
                  </span>
                </div>

                <p className="text-[11px] font-sans text-slate-600 dark:text-[#9ca3b4] pt-1 border-t border-slate-100 dark:border-[#202534] leading-relaxed">
                  {risk.failure_exposure.summary}
                </p>
              </div>
            )}

            {risk.concentration && (
              <div className="text-[11px] text-slate-600 dark:text-[#9ca3b4] flex items-center justify-between p-2 rounded bg-white/60 dark:bg-[#141722] border border-slate-200/80 dark:border-[#202534]">
                <span>Concentration Domain:</span>
                <span className="font-bold text-blue-600 dark:text-[#5b9cf5]">
                  {risk.concentration.primary_domain.replace(/_/g, " ")} (Depth {risk.concentration.max_depth})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recovery Exposure & Logistics Constraints */}
        <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#202534] pb-2 text-xs font-mono font-bold">
            <span className="text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-amber-500" />
              <span>WHAT MAKES RECOVERY HARD?</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#7a8194]">
              RECOVERY EXPOSURE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {risk.recovery_exposure && (
              <div className="p-2.5 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#9ca3b4] text-[11px]">Work Order Blocker:</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    risk.recovery_exposure.work_order_status === "BLOCKED_PARTS"
                      ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1a1e2a] dark:text-[#8890a2] dark:border-[#282f42]"
                  }`}>
                    {risk.recovery_exposure.work_order_status || "None"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#9ca3b4] text-[11px]">Critical Spare Requirement:</span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                    {risk.recovery_exposure.spare_part_number || "None"} ({risk.recovery_exposure.spare_available_quantity} Available)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-[#9ca3b4] text-[11px]">Next Resupply Window:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {risk.recovery_exposure.resupply_vessel_name
                      ? `${risk.recovery_exposure.resupply_vessel_name} (≈ ${risk.recovery_exposure.resupply_days}d)`
                      : "No Logistics Dependency"}
                  </span>
                </div>

                <p className="text-[11px] font-sans text-slate-600 dark:text-[#9ca3b4] pt-1 border-t border-slate-100 dark:border-[#202534] leading-relaxed">
                  {risk.recovery_exposure.recovery_bottleneck}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ENVIRONMENTAL AMPLIFICATION & OPERATIONAL HEADROOM ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Environmental Amplification */}
        {risk.environmental_amplification && (
          <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#202534] pb-2 text-xs font-mono font-bold">
              <span className="text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-sky-500" />
                <span>ENVIRONMENTAL AMPLIFICATION</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                risk.environmental_amplification.amplification_level === "SEVERE"
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                  : risk.environmental_amplification.amplification_level === "MODERATE"
                  ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
              }`}>
                {risk.environmental_amplification.amplification_level} ({risk.environmental_amplification.amplification_factor}x)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d] text-slate-800 dark:text-[#e4e8f0]">
                Temp: {risk.environmental_amplification.ambient_temp_celsius}&deg;C
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d] text-slate-800 dark:text-[#e4e8f0]">
                Wind: {risk.environmental_amplification.wind_speed_knots} kt
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d] text-slate-800 dark:text-[#e4e8f0]">
                Chill: {risk.environmental_amplification.wind_chill_celsius}&deg;C
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d] text-slate-800 dark:text-[#e4e8f0]">
                Condition: {risk.environmental_amplification.weather_condition}
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-600 dark:text-[#9ca3b4] leading-relaxed">
              {risk.environmental_amplification.explanation}
            </p>
          </div>
        )}

        {/* Operational Headroom */}
        {risk.headroom && (
          <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#202534] pb-2 text-xs font-mono font-bold">
              <span className="text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                <span>OPERATIONAL HEADROOM &amp; MARGINS</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                risk.headroom.rating === "COMPRESSED" || risk.headroom.rating === "CRITICAL"
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                  : risk.headroom.rating === "NARROW"
                  ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
              }`}>
                {risk.headroom.rating} MARGIN
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d]">
                <div className="text-slate-500 dark:text-[#7a8194] text-[10px]">Generation Reserve:</div>
                <div className="font-bold text-slate-900 dark:text-[#e4e8f0]">{risk.headroom.generation_reserve_kw} kW</div>
                <div className="text-[9px] text-slate-400 dark:text-[#6c7487] truncate">{risk.headroom.generation_headroom_label}</div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d]">
                <div className="text-slate-500 dark:text-[#7a8194] text-[10px]">Fuel Runway:</div>
                <div className="font-bold text-slate-900 dark:text-[#e4e8f0]">{risk.headroom.fuel_runway_days} Days</div>
                <div className="text-[9px] text-slate-400 dark:text-[#6c7487]">Station fuel reserve</div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d]">
                <div className="text-slate-500 dark:text-[#7a8194] text-[10px]">Thermal Buffer:</div>
                <div className="font-bold text-slate-900 dark:text-[#e4e8f0]">{risk.headroom.thermal_hold_hours} Hours</div>
                <div className="text-[9px] text-slate-400 dark:text-[#6c7487]">Until habitat freeze</div>
              </div>

              <div className="p-2 rounded bg-white dark:bg-[#161a26] border border-slate-200 dark:border-[#242b3d]">
                <div className="text-slate-500 dark:text-[#7a8194] text-[10px]">Recovery Buffer:</div>
                <div className={`font-bold ${risk.headroom.recovery_buffer_days < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {risk.headroom.recovery_buffer_days} Days
                </div>
                <div className="text-[9px] text-slate-400 dark:text-[#6c7487]">Shortage gap to ship</div>
              </div>
            </div>

            <p className="text-[11px] font-sans text-slate-600 dark:text-[#9ca3b4] leading-relaxed">
              {risk.headroom.summary}
            </p>
          </div>
        )}
      </div>

      {/* ── LAYER 3: HOW DOES RISK CHANGE? (DETERMINISTIC SCENARIO PROJECTIONS) ── */}
      {risk.projections && risk.projections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#7a8194] px-0.5">
            <span className="font-bold uppercase tracking-wider text-slate-800 dark:text-[#e4e8f0] flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>HOW DOES RISK CHANGE? (DETERMINISTIC SCENARIO PROJECTIONS)</span>
              <TruthBadge type="SCENARIO" className="text-[9px]" />
            </span>
            <span className="text-[10px]">Bounded What-If Simulations &middot; Strictly Not a Forecast</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {risk.projections.map((p) => (
              <div
                key={p.scenario_id}
                className="p-3 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] space-y-2 shadow-2xs hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 font-mono">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-[#e4e8f0]">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#7a8194]">
                      {p.condition}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
                      {p.projected_risk_score} / 100
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                      +{p.score_delta} pts ({p.projected_level})
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-sans space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-[#1e2333]">
                  <p className="text-slate-700 dark:text-[#c2c8d8]">
                    <span className="font-semibold font-mono text-[10px] text-slate-500 dark:text-[#7a8194]">IMPACT: </span>
                    {p.operational_impact}
                  </p>
                  <p className="text-slate-600 dark:text-[#9ca3b4]">
                    <span className="font-semibold font-mono text-[10px] text-slate-500 dark:text-[#7a8194]">HEADROOM: </span>
                    {p.headroom_effect}
                  </p>
                </div>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate("/scenarios")}
                    className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-600 dark:text-[#5b9cf5] hover:underline cursor-pointer pt-1"
                  >
                    <span>Simulate in Scenario Studio</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STRUCTURED EVIDENCE & RATIONALE BREAKDOWN ────── */}
      <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#0c0e14] p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#2a2f3e] text-slate-800 dark:text-[#e4e8f0] font-mono text-xs font-bold uppercase tracking-wider">
          <Info className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
          <span>OPERATIONAL EVIDENCE &amp; RATIONALE BREAKDOWN</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          {risk.factors.map((f) => (
            <div
              key={f.factor}
              className="flex items-start gap-2.5 p-2.5 rounded-md bg-white dark:bg-[#141721] border border-slate-200 dark:border-[#2a2f3e] shadow-2xs"
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                  f.severity === "CRITICAL"
                    ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    : f.severity === "HIGH"
                    ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    : "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                }`}
              >
                {f.factor}
              </span>

              <div className="space-y-0.5">
                <div className="text-slate-900 dark:text-[#e4e8f0] font-semibold">{f.title}</div>
                <p className="text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-sans">{f.evidence}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Model Assumptions Footer */}
        <div className="pt-2.5 border-t border-slate-200 dark:border-[#2a2f3e] text-[11px] text-slate-500 dark:text-[#7a8194] font-mono space-y-1">
          <div className="font-semibold text-slate-700 dark:text-[#e4e8f0]">Model Assumptions &amp; Data Honesty:</div>
          {risk.assumptions.map((assump, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-slate-500 dark:text-[#7a8194]">
              <span>&bull;</span>
              <span>{assump}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

