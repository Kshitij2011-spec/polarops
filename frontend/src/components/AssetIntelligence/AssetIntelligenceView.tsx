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
}

export function AssetIntelligenceView({ assetId, onBack, onOpenExplanation }: AssetIntelligenceViewProps) {
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
      {/* ── 1. Hero Asset Header & Metadata ──────────────── */}
      <AssetHeader asset={asset} onBack={onBack} />

      {/* ── 2. Live Telemetry & Historical Trends ─────────── */}
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

      {/* ── 3. Explainable Risk Engine & Evidence ─────────── */}
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
        <RiskEngineCard risk={risk} onOpenExplanation={onOpenExplanation} />
      )}

      {/* ── 4. Multi-Hop Relational Dependency Blast Radius ── */}
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

      {/* ── 5. Maintenance, Spares & Resupply Logistics ───── */}
      {risk && <MaintenanceRecoveryCard risk={risk} />}
    </div>
  );
}
