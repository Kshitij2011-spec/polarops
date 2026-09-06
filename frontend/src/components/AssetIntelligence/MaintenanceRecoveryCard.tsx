import {
  AlertOctagon,
  CheckCircle2,
  Ship,
  User,
  Wrench,
} from "lucide-react";
import type { AssetRisk } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface MaintenanceRecoveryCardProps {
  risk: AssetRisk;
}

export function MaintenanceRecoveryCard({ risk }: MaintenanceRecoveryCardProps) {
  return (
    <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-5 backdrop-blur-sm shadow-md">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-polar-700">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-polar-200">
            MAINTENANCE, LOCAL SPARES &amp; RESUPPLY LOGISTICS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-polar-400 font-mono">Recovery State</span>
          <TruthBadge type="SYNTHETIC" />
        </div>
      </div>

      {/* ── Three Column Grid: Work Order | Spare Inventory | Resupply ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* 1. Maintenance Work Order */}
        <div className="rounded-lg border border-rose-900/60 bg-polar-900/90 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-polar-200">
                ACTIVE WORK ORDER
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase">
                {risk.maintenance_blocked ? "BLOCKED_PARTS" : "ACTIVE"}
              </span>
            </div>

            <div className="text-sm font-mono font-bold text-polar-100 mt-1">
              {risk.active_work_order_id ?? "MWO-2026-089"}
            </div>
            <p className="text-xs text-polar-300 mt-1 leading-relaxed">
              G-02 Fuel Injection Pump &amp; Bearing Seal Replacement
            </p>

            <div className="text-[11px] text-polar-400 font-mono mt-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-polar-500" />
                <span>Assigned: Lead Mech. Eng. Verma</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertOctagon className="h-3 w-3" />
                <span>Action: Replace pump seal before bearing seizure</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-polar-800 text-[10px] font-mono text-polar-500">
            Work order scheduled &middot; Priority: HIGH
          </div>
        </div>

        {/* 2. Spare Part & Inventory */}
        <div className="rounded-lg border border-amber-900/60 bg-polar-900/90 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-polar-200">
                REQUIRED SPARE PART
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase">
                {risk.spare_available_quantity === 0 ? "0 AVAILABLE" : "IN STOCK"}
              </span>
            </div>

            <div className="text-sm font-mono font-bold text-polar-100 mt-1">
              Part # SK-402
            </div>
            <p className="text-xs text-polar-300 mt-1 leading-relaxed">
              {risk.required_spare_part ?? "Generator G-02 Gasket & Fuel Pump Seal Kit"}
            </p>

            <div className="text-[11px] text-polar-400 font-mono mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span>Required:</span>
                <span className="font-bold text-polar-200">1 Unit</span>
              </div>
              <div className="flex items-center justify-between text-rose-400">
                <span>Station Stock:</span>
                <span className="font-bold">0 Units (UNAVAILABLE)</span>
              </div>
              <div className="flex items-center justify-between text-polar-500">
                <span>Rack Location:</span>
                <span>Powerhouse Bay B-04</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-polar-800 text-[10px] font-mono text-rose-400 font-semibold">
            Inventory depletion blocking recovery
          </div>
        </div>

        {/* 3. Resupply Exposure */}
        <div className="rounded-lg border border-polar-700/80 bg-polar-900/90 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-polar-200">
                RESUPPLY LOGISTICS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                IN TRANSIT
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-polar-100 mt-1">
              <Ship className="h-4 w-4 text-accent-cyan" />
              <span>MV Vasiliy Golovnin</span>
            </div>
            <p className="text-xs text-polar-300 mt-1 leading-relaxed">
              Antarctic Expedition Vessel carrying 2x SK-402 seal kits
            </p>

            <div className="text-[11px] text-polar-400 font-mono mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span>Estimated ETA:</span>
                <span className="font-bold text-accent-cyan font-mono">
                  ≈ {risk.resupply_days ?? 11.0} Days
                </span>
              </div>
              <div className="flex items-center justify-between text-polar-500">
                <span>Aviation Flight:</span>
                <span className="text-amber-400">Grounding during blizzard</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-polar-800 text-[10px] font-mono text-polar-400">
            Logistics window: 11-day exposure gap
          </div>
        </div>
      </div>

      {/* ── Prescriptive Operational Decisions ───────────── */}
      <div className="rounded-lg border border-accent-cyan/30 bg-polar-950/70 p-4">
        <div className="text-xs font-mono font-bold text-accent-cyan uppercase tracking-wider mb-2">
          PRESCRIPTIVE MITIGATION ACTIONS FOR OPERATOR
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-polar-300">
          <div className="flex items-start gap-2 p-2 rounded bg-polar-900/60 border border-polar-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent-green shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-polar-100">Load De-Rating: </span>
              <span>De-rate G-02 electrical load to 65 kW to minimize bearing vibration and thermal runaway.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded bg-polar-900/60 border border-polar-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent-green shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-polar-100">Auxiliary Thermal Transfer: </span>
              <span>Initiate Boiler B-01 preheat sequence (requires 35m in -28°C) to safeguard Zone 2 heating.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
