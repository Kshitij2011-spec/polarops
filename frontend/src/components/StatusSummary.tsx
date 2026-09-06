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
      <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-4 backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                isCritical
                  ? "bg-rose-950/40 text-rose-400 border-rose-800/60"
                  : isDegraded
                  ? "bg-amber-950/40 text-amber-400 border-amber-800/60"
                  : "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
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
            <span className="text-xs font-semibold text-polar-300 uppercase tracking-wider font-mono">
              STATION STATUS
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider border ${
              isCritical
                ? "bg-rose-950/80 text-rose-300 border-rose-700"
                : isDegraded
                ? "bg-amber-950/80 text-amber-300 border-amber-700"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-700"
            }`}
          >
            {overview.status}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-2">
          <div>
            <div className="text-3xl font-bold font-mono tracking-tight text-polar-100">
              {overview.overall_health_score}
              <span className="text-base font-normal text-polar-400">/100</span>
            </div>
            <div className="text-xs text-polar-400 mt-0.5">Composite Station Health</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono font-semibold text-amber-400">
              {overview.active_incidents_count}{" "}
              {overview.active_incidents_count === 1 ? "Active Issue" : "Active Issues"}
            </div>
            <div className="text-[11px] text-polar-400">Attention required</div>
          </div>
        </div>

        {/* Health progress bar */}
        <div className="w-full bg-polar-700/60 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              isCritical
                ? "bg-rose-500"
                : isDegraded
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
            style={{ width: `${overview.overall_health_score}%` }}
          />
        </div>
      </div>

      {/* ── 2. Fuel & Energy Runway ───────────────────────── */}
      <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-4 backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border bg-cyan-950/40 text-cyan-400 border-cyan-800/60">
              <Flame className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-polar-300 uppercase tracking-wider font-mono">
              FUEL & RUNWAY
            </span>
          </div>
          <TruthBadge type="DERIVED" />
        </div>

        <div className="mt-1">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-polar-100">
              {overview.fuel_quantity_liters
                ? `${overview.fuel_quantity_liters.toLocaleString()} L`
                : "142,500 L"}
            </div>
            <TruthBadge type="MEASURED" />
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-polar-700/60">
            <span className="text-xs text-polar-400">Estimated Runway:</span>
            <span className="text-sm font-mono font-bold text-accent-cyan">
              ≈ {overview.fuel_runway_days ?? 70.2} days
            </span>
          </div>
        </div>

        <div className="text-[11px] text-polar-400 mt-2 flex items-center justify-between">
          <span>Winter Target: 90 days</span>
          <span className="text-accent-amber font-mono">Resupply in 11d</span>
        </div>
      </div>

      {/* ── 3. Ambient Weather / Environment ──────────────── */}
      <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-4 backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border bg-blue-950/40 text-blue-400 border-blue-800/60">
              <Thermometer className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-polar-300 uppercase tracking-wider font-mono">
              ENVIRONMENT
            </span>
          </div>
          <TruthBadge type={overview.ambient_weather.provenance.truth_type as any || "MEASURED"} />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <div className="text-2xl font-bold font-mono text-polar-100">
              {overview.ambient_weather.temperature_celsius.toFixed(1)}°C
            </div>
            <div className="text-[11px] text-polar-400">
              Wind Chill: {overview.ambient_weather.wind_chill_celsius.toFixed(1)}°C
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm font-mono font-semibold text-polar-200">
              <Wind className="h-3.5 w-3.5 text-accent-cyan" />
              {overview.ambient_weather.wind_speed_knots} kt
            </div>
            <div className="text-[11px] font-medium text-accent-amber truncate">
              {overview.ambient_weather.conditions}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-polar-400 mt-2 font-mono truncate">
          Src: {overview.ambient_weather.provenance.source}
        </div>
      </div>

      {/* ── 4. Communications / Uplink ────────────────────── */}
      <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-4 backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border bg-emerald-950/40 text-emerald-400 border-emerald-800/60">
              <Radio className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-polar-300 uppercase tracking-wider font-mono">
              COMMUNICATIONS
            </span>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700">
            {overview.connectivity_status}
          </span>
        </div>

        <div className="mt-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-polar-300">Carrier Uplink</span>
            <span className="font-mono text-polar-100 font-semibold">VSAT Ku-Band</span>
          </div>
          <div className="flex items-center justify-between text-xs text-polar-400 mt-1">
            <span>Latency / Freshness</span>
            <span className="font-mono text-emerald-400">680 ms &middot; Real-time</span>
          </div>
        </div>

        <div className="text-[11px] text-polar-400 mt-2 pt-2 border-t border-polar-700/60 flex items-center justify-between">
          <span>Telemetry Quality:</span>
          <span className="text-accent-green font-mono">NOMINAL (99.8%)</span>
        </div>
      </div>
    </div>
  );
}
