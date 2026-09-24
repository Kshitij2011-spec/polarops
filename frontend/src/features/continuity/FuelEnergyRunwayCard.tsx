import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Zap,
  Thermometer,
  Gauge,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Truck,
  RotateCw,
} from "lucide-react";
import { fetchFuelRunway, fetchEnergyBalance, fetchComparativeHeadroom } from "@/lib/api/runway";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { StatusBadge } from "@/components/foundation/StatusBadge";

interface FuelEnergyRunwayCardProps {
  stationId: string;
}

export function FuelEnergyRunwayCard({ stationId }: FuelEnergyRunwayCardProps) {
  const [ambientTempOverride, setAmbientTempOverride] = useState<number>(-28);
  const [isSimulatingCold, setIsSimulatingCold] = useState<boolean>(false);

  // 1. Authoritative Fuel Stock & Runway Telemetry
  const {
    data: fuel,
    isLoading: isLoadingFuel,
    refetch: refetchFuel,
  } = useQuery({
    queryKey: ["fuel-runway", stationId],
    queryFn: () => fetchFuelRunway(stationId),
  });

  // 2. Coupled Thermodynamic & Electrical Energy Balance
  const {
    data: energy,
    isLoading: isLoadingEnergy,
    refetch: refetchEnergy,
  } = useQuery({
    queryKey: ["energy-balance", stationId, isSimulatingCold ? ambientTempOverride : undefined],
    queryFn: () =>
      fetchEnergyBalance(stationId, isSimulatingCold ? ambientTempOverride : undefined),
  });

  // 3. Cross-Station Comparative Headroom (Mutual Aid without Physical Interconnect)
  const { data: comparative } = useQuery({
    queryKey: ["comparative-headroom", stationId],
    queryFn: () => fetchComparativeHeadroom(stationId),
  });

  const percentCapacity =
    fuel && fuel.max_capacity_liters > 0
      ? Math.round((fuel.current_stock_liters / fuel.max_capacity_liters) * 100)
      : 0;

  const isRunwayDeficit = fuel ? fuel.projected_runway_days < fuel.winter_target_days : false;

  return (
    <div className="space-y-6">
      {/* 1. Hero Runway Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400">
              <Flame size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                  Station Fuel Runway & Autonomous Endurance
                </h3>
                <TruthBadge type="DERIVED" source="backend:fuel_calc" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic hourly burn model derived from active generator loading and building thermal losses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                refetchFuel();
                refetchEnergy();
              }}
              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh telemetry"
              aria-label="Refresh telemetry"
            >
              <RotateCw size={14} />
            </button>
            <StatusBadge
              status={isRunwayDeficit ? "CRITICAL" : "NOMINAL"}
              label={isRunwayDeficit ? "DEFICIT THREAT" : "AUTONOMY SECURE"}
            />
          </div>
        </div>

        {/* Big Metrics Grid */}
        {isLoadingFuel ? (
          <div className="p-10 text-center font-mono text-xs text-slate-400">
            Calculating polar fuel runway telemetry...
          </div>
        ) : fuel ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Projected Runway */}
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Projected Runway
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-mono text-3xl font-extrabold ${
                      isRunwayDeficit ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {fuel.projected_runway_days}
                  </span>
                  <span className="font-mono text-xs text-slate-400">Days</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Winter Target: {fuel.winter_target_days}d</span>
                <span className={fuel.resupply_gap_days > 0 ? "text-red-400 font-bold" : "text-emerald-400"}>
                  Gap: {fuel.resupply_gap_days}d
                </span>
              </div>
            </div>

            {/* Current Stock */}
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Remaining Fuel Stock
                  </span>
                  <TruthBadge type="MEASURED" source="tank_gauges" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-extrabold text-slate-100">
                    {fuel.current_stock_liters.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-slate-400">Liters</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentCapacity < 25
                        ? "bg-red-500"
                        : percentCapacity < 45
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${percentCapacity}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 block text-right mt-1">
                  {percentCapacity}% of {fuel.max_capacity_liters.toLocaleString()} L
                </span>
              </div>
            </div>

            {/* Burn Rate */}
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Average Hourly Burn Rate
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-extrabold text-amber-400">
                    {fuel.burn_rate_liters_per_hour}
                  </span>
                  <span className="font-mono text-xs text-slate-400">L / hr</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] font-mono text-slate-400">
                Daily Consumption: ~{(fuel.burn_rate_liters_per_hour * 24).toLocaleString()} L/day
              </div>
            </div>

            {/* Resource Type & Storage */}
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Fuel Grade & Standard
                </span>
                <div className="font-mono text-lg font-bold text-slate-200">
                  {fuel.resource_type || "JET-A1 (POLAR)"}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-sans mt-2">
                Anti-icing inhibitor treated for -50°C Antarctic winter operations.
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Coupled Thermodynamic & Electrical Energy Balance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                  Coupled Energy Model & Thermal Heating Load
                </h3>
                <TruthBadge
                  type={isSimulatingCold ? "SCENARIO" : "DERIVED"}
                  source="physics:thermodynamics"
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical coupling between ambient polar air temperature, habitat thermal losses, and generator fuel burn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSimulatingCold(!isSimulatingCold)}
              className={`px-3.5 py-2 rounded font-mono text-xs flex items-center gap-2 border transition-all ${
                isSimulatingCold
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              <Thermometer size={14} />
              <span>{isSimulatingCold ? "Temp Sensitivity: ACTIVE" : "Test Cold-Snap Sensitivity"}</span>
            </button>
          </div>
        </div>

        {/* Ambient Temperature Stress Slider (when active) */}
        {isSimulatingCold && (
          <div className="mt-4 p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/30 font-mono text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-cyan-300 font-bold">
                Hypothetical Ambient Cold-Snap Override:
              </span>
              <span className="text-base font-extrabold text-cyan-400">
                {ambientTempOverride}°C
              </span>
            </div>
            <input
              type="range"
              min={-55}
              max={0}
              step={1}
              value={ambientTempOverride}
              onChange={(e) => setAmbientTempOverride(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-950"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-55°C (Extreme Blizzard)</span>
              <span>-28°C (Nominal Winter)</span>
              <span>0°C (Polar Summer)</span>
            </div>
          </div>
        )}

        {/* Energy Balance Parameters */}
        {isLoadingEnergy ? (
          <div className="p-8 text-center font-mono text-xs text-slate-400">
            Evaluating thermodynamic balance equations...
          </div>
        ) : energy ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Outside Air Temperature
              </span>
              <div className="font-mono text-2xl font-bold text-cyan-400">
                {energy.outside_temp_celsius}°C
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                {energy.weather_context || "Antarctic Continental Gradient"}
              </span>
            </div>

            <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Habitat Thermal Demand
              </span>
              <div className="font-mono text-2xl font-bold text-amber-400">
                {energy.thermal_demand_kw} kW
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                Q = 5.2 kW/°C gradient loss
              </span>
            </div>

            <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Electrical Load vs Capacity
              </span>
              <div className="font-mono text-2xl font-bold text-slate-100">
                {energy.projected_electrical_load_kw} / {energy.available_generation_capacity_kw} kW
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                {energy.online_generators_count} Generators Online
              </span>
            </div>

            <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Modeled Fuel Burn
              </span>
              <div className="font-mono text-2xl font-bold text-amber-400">
                {energy.fuel_burn_rate_lph} L/hr
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                Runway: {energy.projected_runway_days} Days
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. Multi-Station Mutual Aid & Headroom Feasibility */}
      {comparative && (
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Truck size={20} className="text-cyan-400 shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold uppercase text-slate-200 block">
                Cross-Station Mutual Aid & Logistics Headroom
              </span>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                {comparative.notes}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">{stationId}</span>
              <span className="font-bold text-emerald-400">{comparative.primary_runway_days}d runway</span>
            </div>
            <span className="text-slate-600">vs</span>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block">{comparative.comparative_station_id}</span>
              <span className="font-bold text-cyan-400">{comparative.comparative_runway_days}d runway</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
