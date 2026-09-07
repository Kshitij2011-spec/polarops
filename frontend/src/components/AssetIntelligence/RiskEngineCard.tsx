import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  ShieldAlert,
} from "lucide-react";
import type { AssetRisk } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface RiskEngineCardProps {
  risk: AssetRisk;
  onOpenExplanation?: (domain: string, entityId: string) => void;
}

export function RiskEngineCard({ risk, onOpenExplanation }: RiskEngineCardProps) {
  const [showEvidence, setShowEvidence] = useState<boolean>(true);

  const isCritical = risk.level === "CRITICAL";
  const isHigh = risk.level === "HIGH";

  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors">
      {/* ── Card Header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]">
        <div className="flex items-center gap-2">
          <ShieldAlert
            className={`h-4 w-4 ${
              isCritical
                ? "text-rose-600 dark:text-rose-400"
                : isHigh
                ? "text-amber-600 dark:text-amber-400"
                : "text-blue-600 dark:text-[#5b9cf5]"
            }`}
          />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-[#e4e8f0]">
            DETERMINISTIC OPERATIONAL RISK &amp; EXPLAINABLE ENGINE
          </h2>
          <TruthBadge type="DERIVED" />
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">
          Formula: 6-Factor Composite &middot; No Autonomous Actuation
        </span>
      </div>

      {/* ── Score Display & Hero Question ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-slate-50/70 dark:bg-[#12141c] border border-slate-200 dark:border-[#2a2f3e] mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex flex-col items-center justify-center h-14 w-14 rounded-md border font-mono ${
              isCritical
                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
                : isHigh
                ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
            }`}
          >
            <span className="text-xl font-black leading-none">{risk.score}</span>
            <span className="text-[9px] uppercase font-bold mt-0.5">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                OPERATIONAL RISK LEVEL:
              </span>
              <span
                className={`text-xs font-bold font-mono px-1.5 py-0.2 rounded border uppercase ${
                  isCritical
                    ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                    : isHigh
                    ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                }`}
              >
                {risk.level} OPERATIONAL RISK
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9ca3b4] mt-1 font-sans max-w-lg">
              {risk.summary}
            </p>
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────── */}
        <div className="flex items-center gap-2">
          {onOpenExplanation && (
            <button
              onClick={() => onOpenExplanation("ASSET", risk.asset_id)}
              data-testid="risk-card-why-btn"
              className="flex items-center gap-1.5 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-3 py-2 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
              title="Open full deterministic causal explanation drawer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Full Explanation</span>
            </button>
          )}

          <button
            onClick={() => setShowEvidence((prev) => !prev)}
            data-testid="why-high-risk-btn"
            className="flex items-center gap-2 rounded-md border border-slate-300 dark:border-[#3d4556] bg-white dark:bg-[#181b24] hover:bg-slate-100 dark:hover:bg-[#1e2230] text-slate-800 dark:text-[#e4e8f0] px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
            aria-expanded={showEvidence}
          >
            <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
            <span>Why is this high risk?</span>
            {showEvidence ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Factor Score Breakdown Bars ─────────────────── */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#7a8194] px-0.5">
          <span>RISK CONTRIBUTOR MATRIX</span>
          <span>FACTOR WEIGHTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {risk.factors.map((f) => {
            const pct = Math.round((f.score / f.max_score) * 100);
            return (
              <div
                key={f.factor}
                className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3 flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                  <span className="text-xs font-semibold text-slate-800 dark:text-[#e4e8f0] truncate">
                    {f.title}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-[#e4e8f0]">
                    {f.score}/{f.max_score}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 dark:bg-[#0c0e14] rounded-full h-1.5 overflow-hidden mt-1 mb-2 border border-slate-200 dark:border-slate-800">
                  <div
                    className={`h-full transition-all ${
                      f.severity === "CRITICAL"
                        ? "bg-rose-500"
                        : f.severity === "HIGH"
                        ? "bg-amber-500"
                        : f.severity === "MEDIUM"
                        ? "bg-sky-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span
                  className={`self-start px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                    f.severity === "CRITICAL"
                      ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60"
                      : f.severity === "HIGH"
                      ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60"
                      : f.severity === "MEDIUM"
                      ? "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60"
                      : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
                  }`}
                >
                  {f.severity} IMPACT
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Expandable Structured Evidence Drawer ───────── */}
      {showEvidence && (
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
      )}
    </div>
  );
}
