import { AlertTriangle, ArrowRight, Cog, Gauge, HelpCircle, MapPin, Zap } from "lucide-react";
import type { CriticalEventItem } from "../lib/api";

export interface CriticalEventsProps {
  events: CriticalEventItem[];
  onInspectAsset?: (assetId: string) => void;
  onOpenExplanation?: (domain: string, entityId: string) => void;
}

export function CriticalEvents({ events, onInspectAsset, onOpenExplanation }: CriticalEventsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold font-mono uppercase tracking-wider">
            NO CRITICAL ANOMALIES DETECTED
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-[#7a8194] mt-1 font-mono">
          All monitored primary equipment and power buses operating within nominal parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-[#1a140a]/40 p-5 shadow-2xs transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-amber-200 dark:border-amber-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-800 dark:text-amber-300">
                CRITICAL OPERATIONAL EVENT &middot; HIGH ATTENTION
              </h2>
              <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                DEGRADED HEALTH
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9ca3b4] mt-0.5 font-sans">
              Primary operational anomaly requiring engineer assessment before blizzard peak
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">
          Priority 1 of {events.length}
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-amber-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 shadow-2xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Cog className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-slate-900 dark:text-[#e4e8f0] font-mono text-sm">
                    {event.title}
                  </span>
                  {event.asset_id && (
                    <span className="rounded bg-blue-50 dark:bg-[#12141c] px-1.5 py-0.5 text-[11px] font-mono text-blue-700 dark:text-[#5b9cf5] border border-blue-200 dark:border-[#2a2f3e]">
                      {event.asset_id}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-[#7a8194] mt-1 font-mono">
                  <MapPin className="h-3 w-3 text-slate-400 dark:text-[#6b7280]" />
                  <span>{event.location ?? "Powerhouse / Generator Bay"}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenExplanation?.("ASSET", event.asset_id || "G-02")}
                  data-testid="critical-event-why-btn"
                  className="flex items-center gap-1 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2.5 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Open deterministic operational explanation drawer"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>WHY?</span>
                </button>

                <button
                  onClick={() => onInspectAsset?.(event.asset_id || "ASSET-GEN-02")}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Inspect Asset G-02</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 dark:text-[#9ca3b4] mt-2.5 leading-relaxed border-l-2 border-amber-500 pl-3 font-sans">
              {event.description}
            </p>

            {/* Telemetry highlight bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-[#2a2f3e]/60 font-mono text-xs">
              <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-[#12141c] px-2.5 py-1.5 border border-slate-200 dark:border-[#2a2f3e]">
                <Gauge className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                <div>
                  <span className="text-slate-500 dark:text-[#7a8194]">Vibration: </span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">4.8 mm/s</span>
                  <span className="text-slate-400 dark:text-[#6b7280] text-[10px]"> (&gt; 4.0 limit)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-[#12141c] px-2.5 py-1.5 border border-slate-200 dark:border-[#2a2f3e]">
                <Gauge className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="text-slate-500 dark:text-[#7a8194]">Coolant Temp: </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">94.2°C</span>
                  <span className="text-slate-400 dark:text-[#6b7280] text-[10px]"> (&gt; 90.0 limit)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-slate-50 dark:bg-[#12141c] px-2.5 py-1.5 border border-slate-200 dark:border-[#2a2f3e]">
                <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
                <div>
                  <span className="text-slate-500 dark:text-[#7a8194]">Impact: </span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">Zone 2 Heating</span>
                  <span className="text-slate-400 dark:text-[#6b7280] text-[10px]"> (Thermal Loop B)</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
