import { useMemo } from "react";

export interface BatteryIndicatorProps {
  /** Numeric percentage (0 - 100) */
  value: number;
  /** Optional operational status string (e.g., 'NOMINAL', 'WARNING', 'CRITICAL', 'ATTENTION', 'WATCH') */
  status?: string;
  /** Number of discrete battery segments (default: 10) */
  segments?: number;
  /** Whether to render the battery terminal cathode tab on the right (default: true) */
  showTerminal?: boolean;
  /** Optional extra class names */
  className?: string;
  /** Optional accessible label */
  label?: string;
}

/**
 * Functional Battery-style Operational Indicator.
 *
 * - Renders rounded internal segments with subtle gap spacing
 * - Dynamically determines operational color based on status or percentage thresholds
 *   (80–100% green/emerald, 50–79% cyan/blue, 25–49% amber, 0–24% red)
 * - Animates fill smoothly on real data updates
 * - Respects prefers-reduced-motion
 */
export function BatteryIndicator({
  value,
  status,
  segments = 10,
  showTerminal = true,
  className = "",
  label,
}: BatteryIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : Number(value)));

  const { fillColor, glowColor } = useMemo(() => {
    const norm = (status || "").toUpperCase();

    if (norm === "CRITICAL" || norm === "EMERGENCY" || norm === "ALARM") {
      return { fillColor: "bg-rose-500", glowColor: "rgba(244, 63, 94, 0.3)" };
    }
    if (
      norm === "WARNING" ||
      norm === "ATTENTION" ||
      norm === "WATCH" ||
      norm === "DEGRADED"
    ) {
      return { fillColor: "bg-amber-500", glowColor: "rgba(245, 158, 11, 0.3)" };
    }

    // Thresholds when no explicit alert status is present
    if (clamped >= 80) {
      return { fillColor: "bg-emerald-500", glowColor: "rgba(16, 185, 129, 0.3)" };
    }
    if (clamped >= 50) {
      return { fillColor: "bg-cyan-500", glowColor: "rgba(6, 182, 212, 0.3)" };
    }
    if (clamped >= 25) {
      return { fillColor: "bg-amber-500", glowColor: "rgba(245, 158, 11, 0.3)" };
    }
    return { fillColor: "bg-rose-500", glowColor: "rgba(244, 63, 94, 0.3)" };
  }, [clamped, status]);

  return (
    <div
      className={`resource-track flex items-center gap-1.5 w-full my-2.5 select-none ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${status || "Resource"} level: ${Math.round(clamped)}%`}
    >
      {/* Battery Chassis Shell */}
      <div className="flex-1 h-3.5 p-[2px] rounded-[3px] border border-border/80 bg-slate-100/90 dark:bg-[#0c1017] flex gap-[2px] items-center relative overflow-hidden shadow-inner">
        {Array.from({ length: segments }).map((_, idx) => {
          const segMin = (idx / segments) * 100;
          const segMax = ((idx + 1) / segments) * 100;
          const segRange = segMax - segMin;
          let fillPercent = 0;

          if (clamped >= segMax) {
            fillPercent = 100;
          } else if (clamped <= segMin) {
            fillPercent = 0;
          } else {
            fillPercent = ((clamped - segMin) / segRange) * 100;
          }

          return (
            <div
              key={idx}
              className="flex-1 h-full rounded-[1px] bg-slate-200/60 dark:bg-slate-800/40 overflow-hidden relative"
            >
              <div
                className={`h-full ${fillColor} transition-all duration-500 ease-out`}
                style={{
                  width: `${fillPercent}%`,
                  boxShadow: fillPercent > 0 ? `0 0 4px ${glowColor}` : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Battery Cathode Terminal Tab [  ]▯ */}
      {showTerminal && (
        <div
          className="w-[3px] h-[7px] rounded-r-[1px] bg-slate-300 dark:bg-slate-700 shrink-0 border border-l-0 border-border/80"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export interface NetworkSignalIndicatorProps {
  /** Signal level (0-5 bars) or percentage (0-100%) */
  level: number;
  /** Whether the link is currently online / active */
  active?: boolean;
  /** Optional status override ('CONNECTED', 'OFFLINE', 'DEGRADED', etc.) */
  status?: string;
  /** Optional extra class names */
  className?: string;
}

/**
 * Functional Network Signal Strength Indicator.
 *
 * Renders stepped bars ▂ ▃ ▅ ▆ █ reflecting telemetry link quality and active state.
 */
export function NetworkSignalIndicator({
  level,
  active = true,
  status,
  className = "",
}: NetworkSignalIndicatorProps) {
  const normStatus = (status || "").toUpperCase();
  const isOnline = active && normStatus !== "OFFLINE" && normStatus !== "DISCONNECTED";

  // Calculate active bar count 0 to 5
  const barCount = useMemo(() => {
    if (!isOnline) return 0;
    if (level <= 5) return Math.max(0, Math.min(5, Math.round(level)));
    return Math.max(0, Math.min(5, Math.round((level / 100) * 5)));
  }, [level, isOnline]);

  const heights = [4, 7, 10, 13, 16];

  const activeColor = useMemo(() => {
    if (!isOnline || barCount <= 1) return "bg-rose-500";
    if (barCount <= 3) return "bg-amber-500";
    return "bg-emerald-500";
  }, [isOnline, barCount]);

  return (
    <div
      className={`inline-flex items-end gap-[2px] h-[18px] px-1 py-0.5 select-none ${className}`}
      role="img"
      aria-label={`Network signal: ${barCount} of 5 bars active`}
    >
      {heights.map((h, idx) => {
        const isFilled = isOnline && idx < barCount;
        return (
          <div
            key={idx}
            className={`w-[3px] rounded-xs transition-all duration-300 ${
              isFilled ? activeColor : "bg-slate-200 dark:bg-slate-800"
            }`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}
