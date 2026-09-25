import React, { useState, useMemo } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  Flame,
  Zap,
  Package,
  Ship,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Thermometer,
  Boxes,
  CheckCircle2,
  Info,
  Plane,
  X,
  Gauge,
} from "lucide-react";
import { useFuelStatus } from "@/hooks/useFuelStatus";
import { useInventory } from "@/hooks/useInventory";
import { useResupply } from "@/hooks/useResupply";
import { useEnergyModel } from "@/hooks/useEnergyModel";
import { useRecoveryExposure } from "@/hooks/useRecoveryExposure";
import { useAssets } from "@/hooks/useAssets";
import { TruthBadge } from "./TruthBadge";
import { StatusBadge, PageHeader, Panel } from "./polarops";
import type { InventorySpareItem } from "@/lib/api";
import { useStation } from "@/context/StationContext";

export function ResourcesPage() {
  const search = useSearch({ strict: false }) as { asset?: string };
  const navigate = useNavigate();

  const stationCtx = useStation();
  const stationId = stationCtx?.activeStationId || "STATION-BHARATI";
  const comparisonStationId = stationId === "STATION-BHARATI" ? "STATION-MAITRI" : "STATION-BHARATI";

  // Pre-select asset from query param or default to G-02
  const initialAsset = search.asset || "G-02";
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAsset);

  // Search & Filter state for spares inventory
  const [inventoryFilter, setInventoryFilter] = useState<"ALL" | "CRITICAL" | "AVAILABLE">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected spare part for deep operational inspection drawer
  const [selectedSpare, setSelectedSpare] = useState<InventorySpareItem | null>(null);

  // Real backend queries
  const {
    data: fuel,
    isLoading: fuelLoading,
    isError: fuelError,
    refetch: refetchFuel,
  } = useFuelStatus(stationId);

  const {
    data: inventory,
    isLoading: invLoading,
    isError: invError,
    refetch: refetchInventory,
  } = useInventory(stationId);

  const {
    data: maitriInventory,
    isLoading: maitriInvLoading,
    isError: maitriInvError,
    refetch: refetchMaitriInventory,
  } = useInventory(comparisonStationId);

  const {
    data: resupply,
    isLoading: resLoading,
    isError: resError,
    refetch: refetchResupply,
  } = useResupply(stationId);

  const {
    data: energy,
    isLoading: energyLoading,
    isError: energyError,
    refetch: refetchEnergy,
  } = useEnergyModel(stationId);

  const {
    data: recovery,
    isLoading: recLoading,
    isError: recError,
    refetch: refetchRecovery,
  } = useRecoveryExposure(selectedAssetId);

  const {
    data: assets,
    isLoading: assetsLoading,
  } = useAssets(stationId);

  const handleSelectAsset = (assetCode: string) => {
    setSelectedAssetId(assetCode);
    navigate({ to: "/resources", search: { asset: assetCode } });
  };

  const handleInspectAssetInTwin = (assetCode: string) => {
    navigate({ to: "/digital-twin", search: { asset: assetCode } });
  };

  const handleRetryAll = () => {
    refetchFuel();
    refetchInventory();
    refetchMaitriInventory();
    refetchResupply();
    refetchEnergy();
    refetchRecovery();
  };

  const anyError = fuelError || invError || maitriInvError || resError || energyError || recError;
  const isLoading = fuelLoading || invLoading || resLoading || energyLoading || recLoading;

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) => {
      const matchesFilter =
        inventoryFilter === "ALL"
          ? true
          : inventoryFilter === "CRITICAL"
          ? item.status === "CRITICAL_SHORTAGE" || item.criticality === "CRITICAL"
          : item.status === "AVAILABLE" && item.quantity_available > 0;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.part_number.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [inventory, inventoryFilter, searchQuery]);

  // Find SK-402 in Maitri stock for cross-station mutual aid
  const maitriSk402 = useMemo(() => {
    if (!maitriInventory) return null;
    return maitriInventory.find((item) => item.part_number === "SK-402");
  }, [maitriInventory]);

  // Count critical stockouts
  const criticalStockoutsCount = useMemo(() => {
    if (!inventory) return 0;
    return inventory.filter((i) => i.quantity_available === 0 && (i.status === "CRITICAL_SHORTAGE" || i.criticality === "CRITICAL")).length;
  }, [inventory]);

  return (
    <>
      <PageHeader
        eyebrow="BHARATI STATION · OPERATIONAL RESOURCE & RECOVERY COMMAND"
        title="Resource & Logistics Command"
        subtitle="Autonomous capacity modeling, critical spare inventory, fuel endurance projections, and multi-station mutual aid."
        status={
          fuel
            ? `${fuel.projected_runway_days}d RUNWAY · ${fuel.resupply_gap_days > 0 ? "GAP IDENTIFIED" : "NOMINAL"}`
            : "SYNCHRONIZING..."
        }
      />

      {/* Global Error Banner */}
      {anyError && (
        <div className="mb-6 p-4 border border-destructive/40 bg-destructive/10 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <h4 className="font-heading font-bold text-xs tracking-wider text-destructive">
                LOGISTICS TELEMETRY RETRIEVAL WARNING
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                One or more resource intelligence feeds failed to synchronize from the FastAPI backend.
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

      {/* ── LEVEL 1: OPERATIONAL RESOURCE SITUATION ────────────────────────── */}
      <section className="mb-8" data-testid="level-1-situation">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-label">OPERATIONAL RESOURCE SITUATION</h2>
          <span className="command-label">PRIORITY TELEMETRY FEEDS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Fuel Stock & Autonomy */}
          <div className="p-4 border border-border bg-card rounded-lg flex flex-col justify-between" data-testid="fuel-stock-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  REMAINING FUEL STOCK
                </span>
                <TruthBadge type={fuel?.provenance.truth_type || "MEASURED"} />
              </div>
              <div className="text-2xl font-heading font-bold text-foreground">
                {fuel ? `${fuel.current_stock_liters.toLocaleString()} L` : "---"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {fuel ? `Capacity: ${(fuel.max_capacity_liters).toLocaleString()} L (57.0% Full)` : "Loading capacity..."}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">BURN RATE</span>
              <strong className="text-foreground">{fuel ? `${fuel.burn_rate_liters_per_hour} L/h` : "---"}</strong>
            </div>
          </div>

          {/* Card 2: Projected Fuel Runway */}
          <div className="p-4 border border-border bg-card rounded-lg flex flex-col justify-between" data-testid="fuel-runway-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  ESTIMATED RUNWAY
                </span>
                <TruthBadge type="DERIVED" />
              </div>
              <div className="text-2xl font-heading font-bold text-amber-400">
                {fuel ? `≈ ${fuel.projected_runway_days} Days` : "---"}
              </div>
              <div className="text-xs text-amber-500/90 font-mono mt-1">
                {fuel ? `Winter Target: ${fuel.winter_target_days}d (Gap: -${fuel.resupply_gap_days}d)` : "Evaluating runway..."}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">THRESHOLD</span>
              <span className="text-amber-400 font-bold">WINTER DEFICIT</span>
            </div>
          </div>

          {/* Card 3: Critical Spares Status */}
          <div className="p-4 border border-border bg-card rounded-lg flex flex-col justify-between" data-testid="spares-stockout-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  ACTIVE CRITICAL STOCKOUTS
                </span>
                <TruthBadge type="MEASURED" />
              </div>
              <div className="text-2xl font-heading font-bold text-rose-400">
                {invLoading ? "---" : `${criticalStockoutsCount} Item`}
              </div>
              <div className="text-xs text-rose-400/90 font-mono mt-1 truncate" title="SK-402 Rotary Seal Kit">
                SK-402 · 0 Available Locally
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">GATED WORK ORDER</span>
              <span className="text-rose-400 font-bold">MWO-2026-089</span>
            </div>
          </div>

          {/* Card 4: Inbound Resupply Voyage */}
          <div className="p-4 border border-border bg-card rounded-lg flex flex-col justify-between" data-testid="resupply-overview-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  NEXT INBOUND RESUPPLY
                </span>
                <TruthBadge type="SYNTHETIC" />
              </div>
              <div className="text-2xl font-heading font-bold text-primary">
                {resupply && resupply.length > 0 ? `≈ ${resupply[0]?.eta_days} Days` : "---"}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-1 truncate" title={resupply?.[0]?.vessel_name}>
                {resupply && resupply.length > 0 ? resupply[0]?.vessel_name : "Tracking maritime route..."}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">MANIFEST PAYLOAD</span>
              <strong className="text-emerald-400 font-bold">2x SK-402</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEVEL 2: RECOVERY INTELLIGENCE & DECISION PATHWAY ──────────────── */}
      <section className="mb-8" data-testid="level-2-recovery">
        <Panel
          title="EQUIPMENT RECOVERY INTELLIGENCE &amp; DECISION PATHWAY"
          subtitle="End-to-end dependency trace from asset failure through spare stockout, resupply gating, and inter-station mutual aid."
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">SELECT ASSET:</span>
              <div className="flex gap-1">
                {["G-02", "G-01", "B-01", "HVAC-02"].map((code) => (
                  <button
                    key={code}
                    data-testid={`asset-select-${code}`}
                    onClick={() => handleSelectAsset(code)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded border transition-colors ${
                      selectedAssetId === code
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {recLoading ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground">
              Tracing equipment recovery exposure from backend...
            </div>
          ) : recovery ? (
            <div className="space-y-6">
              {/* Recovery Banner Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-secondary/30 border border-border rounded-lg">
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-mono font-bold text-foreground">
                      RECOVERY STATUS FOR {recovery.asset_id} ({recovery.asset_name})
                    </span>
                    <span className="text-xs text-muted-foreground block sm:inline sm:ml-2">
                      Criticality Tier: <strong className="text-foreground">{recovery.criticality}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    data-testid="recovery-exposure-badge"
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      recovery.exposure_level === "CRITICAL" || recovery.exposure_level === "HIGH"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {recovery.exposure_level} RECOVERY EXPOSURE
                  </span>
                  <TruthBadge type={recovery.provenance.truth_type} />
                </div>
              </div>

              {/* Step-by-Step Decision Chain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs font-mono">
                {/* Step 1: Equipment */}
                <div className="p-3 border border-border bg-card rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    1. AFFECTED ASSET
                  </span>
                  <div className="font-bold text-foreground">{recovery.asset_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Code: <strong className="text-foreground">{recovery.asset_id}</strong>
                  </div>
                </div>

                {/* Step 2: Work Order */}
                <div className="p-3 border border-border bg-card rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    2. ACTIVE WORK ORDER
                  </span>
                  <div className="font-bold text-foreground">
                    {recovery.active_work_order_id || "None Pending"}
                  </div>
                  <div className="text-[11px] text-amber-400 font-bold">
                    {recovery.work_order_status || "NOMINAL"}
                  </div>
                </div>

                {/* Step 3: Required Spare */}
                <div className="p-3 border border-border bg-card rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    3. REQUIRED SPARE
                  </span>
                  <div className="font-bold text-foreground truncate" title={recovery.required_spare_part_name || ""}>
                    {recovery.required_spare_part_number || "None"}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate" title={recovery.required_spare_part_name || ""}>
                    {recovery.required_spare_part_name || "No spare required"}
                  </div>
                </div>

                {/* Step 4: Local Stock */}
                <div className={`p-3 border rounded-lg space-y-1 ${
                  recovery.quantity_available === 0 && recovery.required_spare_part_number
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                    : "border-border bg-card text-foreground"
                }`}>
                  <span className="text-[10px] font-bold uppercase block text-muted-foreground">
                    4. LOCAL STOCK
                  </span>
                  <div className="font-bold text-base">
                    {recovery.quantity_available} Available
                  </div>
                  <div className="text-[11px] font-bold">
                    {recovery.quantity_available === 0 && recovery.required_spare_part_number ? "STOCKOUT (0 UNITS)" : "IN STOCK"}
                  </div>
                </div>

                {/* Step 5: Resupply Vessel */}
                <div className="p-3 border border-sky-500/30 bg-sky-500/5 rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-sky-400 uppercase block">
                    5. INBOUND VESSEL
                  </span>
                  <div className="font-bold text-foreground truncate" title={recovery.resupply_vessel_name || ""}>
                    {recovery.resupply_vessel_name || "No Voyage"}
                  </div>
                  <div className="text-[11px] text-amber-400 font-bold">
                    {recovery.resupply_eta_days !== null && recovery.resupply_eta_days !== undefined
                      ? `ETA ≈ ${recovery.resupply_eta_days} Days`
                      : "No ETA"}
                  </div>
                </div>

                {/* Step 6: Mutual Aid */}
                <div className="p-3 border border-emerald-500/40 bg-emerald-500/10 rounded-lg space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">
                    6. MAITRI MUTUAL AID
                  </span>
                  <div className="font-bold text-foreground">
                    {maitriSk402 ? `${maitriSk402.quantity_available} Units Available` : "Checking..."}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold">
                    Locker M-2 (Airlift)
                  </div>
                </div>
              </div>

              {/* Reasoning & Operator Decision Card */}
              <div className="p-4 border border-border bg-secondary/30 rounded-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    DETERMINISTIC RECOVERY REASONING &amp; CONSTRAINTS
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      data-testid="inspect-twin-btn"
                      onClick={() => handleInspectAssetInTwin(recovery.asset_id)}
                      className="px-3 py-1 bg-secondary text-foreground text-xs font-mono font-bold rounded border border-border hover:bg-secondary/70 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      INSPECT IN DIGITAL TWIN
                    </button>
                    {recovery.required_spare_part_number && (
                      <button
                        data-testid="inspect-spare-btn"
                        onClick={() => {
                          const item = inventory?.find((i) => i.part_number === recovery.required_spare_part_number);
                          if (item) setSelectedSpare(item);
                        }}
                        className="px-3 py-1 bg-primary text-primary-foreground text-xs font-mono font-bold rounded hover:opacity-90 flex items-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5" />
                        INSPECT SPARE IN WAREHOUSE
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-foreground leading-relaxed font-sans">
                  {recovery.reasoning}
                </p>

                {recovery.assumptions && recovery.assumptions.length > 0 && (
                  <div className="pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground space-y-1">
                    <span className="font-bold text-foreground block">Evaluation Assumptions:</span>
                    {recovery.assumptions.map((assump, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{assump}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground">
              No recovery exposure data available for asset {selectedAssetId}.
            </div>
          )}
        </Panel>
      </section>

      {/* ── LEVEL 3: FUEL & CAPACITY AUTONOMY ──────────────────────────────── */}
      <section className="mb-8" data-testid="level-3-energy">
        <Panel
          title="FUEL &amp; ENERGY AUTONOMY ENGINE"
          subtitle="Deterministic thermal dissipation, hourly consumption projections, and generator capacity balance under extreme Antarctic climate."
          action={
            <div className="flex items-center gap-2">
              <TruthBadge type="DERIVED" />
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Fuel Runway Progress & Headroom */}
            <div className="space-y-4 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider text-muted-foreground">
                  STATION FUEL GAUGE
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {fuel ? `${((fuel.current_stock_liters / fuel.max_capacity_liters) * 100).toFixed(1)}% CAPACITY` : "---"}
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border" data-testid="fuel-gauge">
                <div
                  style={{
                    width: fuel ? `${(fuel.current_stock_liters / fuel.max_capacity_liters) * 100}%` : "0%",
                  }}
                  className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full transition-all duration-500"
                />
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <strong className="text-foreground">{fuel ? `${fuel.current_stock_liters.toLocaleString()} L` : "---"}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Continuous Burn:</span>
                  <strong className="text-foreground">{fuel ? `${fuel.burn_rate_liters_per_hour} L/h (~2,028 L/day)` : "---"}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Projected Runway:</span>
                  <strong className="text-amber-400">{fuel ? `≈ ${fuel.projected_runway_days} Days` : "---"}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Winter Safe Target:</span>
                  <strong className="text-foreground">{fuel ? `${fuel.winter_target_days} Days` : "---"}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Supply Shortfall:</span>
                  <strong className="text-rose-400 font-bold">{fuel ? `-${fuel.resupply_gap_days} Days Deficit` : "---"}</strong>
                </div>
              </div>
            </div>

            {/* Right: Deterministic Energy Balance Model */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider text-muted-foreground">
                  THERMAL &amp; ELECTRICAL LOAD BALANCE
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  CLIMATE-DISPATCHED MODEL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Environmental & Thermal */}
                <div className="p-3.5 border border-border bg-secondary/30 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-400 text-xs font-mono font-bold">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>CLIMATE THERMAL</span>
                  </div>
                  <div className="text-xl font-heading font-bold text-foreground">
                    {energy ? `${energy.outside_temp_celsius}°C` : "---"}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Thermal heating demand: <strong className="text-foreground font-mono">{energy ? `${energy.thermal_demand_kw} kW` : "---"}</strong> to maintain +20°C habitat.
                  </p>
                </div>

                {/* Electrical Demand */}
                <div className="p-3.5 border border-border bg-secondary/30 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>ELECTRICAL LOAD</span>
                  </div>
                  <div className="text-xl font-heading font-bold text-foreground">
                    {energy ? `${energy.projected_electrical_load_kw} kW` : "---"}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Baseline 180 kW + auxiliary cold-climate trace heating load.
                  </p>
                </div>

                {/* Fleet Generation Capacity */}
                <div className="p-3.5 border border-border bg-secondary/30 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>FLEET RESERVE</span>
                  </div>
                  <div className="text-xl font-heading font-bold text-emerald-400">
                    {energy
                      ? `${(energy.available_generation_capacity_kw - energy.projected_electrical_load_kw).toFixed(0)} kW`
                      : "---"}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {energy ? `${energy.online_generators_count} generators active` : "---"} ({energy ? `${energy.available_generation_capacity_kw} kW` : "---"} online cap).
                  </p>
                </div>
              </div>

              {/* Energy Model Assumptions */}
              {energy && energy.assumptions && (
                <div className="p-3 bg-secondary/20 border border-border/60 rounded-lg text-xs font-mono text-muted-foreground">
                  <span className="font-bold text-foreground block mb-1 text-[11px]">Model Assumptions:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                    {energy.assumptions.map((assump, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-primary">•</span>
                        <span>{assump}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </section>

      {/* ── LEVEL 4: STATION WAREHOUSE SPARES INVENTORY ────────────────────── */}
      <section className="mb-8" data-testid="level-4-spares">
        <Panel
          title="STATION WAREHOUSE CRITICAL SPARES INVENTORY"
          subtitle="Real warehouse inventory records of critical spares, storage rack positions, reserve allocations, and maintenance cross-references."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="spares-search-input"
                  type="text"
                  placeholder="Search part #, name, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-secondary text-foreground text-xs font-mono rounded border border-border focus:outline-none focus:border-primary w-48 sm:w-64"
                />
              </div>

              <div className="flex rounded border border-border overflow-hidden">
                {(["ALL", "CRITICAL", "AVAILABLE"] as const).map((filter) => (
                  <button
                    key={filter}
                    data-testid={`spares-filter-${filter}`}
                    onClick={() => setInventoryFilter(filter)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                      inventoryFilter === filter
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {invLoading ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground">
              Retrieving warehouse inventory ledger...
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground">
              No spare parts match the active search and filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono" data-testid="spares-table">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-secondary/30">
                    <th className="p-3 font-bold text-[10px] tracking-wider">PART NUMBER</th>
                    <th className="p-3 font-bold text-[10px] tracking-wider">ITEM DESCRIPTION</th>
                    <th className="p-3 font-bold text-[10px] tracking-wider">CRITICALITY</th>
                    <th className="p-3 font-bold text-[10px] tracking-wider">AVAILABLE</th>
                    <th className="p-3 font-bold text-[10px] tracking-wider">RESERVED</th>
                    <th className="p-3 font-bold text-[10px] tracking-wider">STATUS</th>
                    <th className="p-3 font-bold text-[10px] tracking-wider">RACK LOCATION</th>
                    <th className="p-3 font-bold text-[10px] tracking-wider text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredInventory.map((item) => {
                    const isSelected = selectedSpare?.id === item.id;
                    const isHero = item.part_number === "SK-402";

                    return (
                      <tr
                        key={item.id}
                        data-testid={`spare-row-${item.part_number}`}
                        className={`transition-colors hover:bg-secondary/40 ${
                          isSelected
                            ? "bg-primary/10 border-l-2 border-l-primary"
                            : isHero
                            ? "bg-rose-500/5 border-l-2 border-l-rose-500"
                            : ""
                        }`}
                      >
                        <td className="p-3 font-bold text-foreground flex items-center gap-1.5">
                          <span>{item.part_number}</span>
                          {isHero && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/40">
                              CRITICAL SHORTAGE
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground">{item.description}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              item.criticality === "CRITICAL"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-secondary text-muted-foreground border-border"
                            }`}
                          >
                            {item.criticality}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              item.quantity_available === 0 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {item.quantity_available} Units
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{item.quantity_reserved}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.status === "CRITICAL_SHORTAGE"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : item.status === "RESERVED"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{item.location}</td>
                        <td className="p-3 text-right">
                          <button
                            data-testid={`inspect-btn-${item.part_number}`}
                            onClick={() => setSelectedSpare(item)}
                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-secondary hover:bg-secondary/80 text-foreground rounded border border-border"
                          >
                            INSPECT
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>

      {/* ── LEVEL 5: INBOUND RESUPPLY & CROSS-STATION MUTUAL AID ───────────── */}
      <section className="mb-8" data-testid="level-5-logistics">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maritime Resupply Manifest */}
          <Panel
            title="SCHEDULED MARITIME RESUPPLY EXPEDITION"
            subtitle="Vessel positioning, ETA forecasting, and inbound consignment manifest for Antarctic summer/winter windows."
            action={<TruthBadge type="SYNTHETIC" />}
          >
            {resLoading ? (
              <div className="py-8 text-center text-xs font-mono text-muted-foreground">
                Querying maritime resupply fleet schedule...
              </div>
            ) : resupply && resupply.length > 0 ? (
              <div className="space-y-4">
                {resupply.map((voyage) => (
                  <div
                    key={voyage.id}
                    data-testid="maritime-resupply-card"
                    className="p-4 border border-sky-500/30 bg-sky-500/5 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                          ANTARCTIC RESEARCH EXPEDITION VESSEL
                        </span>
                        <h4 className="text-base font-heading font-bold text-foreground mt-0.5">
                          {voyage.vessel_name}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        {voyage.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">ESTIMATED ARRIVAL:</span>
                        <div className="text-base font-bold text-amber-400 mt-0.5">
                          ≈ {voyage.eta_days} Days
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">DELAY PROJECTION:</span>
                        <div className="text-base font-bold text-foreground mt-0.5">
                          {voyage.delay_days > 0 ? `+${voyage.delay_days}d Ice Delay` : "0.0 Days (On Track)"}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/50 border border-border rounded text-xs font-mono space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase block">MANIFEST PAYLOAD CARRIED:</span>
                      <div className="text-foreground font-bold">
                        {voyage.quantity}x {voyage.spare_part_number} — {voyage.spare_part_name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Direct allocation to Work Order MWO-2026-089 (G-02 Genset Recovery)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-muted-foreground">
                No active inbound resupply vessels scheduled.
              </div>
            )}
          </Panel>

          {/* Cross-Station Mutual Aid Contingency (Maitri Station) */}
          <Panel
            title="INTER-STATION MUTUAL AID CONTINGENCY"
            subtitle="Multi-station resource sharing options across Bharati and Maitri stations to bridge resupply gaps."
            action={<TruthBadge type="DERIVED" />}
          >
            {maitriInvLoading ? (
              <div className="py-8 text-center text-xs font-mono text-muted-foreground">
                Querying Maitri Station inventory records...
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  data-testid="mutual-aid-card"
                  className="p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                        CROSS-STATION CONTINGENCY · STATION-MAITRI
                      </span>
                      <h4 className="text-base font-heading font-bold text-foreground mt-0.5">
                        Maitri Emergency Spare Stock
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      TRANSFER FEASIBLE
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Maitri station warehouse currently holds surplus inventory of critical rotary seals. An emergency inter-station transfer can unblock Bharati Work Order MWO-2026-089 without awaiting the 11-day vessel arrival.
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">MAITRI SK-402 STOCK:</span>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">
                        {maitriSk402 ? `${maitriSk402.quantity_available} Units Available` : "2 Units Available"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">LOCATION AT MAITRI:</span>
                      <div className="text-base font-bold text-foreground mt-0.5">
                        {maitriSk402 ? maitriSk402.location : "Locker M-2 Spares Rack"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-secondary/50 border border-border rounded text-xs font-mono flex items-start gap-2">
                    <Plane className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block text-[11px]">Logistics Transfer Pathway:</strong>
                      <span className="text-muted-foreground text-[11px]">
                        Twin Otter ski-plane or helicopter airlift window feasible between Bharati and Maitri airstrips subject to katabatic wind thresholds (&lt;35 kt).
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 border border-border/60 rounded bg-secondary/20 text-xs font-mono text-muted-foreground">
                  <strong className="text-foreground">Proven Logistics Relationship:</strong> Cross-station asset sharing leverages the existing `/stations/compare` and `/resources/inventory` backend capabilities without synthetic mock interpolation.
                </div>
              </div>
            )}
          </Panel>
        </div>
      </section>

      {/* ── LEVEL 6: RESOURCE DETAIL INSPECTION DRAWER ─────────────────────── */}
      {selectedSpare && (
        <div
          data-testid="spare-detail-drawer"
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg bg-card border-l border-border h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="eyebrow">WAREHOUSE SPARE INSPECTION</span>
                <h3 className="text-lg font-heading font-bold text-foreground mt-1">
                  {selectedSpare.part_number} · {selectedSpare.name}
                </h3>
              </div>
              <button
                data-testid="close-drawer-btn"
                onClick={() => setSelectedSpare(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-secondary/30 rounded border border-border space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  TECHNICAL DESCRIPTION
                </span>
                <p className="text-foreground font-sans text-xs leading-relaxed">
                  {selectedSpare.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-border bg-secondary/20 rounded">
                  <span className="text-[10px] text-muted-foreground uppercase block">AVAILABLE STOCK</span>
                  <strong className={`text-base font-bold ${selectedSpare.quantity_available === 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {selectedSpare.quantity_available} Units
                  </strong>
                </div>

                <div className="p-3 border border-border bg-secondary/20 rounded">
                  <span className="text-[10px] text-muted-foreground uppercase block">RESERVED STOCK</span>
                  <strong className="text-base font-bold text-foreground">
                    {selectedSpare.quantity_reserved} Units
                  </strong>
                </div>

                <div className="p-3 border border-border bg-secondary/20 rounded">
                  <span className="text-[10px] text-muted-foreground uppercase block">CRITICALITY TIER</span>
                  <strong className="text-base font-bold text-amber-400">
                    {selectedSpare.criticality}
                  </strong>
                </div>

                <div className="p-3 border border-border bg-secondary/20 rounded">
                  <span className="text-[10px] text-muted-foreground uppercase block">STORAGE LOCATION</span>
                  <strong className="text-base font-bold text-foreground truncate" title={selectedSpare.location}>
                    {selectedSpare.location}
                  </strong>
                </div>
              </div>

              {/* Linked Work Orders */}
              <div className="p-3.5 border border-border bg-secondary/30 rounded space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  LINKED MAINTENANCE WORK ORDERS
                </span>
                {selectedSpare.work_order_ids && selectedSpare.work_order_ids.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedSpare.work_order_ids.map((woId) => (
                      <div key={woId} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                        <span className="font-bold text-foreground">{woId}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40">
                          BLOCKED (PARTS)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">No active maintenance work orders depend on this part.</span>
                )}
              </div>

              {/* Inbound Supply Link */}
              <div className="p-3.5 border border-sky-500/30 bg-sky-500/5 rounded space-y-2">
                <span className="text-[10px] text-sky-400 uppercase font-bold block">
                  INBOUND MARITIME REPLENISHMENT
                </span>
                {resupply?.some((r) => r.spare_part_number === selectedSpare.part_number) ? (
                  <div>
                    <div className="font-bold text-foreground">
                      Carried by MV Vasiliy Golovnin (ETA ≈ 11 Days)
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      2 units in transit through southern pack ice.
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">No inbound maritime resupply order tracked for this part.</span>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                {selectedSpare.part_number === "SK-402" && (
                  <button
                    onClick={() => {
                      setSelectedSpare(null);
                      handleInspectAssetInTwin("G-02");
                    }}
                    className="w-full py-2 bg-primary text-primary-foreground font-mono font-bold text-xs rounded hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    VIEW DIESEL GENERATOR G-02 IN DIGITAL TWIN
                  </button>
                )}
                <button
                  onClick={() => setSelectedSpare(null)}
                  className="w-full py-2 bg-secondary text-foreground font-mono font-bold text-xs rounded border border-border hover:bg-secondary/80"
                >
                  CLOSE INSPECTION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
