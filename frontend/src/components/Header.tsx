import { Activity, Flame, Globe, Moon, Radio, RefreshCw, Snowflake, Sun, Zap } from "lucide-react";
import type { EnvironmentMode } from "../lib/api";
import { useTheme } from "../hooks/useTheme";

export type ViewMode =
  | "COMMAND_CENTER"
  | "ASSET_DETAIL"
  | "RESOURCES"
  | "SCENARIOS"
  | "RESILIENCE"
  | "STATIONS"
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
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-[#2a2f3e] bg-white/95 dark:bg-[#0f1117]/95 px-6 py-3 backdrop-blur-sm transition-colors">
      {/* ── Brand & Identity ────────────────────────── */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={onNavigateHome}
        role="button"
        tabIndex={0}
        aria-label="Return to Command Center"
        onKeyDown={(e) => e.key === "Enter" && onNavigateHome?.()}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#181b24] text-blue-600 dark:text-[#5b9cf5] group-hover:border-blue-500 transition-colors shadow-2xs">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#e4e8f0] font-mono">
              POLAR<span className="text-blue-600 dark:text-[#5b9cf5]">OPS</span>
            </h1>
            <span className="rounded bg-slate-100 dark:bg-[#1e2230] px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:text-[#9ca3b4] border border-slate-200 dark:border-[#2a2f3e]">
              v1.0-MVP
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#7a8194]">Antarctic Operational Digital Twin</p>
        </div>
      </div>

      {/* ── Primary Section Navigation ─────────────── */}
      <nav aria-label="Main Operations Navigation" className="hidden lg:flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-100/80 dark:bg-[#141721] p-1">
        <button
          onClick={() => onNavigateView?.("COMMAND_CENTER")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "COMMAND_CENTER"
              ? "bg-white dark:bg-[#1e2230] text-blue-700 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#3d4556] shadow-2xs font-bold"
              : "text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:bg-slate-200/50 dark:hover:bg-[#181b24]"
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
          <span>Command Center</span>
        </button>

        <button
          onClick={() => onNavigateView?.("RESOURCES")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "RESOURCES"
              ? "bg-white dark:bg-[#1e2230] text-blue-700 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#3d4556] shadow-2xs font-bold"
              : "text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:bg-slate-200/50 dark:hover:bg-[#181b24]"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Resources &amp; Fuel</span>
        </button>

        <button
          onClick={() => onNavigateView?.("SCENARIOS")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "SCENARIOS"
              ? "bg-white dark:bg-[#1e2230] text-blue-700 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#3d4556] shadow-2xs font-bold"
              : "text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:bg-slate-200/50 dark:hover:bg-[#181b24]"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>What-If Scenarios</span>
        </button>

        <button
          onClick={() => onNavigateView?.("RESILIENCE")}
          data-testid="nav-resilience-btn"
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "RESILIENCE"
              ? "bg-white dark:bg-[#1e2230] text-blue-700 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#3d4556] shadow-2xs font-bold"
              : "text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:bg-slate-200/50 dark:hover:bg-[#181b24]"
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Resilience &amp; Disruption</span>
        </button>

        <button
          onClick={() => onNavigateView?.("STATIONS")}
          data-testid="nav-stations-btn"
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
            activeView === "STATIONS"
              ? "bg-white dark:bg-[#1e2230] text-blue-700 dark:text-[#5b9cf5] border border-slate-200 dark:border-[#3d4556] shadow-2xs font-bold"
              : "text-slate-600 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:bg-slate-200/50 dark:hover:bg-[#181b24]"
          }`}
        >
          <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
          <span>Station Portfolio</span>
        </button>
      </nav>

      {/* ── Operational Controls & Station Selector ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Station Selector */}
        <div className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] px-2.5 py-1.5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#7a8194] font-mono">STATION:</span>
          <select
            id="station-select"
            aria-label="Select Antarctic Research Station"
            value={selectedStationId}
            onChange={(e) => onSelectStation(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 dark:text-[#e4e8f0] focus:outline-none cursor-pointer font-mono"
          >
            <option value="STATION-BHARATI" className="bg-white dark:bg-[#181b24] text-slate-900 dark:text-[#e4e8f0]">
              Bharati Station (Larsemann Hills)
            </option>
            <option value="STATION-MAITRI" className="bg-white dark:bg-[#181b24] text-slate-900 dark:text-[#e4e8f0]">
              Maitri Station (Schirmacher Oasis)
            </option>
          </select>
        </div>

        {/* Season Mode */}
        <div className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#181b24] px-2.5 py-1.5 text-xs font-mono shadow-2xs">
          {environmentMode === "WINTER" ? (
            <>
              <Snowflake className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
              <span className="text-xs text-blue-700 dark:text-[#5b9cf5] font-semibold">WINTER OPS</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-600 dark:text-[#fbbf24]" />
              <span className="text-xs text-amber-700 dark:text-[#fbbf24] font-semibold">SUMMER OPS</span>
            </>
          )}
        </div>

        {/* Connectivity Indicator */}
        <div
          data-testid="comms-indicator"
          className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50 dark:bg-[#181b24] px-2.5 py-1.5 text-xs font-mono shadow-2xs"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                connectivityStatus === "ONLINE" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
          <Radio className="h-3.5 w-3.5 text-slate-400 dark:text-[#6b7280]" />
          <span className="text-xs text-slate-800 dark:text-[#e4e8f0] uppercase font-semibold">
            {connectivityStatus}
          </span>
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          data-testid="theme-toggle-btn"
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] text-slate-700 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:border-slate-300 dark:hover:border-[#3d4556] transition-colors cursor-pointer shadow-2xs"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-slate-600" />
          )}
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh telemetry"
            aria-label="Refresh station telemetry"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] text-slate-700 dark:text-[#9ca3b4] hover:text-slate-900 dark:hover:text-[#e4e8f0] hover:border-slate-300 dark:hover:border-[#3d4556] transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-blue-600 dark:text-[#5b9cf5]" : ""}`} />
          </button>
        )}

        {/* Synthetic Demo badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-100 dark:bg-[#141721] px-2 py-1 text-[10px] text-slate-600 dark:text-[#7a8194] font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>DEMO DATASET · SYNTHETIC</span>
        </div>
      </div>
    </header>
  );
}
