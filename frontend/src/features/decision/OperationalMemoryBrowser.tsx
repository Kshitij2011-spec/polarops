import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  History,
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  PlusCircle,
  Clock,
  Sparkles,
  User,
} from "lucide-react";
import { searchOperationalMemory, recordOperationalMemory, type OperationalMemory } from "@/lib/api/memory";
import { TruthBadge } from "@/components/foundation/TruthBadge";

interface OperationalMemoryBrowserProps {
  stationId: string;
  activeIncidentId?: string;
  onApplyPrecedent?: (memory: OperationalMemory) => void;
}

export function OperationalMemoryBrowser({
  stationId,
  activeIncidentId,
  onApplyPrecedent,
}: OperationalMemoryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [newAction, setNewAction] = useState("");
  const [newOutcome, setNewOutcome] = useState("");
  const [newLesson, setNewLesson] = useState("");

  const queryClient = useQueryClient();

  const { data: memoryData, isLoading } = useQuery({
    queryKey: ["operational-memory", stationId, searchQuery],
    queryFn: () => searchOperationalMemory(searchQuery, stationId),
  });

  const recordMutation = useMutation({
    mutationFn: () =>
      recordOperationalMemory({
        station_id: stationId,
        event_type: "INCIDENT_POST_MORTEM",
        title: newTitle,
        incident_id: activeIncidentId,
        decision: newDecision,
        action_taken: newAction,
        outcome: newOutcome,
        lesson: newLesson,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-memory", stationId] });
      setIsRecording(false);
      setNewTitle("");
      setNewDecision("");
      setNewAction("");
      setNewOutcome("");
      setNewLesson("");
    },
  });

  const memories = memoryData?.memories || [];

  return (
    <div className="space-y-6">
      {/* Header bar with search & add */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <History size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                  Institutional Memory & Operational Precedents
                </h3>
                <TruthBadge type="MEASURED" source="db:operational_memory" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Past operational decisions, actions, and verified post-mortem lessons across Antarctic wintering teams.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <PlusCircle size={14} className="text-cyan-400" />
            <span>{isRecording ? "Cancel Entry" : "Record Post-Mortem Lesson"}</span>
          </button>
        </div>

        {/* Search input */}
        <div className="mt-4 relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operational memory (e.g. 'bearing', 'G-02', 'preheat', 'boiler', 'radar')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Record new lesson form */}
        {isRecording && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              recordMutation.mutate();
            }}
            className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs"
          >
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
              <BookOpen size={16} />
              <span>Record Institutional Lesson (Post-Mortem)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Precedent Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 2026 G-02 Bearing Preheat Mitigation"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Decision Made:</label>
                <input
                  type="text"
                  required
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  placeholder="e.g. Transferred thermal grid to Boiler B-01 before generator trip"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Action Executed:</label>
                <input
                  type="text"
                  required
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="e.g. Initiated 35-minute preheat sequence on hydronic loop"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Outcome Observed:</label>
                <input
                  type="text"
                  required
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="e.g. Habitat stayed at +20°C; zero freeze-out damage recorded"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Core Lesson for Future Crews:</label>
              <textarea
                required
                rows={2}
                value={newLesson}
                onChange={(e) => setNewLesson(e.target.value)}
                placeholder="e.g. In sub-30°C storms, always preheat secondary hydronic boilers for at least 30 minutes prior to intentional engine shutoff to avoid pipe thermal shock."
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRecording(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={recordMutation.isPending}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold"
              >
                {recordMutation.isPending ? "Saving..." : "Commit Lesson to Memory"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Memory Precedents List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-xs text-slate-400">
            Querying station institutional archive...
          </div>
        ) : memories.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs text-slate-400">
            No institutional memory records found matching "{searchQuery}".
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.id}
              className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-cyan-400" />
                  <h4 className="font-mono text-sm font-bold text-slate-100">{mem.title}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {mem.event_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <Clock size={12} />
                  <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{mem.station_id}</span>
                </div>
              </div>

              {mem.context_summary && (
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {mem.context_summary}
                </p>
              )}

              {/* Decision / Action / Outcome 3-col */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                {mem.decision && (
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-bold text-cyan-400 block mb-0.5 uppercase">
                      Decision Taken:
                    </span>
                    <span className="text-slate-300 text-[11px]">{mem.decision}</span>
                  </div>
                )}
                {mem.action_taken && (
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-bold text-amber-400 block mb-0.5 uppercase">
                      Action Executed:
                    </span>
                    <span className="text-slate-300 text-[11px]">{mem.action_taken}</span>
                  </div>
                )}
                {mem.outcome && (
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 block mb-0.5 uppercase">
                      Verified Outcome:
                    </span>
                    <span className="text-slate-300 text-[11px]">{mem.outcome}</span>
                  </div>
                )}
              </div>

              {/* Lesson Learned Hero Callout */}
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5">
                <Lightbulb size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block mb-0.5">
                    Institutional Lesson Learned:
                  </span>
                  <p className="text-xs text-cyan-200/90 leading-relaxed font-sans">
                    {mem.lessons_learned}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
