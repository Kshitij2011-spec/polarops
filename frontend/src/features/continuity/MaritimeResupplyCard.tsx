import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Ship,
  Calendar,
  Clock,
  AlertTriangle,
  Package,
  Plane,
  RotateCw,
  Compass,
} from "lucide-react";
import { fetchResupplyLogistics } from "@/lib/api/continuity";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { StatusBadge } from "@/components/foundation/StatusBadge";

interface MaritimeResupplyCardProps {
  stationId: string;
}

export function MaritimeResupplyCard({ stationId }: MaritimeResupplyCardProps) {
  const {
    data: resupplyList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["resupply-logistics", stationId],
    queryFn: () => fetchResupplyLogistics(stationId),
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-400">
            <Ship size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                Maritime & Aviation Inbound Resupply Logistics
              </h3>
              <TruthBadge type="ESTIMATED" source="ncpor_expeditions_schedule" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled Southern Ocean cargo voyages and Basler BT-67 polar aviation corridors.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh resupply data"
          aria-label="Refresh resupply data"
        >
          <RotateCw size={14} />
        </button>
      </div>

      {/* Resupply Opportunities Grid */}
      {isLoading ? (
        <div className="p-10 text-center font-mono text-xs text-slate-400">
          Querying maritime expedition transport schedules...
        </div>
      ) : resupplyList.length === 0 ? (
        <div className="p-8 text-center rounded bg-slate-950/60 border border-slate-800 font-mono text-xs text-slate-400">
          No inbound resupply vessels or flights scheduled for {stationId}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resupplyList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-sky-950 border border-sky-800 text-sky-400">
                    <Ship size={16} />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-slate-100">
                      {item.vessel_name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Expedition Voyage ID: {item.id}
                    </span>
                  </div>
                </div>
                <StatusBadge status={item.status} size="sm" />
              </div>

              {/* Manifested critical spare */}
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1 font-mono text-xs">
                <span className="text-[10px] text-slate-400 block uppercase">
                  Manifested Cargo:
                </span>
                <span className="font-bold text-cyan-300 block truncate">
                  {item.spare_part_name}
                </span>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>P/N: {item.spare_part_number}</span>
                  <span className="text-slate-200 font-bold">Qty: {item.quantity}</span>
                </div>
              </div>

              {/* ETA & Logistics Feasibility */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Expected Arrival:</span>
                  <span className="font-bold text-slate-100">
                    {new Date(item.expected_date).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-cyan-400 block mt-0.5">
                    ETA: {item.eta_days} Days
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Voyage Drift / Delay:</span>
                  <span
                    className={`font-bold ${
                      item.delay_days > 0 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {item.delay_days > 0 ? `+${item.delay_days}d Sea Ice Delay` : "On Schedule"}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Pack Ice Constrained
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logistics disclaimer */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <span>
          Note: Vessel positions reflect scheduled NCPOR voyage logs. Live satellite AIS is subject to Southern Ocean occultation.
        </span>
        <TruthBadge type="ESTIMATED" source="schedule_log" />
      </div>
    </div>
  );
}
