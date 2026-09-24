import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { AssetTelemetrySeries } from "@/lib/api";

interface TelemetrySparklineProps {
  series: AssetTelemetrySeries;
  provenanceSource?: string;
  className?: string;
}

export function TelemetrySparkline({ series, provenanceSource, className = "" }: TelemetrySparklineProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, metric_name, unit, current_value, warning_threshold, critical_threshold, threshold_status, trend, trend_description } = series;

  // Chart coordinate math
  const { pathD, areaD, minVal, maxVal, warnY, critY, coords } = useMemo(() => {
    if (!points || points.length === 0) {
      return { pathD: "", areaD: "", minVal: 0, maxVal: 100, warnY: null, critY: null, coords: [] };
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
    const range = max - min;

    const width = 320;
    const height = 90;
    const stepX = points.length > 1 ? width / (points.length - 1) : width;

    const calculatedCoords = points.map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.value - min) / range) * height;
      return { x, y, point: p };
    });

    const path = calculatedCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
    const area = `${path} L ${width} ${height} L 0 ${height} Z`;

    const warnLineY =
      warning_threshold !== null && warning_threshold !== undefined
        ? height - ((warning_threshold - min) / range) * height
        : null;

    const critLineY =
      critical_threshold !== null && critical_threshold !== undefined
        ? height - ((critical_threshold - min) / range) * height
        : null;

    return {
      pathD: path,
      areaD: area,
      minVal: min,
      maxVal: max,
      warnY: warnLineY,
      critY: critLineY,
      coords: calculatedCoords,
    };
  }, [points, warning_threshold, critical_threshold]);

  const activePoint = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex].point : null;

  let statusBadgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (threshold_status === "CRITICAL") {
    statusBadgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/30";
  } else if (threshold_status === "WARNING") {
    statusBadgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }

  return (
    <div className={`p-4 border border-border rounded-lg bg-card flex flex-col justify-between ${className}`} data-testid={`telemetry-card-${series.metric_key}`}>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
              {series.metric_key}
            </span>
            <h4 className="font-heading font-bold text-sm tracking-wide text-foreground mt-0.5">
              {metric_name}
            </h4>
          </div>

          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusBadgeColor}`}>
            {threshold_status}
          </span>
        </div>

        {/* Current Reading & Trend */}
        <div className="flex items-baseline justify-between gap-3 mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {activePoint ? activePoint.value.toFixed(1) : current_value.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-muted-foreground">{unit}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono">
            {trend === "RISING" ? (
              <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> RISING
              </span>
            ) : trend === "FALLING" ? (
              <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                <TrendingDown className="w-3.5 h-3.5" /> FALLING
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Minus className="w-3.5 h-3.5" /> STABLE
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-1 truncate" title={trend_description}>
          {trend_description}
        </p>
      </div>

      {/* SVG Sparkline */}
      <div className="relative mt-3 pt-2">
        <svg
          viewBox="0 0 320 90"
          className="w-full h-20 overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-${series.metric_key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Warning threshold line */}
          {warnY !== null && (
            <g>
              <line x1="0" y1={warnY} x2="320" y2={warnY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <text x="315" y={warnY - 3} fill="#f59e0b" fontSize="7.5" fontFamily="var(--font-code)" textAnchor="end">
                WARN {warning_threshold}
              </text>
            </g>
          )}

          {/* Critical threshold line */}
          {critY !== null && (
            <g>
              <line x1="0" y1={critY} x2="320" y2={critY} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
              <text x="315" y={critY - 3} fill="#f43f5e" fontSize="7.5" fontFamily="var(--font-code)" textAnchor="end">
                CRIT {critical_threshold}
              </text>
            </g>
          )}

          {/* Area fill */}
          {areaD && <path d={areaD} fill={`url(#grad-${series.metric_key})`} />}

          {/* Stroke path */}
          {pathD && <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Hover hit points */}
          {coords.map((c, idx) => (
            <circle
              key={idx}
              cx={c.x}
              cy={c.y}
              r={hoverIndex === idx ? 4 : 2}
              fill={hoverIndex === idx ? "var(--primary)" : "var(--foreground)"}
              opacity={hoverIndex === idx ? 1 : 0.4}
              onMouseEnter={() => setHoverIndex(idx)}
              className="cursor-pointer transition-all"
            />
          ))}
        </svg>

        {/* Hover timestamp / value tooltip */}
        {activePoint && (
          <div className="flex items-center justify-between text-[9.5px] font-mono text-muted-foreground border-t border-border/40 pt-1 mt-1">
            <span>SAMPLE: {activePoint.timestamp.split("T")[1]?.slice(0, 8) || activePoint.timestamp}</span>
            <span className="font-bold text-foreground">VALUE: {activePoint.value.toFixed(2)} {unit}</span>
          </div>
        )}
      </div>

      {/* Provenance Footer */}
      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground border-t border-border/50 pt-2 mt-2">
        <span className="truncate">{provenanceSource || "NCPOR SCADA TELEMETRY"}</span>
        <span className="text-emerald-400 font-bold">MEASURED</span>
      </div>
    </div>
  );
}
