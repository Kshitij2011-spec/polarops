import React from "react";
import { useQuery } from "@tanstack/react-query";
import { X, HelpCircle, AlertTriangle, ArrowRight, ShieldAlert, Wrench, ExternalLink } from "lucide-react";
import { useStation } from "@/context/StationContext";
import { fetchExplanation } from "@/lib/api/explain";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { StatusBadge } from "@/components/foundation/StatusBadge";

export function ExplanationDrawer() {
  const { explanationState, closeExplanation, activeStationId } = useStation();
  const { isOpen, domain, id } = explanationState;

  const { data: explanation, isLoading, isError } = useQuery({
    queryKey: ["explanation", domain, id, activeStationId],
    queryFn: () => fetchExplanation(domain, id, activeStationId),
    enabled: isOpen && Boolean(id),
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={closeExplanation}
      role="dialog"
      aria-modal="true"
      aria-label="5-Stage Causal Reasoning & Operational Explanation"
    >
      <aside
        data-testid="explanation-drawer"
        className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-950/60 border border-amber-800/80 text-amber-400">
              <HelpCircle size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-100">
                Causal Explanation & Blast Radius
              </h2>
              <div className="text-[11px] text-slate-400 font-mono">
                {domain} • {id || "Unknown Entity"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeExplanation}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Close Explanation Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center space-y-3 font-mono">
              <div className="text-sky-400 animate-pulse text-sm">
                Assembling 5-stage causal chain from operational topology...
              </div>
              <div className="text-xs text-slate-500">Cross-referencing sensor telemetry and maintenance ledger</div>
            </div>
          ) : isError || !explanation ? (
            <div className="p-6 rounded border border-red-800/60 bg-red-950/30 text-center font-mono space-y-2">
              <AlertTriangle size={24} className="mx-auto text-red-400" />
              <div className="text-sm font-bold text-red-200">Unable to Load Causal Trace</div>
              <div className="text-xs text-slate-400">
                Explanation for {domain} {id} could not be computed from active station state.
              </div>
            </div>
          ) : (
            <>
              {/* Executive Summary Banner */}
              <div className="p-4 rounded-md bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={explanation.severity} size="sm" />
                    <TruthBadge type={explanation.truth_type} confidence={explanation.confidence} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(explanation.timestamp).toLocaleTimeString()} UTC
                  </span>
                </div>
                {explanation.subject && (
                  <div className="text-xs font-semibold text-sky-300 font-mono tracking-tight">
                    {explanation.subject}
                  </div>
                )}
                <h3 className="text-sm font-bold text-slate-100 font-sans tracking-wide">
                  {explanation.summary}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {explanation.why_it_matters}
                </p>
              </div>

              {/* Stage 1: Measured Physical Evidence */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span className="w-5 h-5 rounded bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Transducer & Telemetry Evidence</span>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded bg-slate-950/40">
                  {explanation.evidence?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-semibold text-slate-200">
                          {item.factor ? `${item.factor} (${item.metric})` : item.metric}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.detail}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-300">{String(item.value)}</div>
                        {item.threshold && (
                          <div className="text-[10px] text-slate-500">Threshold: {String(item.threshold)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 2: Downstream Blast Radius */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span className="w-5 h-5 rounded bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Downstream Service & Subsystem Impact</span>
                </div>

                <div className="space-y-2">
                  {explanation.consequences?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border border-slate-800 bg-slate-950/40 flex items-start gap-3"
                    >
                      <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs font-sans">
                        <div className="font-mono font-bold uppercase text-[11px] text-slate-200 flex items-center gap-2">
                          <span>{item.domain}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Depth {item.blast_radius_depth}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1 leading-normal">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 3: Physical Recovery Constraints */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span className="w-5 h-5 rounded bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Physical Recovery & Logistics Bottlenecks</span>
                </div>

                <div className="space-y-2">
                  {explanation.recovery_constraints?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border border-red-900/40 bg-red-950/20 flex items-start gap-3"
                    >
                      <Wrench size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="text-xs font-sans">
                        <div className="font-mono font-bold uppercase text-[11px] text-red-300">
                          {item.constraint_type} • {item.impact_level}
                        </div>
                        <p className="text-slate-300 mt-0.5 leading-normal">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 4 & 5: Recommended Mitigation Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span className="w-5 h-5 rounded bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  <span>Recommended Operational Actions</span>
                </div>

                <div className="space-y-2">
                  {explanation.recommended_next_steps?.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 hover:border-sky-700/60 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-100">{step.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{step.description}</div>
                      </div>
                      <a
                        href={step.target_route}
                        className="px-3 py-1.5 rounded bg-sky-950 text-sky-300 border border-sky-700 hover:bg-sky-900 text-xs font-mono font-bold uppercase flex items-center gap-1.5 shrink-0"
                      >
                        <span>{step.action_type}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Explainability Engine v2.0</span>
          <span>NCPOR Polar Engineering Core</span>
        </div>
      </aside>
    </div>
  );
}
