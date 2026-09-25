import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Zap,
  Wifi,
  Home,
  FlaskConical,
  Fuel,
  Truck,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Maximize2,
  ExternalLink,
} from "lucide-react";

export interface StationNode {
  id: string;
  name: string;
  type: string;
  status: "NOMINAL" | "WARNING" | "CRITICAL";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  x: number; // percentage
  y: number; // percentage
  assetCode?: string;
  health: number;
  telemetrySummary: string;
  dependencies: string[];
}

export const STATION_NODES: StationNode[] = [
  {
    id: "power-plant",
    name: "Power Plant",
    type: "Primary Generation",
    status: "WARNING",
    icon: Zap,
    x: 28,
    y: 42,
    assetCode: "G-02",
    health: 84.5,
    telemetrySummary: "G-02 bearing vibration anomaly (4.82 mm/s RMS). G-01 standby.",
    dependencies: ["Fuel Farm", "Logistics Bay"],
  },
  {
    id: "fuel-farm",
    name: "Fuel Farm",
    type: "Resource Storage",
    status: "NOMINAL",
    icon: Fuel,
    x: 14,
    y: 68,
    health: 96.0,
    telemetrySummary: "64,800 L Aviation Grade Kerosene in 4 insulated tank banks.",
    dependencies: ["Logistics Bay"],
  },
  {
    id: "habitat",
    name: "Habitat Block",
    type: "Life Support & Crew",
    status: "NOMINAL",
    icon: Home,
    x: 52,
    y: 35,
    health: 98.2,
    telemetrySummary: "Indoor +20.4°C. Air circulation & pressurized heating nominal.",
    dependencies: ["Power Plant", "Water & Waste"],
  },
  {
    id: "science-lab",
    name: "Science Lab",
    type: "Research & Sensors",
    status: "NOMINAL",
    icon: FlaskConical,
    x: 74,
    y: 30,
    health: 95.0,
    telemetrySummary: "Atmospheric LiDAR & Geomagnetic array active. Uninterrupted power.",
    dependencies: ["Power Plant", "Comms Mast"],
  },
  {
    id: "comms-mast",
    name: "Comms Mast",
    type: "Edge Telemetry",
    status: "NOMINAL",
    icon: Wifi,
    x: 50,
    y: 72,
    health: 92.4,
    telemetrySummary: "Ku-band satellite link active. HF backup verified.",
    dependencies: ["Power Plant"],
  },
  {
    id: "logistics-bay",
    name: "Logistics Bay",
    type: "Surface Transport",
    status: "NOMINAL",
    icon: Truck,
    x: 18,
    y: 20,
    health: 94.0,
    telemetrySummary: "PistenBully tracked vehicles pre-heated. Spares bay locked.",
    dependencies: [],
  },
  {
    id: "water-waste",
    name: "Water & Waste",
    type: "Environmental Utilities",
    status: "NOMINAL",
    icon: Droplets,
    x: 80,
    y: 65,
    health: 97.0,
    telemetrySummary: "Reverse osmosis snow melter nominal. Graywater recirculating.",
    dependencies: ["Power Plant"],
  },
];

interface StationDigitalTwinProps {
  onInspectAsset?: (assetId: string) => void;
  onOpenExplanation?: (domain: string, entityId: string) => void;
}

