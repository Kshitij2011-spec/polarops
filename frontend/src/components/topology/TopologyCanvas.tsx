import React, { useState, useMemo } from "react";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Zap,
  Flame,
  Fuel,
  Activity,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Filter,
} from "lucide-react";
import type { AssetDependencies, AssetListItem } from "@/lib/api/twin";

export interface TopologyCanvasProps {
  dependencies?: AssetDependencies | null;
  assets?: AssetListItem[];
  selectedAssetId: string;
  onSelectAsset: (assetId: string) => void;
  onSwitchToTable: () => void;
}

type TraceFilter = "all" | "upstream" | "downstream";

interface NodePosition {
  id: string;
  code: string;
  name: string;
  nodeType: "ASSET" | "SERVICE" | "ZONE";
  category?: string;
  status: string;
  criticality: string;
  layer: number;
  x: number;
  y: number;
  isRoot: boolean;
  isUpstream: boolean;
  isDownstream: boolean;
}

export function TopologyCanvas({
  dependencies,
  assets = [],
  selectedAssetId,
  onSelectAsset,
  onSwitchToTable,
}: TopologyCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [traceFilter, setTraceFilter] = useState<TraceFilter>("all");
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate Deterministic Layered DAG Coordinates
  const { nodePositions, edgesToRender } = useMemo(() => {
    if (!dependencies) {
      return { nodePositions: [], edgesToRender: [] };
    }

    const upstreamIds = new Set(
      dependencies.upstream_dependencies.map((u) => u.asset_id)
    );
    const downstreamIds = new Set(
      dependencies.nodes
        .filter((n) => n.id !== dependencies.asset_id)
        .map((n) => n.id)
    );

    // Map each node into deterministic operational hierarchy layers:
    // Layer 0: Resources / Inputs
    // Layer 1: Prime Movers (Generators, Boilers)
    // Layer 2: Distribution (Buses, Thermal Loops, PDUs)
    // Layer 3: Secondary Consumers (Pumps, HVAC, Science)
    // Layer 4: Habitats, Services, Life Support
    const getLayerForNode = (
      nodeId: string,
      nodeType: string,
      category?: string | null,
      depth: number = 0
    ): number => {
      if (nodeType === "SERVICE") return 4;
      if (nodeType === "ZONE") return 4;
      if (category === "GENERATOR" || category === "BOILER") {
        return upstreamIds.has(nodeId) ? 0 : 1;
      }
      if (category === "POWER_DISTRIBUTION") return 2;
      if (category === "HVAC" || category === "PUMP") return 3;
      return Math.min(depth + 1, 4);
    };

    // Group nodes by layer
    const layersMap: Record<number, NodePosition[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
    };

    // Inject upstream dependencies if not present in main nodes list
    dependencies.upstream_dependencies.forEach((up) => {
      if (!dependencies.nodes.some((n) => n.id === up.asset_id)) {
        (layersMap[0] ??= []).push({
          id: up.asset_id,
          code: up.code,
          name: up.name,
          nodeType: "ASSET",
          category: "GENERATOR",
          status: "NOMINAL",
          criticality: "CRITICAL",
          layer: 0,
          x: 0,
          y: 0,
          isRoot: false,
          isUpstream: true,
          isDownstream: false,
        });
      }
    });

    dependencies.nodes.forEach((n) => {
      const isRoot = n.id === dependencies.asset_id;
      const isUp = upstreamIds.has(n.id);
      const isDown = downstreamIds.has(n.id);
      const layer = isRoot ? 1 : getLayerForNode(n.id, n.node_type, n.category, n.depth);

      (layersMap[layer] ??= []).push({
        id: n.id,
        code: n.code,
        name: n.name,
        nodeType: (n.node_type as any) || "ASSET",
        category: n.category || undefined,
        status: n.status || "NOMINAL",
        criticality: n.criticality || "STANDARD",
        layer,
        x: 0,
        y: 0,
        isRoot,
        isUpstream: isUp,
        isDownstream: isDown,
      });
    });

    // Compute deterministic (x, y) coordinates for each node
    // Fixed canvas width 900, height 500
    const canvasWidth = 920;
    const canvasHeight = 520;
    const layerXCoords = [80, 260, 470, 680, 850];
    const computedNodes: NodePosition[] = [];
    const nodeLookup = new Map<string, NodePosition>();

    Object.entries(layersMap).forEach(([layerStr, layerNodes]) => {
      const layerIdx = Number(layerStr);
      const x = layerXCoords[layerIdx] || 100 + layerIdx * 180;
      const totalInLayer = layerNodes.length;
      const spacingY = totalInLayer > 1 ? (canvasHeight - 120) / (totalInLayer + 1) : 0;

      layerNodes.forEach((node, nodeIdx) => {
        const y = totalInLayer === 1 ? canvasHeight / 2 : 70 + (nodeIdx + 1) * spacingY;
        const posNode = { ...node, x, y };
        computedNodes.push(posNode);
        nodeLookup.set(posNode.id, posNode);
      });
    });

    // Compile edges with source and target coordinates
    const edgesWithCoords = dependencies.edges
      .map((edge) => {
        const sourceNode = nodeLookup.get(edge.source_id);
        const targetNode = nodeLookup.get(edge.target_id);
        if (!sourceNode || !targetNode) return null;

        // Trace filtering logic
        if (traceFilter === "upstream" && !sourceNode.isUpstream && !targetNode.isUpstream) {
          return null;
        }
        if (traceFilter === "downstream" && !sourceNode.isDownstream && !targetNode.isDownstream) {
          return null;
        }

        return {
          ...edge,
          source: sourceNode,
          target: targetNode,
        };
      })
      .filter(Boolean) as Array<{
      source_id: string;
      target_id: string;
      dependency_type: string;
      impact_factor: number;
      is_redundant: boolean;
      source: NodePosition;
      target: NodePosition;
    }>;

    return { nodePositions: computedNodes, edgesToRender: edgesWithCoords };
  }, [dependencies, traceFilter]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Edge styling based on physical conduit semantics
  const getEdgeStroke = (type: string) => {
    switch (type.toUpperCase()) {
      case "ELECTRICAL":
        return "#f59e0b"; // Gold
      case "THERMAL":
        return "#ef4444"; // Crimson
      case "FUEL":
        return "#d97706"; // Amber
      case "DATA":
        return "#0ea5e9"; // Cyan
      default:
        return "#64748b"; // Slate
    }
  };

  return (
    <div
      role="region"
      aria-label="Operational Topology Canvas"
      className="flex-1 flex flex-col min-h-0 bg-[#070B13] relative overflow-hidden select-none"
    >
      {/* Top Toolbar */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono z-20">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-sky-400 shrink-0" />
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            Deterministic System Topology DAG
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400">
            {nodePositions.length} Nodes • {edgesToRender.length} Operational Conduits
          </span>
        </div>

        {/* Trace Filters & Canvas Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              type="button"
              onClick={() => setTraceFilter("all")}
              className={`px-2 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                traceFilter === "all" ? "bg-sky-950 text-sky-300 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Links
            </button>
            <button
              type="button"
              onClick={() => setTraceFilter("upstream")}
              className={`px-2 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                traceFilter === "upstream" ? "bg-cyan-950 text-cyan-300 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Upstream Inflow
            </button>
            <button
              type="button"
              onClick={() => setTraceFilter("downstream")}
              className={`px-2 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                traceFilter === "downstream" ? "bg-amber-950 text-amber-300 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Blast Radius
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom & Fit Controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.0))}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded cursor-pointer"
              title="Reset View"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={onSwitchToTable}
            className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer flex items-center gap-1"
          >
            <span>TreeGrid View</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Subtle background radar coordinates */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

        <svg
          className="w-full h-full absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          viewBox="0 0 940 540"
        >
          <defs>
            {/* Arrowhead markers for directional conduits */}
            <marker
              id="arrow-electrical"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
            </marker>
            <marker
              id="arrow-thermal"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
            </marker>
            <marker
              id="arrow-default"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
            </marker>

            {/* Glowing filter for critical blast radius nodes */}
            <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.6" />
            </filter>
            <filter id="glow-focus" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Layer Boundary Labels */}
          <g className="text-[10px] font-mono fill-slate-600 select-none">
            <text x="80" y="30" textAnchor="middle">0: INFLOW / FUELS</text>
            <text x="260" y="30" textAnchor="middle">1: PRIME MOVERS</text>
            <text x="470" y="30" textAnchor="middle">2: DISTRIBUTION BUSES</text>
            <text x="680" y="30" textAnchor="middle">3: CONSUMERS / PUMPS</text>
            <text x="850" y="30" textAnchor="middle">4: LIFE SUPPORT / ZONES</text>
          </g>

          {/* Vertical Hierarchy Guideline Stripes */}
          {[80, 260, 470, 680, 850].map((xPos) => (
            <line
              key={xPos}
              x1={xPos}
              y1="40"
              x2={xPos}
              y2="510"
              stroke="#1e293b"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
          ))}

          {/* Render Directed Relationship Edges */}
          {edgesToRender.map((edge, idx) => {
            const isThermal = edge.dependency_type.toUpperCase() === "THERMAL";
            const isElectrical = edge.dependency_type.toUpperCase() === "ELECTRICAL";
            const strokeColor = getEdgeStroke(edge.dependency_type);
            const isHighlighted =
              edge.source.isRoot || edge.target.isRoot || edge.target.isDownstream;

            // Compute curved bezier path from source to target
            const dx = edge.target.x - edge.source.x;
            const controlX1 = edge.source.x + dx * 0.45;
            const controlX2 = edge.source.x + dx * 0.55;
            const d = `M ${edge.source.x} ${edge.source.y} C ${controlX1} ${edge.source.y}, ${controlX2} ${edge.target.y}, ${edge.target.x} ${edge.target.y}`;

            return (
              <g key={`${edge.source_id}-${edge.target_id}-${idx}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={edge.is_redundant ? "4 4" : undefined}
                  opacity={isHighlighted ? 0.95 : 0.4}
                  markerEnd={
                    isThermal
                      ? "url(#arrow-thermal)"
                      : isElectrical
                      ? "url(#arrow-electrical)"
                      : "url(#arrow-default)"
                  }
                />
                {/* Edge Impact Badge */}
                {edge.impact_factor && edge.impact_factor >= 0.7 && (
                  <text
                    x={(edge.source.x + edge.target.x) / 2}
                    y={(edge.source.y + edge.target.y) / 2 - 6}
                    fill={strokeColor}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none font-bold"
                  >
                    {(edge.impact_factor * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodePositions.map((node) => {
            const isSelected = node.id === selectedAssetId;
            const isDegraded =
              node.status === "WARNING" || node.status === "CRITICAL" || node.status === "DEGRADED";
            const isService = node.nodeType === "SERVICE";

            return (
              <g
                key={node.id}
                data-node-id={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAsset(node.id);
                }}
                className="cursor-pointer transition-transform duration-150 hover:scale-105"
              >
                {/* Outer Focus Glow Ring */}
                {isSelected && (
                  <circle
                    r={isService ? 36 : 42}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                    filter="url(#glow-focus)"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node Box or Circle based on Type */}
                {isService ? (
                  <rect
                    x="-32"
                    y="-16"
                    width="64"
                    height="32"
                    rx="6"
                    fill={isSelected ? "#082f49" : "#0f172a"}
                    stroke={
                      node.isDownstream ? "#f59e0b" : isSelected ? "#38bdf8" : "#334155"
                    }
                    strokeWidth={isSelected || node.isDownstream ? 2 : 1}
                  />
                ) : (
                  <rect
                    x="-40"
                    y="-24"
                    width="80"
                    height="48"
                    rx="8"
                    fill={
                      node.isRoot
                        ? "#082f49"
                        : isDegraded
                        ? "#451a03"
                        : isSelected
                        ? "#0c4a6e"
                        : "#0f172a"
                    }
                    stroke={
                      node.isRoot
                        ? "#38bdf8"
                        : isDegraded
                        ? "#f59e0b"
                        : isSelected
                        ? "#0284c7"
                        : "#334155"
                    }
                    strokeWidth={node.isRoot || isSelected ? 2.5 : 1.5}
                    filter={isDegraded ? "url(#glow-danger)" : undefined}
                  />
                )}

                {/* Status Indicator Dot */}
                <circle
                  cx={isService ? 24 : 30}
                  cy={isService ? -10 : -16}
                  r="4"
                  fill={
                    isDegraded
                      ? "#f59e0b"
                      : node.status === "NOMINAL" || node.status === "ACTIVE"
                      ? "#10b981"
                      : "#94a3b8"
                  }
                  className={isDegraded ? "animate-ping-once" : ""}
                />

                {/* Node Content */}
                <text
                  x="0"
                  y={isService ? 4 : -4}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize={isService ? "10" : "11"}
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none select-none"
                >
                  {node.code}
                </text>

                {!isService && (
                  <text
                    x="0"
                    y="14"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    className="pointer-events-none select-none truncate"
                  >
                    {node.criticality === "CRITICAL" ? "N-0 SINGLE" : node.category || "EQUIP"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Conduit Legend Bar */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-slate-400 z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-300 uppercase">Operational Semantics:</span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-1 bg-amber-400 rounded-sm" /> Electrical Grid (415V)
          </span>
          <span className="flex items-center gap-1.5 text-red-300">
            <span className="w-2.5 h-1 bg-red-400 rounded-sm" /> Hydronic Glycol Heating
          </span>
          <span className="flex items-center gap-1.5 text-amber-500">
            <span className="w-2.5 h-1 bg-amber-600 rounded-sm" /> Arctic Diesel LFO
          </span>
          <span className="flex items-center gap-1.5 text-sky-300">
            <span className="w-2.5 h-1 bg-sky-400 rounded-sm" /> SCADA / Control Bus
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-4 h-0 border-t-2 border-dashed border-slate-400" /> N-1 Redundant
          </span>
          <span className="flex items-center gap-1 text-red-400 font-bold">
            <span className="w-4 h-0 border-t-2 border-solid border-red-400" /> N-0 Single Point
          </span>
        </div>
      </div>
    </div>
  );
}
