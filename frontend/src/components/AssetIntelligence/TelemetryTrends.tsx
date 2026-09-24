import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { AssetTelemetry, AssetTelemetrySeries } from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface TelemetryTrendsProps {
  telemetry: AssetTelemetry;
}

export function TelemetryTrends({ telemetry }: TelemetryTrendsProps) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-[#e4e8f0]">
            LIVE TELEMETRY &amp; HISTORICAL TRENDS (24H WINDOW)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-[#7a8194] font-mono">
            Source: {telemetry.provenance.source}
          </span>
          <TruthBadge type="MEASURED" />
        </div>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
  const svgHeight = 56;

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

  return (
    <div
      className={`rounded-md border p-3.5 flex flex-col justify-between transition-colors shadow-2xs ${
        isCritical
          ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
          : isWarning
          ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
          : "bg-slate-50 dark:bg-[#12141c] border-slate-200 dark:border-[#2a2f3e]"
      }`}
    >
      <div>
        {/* Metric Name & Trend Pill */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0] truncate">
              {series.metric_name}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-[#6b7280] font-mono mt-0.5">
              ID: {series.metric_key}
            </div>
          </div>

          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
              series.trend === "RISING"
                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : series.trend === "FALLING"
                ? "bg-sky-50 dark:bg-cyan-950 text-sky-700 dark:text-cyan-300 border-sky-200 dark:border-cyan-800"
                : "bg-slate-100 dark:bg-[#181b24] text-slate-600 dark:text-[#7a8194] border-slate-200 dark:border-[#2a2f3e]"
            }`}
          >
            {series.trend === "RISING" ? (
              <ArrowUpRight className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            ) : series.trend === "FALLING" ? (
              <ArrowDownRight className="h-3 w-3 text-sky-600 dark:text-cyan-400" />
            ) : (
              <Minus className="h-3 w-3 text-slate-400 dark:text-[#6b7280]" />
            )}
            <span>{series.trend}</span>
          </span>
        </div>

        {/* Current Metric Value */}
        <div className="flex items-baseline justify-between mt-1 font-mono">
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#e4e8f0]">
            {series.current_value.toFixed(1)} <span className="text-xs font-normal text-slate-400 dark:text-[#7a8194]">{series.unit}</span>
          </div>

          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              isCritical
                ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800"
                : isWarning
                ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
            }`}
          >
            {isCritical || isWarning ? "ABOVE THRESHOLD" : "NOMINAL"}
          </span>
        </div>

        {/* Trend description */}
        <div className="text-[11px] text-slate-500 dark:text-[#7a8194] mt-1 font-mono">
          {series.trend === "RISING" ? (
            <span className="text-amber-700 dark:text-amber-400 font-semibold">
              {series.trend_description}
            </span>
          ) : series.trend === "FALLING" ? (
            <span className="text-sky-700 dark:text-cyan-400 font-semibold">
              {series.trend_description}
            </span>
          ) : (
            <span>{series.trend_description}</span>
          )}
        </div>
      </div>

      {/* 24h Historical Sparkline SVG */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#2a2f3e]/60">
        <div className="w-full relative h-[56px] overflow-hidden bg-white dark:bg-[#0c0e14] rounded-md border border-slate-200 dark:border-[#2a2f3e] p-1 shadow-2xs">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Warning Threshold Line */}
            {threshY !== null && (
              <line
                x1="0"
                y1={threshY}
                x2={svgWidth}
                y2={threshY}
                stroke={isCritical ? "#f87171" : isWarning ? "#fbbf24" : "#94a3b8"}
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
            )}

            {/* Sparkline polyline */}
            <polyline
              fill="none"
              stroke={isCritical ? "#e11d48" : isWarning ? "#d97706" : "#0284c7"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineCoords}
            />
          </svg>
        </div>

        {/* Sparkline Footer Metadata */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#7a8194] font-mono mt-1.5">
          <span>Threshold limit:</span>
          <span className={`font-bold ${isCritical ? "text-rose-600 dark:text-rose-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-[#e4e8f0]"}`}>
            {series.warning_threshold != null ? `${series.warning_threshold.toFixed(1)} ${series.unit}` : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
