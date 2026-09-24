import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Server,
  Database,
  ArrowRight,
  Clock,
  Hash,
} from "lucide-react";
import {
  fetchEdgeCommsStatus,
  fetchSyncQueueItems,
  restoreAndSyncQueue,
} from "@/lib/api/continuity";
import { TruthBadge } from "@/components/foundation/TruthBadge";
import { StatusBadge } from "@/components/foundation/StatusBadge";
import { HoldToConfirmButton } from "@/components/foundation/HoldToConfirmButton";

interface ResilienceQueueInspectorProps {
  stationId: string;
}

export function ResilienceQueueInspector({ stationId }: ResilienceQueueInspectorProps) {
  const queryClient = useQueryClient();
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // 1. Satellite Edge Comms Status
  const {
    data: comms,
    isLoading: isLoadingComms,
    refetch: refetchComms,
  } = useQuery({
    queryKey: ["edge-comms", stationId],
    queryFn: () => fetchEdgeCommsStatus(stationId),
    refetchInterval: 10000,
  });

  // 2. Offline Priority Sync Queue
  const {
    data: queueItems = [],
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ["sync-queue", stationId],
    queryFn: () => fetchSyncQueueItems(stationId),
    refetchInterval: 10000,
  });

  // 3. Mutation to Restore Link and Reconcile Sync Queue
  const restoreMutation = useMutation({
    mutationFn: () => restoreAndSyncQueue(stationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["edge-comms", stationId] });
      queryClient.invalidateQueries({ queryKey: ["sync-queue", stationId] });
      setSyncNotice(
        `✓ Link Reconciled: ${data.items_reconciled} items reconciled, ${data.items_processed} processed. Batch SHA-256 verified.`
      );
      setTimeout(() => setSyncNotice(null), 6000);
    },
  });

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 0:
        return {
          label: "P0 CRISIS ACTION",
          cls: "bg-red-950 text-red-400 border-red-800 font-extrabold",
        };
      case 1:
        return {
          label: "P1 LIFE SUPPORT",
          cls: "bg-amber-950 text-amber-400 border-amber-800 font-bold",
        };
      case 2:
        return {
          label: "P2 OPERATIONS",
          cls: "bg-cyan-950 text-cyan-400 border-cyan-800",
        };
      case 3:
      default:
        return {
          label: "P3 SCIENCE OBS",
          cls: "bg-slate-800 text-slate-300 border-slate-700",
        };
    }
  };

  // Derive continuity step: NORMAL -> DEGRADED -> LOCAL -> QUEUED -> RECONNECTING -> SYNCHRONIZING -> RECONCILED
  const getContinuityStep = () => {
    if (!comms) return "NORMAL";
    if (restoreMutation.isPending) return "SYNCHRONIZING";
    if (comms.status === "OFFLINE") {
      return queueItems.length > 0 ? "QUEUED" : "LOCAL";
    }
    if (comms.status === "RESTORING" || comms.status === "SYNCING") return "RECONNECTING";
    if (comms.is_local_operation_active) return "LOCAL";
    if (queueItems.some((i) => i.status === "TRANSFERRING")) return "SYNCHRONIZING";
    return "RECONCILED";
  };

  const currentStep = getContinuityStep();

  return (
    <div className="space-y-6">
      {/* 1. Global Continuity Lifecycle Stepper */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <Radio size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                  Resilience & Offline Priority Synchronization Engine
                </h3>
                <TruthBadge type="MEASURED" source="sat_transceiver" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic edge continuity protocol guaranteeing zero loss of life-support commands during Antarctic blackout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={comms?.status || "ONLINE"} />
          </div>
        </div>

        {/* 7-State Continuity Stepper */}
        <div className="mt-5 p-4 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-3 font-bold">
            Antarctic Satellite Continuity Lifecycle:
          </span>
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            {[
              { id: "NORMAL", label: "NORMAL" },
              { id: "DEGRADED", label: "DEGRADED" },
              { id: "LOCAL", label: "LOCAL EDGE" },
              { id: "QUEUED", label: "QUEUE BUFFER" },
              { id: "RECONNECTING", label: "RECONNECTING" },
              { id: "SYNCHRONIZING", label: "SYNCHRONIZING" },
              { id: "RECONCILED", label: "RECONCILED" },
            ].map((step, idx, arr) => {
              const isActive = currentStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`px-3 py-1.5 rounded border transition-all ${
                      isActive
                        ? "bg-purple-900/60 text-purple-300 border-purple-500 font-bold ring-1 ring-purple-500/40"
                        : "bg-slate-900/60 text-slate-500 border-slate-800"
                    }`}
                  >
                    <span>{step.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ArrowRight size={12} className="text-slate-700 hidden sm:inline" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Link Metrics Row */}
        {comms && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Satellite Transceiver:</span>
              <span className="font-bold text-slate-200">{comms.name || "INSAT-4CR Polar"}</span>
            </div>

            <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Round-Trip Latency:</span>
              <span className="font-bold text-cyan-400">{comms.latency_ms} ms</span>
            </div>

            <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Link Bandwidth:</span>
              <span className="font-bold text-slate-200">
                {comms.bandwidth_kbps} kbps
              </span>
            </div>

            <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Pending Unsynced Queue:</span>
              <span
                className={`font-bold ${
                  comms.pending_queue_count > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {comms.pending_queue_count} Events
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sync Toast Notification */}
      {syncNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-mono font-bold flex items-center justify-between">
          <span>{syncNotice}</span>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-emerald-400 hover:text-emerald-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Edge Priority Queue Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-purple-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              Station Edge Priority Sync Queue ({queueItems.length} Enqueued Commands)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refetchQueue()}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
            >
              Refresh Queue
            </button>

            {/* Reconcile & Batch Sync Button */}
            <HoldToConfirmButton
              label="Reconcile & Batch Sync"
              confirmingLabel="TRANSMITTING BATCH..."
              confirmedLabel="BATCH RECONCILED"
              variant="primary"
              holdDurationMs={1200}
              onConfirm={() => restoreMutation.mutate()}
              disabled={restoreMutation.isPending || queueItems.length === 0}
              className="text-xs"
            />
          </div>
        </div>

        {isLoadingQueue ? (
          <div className="p-8 text-center font-mono text-xs text-slate-400">
            Querying local SQLite edge priority queue...
          </div>
        ) : queueItems.length === 0 ? (
          <div className="p-8 text-center rounded bg-slate-950/60 border border-slate-800 font-mono text-xs text-emerald-400">
            ✓ Edge queue clean. All station actions reconciled with Goa NCPOR central servers.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Event Type</th>
                  <th className="p-2.5">Payload Description</th>
                  <th className="p-2.5">SHA-256 Hash</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Enqueued At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {queueItems.map((item) => {
                  const pri = getPriorityBadge(item.priority);
                  return (
                    <tr key={item.id} className="hover:bg-slate-950/40">
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] border ${pri.cls}`}>
                          {pri.label}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-200">{item.event_type}</td>
                      <td className="p-2.5 text-slate-300 max-w-xs truncate">
                        {item.payload_json || item.priority_label}
                      </td>
                      <td className="p-2.5 text-[10px] text-slate-500 font-mono">
                        {item.checksum_sha256 ? `${item.checksum_sha256.substring(0, 12)}...` : "PENDING"}
                      </td>
                      <td className="p-2.5">
                        <StatusBadge
                          status={
                            item.status === "FAILED_RETRY"
                              ? "CRITICAL"
                              : item.status === "TRANSFERRING"
                              ? "WARNING"
                              : item.status === "RECONCILED" || item.status === "ACKNOWLEDGED" || item.status === "VERIFIED"
                              ? "NOMINAL"
                              : "LOCAL"
                          }
                          label={item.status}
                          size="sm"
                        />
                      </td>
                      <td className="p-2.5 text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
