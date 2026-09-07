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
        return <Zap className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />;
      case "HEATING":
      case "THERMAL":
        return <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "WATER":
        return <Droplets className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
      case "COMMS":
        return <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "RESEARCH":
      case "SCIENCE":
        return <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Server className="h-4 w-4 text-slate-500 dark:text-[#9ca3b4]" />;
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e] mb-3.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-[#e4e8f0]">
            SUBSYSTEM HEALTH &amp; TELEMETRY MATRIX
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-[#7a8194]">
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
              className={`rounded-md border p-3 flex flex-col justify-between transition-colors shadow-2xs ${
                isCritical
                  ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                  : isWarning
                  ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                  : "bg-slate-50 dark:bg-[#12141c] border-slate-200 dark:border-[#2a2f3e] hover:border-slate-300 dark:hover:border-[#3d4556]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="p-1 rounded-md bg-white dark:bg-[#181b24] border border-slate-200 dark:border-[#2a2f3e]">
                    {getSubsystemIcon(sub.code)}
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      isCritical
                        ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                        : isWarning
                        ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="text-xs font-bold font-mono text-slate-900 dark:text-[#e4e8f0] truncate">
                  {sub.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono mt-0.5">
                  ID: {sub.code}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-500 dark:text-[#7a8194] text-[11px]">Health:</span>
                  <span
                    className={`font-bold ${
                      isCritical
                        ? "text-rose-600 dark:text-rose-400"
                        : isWarning
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {sub.health_score}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 dark:bg-[#0c0e14] rounded-full h-1 overflow-hidden border border-slate-200 dark:border-[#2a2f3e]/50">
                  <div
                    className={`h-full transition-all ${
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
