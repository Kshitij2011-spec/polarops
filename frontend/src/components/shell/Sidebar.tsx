import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CircleGauge,
  Boxes,
  Radio,
  Fuel,
  Activity,
  ShieldCheck,
  Bell,
  FileText,
  CloudOff,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const SIDEBAR_NAV_GROUPS: NavGroup[] = [
  {
    group: "COMMAND",
    items: [
      { label: "Overview", to: "/command-center", icon: CircleGauge },
      { label: "Digital Twin", to: "/digital-twin", icon: Boxes },
      { label: "Stations", to: "/stations", icon: Radio },
    ],
  },
  {
    group: "OPERATIONS",
    items: [
      { label: "Resources", to: "/resources", icon: Fuel },
      { label: "Scenarios", to: "/scenarios", icon: Activity },
      { label: "Resilience", to: "/resilience", icon: ShieldCheck },
      { label: "Alerts", to: "/alerts", icon: Bell },
    ],
  },
  {
    group: "REPORTING",
    items: [
      { label: "Reports", to: "/reports", icon: FileText },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Offline Analog", to: "/offline", icon: CloudOff },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobile?: boolean;
  onCloseMobile?: () => void;
}

function SidebarHealthBadge({ collapsed }: { collapsed: boolean }) {
  const { data, isLoading, isError } = useHealthCheck();

  if (collapsed) {
    return (
      <div
        className="p-3 flex justify-center border-t border-slate-200 dark:border-slate-800"
        title={
          isLoading
            ? "API: Connecting..."
            : isError || !data
            ? "API: Offline / Standalone Demo"
            : `API Online: ${data.service}`
        }
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isLoading
              ? "bg-amber-500 animate-pulse"
              : isError || !data
              ? "bg-red-500"
              : "bg-emerald-500"
          }`}
        />
      </div>
    );
  }

  return (
    <div className="p-3 text-[11px] font-mono border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isLoading
              ? "bg-amber-500 animate-pulse"
              : isError || !data
              ? "bg-red-500"
              : "bg-emerald-500"
          }`}
        />
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {isLoading
            ? "CONNECTING..."
            : isError || !data
            ? "LOCAL / DEMO MODE"
            : "POLAROPS API ONLINE"}
        </span>
      </div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 pl-4">
        {data ? `${data.service.toUpperCase()} · V1 OK` : "STANDALONE RESILIENT"}
      </div>
    </div>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobile = false,
  onCloseMobile,
}: SidebarProps) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarWidthClass = mobile
    ? "w-64"
    : collapsed
    ? "w-[68px]"
    : "w-[240px]";

  return (
    <aside
      className={`h-full flex flex-col bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 select-none transition-[width] duration-200 ease-in-out relative z-30 ${sidebarWidthClass}`}
      role="navigation"
      aria-label="PolarOps Primary Sidebar Navigation"
    >
      {/* Top Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link
          to="/"
          onClick={mobile ? onCloseMobile : undefined}
          className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#369ACC] rounded py-1 px-0.5 group"
          aria-label="PolarOps Mission Home"
          title="PolarOps Antarctic Digital Twin — Click to return to Mission Gateway"
        >
          <div className="w-8 h-8 rounded bg-[#172554] dark:bg-[#0F1E3D] border border-[#369ACC]/40 text-[#46B9C7] flex items-center justify-center shrink-0 group-hover:border-[#46B9C7] transition-colors">
            <Compass size={18} className="animate-spin-slow text-[#46B9C7]" />
          </div>
          {(!collapsed || mobile) && (
            <div className="leading-tight min-w-0">
              <div className="font-bold text-sm tracking-wider text-[#172554] dark:text-white flex items-center gap-1.5">
                <span>POLAROPS</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[#369ACC] font-semibold border border-slate-200 dark:border-slate-700">
                  v2.0
                </span>
              </div>
              <div className="text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider truncate">
                Antarctic Digital Twin
              </div>
            </div>
          )}
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#369ACC]"
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {SIDEBAR_NAV_GROUPS.map(({ group, items }) => (
          <div key={group} className="space-y-0.5">
            {(!collapsed || mobile) && (
              <div className="px-2.5 pb-1 text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {group}
              </div>
            )}
            {collapsed && !mobile && (
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-1" />
            )}

            {items.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.to ||
                (item.to === "/command-center" && (currentPath === "/command-center" || currentPath === "/")) ||
                (item.to === "/digital-twin" && currentPath === "/twin");

              return (
                <div
                  key={item.to}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.to)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    to={item.to}
                    onClick={mobile ? onCloseMobile : undefined}
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-medium transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#369ACC] ${
                      collapsed && !mobile ? "justify-center px-0 h-10 w-full" : ""
                    } ${
                      isActive
                        ? "bg-[#369ACC]/10 text-[#369ACC] dark:bg-[#369ACC]/20 dark:text-[#46B9C7] font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#369ACC]"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      size={17}
                      className={`shrink-0 ${
                        isActive
                          ? "text-[#369ACC] dark:text-[#46B9C7]"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    {(!collapsed || mobile) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                  </Link>

                  {/* Tooltip in Collapsed Desktop Mode */}
                  {collapsed && !mobile && hoveredItem === item.to && (
                    <div
                      role="tooltip"
                      className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white dark:bg-slate-800 text-[11px] font-mono font-medium rounded shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse / Expand Toggle for Desktop */}
      {!mobile && (
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex items-center gap-2 p-2 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#369ACC] ${
              collapsed ? "w-full justify-center" : "w-full"
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar (Ctrl+\\)" : "Collapse sidebar (Ctrl+\\)"}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span className="text-[11px]">COLLAPSE SIDEBAR</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Live Health Badge */}
      <SidebarHealthBadge collapsed={collapsed && !mobile} />
    </aside>
  );
}
