import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Flame,
  HelpCircle,
  Layers,
  MapPin,
  Play,
  RefreshCw,
} from "lucide-react";
import {
  fetchStationComparison,
  evaluateStationComparison,
  simulateCrossStationScenario,
  type StationComparisonResponse,
  type CrossStationScenarioResponse,
} from "../../lib/api";
import { TruthBadge } from "../TruthBadge";

export interface StationsViewProps {
  onBack: () => void;
  onOpenExplanation?: (domain: string, entityId: string) => void;
}

export function StationsView({ onBack, onOpenExplanation }: StationsViewProps) {
  const [data, setData] = useState<StationComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);

  // Cross-station scenario state
  const [scenarioDurationHours, setScenarioDurationHours] = useState<number>(72.0);
  const [scenarioTempOverride, setScenarioTempOverride] = useState<number>(-28.5);
  const [simulatingScenario, setSimulatingScenario] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<CrossStationScenarioResponse | null>(null);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await fetchStationComparison("STATION-BHARATI", "STATION-MAITRI");
      setData(res);
    } catch (err) {
      console.error("Failed to load station comparison:", err);
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
      const res = await evaluateStationComparison("STATION-BHARATI", "STATION-MAITRI");
      setData(res);
      setEvaluationFeedback("Cross-station alignment evaluated and logged to Operational Timeline.");
      setTimeout(() => setEvaluationFeedback(null), 4000);
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRunCrossStationScenario = async () => {
    try {
      setSimulatingScenario(true);
      const res = await simulateCrossStationScenario({
        disrupted_station_id: "STATION-BHARATI",
        support_station_id: "STATION-MAITRI",
        target_asset_id: "G-02",
        duration_hours: scenarioDurationHours,
        ambient_temp_celsius: scenarioTempOverride,
      });
      setScenarioResult(res);
    } catch (err) {
      console.error("Cross-station scenario simulation failed:", err);
    } finally {
      setSimulatingScenario(false);
    }
  };

  if (loading) {
    return (
      <div
        data-testid="stations-loading-indicator"
        className="flex flex-col items-center justify-center min-h-[420px] gap-4 rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white/70 dark:bg-[#181b24]/40 p-12 backdrop-blur-sm"
      >
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-[#5b9cf5]" />
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
            QUERYING MULTI-STATION PORTFOLIO BUS…
          </div>
          <p className="text-xs text-slate-500 dark:text-[#7a8194] mt-1 font-mono">
            Comparing canonical operational state between Bharati Station and Maitri Station
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { station_a, station_b } = data;

  return (
    <div className="space-y-6 animate-fade-in pb-16 transition-colors" data-testid="stations-view">
      {/* ── Top Navigation & Route Bar ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          aria-label="Return to Station Command Center"
          data-testid="stations-back-btn"
          className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] px-3 py-1.5 text-xs font-mono font-medium text-slate-700 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:border-slate-300 dark:hover:border-[#3d4556] transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Command Center</span>
        </button>

        <div className="flex items-center gap-2.5">
          <TruthBadge type="DERIVED" />
          <button
            onClick={() => onOpenExplanation?.("CROSS_STATION", "PORTFOLIO")}
            data-testid="stations-explain-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold text-blue-700 dark:text-[#5b9cf5] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition-colors cursor-pointer shadow-2xs"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Why This Comparison?</span>
          </button>
        </div>
      </div>

      {/* ── Station Comparison Cards (Bharati vs Maitri) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bharati Station Card */}
        <div
          data-testid="station-card-bharati"
          className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-mono font-bold text-xs">
                BHARATI
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                  {station_a.name}
                </h2>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#7a8194]">
                  <MapPin className="h-3 w-3" />
                  <span>Larsemann Hills (69°24′S 76°11′E)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                {station_a.status} ({station_a.overall_health}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded border border-slate-200/80 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] p-2.5">
              <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">FUEL RUNWAY</div>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-[#e4e8f0] mt-0.5">
                {station_a.fuel_runway_days ?? "—"} days
              </div>
              <div className="text-[10px] font-mono text-slate-400">142,500 L on hand</div>
            </div>

            <div className="rounded border border-slate-200/80 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] p-2.5">
              <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">WEATHER</div>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-[#e4e8f0] mt-0.5">
                {station_a.temperature_celsius}°C
              </div>
              <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                {station_a.wind_speed_knots} kt BLIZZARD
              </div>
            </div>

            <div className="rounded border border-slate-200/80 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] p-2.5">
              <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">SK-402 SPARES</div>
              <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {station_a.critical_spares_available} available
              </div>
              <div className="text-[10px] font-mono text-rose-500 font-semibold">G-02 STOCKOUT</div>
            </div>
          </div>

          <div className="rounded border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-2.5 text-xs font-mono text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>Active Incidents: {station_a.active_incidents_count} (Primary Generator Degradation)</span>
            <span className="font-bold">Comms: {station_a.comms_status} (2.0 Mbps)</span>
          </div>
        </div>

        {/* Maitri Station Card */}
        <div
          data-testid="station-card-maitri"
          className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-mono font-bold text-xs">
                MAITRI
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-900 dark:text-[#e4e8f0]">
                  {station_b.name}
                </h2>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#7a8194]">
                  <MapPin className="h-3 w-3" />
                  <span>Schirmacher Oasis (70°46′S 11°44′E)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                {station_b.status} ({station_b.overall_health}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded border border-slate-200/80 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] p-2.5">
              <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">FUEL RUNWAY</div>
              <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {station_b.fuel_runway_days ?? "—"} days
              </div>
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                +62.9d reserve surplus
              </div>
            </div>

            <div className="rounded border border-slate-200/80 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] p-2.5">
              <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">WEATHER</div>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-[#e4e8f0] mt-0.5">
                {station_b.temperature_celsius}°C
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
                {station_b.wind_speed_knots} kt {station_b.conditions}
              </div>
            </div>

            <div className="rounded border border-slate-200/80 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] p-2.5">
              <div className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">SK-402 SPARES</div>
              <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {station_b.critical_spares_available} available
              </div>
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                LOCKER M-2 STOCKED
              </div>
            </div>
          </div>

          <div className="rounded border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>Active Incidents: {station_b.active_incidents_count} (Nominal Fleet)</span>
            <span className="font-bold">Comms: {station_b.comms_status} (512 kbps)</span>
          </div>
        </div>
      </div>

      {/* ── Operational Capabilities Headroom (0-100) ────── */}
      <div
        data-testid="operational-capabilities-section"
        className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-[#e4e8f0]">
              Modeled Operational Capability Headroom
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-[#7a8194]">
              Derived buffer margins across core station survival and science domains (0–100 score)
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-[#656c80]">
            FORMULA: Derived from canonical fuel burn, generator fleets, comms links &amp; spare stocks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {station_a.capabilities.map((capA, idx) => {
            const capB = station_b.capabilities[idx] ?? capA;
            const delta = capB.headroom_score - capA.headroom_score;
            return (
              <div
                key={capA.domain}
                data-testid={`capability-card-${capA.domain.toLowerCase()}`}
                className="rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] p-3 space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-[#7a8194] uppercase truncate">
                    {capA.name}
                  </div>

                  {/* Bharati Score */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-[#9ca3b4]">Bharati:</span>
                      <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                        {capA.headroom_score}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-[#2a2f3e] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          capA.headroom_score < 40
                            ? "bg-rose-500"
                            : capA.headroom_score < 70
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${capA.headroom_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Maitri Score */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-[#9ca3b4]">Maitri:</span>
                      <span className="font-bold text-slate-800 dark:text-[#e4e8f0]">
                        {capB.headroom_score}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-[#2a2f3e] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          capB.headroom_score < 40
                            ? "bg-rose-500"
                            : capB.headroom_score < 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${capB.headroom_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-[#2a2f3e]/40 text-[10px] font-mono">
                  <span
                    className={
                      delta > 0
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : delta < 0
                        ? "text-blue-600 dark:text-[#5b9cf5] font-bold"
                        : "text-slate-400"
                    }
                  >
                    {delta > 0
                      ? `Maitri +${delta}% headroom`
                      : delta < 0
                      ? `Bharati +${Math.abs(delta)}% headroom`
                      : "Parity"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Operational Differences Table ───────────────── */}
      <div
        data-testid="operational-differences-section"
        className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-[#e4e8f0]">
            Deterministic Operational Differences
          </h3>
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
            Evaluates structural divergence across critical survival axes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono" data-testid="differences-table">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2a2f3e] text-slate-500 dark:text-[#7a8194]">
                <th className="py-2.5 px-3">DIMENSION</th>
                <th className="py-2.5 px-3">BHARATI VALUE</th>
                <th className="py-2.5 px-3">MAITRI VALUE</th>
                <th className="py-2.5 px-3">OPERATIONAL DELTA</th>
                <th className="py-2.5 px-3">PRESSURE AXIS</th>
                <th className="py-2.5 px-3">SEVERITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2a2f3e]/60">
              {data.differences.map((diff) => (
                <tr
                  key={diff.dimension}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#141721]/60 transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-[#e4e8f0]">
                    {diff.title}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-[#c4cbd8]">
                    {diff.station_a_value}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-[#c4cbd8]">
                    {diff.station_b_value}
                  </td>
                  <td className="py-2.5 px-3 text-blue-700 dark:text-[#5b9cf5] font-semibold">
                    {diff.delta_summary}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        diff.pressure_direction === "BHARATI_HIGHER"
                          ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                          : diff.pressure_direction === "MAITRI_HIGHER"
                          ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {diff.pressure_direction.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        diff.significance === "CRITICAL"
                          ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                          : diff.significance === "MODERATE"
                          ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {diff.significance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Coordination Constraints & Advisory Considerations ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coordination Constraints */}
        <div
          data-testid="coordination-constraints-card"
          className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-[#e4e8f0]">
              Coordination &amp; Logistics Constraints
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
              Physical &amp; Meteorological Limits
            </span>
          </div>

          <div className="space-y-3">
            {data.constraints.map((c) => (
              <div
                key={c.constraint_type}
                className="p-3 rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                    {c.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      c.status === "RESTRICTED" || c.status === "IMPASSABLE"
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                        : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-mono">{c.details}</p>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-mono font-semibold pt-0.5">
                  Operational Impact: {c.impact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Station Considerations */}
        <div
          data-testid="cross-station-considerations-card"
          className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-[#e4e8f0]">
              Advisory Coordination Considerations
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-[#7a8194]">
              Human-in-the-Loop Decision Support
            </span>
          </div>

          <div className="space-y-3">
            {data.considerations.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-700 dark:text-[#5b9cf5]">
                    {item.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-200 dark:bg-[#252a3a] text-slate-700 dark:text-[#c4cbd8]">
                    {item.feasibility_status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-[#e4e8f0] font-mono leading-relaxed">
                  {item.recommendation}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-[#7a8194] font-mono">
                  Rationale: {item.rationale}
                </div>
                {item.prerequisites.length > 0 && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono pt-1">
                    Prerequisites: {item.prerequisites.join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          {evaluationFeedback && (
            <div className="p-2.5 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium">
              {evaluationFeedback}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              data-testid="stations-evaluate-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold text-slate-700 dark:text-[#e4e8f0] bg-slate-100 dark:bg-[#1e2230] hover:bg-slate-200 dark:hover:bg-[#252a3a] border border-slate-300 dark:border-[#3d4556] transition-colors cursor-pointer disabled:opacity-50"
            >
              {evaluating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              ) : (
                <Layers className="h-3.5 w-3.5" />
              )}
              <span>Record Analysis in Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Cross-Station Scenario Simulation ───────────── */}
      <div
        data-testid="cross-station-scenario-section"
        className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#2a2f3e]/60 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-[#e4e8f0]">
              Cross-Station Disruption Scenario Simulation
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Bharati Disruption Coupled with Maitri Available Capacity
          </span>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-600 dark:text-[#9ca3b4]">
              Disruption Duration (Hours):
            </label>
            <input
              type="number"
              value={scenarioDurationHours}
              onChange={(e) => setScenarioDurationHours(parseFloat(e.target.value) || 72)}
              className="w-full rounded border border-slate-300 dark:border-[#3d4556] bg-slate-50 dark:bg-[#141721] px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-[#e4e8f0]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-600 dark:text-[#9ca3b4]">
              Ambient Temperature (°C):
            </label>
            <input
              type="number"
              value={scenarioTempOverride}
              onChange={(e) => setScenarioTempOverride(parseFloat(e.target.value) || -28.5)}
              className="w-full rounded border border-slate-300 dark:border-[#3d4556] bg-slate-50 dark:bg-[#141721] px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-[#e4e8f0]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunCrossStationScenario}
              disabled={simulatingScenario}
              data-testid="run-cross-station-scenario-btn"
              className="w-full flex items-center justify-center gap-2 rounded bg-blue-600 hover:bg-blue-700 dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-white px-4 py-2 text-xs font-mono font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {simulatingScenario ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Run Cross-Station Simulation</span>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs font-mono text-blue-800 dark:text-blue-300">
          [OUR DESIGN] Evaluates cross-station operational differences and advisory support considerations. Does NOT execute or simulate physical cargo/fuel transfers.
        </div>

        {/* Scenario Output */}
        {scenarioResult && (
          <div
            data-testid="cross-station-scenario-results"
            className="space-y-4 pt-3 border-t border-slate-200 dark:border-[#2a2f3e]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] space-y-2">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                  DISRUPTED STATION: {scenarioResult.disrupted_station_name}
                </div>
                <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-mono leading-relaxed">
                  {scenarioResult.disruption_summary}
                </p>
                <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                  Remaining Reserve Margin: {scenarioResult.reserve_margin_disrupted_kw} kW
                </div>
              </div>

              <div className="p-4 rounded border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/50 dark:bg-[#141721] space-y-2">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                  SUPPORT STATION HEADROOM: {scenarioResult.support_station_name}
                </div>
                <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-mono leading-relaxed">
                  {scenarioResult.support_capacity_summary}
                </p>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Available Reserve Headroom: +{scenarioResult.reserve_margin_support_kw} kW
                </div>
              </div>
            </div>

            {/* Decision Options */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0] uppercase">
                Advisory Decision Support Options ({scenarioResult.decision_options.length}):
              </div>
              <div className="space-y-2">
                {scenarioResult.decision_options.map((opt) => (
                  <div
                    key={opt.code}
                    className="p-3 rounded border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                        {opt.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                        {opt.risk_reduction_tier} RISK REDUCTION
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-mono leading-relaxed">
                      {opt.description}
                    </p>
                    <div className="text-[11px] text-blue-600 dark:text-[#5b9cf5] font-mono font-medium">
                      Operational Consequence: {opt.operational_impact}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {opt.disclaimer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