export function StationDigitalTwin({
  onInspectAsset,
  onOpenExplanation,
}: StationDigitalTwinProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("power-plant");

  const selectedNode =
    STATION_NODES.find((n) => n.id === selectedNodeId) ?? STATION_NODES[0]!;

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Topology Canvas */}
      <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#070B12] relative overflow-hidden min-h-[380px] sm:min-h-[440px] flex flex-col justify-between p-4 select-none">
        {/* Subtle coordinate grid lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="station-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400 dark:text-slate-700" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#station-grid)" />
          
          {/* Functional Operational Dependency Lines */}
          {/* Fuel Farm -> Power Plant */}
          <line x1="14%" y1="68%" x2="28%" y2="42%" stroke="#369ACC" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-60" />
          {/* Power Plant -> Habitat */}
          <line x1="28%" y1="42%" x2="52%" y2="35%" stroke="#F4895F" strokeWidth="2" className="opacity-80" />
          {/* Habitat -> Science Lab */}
          <line x1="52%" y1="35%" x2="74%" y2="30%" stroke="#369ACC" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-60" />
          {/* Power Plant -> Comms Mast */}
          <line x1="28%" y1="42%" x2="50%" y2="72%" stroke="#369ACC" strokeWidth="1.5" className="opacity-50" />
          {/* Comms Mast -> Science Lab */}
          <line x1="50%" y1="72%" x2="74%" y2="30%" stroke="#369ACC" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-40" />
          {/* Power Plant -> Water & Waste */}
          <line x1="28%" y1="42%" x2="80%" y2="65%" stroke="#369ACC" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-40" />
          {/* Logistics Bay -> Fuel Farm */}
          <line x1="18%" y1="20%" x2="14%" y2="68%" stroke="#369ACC" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-40" />
        </svg>

        {/* Canvas Header Legend */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              TOPOLOGY DAG · BHARATI
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              7 SUBSYSTEMS MAPPED
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4FAE7A]" /> NOMINAL
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F4895F]" /> WARNING
            </span>
          </div>
        </div>

        {/* Nodes positioned in topology space */}
        <div className="relative z-10 flex-1 my-2">
          {STATION_NODES.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNodeId === node.id;
            const isWarning = node.status === "WARNING";

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-lg border transition-all duration-150 cursor-pointer text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#369ACC] ${
                  isSelected
                    ? "bg-white dark:bg-[#0F172A] border-[#369ACC] shadow-lg ring-2 ring-[#369ACC]/30 scale-105 z-20"
                    : "bg-white/90 dark:bg-[#0B1120]/90 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs z-10"
                }`}
                aria-label={`${node.name} (${node.status})`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                      isWarning
                        ? "bg-[#F4895F]/15 text-[#F4895F]"
                        : "bg-[#369ACC]/10 text-[#369ACC]"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="hidden sm:block pr-1 leading-tight">
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1">
                      <span>{node.name}</span>
                      {isWarning && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F4895F] animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {node.health.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Canvas Footer Hint */}
        <div className="relative z-10 text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <span>Click any node to inspect operational context and dependency blast radius.</span>
          <Link
            to="/digital-twin"
            search={{ asset: "G-02" }}
            className="text-[#369ACC] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>FULL DIGITAL TWIN VIEW</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* Selected Node Inspector Side Panel */}
      <div className="w-full xl:w-80 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#369ACC] font-bold">
                {selectedNode.type}
              </span>
              <h3 className="font-bold text-base font-headline text-slate-900 dark:text-white">
                {selectedNode.name}
              </h3>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                selectedNode.status === "WARNING"
                  ? "bg-[#F4895F]/10 text-[#F4895F] border-[#F4895F]/30"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
              }`}
            >
              {selectedNode.status}
            </span>
          </div>

          <div className="py-3 space-y-3 text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Operational Telemetry</div>
              <div className="text-slate-700 dark:text-slate-300 font-sans mt-0.5 leading-relaxed">
                {selectedNode.telemetrySummary}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Health Index</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedNode.health.toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Truth Type</span>
                <span className="text-sm font-bold text-[#369ACC]">
                  MEASURED
                </span>
              </div>
            </div>

            {selectedNode.dependencies.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase mb-1">
                  Active Dependencies
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action button: If Power Plant / G-02, provide direct intelligence inspector */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-2">
          {selectedNode.id === "power-plant" ? (
            <>
              <Link
                to="/digital-twin"
                search={{ asset: "G-02" }}
                className="w-full py-2 px-3 rounded bg-[#369ACC] hover:bg-[#369ACC]/90 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>OPEN G-02 ASSET INTELLIGENCE</span>
                <ExternalLink size={13} />
              </Link>
              {onOpenExplanation && (
                <button
                  type="button"
                  onClick={() => onOpenExplanation("ASSET", "G-02")}
                  className="w-full py-1.5 px-3 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors"
                >
                  EXPLAIN EVENT CHAIN
                </button>
              )}
            </>
          ) : (
            <Link
              to="/digital-twin"
              className="w-full py-2 px-3 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center justify-center gap-1 transition-colors"
            >
              <span>INSPECT IN DIGITAL TWIN</span>
              <ChevronRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
