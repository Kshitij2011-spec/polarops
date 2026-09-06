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
          className="flex items-center gap-2 rounded-lg border border-polar-700 bg-polar-800/80 px-3.5 py-1.5 text-xs font-mono font-medium text-polar-300 hover:text-polar-100 hover:border-polar-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>← Back to Station Command Center</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-polar-400">ROUTE:</span>
          <span className="rounded bg-polar-800 px-2 py-0.5 text-accent-cyan border border-polar-700">
            /assets/{asset.code}
          </span>
          <TruthBadge type="DERIVED" />
        </div>
      </div>

      {/* ── Hero Profile Card ───────────────────────────── */}
      <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-5 backdrop-blur-sm shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded bg-polar-900 px-2 py-0.5 text-xs font-mono font-bold text-accent-cyan border border-polar-700">
                <Cpu className="h-3.5 w-3.5" />
                <span>{asset.code}</span>
              </div>
              <span className="rounded bg-polar-800 px-2 py-0.5 text-xs font-mono font-medium text-polar-300 border border-polar-700">
                CRITICALITY: {asset.criticality}
              </span>
              <span className="rounded bg-polar-800 px-2 py-0.5 text-xs font-mono font-medium text-polar-400 border border-polar-700">
                {asset.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-polar-100 tracking-tight">
              {asset.name}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-polar-400 font-mono">
              <MapPin className="h-3.5 w-3.5 text-polar-500" />
              <span>Larsemann Hills &middot; Powerhouse &middot; Zone 1 &middot; Gen Bay 2</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider border ${
                  isCritical
                    ? "bg-rose-950/80 text-rose-300 border-rose-700"
                    : isWarning
                    ? "bg-amber-950/80 text-amber-300 border-amber-700"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                }`}
              >
                {isCritical ? (
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                ) : isWarning ? (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                )}
                <span>{asset.status} &middot; HEALTH: {asset.health_score}/100</span>
              </span>
            </div>

            <div className="text-[11px] text-polar-400 font-mono text-right">
              Derived Prototype Operational Health Score
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
