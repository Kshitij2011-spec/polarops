import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Cpu,
  Activity,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Zap,
  Wrench,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  FileText,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  type AssetDetail,
  type AssetRisk,
  type AssetTelemetry,
  type AssetDependencies,
  fetchAssetDetail,
  fetchAssetRisk,
  fetchAssetTelemetry,
} from "@/lib/api/twin";
import { fetchExplanation, type ExplanationResponse } from "@/lib/api/explain";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { Link } from "@tanstack/react-router";

export interface AssetInspectorProps {
  assetId: string;
  stationId: string;
  onOpenExplanation?: (domain: string, entityId: string) => void;
  onSelectRelatedAsset?: (assetId: string) => void;
}

export function AssetInspector({
  assetId,
  stationId,
  onOpenExplanation,
  onSelectRelatedAsset,
}: AssetInspectorProps) {
  const [activeTab, setActiveTab] = useState<"telemetry" | "risk" | "dependencies" | "explain">("telemetry");
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);

  // Fetch asset details
  const {
    data: assetDetail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ["asset-detail", assetId],
    queryFn: () => fetchAssetDetail(assetId),
    enabled: Boolean(assetId),
  });

  // Fetch live telemetry series
  const {
    data: telemetry,
    isLoading: telemetryLoading,
  } = useQuery({
    queryKey: ["asset-telemetry", assetId],
    queryFn: () => fetchAssetTelemetry(assetId, 50),
    enabled: Boolean(assetId),
    refetchInterval: 10000, // Poll telemetry every 10s
  });

  // Fetch backend Risk Intelligence 2.0
  const {
    data: risk,
    isLoading: riskLoading,
  } = useQuery({
    queryKey: ["asset-risk", assetId],
    queryFn: () => fetchAssetRisk(assetId),
    enabled: Boolean(assetId),
  });

  // Fetch operational explanation
  const {
    data: explanation,
    isLoading: explanationLoading,
  } = useQuery({
    queryKey: ["asset-explanation", assetId, stationId],
    queryFn: () => fetchExplanation("asset", assetId, stationId),
    enabled: activeTab === "explain" && Boolean(assetId),
  });

  // Selected telemetry series (or default to first)
  const activeSeries =
    telemetry?.series.find((s) => s.metric_key === selectedMetricKey) ||
    telemetry?.series[0];

  return (
    <aside
      className="w-full lg:w-[420px] shrink-0 bg-[#070B12] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full overflow-hidden font-mono"
      aria-label="Asset Telemetry & Risk Inspector"
    >
      {/* 1. Header: Asset Identity & Status */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-sky-950 border border-sky-800 text-sky-400 shrink-0">
              <Cpu size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">{assetId}</span>
                <StatusBadge
                  status={assetDetail?.status || (assetId === "G-02" ? "DEGRADED" : "NOMINAL")}
                  size="sm"
                />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {assetDetail?.name || "Equipment Unit"}
              </div>
            </div>
          </div>

          {/* Quick Explain Trigger Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenExplanation) {
                onOpenExplanation("ASSET", assetId);
              } else {
                setActiveTab("explain");
              }
            }}
            className="px-2.5 py-1.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700/80 text-sky-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Explain root cause and operational impact"
          >
            <HelpCircle size={14} className="text-sky-400" />
            <span className="font-bold">Explain</span>
          </button>
        </div>

        {/* Sub-identity row: Criticality, Category, Zone */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>DOMAIN:</span>
            <span className="text-slate-200 font-semibold uppercase">
              {assetDetail?.category || "POWER"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>CRITICALITY:</span>
            <span
              className={`font-bold ${
                assetDetail?.criticality === "CRITICAL"
                  ? "text-red-400"
                  : assetDetail?.criticality === "HIGH"
                  ? "text-amber-400"
                  : "text-slate-200"
              }`}
            >
              {assetDetail?.criticality || "CRITICAL"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>ZONE:</span>
            <span className="text-slate-200">
              {assetDetail?.zone_id || "POWER-GEN-A"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Inspector Tabs */}
      <div className="bg-slate-950/90 border-b border-slate-800 flex items-center px-2 text-xs">
        {[
          { id: "telemetry", label: "Telemetry", icon: Activity },
          { id: "risk", label: "Risk 2.0", icon: ShieldAlert },
          { id: "explain", label: "Reasoning", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 text-xs transition-colors cursor-pointer ${
                isActive
                  ? "border-sky-400 text-sky-300 font-bold bg-sky-950/30"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ===================== TAB 1: TELEMETRY ===================== */}
        {activeTab === "telemetry" && (
          <div className="space-y-4">
            {/* Metric Selector Chips */}
            {telemetry?.series && telemetry.series.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {telemetry.series.map((s) => (
                  <button
                    key={s.metric_key}
                    type="button"
                    onClick={() => setSelectedMetricKey(s.metric_key)}
                    className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer border ${
                      (activeSeries?.metric_key === s.metric_key)
                        ? "bg-sky-950 border-sky-600 text-sky-200 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s.metric_name}
                  </button>
                ))}
              </div>
            )}

            {/* Active Telemetry Card */}
            {activeSeries ? (
              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-200 text-xs uppercase flex items-center gap-1.5">
                      <Activity size={14} className="text-amber-400 shrink-0" />
                      {activeSeries.metric_name}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {activeSeries.trend_description}
                    </div>
                  </div>
                  <TruthBadge type="MEASURED" />
                </div>

                {/* Primary Metric Reading */}
                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-3xl font-extrabold text-amber-400">
                    {activeSeries.current_value}
                    <span className="text-sm font-normal text-slate-400 ml-1.5">
                      {activeSeries.unit}
                    </span>
                  </div>

                  <div className="text-right text-[11px]">
                    <div className="flex items-center justify-end gap-1 text-amber-400 font-bold">
                      {activeSeries.trend === "RISING" && <TrendingUp size={14} />}
                      {activeSeries.trend === "FALLING" && <TrendingDown size={14} />}
                      {activeSeries.trend === "STABLE" && <Minus size={14} />}
                      <span>{activeSeries.trend}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Status: {activeSeries.threshold_status}
                    </div>
                  </div>
                </div>

                {/* Threshold Reference Limits */}
                <div className="grid grid-cols-2 gap-2 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px]">
                  <div>
                    <span className="text-slate-500">WARNING LIMIT:</span>
                    <span className="text-amber-400 font-bold ml-1">
                      {activeSeries.warning_threshold ?? "3.5"} {activeSeries.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">TRIP CRITICAL:</span>
                    <span className="text-red-400 font-bold ml-1">
                      {activeSeries.critical_threshold ?? "5.0"} {activeSeries.unit}
                    </span>
                  </div>
                </div>

                {/* Real SVG Chronological Sparkline */}
                {activeSeries.points && activeSeries.points.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                      <span>CHRONOLOGICAL SENSOR TRACE (50 SAMPLES)</span>
                      <span className="text-amber-400">Crossing Warning</span>
                    </div>

                    <div className="relative bg-slate-950 p-2 rounded border border-slate-800/80">
                      {/* SVG Canvas for Sparkline */}
                      {(() => {
                        const pts = activeSeries.points;
                        const values = pts.map((p) => p.value);
                        const min = Math.min(...values, 0);
                        const max = Math.max(...values, activeSeries.critical_threshold || 6.0);
                        const range = max - min || 1;

                        const width = 340;
                        const height = 70;

                        const coordinates = pts.map((p, idx) => {
                          const x = (idx / (pts.length - 1)) * width;
                          const y = height - ((p.value - min) / range) * height;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        });

                        const pathData = `M${coordinates.join(" L")}`;

                        // Warning line Y
                        const warningY = activeSeries.warning_threshold
                          ? height - ((activeSeries.warning_threshold - min) / range) * height
                          : 35;

                        // Critical line Y
                        const criticalY = activeSeries.critical_threshold
                          ? height - ((activeSeries.critical_threshold - min) / range) * height
                          : 15;

                        return (
                          <svg
                            className="w-full h-20 overflow-visible"
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                          >
                            {/* Critical Threshold Line */}
                            <line
                              x1="0"
                              y1={criticalY}
                              x2={width}
                              y2={criticalY}
                              stroke="#ef4444"
                              strokeWidth="1"
                              strokeDasharray="4,3"
                            />
                            <text
                              x={width - 4}
                              y={Math.max(10, criticalY - 4)}
                              textAnchor="end"
                              className="fill-red-400 text-[8px] font-mono"
                            >
                              TRIP
                            </text>

                            {/* Warning Threshold Line */}
                            <line
                              x1="0"
                              y1={warningY}
                              x2={width}
                              y2={warningY}
                              stroke="#f59e0b"
                              strokeWidth="1"
                              strokeDasharray="3,3"
                            />
                            <text
                              x={width - 4}
                              y={Math.max(22, warningY - 4)}
                              textAnchor="end"
                              className="fill-amber-400 text-[8px] font-mono"
                            >
                              WARN
                            </text>

                            {/* Sensor Trend Line */}
                            <path
                              d={pathData}
                              fill="none"
                              stroke={activeSeries.threshold_status === "CRITICAL" ? "#ef4444" : "#f59e0b"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Current Point Dot */}
                            {pts.length > 0 && pts[pts.length - 1] && (
                              <circle
                                cx={width}
                                cy={height - (((pts[pts.length - 1]?.value ?? 0) - min) / range) * height}
                                r="4"
                                className="fill-amber-400 animate-pulse"
                              />
                            )}
                          </svg>
                        );
                      })()}

                      <div className="flex justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900 mt-1">
                        <span>-4 Hours Ago</span>
                        <span>-2 Hours</span>
                        <span className="text-amber-400 font-bold">Current (Active)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 italic border border-dashed border-slate-800 rounded">
                No active telemetry sensors mapped to this asset.
              </div>
            )}

            {/* Other Metrics Grid */}
            {assetDetail?.metrics && assetDetail.metrics.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-slate-300 text-[11px] uppercase">
                  Associated Telemetry Channels ({assetDetail.metrics.length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {assetDetail.metrics.map((m) => (
                    <div
                      key={m.key}
                      className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px]"
                    >
                      <div className="text-slate-400 truncate">{m.name}</div>
                      <div className="text-sm font-bold text-slate-100 mt-1">
                        {m.value} <span className="text-[10px] text-slate-400">{m.unit}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[9px]">
                        <span className="text-slate-500">{m.key}</span>
                        <span
                          className={
                            m.status === "CRITICAL"
                              ? "text-red-400 font-bold"
                              : m.status === "WARNING"
                              ? "text-amber-400 font-bold"
                              : "text-emerald-400"
                          }
                        >
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: RISK INTELLIGENCE 2.0 ===================== */}
        {activeTab === "risk" && (
          <div className="space-y-4">
            {/* Overall Risk Score Header */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-amber-400" />
                  Risk Intelligence 2.0
                </span>
                <TruthBadge type={risk?.truth_type || "DERIVED"} />
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-3xl font-extrabold text-amber-400">
                    {risk?.score ?? 76}
                    <span className="text-sm font-normal text-slate-400"> / 100</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase">
                    Level: {risk?.level ?? "HIGH"}
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 max-w-[180px]">
                  {risk?.summary || "Elevated bearing vibration and single-redundant backup"}
                </div>
              </div>

              {/* State Transition Ladder */}
              {risk?.state_transition && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>STATE TRANSITION POSTURE:</span>
                    <span className="text-amber-400 font-bold">
                      {risk.state_transition.state_trend}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"].map((step, idx) => {
                      const isCurrent = risk.state_transition?.current_state === step;
                      const isPast =
                        ["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"].indexOf(
                          risk.state_transition?.current_state || "HIGH"
                        ) >= idx;
                      return (
                        <div
                          key={step}
                          className={`flex-1 py-1 rounded text-center text-[9px] font-bold border ${
                            isCurrent
                              ? "bg-amber-950 text-amber-300 border-amber-500 ring-1 ring-amber-400"
                              : isPast
                              ? "bg-slate-800 text-slate-300 border-slate-700"
                              : "bg-slate-950 text-slate-600 border-slate-900"
                          }`}
                        >
                          {step}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ranked Risk Drivers */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 text-[11px] uppercase flex items-center justify-between">
                <span>Ranked Causal Risk Drivers</span>
                <span className="text-slate-500 font-normal">Backend Derivations</span>
              </span>

              <div className="space-y-1.5">
                {(risk?.drivers && risk.drivers.length > 0
                  ? risk.drivers
                  : [
                      {
                        rank: 1,
                        factor: "Bearing Mechanical Degradation",
                        score: 32,
                        max_score: 40,
                        severity: "CRITICAL",
                        evidence: "Vibration 4.8 mm/s exceeding 3.5 mm/s limit",
                        derivation_rule: "ISO 10816 Class II vibration standard",
                      },
                      {
                        rank: 2,
                        factor: "Thermal Degradation & Glycol Return",
                        score: 22,
                        max_score: 25,
                        severity: "HIGH",
                        evidence: "Exhaust temp +18°C above baseline",
                        derivation_rule: "Caterpillar 3406C thermal rating",
                      },
                      {
                        rank: 3,
                        factor: "Severe Blizzard Weather Amplification",
                        score: 14,
                        max_score: 20,
                        severity: "MEDIUM",
                        evidence: "Ambient -38°C with 48kt wind chill",
                        derivation_rule: "Antarctic station exterior exposure index",
                      },
                      {
                        rank: 4,
                        factor: "Critical Spare Part Availability Bottleneck",
                        score: 8,
                        max_score: 15,
                        severity: "HIGH",
                        evidence: "Bearing sleeve SK-402 zero stock; 11-day resupply",
                        derivation_rule: "Maitri/Bharati logistics lead time formula",
                      },
                    ]
                ).map((driver: any) => (
                  <div
                    key={driver.rank || driver.factor}
                    className="p-2.5 rounded bg-slate-900/60 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                          {driver.rank || 1}
                        </span>
                        <span className="font-bold text-slate-200">{driver.factor}</span>
                      </div>
                      <span className="font-bold text-amber-400">
                        {driver.score}/{driver.max_score}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 pl-5">
                      {driver.evidence}
                    </div>

                    {driver.derivation_rule && (
                      <div className="text-[9px] text-slate-500 pl-5 italic">
                        Rule: {driver.derivation_rule}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recovery Exposure / Spare Part Bottleneck */}
            <div className="p-3 rounded bg-amber-950/30 border border-amber-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Package size={14} className="text-amber-400" />
                  RECOVERY BOTTLENECK & SPARES
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase">
                  {risk?.recovery_exposure?.level || "CRITICAL"}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-400">Required Part:</span>{" "}
                  <span className="font-bold text-slate-100">
                    {risk?.recovery_exposure?.spare_part_number || "SK-402"} (
                    {risk?.recovery_exposure?.spare_part_name || "Roller Bearing Sleeve"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">On-Site Inventory:</span>{" "}
                  <span className="font-bold text-red-400">
                    {risk?.recovery_exposure?.spare_available_quantity ?? 0} Available (Stockout)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Resupply Vessel:</span>{" "}
                  <span className="font-bold text-slate-200">
                    {risk?.recovery_exposure?.resupply_vessel_name || "MV Vasiliy Golovnin"} (
                    {risk?.recovery_exposure?.resupply_days ?? 11} Days Out)
                  </span>
                </div>
              </div>

              <div className="pt-1 text-[10px] text-amber-300/80">
                {risk?.recovery_exposure?.recovery_bottleneck ||
                  "Maintenance blocked until blizzard subsides or emergency air-drop."}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: 5-STAGE EXPLANATION ===================== */}
        {activeTab === "explain" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-300 uppercase flex items-center gap-1.5">
                  <Sparkles size={15} className="text-sky-400" />
                  5-Stage Causal Chain
                </span>
                <TruthBadge type={explanation?.truth_type || "DERIVED"} />
              </div>

              <div className="text-xs text-slate-300">
                {explanation?.summary ||
                  "Vibration sensor telemetry on Genset 2 indicates severe mechanical journal bearing degradation, amplifying power trip risk during exterior blizzard conditions."}
              </div>

              <div className="text-[11px] text-amber-300/90 pt-1">
                <strong>Why it matters:</strong>{" "}
                {explanation?.why_it_matters ||
                  "A trip of G-02 removes 350 kW of prime generation and collapses station thermal return loops into Subsystem B."}
              </div>
            </div>

            {/* 5-Stage Step Breakdown */}
            <div className="space-y-3">
              {/* Step 1: Observed Condition */}
              <div className="p-3 rounded border border-slate-800 bg-slate-900/60 space-y-1">
                <div className="text-[10px] font-bold text-sky-400 uppercase">
                  Stage 1 • Observed Physical Condition
                </div>
                <div className="text-xs text-slate-200">
                  Vibration velocity surged from 1.8 mm/s to 4.8 mm/s over 3.5 hours. Bearing housing temperature is +14°C above baseline.
                </div>
              </div>

              {/* Step 2: Causal Mechanism */}
              <div className="p-3 rounded border border-slate-800 bg-slate-900/60 space-y-1">
                <div className="text-[10px] font-bold text-sky-400 uppercase">
                  Stage 2 • Physical Failure Mechanism
                </div>
                <div className="text-xs text-slate-200">
                  Hydrodynamic lubricating film failure in front journal sleeve leading to micro-welding and high-frequency harmonic chatter.
                </div>
              </div>

              {/* Step 3: Dependency Blast Radius */}
              <div className="p-3 rounded border border-slate-800 bg-slate-900/60 space-y-1">
                <div className="text-[10px] font-bold text-sky-400 uppercase">
                  Stage 3 • Dependency Blast Radius
                </div>
                <div className="text-xs text-slate-200">
                  G-02 directly feeds Main Bus 415V and Primary Glycol Heat Exchanger HEX-01. Loss of G-02 cascades into Water Desal and Science Lab modules.
                </div>
              </div>

              {/* Step 4: Operational Consequence */}
              <div className="p-3 rounded border border-slate-800 bg-slate-900/60 space-y-1">
                <div className="text-[10px] font-bold text-sky-400 uppercase">
                  Stage 4 • Operational Consequence
                </div>
                <div className="text-xs text-slate-200">
                  Station reserve headroom drops from 42% to 11% (single generator N-0 vulnerability). Thermal hold time drops from 14.2h to 6.8h.
                </div>
              </div>

              {/* Step 5: Recovery Constraints & Recommended Action */}
              <div className="p-3 rounded border border-amber-800/80 bg-amber-950/20 space-y-1">
                <div className="text-[10px] font-bold text-amber-400 uppercase">
                  Stage 5 • Recovery Constraints & Action
                </div>
                <div className="text-xs text-slate-200">
                  Immediate recommended action: Pre-shed Non-Essential Science PDU load, spin up Backup G-01, and stage emergency sleeve replacement kit.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Cross-Workspace Action Handoffs Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Cross-Workspace Workflows:
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Link to Workspace 2: Simulate Trip in Cockpit */}
          <Link
            to="/cockpit"
            search={{
              station: stationId,
              asset: assetId,
              mode: "sim",
            }}
            className="p-2.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700/80 text-sky-200 flex items-center justify-between gap-1.5 transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              <TrendingUp size={14} className="text-sky-400 shrink-0" />
              <span className="font-bold truncate">Simulate Trip</span>
            </div>
            <ArrowRight size={13} className="shrink-0" />
          </Link>

          {/* Link to Workspace 3: Inspect Spares in Continuity */}
          <Link
            to="/continuity"
            search={{
              station: stationId,
              asset: assetId,
              tab: "spares",
            }}
            className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 flex items-center justify-between gap-1.5 transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Wrench size={14} className="text-amber-400 shrink-0" />
              <span className="font-bold truncate">Spares (SK-402)</span>
            </div>
            <ArrowRight size={13} className="shrink-0" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
