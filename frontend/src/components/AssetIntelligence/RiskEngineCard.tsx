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
    <div className="rounded border border-polar-700 bg-polar-800/90 p-5">
      {/* ── Card Header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-polar-700">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-accent-amber" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-polar-200">
            DETERMINISTIC OPERATIONAL RISK &amp; EXPLAINABLE ENGINE
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-polar-400 font-mono">Formula: 6-Factor Composite</span>
          <TruthBadge type="DERIVED" />
        </div>
      </div>

      {/* ── Top Score & Action Row ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded border border-polar-700 bg-polar-900 mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded border font-mono text-2xl font-bold ${
              isCritical
                ? "bg-rose-950 text-rose-300 border-rose-700"
                : isHigh
                ? "bg-amber-950 text-amber-300 border-amber-700"
                : "bg-emerald-950 text-emerald-300 border-emerald-700"
            }`}
          >
            {risk.score}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider border ${
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
            <p className="text-xs text-polar-300 mt-1 max-w-xl leading-relaxed font-sans">
              {risk.summary}
            </p>
          </div>
        </div>

        {/* ── The Hero Question / Action Button ─────────── */}
        <button
          onClick={() => setShowEvidence((prev) => !prev)}
          className="flex items-center gap-2 rounded border border-polar-600 bg-polar-800 hover:bg-polar-700 text-polar-200 hover:text-white px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer"
          aria-expanded={showEvidence}
        >
          <HelpCircle className="h-3.5 w-3.5 text-accent-cyan" />
          <span>Why is this high risk?</span>
          {showEvidence ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Factor Score Breakdown Bars ─────────────────── */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center justify-between text-xs font-mono text-polar-400 px-0.5">
          <span>RISK CONTRIBUTOR MATRIX</span>
          <span>FACTOR WEIGHTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {risk.factors.map((f) => {
            const pct = Math.round((f.score / f.max_score) * 100);
            return (
              <div
                key={f.factor}
                className="rounded border border-polar-700 bg-polar-900/80 p-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                  <span className="text-xs font-semibold text-polar-200 truncate">
                    {f.title}
                  </span>
                  <span className="text-xs font-bold text-polar-100">
                    {f.score}/{f.max_score}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-polar-950 rounded-sm h-1.5 overflow-hidden mt-1 mb-2 border border-polar-800">
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
                  className={`self-start px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold uppercase ${
                    f.severity === "CRITICAL"
                      ? "text-rose-400"
                      : f.severity === "HIGH"
                      ? "text-amber-400"
                      : f.severity === "MEDIUM"
                      ? "text-sky-400"
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
        <div className="rounded border border-polar-700 bg-polar-950 p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-polar-800 text-polar-300 font-mono text-xs font-bold uppercase tracking-wider">
            <Info className="h-3.5 w-3.5 text-accent-cyan" />
            <span>OPERATIONAL EVIDENCE &amp; RATIONALE BREAKDOWN</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {risk.factors.map((f) => (
              <div
                key={f.factor}
                className="flex items-start gap-2.5 p-2 rounded bg-polar-900 border border-polar-800"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                    f.severity === "CRITICAL"
                      ? "bg-rose-950 text-rose-300 border-rose-800"
                      : f.severity === "HIGH"
                      ? "bg-amber-950 text-amber-300 border-amber-800"
                      : "bg-sky-950 text-sky-300 border-sky-800"
                  }`}
                >
                  {f.factor}
                </span>

                <div className="space-y-0.5">
                  <div className="text-polar-200 font-semibold">{f.title}</div>
                  <p className="text-polar-300 leading-relaxed font-sans">{f.evidence}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Model Assumptions Footer */}
          <div className="pt-2.5 border-t border-polar-800 text-[11px] text-polar-400 font-mono space-y-1">
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
