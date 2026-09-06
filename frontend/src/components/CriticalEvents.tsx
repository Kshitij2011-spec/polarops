import { AlertTriangle, ArrowRight, Cog, Gauge, MapPin, Zap } from "lucide-react";
import type { CriticalEventItem } from "../lib/api";

export interface CriticalEventsProps {
  events: CriticalEventItem[];
  onInspectAsset?: (assetId: string) => void;
}

export function CriticalEvents({ events, onInspectAsset }: CriticalEventsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-polar-700 bg-polar-800/50 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold font-mono uppercase tracking-wider">
            NO CRITICAL ANOMALIES DETECTED
          </span>
        </div>
        <p className="text-xs text-polar-400 mt-1">
          All monitored primary equipment and power buses operating within nominal parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-800/80 bg-gradient-to-br from-polar-850 via-polar-800 to-amber-950/20 p-5 backdrop-blur-sm shadow-lg shadow-amber-950/10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-amber-900/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-300">
                CRITICAL OPERATIONAL EVENT &middot; HIGH ATTENTION
              </h2>
              <span className="rounded bg-amber-900/80 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-200 border border-amber-700">
                DEGRADED HEALTH
              </span>
            </div>
            <p className="text-xs text-polar-400 mt-0.5">
              Primary operational anomaly requiring engineer assessment before blizzard peak
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-polar-400">
          Priority 1 of {events.length}
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-polar-700 bg-polar-900/70 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Cog className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-polar-100 font-mono text-sm">
                    {event.title}
                  </span>
                  {event.asset_id && (
                    <span className="rounded bg-polar-800 px-1.5 py-0.5 text-[11px] font-mono text-accent-cyan border border-polar-700">
                      {event.asset_id}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-polar-400 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-polar-500" />
                  <span>{event.location ?? "Powerhouse / Generator Bay"}</span>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => onInspectAsset?.(event.asset_id || "ASSET-GEN-02")}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-3 py-1.5 text-xs font-mono font-semibold transition-all hover:border-amber-400 cursor-pointer shadow-sm group"
              >
                <span>Inspect Asset G-02</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-polar-300 mt-3 leading-relaxed border-l-2 border-amber-500/60 pl-3">
              {event.description}
            </p>

            {/* Telemetry highlight bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-polar-800">
              <div className="flex items-center gap-2 rounded bg-polar-800/80 px-2.5 py-1.5 border border-polar-700/60">
                <Gauge className="h-3.5 w-3.5 text-rose-400" />
                <div className="text-[11px]">
                  <span className="text-polar-400">Vibration: </span>
                  <span className="font-mono font-bold text-rose-400">4.8 mm/s</span>
                  <span className="text-polar-500 text-[10px]"> (&gt; 4.0 limit)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded bg-polar-800/80 px-2.5 py-1.5 border border-polar-700/60">
                <Gauge className="h-3.5 w-3.5 text-amber-400" />
                <div className="text-[11px]">
                  <span className="text-polar-400">Coolant Temp: </span>
                  <span className="font-mono font-bold text-amber-400">94.2°C</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded bg-polar-800/80 px-2.5 py-1.5 border border-polar-700/60">
                <Zap className="h-3.5 w-3.5 text-accent-cyan" />
                <div className="text-[11px]">
                  <span className="text-polar-400">Efficiency: </span>
                  <span className="font-mono font-bold text-accent-cyan">32.4%</span>
                  <span className="text-polar-500 text-[10px]"> (down from 38%)</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
