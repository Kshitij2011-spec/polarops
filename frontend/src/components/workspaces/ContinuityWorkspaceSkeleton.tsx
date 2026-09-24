import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  Fuel,
  Wrench,
  Ship,
  Wifi,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ThermometerSnowflake,
} from "lucide-react";
import { useStation } from "@/context/StationContext";
import { fetchFuelStatus, fetchInventory, fetchResupply, fetchEnergyModel } from "@/lib/api/resources";
import { fetchResilienceStatus, fetchSyncQueue } from "@/lib/api/resilience";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { TruthBadge } from "@/components/foundation/TruthBadge";

export interface ContinuityWorkspaceSkeletonProps {
  initialTab?: "fuel" | "spares" | "resupply" | "resilience";
  highlightAsset?: string;
}

export function ContinuityWorkspaceSkeleton({
  initialTab = "fuel",
  highlightAsset,
}: ContinuityWorkspaceSkeletonProps) {
  const { activeStationId, openResilienceDrawer } = useStation();
  const [activeTab, setActiveTab] = useState<"fuel" | "spares" | "resupply" | "resilience">(initialTab);

  // Queries
  const { data: fuelStatus } = useQuery({
    queryKey: ["fuel-status", activeStationId],
    queryFn: () => fetchFuelStatus(activeStationId),
  });

  const { data: energyModel } = useQuery({
    queryKey: ["energy-model", activeStationId],
    queryFn: () => fetchEnergyModel(activeStationId),
  });

  const { data: inventory } = useQuery({
    queryKey: ["inventory", activeStationId],
    queryFn: () => fetchInventory(activeStationId),
  });

  const { data: resupply } = useQuery({
    queryKey: ["resupply", activeStationId],
    queryFn: () => fetchResupply(activeStationId),
  });

  const { data: linkStatus } = useQuery({
    queryKey: ["resilience-status", activeStationId],
    queryFn: () => fetchResilienceStatus(activeStationId),
  });

  const { data: syncQueue } = useQuery({
    queryKey: ["resilience-queue", activeStationId],
    queryFn: () => fetchSyncQueue(activeStationId),
  });

  const tabs = [
    { id: "fuel", label: "Fuel Runway & Energy Balance", icon: Fuel },
    { id: "spares", label: "Warehouse Critical Spares", icon: Wrench },
    { id: "resupply", label: "Maritime Resupply Tracker", icon: Ship },
    { id: "resilience", label: "Satellite Comms & Sync Queue", icon: Wifi },
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070B12] text-slate-100">
      {/* Workspace 3 Sub-Header & Tabs */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Boxes size={16} className="text-sky-400 shrink-0" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            Workspace 3: Continuity + Logistics
          </span>
        </div>

        {/* 4 Tabs Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 font-mono text-xs overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-sky-950 text-sky-200 font-bold border border-sky-800/80 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {/* TAB 1: FUEL AUTONOMY & ENERGY BALANCE */}
          {activeTab === "fuel" && (
            <div className="space-y-6">
              {/* Massive Circular / Gauge Runway Header Card */}
              <div className="p-6 rounded-md border border-slate-800 bg-slate-950/60 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <StatusBadge status={fuelStatus?.projected_runway_days && fuelStatus.projected_runway_days > 120 ? "NOMINAL" : "WARNING"} />
                    <TruthBadge type="MEASURED" />
                  </div>
                  <h3 className="text-xl font-bold font-headline text-slate-100">
                    Station Fuel Autonomy Runway
                  </h3>
                  <p className="text-xs text-slate-400 font-sans max-w-md">
                    Arctic diesel reserves calibrated against winter survival policy target (180 days minimum).
                  </p>
                </div>

                {/* Primary Number Display */}
                <div className="flex items-baseline gap-2 bg-slate-900/80 border border-slate-800 p-4 rounded-md">
                  <span className="text-5xl font-mono font-bold text-emerald-400">
                    {fuelStatus?.projected_runway_days ?? 184}
                  </span>
                  <div className="text-xs font-mono text-slate-400">
                    <span className="font-bold text-slate-200">DAYS REMAINING</span>
                    <div>Target: 180 Days</div>
                  </div>
                </div>
              </div>

              {/* Coupled Thermodynamic Model Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded border border-slate-800 bg-slate-950/40 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Current Stock</div>
                  <div className="text-xl font-bold text-slate-100">
                    {(fuelStatus?.current_stock_liters ?? 142500).toLocaleString()} L
                  </div>
                  <div className="text-[10px] text-slate-500">Max Capacity: 250,000 L</div>
                </div>

                <div className="p-4 rounded border border-slate-800 bg-slate-950/40 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Burn Rate</div>
                  <div className="text-xl font-bold text-amber-400">
                    {fuelStatus?.burn_rate_liters_per_hour ?? 32.5} L/hr
                  </div>
                  <div className="text-[10px] text-slate-500">Driven by outside temp (-28°C)</div>
                </div>

                <div className="p-4 rounded border border-slate-800 bg-slate-950/40 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Thermal Demand</div>
                  <div className="text-xl font-bold text-sky-400">
                    {energyModel?.thermal_demand_kw ?? 145} kW
                  </div>
                  <div className="text-[10px] text-slate-500">Hydronic glycol loop active</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WAREHOUSE CRITICAL SPARES */}
          {activeTab === "spares" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Wrench size={15} className="text-amber-400" />
                  <span>Warehouse Critical Spares Inventory</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {inventory?.length ?? 8} critical spare lines tracked
                </span>
              </div>

              {/* Table of Spare Parts */}
              <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950/40">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Part Code</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Available</th>
                      <th className="p-3">Reserved</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(inventory || [
                      {
                        id: "SP-01",
                        part_number: "SK-402",
                        name: "Main Alternator Bearing Assembly",
                        quantity_available: 0,
                        quantity_reserved: 1,
                        location: "Warehouse Bay 3, Shelf A",
                        status: "CRITICAL_SHORTAGE",
                      },
                      {
                        id: "SP-02",
                        part_number: "FLT-108",
                        name: "Arctic Fuel Line Filter 10-micron",
                        quantity_available: 8,
                        quantity_reserved: 2,
                        location: "Warehouse Bay 1, Bin 12",
                        status: "AVAILABLE",
                      },
                    ]).map((item) => {
                      const isHighlighted =
                        highlightAsset === "G-02" && item.part_number === "SK-402";

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-900/50 transition-colors ${
                            isHighlighted ? "bg-amber-950/30 border-l-2 border-amber-400" : ""
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-200 flex items-center gap-2">
                            <span>{item.part_number}</span>
                            {isHighlighted && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                                G-02 BLOCKER
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 font-sans">{item.name}</td>
                          <td className="p-3 font-bold text-slate-100">{item.quantity_available}</td>
                          <td className="p-3 text-slate-400">{item.quantity_reserved}</td>
                          <td className="p-3 text-slate-400">{item.location}</td>
                          <td className="p-3">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MARITIME RESUPPLY TRACKER */}
          {activeTab === "resupply" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Ship size={15} className="text-sky-400" />
                  <span>Polar Expedition Maritime Resupply Tracker</span>
                </h3>
                <TruthBadge type="ESTIMATED" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(resupply || [
                  {
                    id: "RES-01",
                    vessel_name: "MV Vasiliy Golovnin",
                    expected_date: "2026-11-15",
                    eta_days: 52,
                    spare_part_name: "Alternator Bearings & Fuel Pump Spares",
                    quantity: 4,
                    status: "EN_ROUTE_SOUTHERN_OCEAN",
                  },
                ]).map((ship) => (
                  <div key={ship.id} className="p-5 rounded-md border border-slate-800 bg-slate-950/60 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <Ship size={16} className="text-sky-400" />
                        <span>{ship.vessel_name}</span>
                      </span>
                      <StatusBadge status={ship.status} size="sm" />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800 text-slate-300">
                      <div>Manifest: {ship.spare_part_name}</div>
                      <div>Expected Arrival: {ship.expected_date} ({ship.eta_days} Days ETA)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SATELLITE COMMS & SYNC QUEUE */}
          {activeTab === "resilience" && (
            <div className="p-6 rounded-md border border-slate-800 bg-slate-950/60 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-emerald-400" />
                  <span className="font-bold text-slate-100 uppercase">
                    Edge Resilience Cockpit
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openResilienceDrawer}
                  className="px-3 py-1.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-200 font-bold uppercase cursor-pointer"
                >
                  Open Resilience Drawer
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Link Status</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">{linkStatus?.status || "ONLINE"}</div>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Latency</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">{linkStatus?.latency_ms || 142} ms</div>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Pending Packets</div>
                  <div className="text-sm font-bold text-sky-400 mt-1">{syncQueue?.pending_count || 0}</div>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Security</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">SHA-256 Verified</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
