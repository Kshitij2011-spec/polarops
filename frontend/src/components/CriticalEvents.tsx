import { AlertTriangle, ArrowRight, Cog, Gauge, MapPin, Zap } from "lucide-react";
import type { CriticalEventItem } from "../lib/api";

export interface CriticalEventsProps {
  events: CriticalEventItem[];
  onInspectAsset?: (assetId: string) => void;
}

export function CriticalEvents({ events, onInspectAsset }: CriticalEventsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded border border-polar-700 bg-polar-800/80 p-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold font-mono uppercase tracking-wider">
            NO CRITICAL ANOMALIES DETECTED
          </span>
        </div>
        <p className="text-xs text-polar-400 mt-1 font-mono">
          All monitored primary equipment and power buses operating within nominal parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-amber-800 bg-polar-900 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-amber-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-amber-950 text-amber-400 border border-amber-800">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                CRITICAL OPERATIONAL EVENT &middot; HIGH ATTENTION
              </h2>
              <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-200 border border-amber-800">
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
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded border border-polar-700 bg-polar-800/90 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Cog className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-polar-100 font-mono text-sm">
                    {event.title}
                  </span>
                  {event.asset_id && (
                    <span className="rounded bg-polar-900 px-1.5 py-0.5 text-[11px] font-mono text-accent-cyan border border-polar-700">
                      {event.asset_id}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-polar-400 mt-1 font-mono">
                  <MapPin className="h-3 w-3 text-polar-500" />
                  <span>{event.location ?? "Powerhouse / Generator Bay"}</span>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => onInspectAsset?.(event.asset_id || "ASSET-GEN-02")}
                className="flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                <span>Inspect Asset G-02</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-polar-300 mt-2.5 leading-relaxed border-l-2 border-amber-500 pl-3 font-sans">
              {event.description}
            </p>

            {/* Telemetry highlight bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-polar-700/60 font-mono text-xs">
              <div className="flex items-center gap-2 rounded bg-polar-900 px-2.5 py-1.5 border border-polar-700">
                <Gauge className="h-3.5 w-3.5 text-rose-400" />
                <div>
                  <span className="text-polar-400">Vibration: </span>
                  <span className="font-bold text-rose-400">4.8 mm/s</span>
                  <span className="text-polar-500 text-[10px]"> (&gt; 4.0 limit)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded bg-polar-900 px-2.5 py-1.5 border border-polar-700">
                <Gauge className="h-3.5 w-3.5 text-amber-400" />
                <div>
                  <span className="text-polar-400">Coolant Temp: </span>
                  <span className="font-bold text-amber-400">94.2°C</span>
                  <span className="text-polar-500 text-[10px]"> (&gt; 90.0 limit)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded bg-polar-900 px-2.5 py-1.5 border border-polar-700">
                <Zap className="h-3.5 w-3.5 text-accent-cyan" />
                <div>
                  <span className="text-polar-400">Impact: </span>
                  <span className="font-bold text-polar-200">Zone 2 Heating</span>
                  <span className="text-polar-500 text-[10px]"> (Thermal Loop B)</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
