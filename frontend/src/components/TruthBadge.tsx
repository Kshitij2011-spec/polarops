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
    MEASURED: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
    DERIVED: "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60",
    SIMULATED: "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60",
    ESTIMATED: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
    OVERRIDDEN: "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60",
    SYNTHETIC: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700",
    SCENARIO: "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60",
    FORECAST: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60",
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
