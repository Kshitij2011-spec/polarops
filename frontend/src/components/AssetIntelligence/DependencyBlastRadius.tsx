import { ArrowRight, GitCommit, GitFork } from "lucide-react";
import type { AssetDependencies, DependencyNode } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface DependencyBlastRadiusProps {
  dependencies: AssetDependencies;
}

export function DependencyBlastRadius({ dependencies }: DependencyBlastRadiusProps) {
  const { nodes, paths, max_depth } = dependencies;

  // Group nodes by traversal depth
  const nodesByDepth: Record<number, DependencyNode[]> = {};
  for (const n of nodes) {
    if (!nodesByDepth[n.depth]) {
      nodesByDepth[n.depth] = [];
    }
    const bucket = nodesByDepth[n.depth];
    if (bucket) {
      bucket.push(n);
    }
  }

  const depths = Object.keys(nodesByDepth)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-[#2a2f3e]">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-[#e4e8f0]">
            MULTI-HOP DEPENDENCY &amp; OPERATIONAL BLAST RADIUS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-[#7a8194] font-mono">
            Traversal: Cycle-Safe Relational BFS
          </span>
          <TruthBadge type="DERIVED" />
        </div>
      </div>

      {/* ── Summary Metrics Row ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#12141c] p-3 shadow-2xs">
          <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono uppercase tracking-wider">Direct Dependents</div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-[#e4e8f0] mt-0.5">
            {dependencies.total_downstream_assets} Assets
          </div>
          <div className="text-[10px] text-slate-400 dark:text-[#6b7280] font-mono">Hop 1 equipment</div>
        </div>

        <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#12141c] p-3 shadow-2xs">
          <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono uppercase tracking-wider">Critical Services</div>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
            {dependencies.total_affected_services} Exposed
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-mono">Life Support Impact</div>
        </div>

        <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#12141c] p-3 shadow-2xs">
          <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono uppercase tracking-wider">Zones in Blast Radius</div>
          <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
            {dependencies.total_affected_zones} Zones
          </div>
          <div className="text-[10px] text-slate-400 dark:text-[#6b7280] font-mono">Habitats &amp; Facilities</div>
        </div>

        <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#12141c] p-3 shadow-2xs">
          <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono uppercase tracking-wider">Max Graph Depth</div>
          <div className="text-lg font-bold font-mono text-blue-600 dark:text-[#5b9cf5] mt-0.5">
            {max_depth} Hops
          </div>
          <div className="text-[10px] text-slate-400 dark:text-[#6b7280] font-mono">Cycle-safe BFS</div>
        </div>
      </div>

      {/* ── Multi-Hop Tiered Hierarchy Flow ──────────────── */}
      <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#0c0e14] p-4 mb-5 overflow-x-auto shadow-2xs">
        <div className="text-[11px] font-mono font-semibold text-slate-700 dark:text-[#e4e8f0] uppercase tracking-wider mb-4 flex items-center justify-between border-b border-slate-200 dark:border-[#2a2f3e]/80 pb-2">
          <span>EQUIPMENT → SERVICE → FACILITY CASCADE</span>
          <span className="text-[10px] text-slate-400 dark:text-[#6b7280]">Left-to-right downstream cascade</span>
        </div>

        <div className="flex items-center gap-4 min-w-[600px]">
          {depths.map((d, idx) => (
            <div key={d} className="flex items-center gap-4">
              {/* Depth Tier Column */}
              <div className="flex flex-col gap-3 min-w-[170px]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#7a8194] pb-1 border-b border-slate-200 dark:border-[#2a2f3e]">
                  {d === 0 ? "Root Asset (Hop 0)" : `Downstream Hop ${d}`}
                </div>

                <div className="space-y-2">
                  {(nodesByDepth[d] ?? []).map((node) => {
                    const isRoot = node.depth === 0;
                    const isService = node.node_type === "SERVICE";

                    return (
                      <div
                        key={node.id}
                        className={`rounded-md p-3 border text-xs font-mono shadow-2xs ${
                          isRoot
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600/70 text-slate-900 dark:text-amber-100"
                            : isService
                            ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-slate-900 dark:text-[#e4e8f0]"
                            : "bg-white dark:bg-[#141721] border-slate-200 dark:border-[#2a2f3e] text-slate-900 dark:text-[#e4e8f0]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-bold text-slate-500 dark:text-[#7a8194] uppercase tracking-wider">
                            {node.node_type}
                          </span>
                          {isRoot ? (
                            <span className="text-[9px] font-mono text-amber-700 dark:text-amber-400 font-bold uppercase">ROOT</span>
                          ) : (
                            <span className="text-[10px] text-blue-600 dark:text-[#5b9cf5]">{node.category}</span>
                          )}
                        </div>

                        <div className="font-bold text-slate-900 dark:text-[#e4e8f0] truncate">{node.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-[#7a8194] truncate mt-0.5">
                          ID: {node.code}
                        </div>

                        {node.criticality && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-[#2a2f3e]/80 text-[9px] text-slate-500 dark:text-[#7a8194] flex items-center justify-between">
                            <span>Tier:</span>
                            <span
                              className={`font-semibold ${
                                node.criticality === "LIFE_SUPPORT" || node.criticality === "CRITICAL"
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-700 dark:text-[#9ca3b4]"
                              }`}
                            >
                              {node.criticality}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arrow Connector between hops */}
              {idx < depths.length - 1 && (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-[#6b7280] px-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Downstream Cascading Paths List ──────────────── */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono font-semibold text-slate-700 dark:text-[#e4e8f0] uppercase tracking-wider">
          DISCOVERED PROPAGATION PATHS
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          {paths.map((path, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-[#2a2f3e] text-slate-700 dark:text-[#9ca3b4] shadow-2xs"
            >
              <GitCommit className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5] shrink-0" />
              <span className="leading-relaxed">{path}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
