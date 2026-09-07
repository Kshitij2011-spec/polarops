import { useState, useEffect } from "react";
import {
  Activity,
  HelpCircle,
  RotateCcw,
  Play,
  Filter,
  ArrowRight,
} from "lucide-react";
import {
  fetchOperationalEvents,
  simulateDemoEvent,
  resetDemoEvents,
  type OperationalEvent,
} from "../lib/api";
import { TruthBadge, type TruthType } from "./TruthBadge";

export interface ActivityStreamProps {
  stationId?: string;
  onOpenExplanation?: (domain: string, entityId: string) => void;
  onNavigate?: (route: string) => void;
}

type FilterType = "ALL" | "WARNINGS_CRITICAL" | "SYSTEM_COMMS";

export function ActivityStream({
  stationId = "STATION-BHARATI",
  onOpenExplanation,
  onNavigate,
}: ActivityStreamProps) {
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetchOperationalEvents({ station_id: stationId, limit: 50 });
      setEvents(res.events);
    } catch (err: any) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [stationId]);

  const handleSimulateStep = async () => {
    try {
      setActionLoading(true);
      const newEvent = await simulateDemoEvent(undefined, stationId);
      setStatusMessage(`Step triggered: ${newEvent.title}`);
      await loadEvents();
    } catch (err: any) {
      setStatusMessage(`Simulation error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setActionLoading(true);
      await resetDemoEvents(stationId);
      setStatusMessage("Timeline reset to canonical baseline.");
      await loadEvents();
    } catch (err: any) {
      setStatusMessage(`Reset error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filter === "WARNINGS_CRITICAL") {
      return ev.severity === "WARNING" || ev.severity === "CRITICAL";
    }
    if (filter === "SYSTEM_COMMS") {
      return (
        ev.severity === "SYSTEM" ||
        ev.event_type.includes("COMM") ||
        ev.event_type.includes("SYNC") ||
        ev.entity_type === "COMMUNICATION"
      );
    }
    return true;
  });

  return (
    <div
      className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors"
      data-testid="operational-activity-stream"
    >
      {/* Stream Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-[#202534]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1 rounded bg-blue-50 dark:bg-[#1f2638] text-blue-600 dark:text-[#5b9cf5] border border-blue-200 dark:border-[#2d3852]">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-[#f0f3fa]">
              OPERATIONAL ACTIVITY STREAM
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#202534] text-slate-600 dark:text-[#8b92a5] border border-slate-200 dark:border-[#2d3448]">
              {events.length} EVENTS RECORDED
            </span>
            <span
              data-testid="synthetic-activity-badge"
              className="text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
            >
              SYNTHETIC DEMONSTRATION ACTIVITY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#7a8194] mt-1 font-sans">
            Chronological station operational events, telemetry threshold breaches, and causal dependency exposures.
          </p>
        </div>

        {/* Demo Simulator Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateStep}
            disabled={actionLoading}
            data-testid="simulate-event-btn"
            className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
            title="Advance deterministic demo sequence by one state transition"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Advance Demo Event</span>
          </button>

          <button
            onClick={handleReset}
            disabled={actionLoading}
            data-testid="reset-events-btn"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-[#2a2f3e] bg-slate-50 hover:bg-slate-100 dark:bg-[#202534] dark:hover:bg-[#282f42] text-slate-700 dark:text-[#c5cad6] disabled:opacity-50 px-3 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Reset event log to canonical baseline"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset Timeline</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-3 py-1.5 px-3 rounded bg-blue-50/70 dark:bg-[#141a29] border border-blue-200 dark:border-[#202d4a] text-xs font-mono text-blue-800 dark:text-[#7ab0f7] flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        <div className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-[#12141c] p-0.5 border border-slate-200 dark:border-[#2a2f3e]">
          <button
            onClick={() => setFilter("ALL")}
            data-testid="filter-all-btn"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
              filter === "ALL"
                ? "bg-white dark:bg-[#202534] text-slate-900 dark:text-[#f0f3fa] shadow-2xs"
                : "text-slate-600 dark:text-[#7a8194] hover:text-slate-900 dark:hover:text-[#f0f3fa]"
            }`}
          >
            ALL ({events.length})
          </button>
          <button
            onClick={() => setFilter("WARNINGS_CRITICAL")}
            data-testid="filter-warnings-btn"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
              filter === "WARNINGS_CRITICAL"
                ? "bg-white dark:bg-[#202534] text-amber-700 dark:text-amber-300 shadow-2xs"
                : "text-slate-600 dark:text-[#7a8194] hover:text-slate-900 dark:hover:text-[#f0f3fa]"
            }`}
          >
            WARNINGS & CRITICAL
          </button>
          <button
            onClick={() => setFilter("SYSTEM_COMMS")}
            data-testid="filter-system-btn"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
              filter === "SYSTEM_COMMS"
                ? "bg-white dark:bg-[#202534] text-blue-700 dark:text-[#5b9cf5] shadow-2xs"
                : "text-slate-600 dark:text-[#7a8194] hover:text-slate-900 dark:hover:text-[#f0f3fa]"
            }`}
          >
            SYSTEM & COMMS
          </button>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-slate-500 dark:text-[#7a8194]">
          Loading activity stream events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-8 text-center font-mono text-xs text-slate-500 dark:text-[#7a8194]">
          No operational events matching the selected filter.
        </div>
      ) : (
        <div
          className="space-y-2.5 divide-y divide-slate-100 dark:divide-[#202534]"
          data-testid="activity-stream-list"
        >
          {filteredEvents.map((ev) => {
            const isG02 =
              ev.entity_id === "G-02" ||
              ev.entity_id === "GEN-BHARATI-G02" ||
              ev.title.includes("G-02");

            const sevBadge =
              ev.severity === "CRITICAL"
                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                : ev.severity === "WARNING"
                ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                : ev.severity === "SYSTEM"
                ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900"
                : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

            return (
              <div
                key={ev.id}
                data-testid={`activity-event-${ev.id}`}
                className="pt-2.5 first:pt-0 flex flex-wrap items-start justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-[#141722]/50 p-2 rounded transition-colors"
              >
                <div className="space-y-1 max-w-xl">
                  {/* Metadata Row */}
                  <div className="flex items-center gap-2 flex-wrap font-mono text-[10px]">
                    <span className="text-slate-400 dark:text-[#676e80]">
                      {new Date(ev.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </span>

                    <span className={`px-1.5 py-0.2 rounded font-bold border uppercase ${sevBadge}`}>
                      {ev.severity}
                    </span>

                    <span className="rounded bg-slate-100 dark:bg-[#1f2433] px-1.5 py-0.2 text-slate-700 dark:text-[#9ca3b4] border border-slate-200 dark:border-[#2d3448]">
                      {ev.event_type}
                    </span>

                    {ev.entity_id && (
                      <span className="font-bold text-blue-700 dark:text-[#5b9cf5]">
                        [{ev.entity_id}]
                      </span>
                    )}

                    {ev.truth_type && (
                      <TruthBadge
                        type={
                          ev.truth_type === "SYNTHETIC_SIMULATION"
                            ? "SYNTHETIC"
                            : (ev.truth_type as TruthType)
                        }
                        className="text-[9px] py-0"
                      />
                    )}
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-xs font-bold font-mono text-slate-900 dark:text-[#f0f3fa]">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-[#9ca3b4] font-sans mt-0.5 leading-relaxed">
                      {ev.summary}
                    </p>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  {/* WHY? Explanation Button */}
                  <button
                    onClick={() => {
                      const domain =
                        ev.entity_type === "ASSET"
                          ? "ASSET"
                          : ev.entity_type === "RESOURCE"
                          ? "RESOURCE"
                          : ev.entity_type === "COMMUNICATION"
                          ? "COMMUNICATION"
                          : ev.entity_type === "SCIENCE"
                          ? "SCIENCE"
                          : ev.entity_type === "INCIDENT"
                          ? "INCIDENT"
                          : "ASSET";
                      const id = ev.entity_id || (isG02 ? "G-02" : "G-02");
                      onOpenExplanation?.(domain, id);
                    }}
                    data-testid={isG02 ? "event-why-btn" : `event-why-btn-${ev.id}`}
                    className="flex items-center gap-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2.5 py-1 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Open deterministic operational explanation drawer"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>WHY?</span>
                  </button>

                  {/* INVESTIGATE / WHAT NOW? Button */}
                  {isG02 && (
                    <button
                      onClick={() => onNavigate?.("/assets/G-02")}
                      data-testid="event-investigate-btn"
                      className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#202534] dark:hover:bg-[#2a3044] text-slate-800 dark:text-[#c5cad6] border border-slate-300 dark:border-[#333a4d] px-2.5 py-1 text-xs font-mono font-bold transition-colors cursor-pointer"
                      title="Navigate to Asset Intelligence for G-02"
                    >
                      <span>INVESTIGATE</span>
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
