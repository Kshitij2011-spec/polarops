import React, { useState, useMemo } from "react";
import {
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
} from "lucide-react";
import type { AssetDependencies, AssetListItem } from "@/lib/api/twin";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { TruthBadge } from "@/components/foundation/TruthBadge";

export interface TopologyTreeGridProps {
  dependencies?: AssetDependencies | null;
  assets?: AssetListItem[];
  selectedAssetId: string;
  onSelectAsset: (assetId: string) => void;
  onSwitchToCanvas: () => void;
}

interface TreeGridRow {
  id: string;
  code: string;
  name: string;
  nodeType: "ASSET" | "SERVICE" | "ZONE";
  category?: string;
  depth: number;
  direction: "ROOT" | "UPSTREAM" | "DOWNSTREAM" | "PEER";
  status: string;
  criticality: string;
  relationship: string;
  impactFactor: number;
  isRedundant: boolean;
  notes: string;
}

export function TopologyTreeGrid({
  dependencies,
  assets = [],
  selectedAssetId,
  onSelectAsset,
  onSwitchToCanvas,
}: TopologyTreeGridProps) {
  const [filterDirection, setFilterDirection] = useState<"ALL" | "UPSTREAM" | "DOWNSTREAM">("ALL");
  const [filterCriticality, setFilterCriticality] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Map asset lookup for fast status resolution
  const assetMap = useMemo(() => {
    const map = new Map<string, AssetListItem>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  // Construct structured rows from backend dependency tree
  const rows: TreeGridRow[] = useMemo(() => {
    if (!dependencies) return [];

    const result: TreeGridRow[] = [];
    const rootId = dependencies.asset_id;
    const rootAsset = assetMap.get(rootId);

    // 1. Root Node
    result.push({
      id: rootId,
      code: rootAsset?.code || rootId,
      name: rootAsset?.name || dependencies.nodes.find((n) => n.id === rootId)?.name || rootId,
      nodeType: "ASSET",
      category: rootAsset?.category || "PRIME_MOVER",
      depth: 0,
      direction: "ROOT",
      status: rootAsset?.status || "DEGRADED",
      criticality: rootAsset?.criticality || "CRITICAL",
      relationship: "INSPECTION ROOT",
      impactFactor: 1.0,
      isRedundant: false,
      notes: "Selected machine under active investigation",
    });

    // 2. Upstream Feeders
    dependencies.upstream_dependencies.forEach((up) => {
      const upAsset = assetMap.get(up.asset_id);
      result.push({
        id: up.asset_id,
        code: up.code,
        name: up.name,
        nodeType: "ASSET",
        category: upAsset?.category || up.type,
        depth: 1,
        direction: "UPSTREAM",
        status: upAsset?.status || "NOMINAL",
        criticality: upAsset?.criticality || "HIGH",
        relationship: `SUPPLIER (${up.type})`,
        impactFactor: up.impact_factor,
        isRedundant: up.is_redundant,
        notes: up.is_redundant ? "Dual redundant source available" : "Single point of failure feed",
      });
    });

    // 3. Downstream Nodes (Assets, Services, Zones)
    dependencies.nodes.forEach((node) => {
      if (node.id === rootId) return; // skip root already added

      const isUpstream = dependencies.upstream_dependencies.some((u) => u.asset_id === node.id);
      if (isUpstream) return; // already added in upstream

      const nodeAsset = assetMap.get(node.id);
      const isRedundant = dependencies.edges.some(
        (e) => (e.target_id === node.id || e.source_id === node.id) && e.is_redundant
      );
      const matchedEdge = dependencies.edges.find((e) => e.target_id === node.id);

      result.push({
        id: node.id,
        code: node.code,
        name: node.name,
        nodeType: (node.node_type as any) || "ASSET",
        category: node.category || nodeAsset?.category || "SUBSYSTEM",
        depth: Math.max(1, node.depth),
        direction: "DOWNSTREAM",
        status: node.status || nodeAsset?.status || "NOMINAL",
        criticality: node.criticality || nodeAsset?.criticality || "MEDIUM",
        relationship: matchedEdge ? `${matchedEdge.dependency_type} RECEIVER` : "DEPENDENT",
        impactFactor: matchedEdge ? matchedEdge.impact_factor : 0.8,
        isRedundant,
        notes: isRedundant ? "Redundancy holds load" : "No alternate route; loss cascades",
      });
    });

    return result;
  }, [dependencies, assetMap]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterDirection === "UPSTREAM" && r.direction !== "UPSTREAM" && r.direction !== "ROOT") return false;
      if (filterDirection === "DOWNSTREAM" && r.direction !== "DOWNSTREAM" && r.direction !== "ROOT") return false;
      if (filterCriticality !== "ALL" && r.criticality !== filterCriticality) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.relationship.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filterDirection, filterCriticality, searchQuery]);

  return (
    <div
      className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100 font-mono"
      role="region"
      aria-label="Accessible Operational Topology Table"
    >
      {/* Table Sub-header Controls */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider">
            <Layers size={15} />
            <span>Operational Lineage & Impact Table</span>
          </div>
          <span className="text-[11px] text-slate-400">
            ({filteredRows.length} of {rows.length} Nodes Synchronized)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick 1-click Switch back to Canvas */}
          <button
            type="button"
            onClick={onSwitchToCanvas}
            className="px-3 py-1.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700/80 text-sky-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye size={13} />
            <span>Switch to Living DAG Canvas</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search code, name, subsystem, or relationship..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            {(["ALL", "UPSTREAM", "DOWNSTREAM"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFilterDirection(d)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                  filterDirection === d
                    ? "bg-sky-900/60 text-sky-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d === "ALL" ? "All Lineage" : d === "UPSTREAM" ? "Upstream Feeders" : "Blast Radius"}
              </button>
            ))}
          </div>

          {/* Criticality Filter */}
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">All Criticality</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        </div>
      </div>

      {/* Accessible Table Body */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full text-left border-collapse text-xs font-mono"
          role="treegrid"
          aria-label="Synchronized Dependency Hierarchy"
        >
          <thead className="bg-slate-950/90 sticky top-0 z-10 border-b border-slate-800 text-[11px] text-slate-400">
            <tr>
              <th className="py-2.5 px-4 font-semibold">DEPTH / NODE CODE</th>
              <th className="py-2.5 px-3 font-semibold">NAME & DOMAIN</th>
              <th className="py-2.5 px-3 font-semibold">RELATIONSHIP</th>
              <th className="py-2.5 px-3 font-semibold">POSTURE</th>
              <th className="py-2.5 px-3 font-semibold">CRITICALITY</th>
              <th className="py-2.5 px-3 font-semibold">REDUNDANCY POSTURE</th>
              <th className="py-2.5 px-4 font-semibold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                  No topology nodes match the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isSelected = row.id === selectedAssetId;

                return (
                  <tr
                    key={row.id}
                    role="row"
                    aria-selected={isSelected}
                    onClick={() => onSelectAsset(row.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-sky-950/70 border-l-4 border-l-sky-400 text-slate-100"
                        : "hover:bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    {/* Depth and Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* Indent by depth */}
                        <div
                          style={{ width: `${row.depth * 16}px` }}
                          className="shrink-0 flex items-center justify-end"
                        >
                          {row.depth > 0 && (
                            <span className="text-slate-600 text-xs">└─</span>
                          )}
                        </div>

                        {/* Direction indicator */}
                        {row.direction === "ROOT" && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-900/80 text-sky-300 text-[10px] font-bold border border-sky-700">
                            TARGET
                          </span>
                        )}
                        {row.direction === "UPSTREAM" && (
                          <ArrowUpRight size={13} className="text-emerald-400 shrink-0" />
                        )}
                        {row.direction === "DOWNSTREAM" && (
                          <ArrowDownRight size={13} className="text-red-400 shrink-0" />
                        )}

                        <span className="font-bold text-slate-100">{row.code}</span>
                      </div>
                    </td>

                    {/* Name & Domain */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{row.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{row.category}</div>
                    </td>

                    {/* Relationship */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-slate-300">{row.relationship}</span>
                      <div className="text-[10px] text-slate-500">
                        Impact: {Math.round(row.impactFactor * 100)}%
                      </div>
                    </td>

                    {/* Posture */}
                    <td className="py-3 px-3">
                      <StatusBadge status={row.status} size="sm" />
                    </td>

                    {/* Criticality */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          row.criticality === "CRITICAL"
                            ? "bg-red-950/80 text-red-400 border-red-800"
                            : row.criticality === "HIGH"
                            ? "bg-amber-950/80 text-amber-400 border-amber-800"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {row.criticality}
                      </span>
                    </td>

                    {/* Redundancy */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {row.isRedundant ? (
                          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert size={13} className="text-amber-400 shrink-0" />
                        )}
                        <span
                          className={`text-[11px] ${
                            row.isRedundant ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {row.isRedundant ? "Redundant (N-1 Safe)" : "Single Path (N-0)"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[220px]">
                        {row.notes}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAsset(row.id);
                        }}
                        className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-sky-600 text-white font-bold"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {isSelected ? "Inspecting" : "Inspect"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
