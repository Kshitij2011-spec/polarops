import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Info, CloudOff } from "lucide-react";

export type OperationalStatus =
  | "CRITICAL"
  | "WARNING"
  | "DEGRADED"
  | "NOMINAL"
  | "ONLINE"
  | "INFO"
  | "ADVISORY"
  | "OFFLINE"
  | "LOCAL"
  | "LOCAL_EDGE"
  | string;

export interface StatusBadgeProps {
  status: OperationalStatus;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Triple-Encoded Status Badge
 * Adheres to WCAG 2.2 SC 1.4.1 (Color + Distinct Icon Glyph + Explicit Text Label).
 * Calibrated specifically for high-contrast dark slate environments.
 */
export function StatusBadge({
  status,
  label,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  const getStatusConfig = () => {
    switch (norm) {
      case "CRITICAL":
      case "HIGH":
      case "ATTENTION":
        return {
          bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/80 dark:text-red-400 dark:border-red-800/90 dark:ring-1 dark:ring-red-500/20",
          icon: AlertTriangle,
          defaultLabel: "CRITICAL",
          dotColor: "bg-red-500",
        };
      case "WARNING":
      case "DEGRADED":
      case "WATCH":
      case "MEDIUM":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800/90 dark:ring-1 dark:ring-amber-500/20",
          icon: AlertCircle,
          defaultLabel: norm === "DEGRADED" ? "DEGRADED" : "WARNING",
          dotColor: "bg-amber-500",
        };
      case "NOMINAL":
      case "ONLINE":
      case "OPERATIONAL":
      case "RECONCILED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800/90 dark:ring-1 dark:ring-emerald-500/20",
          icon: CheckCircle2,
          defaultLabel: norm === "ONLINE" ? "ONLINE" : "NOMINAL",
          dotColor: "bg-emerald-500",
        };
      case "INFO":
      case "ADVISORY":
      case "SYSTEM":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/80 dark:text-sky-400 dark:border-sky-800/90 dark:ring-1 dark:ring-sky-500/20",
          icon: Info,
          defaultLabel: norm === "ADVISORY" ? "ADVISORY" : "INFO",
          dotColor: "bg-sky-500",
        };
      case "OFFLINE":
      case "LOCAL":
      case "LOCAL_EDGE":
      case "STORED":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-400 dark:border-purple-800/90 dark:ring-1 dark:ring-purple-500/20",
          icon: CloudOff,
          defaultLabel: norm.includes("LOCAL") ? "LOCAL EDGE" : "OFFLINE",
          dotColor: "bg-purple-500",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
          icon: Info,
          defaultLabel: norm || "UNKNOWN",
          dotColor: "bg-slate-400",
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[9px] gap-1",
    md: "px-2 py-0.5 text-[10px] gap-1.5",
    lg: "px-2.5 py-1 text-xs gap-2",
  }[size];

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15,
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-sm border ${config.bg} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      <IconComponent size={iconSizes} className="shrink-0" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}
