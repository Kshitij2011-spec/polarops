import React, { useState, useMemo } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  Cpu,
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Layers,
  Wrench,
  Package,
  Ship,
  Flame,
  Zap,
  Clock,
  ChevronRight,
  Info,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useAssetDetail } from "@/hooks/useAssetDetail";
import { useAssetTelemetry } from "@/hooks/useAssetTelemetry";
import { useAssetRisk } from "@/hooks/useAssetRisk";
import { useAssetDependencies } from "@/hooks/useAssetDependencies";
import { OperationalTopology } from "./OperationalTopology";
import { TelemetrySparkline } from "./TelemetrySparkline";
import { StatusBadge, PageHeader, Panel } from "./polarops";
import { ExplanationDrawer } from "./polarops";

export function DigitalTwinPage() {
  const search = useSearch({ from: "/digital-twin" });
  const navigate = useNavigate();

  // Normalize search asset: map old 'power' or undefined to 'G-02'
  const initialAsset = search.asset && search.asset !== "power" ? search.asset : "G-02";
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAsset);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const stationId = "STATION-BHARATI";

  // Real backend queries
  const { data: assetList, isLoading: assetsLoading, isError: assetsError, refetch: refetchAssets } = useAssets(stationId);
  const { data: assetDetail, isLoading: detailLoading, isError: detailError, refetch: refetchDetail } = useAssetDetail(selectedAssetId);
  const { data: telemetry, isLoading: telemLoading, isError: telemError, refetch: refetchTelem } = useAssetTelemetry(selectedAssetId, 50);
  const { data: risk, isLoading: riskLoading, isError: riskError, refetch: refetchRisk } = useAssetRisk(selectedAssetId);
  const { data: deps, isLoading: depsLoading, isError: depsError, refetch: refetchDeps } = useAssetDependencies(selectedAssetId, 5);

  const handleSelectAsset = (assetCode: string) => {
    setSelectedAssetId(assetCode);
    setSelectedNodeId(undefined);
    navigate({ to: "/digital-twin", search: { asset: assetCode } });
  };

  const handleRetryAll = () => {
    refetchAssets();
    refetchDetail();
    refetchTelem();
    refetchRisk();
    refetchDeps();
  };

  const anyError = assetsError || detailError || telemError || riskError || depsError;

  return (
    <>
      <PageHeader
        eyebrow="BHARATI STATION · ASSET INTELLIGENCE & TOPOLOGY"
        title="Station Digital Twin"
        subtitle="Authoritative equipment state, sensor telemetry history, multi-hop dependency blast radius, and 6-factor explainable risk modeling."
        status={assetDetail ? `${assetDetail.code} · ${assetDetail.status}` : "SYNCHRONIZING..."}
      />

      {/* Global Error Banner if any critical query fails */}
      {anyError && (
        <div className="mb-6 p-4 border border-destructive/40 bg-destructive/10 rounded-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <h4 className="font-heading font-bold text-xs tracking-wider text-destructive">
                TELEMETRY SYNCHRONIZATION WARNING
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                One or more asset intelligence feeds encountered a retrieval error from the FastAPI backend.
              </p>
            </div>
          </div>
          <button
            onClick={handleRetryAll}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-mono font-bold rounded hover:opacity-90 shrink-0"
          >
            RETRY SYNC
          </button>
        </div>
      )}

      {/* ── ASSET SELECTOR TOOLBAR ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-primary flex items-center gap-1.5">
            <Boxes className="w-4 h-4" /> STATION ASSETS:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {assetsLoading ? (
              <span className="text-xs font-mono text-muted-foreground animate-pulse">Loading asset directory...</span>
            ) : assetList && assetList.length > 0 ? (
              assetList.map((a) => {
                const isSelected = a.code === selectedAssetId || a.id === selectedAssetId;
                return (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAsset(a.code)}
                    data-testid={`asset-tab-${a.code}`}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                    }`}
                  >
                    <span>{a.code}</span>
                    <span className="ml-1.5 opacity-70 text-[10px]">
                      {a.status === "CRITICAL" ? "🔴" : a.status === "WARNING" ? "🟡" : "🟢"}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs font-mono text-muted-foreground">No assets found for {stationId}</span>
            )}
          </div>
        </div>

        {/* Quick jump to G-02 incident focus */}
        {selectedAssetId !== "G-02" && (
          <button
            onClick={() => handleSelectAsset("G-02")}
            className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-4"
          >
            JUMP TO CRITICAL ASSET (G-02) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── LEVEL 1: ASSET BRIEFING PANEL ─────────────────────────────────── */}
      <section className="mb-6 border border-border bg-card rounded-lg p-5 shadow-sm" data-testid="level-1-briefing">
        {detailLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted/60 rounded w-1/3" />
            <div className="h-16 bg-muted/40 rounded" />
          </div>
        ) : assetDetail ? (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
                    LEVEL 1 · ASSET BRIEFING
                  </span>
                  <span className="text-muted-foreground text-[10px] font-mono">· {stationId}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-wide text-foreground">
                  {assetDetail.name} ({assetDetail.code})
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                  {risk?.summary ||
                    `${assetDetail.name} operational status is ${assetDetail.status}. Monitored under station critical infrastructure guidelines.`}
                </p>
              </div>

              {/* Health Score & Status Badge */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted-foreground">HEALTH SCORE</div>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {assetDetail.health_score}
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </div>
                </div>

                <div className="h-10 w-[1px] bg-border" />

                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted-foreground">RISK LEVEL</div>
                  <div className="text-2xl font-bold font-mono text-rose-400">
                    {risk?.score ?? "--"}
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </div>
                </div>

                <StatusBadge value={assetDetail.status} />

                <button
                  onClick={() => setExplanationOpen(true)}
                  data-testid="open-explanation-btn"
                  className="px-3 py-2 bg-primary text-primary-foreground font-mono text-xs font-bold rounded-lg hover:opacity-90 shadow flex items-center gap-1.5 transition-opacity"
                >
                  <Activity className="w-3.5 h-3.5" />
                  DECISION EXPLANATION
                </button>
              </div>
            </div>

            {/* Redundancy & Executive Consequence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-secondary/50 rounded border border-border">
                <span className="text-muted-foreground block text-[10px]">CATEGORY & CRITICALITY</span>
                <strong className="text-foreground text-xs block mt-1">
                  {assetDetail.category} · {assetDetail.criticality}
                </strong>
              </div>

              <div className="p-3 bg-secondary/50 rounded border border-border">
                <span className="text-muted-foreground block text-[10px]">REDUNDANCY POSTURE</span>
                <strong className="text-amber-400 text-xs block mt-1">
                  {risk?.failure_exposure?.redundancy_posture || "N+1 Active (Nominal Redundancy)"}
                </strong>
              </div>

              <div className="p-3 bg-secondary/50 rounded border border-border">
                <span className="text-muted-foreground block text-[10px]">PROVENANCE TRUTH TYPE</span>
                <strong className="text-emerald-400 text-xs block mt-1">
                  {assetDetail.provenance.truth_type} · {assetDetail.provenance.quality}
                </strong>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── LEVEL 2: CONDITION & TELEMETRY EVIDENCE ───────────────────────── */}
      <section className="mb-6" data-testid="level-2-telemetry">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
              LEVEL 2 · CONDITION & EVIDENCE
            </span>
            <h3 className="text-base font-bold font-heading text-foreground">
              Sensor Telemetry & Trend Analysis
            </h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 bg-card border border-border rounded">
            {telemetry?.series?.length ?? 0} ACTIVE TRANSDUCER CHANNELS
          </span>
        </div>

        {telemLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-card border border-border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : telemetry && telemetry.series && telemetry.series.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {telemetry.series.map((s) => (
              <TelemetrySparkline
                key={s.metric_key}
                series={s}
                provenanceSource={telemetry.provenance.source}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 border border-border rounded-lg bg-card text-center text-xs text-muted-foreground">
            No telemetry stream recorded for this asset.
          </div>
        )}
      </section>

      {/* ── LEVEL 4: OPERATIONAL TOPOLOGY & BLAST RADIUS ──────────────────── */}
      <section className="mb-6" data-testid="level-4-topology">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
              LEVEL 4 · OPERATIONAL TOPOLOGY & BLAST RADIUS
            </span>
            <h3 className="text-base font-bold font-heading text-foreground">
              Physical & Logical Multi-Hop Dependencies
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span className="px-2 py-0.5 bg-card border border-border rounded">
              AFFECTED SERVICES: {deps?.total_affected_services ?? 0}
            </span>
            <span className="px-2 py-0.5 bg-card border border-border rounded">
              AFFECTED ZONES: {deps?.total_affected_zones ?? 0}
            </span>
          </div>
        </div>

        <OperationalTopology
          assetId={selectedAssetId}
          large
          selectedNodeId={selectedNodeId}
          onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
          onInspectAsset={(code) => handleSelectAsset(code)}
        />
      </section>

      {/* ── LEVEL 3: RISK INTELLIGENCE 2.0 ─────────────────────────────────── */}
      <section className="mb-6 space-y-6" data-testid="level-3-risk">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
              LEVEL 3 · RISK INTELLIGENCE 2.0
            </span>
            <h3 className="text-base font-bold font-heading text-foreground">
              6-Factor Causal Risk Decomposition & State Transition Ladder
            </h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 bg-card border border-border rounded">
            DERIVATION: DETERMINISTIC BACKEND ENGINE
          </span>
        </div>

        {riskLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-card border border-border rounded-lg animate-pulse" />
            <div className="h-64 bg-card border border-border rounded-lg animate-pulse lg:col-span-2" />
          </div>
        ) : risk ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: State Transition Ladder & Triggers */}
            <div className="border border-border bg-card rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground">
                    STATE TRANSITION LADDER
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                    {risk.state_transition?.state_trend || "ESCALATING"}
                  </span>
                </div>

                {/* Ladder steps */}
                <div className="mt-4 space-y-2">
                  {(risk.state_transition?.ladder || ["NOMINAL", "WATCH", "ELEVATED", "HIGH", "CRITICAL"]).map(
                    (step) => {
                      const isCurrent = (risk.state_transition?.current_state || risk.level) === step;
                      return (
                        <div
                          key={step}
                          className={`flex items-center justify-between p-2 rounded border text-xs font-mono ${
                            isCurrent
                              ? "border-rose-500/60 bg-rose-500/10 font-bold text-rose-400 shadow-sm"
                              : "border-border/40 text-muted-foreground bg-secondary/30"
                          }`}
                        >
                          <span>{step}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-rose-500 text-white rounded font-bold">
                              CURRENT STATE
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Trigger reasons */}
                <div className="mt-5">
                  <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-bold block mb-2">
                    ACTIVE OPERATIONAL TRIGGERS:
                  </span>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {(risk.state_transition?.triggered_by || [
                      "Vibration reading outside nominal bounds",
                      "Maintenance blocked due to spare shortage",
                    ]).map((trig, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-secondary/40 p-2 rounded border border-border/40">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{trig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Maintenance status indicator */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">MAINTENANCE STATUS</span>
                <span className={`font-bold ${risk.maintenance_blocked ? "text-rose-400" : "text-emerald-400"}`}>
                  {risk.maintenance_blocked ? "BLOCKED (PARTS)" : "NOMINAL"}
                </span>
              </div>
            </div>

            {/* Right: Ranked Risk Drivers (Top 6) */}
            <div className="border border-border bg-card rounded-lg p-5 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground">
                  RANKED RISK DRIVERS (WEIGHTED CONTRIBUTIONS)
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  SCORE: {risk.score} / 100
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {(risk.drivers || []).map((driver) => {
                  const pct = ((driver.score / driver.max_score) * 100).toFixed(0);
                  return (
                    <div
                      key={driver.rank}
                      className="p-3 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-muted rounded border border-border">
                            #{driver.rank}
                          </span>
                          <h4 className="font-heading font-bold text-xs tracking-wide text-foreground">
                            {driver.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9.5px] font-mono px-2 py-0.5 rounded border font-bold ${
                              driver.severity === "CRITICAL"
                                ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                                : driver.severity === "HIGH"
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                            }`}
                          >
                            {driver.severity}
                          </span>
                          <span className="text-xs font-mono font-bold text-foreground">
                            {driver.score} / {driver.max_score} ({pct}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden my-2">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            driver.severity === "CRITICAL"
                              ? "bg-rose-500"
                              : driver.severity === "HIGH"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        {driver.evidence}
                      </p>

                      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground mt-2 pt-1.5 border-t border-border/30">
                        <span>RULE: {driver.derivation_rule}</span>
                        <span className="text-emerald-400 font-bold">{driver.truth_type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Exposures & Headroom Summary Cards */}
        {risk && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Failure Exposure */}
            <div className="p-4 border border-border bg-card rounded-lg">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> FAILURE EXPOSURE
                </span>
                <span className="text-[10px] text-rose-400 font-bold">
                  {risk.failure_exposure?.level || "CRITICAL"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <div>
                  <span className="text-[10px] block">AFFECTED CRITICAL SERVICES</span>
                  <strong className="text-foreground text-xs block">
                    {risk.failure_exposure?.affected_critical_services?.join(" · ") || "None"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] block">AFFECTED SPATIAL ZONES</span>
                  <strong className="text-foreground text-xs block">
                    {risk.failure_exposure?.affected_zones?.join(" · ") || "None"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Recovery Exposure */}
            <div className="p-4 border border-border bg-card rounded-lg">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-400" /> RECOVERY EXPOSURE
                </span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {risk.recovery_exposure?.level || "CRITICAL"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <div>
                  <span className="text-[10px] block">REQUIRED SPARE PART</span>
                  <strong className="text-foreground text-xs block truncate" title={risk.recovery_exposure?.spare_part_name || ""}>
                    {risk.recovery_exposure?.spare_part_number || "SK-402"} ({risk.recovery_exposure?.spare_available_quantity ?? 0} in stock)
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] block">NEXT RESUPPLY VESSEL</span>
                  <strong className="text-foreground text-xs block">
                    {risk.recovery_exposure?.resupply_vessel_name || "Maitri Express"} (ETA {risk.recovery_exposure?.resupply_days ?? 38} days)
                  </strong>
                </div>
              </div>
            </div>

            {/* Operational Headroom */}
            <div className="p-4 border border-border bg-card rounded-lg">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> OPERATIONAL HEADROOM
                </span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {risk.headroom?.rating || "COMPRESSED"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <div>
                  <span className="text-[10px] block">GENERATION RESERVE</span>
                  <strong className="text-foreground text-xs block">
                    {risk.headroom?.generation_reserve_kw ?? 120} kW available
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] block">THERMAL HOLD BUFFER</span>
                  <strong className="text-foreground text-xs block">
                    {risk.headroom?.thermal_hold_hours ?? 6.5} hours before frost hazard
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── LEVEL 5: DEEP EXPLANATION DRAWER ──────────────────────────────── */}
      <ExplanationDrawer
        open={explanationOpen}
        setOpen={setExplanationOpen}
        domain="ASSET"
        entityId={selectedAssetId}
        stationId={stationId}
      />
    </>
  );
}
