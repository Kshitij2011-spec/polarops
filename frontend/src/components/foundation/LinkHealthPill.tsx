import React from "react";
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle, Radio } from "lucide-react";

export type GlobalLinkState =
  | "NORMAL"
  | "DEGRADED"
  | "LOCAL"
  | "QUEUED"
  | "RECONNECTING"
  | "SYNCHRONIZING"
  | "RECONCILED";

export interface LinkHealthPillProps {
  status: GlobalLinkState;
  pendingCount?: number;
  latencyMs?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Global Edge Resilience & Satellite Comms Pill
 * Mounted in header bar to represent ambient link connectivity
 * across all 7 operational states without duplicate indicators.
 */
export function LinkHealthPill({
  status,
  pendingCount = 0,
  latencyMs,
  onClick,
  className = "",
}: LinkHealthPillProps) {
  const norm = (status || "NORMAL").toUpperCase() as GlobalLinkState;

  const getStatusConfig = () => {
    switch (norm) {
      case "NORMAL":
        return {
          icon: Wifi,
          label: "LINK ONLINE",
          badge: latencyMs ? `${latencyMs}ms` : "SAT-1",
          pillClass: "bg-emerald-950/70 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60",
          indicatorColor: "bg-emerald-400",
          animate: false,
        };
      case "DEGRADED":
        return {
          icon: Radio,
          label: "LINK DEGRADED",
          badge: latencyMs ? `${latencyMs}ms` : "HIGH LATENCY",
          pillClass: "bg-amber-950/70 text-amber-300 border-amber-800/80 hover:bg-amber-900/60",
          indicatorColor: "bg-amber-400",
          animate: true,
        };
      case "LOCAL":
        return {
          icon: WifiOff,
          label: "LOCAL EDGE",
          badge: "ISOLATED",
          pillClass: "bg-purple-950/70 text-purple-300 border-purple-800/80 hover:bg-purple-900/60",
          indicatorColor: "bg-purple-400",
          animate: false,
        };
      case "QUEUED":
        return {
          icon: Database,
          label: "EDGE QUEUED",
          badge: `${pendingCount} PKTS`,
          pillClass: "bg-indigo-950/80 text-indigo-300 border-indigo-700/90 hover:bg-indigo-900/70 shadow-xs",
          indicatorColor: "bg-indigo-400",
          animate: true,
        };
      case "RECONNECTING":
        return {
          icon: RefreshCw,
          label: "HANDSHAKE",
          badge: "ACQUIRING",
          pillClass: "bg-sky-950/80 text-sky-300 border-sky-700/80 hover:bg-sky-900/70",
          indicatorColor: "bg-sky-400",
          animate: true,
        };
      case "SYNCHRONIZING":
        return {
          icon: RefreshCw,
          label: "SYNCING",
          badge: `${pendingCount} REMAINING`,
          pillClass: "bg-cyan-950/80 text-cyan-300 border-cyan-700/80 hover:bg-cyan-900/70",
          indicatorColor: "bg-cyan-400",
          animate: true,
        };
      case "RECONCILED":
        return {
          icon: CheckCircle,
          label: "RECONCILED",
          badge: "VERIFIED",
          pillClass: "bg-emerald-950/70 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60",
          indicatorColor: "bg-emerald-400",
          animate: false,
        };
      default:
        return {
          icon: Wifi,
          label: "COMMS",
          badge: norm,
          pillClass: "bg-slate-900 text-slate-300 border-slate-700",
          indicatorColor: "bg-slate-400",
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-[11px] font-mono tracking-wider transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${config.pillClass} ${className}`}
      title="Click to inspect Satellite Resilience Cockpit and Sync Queue"
      aria-label={`Comms Status: ${config.label}, Details: ${config.badge}`}
    >
      <span className="relative flex h-2 w-2">
        {config.animate && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.indicatorColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.indicatorColor}`} />
      </span>

      <IconComponent
        size={12}
        className={`shrink-0 ${config.animate && norm === "SYNCHRONIZING" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />

      <span className="font-semibold">{config.label}</span>

      <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 border border-white/10 opacity-90">
        {config.badge}
      </span>
    </button>
  );
}
