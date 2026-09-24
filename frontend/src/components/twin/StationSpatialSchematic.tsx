import React, { useState } from "react";
import {
  Compass,
  Wind,
  Thermometer,
  ShieldAlert,
  Flame,
  Zap,
  Building2,
  Layers,
  Info,
} from "lucide-react";
import type { AssetListItem } from "@/lib/api/twin";
import { StatusBadge } from "@/components/foundation/StatusBadge";

export interface StationSpatialSchematicProps {
  stationId: string;
  assets?: AssetListItem[];
  selectedAssetId: string;
  onSelectAsset: (assetId: string) => void;
}

interface StationModule {
  id: string;
  code: string;
  name: string;
  zone: string;
  x: number;
  y: number;
  width: number;
  height: number;
  thermalZone: "HEATED" | "UNHEATED" | "BUFFER";
  exposure: "WINDWARD" | "LEEWARD" | "INTERNAL";
  assetsContained: { id: string; code: string; type: string; status?: string }[];
  containmentRating: string;
}

export function StationSpatialSchematic({
  stationId,
  assets = [],
  selectedAssetId,
  onSelectAsset,
}: StationSpatialSchematicProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>("MOD-PWR-A");

  // Physical layout of Antarctic Bharati / Maitri Station Modules
  const stationModules: StationModule[] = [
    {
      id: "MOD-FUEL",
      code: "DEPOT-01",
      name: "Arctic Fuel Storage Depot",
      zone: "ZONE-FUEL",
      x: 40,
      y: 160,
      width: 140,
      height: 120,
      thermalZone: "UNHEATED",
      exposure: "WINDWARD",
      containmentRating: "Class A Double-Walled Bund",
      assetsContained: [
        { id: "TNK-01", code: "TNK-01", type: "Fuel Tank 1", status: "NOMINAL" },
        { id: "FP-01", code: "FP-01", type: "Fuel Transfer Pump", status: "NOMINAL" },
      ],
    },
    {
      id: "MOD-PWR-A",
      code: "PWR-BLOCK-A",
      name: "Primary Generation Block A",
      zone: "POWER-GEN-A",
      x: 210,
      y: 130,
      width: 200,
      height: 180,
      thermalZone: "HEATED",
      exposure: "WINDWARD",
      containmentRating: "Fire Barrier EI-120 + Halon Suppression",
      assetsContained: [
        { id: "G-01", code: "G-01", type: "Genset 1", status: "NOMINAL" },
        { id: "G-02", code: "G-02", type: "Genset 2", status: "DEGRADED" },
        { id: "HEX-01", code: "HEX-01", type: "Primary Heat Exchanger", status: "NOMINAL" },
      ],
    },
    {
      id: "MOD-PWR-B",
      code: "PWR-BLOCK-B",
      name: "Auxiliary Generation & Battery Block",
      zone: "POWER-GEN-B",
      x: 210,
      y: 330,
      width: 200,
      height: 140,
      thermalZone: "HEATED",
      exposure: "INTERNAL",
      containmentRating: "Fire Barrier EI-60",
      assetsContained: [
        { id: "G-03", code: "G-03", type: "Genset 3 (Cold Standby)", status: "OFFLINE" },
        { id: "BAT-01", code: "BAT-01", type: "UPS Battery Bank", status: "NOMINAL" },
      ],
    },
    {
      id: "MOD-CORE",
      code: "CENTRAL-CORE",
      name: "Operations Central Core & SCADA",
      zone: "ZONE-CORE",
      x: 440,
      y: 190,
      width: 170,
      height: 180,
      thermalZone: "HEATED",
      exposure: "INTERNAL",
      containmentRating: "Pressurized Clean Zone",
      assetsContained: [
        { id: "SCADA-01", code: "SCADA-01", type: "Primary SCADA Server", status: "NOMINAL" },
        { id: "PDU-MAIN", code: "PDU-MAIN", type: "Main 415V Switchboard", status: "NOMINAL" },
      ],
    },
    {
      id: "MOD-HAB",
      code: "HABITAT-01",
      name: "Crew Quarters & Life Support",
      zone: "ZONE-HAB",
      x: 640,
      y: 90,
      width: 210,
      height: 170,
      thermalZone: "HEATED",
      exposure: "LEEWARD",
      containmentRating: "Acoustic / Thermal Insulated",
      assetsContained: [
        { id: "HVAC-01", code: "HVAC-01", type: "Habitat Air Handler", status: "NOMINAL" },
        { id: "RO-01", code: "RO-01", type: "Water Desal RO Unit", status: "NOMINAL" },
        { id: "WP-01", code: "WP-01", type: "Potable Water Pump", status: "NOMINAL" },
      ],
    },
    {
      id: "MOD-SCI",
      code: "SCIENCE-WING",
      name: "Atmospheric & Ionospheric Science Labs",
      zone: "ZONE-SCI",
      x: 640,
      y: 290,
      width: 210,
      height: 180,
      thermalZone: "HEATED",
      exposure: "LEEWARD",
      containmentRating: "RF Shielded / High Voltage Isolation",
      assetsContained: [
        { id: "PDU-SCI", code: "PDU-SCI", type: "Science Lab Sub-PDU", status: "NOMINAL" },
        { id: "LIDAR-01", code: "LIDAR-01", type: "Atmospheric Lidar", status: "NOMINAL" },
      ],
    },
  ];

  const fallbackModule: StationModule = stationModules[0] as StationModule;
  const activeModule: StationModule =
    stationModules.find((m) => m.id === selectedModuleId) ?? fallbackModule;

  return (
    <div
      className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100 font-mono"
      role="region"
      aria-label="2D Isometric Station Physical Compartment Schematic"
    >
      {/* Schematic Sub-header */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider">
            <Building2 size={16} />
            <span>Station Physical Compartments & Thermal Envelopes</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Station: {stationId} • 6 Modules Mapped
          </span>
        </div>

        {/* Environmental Exposure Telemetry */}
        <div className="flex items-center gap-4 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 text-sky-300">
            <Wind size={14} className="text-sky-400 animate-pulse" />
            <span>Blizzard 48 kts (Bearing 280° NW)</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-300">
            <Thermometer size={14} className="text-blue-400" />
            <span>Exterior: -38.2°C (Wind Chill -51°C)</span>
          </div>
        </div>
      </div>

      {/* Main Schematic Area: SVG Layout (Left/Top) + Compartment Inspector (Right/Bottom) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* SVG Drawing Canvas */}
        <div className="flex-1 p-6 relative overflow-auto flex items-center justify-center bg-[#090E17]">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Windward Direction Arrow / Gale Indicator */}
          <div className="absolute top-4 left-4 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase">
              <Compass size={13} />
              <span>Prevailing Windward Face</span>
            </div>
            <div className="text-slate-400">Gale Force Blizzard Buffeting West Facade</div>
          </div>

          <svg
            className="w-full max-w-[900px] h-[520px] select-none"
            viewBox="0 0 900 520"
            role="img"
            aria-label="Antarctic Station Physical Compartment Floor Plan"
          >
            <defs>
              {/* Pattern for insulation / unheated buffer */}
              <pattern id="stripes" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#1e293b" strokeWidth="2" />
              </pattern>
            </defs>

            {/* Environmental Wind Gust Arrows from Left (West) */}
            <g opacity="0.4" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5,4">
              <line x1="10" y1="180" x2="35" y2="180" markerEnd="url(#arrow)" />
              <line x1="10" y1="240" x2="35" y2="240" />
              <line x1="10" y1="300" x2="35" y2="300" />
            </g>

            {/* Connecting Conduits / Corridors Between Modules */}
            <path
              d="M 180 220 L 210 220 M 410 220 L 440 220 M 410 400 L 440 340 M 610 220 L 640 180 M 610 280 L 640 340"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 180 220 L 210 220 M 410 220 L 440 220 M 410 400 L 440 340 M 610 220 L 640 180 M 610 280 L 640 340"
              stroke="#0f172a"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />

            {/* Render Station Modules */}
            {stationModules.map((mod) => {
              const isSelected = mod.id === selectedModuleId;
              const containsTargetAsset = mod.assetsContained.some((a) => a.id === selectedAssetId);

              return (
                <g
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className="cursor-pointer transition-all"
                  role="button"
                  tabIndex={0}
                  aria-label={`${mod.name}, contains ${mod.assetsContained.length} machines`}
                >
                  {/* Module Boundary Rectangle */}
                  <rect
                    x={mod.x}
                    y={mod.y}
                    width={mod.width}
                    height={mod.height}
                    rx="8"
                    className={`transition-all ${
                      isSelected
                        ? "fill-slate-900 stroke-sky-400 stroke-2"
                        : containsTargetAsset
                        ? "fill-slate-950 stroke-amber-500/80 stroke-2"
                        : "fill-slate-950/90 stroke-slate-800 hover:stroke-slate-700 stroke-1"
                    }`}
                  />

                  {/* Header Banner */}
                  <rect
                    x={mod.x}
                    y={mod.y}
                    width={mod.width}
                    height="28"
                    rx="6"
                    className={
                      isSelected
                        ? "fill-sky-950/80"
                        : containsTargetAsset
                        ? "fill-amber-950/50"
                        : "fill-slate-900/60"
                    }
                  />

                  {/* Module Code and Name */}
                  <text
                    x={mod.x + 12}
                    y={mod.y + 18}
                    className="fill-slate-200 text-[11px] font-bold font-mono tracking-wide"
                  >
                    {mod.code}
                  </text>

                  <text
                    x={mod.x + 12}
                    y={mod.y + 44}
                    className="fill-slate-400 text-[9px] font-mono"
                  >
                    {mod.name.length > 25 ? `${mod.name.substring(0, 24)}...` : mod.name}
                  </text>

                  {/* Exposure Badge */}
                  <rect
                    x={mod.x + mod.width - 70}
                    y={mod.y + 6}
                    width="60"
                    height="16"
                    rx="3"
                    className={
                      mod.exposure === "WINDWARD"
                        ? "fill-blue-950/80 stroke stroke-blue-700"
                        : "fill-slate-900"
                    }
                  />
                  <text
                    x={mod.x + mod.width - 40}
                    y={mod.y + 17}
                    textAnchor="middle"
                    className={`text-[8px] font-bold font-mono ${
                      mod.exposure === "WINDWARD" ? "fill-blue-300" : "fill-slate-400"
                    }`}
                  >
                    {mod.exposure}
                  </text>

                  {/* Contained Equipment Nodes Inside the Module */}
                  {mod.assetsContained.map((asset, aIdx) => {
                    const isAssetSelected = asset.id === selectedAssetId;
                    const aX = mod.x + 14;
                    const aY = mod.y + 60 + aIdx * 34;

                    return (
                      <g
                        key={asset.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModuleId(mod.id);
                          onSelectAsset(asset.id);
                        }}
                        className="cursor-pointer"
                      >
                        <rect
                          x={aX}
                          y={aY}
                          width={mod.width - 28}
                          height="26"
                          rx="4"
                          className={
                            isAssetSelected
                              ? "fill-sky-950 stroke-sky-400 stroke-1.5"
                              : asset.id === "G-02"
                              ? "fill-amber-950/40 stroke-amber-500/70 stroke-1"
                              : "fill-slate-900/80 stroke-slate-800 hover:stroke-slate-700 stroke-1"
                          }
                        />
                        <circle
                          cx={aX + 12}
                          cy={aY + 13}
                          r="4"
                          className={
                            asset.id === "G-02" || asset.status === "DEGRADED"
                              ? "fill-amber-400 animate-pulse"
                              : asset.status === "OFFLINE"
                              ? "fill-slate-600"
                              : "fill-emerald-400"
                          }
                        />
                        <text
                          x={aX + 24}
                          y={aY + 16}
                          className="fill-slate-100 text-[10px] font-bold font-mono"
                        >
                          {asset.code}
                        </text>
                        <text
                          x={aX + mod.width - 38}
                          y={aY + 16}
                          textAnchor="end"
                          className="fill-slate-400 text-[9px] font-mono"
                        >
                          {asset.type.length > 14 ? `${asset.type.substring(0, 13)}.` : asset.type}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Module Detail Panel */}
        <aside
          className="w-full lg:w-[320px] shrink-0 bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto text-xs"
          aria-label="Compartment Physical Isolation Details"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
              Selected Physical Compartment
            </span>
            <div className="text-sm font-bold text-slate-100">{activeModule.name}</div>
            <div className="text-[11px] text-slate-400">{activeModule.code} • Zone: {activeModule.zone}</div>
          </div>

          {/* Module Specifications */}
          <div className="space-y-2 p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">THERMAL ENVELOPE:</span>
              <span className="font-bold text-slate-200">{activeModule.thermalZone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ENVIRONMENTAL FACING:</span>
              <span className="font-bold text-blue-300">{activeModule.exposure}</span>
            </div>
            <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">CONTAINMENT RATING:</span>
              <span className="font-bold text-slate-200 text-right text-[10px]">
                {activeModule.containmentRating}
              </span>
            </div>
          </div>

          {/* Contained Equipment List */}
          <div className="space-y-2">
            <span className="font-bold text-slate-300 text-[11px] uppercase">
              Installed Equipment ({activeModule.assetsContained.length})
            </span>

            <div className="space-y-1.5">
              {activeModule.assetsContained.map((asset) => {
                const isSelected = asset.id === selectedAssetId;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => onSelectAsset(asset.id)}
                    className={`w-full p-2.5 rounded border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-sky-950 border-sky-400 text-sky-200"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{asset.code}</div>
                      <div className="text-[10px] text-slate-400">{asset.type}</div>
                    </div>
                    <StatusBadge
                      status={asset.status || (asset.id === "G-02" ? "DEGRADED" : "NOMINAL")}
                      size="sm"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Containment & Hazard Context */}
          <div className="p-3 rounded bg-slate-900/40 border border-slate-800 text-[11px] space-y-1 text-slate-300">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Info size={13} className="text-sky-400" />
              <span>Spatial Containment Protocol</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              If an anomaly escalates to fire or coolant breach in {activeModule.code}, automatic damper seal takes 8.2 seconds. Habitat wing remains isolated under positive air pressure.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
