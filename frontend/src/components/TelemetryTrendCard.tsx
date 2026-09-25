import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { AssetTelemetrySeries } from "@/lib/api";

export interface TelemetryTrendCardProps {
  series: AssetTelemetrySeries;
  provenanceSource?: string;
  truthType?: string;
  className?: string;
}

function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = d.getUTCHours().toString().padStart(2, "0");
    const minutes = d.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}Z`;
  } catch {
    return isoString.split("T")[1]?.slice(0, 5) || isoString;
  }
}

export function TelemetryTrendCard({
  series,
  provenanceSource,
  truthType,
  className = "",
}: TelemetryTrendCardProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const {
    points,
    metric_key,
    metric_name,
    unit,
    current_value,
    warning_threshold,
    critical_threshold,
    threshold_status,
    trend,
    trend_description,
  } = series;

  // Chart coordinate calculation
  const { pathD, areaD, warnY, critY, coords, startLabel, midLabel, endLabel } = useMemo(() => {
    if (!points || points.length === 0) {
      return {
        pathD: "",
        areaD: "",
        warnY: null,
        critY: null,
        coords: [],
        startLabel: "",
        midLabel: "",
        endLabel: "",
      };
    }

    const values = points.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (warning_threshold !== null && warning_threshold !== undefined) {
      if (warning_threshold < min) min = warning_threshold;
      if (warning_threshold > max) max = warning_threshold;
    }
    if (critical_threshold !== null && critical_threshold !== undefined) {
      if (critical_threshold < min) min = critical_threshold;
      if (critical_threshold > max) max = critical_threshold;
    }

    const padding = (max - min) * 0.15 || 1;
    min -= padding;
    max += padding;
    const range = max - min || 1;

    const width = 440;
    const height = 100;
    const stepX = points.length > 1 ? width / (points.length - 1) : width;

    const calculatedCoords = points.map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.value - min) / range) * height;
      return { x, y, point: p };
    });

    const path = calculatedCoords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");
    const area = `${path} L ${width} ${height} L 0 ${height} Z`;

    const warnLineY =
      warning_threshold !== null && warning_threshold !== undefined
        ? height - ((warning_threshold - min) / range) * height
        : null;

    const critLineY =
      critical_threshold !== null && critical_threshold !== undefined
        ? height - ((critical_threshold - min) / range) * height
        : null;

    const startPoint = points[0];
    const midPoint = points[Math.floor(points.length / 2)];
    const endPoint = points[points.length - 1];

    const start = startPoint ? formatTimestamp(startPoint.timestamp) : "";
    const mid = midPoint ? formatTimestamp(midPoint.timestamp) : "";
    const end = endPoint ? formatTimestamp(endPoint.timestamp) : "";

    return {
      pathD: path,
      areaD: area,
      warnY: warnLineY,
      critY: critLineY,
      coords: calculatedCoords,
      startLabel: start,
      midLabel: mid,
      endLabel: end,
    };
  }, [points, warning_threshold, critical_threshold]);

  const activePoint =
    hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex].point : null;

  // Status badge styling
  let statusBadgeStyle = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (threshold_status === "CRITICAL") {
    statusBadgeStyle = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30";
  } else if (threshold_status === "WARNING") {
    statusBadgeStyle = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30";
  }

  // Trend direction styling
  const isRising = trend === "RISING";
  const isFalling = trend === "FALLING";

  // Provenance / Truth Type
  const resolvedSource = provenanceSource || "SYNTHETIC_SIMULATION";
  const resolvedTruth = truthType || points?.[0]?.truth_type || "MEASURED";

  return (
    <div
      data-testid={`telemetry-card-${metric_key}`}
      className={`p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all ${className}`}
    >
      {/* ── Top Header: Metric Identifier & Asset Metric Name ─────────── */}
      <div>
        <span className="text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase font-semibold block truncate">
          {metric_key.toUpperCase()}
        </span>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 truncate" title={metric_name}>
          {metric_name}
        </h4>

        {/* ── Current Reading & Status Badge (Row 2), Trend (Row 3) ─────── */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                {activePoint ? activePoint.value.toFixed(1) : current_value.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">{unit}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono mt-1">
              {isRising ? (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> ↑ RISING
                </span>
              ) : isFalling ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                  <TrendingDown className="w-3.5 h-3.5" /> ↓ FALLING
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <Minus className="w-3.5 h-3.5" /> → STABLE
                </span>
              )}
              {trend_description && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
                  ({trend_description.replace(/^[↑↓→]\s*/, "")})
                </span>
              )}
            </div>
          </div>

          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded border shrink-0 ${statusBadgeStyle}`}>
            {threshold_status}
          </span>
        </div>
      </div>

      {/* ── Time-Series Technical Graph ──────────────────────────────────── */}
      <div className="relative mt-3 pt-1">
        <svg
          viewBox="0 0 440 100"
          className="w-full h-24 sm:h-28 overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-${metric_key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background reference grid lines */}
          <line x1="0" y1="33" x2="440" y2="33" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />
          <line x1="0" y1="66" x2="440" y2="66" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.15" />

          {/* Warning threshold marker line */}
          {warnY !== null && (
            <g>
              <line
                x1="0"
                y1={warnY}
                x2="440"
                y2={warnY}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.65"
              />
              <text
                x="435"
                y={warnY - 3}
                fill="#f59e0b"
                fontSize="8"
                fontFamily="IBM Plex Mono, monospace"
                fontWeight="600"
                textAnchor="end"
              >
                WARN {warning_threshold}
              </text>
            </g>
          )}

          {/* Critical threshold marker line */}
          {critY !== null && (
            <g>
              <line
                x1="0"
                y1={critY}
                x2="440"
                y2={critY}
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.75"
              />
              <text
                x="435"
                y={critY - 3}
                fill="#f43f5e"
                fontSize="8"
                fontFamily="IBM Plex Mono, monospace"
                fontWeight="600"
                textAnchor="end"
              >
                CRIT {critical_threshold}
              </text>
            </g>
          )}

          {/* Subtle area fill under curve */}
          {areaD && <path d={areaD} fill={`url(#grad-${metric_key})`} />}

          {/* Active stroke line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive hover points */}
          {coords.map((c, idx) => (
            <circle
              key={idx}
              cx={c.x}
              cy={c.y}
              r={hoverIndex === idx ? 4.5 : idx === coords.length - 1 ? 3 : 1.5}
              fill={hoverIndex === idx ? "#0284c7" : idx === coords.length - 1 ? "#0284c7" : "#64748b"}
              stroke={hoverIndex === idx ? "#ffffff" : "none"}
              strokeWidth={hoverIndex === idx ? 1.5 : 0}
              opacity={hoverIndex === idx ? 1 : idx === coords.length - 1 ? 0.9 : 0.35}
              onMouseEnter={() => setHoverIndex(idx)}
              className="cursor-pointer transition-all"
            />
          ))}
        </svg>

        {/* Minimal Time Axis */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500 pt-1 px-0.5">
          <span>{startLabel}</span>
          <span className="hidden sm:inline">{midLabel}</span>
          <span>{endLabel}</span>
        </div>

        {/* Hover inspection pill */}
        {activePoint && (
          <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/90 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-700/80 mt-1">
            <span>SAMPLE: {activePoint.timestamp.split("T")[1]?.slice(0, 8) || activePoint.timestamp}</span>
            <span className="font-bold text-slate-900 dark:text-white">
              VALUE: {activePoint.value.toFixed(2)} {unit}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom Metadata Pattern: Source & Truth Type ──────────────────── */}
      <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-3">
        <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium truncate">
          {resolvedSource}
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
          {resolvedTruth}
        </span>
      </div>
    </div>
  );
}
