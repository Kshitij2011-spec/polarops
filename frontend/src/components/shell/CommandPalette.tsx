import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Server, ShieldAlert, Layers, Boxes, Fuel, ArrowRight, X } from "lucide-react";
import { useStation } from "@/context/StationContext";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "WORKSPACES" | "STATIONS" | "ASSETS" | "INCIDENTS";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    activeStationId,
    setActiveStationId,
  } = useStation();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  const items: CommandItem[] = useMemo(() => {
    return [
      {
        id: "nav-twin",
        title: "Command + Digital Twin",
        subtitle: "Monitor station health, live telemetry, and topological blast radius",
        category: "WORKSPACES",
        icon: Layers,
        action: () => {
          window.location.href = `/twin?station=${encodeURIComponent(activeStationId)}`;
          closeCommandPalette();
        },
      },
      {
        id: "nav-cockpit",
        title: "Incident + Decision Cockpit",
        subtitle: "Investigate crises, simulate counterfactuals, and dispatch decisions",
        category: "WORKSPACES",
        icon: ShieldAlert,
        action: () => {
          window.location.href = `/cockpit?station=${encodeURIComponent(activeStationId)}`;
          closeCommandPalette();
        },
      },
      {
        id: "nav-continuity",
        title: "Continuity + Logistics",
        subtitle: "Audit fuel runway, thermal balance, critical spares, and edge link",
        category: "WORKSPACES",
        icon: Boxes,
        action: () => {
          window.location.href = `/continuity?station=${encodeURIComponent(activeStationId)}`;
          closeCommandPalette();
        },
      },
      {
        id: "station-bharati",
        title: "Switch to Bharati Station",
        subtitle: "69°24'S, 76°11'E • Larsemann Hills • Primary Base",
        category: "STATIONS",
        icon: Server,
        action: () => {
          setActiveStationId("STATION-BHARATI");
          closeCommandPalette();
        },
      },
      {
        id: "station-maitri",
        title: "Switch to Maitri Station",
        subtitle: "70°46'S, 11°44'E • Schirmacher Oasis • Inland Base",
        category: "STATIONS",
        icon: Server,
        action: () => {
          setActiveStationId("STATION-MAITRI");
          closeCommandPalette();
        },
      },
      {
        id: "asset-g02",
        title: "Generator G-02 (Diesel Genset 2)",
        subtitle: "Primary power generation • High vibration anomaly",
        category: "ASSETS",
        icon: Fuel,
        action: () => {
          window.location.href = `/twin?station=${encodeURIComponent(activeStationId)}&asset=G-02`;
          closeCommandPalette();
        },
      },
      {
        id: "asset-g01",
        title: "Generator G-01 (Diesel Genset 1)",
        subtitle: "Base load generation • Nominal operation",
        category: "ASSETS",
        icon: Fuel,
        action: () => {
          window.location.href = `/twin?station=${encodeURIComponent(activeStationId)}&asset=G-01`;
          closeCommandPalette();
        },
      },
      {
        id: "asset-hvac01",
        title: "HVAC-01 (Habitat Life Support Air Handler)",
        subtitle: "Living quarters heating and environmental circulation",
        category: "ASSETS",
        icon: Server,
        action: () => {
          window.location.href = `/twin?station=${encodeURIComponent(activeStationId)}&asset=HVAC-01`;
          closeCommandPalette();
        },
      },
      {
        id: "incident-active",
        title: "INC-2026-003: G-02 Bearing Thermal Surge",
        subtitle: "Critical vibration spike • Life support redundancy alert",
        category: "INCIDENTS",
        icon: ShieldAlert,
        action: () => {
          window.location.href = `/cockpit?station=${encodeURIComponent(activeStationId)}&incident=INC-2026-003`;
          closeCommandPalette();
        },
      },
    ];
  }, [activeStationId, closeCommandPalette, setActiveStationId]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeCommandPalette();
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100"
      onClick={closeCommandPalette}
      role="dialog"
      aria-modal="true"
      aria-label="PolarOps Command Palette"
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-md shadow-2xl overflow-hidden flex flex-col focus-visible:outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search size={18} className="text-sky-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, machine ID (G-02), incident, or workspace..."
            className="flex-1 bg-transparent text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none"
            aria-label="Search operational commands"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
          <button
            type="button"
            onClick={closeCommandPalette}
            className="text-slate-400 hover:text-slate-200 p-1"
            aria-label="Close command palette"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching machine, incident, or command found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-sky-950/60 text-sky-200 border-l-2 border-sky-400" : "text-slate-300 hover:bg-slate-800/50"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded ${
                        isSelected ? "bg-sky-900/60 text-sky-300" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold tracking-wide truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={14} className="text-sky-400 animate-pulse" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <span>PolarOps v2.0 • Polar Engineering Core</span>
        </div>
      </div>
    </div>
  );
}
