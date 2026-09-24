import React, { useState } from "react";
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Scale,
  Sparkles,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ScenarioDecisionOption } from "@/lib/api/decision";
import { HoldToConfirmButton } from "@/components/foundation/HoldToConfirmButton";
import { TruthBadge } from "@/components/foundation/TruthBadge";

interface DecisionPackageCardProps {
  option: ScenarioDecisionOption;
  activeIncidentId: string;
  isExecuting?: boolean;
  onAuthorize: (option: ScenarioDecisionOption, operatorRole: string) => Promise<void> | void;
}

export function DecisionPackageCard({
  option,
  activeIncidentId,
  isExecuting = false,
  onAuthorize,
}: DecisionPackageCardProps) {
  const [operatorRole, setOperatorRole] = useState("Station Commander");
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasDispatched, setHasDispatched] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "HIGH":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "LOW":
        return "bg-slate-700/30 text-slate-300 border-slate-700";
      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    }
  };

  const handleConfirm = async () => {
    setHasDispatched(true);
    await onAuthorize(option, operatorRole);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden transition-all hover:border-slate-700">
      {/* Header bar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-400">
            <Scale size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">#{option.code}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${getTierColor(option.risk_reduction_tier)}`}>
                {option.risk_reduction_tier} RISK REDUCTION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {option.category}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mt-1">{option.title}</h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800"
        >
          {isExpanded ? "Collapse Reasoning" : "Inspect Causal Chain"}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Main summary description */}
      <div className="p-4 space-y-4">
        <p className="text-xs text-slate-300 leading-relaxed">{option.description}</p>

        {/* Operational Consequence & Trade-off */}
        <div className="p-3 rounded bg-amber-950/20 border border-amber-500/20">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
            Operational Trade-off & Consequence:
          </span>
          <p className="text-xs text-amber-200/90 font-mono leading-relaxed">
            {option.operational_impact}
          </p>
        </div>

        {/* Detailed 8-Part Reasoning Protocol when expanded */}
        {isExpanded && (
          <div className="pt-2 border-t border-slate-800/80 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">
                  1. Observation (Condition):
                </span>
                <span className="text-slate-300 text-[11px]">
                  Generator trip / thermal deficit detected; reserve margin severely compressed.
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">
                  2. Analysis (Mechanism):
                </span>
                <span className="text-slate-300 text-[11px]">
                  Deterministic thermodynamic balance predicts rapid freeze-out unless heat source engaged.
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">
                  3. Derivation (Math):
                </span>
                <span className="text-slate-300 text-[11px]">
                  Linear thermal engine: Q = 5.2 kW/°C heat loss coefficient against ambient gradient.
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">
                  4. Recommendation:
                </span>
                <span className="text-slate-300 text-[11px]">
                  Authorize advisory package #{option.code} to stabilize grid and life support.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase block">
                  5. Non-Autonomous Governance Disclaimer:
                </span>
                <span className="text-[11px] text-slate-400">
                  {option.disclaimer || "Advisory proposal only. The system does not actuate equipment automatically."}
                </span>
              </div>
              <TruthBadge type="DERIVED" source="decision:recommender" />
            </div>
          </div>
        )}

        {/* Human Authorization Bridge */}
        <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-200">
              <UserCheck size={14} className="text-cyan-400" />
              <span>Human Authority Role:</span>
            </div>
            <select
              value={operatorRole}
              onChange={(e) => setOperatorRole(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="Station Commander">Station Commander (Command & Life Safety)</option>
              <option value="Chief Station Engineer">Chief Station Engineer (Power & Plant)</option>
              <option value="Logistics Officer">Logistics & Expeditions Director</option>
              <option value="Duty Systems Operator">Duty Systems Operator (Shift Lead)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {hasDispatched ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>DISPATCHED TO INCIDENT LEDGER</span>
              </div>
            ) : (
              <HoldToConfirmButton
                label={`Authorize Action (${option.code})`}
                confirmingLabel="COMMITTING ACTION..."
                confirmedLabel="ACTION COMMITTED"
                variant={option.risk_reduction_tier === "HIGH" ? "primary" : "warning"}
                holdDurationMs={1200}
                onConfirm={handleConfirm}
                disabled={isExecuting}
                className="w-full sm:w-auto"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
