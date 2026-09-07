import {
  Activity,
  Cpu,
  Droplets,
  Flame,
  Radio,
  Server,
  Zap,
} from "lucide-react";
import type { SubsystemSummaryItem } from "../lib/api";

export interface SubsystemGridProps {
  subsystems: SubsystemSummaryItem[];
}

export function SubsystemGrid({ subsystems }: SubsystemGridProps) {
  const getSubsystemIcon = (code: string) => {
    switch (code) {
      case "POWER":
        return <Zap className="h-4 w-4 text-accent-cyan" />;
      case "HEATING":
      case "THERMAL":
        return <Flame className="h-4 w-4 text-amber-400" />;
      case "WATER":
        return <Droplets className="h-4 w-4 text-sky-400" />;
      case "COMMS":
        return <Radio className="h-4 w-4 text-emerald-400" />;
      case "RESEARCH":
      case "SCIENCE":
        return <Cpu className="h-4 w-4 text-indigo-400" />;
      default:
        return <Server className="h-4 w-4 text-polar-300" />;
    }
  };

  return (
    <div className="rounded border border-polar-700 bg-polar-800/90 p-5">
      <div className="flex items-center justify-between pb-2.5 border-b border-polar-700 mb-3.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-polar-200">
            SUBSYSTEM HEALTH &amp; TELEMETRY MATRIX
          </h2>
        </div>
        <span className="text-xs font-mono text-polar-400">
          {subsystems.length} Monitored Subsystems
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {subsystems.map((sub) => {
          const isWarning = sub.status === "WARNING" || sub.health_score < 80;
          const isCritical = sub.status === "CRITICAL" || sub.health_score < 50;

          return (
            <div
              key={sub.code}
              className={`rounded border p-3 flex flex-col justify-between transition-colors ${
                isCritical
                  ? "bg-rose-950/20 border-rose-800"
                  : isWarning
                  ? "bg-amber-950/20 border-amber-800"
                  : "bg-polar-900 border-polar-700 hover:border-polar-600"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="p-1 rounded bg-polar-800 border border-polar-700">
                    {getSubsystemIcon(sub.code)}
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      isCritical
                        ? "bg-rose-950 text-rose-300 border-rose-800"
                        : isWarning
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border-emerald-800"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="text-xs font-bold font-mono text-polar-100 truncate">
                  {sub.name}
                </div>
                <div className="text-[10px] text-polar-400 font-mono mt-0.5">
                  ID: {sub.code}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline justify-between text-xs mb-1 font-mono">
                  <span className="text-polar-400 text-[11px]">Health:</span>
                  <span
                    className={`font-bold ${
                      isCritical
                        ? "text-rose-400"
                        : isWarning
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {sub.health_score}%
                  </span>
                </div>
                <div className="w-full bg-polar-950 rounded-sm h-1 overflow-hidden border border-polar-700/50">
                  <div
                    className={`h-full ${
                      isCritical
                        ? "bg-rose-500"
                        : isWarning
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${sub.health_score}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
