import { Activity, Flame, Radio, RefreshCw, Snowflake, Sun, Zap } from "lucide-react";
import type { EnvironmentMode } from "../lib/api";

export type ViewMode = "COMMAND_CENTER" | "ASSET_DETAIL" | "RESOURCES" | "SCENARIOS" | "RESILIENCE";

export interface HeaderProps {
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  environmentMode?: EnvironmentMode;
  connectivityStatus?: string;
  isFetching?: boolean;
  activeView?: ViewMode;
  onNavigateView?: (view: ViewMode) => void;
  onRefresh?: () => void;
  onNavigateHome?: () => void;
}

export function Header({
  selectedStationId,
  onSelectStation,
  environmentMode = "WINTER",
  connectivityStatus = "ONLINE",
  isFetching = false,
  activeView = "COMMAND_CENTER",
  onNavigateView,
  onRefresh,
  onNavigateHome,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-polar-700 bg-polar-900/90 px-6 py-3.5 backdrop-blur-md">
      {/* ── Brand & Identity ────────────────────────── */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={onNavigateHome}
        role="button"
        tabIndex={0}
        aria-label="Return to Command Center"
        onKeyDown={(e) => e.key === "Enter" && onNavigateHome?.()}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan group-hover:border-accent-cyan transition-colors">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-polar-100 font-mono">
              POLAR<span className="text-accent-cyan">OPS</span>
            </h1>
            <span className="rounded bg-polar-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-polar-400 border border-polar-700">
              v1.0-MVP
            </span>
          </div>
          <p className="text-xs text-polar-400">Antarctic Operational Digital Twin</p>
        </div>
      </div>

      {/* ── Primary Section Navigation ─────────────── */}
      <nav aria-label="Main Operations Navigation" className="hidden lg:flex items-center gap-1.5 rounded-lg border border-polar-700 bg-polar-800/60 p-1">
        <button
          onClick={() => onNavigateView?.("COMMAND_CENTER")}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "COMMAND_CENTER"
              ? "bg-accent-cyan/20 text-accent-cyan font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-700/50"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Command Center</span>
        </button>

        <button
          onClick={() => onNavigateView?.("RESOURCES")}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "RESOURCES"
              ? "bg-accent-cyan/20 text-accent-cyan font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-700/50"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Resources & Fuel</span>
        </button>

        <button
          onClick={() => onNavigateView?.("SCENARIOS")}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "SCENARIOS"
              ? "bg-purple-900/60 text-purple-300 border border-purple-500 font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-700/50"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-purple-400" />
          <span>What-If Scenarios</span>
        </button>

        <button
          onClick={() => onNavigateView?.("RESILIENCE")}
          data-testid="nav-resilience-btn"
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "RESILIENCE"
              ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50 font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-700/50"
          }`}
        >
          <Radio className="h-3.5 w-3.5 text-accent-cyan" />
          <span>Resilience &amp; Disruption</span>
        </button>
      </nav>

      {/* ── Operational Controls & Station Selector ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Station Selector */}
        <div className="flex items-center gap-2 rounded-lg border border-polar-700 bg-polar-800/80 px-3 py-1.5">
          <span className="text-xs font-medium text-polar-400 font-mono">STATION:</span>
          <select
            id="station-select"
            aria-label="Select Antarctic Research Station"
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
            className="bg-transparent text-sm font-semibold text-polar-100 focus:outline-none cursor-pointer font-mono"
          >
            <option value="STATION-BHARATI" className="bg-polar-800 text-polar-100">
              Bharati Station (Larsemann Hills)
            </option>
            <option value="STATION-MAITRI" className="bg-polar-800 text-polar-100">
              Maitri Station (Schirmacher Oasis)
            </option>
          </select>
        </div>

        {/* Season Mode */}
        <div className="flex items-center gap-1.5 rounded-lg border border-polar-700 bg-polar-800/60 px-2.5 py-1.5 text-xs text-polar-300">
          {environmentMode === "WINTER" ? (
            <>
              <Snowflake className="h-3.5 w-3.5 text-accent-cyan" />
              <span className="font-mono text-xs text-accent-cyan font-medium">WINTER OPS</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-accent-amber" />
              <span className="font-mono text-xs text-accent-amber font-medium">SUMMER OPS</span>
            </>
          )}
        </div>

        {/* Connectivity Indicator */}
        <div
          data-testid="comms-indicator"
          className="flex items-center gap-2 rounded-lg border border-polar-700 bg-polar-800/60 px-2.5 py-1.5 text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connectivityStatus === "ONLINE"
                  ? "animate-ping bg-accent-green"
                  : "bg-accent-red"
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                connectivityStatus === "ONLINE" ? "bg-accent-green" : "bg-accent-red"
              }`}
            />
          </span>
          <Radio className="h-3.5 w-3.5 text-polar-400" />
          <span className="font-mono text-xs text-polar-200 uppercase font-semibold">
            {connectivityStatus}
          </span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh telemetry"
            aria-label="Refresh station telemetry"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-polar-700 bg-polar-800/80 text-polar-300 hover:text-polar-100 hover:border-polar-600 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-accent-cyan" : ""}`} />
          </button>
        )}

        {/* Synthetic Demo pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/40 px-2.5 py-1 text-[11px] text-slate-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span>SYNTHETIC DEMO DATASET</span>
        </div>
      </div>
    </header>
  );
}
