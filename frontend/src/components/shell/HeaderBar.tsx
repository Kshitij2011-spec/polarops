import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  CloudSnow,
  Wind,
  Clock,
  Search,
  ChevronDown,
  Layers,
  ShieldAlert,
  Boxes,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";
import { useStation, STATIONS, type StationId } from "@/context/StationContext";
import { fetchStationOverview } from "@/lib/api/station";
import { LinkHealthPill } from "@/components/foundation/LinkHealthPill";

export interface HeaderBarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function HeaderBar({ onMobileMenuToggle, isMobileMenuOpen }: HeaderBarProps) {
  const {
    activeStationId,
    activeStation,
    setActiveStationId,
    localLinkState,
    pendingSyncCount,
    openResilienceDrawer,
    openCommandPalette,
  } = useStation();

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

  return (
    <header
      className="h-16 bg-slate-950/95 border-b border-slate-800 text-slate-100 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 select-none backdrop-blur-md"
      role="banner"
    >
      {/* Left: Brand Identity & Station Switcher */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        <a
          href={`/twin?station=${encodeURIComponent(activeStationId)}`}
          className="flex items-center gap-2.5 shrink-0 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none rounded"
          aria-label="PolarOps Mission Home"
        >
          <div className="w-8 h-8 rounded bg-sky-500/10 border border-sky-400/40 text-sky-400 flex items-center justify-center font-bold">
            <Compass size={18} className="animate-spin-slow" aria-hidden="true" />
          </div>
          <div className="hidden sm:block">
            <div className="font-headline font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5 leading-none">
              <span>POLAROPS</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/80">
                v2.0
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 tracking-widest uppercase mt-0.5">
              Antarctic Mission OS • NCPOR
            </div>
          </div>
        </a>

        {/* Station Dropdown Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStationDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-mono transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            aria-expanded={stationDropdownOpen}
            aria-haspopup="listbox"
            aria-label={`Active Station: ${activeStation.name}. Click to switch.`}
          >
            <div className="text-left">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>{activeStation.name}</span>
                <span className="text-[10px] text-sky-400">[{activeStation.code}]</span>
              </div>
              <div className="text-[9px] text-slate-400 hidden md:block">
                {activeStation.coords}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
          </button>

          {stationDropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
              role="listbox"
            >
              {Object.values(STATIONS).map((st) => (
                <div
                  key={st.id}
                  onClick={() => {
                    setActiveStationId(st.id);
                    setStationDropdownOpen(false);
                  }}
                  className={`p-3 cursor-pointer transition-colors text-left ${
                    st.id === activeStationId
                      ? "bg-sky-950/60 border-l-2 border-sky-400 text-sky-100"
                      : "hover:bg-slate-800/60 text-slate-300"
                  }`}
                  role="option"
                  aria-selected={st.id === activeStationId}
                >
                  <div className="text-xs font-bold font-mono">{st.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{st.location}</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1 flex items-center justify-between">
                    <span>{st.coords}</span>
                    <span>{st.elevation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center/Right: Operational Context & Status */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Ambient Weather & Blizzard Alert */}
        {weather && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono">
            {isBlizzard ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold animate-pulse text-[10px]">
                <AlertTriangle size={12} className="shrink-0" />
                <span>BLIZZARD WARNING</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sky-400">
                <CloudSnow size={14} />
                <span>{weather.conditions}</span>
              </span>
            )}

            <span className="text-slate-300 font-semibold">{weather.temperature_celsius}°C</span>

            <span className="flex items-center gap-1 text-slate-400">
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
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
          <Clock size={12} className="text-slate-500" aria-hidden="true" />
          <span className="font-semibold text-slate-200">{utcTime}</span>
        </div>

        {/* Command Palette Trigger Button */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          title="Search machines, incidents, or jump to workspace (Ctrl+K)"
          aria-label="Open Command Palette"
        >
          <Search size={14} className="text-sky-400" />
          <span className="hidden xl:inline text-slate-400">Search</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] bg-slate-800 border border-slate-700 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Mobile Hamburger Menu Toggle */}
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>
    </header>
  );
}
