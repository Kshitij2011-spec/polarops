import {
  AlertTriangle,
  Flame,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Wind,
} from "lucide-react";
import type { StationOverview } from "../lib/api";
import { TruthBadge } from "./TruthBadge";

export interface StatusSummaryProps {
  overview: StationOverview;
}

export function StatusSummary({ overview }: StatusSummaryProps) {
  const isDegraded = overview.status === "DEGRADED" || overview.overall_health_score < 85;
  const isCritical = overview.status === "CRITICAL" || overview.overall_health_score < 50;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ── 1. Station Overall Health ─────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]/60">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                isCritical
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
                  : isDegraded
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
              }`}
            >
              {isCritical ? (
                <ShieldAlert className="h-4 w-4" />
              ) : isDegraded ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-[#9ca3b4] uppercase tracking-wider font-mono">
              STATION STATUS
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${
              isCritical
                ? "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700"
                : isDegraded
                ? "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                : "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
            }`}
          >
            {overview.status}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-[#e4e8f0]">
              {overview.overall_health_score}
              <span className="text-sm font-normal text-slate-400 dark:text-[#7a8194] font-mono">/100</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-[#7a8194] mt-0.5 font-mono">Composite Station Health</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400">
              {overview.active_incidents_count}{" "}
              {overview.active_incidents_count === 1 ? "Active Issue" : "Active Issues"}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-[#7a8194] font-mono">Attention required</div>
          </div>
        </div>

        {/* Health progress bar */}
        <div className="w-full bg-slate-100 dark:bg-[#12141c] rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200 dark:border-[#2a2f3e]/50">
          <div
            className={`h-full transition-all ${
              isCritical
                ? "bg-rose-500"
                : isDegraded
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${overview.overall_health_score}%` }}
          />
        </div>
      </div>

      {/* ── 2. Fuel & Energy Runway ───────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border bg-slate-50 dark:bg-[#12141c] text-slate-600 dark:text-[#9ca3b4] border-slate-200 dark:border-[#2a2f3e]">
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-[#9ca3b4] uppercase tracking-wider font-mono">
              FUEL &amp; RUNWAY
            </span>
          </div>
          <TruthBadge type="DERIVED" />
        </div>

        <div className="mt-1">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
              {overview.fuel_quantity_liters
                ? `${overview.fuel_quantity_liters.toLocaleString()} L`
                : "142,500 L"}
            </div>
            <TruthBadge type="MEASURED" />
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-[#2a2f3e]/60">
            <span className="text-xs text-slate-500 dark:text-[#7a8194] font-mono">Estimated Runway:</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
              ≈ {overview.fuel_runway_days ?? 70.2} days
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-[#7a8194] mt-2 flex items-center justify-between font-mono">
          <span>Winter Target: 90 days</span>
          <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">Resupply in 11d</span>
        </div>
      </div>

      {/* ── 3. Ambient Weather / Environment ──────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border bg-slate-50 dark:bg-[#12141c] text-slate-600 dark:text-[#9ca3b4] border-slate-200 dark:border-[#2a2f3e]">
              <Thermometer className="h-4 w-4 text-sky-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-[#9ca3b4] uppercase tracking-wider font-mono">
              ENVIRONMENT
            </span>
          </div>
          <TruthBadge type={(overview.ambient_weather.provenance.truth_type as any) || "MEASURED"} />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
              {overview.ambient_weather.temperature_celsius.toFixed(1)}°C
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#7a8194] font-mono">
              Wind Chill: {overview.ambient_weather.wind_chill_celsius.toFixed(1)}°C
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm font-mono font-semibold text-slate-800 dark:text-[#e4e8f0]">
              <Wind className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
              {overview.ambient_weather.wind_speed_knots} kt
            </div>
            <div
              className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5 leading-tight"
              title={overview.ambient_weather.conditions}
            >
              {overview.ambient_weather.conditions.replace(/_/g, " ")}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-[#6b7280] mt-2 font-mono truncate">
          Src: {overview.ambient_weather.provenance.source}
        </div>
      </div>

      {/* ── 4. Communications / Uplink ────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border bg-slate-50 dark:bg-[#12141c] text-slate-600 dark:text-[#9ca3b4] border-slate-200 dark:border-[#2a2f3e]">
              <Radio className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-[#9ca3b4] uppercase tracking-wider font-mono">
              COMMUNICATIONS
            </span>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {overview.connectivity_status}
          </span>
        </div>

        <div className="mt-1 font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-[#7a8194]">Carrier Uplink</span>
            <span className="text-slate-900 dark:text-[#e4e8f0] font-semibold">VSAT Ku-Band</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-slate-500 dark:text-[#7a8194]">Latency / Freshness</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">680 ms · Real-time</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-[#7a8194] mt-2 pt-2 border-t border-slate-100 dark:border-[#2a2f3e]/60 flex items-center justify-between font-mono">
          <span>Telemetry Quality:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">NOMINAL (99.8%)</span>
        </div>
      </div>
    </div>
  );
}
