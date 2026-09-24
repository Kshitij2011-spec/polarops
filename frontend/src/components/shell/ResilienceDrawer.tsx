import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldCheck, Database, RotateCcw } from "lucide-react";
import { useStation } from "@/context/StationContext";
import {
  fetchResilienceStatus,
  fetchSyncQueue,
  simulateOffline,
  restoreAndSync,
  resetResilienceSimulation,
  retryQueueItem,
} from "@/lib/api/resilience";
import { StatusBadge } from "@/components/foundation/StatusBadge";

export function ResilienceDrawer() {
  const {
    isResilienceDrawerOpen,
    closeResilienceDrawer,
    activeStationId,
    setLocalLinkState,
    setPendingSyncCount,
  } = useStation();

  const queryClient = useQueryClient();

  const { data: linkStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ["resilience-status", activeStationId],
    queryFn: () => fetchResilienceStatus(activeStationId),
    refetchInterval: 5000,
    enabled: isResilienceDrawerOpen,
  });

  const { data: syncQueue, isLoading: isQueueLoading } = useQuery({
    queryKey: ["resilience-queue", activeStationId],
    queryFn: () => fetchSyncQueue(activeStationId),
    refetchInterval: 5000,
    enabled: isResilienceDrawerOpen,
  });

  // Sync state to global context
  React.useEffect(() => {
    if (linkStatus) {
      if (linkStatus.status === "OFFLINE") {
        setLocalLinkState("LOCAL");
      } else if (linkStatus.status === "SYNCING") {
        setLocalLinkState("SYNCHRONIZING");
      } else if (linkStatus.status === "RESTORING") {
        setLocalLinkState("RECONNECTING");
      } else if (linkStatus.pending_queue_count > 0) {
        setLocalLinkState("QUEUED");
      } else {
        setLocalLinkState("NORMAL");
      }
    }
    if (syncQueue) {
      setPendingSyncCount(syncQueue.pending_count);
    }
  }, [linkStatus, syncQueue, setLocalLinkState, setPendingSyncCount]);

  const offlineMutation = useMutation({
    mutationFn: () => simulateOffline(activeStationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resilience-status"] });
      queryClient.invalidateQueries({ queryKey: ["resilience-queue"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreAndSync(activeStationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resilience-status"] });
      queryClient.invalidateQueries({ queryKey: ["resilience-queue"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetResilienceSimulation(activeStationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resilience-status"] });
      queryClient.invalidateQueries({ queryKey: ["resilience-queue"] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => retryQueueItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resilience-queue"] });
    },
  });

  if (!isResilienceDrawerOpen) return null;

  const isOffline = linkStatus?.status === "OFFLINE";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={closeResilienceDrawer}
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Satellite Resilience & Edge Continuity Cockpit"
        className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-sky-950/60 border border-sky-800/80 text-sky-400">
              <Database size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-100">
                Satellite Resilience & Store-and-Forward
              </h2>
              <div className="text-[11px] text-slate-400 font-mono">
                {activeStationId} • Local Edge Autonomous Operations
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeResilienceDrawer}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Close Resilience Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Comms Link Card */}
          <div className="p-4 rounded-md bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <WifiOff size={16} className="text-purple-400" />
                ) : (
                  <Wifi size={16} className="text-emerald-400" />
                )}
                <span className="text-xs font-mono font-bold uppercase text-slate-200">
                  Satellite Transceiver Link
                </span>
              </div>
              <StatusBadge status={linkStatus?.status || "UNKNOWN"} size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center font-mono">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase">Latency</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {isOffline ? "∞ TIMEOUT" : `${linkStatus?.latency_ms ?? 142} ms`}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase">Bandwidth</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {isOffline ? "0 kbps" : `${linkStatus?.bandwidth_kbps ?? 256} kbps`}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase">Queue Depth</div>
                <div className="text-xs font-bold text-sky-400 mt-0.5">
                  {syncQueue?.pending_count ?? 0} Packets
                </div>
              </div>
            </div>

            {/* Test Simulation Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {isOffline ? (
                <button
                  type="button"
                  onClick={() => restoreMutation.mutate()}
                  disabled={restoreMutation.isPending}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw size={14} className={restoreMutation.isPending ? "animate-spin" : ""} />
                  <span>Restore Link & Trigger Sync</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => offlineMutation.mutate()}
                  disabled={offlineMutation.isPending}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <WifiOff size={14} />
                  <span>Simulate Satellite Outage (Go Offline)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                title="Reset simulation test fixtures"
                className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Store-and-Forward Queue Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-sky-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Store-and-Forward Priority Queue
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {syncQueue?.items?.length ?? 0} total entries
              </span>
            </div>

            {isQueueLoading ? (
              <div className="py-8 text-center text-xs font-mono text-slate-500 animate-pulse">
                Auditing local cryptographic queue...
              </div>
            ) : !syncQueue?.items || syncQueue.items.length === 0 ? (
              <div className="p-6 rounded border border-slate-800/80 bg-slate-950/40 text-center text-xs font-mono text-slate-500">
                Sync queue empty. All transactions reconciled with remote headquarters core.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 border border-slate-800/80 rounded-md overflow-hidden bg-slate-950/40 max-h-96 overflow-y-auto">
                {syncQueue.items.map((item) => (
                  <div key={item.id} className="p-3 space-y-1.5 hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{item.event_type}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          {item.priority_label || `P${item.priority}`}
                        </span>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                        <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                        <span className="truncate">SHA-256: {item.checksum_sha256}</span>
                      </div>
                      <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                    </div>

                    {item.status === "FAILED_RETRY" && (
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => retryMutation.mutate(item.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 cursor-pointer"
                        >
                          Retry Dispatch
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Store-and-forward integrity enforced</span>
          </div>
          <span>RFC 7807 • SHA-256</span>
        </div>
      </aside>
    </div>
  );
}
