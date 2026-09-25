import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  CloudSnow,
  Wind,
  Clock,
  Search,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useStation, STATIONS } from "@/context/StationContext";
import { fetchStationOverview } from "@/lib/api/station";
import { LinkHealthPill } from "@/components/foundation/LinkHealthPill";
import { useTheme, useOperations } from "@/components/polarops";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export interface HeaderBarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  onDesktopSidebarToggle?: () => void;
  isDesktopSidebarCollapsed?: boolean;
}

export function HeaderBar({
  onMobileMenuToggle,
  isMobileMenuOpen,
  onDesktopSidebarToggle,
  isDesktopSidebarCollapsed,
}: HeaderBarProps) {
  const {
    activeStationId,
    activeStation,
    setActiveStationId,
    localLinkState,
    pendingSyncCount,
    openResilienceDrawer,
    openCommandPalette,
  } = useStation();

  const { dark, toggle: toggleTheme } = useTheme();
  const { mode: operationsMode } = useOperations();
  const { data: healthData, isError: healthError } = useHealthCheck();

  const [utcTime, setUtcTime] = useState("");
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);

  // Live UTC Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live ambient weather and station health
  const { data: stationOverview } = useQuery({
    queryKey: ["station-overview", activeStationId],
    queryFn: () => fetchStationOverview(activeStationId),
    refetchInterval: 10000,
  });

  const weather = stationOverview?.ambient_weather;
  const isBlizzard = (weather?.wind_speed_knots ?? 0) >= 35;

  const isOffline = operationsMode === "offline";
  const apiOnline = healthData?.status === "ok";

  const connectivityText = isOffline
    ? "OFFLINE MODE"
    : apiOnline
    ? "CONNECTED"
    : healthError
    ? "DISCONNECTED"
    : "CONNECTING...";

  const connectivityDotColor = isOffline
    ? "bg-[#F4895F]"
    : apiOnline
    ? "bg-[#4FAE7A]"
    : healthError
    ? "bg-[#DE324C]"
    : "bg-[#F4895F] animate-pulse";

  const syncText = isOffline
    ? "LOCAL OPERATION ACTIVE"
    : apiOnline
    ? "SYNCHRONIZED"
    : "PENDING SYNC";

  return (
    <header
      className="h-16 bg-white/95 dark:bg-[#070B12]/95 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 sm:px-5 flex items-center justify-between gap-3 sticky top-0 z-40 select-none backdrop-blur-md"
      role="banner"
    >
      {/* Left: Hamburger & Brand Identity & Station Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Drawer Button */}
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none"
            aria-label={isMobileMenuOpen ? "Close navigation drawer" : "Open navigation drawer"}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Desktop Sidebar Toggle Button */}
        {onDesktopSidebarToggle && (
          <button
            type="button"
            onClick={onDesktopSidebarToggle}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none"
            aria-label={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isDesktopSidebarCollapsed ? "Expand sidebar (Ctrl+\\)" : "Collapse sidebar (Ctrl+\\)"}
          >
            {isDesktopSidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}

        {/* Interactive POLAROPS Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 py-1 px-1 rounded hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none group"
          aria-label="PolarOps Antarctic Operational Digital Twin - Mission Home"
          title="Return to PolarOps Mission Gateway"
        >
          <div className="w-8 h-8 rounded bg-[#172554] dark:bg-[#0F1E3D] border border-[#369ACC]/40 text-[#46B9C7] flex items-center justify-center shrink-0 group-hover:border-[#46B9C7] transition-colors">
            <Compass size={18} className="animate-spin-slow text-[#46B9C7]" aria-hidden="true" />
          </div>
          <div className="hidden sm:block leading-none text-left">
            <div className="font-bold text-sm tracking-wider text-[#172554] dark:text-white flex items-center gap-1.5">
              <span>POLAROPS</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[#369ACC] border border-slate-200 dark:border-slate-700">
                v2.0
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Antarctic Digital Twin
            </div>
          </div>
        </Link>

        {/* Station Dropdown Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStationDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-mono transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none"
            aria-expanded={stationDropdownOpen}
            aria-haspopup="listbox"
            aria-label={`Active Station: ${activeStation.name}. Click to switch.`}
          >
            <div className="text-left leading-tight">
              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">STATION:</span>
                <span className="text-slate-900 dark:text-white">{activeStation.name.replace("Station", "").trim()}</span>
                <span className="text-[10px] text-[#369ACC]">[{activeStation.code}]</span>
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-0.5" />
          </button>

          {stationDropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
              role="listbox"
            >
              {Object.values(STATIONS).map((st) => (
                <div
                  key={st.id}
                  onClick={() => {
                    setActiveStationId(st.id);
                    setStationDropdownOpen(false);
                  }}
                  className={`p-2.5 cursor-pointer transition-colors text-left ${
                    st.id === activeStationId
                      ? "bg-[#369ACC]/10 dark:bg-[#369ACC]/20 border-l-2 border-[#369ACC] text-slate-900 dark:text-white"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                  }`}
                  role="option"
                  aria-selected={st.id === activeStationId}
                >
                  <div className="text-xs font-bold font-mono">{st.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{st.location}</div>
                  <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
                    <span>{st.coords}</span>
                    <span>{st.elevation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operational Context: State: WINTER */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400 dark:text-slate-500 uppercase">STATE:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">WINTER</span>
        </div>

        {/* Connectivity & Sync status badges for larger screens */}
        <div className="hidden xl:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${connectivityDotColor}`} aria-hidden="true" />
            <span className="text-slate-400 dark:text-slate-500 uppercase">LINK:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{connectivityText}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400 dark:text-slate-500 uppercase">SYNC:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{syncText}</span>
          </div>
        </div>
      </div>

      {/* Right: Operational Indicators, UTC Clock, Search & Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Ambient Weather & Blizzard Alert */}
        {weather && (
          <div className="hidden lg:flex items-center gap-2.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            {isBlizzard ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 font-bold animate-pulse text-[10px]">
                <AlertTriangle size={12} className="shrink-0" />
                <span>BLIZZARD</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#369ACC]">
                <CloudSnow size={14} />
                <span>{weather.conditions}</span>
              </span>
            )}

            <span className="text-slate-700 dark:text-slate-200 font-semibold">{weather.temperature_celsius.toFixed(1)}°C</span>

            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <Wind size={12} />
              <span>{weather.wind_speed_knots} kts</span>
            </span>
          </div>
        )}

        {/* Global Edge Resilience Comms Link Pill */}
        <LinkHealthPill
          status={localLinkState}
          pendingCount={pendingSyncCount}
          onClick={openResilienceDrawer}
        />

        {/* UTC Clock Ticker */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
          <Clock size={12} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{utcTime || "14:32:08 UTC"}</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none"
          title="Search machines, incidents, or jump to workspace (Ctrl+K)"
          aria-label="Open Command Palette"
        >
          <Search size={14} className="text-[#369ACC]" />
          <span className="hidden xl:inline text-slate-500 dark:text-slate-400">Search</span>
          <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none"
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title={dark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
