export type TruthType =
  | "MEASURED"
  | "DERIVED"
  | "SIMULATED"
  | "ESTIMATED"
  | "OVERRIDDEN"
  | "SYNTHETIC"
  | "SCENARIO"
  | "FORECAST";

export interface TruthBadgeProps {
  type: TruthType;
  className?: string;
}

export function TruthBadge({ type, className = "" }: TruthBadgeProps) {
  const styles: Record<string, string> = {
    MEASURED: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    DERIVED: "bg-cyan-950/60 text-cyan-400 border-cyan-800/60",
    SIMULATED: "bg-indigo-950/60 text-indigo-400 border-indigo-800/60",
    ESTIMATED: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    OVERRIDDEN: "bg-rose-950/60 text-rose-400 border-rose-800/60",
    SYNTHETIC: "bg-slate-800/80 text-slate-300 border-slate-700",
    SCENARIO: "bg-purple-950/60 text-purple-400 border-purple-800/60",
    FORECAST: "bg-sky-950/60 text-sky-400 border-sky-800/60",
  };

  const style = styles[type] || styles.SYNTHETIC;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${style} ${className}`}
      title={`Data Truth Type: ${type}`}
    >
      {type}
    </span>
  );
}
