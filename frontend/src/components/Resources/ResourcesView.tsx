import { useState } from "react";
import {
  ArrowLeft,
  Flame,
  Gauge,
  Loader2,
  Package,
  Ship,
  ShieldAlert,
  Thermometer,
  Zap,
} from "lucide-react";
import { useFuelStatus } from "../../hooks/useFuelStatus";
import { useInventory } from "../../hooks/useInventory";
import { useResupply } from "../../hooks/useResupply";
import { useEnergyModel } from "../../hooks/useEnergyModel";
import { useRecoveryExposure } from "../../hooks/useRecoveryExposure";
import { TruthBadge } from "../TruthBadge";

export interface ResourcesViewProps {
  stationId: string;
  onBack: () => void;
  onInspectAsset?: (assetId: string) => void;
}

export function ResourcesView({ stationId, onBack, onInspectAsset }: ResourcesViewProps) {
  const [activeTab, setActiveTab] = useState<"energy-fuel" | "inventory" | "resupply" | "recovery">("energy-fuel");

  const { data: fuel, isLoading: fuelLoading } = useFuelStatus(stationId);
  const { data: inventory, isLoading: invLoading } = useInventory(stationId);
  const { data: resupply, isLoading: resLoading } = useResupply(stationId);
  const { data: energy, isLoading: energyLoading } = useEnergyModel(stationId);
  const { data: recovery, isLoading: recLoading } = useRecoveryExposure("G-02");

  const isLoading = fuelLoading || invLoading || resLoading || energyLoading || recLoading;

  return (
    <div className="space-y-6 animate-fade-in pb-12 transition-colors">
      {/* ── Top Navigation & Route Bar ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          aria-label="Return to Station Command Center"
          className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] px-3 py-1.5 text-xs font-mono font-medium text-slate-700 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:border-slate-300 dark:hover:border-[#3d4556] transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Station Command Center</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 dark:text-[#7a8194]">ROUTE:</span>
          <span className="rounded-md bg-white dark:bg-[#181b24] px-2 py-0.5 text-blue-600 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#2a2f3e] shadow-2xs">
            /resources
          </span>
          <TruthBadge type="DERIVED" />
        </div>
      </div>

      {/* ── Header Title & Tab Controls ─────────────────── */}
      <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-50 dark:bg-[#12141c] px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-[#5b9cf5] border border-blue-200 dark:border-[#2a2f3e] tracking-wider">
                CROSS-DOMAIN LOGISTICS
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">{stationId}</span>
            </div>
            <h1 className="text-xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0] mt-1">
              Resource &amp; Energy Intelligence
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#7a8194] font-sans">
              Station fuel runway projections, warehouse critical spares inventory, inbound vessel tracking, and recovery exposure.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 rounded-md bg-slate-100 dark:bg-[#12141c] border border-slate-200 dark:border-[#2a2f3e]">
            <button
              onClick={() => setActiveTab("energy-fuel")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "energy-fuel"
                  ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
                  : "bg-transparent border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Energy &amp; Fuel</span>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
                  : "bg-transparent border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Inventory &amp; Spares</span>
            </button>
            <button
              onClick={() => setActiveTab("resupply")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "resupply"
                  ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
                  : "bg-transparent border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
              }`}
            >
              <Ship className="h-3.5 w-3.5" />
              <span>Resupply Logistics</span>
            </button>
            <button
              onClick={() => setActiveTab("recovery")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "recovery"
                  ? "bg-white dark:bg-[#1e2230] border-slate-200 dark:border-[#3d4556] text-blue-700 dark:text-[#5b9cf5] shadow-2xs font-bold"
                  : "bg-transparent border-transparent text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0]"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>G-02 Recovery Chain</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12 rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] shadow-2xs">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-[#5b9cf5]" />
        </div>
      )}

      {/* ── TAB 1: ENERGY & FUEL ────────────────────────── */}
      {activeTab === "energy-fuel" && (
        <div className="space-y-6">
          {/* Fuel Runway Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#7a8194] mb-1">
                <span className="text-[10px] uppercase tracking-wider">REMAINING FUEL STOCK</span>
                <TruthBadge type="MEASURED" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                {fuel?.current_stock_liters.toLocaleString()} L
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194] mt-1">
                Capacity: {fuel?.max_capacity_liters.toLocaleString()} L (57.0% Full)
              </div>
            </div>

            <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#7a8194] mb-1">
                <span className="text-[10px] uppercase tracking-wider">ESTIMATED RUNWAY</span>
                <TruthBadge type="DERIVED" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                ≈ {fuel?.projected_runway_days} Days
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194] mt-1">
                Winter Target: {fuel?.winter_target_days} Days (Gap: {fuel?.resupply_gap_days}d)
              </div>
            </div>

            <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#7a8194] mb-1">
                <span className="text-[10px] uppercase tracking-wider">HOURLY BURN RATE</span>
                <TruthBadge type="DERIVED" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                {fuel?.burn_rate_liters_per_hour} L/h
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194] mt-1">
                2,028 L / day continuous burn
              </div>
            </div>

            <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-[#7a8194] mb-1">
                <span className="text-[10px] uppercase tracking-wider">ONLINE GENERATION</span>
                <TruthBadge type="DERIVED" />
              </div>
              <div className="text-xl font-bold font-mono text-blue-600 dark:text-[#5b9cf5]">
                {energy?.available_generation_capacity_kw} kW
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194] mt-1">
                {energy?.online_generators_count} of 2 Gensets Active
              </div>
            </div>
          </div>

          {/* Energy Model Details */}
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                  Deterministic Energy &amp; Thermal Balance Model
                </h2>
              </div>
              <TruthBadge type="DERIVED" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-2 shadow-2xs">
                <div className="text-[11px] font-mono text-slate-600 dark:text-[#9ca3b4] flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-sky-600 dark:text-cyan-400" />
                  <span>Outside Climate &amp; Thermal Demand</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                  {energy?.outside_temp_celsius}°C
                </div>
                <p className="text-xs text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-sans">
                  Modeled thermal demand: <strong className="text-slate-800 dark:text-[#e4e8f0] font-mono">{energy?.thermal_demand_kw} kW</strong> to sustain +20°C indoor habitat target.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-2 shadow-2xs">
                <div className="text-[11px] font-mono text-slate-600 dark:text-[#9ca3b4] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Electrical Demand &amp; Auxiliary Tracing</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                  {energy?.projected_electrical_load_kw} kW
                </div>
                <p className="text-xs text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-sans">
                  Baseline 180.0 kW + cold-climate auxiliary heat tracing load dispatch.
                </p>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-4 space-y-2 shadow-2xs">
                <div className="text-[11px] font-mono text-slate-600 dark:text-[#9ca3b4] flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Fleet Generation Reserve</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {((energy?.available_generation_capacity_kw ?? 600) - (energy?.projected_electrical_load_kw ?? 200)).toFixed(0)} kW
                </div>
                <p className="text-xs text-slate-600 dark:text-[#9ca3b4] leading-relaxed font-sans">
                  Reserve margin available across online generator sets.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3 text-xs font-mono text-slate-500 dark:text-[#7a8194] space-y-1">
              <div className="text-slate-700 dark:text-[#e4e8f0] font-semibold text-[11px]">Model Assumptions:</div>
              {energy?.assumptions.map((assump, idx) => (
                <div key={idx}>• {assump}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INVENTORY & SPARES ───────────────────── */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
                <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                  Station Warehouse Critical Spares Inventory
                </h2>
              </div>
              <TruthBadge type="SYNTHETIC" />
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-[#2a2f3e] rounded-md shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#2a2f3e] text-slate-600 dark:text-[#9ca3b4] bg-slate-100 dark:bg-[#12141c]">
                    <th className="p-3 font-semibold text-[10px] tracking-wider">PART NUMBER</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">ITEM DESCRIPTION</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">CRITICALITY</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">STOCK AVAILABLE</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">RESERVED</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">STATUS</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">RACK LOCATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2a2f3e]/60 bg-white dark:bg-[#181b24]">
                  {inventory?.map((item) => (
                    <tr
                      key={item.id}
                      className={item.part_number === "SK-402" ? "bg-rose-50/70 dark:bg-rose-950/25 border-l-2 border-l-rose-500" : "hover:bg-slate-50 dark:hover:bg-[#141721] transition-colors"}
                    >
                      <td className="p-3 font-bold text-slate-900 dark:text-[#e4e8f0] flex items-center gap-1.5">
                        <span>{item.part_number}</span>
                        {item.part_number === "SK-402" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            HERO SPARE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-[#9ca3b4]">
                        <div className="font-semibold text-slate-900 dark:text-[#e4e8f0]">{item.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-[#7a8194]">{item.description}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#12141c] text-slate-700 dark:text-[#9ca3b4] border border-slate-200 dark:border-[#2a2f3e] text-[10px]">
                          {item.criticality}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            item.quantity_available === 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {item.quantity_available} Units
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-[#7a8194]">{item.quantity_reserved}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.status === "CRITICAL_SHORTAGE"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-[#7a8194]">{item.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: RESUPPLY LOGISTICS ───────────────────── */}
      {activeTab === "resupply" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-sky-600 dark:text-cyan-400" />
                <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                  Scheduled Inbound Resupply Logistics &amp; Vessels
                </h2>
              </div>
              <TruthBadge type="SYNTHETIC" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resupply?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-sky-200 dark:border-cyan-900/60 bg-sky-50/30 dark:bg-[#12141c] p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-sky-700 dark:text-cyan-400 uppercase tracking-wider">
                        MARITIME EXPEDITION VOYAGE
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 dark:text-[#e4e8f0] mt-0.5">
                        {item.vessel_name}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 dark:bg-cyan-950 text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-cyan-800">
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-sky-100 dark:border-[#2a2f3e]">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#7a8194] uppercase">ESTIMATED ETA:</span>
                      <div className="text-base font-bold text-amber-600 dark:text-amber-300">
                        ≈ {item.eta_days} Days
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#7a8194] uppercase">LOGISTICS WINDOW:</span>
                      <div className="text-slate-800 dark:text-[#e4e8f0]">Late Winter Voyage</div>
                    </div>
                  </div>

                  <div className="rounded-md bg-white dark:bg-[#181b24] border border-sky-100 dark:border-[#2a2f3e] p-3 text-xs font-mono space-y-1 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-[#7a8194] uppercase">MANIFEST PAYLOAD CARRIED:</span>
                    <div className="text-slate-900 dark:text-[#e4e8f0] font-semibold">
                      {item.quantity}x {item.spare_part_number} — {item.spare_part_name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-[#7a8194]">
                      Required for Work Order MWO-2026-089 (Genset G-02 recovery)
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#12141c] p-3 text-xs font-mono text-slate-500 dark:text-[#7a8194]">
              <strong className="text-slate-700 dark:text-[#e4e8f0]">Data Honesty Note:</strong> Resupply vessel manifests and voyage schedules are synthetic demonstration data modeling Antarctic expedition supply windows. Not an active commercial or NCPOR voyage feed.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: G-02 RECOVERY CHAIN ──────────────────── */}
      {activeTab === "recovery" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                  Generator G-02 End-to-End Recovery Chain
                </h2>
              </div>
              <TruthBadge type="DERIVED" />
            </div>

            {/* Visual Step-by-Step Chain */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div
                onClick={() => onInspectAsset?.(recovery?.asset_id ?? "G-02")}
                className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3 space-y-1 cursor-pointer hover:border-blue-400 transition-colors shadow-2xs"
                title="Inspect in Asset Intelligence"
              >
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider">STEP 1: ASSET</div>
                <div className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0] underline decoration-dotted">{recovery?.asset_name}</div>
                <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400">TIER: {recovery?.criticality}</div>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3 space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider">STEP 2: WORK ORDER</div>
                <div className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">{recovery?.active_work_order_id}</div>
                <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400">{recovery?.work_order_status}</div>
              </div>

              <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c] p-3 space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194] uppercase tracking-wider">STEP 3: REQUIRED SPARE</div>
                <div className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">{recovery?.required_spare_part_number}</div>
                <div className="text-[11px] text-slate-500 dark:text-[#7a8194] truncate">{recovery?.required_spare_part_name}</div>
              </div>

              <div className="rounded-md border border-rose-200 dark:border-rose-900/80 bg-rose-50/50 dark:bg-rose-950/20 p-3 space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-rose-700 dark:text-rose-400 uppercase tracking-wider">STEP 4: WAREHOUSE STOCK</div>
                <div className="text-xs font-bold font-mono text-rose-700 dark:text-rose-300">
                  {recovery?.quantity_available} Units Available
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">CRITICAL SHORTAGE</div>
              </div>

              <div className="rounded-md border border-sky-200 dark:border-cyan-900/80 bg-sky-50/50 dark:bg-cyan-950/20 p-3 space-y-1 shadow-2xs">
                <div className="text-[10px] font-mono text-sky-700 dark:text-cyan-400 uppercase tracking-wider">STEP 5: INBOUND VESSEL</div>
                <div className="text-xs font-bold font-mono text-sky-800 dark:text-cyan-200">{recovery?.resupply_vessel_name}</div>
                <div className="text-[11px] text-amber-600 dark:text-amber-300 font-mono">ETA ≈ {recovery?.resupply_eta_days} Days</div>
              </div>
            </div>

            {/* Recovery Exposure Banner */}
            <div className="rounded-md border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-400">
                  OPERATIONAL RECOVERY EXPOSURE: {recovery?.exposure_level}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  EVALUATED PROTOTYPE MODEL
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-[#9ca3b4] leading-relaxed font-sans">
                {recovery?.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
