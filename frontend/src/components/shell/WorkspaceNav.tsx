import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers, ShieldAlert, Boxes } from "lucide-react";
import { useStation } from "@/context/StationContext";
import { fetchIncidents } from "@/lib/api/incidents";

export function WorkspaceNav() {
  const { activeStationId } = useStation();
  const location = useLocation();
  const currentPath = location.pathname;

  // Query active incidents count for notification badge
  const { data: incidents } = useQuery({
    queryKey: ["incidents", activeStationId],
    queryFn: () => fetchIncidents(activeStationId),
    refetchInterval: 15000,
  });

  const activeIncidentsCount = incidents?.filter((i) => i.status === "ACTIVE").length ?? 0;

  const workspaces = [
    {
      id: "twin",
      label: "COMMAND + DIGITAL TWIN",
      sublabel: "State • Telemetry • Topology",
      path: "/twin",
      icon: Layers,
      match: currentPath === "/twin" || currentPath === "/digital-twin" || currentPath === "/command-center",
    },
    {
      id: "cockpit",
      label: "INCIDENT + DECISION COCKPIT",
      sublabel: "Crises • What-If • Mitigation",
      path: "/cockpit",
      icon: ShieldAlert,
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount} ACTIVE` : undefined,
      badgeVariant: "critical",
      match: currentPath === "/cockpit" || currentPath === "/scenarios" || currentPath === "/alerts",
    },
    {
      id: "continuity",
      label: "CONTINUITY + LOGISTICS",
      sublabel: "Fuel • Spares • Resupply • Comms",
      path: "/continuity",
      icon: Boxes,
      match: currentPath === "/continuity" || currentPath === "/resources" || currentPath === "/resilience",
    },
  ];

  return (
    <nav
      className="h-12 bg-slate-950/80 border-b border-slate-800/90 px-4 sm:px-6 flex items-center justify-between overflow-x-auto select-none"
      role="navigation"
      aria-label="PolarOps Primary Workspaces"
    >
      <div className="flex items-center gap-1 sm:gap-2 h-full min-w-max">
        {workspaces.map((ws) => {
          const Icon = ws.icon;
          const isActive = ws.match;

          return (
            <Link
              key={ws.id}
              to={ws.path}
              search={{ station: activeStationId }}
              className={`h-full px-3 sm:px-4 flex items-center gap-2.5 text-xs font-mono font-bold tracking-wider transition-all border-b-2 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                isActive
                  ? "border-sky-400 text-sky-300 bg-sky-950/30"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={15}
                className={isActive ? "text-sky-400" : "text-slate-500"}
                aria-hidden="true"
              />

              <div className="flex items-center gap-2">
                <span>{ws.label}</span>
                {ws.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-red-950 text-red-300 border border-red-700 font-bold animate-pulse">
                    {ws.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Right: Operational Principle indicator */}
      <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-500 pr-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        <span>N-1 REDUNDANCY ACTIVE</span>
      </div>
    </nav>
  );
}
