import React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Server, ArrowRight, ShieldCheck, Zap, Fuel, CloudSnow, Layers } from "lucide-react";
import { STATIONS, type StationId, useStation } from "@/context/StationContext";
import { fetchStationOverview } from "@/lib/api/station";
import { StatusBadge } from "@/components/foundation/StatusBadge";

export function MissionGateway() {
  const { setActiveStationId } = useStation();

  const { data: bharatiOverview } = useQuery({
    queryKey: ["station-overview", "STATION-BHARATI"],
    queryFn: () => fetchStationOverview("STATION-BHARATI"),
  });

  const { data: maitriOverview } = useQuery({
    queryKey: ["station-overview", "STATION-MAITRI"],
    queryFn: () => fetchStationOverview("STATION-MAITRI"),
  });

  const stations = [
    {
      meta: STATIONS["STATION-BHARATI"],
      overview: bharatiOverview,
      tag: "PRIMARY OPERATIONAL BASE",
      defaultAsset: "G-02",
    },
    {
      meta: STATIONS["STATION-MAITRI"],
      overview: maitriOverview,
      tag: "INLAND RESEARCH STATION",
      defaultAsset: "GEN-01",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden bg-[#070B12]">
      {/* Background polar grid pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <div className="max-w-4xl w-full space-y-8 relative z-10 text-center sm:text-left">
        {/* Header Kicker */}
        <div className="space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-sky-400 font-mono text-xs tracking-widest uppercase">
            <Compass size={16} className="animate-spin-slow" />
            <span>NCPOR 44TH INDIAN ANTARCTIC EXPEDITION</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-headline tracking-tight text-slate-100">
            PolarOps Mission Gateway
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl font-sans">
            Select an operational station to enter the Antarctic Operational Digital Twin and Incident Cockpit.
          </p>
        </div>

        {/* Station Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stations.map(({ meta, overview, tag, defaultAsset }) => (
            <div
              key={meta.id}
              className="p-6 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-sky-500/80 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-xl text-left group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                    {tag}
                  </span>
                  <StatusBadge status={overview?.status || "NOMINAL"} size="sm" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold font-headline text-slate-100 group-hover:text-sky-300 transition-colors">
                    {meta.name}
                  </h2>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">{meta.location}</div>
                  <div className="text-[11px] font-mono text-slate-500">{meta.coords} • {meta.elevation}</div>
                </div>

                {/* Station Telemetry Badges */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 font-mono text-xs">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Health Score</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {overview?.overall_health_score ?? 88} / 100
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Fuel Runway</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {overview?.fuel_runway_days ?? 184} Days
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: Direct Entry */}
              <Link
                to="/twin"
                search={{ station: meta.id, asset: defaultAsset }}
                onClick={() => setActiveStationId(meta.id)}
                className="w-full min-h-[48px] px-5 py-3 rounded-md bg-sky-950 hover:bg-sky-900 border border-sky-600/80 text-sky-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
              >
                <span>Enter Operations ({meta.code})</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>

        {/* Global Security / Operational Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Operational Integrity • Offline Store-and-Forward Active</span>
          </div>
          <span>National Centre for Polar and Ocean Research (Goa, India)</span>
        </div>
      </div>
    </div>
  );
}
