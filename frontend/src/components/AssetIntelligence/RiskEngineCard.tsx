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
}

export function RiskEngineCard({ risk }: RiskEngineCardProps) {
  const [showEvidence, setShowEvidence] = useState<boolean>(true);

  const isCritical = risk.level === "CRITICAL";
  const isHigh = risk.level === "HIGH";

  return (
    <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-5 backdrop-blur-sm shadow-lg">
      {/* ── Card Header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-polar-700">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-accent-amber" />
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-polar-200">
            DETERMINISTIC OPERATIONAL RISK &amp; EXPLAINABLE ENGINE
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-polar-400 font-mono">Formula: 6-Factor Composite</span>
          <TruthBadge type="DERIVED" />
        </div>
      </div>

      {/* ── Top Score & Action Row ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-polar-900/90 border border-polar-700/80 mb-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 font-mono text-2xl font-bold ${
              isCritical
                ? "bg-rose-950/60 text-rose-300 border-rose-600 shadow-rose-950/40"
                : isHigh
                ? "bg-amber-950/60 text-amber-300 border-amber-600 shadow-amber-950/40"
                : "bg-emerald-950/60 text-emerald-300 border-emerald-600"
            }`}
          >
            {risk.score}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider border ${
                  isCritical
                    ? "bg-rose-950 text-rose-300 border-rose-700"
                    : isHigh
                    ? "bg-amber-950 text-amber-300 border-amber-700"
                    : "bg-emerald-950 text-emerald-300 border-emerald-700"
                }`}
              >
                {risk.level} OPERATIONAL RISK
              </span>
              <span className="text-xs font-mono text-polar-400">Scale: 0–100</span>
            </div>
            <p className="text-xs text-polar-300 mt-1 max-w-xl leading-relaxed">
              {risk.summary}
            </p>
          </div>
        </div>

        {/* ── The Hero Question / Action Button ─────────── */}
        <button
          onClick={() => setShowEvidence((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/40 px-4 py-2 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
          aria-expanded={showEvidence}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Why is this high risk?</span>
          {showEvidence ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Factor Score Breakdown Bars ─────────────────── */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between text-xs font-mono text-polar-400 px-1">
          <span>RISK CONTRIBUTOR MATRIX</span>
          <span>FACTOR WEIGHTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {risk.factors.map((f) => {
            const pct = Math.round((f.score / f.max_score) * 100);
            return (
              <div
                key={f.factor}
                className="rounded-lg border border-polar-700/80 bg-polar-900/60 p-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-semibold text-polar-200 truncate">
                    {f.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-polar-100">
                    {f.score}/{f.max_score}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-polar-800 rounded-full h-1.5 overflow-hidden mt-1 mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      f.severity === "CRITICAL"
                        ? "bg-rose-500"
                        : f.severity === "HIGH"
                        ? "bg-amber-400"
                        : f.severity === "MEDIUM"
                        ? "bg-cyan-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span
                  className={`self-start px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold uppercase ${
                    f.severity === "CRITICAL"
                      ? "text-rose-400"
                      : f.severity === "HIGH"
                      ? "text-amber-400"
                      : f.severity === "MEDIUM"
                      ? "text-cyan-400"
                      : "text-emerald-400"
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
        <div className="rounded-lg border border-accent-cyan/30 bg-polar-950/90 p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-polar-800 text-accent-cyan font-mono text-xs font-bold uppercase tracking-wider">
            <Info className="h-4 w-4" />
            <span>OPERATIONAL EVIDENCE &amp; RATIONALE BREAKDOWN</span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {risk.factors.map((f) => (
              <div
                key={f.factor}
                className="flex items-start gap-3 p-2.5 rounded bg-polar-900/60 border border-polar-800/80"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                    f.severity === "CRITICAL"
                      ? "bg-rose-950 text-rose-300 border-rose-800"
                      : f.severity === "HIGH"
                      ? "bg-amber-950 text-amber-300 border-amber-800"
                      : "bg-cyan-950 text-cyan-300 border-cyan-800"
                  }`}
                >
                  {f.factor}
                </span>

                <div className="space-y-0.5">
                  <div className="text-polar-200 font-semibold">{f.title}</div>
                  <p className="text-polar-300 leading-relaxed">{f.evidence}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Model Assumptions Footer */}
          <div className="pt-3 border-t border-polar-800 text-[11px] text-polar-400 font-mono space-y-1">
            <div className="font-semibold text-polar-300">Model Assumptions &amp; Data Honesty:</div>
            {risk.assumptions.map((assump, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-polar-400">
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
