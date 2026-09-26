import React, { useState, useEffect, useRef } from "react";
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
  Settings,
  FileText,
  Database,
  Radio,
  User,
} from "lucide-react";
import { useStation, STATIONS } from "@/context/StationContext";
import { fetchStationOverview } from "@/lib/api/station";
import { useTheme, useOperations } from "@/components/polarops";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export interface HeaderBarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  onDesktopSidebarToggle?: () => void;
  isDesktopSidebarCollapsed?: boolean;
}

/**
 * Authoritative PolarOps Application Top Header / Navbar
 * 
 * Clean, professional, compact, functional, consistent, and easy to scan.
 * Guaranteed zero overlap across all responsive viewports.
 * 
 * Hierarchy:
 * LEFT:   [sidebar toggle] [POLAROPS brand]
 * CENTER: [Station selector] [one concise operational context/status]
 * RIGHT:  [Connectivity] [Clock] [Search] [Theme] [Profile]
 */
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
    openResilienceDrawer,
    openCommandPalette,
  } = useStation();

  const { dark, toggle: toggleTheme } = useTheme();
  const { mode: operationsMode } = useOperations();
  const { data: healthData, isError: healthError } = useHealthCheck();

  const [utcTime, setUtcTime] = useState("");
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const stationDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Live UTC Clock ticker (IBM Plex Mono)
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

  // Click outside & Escape key listeners to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        stationDropdownRef.current &&
        !stationDropdownRef.current.contains(e.target as Node)
      ) {
        setStationDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStationDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Live ambient weather query
  const { data: stationOverview } = useQuery({
    queryKey: ["station-overview", activeStationId],
    queryFn: () => fetchStationOverview(activeStationId),
    refetchInterval: 10000,
  });

  const weather = stationOverview?.ambient_weather;
  const isBlizzard = (weather?.wind_speed_knots ?? 0) >= 35;
  const tempText = weather?.temperature_celsius != null ? `${weather.temperature_celsius.toFixed(1)}°C` : "-28.5°C";
  const windText = weather?.wind_speed_knots != null ? `${weather.wind_speed_knots} kt` : "42 kt";
  const conditionsText = isBlizzard ? "BLIZZARD" : (weather?.conditions || "OVERCAST");

  // Single authoritative connectivity status
  const isOffline = operationsMode === "offline";
  const apiOnline = healthData?.status === "ok";

  let connectivityLabel = "ONLINE";
  let connectivityBadge = "SAT-1";
  let connectivityDot = "bg-emerald-500";
  let shouldPulse = false;

  if (isOffline) {
    connectivityLabel = "OFFLINE";
    connectivityBadge = "LOCAL";
    connectivityDot = "bg-amber-500";
  } else if (healthError) {
    connectivityLabel = "DISCONNECTED";
    connectivityBadge = "LINK LOSS";
    connectivityDot = "bg-rose-500";
  } else if (localLinkState === "DEGRADED") {
    connectivityLabel = "DEGRADED";
    connectivityBadge = "LATENCY";
    connectivityDot = "bg-amber-500";
  } else if (localLinkState === "QUEUED") {
    connectivityLabel = "QUEUED";
    connectivityBadge = "BUFFER";
    connectivityDot = "bg-indigo-400";
    shouldPulse = true;
  } else if (localLinkState === "RECONNECTING" || localLinkState === "SYNCHRONIZING") {
    connectivityLabel = localLinkState === "SYNCHRONIZING" ? "SYNCING" : "CONNECTING";
    connectivityBadge = "LINK";
    connectivityDot = "bg-sky-400";
    shouldPulse = true;
  } else if (apiOnline) {
    connectivityLabel = "ONLINE";
    connectivityBadge = "SAT-1";
    connectivityDot = "bg-emerald-500";
  } else {
    connectivityLabel = "CONNECTING";
    connectivityBadge = "SAT-1";
    connectivityDot = "bg-amber-400";
    shouldPulse = true;
  }

  return (
    <header
      className="h-16 bg-white dark:bg-[#070B12] border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-3 sticky top-0 z-40 select-none shrink-0 w-full transition-colors duration-200"
      role="banner"
    >
      {/* ========================================================
          LEFT: [sidebar toggle] [POLAROPS logo/brand]
          ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Hamburger Drawer Button */}
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none cursor-pointer"
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
            className="hidden lg:flex p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none cursor-pointer"
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

        {/* PolarOps Brand Identity — Compact orientation in navbar */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 py-1 px-1 rounded hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none group transition-opacity"
          aria-label="PolarOps Mission Gateway"
          title="Return to PolarOps Mission Gateway"
        >
          <div className="w-8 h-8 rounded bg-[#172554] dark:bg-[#0F1E3D] border border-[#369ACC]/40 dark:border-[#369ACC]/50 text-[#46B9C7] flex items-center justify-center shrink-0 group-hover:border-[#46B9C7] transition-colors">
            <Compass size={18} className="text-[#46B9C7]" aria-hidden="true" />
          </div>
          <span className="font-bold text-sm tracking-wider text-[#172554] dark:text-white font-sans transition-colors duration-200">
            POLAROPS
          </span>
        </Link>
      </div>

      {/* ========================================================
          CENTER: [Station selector] [Operational context/status]
          ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Station Selector Dropdown */}
        <div className="relative" ref={stationDropdownRef}>
          <button
            type="button"
            onClick={() => setStationDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none"
            aria-expanded={stationDropdownOpen}
            aria-haspopup="listbox"
            aria-label={`Station: ${activeStation.name}. Click to switch station.`}
          >
            <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
              STATION:
            </span>
            <span className="font-semibold text-slate-900 dark:text-white font-sans">
              {activeStation.name.replace("Station", "").trim()}
            </span>
            <span className="text-[10px] font-mono text-[#369ACC] dark:text-[#46B9C7] font-medium hidden 2xl:inline">
              [{activeStation.code}]
            </span>
            <ChevronDown
              size={13}
              className={`text-slate-400 dark:text-slate-400 transition-transform duration-150 ${
                stationDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {stationDropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
              role="listbox"
              aria-label="Select Antarctic Station"
            >
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Select Active Research Station
              </div>
              {Object.values(STATIONS).map((st) => {
                const isSelected = st.id === activeStationId;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setActiveStationId(st.id);
                      setStationDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 text-left transition-colors duration-150 flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#369ACC]/10 dark:bg-[#369ACC]/20 border-l-2 border-[#369ACC] text-slate-900 dark:text-white"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div>
                      <div className="text-xs font-bold font-sans flex items-center gap-1.5">
                        <span>{st.name}</span>
                        <span className="text-[10px] font-mono text-[#369ACC] dark:text-[#46B9C7]">[{st.code}]</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {st.location}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2">
                        <span>{st.coords}</span>
                        <span>•</span>
                        <span>{st.elevation}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#369ACC] dark:bg-[#46B9C7] mt-1 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Consolidated Environmental Status Area */}
        <div
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-700 dark:text-slate-300 shrink-0 transition-colors duration-150"
          title={`Seasonal State: Winter Operations | Weather: ${conditionsText} | Temp: ${tempText} | Wind: ${windText}`}
        >
          {/* Status Dot */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isBlizzard ? "bg-rose-500 animate-pulse" : "bg-[#369ACC] dark:bg-[#46B9C7]"
            }`}
            aria-hidden="true"
          />

          <span className="font-semibold text-slate-900 dark:text-white tracking-wide">
            WINTER
          </span>

          <span className="text-slate-300 dark:text-slate-600">·</span>

          {isBlizzard ? (
            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 animate-pulse text-[11px]">
              <AlertTriangle size={12} className="shrink-0" />
              <span>BLIZZARD</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#369ACC] dark:text-[#46B9C7] text-[11px] font-medium">
              <CloudSnow size={12} className="shrink-0" />
              <span>{conditionsText}</span>
            </span>
          )}

          <span className="text-slate-300 dark:text-slate-600">·</span>

          <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200">
            {tempText}
          </span>

          <span className="hidden 2xl:inline text-slate-300 dark:text-slate-600">·</span>

          <span className="hidden 2xl:inline-flex items-center gap-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <Wind size={11} className="shrink-0 text-slate-400 dark:text-slate-500" />
            <span>{windText}</span>
          </span>
        </div>
      </div>

      {/* ========================================================
          RIGHT: [Connectivity] [Clock] [Search] [Theme] [Profile]
          ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-2 shrink-0">
        {/* Consolidated Connectivity Status Indicator */}
        <button
          type="button"
          onClick={openResilienceDrawer}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-colors duration-150 cursor-pointer bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none shrink-0"
          title="Edge Resilience & Satellite Telemetry (Click to inspect)"
          aria-label={`Connectivity status: ${connectivityLabel}. Details: ${connectivityBadge}. Click to open Satellite Resilience drawer.`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${connectivityDot} ${
              shouldPulse ? "animate-pulse" : ""
            }`}
            aria-hidden="true"
          />
          <span className="font-semibold text-slate-900 dark:text-white">
            {connectivityLabel}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden min-[1360px]:inline">
            · {connectivityBadge}
          </span>
        </button>

        {/* Quiet UTC Clock Ticker (IBM Plex Mono) — Visible on desktop (1360px+) */}
        <div
          className="hidden min-[1360px]:inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 px-1 select-none shrink-0 transition-colors duration-150"
          title="Authoritative Coordinated Universal Time (UTC)"
          aria-label={`Current UTC Time: ${utcTime}`}
        >
          <Clock size={12} className="text-slate-400 dark:text-slate-400 shrink-0" aria-hidden="true" />
          <span className="tracking-tight">{utcTime || "12:00:00 UTC"}</span>
        </div>

        {/* Functional Search / Command Palette Trigger */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none shrink-0"
          title="Search assets, incidents, or jump to workspace (Ctrl+K)"
          aria-label="Search or open command palette (Ctrl+K)"
        >
          <Search size={14} className="text-[#369ACC] dark:text-[#46B9C7]" aria-hidden="true" />
          <span className="hidden 2xl:inline text-slate-500 dark:text-slate-400">Search</span>
          <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Functional Light / Dark Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none cursor-pointer shrink-0"
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title={dark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {dark ? (
            <Sun size={15} className="text-amber-400" aria-hidden="true" />
          ) : (
            <Moon size={15} className="text-slate-600" aria-hidden="true" />
          )}
        </button>

        {/* Generic User / Account Menu at Far Right */}
        <div className="relative shrink-0" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#369ACC] focus-visible:outline-none"
            aria-expanded={profileDropdownOpen}
            aria-haspopup="menu"
            aria-label="Open user menu"
            title="User and system menu"
          >
            <User size={15} className="text-slate-600 dark:text-slate-300 shrink-0" aria-hidden="true" />
            <ChevronDown
              size={13}
              className={`text-slate-400 dark:text-slate-400 transition-transform duration-150 ${
                profileDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100 text-left font-sans"
              role="menu"
              aria-label="User Menu"
            >
              {/* Clean Generic Header */}
              <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-slate-800/80">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  User Session
                </div>
              </div>

              {/* Supported Operational Settings Links */}
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
                  role="menuitem"
                >
                  <Settings size={14} className="text-[#369ACC] dark:text-[#46B9C7] shrink-0" />
                  <span>Settings</span>
                </Link>

                <Link
                  to="/reports"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
                  role="menuitem"
                >
                  <FileText size={14} className="text-[#369ACC] dark:text-[#46B9C7] shrink-0" />
                  <span>Operational Reports</span>
                </Link>

                <Link
                  to="/offline"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
                  role="menuitem"
                >
                  <Database size={14} className="text-[#369ACC] dark:text-[#46B9C7] shrink-0" />
                  <span>Offline Storage</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
