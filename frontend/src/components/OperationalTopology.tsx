import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Zap,
  Flame,
  Droplets,
  Wifi,
  Cpu,
  Layers,
  Activity,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { useAssetDependencies } from "@/hooks/useAssetDependencies";
import type { DependencyNode, DependencyEdge, UpstreamDependencyItem } from "@/lib/api";

interface OperationalTopologyProps {
  assetId?: string;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string, node?: DependencyNode) => void;
  onInspectAsset?: (assetCode: string) => void;
  large?: boolean;
  className?: string;
}

interface NodeLayoutPosition {
  x: number;
  y: number;
  node: DependencyNode;
}

export function OperationalTopology({
  assetId = "G-02",
  selectedNodeId,
  onSelectNode,
  onInspectAsset,
  large = false,
  className = "",
}: OperationalTopologyProps) {
  const { data: deps, isLoading, isError, error, refetch } = useAssetDependencies(assetId);

  const [internalSelectedId, setInternalSelectedId] = useState<string>(assetId);
  const activeSelectedId = selectedNodeId !== undefined ? selectedNodeId : internalSelectedId;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<"diagram" | "tree">("diagram");
  const [hoveredEdge, setHoveredEdge] = useState<DependencyEdge | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectNode = useCallback(
    (id: string, node?: DependencyNode) => {
      setInternalSelectedId(id);
      onSelectNode?.(id, node);
    },
    [onSelectNode]
  );

  // Compute Layout Positions
  const { layoutNodes, nodeMap, maxLayerDepth } = useMemo(() => {
    if (!deps || !deps.nodes || deps.nodes.length === 0) {
      return { layoutNodes: [], nodeMap: new Map<string, NodeLayoutPosition>(), maxLayerDepth: 0 };
    }

    // Group nodes by depth
    const layers = new Map<number, DependencyNode[]>();
    let maxDepth = 0;

    deps.nodes.forEach((node) => {
      const d = node.depth ?? 0;
      if (d > maxDepth) maxDepth = d;
      const list = layers.get(d) || [];
      list.push(node);
      layers.set(d, list);
    });

    const positions: NodeLayoutPosition[] = [];
    const map = new Map<string, NodeLayoutPosition>();

    // Canvas coordinate space
    const canvasWidth = 920;
    const canvasHeight = large ? 560 : 440;
    const paddingX = 140;
    const availableWidth = canvasWidth - paddingX * 2;
    const depthSpan = maxDepth > 0 ? maxDepth : 1;
    const colStep = availableWidth / depthSpan;

    layers.forEach((nodesInLayer, depth) => {
      const x = paddingX + depth * colStep;
      const count = nodesInLayer.length;
      const verticalSpacing = 110;
      const totalHeight = (count - 1) * verticalSpacing;
      const startY = (canvasHeight - totalHeight) / 2;

      nodesInLayer.forEach((node, index) => {
        const y = count === 1 ? canvasHeight / 2 : startY + index * verticalSpacing;
        const pos: NodeLayoutPosition = { x, y, node };
        positions.push(pos);
        map.set(node.id, pos);
      });
    });

    return { layoutNodes: positions, nodeMap: map, maxLayerDepth: maxDepth };
  }, [deps, large]);

  // Identify connected downstream nodes and upstream paths for highlighting
  const { connectedNodeIds, connectedEdgeIndices } = useMemo(() => {
    const nodeSet = new Set<string>();
    const edgeSet = new Set<number>();

    if (!deps || !deps.edges || !activeSelectedId) {
      return { connectedNodeIds: nodeSet, connectedEdgeIndices: edgeSet };
    }

    nodeSet.add(activeSelectedId);

    deps.edges.forEach((edge, index) => {
      if (edge.source_id === activeSelectedId) {
        nodeSet.add(edge.target_id);
        edgeSet.add(index);
      } else if (edge.target_id === activeSelectedId) {
        nodeSet.add(edge.source_id);
        edgeSet.add(index);
      }
    });

    return { connectedNodeIds: nodeSet, connectedEdgeIndices: edgeSet };
  }, [deps, activeSelectedId]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary button only
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectedNodeObj = useMemo(() => {
    if (!deps?.nodes || !activeSelectedId) return null;
    return deps.nodes.find((n) => n.id === activeSelectedId || n.code === activeSelectedId) || null;
  }, [deps, activeSelectedId]);

  if (isLoading) {
    return (
      <div
        className={`topology flex flex-col items-center justify-center bg-card/60 border border-border rounded-lg ${
          large ? "h-[590px]" : "h-[440px]"
        } ${className}`}
      >
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs font-mono tracking-wider text-muted-foreground">
          COMPUTING MULTI-HOP DEPENDENCY TOPOLOGY...
        </p>
      </div>
    );
  }

  if (isError || !deps) {
    return (
      <div
        className={`topology flex flex-col items-center justify-center p-6 bg-card border border-destructive/30 rounded-lg ${
          large ? "h-[590px]" : "h-[440px]"
        } ${className}`}
      >
        <ShieldAlert className="w-10 h-10 text-destructive mb-3" />
        <h3 className="font-heading text-sm font-bold tracking-wider text-destructive">
          TOPOLOGY TRAVERSAL FAILED
        </h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm mt-1 mb-4">
          {error?.message || "Failed to load dependency graph from FastAPI backend."}
        </p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-mono font-bold rounded hover:opacity-90"
        >
          RETRY TRAVERSAL
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col bg-card border border-border rounded-lg overflow-hidden ${
        large ? "h-[620px]" : "h-[460px]"
      } ${className}`}
      data-testid="operational-topology-container"
    >
      {/* ── TOPOLOGY HEADER CONTROLS ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/40 z-10">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold tracking-widest text-primary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            TOPOLOGY DAG · {deps.asset_id}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 bg-background border border-border rounded">
            {deps.nodes.length} NODES · {deps.edges.length} EDGES · MAX DEPTH {deps.max_depth}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-background border border-border rounded p-0.5 text-[10px] font-mono font-bold">
            <button
              onClick={() => setViewMode("diagram")}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === "diagram" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              DIAGRAM
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === "tree" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              CASCADE TREE
            </button>
          </div>

          {/* Zoom & Pan Controls */}
          {viewMode === "diagram" && (
            <div className="flex items-center gap-1 bg-background border border-border rounded p-0.5">
              <button
                onClick={() => setZoom((z) => Math.min(1.7, +(z + 0.15).toFixed(2)))}
                aria-label="Zoom in"
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                aria-label="Zoom out"
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetView}
                aria-label="Reset view"
                title="Reset view (100%)"
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── VIEWPORT ────────────────────────────────────────────────────────── */}
      {viewMode === "diagram" ? (
        <div
          ref={containerRef}
          className="relative flex-1 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-background/50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas Wrapper with transform */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isPanning ? "none" : "transform 0.15s cubic-bezier(0.2, 0, 0, 1)",
            }}
            className="absolute inset-0 w-full h-full"
          >
            {/* SVG Background Layer: Grid & Edges */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              aria-hidden="true"
            >
              <defs>
                <pattern id="op-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" className="grid-line" fill="none" opacity="0.35" />
                </pattern>

                <filter id="op-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Arrowheads for different dependency types */}
                <marker id="arrow-electrical" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                </marker>
                <marker id="arrow-thermal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#f97316" />
                </marker>
                <marker id="arrow-hydraulic" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4" />
                </marker>
                <marker id="arrow-control" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#a855f7" />
                </marker>
                <marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--muted-foreground)" opacity="0.6" />
                </marker>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#op-grid)" />

              {/* Layer Column Guides */}
              {Array.from({ length: maxLayerDepth + 1 }).map((_, depth) => {
                const paddingX = 140;
                const availableWidth = 920 - paddingX * 2;
                const colStep = availableWidth / (maxLayerDepth > 0 ? maxLayerDepth : 1);
                const x = paddingX + depth * colStep;
                return (
                  <g key={`guide-${depth}`} opacity="0.25">
                    <line x1={x} y1={20} x2={x} y2={large ? 540 : 420} stroke="var(--border)" strokeDasharray="4 4" />
                    <text x={x} y={35} fill="var(--muted-foreground)" fontSize="9" fontFamily="var(--font-code)" textAnchor="middle">
                      {depth === 0 ? "TIER 0 · ROOT" : depth === 1 ? "TIER 1 · PRIMARY" : depth === 2 ? "TIER 2 · SERVICE" : `TIER ${depth}`}
                    </text>
                  </g>
                );
              })}

              {/* Dependency Edges (Smooth Cubic Beziers) */}
              {deps.edges.map((edge, index) => {
                const src = nodeMap.get(edge.source_id);
                const tgt = nodeMap.get(edge.target_id);
                if (!src || !tgt) return null;

                const isConnected = connectedEdgeIndices.has(index);
                const isHovered = hoveredEdge === edge;

                // Card dimensions offset to anchor at edges
                const x1 = src.x + 85;
                const y1 = src.y;
                const x2 = tgt.x - 85;
                const y2 = tgt.y;

                const dx = Math.max(50, (x2 - x1) * 0.45);
                const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                // Type-specific colors
                let strokeColor = "var(--muted-foreground)";
                let markerId = "arrow-default";
                let strokeDash = "none";

                if (edge.dependency_type === "ELECTRICAL") {
                  strokeColor = "#38bdf8";
                  markerId = "arrow-electrical";
                } else if (edge.dependency_type === "THERMAL") {
                  strokeColor = "#f97316";
                  markerId = "arrow-thermal";
                  strokeDash = "6 4";
                } else if (edge.dependency_type === "HYDRAULIC") {
                  strokeColor = "#06b6d4";
                  markerId = "arrow-hydraulic";
                  strokeDash = "3 3";
                } else if (edge.dependency_type === "CONTROL") {
                  strokeColor = "#a855f7";
                  markerId = "arrow-control";
                  strokeDash = "8 3 2 3";
                }

                if (edge.is_redundant) {
                  strokeDash = "4 4";
                }

                const strokeWidth = isHovered ? 4 : isConnected ? 3 : edge.is_redundant ? 1.5 : 2.2;
                const opacity = isHovered ? 1 : isConnected ? 0.95 : edge.is_redundant ? 0.35 : 0.65;

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                return (
                  <g key={`edge-${index}`} className="pointer-events-auto cursor-pointer">
                    {/* Invisible hit-area */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      onMouseEnter={() => setHoveredEdge(edge)}
                      onMouseLeave={() => setHoveredEdge(null)}
                    />
                    {/* Rendered Edge Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      strokeOpacity={opacity}
                      markerEnd={`url(#${markerId})`}
                      filter={isConnected || isHovered ? "url(#op-glow)" : undefined}
                      className="transition-all duration-200"
                    />
                    {/* Edge Label on Hover or Connection */}
                    {(isHovered || isConnected) && (
                      <g transform={`translate(${midX}, ${midY - 10})`}>
                        <rect
                          x="-45"
                          y="-10"
                          width="90"
                          height="18"
                          rx="3"
                          fill="var(--card)"
                          stroke={strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          fill="var(--foreground)"
                          fontSize="8.5"
                          fontFamily="var(--font-code)"
                          textAnchor="middle"
                          dy="2.5"
                        >
                          {edge.dependency_type} ({(edge.impact_factor * 100).toFixed(0)}%)
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* HTML Interactive Nodes */}
            {layoutNodes.map(({ x, y, node }) => {
              const isSelected = activeSelectedId === node.id || activeSelectedId === node.code;
              const isConnected = connectedNodeIds.has(node.id);
              const isRoot = node.depth === 0;

              let statusColor = "bg-emerald-500";
              let statusBorder = "border-emerald-500/40";
              if (node.status === "CRITICAL") {
                statusColor = "bg-rose-500";
                statusBorder = "border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
              } else if (node.status === "WARNING") {
                statusColor = "bg-amber-500";
                statusBorder = "border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]";
              }

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="z-10"
                >
                  <button
                    onClick={() => handleSelectNode(node.id, node)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Node ${node.code} ${node.name}, status ${node.status}, depth ${node.depth}`}
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelectNode(node.id, node);
                      }
                    }}
                    className={`w-[175px] text-left p-2.5 rounded-lg border transition-all duration-200 bg-card/95 backdrop-blur-sm ${
                      isSelected
                        ? "ring-2 ring-primary border-primary shadow-[0_0_16px_color-mix(in_oklab,var(--primary)_25%,transparent)] scale-105"
                        : isConnected
                        ? "border-primary/60 scale-[1.02]"
                        : statusBorder
                    }`}
                  >
                    {/* Top Row: Type & Status */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1">
                        {node.node_type === "ASSET" ? (
                          <Cpu className="w-3 h-3 text-primary" />
                        ) : node.node_type === "SERVICE" ? (
                          <Activity className="w-3 h-3 text-amber-400" />
                        ) : (
                          <MapPin className="w-3 h-3 text-emerald-400" />
                        )}
                        <span className="text-[9px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                          {node.node_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusColor} ${node.status === "CRITICAL" ? "animate-ping" : ""}`} />
                        <span className="text-[8.5px] font-mono font-bold text-foreground">
                          L{node.depth ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Code & Name */}
                    <div className="font-heading font-bold text-[11px] tracking-wide text-foreground truncate">
                      {node.code}
                    </div>
                    <div className="text-[9.5px] text-muted-foreground truncate leading-tight mt-0.5">
                      {node.name}
                    </div>

                    {/* Bottom: Criticality & Redundancy tag */}
                    <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-border/50 text-[8.5px] font-mono">
                      <span className="text-muted-foreground truncate">{node.criticality}</span>
                      {isRoot ? (
                        <span className="px-1 py-0.2 bg-primary/20 text-primary font-bold rounded text-[8px]">
                          ROOT FOCUS
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{node.status}</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Canvas Floating Legend */}
          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-md border border-border rounded-lg p-2.5 shadow-lg pointer-events-auto flex flex-wrap items-center gap-3 text-[10px] font-mono">
            <span className="font-bold text-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#38bdf8]" /> ELECTRICAL
            </span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#f97316]" /> THERMAL
            </span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Droplets className="w-3 h-3 text-[#06b6d4]" /> HYDRAULIC
            </span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Wifi className="w-3 h-3 text-[#a855f7]" /> CONTROL
            </span>
            <span className="text-muted-foreground border-l border-border pl-2">
              - - REDUNDANT
            </span>
          </div>

          {/* Quick Fit / Center button */}
          <button
            onClick={resetView}
            className="absolute bottom-3 right-3 bg-card/90 hover:bg-card border border-border p-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1 shadow-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" /> FIT VIEW
          </button>
        </div>
      ) : (
        /* ── CASCADE TREE VIEW (MOBILE / ACCESSIBILITY MODE) ─────────────────── */
        <div className="flex-1 w-full h-full overflow-y-auto p-4 space-y-4 bg-background">
          <div className="text-xs text-muted-foreground mb-2">
            Hierarchical multi-hop traversal tree ordered by topological blast-radius depth:
          </div>

          {Array.from({ length: maxLayerDepth + 1 }).map((_, depth) => {
            const nodesInDepth = deps.nodes.filter((n) => (n.depth ?? 0) === depth);
            if (nodesInDepth.length === 0) return null;

            return (
              <div key={`tree-depth-${depth}`} className="border border-border rounded-lg p-3 bg-card/60">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-xs font-mono font-bold">
                  <span className="text-primary flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/30 rounded text-[10px]">
                      HOP DEPTH {depth}
                    </span>
                    {depth === 0 ? "ROOT EQUIPMENT" : depth === 1 ? "FIRST-ORDER DEPENDENTS" : "CASCADING DOWNSTREAM SERVICES"}
                  </span>
                  <span className="text-muted-foreground text-[10px]">{nodesInDepth.length} ENTITIES</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {nodesInDepth.map((node) => {
                    const isSelected = activeSelectedId === node.id || activeSelectedId === node.code;
                    return (
                      <div
                        key={node.id}
                        onClick={() => handleSelectNode(node.id, node)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-border/80 bg-background"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs">{node.code}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              node.status === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : node.status === "WARNING"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{node.name}</div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-2 pt-2 border-t border-border/40">
                          <span>{node.node_type}</span>
                          <span className="font-bold text-foreground">{node.criticality}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SELECTED NODE CONTEXT STRIP ─────────────────────────────────────── */}
      {selectedNodeObj && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-foreground">{selectedNodeObj.code}</span>
            <span className="text-muted-foreground truncate max-w-xs">{selectedNodeObj.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-background border border-border rounded font-bold">
              {selectedNodeObj.criticality}
            </span>
            <span className="text-[10px] font-mono text-primary">
              HOP DEPTH: {selectedNodeObj.depth ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedNodeObj.node_type === "ASSET" && selectedNodeObj.code !== assetId && (
              <button
                onClick={() => onInspectAsset?.(selectedNodeObj.code)}
                className="px-2.5 py-1 bg-primary text-primary-foreground font-mono text-[11px] font-bold rounded hover:opacity-90 flex items-center gap-1 transition-opacity"
              >
                FOCUS DIGITAL TWIN <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
