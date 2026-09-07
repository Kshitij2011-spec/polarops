import { Activity, Flame, Radio, RefreshCw, Snowflake, Sun, Zap } from "lucide-react";
import type { EnvironmentMode } from "../lib/api";

export type ViewMode =
  | "COMMAND_CENTER"
  | "ASSET_DETAIL"
  | "RESOURCES"
  | "SCENARIOS"
  | "RESILIENCE"
  | "PRIVACY"
  | "TERMS";

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
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-polar-700 bg-polar-900/95 px-6 py-3 backdrop-blur-sm">
      {/* ── Brand & Identity ────────────────────────── */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={onNavigateHome}
        role="button"
        tabIndex={0}
        aria-label="Return to Command Center"
        onKeyDown={(e) => e.key === "Enter" && onNavigateHome?.()}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded border border-polar-600 bg-polar-800 text-accent-cyan group-hover:border-accent-cyan transition-colors">
          <Activity className="h-4 w-4 text-accent-cyan" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-polar-100 font-mono">
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
      <nav aria-label="Main Operations Navigation" className="hidden lg:flex items-center gap-1 rounded border border-polar-700 bg-polar-950 p-1">
        <button
          onClick={() => onNavigateView?.("COMMAND_CENTER")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "COMMAND_CENTER"
              ? "bg-polar-800 text-accent-cyan border border-polar-600 font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-900"
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-accent-cyan" />
          <span>Command Center</span>
        </button>

        <button
          onClick={() => onNavigateView?.("RESOURCES")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "RESOURCES"
              ? "bg-polar-800 text-accent-cyan border border-polar-600 font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-900"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-polar-300" />
          <span>Resources &amp; Fuel</span>
        </button>

        <button
          onClick={() => onNavigateView?.("SCENARIOS")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "SCENARIOS"
              ? "bg-polar-800 text-accent-cyan border border-polar-600 font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-900"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-polar-300" />
          <span>What-If Scenarios</span>
        </button>

        <button
          onClick={() => onNavigateView?.("RESILIENCE")}
          data-testid="nav-resilience-btn"
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "RESILIENCE"
              ? "bg-polar-800 text-accent-cyan border border-polar-600 font-bold"
              : "text-polar-300 hover:text-polar-100 hover:bg-polar-900"
          }`}
        >
          <Radio className="h-3.5 w-3.5 text-polar-300" />
          <span>Resilience &amp; Disruption</span>
        </button>
      </nav>

      {/* ── Operational Controls & Station Selector ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Station Selector */}
        <div className="flex items-center gap-2 rounded border border-polar-700 bg-polar-800/90 px-2.5 py-1.5">
          <span className="text-xs font-semibold text-polar-400 font-mono">STATION:</span>
          <select
            id="station-select"
            aria-label="Select Antarctic Research Station"
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
            className="bg-transparent text-xs font-bold text-polar-100 focus:outline-none cursor-pointer font-mono"
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
        <div className="flex items-center gap-1.5 rounded border border-polar-700 bg-polar-800/60 px-2.5 py-1.5 text-xs text-polar-300 font-mono">
          {environmentMode === "WINTER" ? (
            <>
              <Snowflake className="h-3.5 w-3.5 text-accent-cyan" />
              <span className="text-xs text-accent-cyan font-medium">WINTER OPS</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-accent-amber" />
              <span className="text-xs text-accent-amber font-medium">SUMMER OPS</span>
            </>
          )}
        </div>

        {/* Connectivity Indicator */}
        <div
          data-testid="comms-indicator"
          className="flex items-center gap-2 rounded border border-polar-700 bg-polar-800/60 px-2.5 py-1.5 text-xs font-mono"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                connectivityStatus === "ONLINE" ? "bg-accent-green" : "bg-accent-red"
              }`}
            />
          </span>
          <Radio className="h-3.5 w-3.5 text-polar-400" />
          <span className="text-xs text-polar-200 uppercase font-semibold">
            {connectivityStatus}
          </span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh telemetry"
            aria-label="Refresh station telemetry"
            className="flex h-8 w-8 items-center justify-center rounded border border-polar-700 bg-polar-800 text-polar-300 hover:text-polar-100 hover:border-polar-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-accent-cyan" : ""}`} />
          </button>
        )}

        {/* Synthetic Demo badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded border border-polar-700 bg-polar-950 px-2 py-1 text-[10px] text-polar-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span>DEMO DATASET · SYNTHETIC</span>
        </div>
      </div>
    </header>
  );
}
