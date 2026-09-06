import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { AssetTelemetry, AssetTelemetrySeries } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface TelemetryTrendsProps {
  telemetry: AssetTelemetry;
}

export function TelemetryTrends({ telemetry }: TelemetryTrendsProps) {
  return (
    <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-polar-700">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-polar-200">
            LIVE TELEMETRY &amp; HISTORICAL TRENDS (24H WINDOW)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-polar-400 font-mono">
            Source: {telemetry.provenance.source}
          </span>
          <TruthBadge type="MEASURED" />
        </div>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {telemetry.series.map((s) => (
          <TelemetrySeriesCard key={s.metric_key} series={s} />
        ))}
      </div>
    </div>
  );
}

function TelemetrySeriesCard({ series }: { series: AssetTelemetrySeries }) {
  const isWarning = series.threshold_status === "WARNING";
  const isCritical = series.threshold_status === "CRITICAL";

  // Build SVG sparkline path
  const points = series.points;
  const values = points.map((p) => p.value);
  const defaultVal = values[0] ?? 0;
  const thresh = series.warning_threshold ?? defaultVal;
  const minVal = Math.min(...values, thresh) * 0.95;
  const maxVal = Math.max(...values, thresh) * 1.05;
  const range = maxVal - minVal || 1.0;

  const svgWidth = 240;
  const svgHeight = 60;

  const polylineCoords = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1 || 1)) * svgWidth;
      const y = svgHeight - ((p.value - minVal) / range) * svgHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Threshold line position
  const threshY =
    series.warning_threshold !== null && series.warning_threshold !== undefined
      ? svgHeight - ((series.warning_threshold - minVal) / range) * svgHeight
      : null;

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div
      className={`rounded-lg border p-4 flex flex-col justify-between transition-all ${
        isCritical
          ? "bg-rose-950/20 border-rose-800/80"
          : isWarning
          ? "bg-amber-950/20 border-amber-800/80"
          : "bg-polar-900/80 border-polar-700/80"
      }`}
    >
      <div>
        {/* Metric Name & Trend Pill */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-xs font-mono font-bold text-polar-200 truncate">
              {series.metric_name}
            </div>
            <div className="text-[10px] text-polar-500 font-mono mt-0.5">
              ID: {series.metric_key}
            </div>
          </div>

          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
              series.trend === "RISING"
                ? "bg-amber-950 text-amber-300 border-amber-700"
                : series.trend === "FALLING"
                ? "bg-cyan-950 text-cyan-300 border-cyan-700"
                : "bg-polar-800 text-polar-400 border-polar-700"
            }`}
          >
            {series.trend === "RISING" && <ArrowUpRight className="h-3 w-3" />}
            {series.trend === "FALLING" && <ArrowDownRight className="h-3 w-3" />}
            {series.trend === "STABLE" && <Minus className="h-3 w-3" />}
            <span>{series.trend}</span>
          </span>
        </div>

        {/* Current Value & Threshold Status */}
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-2xl font-bold font-mono tracking-tight text-polar-100">
            {series.current_value.toFixed(1)}{" "}
            <span className="text-xs font-normal text-polar-400">{series.unit}</span>
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
            {series.threshold_status === "NOMINAL" ? "NOMINAL" : "ABOVE THRESHOLD"}
          </span>
        </div>

        {/* Trend description & thresholds */}
        <div className="text-[11px] font-mono mt-1 text-polar-400">
          {series.trend_description}
        </div>
        {series.warning_threshold !== null && series.warning_threshold !== undefined && (
          <div className="flex items-center justify-between text-[10px] font-mono text-polar-500 mt-1">
            <span>Threshold limit:</span>
            <span className="text-amber-400 font-semibold">
              {series.warning_threshold.toFixed(1)} {series.unit}
            </span>
          </div>
        )}
      </div>

      {/* SVG Sparkline visualization */}
      <div className="mt-4 pt-2 border-t border-polar-800/80">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-12 overflow-visible"
        >
          {/* Threshold reference line */}
          {threshY !== null && threshY >= 0 && threshY <= svgHeight && (
            <line
              x1="0"
              y1={threshY}
              x2={svgWidth}
              y2={threshY}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="opacity-60"
            />
          )}

          {/* Sparkline curve */}
          <polyline
            fill="none"
            stroke={isCritical ? "#f87171" : isWarning ? "#fbbf24" : "#22d3ee"}
            strokeWidth="2"
            points={polylineCoords}
          />

          {/* Latest point dot */}
          {lastPoint && (
            <circle
              cx={svgWidth}
              cy={svgHeight - ((lastPoint.value - minVal) / range) * svgHeight}
              r="3.5"
              fill={isCritical ? "#f87171" : isWarning ? "#fbbf24" : "#22d3ee"}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
