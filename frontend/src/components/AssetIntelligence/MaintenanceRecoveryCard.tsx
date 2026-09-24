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
    <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-[#2a2f3e]">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-[#e4e8f0]">
            MAINTENANCE, LOCAL SPARES &amp; RESUPPLY LOGISTICS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-[#7a8194] font-mono">Recovery State</span>
          <TruthBadge type="SYNTHETIC" />
        </div>
      </div>

      {/* ── Three Column Grid: Work Order | Spare Inventory | Resupply ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* 1. Maintenance Work Order */}
        <div className="rounded-md border border-rose-200 dark:border-rose-900/70 bg-rose-50/40 dark:bg-[#150a0a]/60 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-[#e4e8f0] uppercase tracking-wider">
                ACTIVE WORK ORDER
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                {risk.maintenance_blocked ? "BLOCKED_PARTS" : "ACTIVE"}
              </span>
            </div>

            <div className="text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0] mt-1">
              {risk.active_work_order_id ?? "MWO-2026-089"}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9ca3b4] mt-1 leading-relaxed font-sans">
              G-02 Fuel Injection Pump &amp; Bearing Seal Replacement
            </p>

            <div className="text-[11px] text-slate-500 dark:text-[#7a8194] font-mono mt-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-slate-400 dark:text-[#6b7280]" />
                <span>Assigned: Lead Mech. Eng. Verma</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertOctagon className="h-3 w-3" />
                <span>Action: Replace pump seal before bearing seizure</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-100 dark:border-rose-900/40 text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
            Work order scheduled &middot; Priority: HIGH
          </div>
        </div>

        {/* 2. Spare Part & Inventory */}
        <div className="rounded-md border border-amber-200 dark:border-amber-900/70 bg-amber-50/40 dark:bg-[#161208]/60 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-[#e4e8f0] uppercase tracking-wider">
                REQUIRED SPARE PART
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                {risk.spare_available_quantity === 0 ? "0 AVAILABLE" : "IN STOCK"}
              </span>
            </div>

            <div className="text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0] mt-1">
              Part # SK-402
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9ca3b4] mt-1 leading-relaxed font-sans">
              {risk.required_spare_part ?? "Generator G-02 Gasket & Fuel Pump Seal Kit"}
            </p>

            <div className="text-[11px] text-slate-500 dark:text-[#7a8194] font-mono mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span>Required:</span>
                <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">1 Unit</span>
              </div>
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold">
                <span>Station Stock:</span>
                <span>0 Units (UNAVAILABLE)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 dark:text-[#6b7280]">
                <span>Rack Location:</span>
                <span>Powerhouse Bay B-04</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/40 text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
            Inventory depletion blocking recovery
          </div>
        </div>

        {/* 3. Resupply Exposure */}
        <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#12141c]/60 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-[#e4e8f0] uppercase tracking-wider">
                RESUPPLY LOGISTICS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-100 dark:bg-cyan-950 text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-cyan-800 uppercase tracking-wider">
                IN TRANSIT
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0] mt-1">
              <Ship className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
              <span>MV Vasiliy Golovnin</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9ca3b4] mt-1 leading-relaxed font-sans">
              Antarctic Expedition Vessel carrying 2x SK-402 seal kits
            </p>

            <div className="text-[11px] text-slate-500 dark:text-[#7a8194] font-mono mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span>Estimated ETA:</span>
                <span className="font-bold text-blue-600 dark:text-[#5b9cf5] font-mono">
                  ≈ {risk.resupply_days ?? 11.0} Days
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 dark:text-[#6b7280]">
                <span>Aviation Flight:</span>
                <span className="text-amber-600 dark:text-amber-400">Grounding during blizzard</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2a2f3e]/40 text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
            Logistics window: 11-day exposure gap
          </div>
        </div>
      </div>

      {/* ── Prescriptive Operational Decisions ───────────── */}
      <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/70 dark:bg-[#0c0e14] p-4 shadow-2xs">
        <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-[#e4e8f0] uppercase tracking-wider mb-2">
          PRESCRIPTIVE MITIGATION ACTIONS FOR OPERATOR
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-700 dark:text-[#9ca3b4]">
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-white dark:bg-[#141721] border border-slate-200 dark:border-[#2a2f3e] shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-[#e4e8f0]">Load De-Rating: </span>
              <span className="font-sans">De-rate G-02 electrical load to 65 kW to minimize bearing vibration and thermal runaway.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-md bg-white dark:bg-[#141721] border border-slate-200 dark:border-[#2a2f3e] shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-[#e4e8f0]">Auxiliary Thermal Transfer: </span>
              <span className="font-sans">Initiate Boiler B-01 preheat sequence (requires 35m in -28°C) to safeguard Zone 2 heating.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
