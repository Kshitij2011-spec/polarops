import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { useAssetDetail } from "../../hooks/useAssetDetail";
import { useAssetDependencies } from "../../hooks/useAssetDependencies";
import { useAssetRisk } from "../../hooks/useAssetRisk";
import { useAssetTelemetry } from "../../hooks/useAssetTelemetry";
import { AssetHeader } from "./AssetHeader";
import { DependencyBlastRadius } from "./DependencyBlastRadius";
import { MaintenanceRecoveryCard } from "./MaintenanceRecoveryCard";
import { RiskEngineCard } from "./RiskEngineCard";
import { TelemetryTrends } from "./TelemetryTrends";

export interface AssetIntelligenceViewProps {
  assetId: string;
  onBack: () => void;
  onOpenExplanation?: (domain: string, entityId: string) => void;
  onNavigate?: (route: string) => void;
}

export function AssetIntelligenceView({ assetId, onBack, onOpenExplanation, onNavigate }: AssetIntelligenceViewProps) {
  const {
    data: asset,
    isLoading: isAssetLoading,
    isError: isAssetError,
    refetch: refetchAsset,
  } = useAssetDetail(assetId);

  const {
    data: telemetry,
    isLoading: isTelemetryLoading,
    isError: isTelemetryError,
  } = useAssetTelemetry(assetId, 25);

  const {
    data: dependencies,
    isLoading: isDepsLoading,
    isError: isDepsError,
  } = useAssetDependencies(assetId, 5);

  const {
    data: risk,
    isLoading: isRiskLoading,
    isError: isRiskError,
  } = useAssetRisk(assetId);

  // If primary asset query is loading
  if (isAssetLoading) {
    return (
      <div
        data-testid="asset-loading"
        className="flex flex-col items-center justify-center min-h-[400px] gap-4 rounded-xl border border-polar-700 bg-polar-800/50 p-12 backdrop-blur-sm"
      >
        <Loader2 className="h-10 w-10 animate-spin text-accent-cyan" />
        <div className="text-center font-mono">
          <div className="text-sm font-bold text-polar-200 uppercase">
            LOADING ASSET INTELLIGENCE PROFILE…
          </div>
          <p className="text-xs text-polar-400 mt-1">
            Querying sensor metrics, multi-hop dependencies, and composite risk for {assetId}
          </p>
        </div>
      </div>
    );
  }

  // If primary asset query failed
  if (isAssetError || !asset) {
    return (
      <div
        data-testid="asset-error"
        className="flex flex-col items-center justify-center min-h-[350px] gap-4 rounded-xl border-2 border-rose-800/80 bg-rose-950/20 p-8 text-center backdrop-blur-sm"
      >
        <ShieldAlert className="h-10 w-10 text-rose-400" />
        <div className="max-w-md">
          <h2 className="text-base font-bold font-mono text-rose-300 uppercase">
            Asset Telemetry Profile Unavailable
          </h2>
          <p className="text-xs text-polar-300 mt-1 leading-relaxed">
            Could not retrieve equipment data for asset ID{" "}
            <span className="font-mono font-bold text-rose-200">{assetId}</span>.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onBack}
            className="rounded-lg border border-polar-700 bg-polar-800 px-4 py-1.5 text-xs font-mono font-semibold text-polar-300 hover:text-white"
          >
            ← Back to Command Center
          </button>
          <button
            onClick={() => refetchAsset()}
            className="flex items-center gap-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700 px-4 py-1.5 text-xs font-mono font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Hero Asset Header & Metadata (Level 1: Immediate Situation) ── */}
      <AssetHeader asset={asset} onBack={onBack} />

      {/* ── 2. Operator Plain-Language Briefing (Level 2: Human Explanation) ── */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/80 dark:bg-[#151924] p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#222838]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-[#f0f3fa]">
              OPERATIONAL SITUATION BRIEFING &middot; DIESEL GENERATOR G-02
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-[#7a8194]">
            Plain-Language Human Translation &middot; Decision-Support
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] p-3.5 space-y-1.5 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-[#8b92a5]">
              1. What is happening?
            </div>
            <p className="text-xs text-slate-800 dark:text-[#d3d8e4] leading-relaxed">
              <strong className="text-amber-600 dark:text-amber-400">G-02 is degraded.</strong> Bearing vibration reached 4.8 mm/s, crossing the 4.0 mm/s warning threshold under station electrical load.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] p-3.5 space-y-1.5 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-[#8b92a5]">
              2. Why does it matter?
            </div>
            <p className="text-xs text-slate-800 dark:text-[#d3d8e4] leading-relaxed">
              G-02 carries 300 kW load. An uncommanded trip leaves Bharati with zero generation redundancy (N-0 single point of failure) during Antarctic winter.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] p-3.5 space-y-1.5 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-[#8b92a5]">
              3. What is affected?
            </div>
            <p className="text-xs text-slate-800 dark:text-[#d3d8e4] leading-relaxed">
              HVAC-02 and <strong className="text-rose-600 dark:text-rose-400">Habitat Zone 2 Heating</strong>. In -28°C blizzard conditions, indoor temperature holds for only 3 hours if power cuts.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-[#222838] bg-white dark:bg-[#181d2c] p-3.5 space-y-1.5 shadow-2xs">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-[#8b92a5]">
              4. What blocks recovery?
            </div>
            <p className="text-xs text-slate-800 dark:text-[#d3d8e4] leading-relaxed">
              Work Order MWO-2026-089 is <strong className="text-rose-600 dark:text-rose-400">BLOCKED</strong>. Seal kit SK-402 has 0 stock at Bharati. Next resupply vessel arrives in ≈ 18 days.
            </p>
          </div>
        </div>

        {/* Quick jump anchor links */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-[#222838] text-[11px] font-mono">
          <span className="text-slate-500 dark:text-[#7a8194]">EXPLORE EVIDENCE LAYERS:</span>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#risk-engine-card"
              className="px-2.5 py-1 rounded bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#2a2f3e] text-slate-700 dark:text-[#c4cad7] hover:text-blue-600 dark:hover:text-[#5b9cf5] transition-colors"
            >
              Risk Engine (91/100) &darr;
            </a>
            <a
              href="#dependency-section"
              className="px-2.5 py-1 rounded bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#2a2f3e] text-slate-700 dark:text-[#c4cad7] hover:text-blue-600 dark:hover:text-[#5b9cf5] transition-colors"
            >
              What It Affects (Blast Radius) &darr;
            </a>
            <a
              href="#maintenance-section"
              className="px-2.5 py-1 rounded bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#2a2f3e] text-slate-700 dark:text-[#c4cad7] hover:text-blue-600 dark:hover:text-[#5b9cf5] transition-colors"
            >
              Recovery &amp; Spares &darr;
            </a>
            <a
              href="#telemetry-section"
              className="px-2.5 py-1 rounded bg-white dark:bg-[#1a1e2b] border border-slate-200 dark:border-[#2a2f3e] text-slate-700 dark:text-[#c4cad7] hover:text-blue-600 dark:hover:text-[#5b9cf5] transition-colors"
            >
              Raw Sensor Telemetry &darr;
            </a>
          </div>
        </div>
      </div>

      {/* ── 3. Explainable Risk Engine & Evidence (Level 3: Supporting Operational Context) ── */}
      <div id="risk-engine-card">
        {isRiskLoading ? (
          <div className="rounded-xl border border-polar-700 bg-polar-800/40 p-8 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent-amber" />
            <span className="text-xs font-mono text-polar-400">Computing deterministic risk profile…</span>
          </div>
        ) : isRiskError || !risk ? (
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 text-xs font-mono text-amber-300">
            Risk scoring calculation unavailable.
          </div>
        ) : (
          <RiskEngineCard risk={risk} onOpenExplanation={onOpenExplanation} onNavigate={onNavigate} />
        )}
      </div>

      {/* ── 4. Multi-Hop Relational Dependency Blast Radius (Level 3: What This Could Affect) ── */}
      <div id="dependency-section">
        {isDepsLoading ? (
          <div className="rounded-xl border border-polar-700 bg-polar-800/40 p-8 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent-cyan" />
            <span className="text-xs font-mono text-polar-400">Traversing relational dependency tree…</span>
          </div>
        ) : isDepsError || !dependencies ? (
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 text-xs font-mono text-amber-300">
            Dependency tree unavailable.
          </div>
        ) : (
          <DependencyBlastRadius dependencies={dependencies} />
        )}
      </div>

      {/* ── 5. Maintenance, Spares & Resupply Logistics (Level 3: What's Blocking Recovery) ── */}
      <div id="maintenance-section">
        {risk && <MaintenanceRecoveryCard risk={risk} />}
      </div>

      {/* ── 6. Live Telemetry & Historical Trends (Level 4: Deep Engineering Evidence) ── */}
      <div id="telemetry-section">
        {isTelemetryLoading ? (
          <div className="rounded-xl border border-polar-700 bg-polar-800/40 p-8 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent-cyan" />
            <span className="text-xs font-mono text-polar-400">Loading sensor trends…</span>
          </div>
        ) : isTelemetryError || !telemetry ? (
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 text-xs font-mono text-amber-300">
            Telemetry history unavailable for this asset.
          </div>
        ) : (
          <TelemetryTrends telemetry={telemetry} />
        )}
      </div>
    </div>
  );
}
