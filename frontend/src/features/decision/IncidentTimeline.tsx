import React from "react";
import { Clock, CheckCircle2, AlertTriangle, AlertOctagon, User, ShieldCheck } from "lucide-react";
import type { IncidentAction, IncidentDetail } from "@/lib/api/incidents";

interface IncidentTimelineProps {
  incident: IncidentDetail;
  onSelectAction?: (action: IncidentAction) => void;
}

export function IncidentTimeline({ incident, onSelectAction }: IncidentTimelineProps) {
  // Combine incident inception + actions into a chronological sequence
  const timelineEvents: Array<{
    id: string;
    timestamp: string;
    title: string;
    type: "ALERT" | "ACTION";
    description: string;
    actor: string;
    severity: string;
    status: string;
    actionData?: IncidentAction;
  }> = [
    {
      id: "event-start",
      timestamp: incident.started_at,
      title: "Incident Inception & Automated Sensor Breach",
      type: "ALERT" as const,
      description: incident.description,
      actor: "SCADA Telemetry Alarm Loop",
      severity: String(incident.severity),
      status: "TRIGGERED",
    },
    ...incident.actions.map((act) => ({
      id: act.id,
      timestamp: act.executed_at,
      title: `Action: ${act.action_code}`,
      type: "ACTION" as const,
      description: act.description,
      actor: act.executed_by,
      severity: "MODERATE",
      status: act.outcome_status,
      actionData: act,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-cyan-400" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Temporal Sequence & Action Ledger ({timelineEvents.length} events)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Chronological Order Enforced</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timelineEvents.map((evt, idx) => {
          const isAlert = evt.type === "ALERT";
          const isComplete = evt.status === "COMPLETED" || evt.status === "RESOLVED";

          return (
            <div
              key={evt.id}
              className="relative group transition-all"
              onClick={() => evt.actionData && onSelectAction?.(evt.actionData)}
            >
              {/* Timeline marker icon */}
              <div
                className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] transition-transform group-hover:scale-110 ${
                  isAlert
                    ? "bg-red-950 border-red-500 text-red-400"
                    : isComplete
                    ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                    : "bg-cyan-950 border-cyan-500 text-cyan-400"
                }`}
              >
                {isAlert ? (
                  <AlertOctagon size={12} />
                ) : isComplete ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <ShieldCheck size={12} />
                )}
              </div>

              {/* Event Content */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded p-3 hover:border-slate-700 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {evt.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        evt.status === "TRIGGERED"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : isComplete
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  {evt.description}
                </p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <User size={11} className="text-slate-500" />
                    <span>{evt.actor}</span>
                  </div>
                  <span>•</span>
                  <span>Step {idx + 1} of {timelineEvents.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
