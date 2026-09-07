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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Top Navigation & Route Bar ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          aria-label="Return to Station Command Center"
          className="flex items-center gap-2 rounded border border-polar-800 bg-polar-900 px-3 py-1.5 text-xs font-mono text-polar-300 hover:text-polar-100 hover:border-polar-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Station Command Center</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-polar-400">ROUTE:</span>
          <span className="rounded bg-polar-950 px-2 py-0.5 text-accent-cyan border border-polar-800">
            /resources
          </span>
          <TruthBadge type="DERIVED" />
        </div>
      </div>

      {/* ── Header Title & Tab Controls ─────────────────── */}
      <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-polar-950 px-2 py-0.5 text-[10px] font-mono font-bold text-accent-cyan border border-polar-800 tracking-wider">
                CROSS-DOMAIN LOGISTICS
              </span>
              <span className="text-xs font-mono text-polar-400">{stationId}</span>
            </div>
            <h1 className="text-xl font-bold font-mono text-polar-100 mt-1">
              Resource &amp; Energy Intelligence
            </h1>
            <p className="text-xs text-polar-400">
              Station fuel runway projections, warehouse critical spares inventory, inbound vessel tracking, and recovery exposure.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 rounded bg-polar-950 border border-polar-800">
            <button
              onClick={() => setActiveTab("energy-fuel")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "energy-fuel"
                  ? "bg-polar-800 border-accent-cyan text-accent-cyan"
                  : "bg-transparent border-transparent text-polar-400 hover:text-polar-200"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Energy &amp; Fuel</span>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-polar-800 border-accent-cyan text-accent-cyan"
                  : "bg-transparent border-transparent text-polar-400 hover:text-polar-200"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Inventory &amp; Spares</span>
            </button>
            <button
              onClick={() => setActiveTab("resupply")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "resupply"
                  ? "bg-polar-800 border-accent-cyan text-accent-cyan"
                  : "bg-transparent border-transparent text-polar-400 hover:text-polar-200"
              }`}
            >
              <Ship className="h-3.5 w-3.5" />
              <span>Resupply Logistics</span>
            </button>
            <button
              onClick={() => setActiveTab("recovery")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                activeTab === "recovery"
                  ? "bg-polar-800 border-accent-cyan text-accent-cyan"
                  : "bg-transparent border-transparent text-polar-400 hover:text-polar-200"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>G-02 Recovery Chain</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12 rounded border border-polar-800 bg-polar-900">
          <Loader2 className="h-6 w-6 animate-spin text-accent-cyan" />
        </div>
      )}

      {/* ── TAB 1: ENERGY & FUEL ────────────────────────── */}
      {activeTab === "energy-fuel" && (
        <div className="space-y-6">
          {/* Fuel Runway Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded border border-polar-800 bg-polar-950/70 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-polar-400 mb-1">
                <span className="text-[10px] uppercase tracking-wider">REMAINING FUEL STOCK</span>
                <TruthBadge type="MEASURED" />
              </div>
              <div className="text-xl font-bold font-mono text-polar-100">
                {fuel?.current_stock_liters.toLocaleString()} L
              </div>
              <div className="text-[11px] font-mono text-polar-500 mt-1">
                Capacity: {fuel?.max_capacity_liters.toLocaleString()} L (57.0% Full)
              </div>
            </div>

            <div className="rounded border border-polar-800 bg-polar-950/70 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-polar-400 mb-1">
                <span className="text-[10px] uppercase tracking-wider">ESTIMATED RUNWAY</span>
                <TruthBadge type="DERIVED" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-400">
                ≈ {fuel?.projected_runway_days} Days
              </div>
              <div className="text-[11px] font-mono text-polar-500 mt-1">
                Winter Target: {fuel?.winter_target_days} Days (Gap: {fuel?.resupply_gap_days}d)
              </div>
            </div>

            <div className="rounded border border-polar-800 bg-polar-950/70 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-polar-400 mb-1">
                <span className="text-[10px] uppercase tracking-wider">HOURLY BURN RATE</span>
                <TruthBadge type="DERIVED" />
              </div>
              <div className="text-xl font-bold font-mono text-polar-100">
                {fuel?.burn_rate_liters_per_hour} L/h
              </div>
              <div className="text-[11px] font-mono text-polar-500 mt-1">
                2,028 L / day continuous burn
              </div>
            </div>

            <div className="rounded border border-polar-800 bg-polar-950/70 p-4">
              <div className="flex items-center justify-between text-xs font-mono text-polar-400 mb-1">
                <span className="text-[10px] uppercase tracking-wider">ONLINE GENERATION</span>
                <TruthBadge type="DERIVED" />
              </div>
              <div className="text-xl font-bold font-mono text-accent-cyan">
                {energy?.available_generation_capacity_kw} kW
              </div>
              <div className="text-[11px] font-mono text-polar-500 mt-1">
                {energy?.online_generators_count} of 2 Gensets Active
              </div>
            </div>
          </div>

          {/* Energy Model Details */}
          <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-polar-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider">
                  Deterministic Energy &amp; Thermal Balance Model
                </h2>
              </div>
              <TruthBadge type="DERIVED" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="rounded border border-polar-800 bg-polar-950/70 p-4 space-y-2">
                <div className="text-[11px] font-mono text-polar-400 flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Outside Climate &amp; Thermal Demand</span>
                </div>
                <div className="text-lg font-bold font-mono text-polar-100">
                  {energy?.outside_temp_celsius}°C
                </div>
                <p className="text-xs text-polar-400 leading-relaxed">
                  Modeled thermal demand: <strong className="text-polar-200">{energy?.thermal_demand_kw} kW</strong> to sustain +20°C indoor habitat target.
                </p>
              </div>

              <div className="rounded border border-polar-800 bg-polar-950/70 p-4 space-y-2">
                <div className="text-[11px] font-mono text-polar-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Electrical Demand &amp; Auxiliary Tracing</span>
                </div>
                <div className="text-lg font-bold font-mono text-polar-100">
                  {energy?.projected_electrical_load_kw} kW
                </div>
                <p className="text-xs text-polar-400 leading-relaxed">
                  Baseline 180.0 kW + cold-climate auxiliary heat tracing load dispatch.
                </p>
              </div>

              <div className="rounded border border-polar-800 bg-polar-950/70 p-4 space-y-2">
                <div className="text-[11px] font-mono text-polar-400 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Fleet Generation Reserve</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {((energy?.available_generation_capacity_kw ?? 600) - (energy?.projected_electrical_load_kw ?? 200)).toFixed(0)} kW
                </div>
                <p className="text-xs text-polar-400 leading-relaxed">
                  Reserve margin available across online generator sets.
                </p>
              </div>
            </div>

            <div className="rounded border border-polar-800 bg-polar-950/60 p-3 text-xs font-mono text-polar-400 space-y-1">
              <div className="text-polar-300 font-semibold text-[11px]">Model Assumptions:</div>
              {energy?.assumptions.map((assump, idx) => (
                <div key={idx} className="text-polar-400">• {assump}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INVENTORY & SPARES ───────────────────── */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-polar-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-accent-cyan" />
                <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider">
                  Station Warehouse Critical Spares Inventory
                </h2>
              </div>
              <TruthBadge type="SYNTHETIC" />
            </div>

            <div className="overflow-x-auto border border-polar-800 rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-polar-800 text-polar-400 bg-polar-950">
                    <th className="p-3 font-semibold text-[10px] tracking-wider">PART NUMBER</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">ITEM DESCRIPTION</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">CRITICALITY</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">STOCK AVAILABLE</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">RESERVED</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">STATUS</th>
                    <th className="p-3 font-semibold text-[10px] tracking-wider">RACK LOCATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-polar-800/80 bg-polar-900">
                  {inventory?.map((item) => (
                    <tr
                      key={item.id}
                      className={item.part_number === "SK-402" ? "bg-rose-950/25 border-l-2 border-l-rose-500" : "hover:bg-polar-800/40"}
                    >
                      <td className="p-3 font-bold text-polar-100 flex items-center gap-1.5">
                        <span>{item.part_number}</span>
                        {item.part_number === "SK-402" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950 text-rose-300 border border-rose-800">
                            HERO SPARE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-polar-300">
                        <div className="font-semibold text-polar-200">{item.name}</div>
                        <div className="text-[11px] text-polar-500">{item.description}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-polar-950 text-polar-300 border border-polar-800 text-[10px]">
                          {item.criticality}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            item.quantity_available === 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {item.quantity_available} Units
                        </span>
                      </td>
                      <td className="p-3 text-polar-400">{item.quantity_reserved}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.status === "CRITICAL_SHORTAGE"
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : "bg-emerald-950 text-emerald-300 border-emerald-800"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-polar-400">{item.location}</td>
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
          <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-polar-800 pb-3">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-cyan-400" />
                <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider">
                  Scheduled Inbound Resupply Logistics &amp; Vessels
                </h2>
              </div>
              <TruthBadge type="SYNTHETIC" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resupply?.map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-cyan-800/60 bg-polar-950/70 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        MARITIME EXPEDITION VOYAGE
                      </div>
                      <div className="text-base font-bold font-mono text-polar-100 mt-0.5">
                        {item.vessel_name}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-polar-800">
                    <div>
                      <span className="text-[10px] text-polar-400 uppercase">ESTIMATED ETA:</span>
                      <div className="text-base font-bold text-amber-300">
                        ≈ {item.eta_days} Days
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-polar-400 uppercase">LOGISTICS WINDOW:</span>
                      <div className="text-polar-200">Late Winter Voyage</div>
                    </div>
                  </div>

                  <div className="rounded bg-polar-900 border border-polar-800 p-3 text-xs font-mono space-y-1">
                    <span className="text-[10px] text-polar-400 uppercase">MANIFEST PAYLOAD CARRIED:</span>
                    <div className="text-polar-200 font-semibold">
                      {item.quantity}x {item.spare_part_number} — {item.spare_part_name}
                    </div>
                    <div className="text-[11px] text-polar-500">
                      Required for Work Order MWO-2026-089 (Genset G-02 recovery)
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded border border-polar-800 bg-polar-950 p-3 text-xs font-mono text-polar-400">
              <strong className="text-polar-300">Data Honesty Note:</strong> Resupply vessel manifests and voyage schedules are synthetic demonstration data modeling Antarctic expedition supply windows. Not an active commercial or NCPOR voyage feed.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: G-02 RECOVERY CHAIN ──────────────────── */}
      {activeTab === "recovery" && (
        <div className="space-y-4">
          <div className="rounded border border-polar-700 bg-polar-900 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-polar-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <h2 className="text-xs font-mono font-bold text-polar-200 uppercase tracking-wider">
                  Generator G-02 End-to-End Recovery Chain
                </h2>
              </div>
              <TruthBadge type="DERIVED" />
            </div>

            {/* Visual Step-by-Step Chain */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div
                onClick={() => onInspectAsset?.(recovery?.asset_id ?? "G-02")}
                className="rounded border border-polar-800 bg-polar-950/70 p-3 space-y-1 cursor-pointer hover:border-accent-cyan/60 transition-colors"
                title="Inspect in Asset Intelligence"
              >
                <div className="text-[10px] font-mono text-polar-500 uppercase tracking-wider">STEP 1: ASSET</div>
                <div className="text-xs font-bold font-mono text-polar-100 underline decoration-dotted">{recovery?.asset_name}</div>
                <div className="text-[11px] font-mono text-rose-400">TIER: {recovery?.criticality}</div>
              </div>

              <div className="rounded border border-polar-800 bg-polar-950/70 p-3 space-y-1">
                <div className="text-[10px] font-mono text-polar-500 uppercase tracking-wider">STEP 2: WORK ORDER</div>
                <div className="text-xs font-bold font-mono text-polar-100">{recovery?.active_work_order_id}</div>
                <div className="text-[11px] font-mono text-rose-400">{recovery?.work_order_status}</div>
              </div>

              <div className="rounded border border-polar-800 bg-polar-950/70 p-3 space-y-1">
                <div className="text-[10px] font-mono text-polar-500 uppercase tracking-wider">STEP 3: REQUIRED SPARE</div>
                <div className="text-xs font-bold font-mono text-polar-100">{recovery?.required_spare_part_number}</div>
                <div className="text-[11px] text-polar-400 truncate">{recovery?.required_spare_part_name}</div>
              </div>

              <div className="rounded border border-rose-900/80 bg-rose-950/20 p-3 space-y-1">
                <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">STEP 4: WAREHOUSE STOCK</div>
                <div className="text-xs font-bold font-mono text-rose-300">
                  {recovery?.quantity_available} Units Available
                </div>
                <div className="text-[11px] text-rose-400 font-mono">CRITICAL SHORTAGE</div>
              </div>

              <div className="rounded border border-cyan-900/80 bg-cyan-950/20 p-3 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">STEP 5: INBOUND VESSEL</div>
                <div className="text-xs font-bold font-mono text-cyan-200">{recovery?.resupply_vessel_name}</div>
                <div className="text-[11px] text-amber-300 font-mono">ETA ≈ {recovery?.resupply_eta_days} Days</div>
              </div>
            </div>

            {/* Recovery Exposure Banner */}
            <div className="rounded border border-amber-800/80 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">
                  OPERATIONAL RECOVERY EXPOSURE: {recovery?.exposure_level}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                  EVALUATED PROTOTYPE MODEL
                </span>
              </div>
              <p className="text-xs text-polar-300 leading-relaxed">
                {recovery?.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
