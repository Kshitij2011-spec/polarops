import { useState, useEffect } from "react";
import {
  ChevronRight,
  GitCompare,
  HelpCircle,
  Layers,
  Package,
  Plane,
  RefreshCw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  fetchStationComparison,
  evaluateStationComparison,
  type StationComparisonResponse,
} from "../lib/api";
import { TruthBadge } from "./TruthBadge";

export interface CrossStationContextCardProps {
  onNavigateToStations: () => void;
  onOpenExplanation: (domain: string, entityId: string) => void;
}

export function CrossStationContextCard({
  onNavigateToStations,
  onOpenExplanation,
}: CrossStationContextCardProps) {
  const [data, setData] = useState<StationComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluatedSuccess, setEvaluatedSuccess] = useState<string | null>(null);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await fetchStationComparison("STATION-BHARATI", "STATION-MAITRI");
      setData(res);
    } catch (err) {
      console.error("Failed to load cross-station comparison:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, []);

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      setEvaluatedSuccess(null);
      const res = await evaluateStationComparison("STATION-BHARATI", "STATION-MAITRI");
      setData(res);
      setEvaluatedSuccess("Cross-station alignment evaluated and logged to Operational Timeline.");
      setTimeout(() => setEvaluatedSuccess(null), 4000);
    } catch (err) {
      console.error("Failed to evaluate cross-station alignment:", err);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div
        data-testid="cross-station-context-card"
        className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-4 shadow-2xs transition-colors flex items-center justify-center min-h-[140px]"
      >
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-[#7a8194]">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-[#5b9cf5]" />
          <span>Synchronizing multi-station portfolio state (Bharati &amp; Maitri)...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { station_a, station_b, pressure_rationale } = data;

  return (
    <div
      data-testid="cross-station-context-card"
      className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md border bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#5b9cf5] border-blue-200 dark:border-blue-800/60">
            <GitCompare className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-[#e4e8f0] uppercase tracking-wider font-mono">
                Multi-Station Coordination Context
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                BHARATI UNDER ELEVATED PRESSURE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#7a8194]">
              Cross-station comparative headroom &amp; non-actuating support feasibility
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TruthBadge type="DERIVED" />
          <button
            onClick={() => onOpenExplanation("CROSS_STATION", "PORTFOLIO")}
            data-testid="explain-cross-station-btn"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium text-blue-700 dark:text-[#5b9cf5] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition-colors cursor-pointer"
            title="Explain cross-station operational differences"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Why?</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Comparison Matrix ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Metric 1: Health & Pressure */}
        <div className="rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/60 dark:bg-[#141721] p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
            <span>STATION HEALTH</span>
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                {station_a.code}: <span className="text-amber-600 dark:text-amber-400">{station_a.overall_health}%</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">{station_a.status}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                {station_b.code}: <span className="text-emerald-600 dark:text-emerald-400">{station_b.overall_health}%</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">{station_b.status}</div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-[#9ca3b4] pt-1 border-t border-slate-200/60 dark:border-[#2a2f3e]/40">
            Δ 17% health divergence
          </div>
        </div>

        {/* Metric 2: Fuel Runway */}
        <div className="rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/60 dark:bg-[#141721] p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
            <span>FUEL RUNWAY</span>
            <Zap className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                {station_a.code}: <span className="text-slate-900 dark:text-[#e4e8f0]">{station_a.fuel_runway_days ?? "—"}d</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">142.5 kL reserve</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                {station_b.code}: <span className="text-emerald-600 dark:text-emerald-400">{station_b.fuel_runway_days ?? "—"}d</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">198.0 kL reserve</div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200/60 dark:border-[#2a2f3e]/40">
            Maitri holds +62.9d reserve runway
          </div>
        </div>

        {/* Metric 3: Critical Spares */}
        <div className="rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/60 dark:bg-[#141721] p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
            <span>SK-402 SPARES</span>
            <Package className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                {station_a.code}: 0 units
              </div>
              <div className="text-[10px] font-mono text-rose-500">STOCKOUT (G-02)</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {station_b.code}: 2 units
              </div>
              <div className="text-[10px] font-mono text-emerald-500">AVAILABLE (M-2)</div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-[#9ca3b4] pt-1 border-t border-slate-200/60 dark:border-[#2a2f3e]/40">
            Maitri has spare kit headroom
          </div>
        </div>

        {/* Metric 4: Logistics Constraint */}
        <div className="rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/60 dark:bg-[#141721] p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
            <span>FLIGHT FEASIBILITY</span>
            <Plane className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              RESTRICTED (42 kt BLIZZARD)
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
              3,000 km distance · Ski flight limit: &lt;30 kt
            </div>
          </div>
          <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200/60 dark:border-[#2a2f3e]/40">
            Overland traverse closed (Polar Winter)
          </div>
        </div>
      </div>

      {/* ── Operational Difference Rationale ────────────── */}
      <div className="p-3 rounded border border-slate-200/80 dark:border-[#2a2f3e] bg-slate-50/40 dark:bg-[#141721]/50 text-xs font-mono text-slate-700 dark:text-[#9ca3b4] leading-relaxed flex items-start gap-2">
        <span className="font-bold text-blue-600 dark:text-[#5b9cf5] shrink-0">PORTFOLIO OBSERVATION:</span>
        <span>{pressure_rationale}</span>
      </div>

      {/* ── Feedback Notification ───────────────────────── */}
      {evaluatedSuccess && (
        <div
          data-testid="alignment-success-banner"
          className="p-2.5 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium flex items-center justify-between"
        >
          <span>{evaluatedSuccess}</span>
        </div>
      )}

      {/* ── Footer Controls ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-[#2a2f3e]/60">
        <div className="text-[10px] font-mono text-slate-400 dark:text-[#656c80]">
          [OUR DESIGN] Feasibility advisory only. PolarOps never executes autonomous cargo transfers.
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            data-testid="evaluate-alignment-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-slate-700 dark:text-[#e4e8f0] bg-slate-100 dark:bg-[#1e2230] hover:bg-slate-200 dark:hover:bg-[#252a3a] border border-slate-300 dark:border-[#3d4556] transition-colors cursor-pointer disabled:opacity-50"
          >
            {evaluating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : (
              <Layers className="h-3.5 w-3.5" />
            )}
            <span>Evaluate Operational Alignment</span>
          </button>

          <button
            onClick={onNavigateToStations}
            data-testid="open-stations-portfolio-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] shadow-2xs transition-colors cursor-pointer"
          >
            <span>Station Portfolio Workspace</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
