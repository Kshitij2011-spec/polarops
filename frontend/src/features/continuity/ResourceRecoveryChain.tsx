import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench,
  AlertTriangle,
  Package,
  Ship,
  Search,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  Boxes,
  RotateCw,
} from "lucide-react";
import { fetchAssetRecovery, fetchSparesInventory } from "@/lib/api/continuity";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { StatusBadge } from "@/components/foundation/StatusBadge";

interface ResourceRecoveryChainProps {
  stationId: string;
  initialAssetId?: string;
}

export function ResourceRecoveryChain({
  stationId,
  initialAssetId = "G-02",
}: ResourceRecoveryChainProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId);
  const [showFullInventory, setShowFullInventory] = useState<boolean>(false);
  const [inventorySearch, setInventorySearch] = useState<string>("");

  // 1. Authoritative Asset Recovery Exposure
  const {
    data: exposure,
    isLoading: isLoadingExposure,
    refetch: refetchExposure,
  } = useQuery({
    queryKey: ["recovery-exposure", selectedAssetId],
    queryFn: () => fetchAssetRecovery(selectedAssetId),
  });

  // 2. Warehouse Inventory Spares
  const {
    data: inventory = [],
    isLoading: isLoadingInventory,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ["inventory-spares", stationId],
    queryFn: () => fetchSparesInventory(stationId),
  });

  // Identify all recovery blockers across warehouse
  const criticalShortages = inventory.filter(
    (item) => item.status === "CRITICAL_SHORTAGE" || item.quantity_available === 0
  );

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.part_number.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.spare_part_id.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Hero: Recovery Blocker & Causal Chain */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Wrench size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                  Equipment Recovery & Spare Exposure Chain
                </h3>
                <TruthBadge type="DERIVED" source="resource_service:recovery_chain" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Traces equipment failure to maintenance work orders, required warehouse spares, and inbound resupply gates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-mono text-slate-400">Inspecting Asset:</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="G-02">G-02 (Primary Diesel Generator #2)</option>
              <option value="G-01">G-01 (Primary Diesel Generator #1)</option>
              <option value="HVAC-02">HVAC-02 (Thermal Loop Heat Exchanger)</option>
              <option value="RO-01">RO-01 (Reverse Osmosis Water Unit)</option>
              <option value="B-01">B-01 (Auxiliary Fuel Boiler)</option>
            </select>
          </div>
        </div>

        {/* Causal Chain Visualization */}
        {isLoadingExposure ? (
          <div className="p-10 text-center font-mono text-xs text-slate-400">
            Querying recovery dependency chain for {selectedAssetId}...
          </div>
        ) : exposure ? (
          <div className="mt-5 space-y-5">
            {/* Visual Step Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Step 1: Asset */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  1. Degraded Asset
                </span>
                <span className="font-mono text-xs font-bold text-slate-100 block">
                  {exposure.asset_name}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 block">
                  ID: {exposure.asset_id} • {exposure.criticality}
                </span>
              </div>

              {/* Step 2: Work Order */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  2. Active Work Order
                </span>
                <span className="font-mono text-xs font-bold text-slate-200 block truncate">
                  {exposure.work_order_title || "Pending WO Generation"}
                </span>
                <span className="text-[10px] font-mono text-amber-400 block">
                  Status: {exposure.work_order_status || "UNASSIGNED"}
                </span>
              </div>

              {/* Step 3: Required Spare */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  3. Required Part
                </span>
                <span className="font-mono text-xs font-bold text-slate-100 block truncate">
                  {exposure.required_spare_part_name || "None Specified"}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block">
                  P/N: {exposure.required_spare_part_number || "N/A"}
                </span>
              </div>

              {/* Step 4: Warehouse Availability */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  4. Warehouse Stock
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-sm font-extrabold ${
                      exposure.quantity_available >= exposure.quantity_required
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {exposure.quantity_available} / {exposure.quantity_required} Available
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  Reserved: {exposure.quantity_reserved}
                </span>
              </div>

              {/* Step 5: Resupply Delivery */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  5. Inbound Resupply
                </span>
                <span className="font-mono text-xs font-bold text-slate-200 block truncate">
                  {exposure.resupply_vessel_name || "No Scheduled Vessel"}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 block">
                  ETA: {exposure.resupply_eta_days ? `${exposure.resupply_eta_days} Days` : "Unscheduled"}
                </span>
              </div>
            </div>

            {/* Operational Meaning Callout */}
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                exposure.exposure_level === "CRITICAL" || exposure.exposure_level === "HIGH"
                  ? "bg-red-950/30 border-red-500/40 text-red-300"
                  : "bg-slate-950/80 border-slate-800 text-slate-300"
              }`}
            >
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Operational Consequence & Exposure Assessment: {exposure.exposure_level} EXPOSURE
                  </span>
                  <StatusBadge status={exposure.exposure_level} />
                </div>
                <p className="text-xs font-sans leading-relaxed">
                  {exposure.reasoning}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Station-Wide Critical Shortages & Recovery Blockers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Active Station Recovery Blockers ({criticalShortages.length} Critical Shortages)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Warehouse Safety Stock Depletion</span>
        </div>

        {criticalShortages.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded">
            ✓ No critical spare shortages currently blocking station recovery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalShortages.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-slate-950/80 border border-red-900/50 hover:border-red-600 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-100 block">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      P/N: {item.part_number} • Bin: {item.location}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 uppercase">
                    SHORTAGE
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Stock: <strong className="text-red-400">{item.quantity_available}</strong> / Reorder: {item.reorder_threshold}</span>
                  <span className="text-amber-400">{item.criticality}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Secondary Deep-Dive: Complete Inventory Spares Catalog */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-cyan-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Warehouse Spares Catalog (Secondary Deep Inspection)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Search spare parts..."
                className="bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFullInventory(!showFullInventory)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
            >
              {showFullInventory ? "Collapse Catalog" : "Inspect All Spares"}
            </button>
          </div>
        </div>

        {showFullInventory && (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="p-2.5">Part Number</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Criticality</th>
                  <th className="p-2.5">Available</th>
                  <th className="p-2.5">Reserved</th>
                  <th className="p-2.5">Bin Location</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-950/40">
                    <td className="p-2.5 font-bold text-slate-200">{item.part_number}</td>
                    <td className="p-2.5 text-slate-300">{item.name}</td>
                    <td className="p-2.5">
                      <span className="text-[10px] text-cyan-400">{item.criticality}</span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-100">{item.quantity_available}</td>
                    <td className="p-2.5 text-slate-400">{item.quantity_reserved}</td>
                    <td className="p-2.5 text-slate-400">{item.location}</td>
                    <td className="p-2.5">
                      <StatusBadge
                        status={
                          item.status === "CRITICAL_SHORTAGE"
                            ? "CRITICAL"
                            : item.status === "RESERVED"
                            ? "WARNING"
                            : "NOMINAL"
                        }
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
