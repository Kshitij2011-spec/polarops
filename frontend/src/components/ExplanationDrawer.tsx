import { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Layers,
  CheckCircle2,
  Package,
  Activity,
  Cpu,
} from "lucide-react";
import {
  fetchExplanation,
  type ExplanationResponse,
} from "../lib/api";
import { TruthBadge, type TruthType } from "./TruthBadge";

export interface ExplanationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
  entityId?: string;
  stationId?: string;
  initialExplanation?: ExplanationResponse | null;
  onNavigate?: (route: string) => void;
}

export function ExplanationDrawer({
  isOpen,
  onClose,
  domain,
  entityId,
  stationId = "STATION-BHARATI",
  initialExplanation = null,
  onNavigate,
}: ExplanationDrawerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(
    initialExplanation
  );

  useEffect(() => {
    if (!isOpen) return;

    if (initialExplanation) {
      setExplanation(initialExplanation);
      setError(null);
      setLoading(false);
      return;
    }

    if (domain && entityId) {
      setLoading(true);
      setError(null);
      fetchExplanation(domain, entityId, stationId)
        .then((res) => {
          setExplanation(res);
        })
        .catch((err) => {
          setError(err.message || "Failed to load explanation.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, domain, entityId, stationId, initialExplanation]);

  if (!isOpen) return null;

  const severityBadgeBg =
    explanation?.severity === "CRITICAL"
      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
      : explanation?.severity === "WARNING"
      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
      : "bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
      data-testid="explanation-drawer-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#12151e] border-l border-slate-200 dark:border-[#2a2f3e] h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        data-testid="explanation-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#202534] flex items-start justify-between gap-3 bg-slate-50/80 dark:bg-[#161a26]">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b92a5]">
                OPERATIONAL EXPLANATION &middot; CAUSAL REASONING
              </span>
              {explanation?.severity && (
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${severityBadgeBg}`}
                >
                  {explanation.severity}
                </span>
              )}
              {explanation?.truth_type && (
                <TruthBadge
                  type={explanation.truth_type as TruthType}
                  className="text-[10px]"
                />
              )}
            </div>
            <h2 className="text-sm font-bold font-mono text-slate-900 dark:text-[#f0f3fa] leading-tight">
              {explanation?.subject || "Deterministic Operational Explanation"}
            </h2>
          </div>

          <button
            onClick={onClose}
            data-testid="explanation-drawer-close-btn"
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-[#7a8194] dark:hover:text-[#f0f3fa] hover:bg-slate-200 dark:hover:bg-[#202534] transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-slate-800 dark:text-[#d3d8e4]">
          {loading && (
            <div className="py-16 text-center space-y-3 font-mono text-xs text-slate-500 dark:text-[#7a8194]">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent align-[-0.125em]" />
              <p>Deriving deterministic evidence & cross-domain causal chain...</p>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 p-4 font-mono text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Unable to load explanation</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && explanation && (
            <>
              {/* ── 1. WHAT CHANGED ────────────────────────────────────────── */}
              <div className="space-y-1.5" data-testid="explanation-what-changed">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b92a5]">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                  <span>1. WHAT CHANGED</span>
                </div>
                <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/60 dark:bg-[#181c28] p-3.5 border-l-4 border-l-blue-500">
                  <p className="text-xs leading-relaxed font-sans text-slate-900 dark:text-[#f0f3fa] font-medium">
                    {explanation.summary}
                  </p>
                </div>
              </div>

              {/* ── 2. WHY IT MATTERS ──────────────────────────────────────── */}
              <div className="space-y-1.5" data-testid="explanation-why-it-matters">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b92a5]">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  <span>2. WHY IT MATTERS</span>
                </div>
                <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-[#1a1814]/40 p-3.5 border-l-4 border-l-amber-500">
                  <p className="text-xs leading-relaxed font-sans text-slate-800 dark:text-[#d3d8e4]">
                    {explanation.why_it_matters}
                  </p>
                </div>
              </div>

              {/* ── 3. EVIDENCE & CONTRIBUTING FACTORS ────────────────────── */}
              <div className="space-y-2" data-testid="explanation-evidence-section">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b92a5]">
                    <Layers className="h-3.5 w-3.5 text-emerald-500" />
                    <span>3. EVIDENCE & CONTRIBUTING FACTORS</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
                    {explanation.evidence.length} FACTORS MEASURED
                  </span>
                </div>

                <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#161a26]">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#202534] bg-slate-50 dark:bg-[#141722] text-[10px] uppercase text-slate-500 dark:text-[#7a8194]">
                        <th className="p-2.5 font-bold">Factor</th>
                        <th className="p-2.5 font-bold">Value</th>
                        <th className="p-2.5 font-bold">Threshold</th>
                        <th className="p-2.5 font-bold">Status</th>
                        <th className="p-2.5 font-bold">Operational Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#202534]">
                      {explanation.evidence.map((e, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 dark:hover:bg-[#1a1e2c] transition-colors"
                        >
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-[#e4e8f0]">
                            {e.factor}
                          </td>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-[#e4e8f0]">
                            {String(e.value)}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-[#8b92a5]">
                            {e.threshold !== null && e.threshold !== undefined
                              ? String(e.threshold)
                              : "—"}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                                e.status === "CRITICAL"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                                  : e.status === "WARNING"
                                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
                              }`}
                            >
                              {e.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans text-slate-600 dark:text-[#9ca3b4] text-[11px] leading-snug">
                            {e.detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 4. WHAT IT AFFECTS (BLAST RADIUS & DEPENDENCIES) ───────── */}
              <div className="space-y-2" data-testid="explanation-consequences-section">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b92a5]">
                  <Cpu className="h-3.5 w-3.5 text-rose-500" />
                  <span>4. WHAT IT AFFECTS (DEPENDENCY BLAST RADIUS)</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {explanation.consequences.map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#161a26] p-3 flex items-start gap-3 text-xs"
                    >
                      <div className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-[#1d2332] text-blue-700 dark:text-[#5b9cf5] border border-blue-200 dark:border-[#2d364d] font-mono text-[10px] font-bold shrink-0">
                        Hop {c.blast_radius_depth}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                          {c.impact}
                        </div>
                        <p className="text-slate-600 dark:text-[#9ca3b4] font-sans text-[11px] leading-relaxed">
                          {c.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 5. RECOVERY CONSTRAINTS ─────────────────────────────────── */}
              {explanation.recovery_constraints.length > 0 && (
                <div className="space-y-2" data-testid="explanation-constraints-section">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b92a5]">
                    <Package className="h-3.5 w-3.5 text-amber-500" />
                    <span>5. RECOVERY CONSTRAINTS</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {explanation.recovery_constraints.map((rc, idx) => (
                      <div
                        key={idx}
                        className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-[#191610]/40 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {rc.constraint_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {rc.impact_level}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-[#a8b0c2] font-sans text-[11px] leading-relaxed">
                          {rc.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 6. WHAT NOW? (RECOMMENDED INVESTIGATION) ───────────────── */}
              <div className="space-y-2" data-testid="explanation-next-steps-section">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b92a5]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>6. WHAT NOW? &middot; RECOMMENDED INVESTIGATION</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-[#676e80]">
                    NON-ACTUATING &middot; ADVISORY
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {explanation.recommended_next_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#161a26] p-3 flex items-center justify-between gap-3 hover:border-blue-400 dark:hover:border-blue-600 transition-colors shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#202534] text-slate-700 dark:text-[#a5adc2] border border-slate-200 dark:border-[#2d3448]">
                            {step.action_type}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-[#f0f3fa]">
                            {step.title}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-[#9ca3b4] font-sans text-[11px]">
                          {step.description}
                        </p>
                      </div>

                      {step.target_route && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigate?.(step.target_route);
                          }}
                          data-testid={`next-step-btn-${step.action_code.toLowerCase()}`}
                          className="flex items-center gap-1 shrink-0 rounded bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Provenance Note */}
        <div className="p-3.5 border-t border-slate-200 dark:border-[#202534] bg-slate-50 dark:bg-[#141722] text-[10px] font-mono text-slate-500 dark:text-[#7a8194] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>PROVENANCE:</span>
            <span className="text-slate-700 dark:text-[#9ca3b4] font-semibold">
              {explanation?.source_context?.slice(0, 3).join(", ") || "Domain Engines"}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 dark:text-[#676e80]">
            Deterministic Domain Engine &middot; No Autonomous Actuation
          </div>
        </div>
      </div>
    </div>
  );
}
