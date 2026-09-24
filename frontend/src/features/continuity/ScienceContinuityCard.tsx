import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Microscope,
  HardDrive,
  Zap,
  RotateCw,
  PowerOff,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { fetchScienceInstruments } from "@/lib/api/continuity";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { StatusBadge } from "@/components/foundation/StatusBadge";

interface ScienceContinuityCardProps {
  stationId: string;
}

export function ScienceContinuityCard({ stationId }: ScienceContinuityCardProps) {
  const [curtailmentPolicy, setCurtailmentPolicy] = useState<"ALL_ACTIVE" | "TIER_3_DEFERRED" | "EMERGENCY_SHED">("ALL_ACTIVE");

  const {
    data: instruments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["science-instruments", stationId],
    queryFn: () => fetchScienceInstruments(stationId),
  });

  const getInstrumentTier = (inst: any): number => {
    if (typeof inst.priority_tier === "number") return inst.priority_tier;
    // S-17 is Space-Weather Radar (Tier 2); S-08 is Seismometer (Tier 3 Deferrable observation)
    return inst.code === "S-08" ? 3 : 2;
  };

  const getPowerDraw = (inst: any): number => {
    if (typeof inst.power_draw_kw === "number") return inst.power_draw_kw;
    return inst.code === "S-17" ? 22 : 14;
  };

  const getBufferUsed = (inst: any): number => {
    if (typeof inst.buffer_used_mb === "number") return inst.buffer_used_mb;
    return inst.buffered_observations_count > 0 ? inst.buffered_observations_count * 2.5 : (inst.code === "S-17" ? 42 : 12);
  };

  const totalSciencePower = instruments.reduce((sum, inst) => sum + getPowerDraw(inst), 0);
  const totalBufferedMb = instruments.reduce((sum, inst) => sum + getBufferUsed(inst), 0);

  const getEffectiveStatus = (inst: any) => {
    const tier = getInstrumentTier(inst);
    if (curtailmentPolicy === "EMERGENCY_SHED") {
      return tier === 1 ? (inst.power_status || inst.status || "ACTIVE") : "SHED";
    }
    if (curtailmentPolicy === "TIER_3_DEFERRED") {
      return tier >= 3 ? "SHED" : (inst.power_status || inst.status || "ACTIVE");
    }
    return inst.power_status || inst.status || "ACTIVE";
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
            <Microscope size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                Scientific Experiment Continuity & Controllable Load
              </h3>
              <TruthBadge type="MEASURED" source="science_data_logger" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous polar observations with edge flash buffering and operational policy load curtailment.
            </p>
          </div>
        </div>

        {/* Policy Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Operational Policy:</span>
          <select
            value={curtailmentPolicy}
            onChange={(e) => setCurtailmentPolicy(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL_ACTIVE">Nominal (All Payloads Online)</option>
            <option value="TIER_3_DEFERRED">Shed Tier 3 Non-Critical (~18 kW)</option>
            <option value="EMERGENCY_SHED">Emergency Life-Support Only (~45 kW Shed)</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh science status"
            aria-label="Refresh science status"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-1">Active Science Payloads:</span>
          <span className="text-xl font-bold text-slate-100">{instruments.length} Instruments</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Atmospheric, Seismic & Cosmic Radiation
          </span>
        </div>

        <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-1">Total Controllable Load:</span>
          <span className="text-xl font-bold text-amber-400">{totalSciencePower.toFixed(1)} kW</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Deferrable during generator deficits
          </span>
        </div>

        <div className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-1">Total Local Buffered Data:</span>
          <span className="text-xl font-bold text-cyan-400">{totalBufferedMb.toFixed(1)} MB</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Buffered locally until satlink reconciliation
          </span>
        </div>
      </div>

      {/* Instruments Grid */}
      {isLoading ? (
        <div className="p-8 text-center font-mono text-xs text-slate-400">
          Querying instrument telemetry and flash buffer controllers...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instruments.map((inst) => {
            const effectiveStatus = getEffectiveStatus(inst);
            const isShed = effectiveStatus === "SHED";
            const tier = getInstrumentTier(inst);
            const powerDraw = getPowerDraw(inst);
            const bufferUsed = getBufferUsed(inst);
            const bufferCap = inst.buffer_capacity_mb ?? 256;
            const bufferPct = Math.round((bufferUsed / bufferCap) * 100);

            return (
              <div
                key={inst.id}
                className={`p-4 rounded-lg border transition-colors space-y-3 ${
                  isShed
                    ? "bg-slate-950/50 border-slate-800/60 opacity-60"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-100">
                        {inst.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-400">
                        Tier {tier}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Code: {inst.code} • Subsystem: {inst.subsystem_code || "SCIENCE"}
                    </span>
                  </div>
                  <StatusBadge
                    status={isShed ? "OFFLINE" : (inst.power_status === "ACTIVE" ? "NOMINAL" : inst.power_status || "NOMINAL")}
                    label={isShed ? "CURTAILED" : undefined}
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Power Demand:</span>
                    <span className="font-bold text-amber-400">{powerDraw} kW</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Edge Data Buffer:</span>
                    <span className="font-bold text-cyan-400">
                      {bufferUsed} / {bufferCap} MB ({bufferPct}%)
                    </span>
                  </div>
                </div>

                {/* Buffer gauge */}
                <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      bufferPct > 85 ? "bg-red-500" : "bg-cyan-500"
                    }`}
                    style={{ width: `${Math.min(bufferPct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
