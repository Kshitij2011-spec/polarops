import { ArrowLeft, Cpu, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import type { AssetDetail } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface AssetHeaderProps {
  asset: AssetDetail;
  onBack: () => void;
}

export function AssetHeader({ asset, onBack }: AssetHeaderProps) {
  const isWarning = asset.status === "WARNING" || asset.health_score < 80;
  const isCritical = asset.status === "CRITICAL" || asset.health_score < 50;

  return (
    <div className="space-y-4">
      {/* ── Navigation Top Bar ──────────────────────────── */}
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
            /assets/{asset.code}
          </span>
          <TruthBadge type="DERIVED" />
        </div>
      </div>

      {/* ── Hero Profile Card ───────────────────────────── */}
      <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-[#12141c] px-2 py-0.5 text-xs font-mono font-bold text-blue-700 dark:text-[#5b9cf5] border border-blue-200 dark:border-[#2a2f3e]">
                <Cpu className="h-3.5 w-3.5" />
                <span>{asset.code}</span>
              </div>
              <span className="rounded-md bg-slate-100 dark:bg-[#1e2230] px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:text-[#9ca3b4] border border-slate-200 dark:border-[#2a2f3e]">
                CRITICALITY: {asset.criticality}
              </span>
              <span className="rounded-md bg-slate-100 dark:bg-[#1e2230] px-2 py-0.5 text-xs font-mono font-medium text-slate-500 dark:text-[#7a8194] border border-slate-200 dark:border-[#2a2f3e]">
                {asset.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0] tracking-tight">
              {asset.name}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#7a8194] font-mono">
              <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-[#6b7280]" />
              <span>Larsemann Hills &middot; Powerhouse &middot; Zone 1 &middot; Gen Bay 2</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border shadow-2xs ${
                  isCritical
                    ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700"
                    : isWarning
                    ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                    : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                }`}
              >
                {isCritical ? (
                  <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                ) : isWarning ? (
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>{asset.status} &middot; HEALTH: {asset.health_score}/100</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-[#7a8194] font-mono text-right">
              Derived Prototype Operational Health Score
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
