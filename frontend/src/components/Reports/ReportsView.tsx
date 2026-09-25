import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  Fuel,
  AlertTriangle,
  Activity,
  CheckCircle2,
  X,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { useStation } from "@/context/StationContext";
import { useStationOverview } from "@/hooks/useStationOverview";
import { useOperationalEvents } from "@/hooks/useOperationalEvents";
import { useInventory } from "@/hooks/useInventory";
import { demoReports, demoScenarios, demoResources } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { TruthBadge } from "../TruthBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface ReportItem {
  id: string;
  index: string;
  title: string;
  category: "OPERATIONS" | "LOGISTICS" | "INCIDENTS" | "RESILIENCE" | "SCENARIOS";
  description: string;
  date: string;
  status: "READY" | "GENERATED" | "PROCESSING" | "PENDING";
  icon: React.ElementType;
}

export function ReportsView() {
  const [msg, setMsg] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedReportTitle, setSelectedReportTitle] = useState<string | null>(null);

  const stationCtx = useStation();
  const activeStationId = stationCtx?.activeStationId || "STATION-BHARATI";

  // Real backend queries for backing report data
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useStationOverview(activeStationId);

  const {
    data: eventsData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useOperationalEvents(activeStationId, 20);

  const {
    data: inventoryData,
    isLoading: invLoading,
    refetch: refetchInventory,
  } = useInventory(activeStationId);

  const handleRefreshAll = () => {
    refetchOverview();
    refetchEvents();
    refetchInventory();
  };

  // Canonical report definitions preserving exact demoReports titles and descriptions
  const reportsList: ReportItem[] = useMemo(() => {
    const timestampStr = eventsData?.last_updated
      ? new Date(eventsData.last_updated).toUTCString().replace("GMT", "UTC")
      : "25 SEP 2026 · 14:22 UTC";

    const definitions: Array<{
      title: string;
      category: ReportItem["category"];
      icon: React.ElementType;
    }> = [
      { title: "DAILY STATION REPORT", category: "OPERATIONS", icon: FileText },
      { title: "RESOURCE STATUS REPORT", category: "LOGISTICS", icon: Fuel },
      { title: "INCIDENT REPORT", category: "INCIDENTS", icon: AlertTriangle },
      { title: "RESILIENCE REPORT", category: "RESILIENCE", icon: ShieldCheck },
      { title: "SCENARIO ANALYSIS", category: "SCENARIOS", icon: Activity },
    ];

    return demoReports.map((r, i) => {
      const match = definitions.find((d) => d.title === r) || {
        title: r,
        category: "OPERATIONS" as const,
        icon: FileText,
      };

      return {
        id: `REP-0${i + 1}`,
        index: `0${i + 1}`,
        title: r,
        category: match.category,
        description: "Generated from synchronized demo operational data.",
        date: timestampStr,
        status: "READY",
        icon: match.icon,
      };
    });
  }, [overview]);

  // Filter and search
  const filteredReports = useMemo(() => {
    return reportsList.filter((item) => {
      const matchesCategory =
        activeCategory === "ALL" || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [reportsList, activeCategory, searchQuery]);

  // Action handlers preserving exact required strings
  const handleView = (reportTitle: string) => {
    setMsg(`${reportTitle} opened in demo preview.`);
    setSelectedReportTitle(reportTitle);
  };

  const handleExport = (reportTitle: string, format: "json" | "csv" = "json") => {
    setMsg(`${reportTitle} export prepared for demonstration.`);

    const reportObj = reportsList.find((r) => r.title === reportTitle);
    const stationName = overview?.name || activeStationId.replace(/^STATION-/, "");

    if (format === "json") {
      const payload = {
        polarops_report_header: {
          title: reportTitle,
          report_id: reportObj?.id || "REP-01",
          station_id: activeStationId,
          station_name: stationName,
          generated_utc: new Date().toISOString(),
          status: "READY",
          truth_type: "MEASURED / SYNCHRONIZED",
          compliance: "NCPOR Antarctic Operations Protocol v2.0",
        },
        operational_overview: {
          status: overview?.status || "NOMINAL",
          health_score: overview?.overall_health_score ?? 84.5,
          fuel_runway_days: overview?.fuel_runway_days ?? 81,
          weather: overview?.ambient_weather ?? {
            temperature_celsius: -28.5,
            wind_speed_knots: 42,
            conditions: "BLIZZARD",
          },
          subsystems: overview?.subsystem_summary ?? [],
        },
        recent_events: eventsData?.events?.slice(0, 10) ?? [],
        resources: demoResources.map(([type, pct, state, burn, runway]) => ({
          resource: type,
          level_pct: pct,
          state,
          burn_rate: burn,
          runway,
        })),
        scenarios: demoScenarios.map(([name, desc, systems, risk]) => ({
          scenario: name,
          description: desc,
          impacted_systems: systems,
          risk_level: risk,
        })),
      };

      try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `polarops-${reportTitle.toLowerCase().replace(/[\s_]+/g, "-")}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export download failed:", err);
      }
    } else {
      // CSV format
      let csvContent = `Report Title,${reportTitle}\n`;
      csvContent += `Station,${stationName}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n`;
      csvContent += `Status,READY\n\n`;
      csvContent += `Item,Metric,Value,Status\n`;

      if (overview?.subsystem_summary) {
        overview.subsystem_summary.forEach((sub) => {
          csvContent += `${sub.name},Health,${sub.health_score}%,${sub.status}\n`;
        });
      }

      demoResources.forEach(([name, pct, state, burn, runway]) => {
        csvContent += `${name},Reserve,${pct}%,${state} (Burn: ${burn} / Runway: ${runway})\n`;
      });

      try {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `polarops-${reportTitle.toLowerCase().replace(/[\s_]+/g, "-")}-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("CSV Export failed:", err);
      }
    }
  };

  const handleCopySummary = (reportTitle: string) => {
    const summary = `POLAROPS OPERATIONAL RECORD
Report: ${reportTitle}
Station: ${activeStationId}
Generated: ${new Date().toUTCString()}
Status: NOMINAL / READY
Fuel Runway: ${overview?.fuel_runway_days ?? 81} days
Health Index: ${overview?.overall_health_score ?? 84.5}%
Weather: ${overview?.ambient_weather?.conditions ?? "BLIZZARD"} (${overview?.ambient_weather?.temperature_celsius ?? -28.5}°C)`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const selectedReportObj = reportsList.find(
    (r) => r.title === selectedReportTitle
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* ── 1. HEADER (Styled identically to Stations page) ──────── */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
              MISSION RECORD
            </span>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-primary/70" />
              {activeStationId.replace(/^STATION-/, "")} BASE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mt-1">
            Operational Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Review and export station status, incident and simulation records.
          </p>
        </div>

        {/* Header Right Status & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Telemetry Online
            </span>
            <span className="text-muted-foreground font-mono">· 5 Archives Synced</span>
          </div>

          <TruthBadge type="DERIVED" />

          <button
            onClick={handleRefreshAll}
            title="Refresh All Report Telemetry"
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                overviewLoading || eventsLoading || invLoading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 2. FEEDBACK NOTICE (Preserves existing notice message) ─ */}
      {msg && (
        <div className="notice p-3.5 rounded-xl border border-primary/40 bg-primary/10 text-xs font-mono text-foreground flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span className="font-bold">{msg}</span>
          </div>
          <button
            onClick={() => setMsg("")}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            title="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── 3. OPERATIONAL METRIC STRIP (Stations style) ─────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            TOTAL ARCHIVES
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
            5 Reports
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            100% OPERATIONAL
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-500" />
            MONITORED BASE
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1 truncate">
            {activeStationId.replace(/^STATION-/, "")}
          </div>
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            WINTER OPERATIONS
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            CADENCE
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white mt-1">
            24h Cyclic
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            AUTOMATIC LOGGING
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 text-primary" />
            DISPATCH STATUS
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1">
            Ready
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            JSON &amp; CSV EXPORT
          </div>
        </div>
      </div>

      {/* ── 4. SEARCH & FILTER CONTROLS ──────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          {(
            [
              ["ALL", "ALL (5)"],
              ["OPERATIONS", "OPERATIONS"],
              ["LOGISTICS", "LOGISTICS"],
              ["INCIDENTS", "INCIDENTS"],
              ["RESILIENCE", "RESILIENCE"],
              ["SCENARIOS", "SCENARIOS"],
            ] as const
          ).map(([catKey, label]) => {
            const isSelected = activeCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold border border-slate-200/60 dark:border-slate-700/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px] sm:min-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by keyword, domain, or ID..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 5. REPORT CARDS GRID ─────────────────────────────────── */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <div className="text-sm font-bold text-foreground font-heading">
            No operational reports matching filter
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query or reset the category filters to view all
            mission archives.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveCategory("ALL");
              setSearchQuery("");
            }}
            className="mt-2 text-xs font-mono"
          >
            RESET FILTERS
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredReports.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                data-testid={`report-card-${r.index}`}
                className="report-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                {/* Card Header & Content */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      <Icon className="h-3 w-3" />
                      REPORT · {r.index}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      READY
                    </span>
                  </div>

                  <h2 className="text-[1.18rem] sm:text-[1.25rem] font-bold text-slate-900 dark:text-white font-heading tracking-tight leading-snug">
                    {r.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                {/* Card Metadata & Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3 text-muted-foreground/70" />
                    <span>{r.date}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(r.title)}
                      className="h-8 px-3 text-xs font-mono font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      VIEW
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExport(r.title, "json")}
                      className="h-8 px-3 text-xs font-mono font-semibold"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      EXPORT
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. DETAILED OPERATIONAL REPORT INSPECTION DRAWER ─────── */}
      <Sheet
        open={Boolean(selectedReportTitle)}
        onOpenChange={(open) => !open && setSelectedReportTitle(null)}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedReportObj && (
            <div className="space-y-6">
              <SheetHeader className="border-b pb-4">
                <div className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                  <span>REPORT · {selectedReportObj.index}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span>{activeStationId}</span>
                </div>
                <SheetTitle className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  {selectedReportObj.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
                  {selectedReportObj.description}
                </SheetDescription>
              </SheetHeader>

              {/* Station Identity KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block">STATION STATUS</span>
                  <span className="font-bold text-emerald-500">
                    {overview?.status || "NOMINAL"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">HEALTH INDEX</span>
                  <span className="font-bold text-foreground">
                    {overview?.overall_health_score ? `${overview.overall_health_score.toFixed(1)}%` : "84.5%"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">FUEL RUNWAY</span>
                  <span className="font-bold text-amber-500">
                    {overview?.fuel_runway_days ? `${overview.fuel_runway_days} DAYS` : "81 DAYS"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">AMBIENT TEMP</span>
                  <span className="font-bold text-sky-400">
                    {overview?.ambient_weather?.temperature_celsius ? `${overview.ambient_weather.temperature_celsius}°C` : "-28.5°C"}
                  </span>
                </div>
              </div>

              {/* Report-Specific Detailed Data Tables */}
              {selectedReportObj.title === "DAILY STATION REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    SUBSYSTEM OPERATIONAL READINESS MATRIX
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 font-mono text-[10px] text-muted-foreground uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Subsystem</th>
                          <th className="p-2.5">Health</th>
                          <th className="p-2.5">State</th>
                          <th className="p-2.5 text-right">Redundancy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {(overview?.subsystem_summary || [
                          { code: "POWER", name: "Primary Power Gen", health_score: 84.5, status: "DEGRADED" },
                          { code: "LIFE_SUPPORT", name: "Life Support & HVAC", health_score: 96.0, status: "NOMINAL" },
                          { code: "COMMS", name: "SATCOM Carrier Link", health_score: 92.4, status: "NOMINAL" },
                          { code: "FUEL", name: "Bulk Fuel Distribution", health_score: 88.0, status: "NOMINAL" },
                        ]).map((sub) => (
                          <tr key={sub.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-foreground">{sub.name}</td>
                            <td className="p-2.5">{sub.health_score.toFixed(1)}%</td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  sub.status === "NOMINAL"
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-muted-foreground">N+1 ACTIVE</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "RESOURCE STATUS REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    STATION RESOURCE ENDURANCE STOCKS
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 font-mono text-[10px] text-muted-foreground uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Resource</th>
                          <th className="p-2.5">Capacity</th>
                          <th className="p-2.5">Burn Rate</th>
                          <th className="p-2.5 text-right">Runway</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {demoResources.map(([type, pct, state, burn, runway]) => (
                          <tr key={type} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-foreground">{type}</td>
                            <td className="p-2.5">{pct}%</td>
                            <td className="p-2.5 text-muted-foreground">{burn}</td>
                            <td className="p-2.5 text-right font-semibold text-primary">{runway}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "INCIDENT REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    CHRONOLOGICAL OPERATIONAL INCIDENTS
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 font-mono text-[10px] text-muted-foreground uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Time</th>
                          <th className="p-2.5">Severity</th>
                          <th className="p-2.5">Incident Title</th>
                          <th className="p-2.5 text-right">Entity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {(eventsData?.events?.slice(0, 5) || [
                          { id: "1", timestamp: new Date().toISOString(), severity: "WARNING", title: "Generator G-02 vibration anomaly", entity_id: "G-02" },
                          { id: "2", timestamp: new Date().toISOString(), severity: "INFO", title: "SATCOM tracking lock established", entity_id: "VSAT" },
                        ]).map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 text-muted-foreground">
                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  ev.severity === "CRITICAL"
                                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                                    : ev.severity === "WARNING"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                    : "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
                                }`}
                              >
                                {ev.severity}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-foreground truncate max-w-[200px]">
                              {ev.title}
                            </td>
                            <td className="p-2.5 text-right text-primary">[{ev.entity_id || "SYSTEM"}]</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "RESILIENCE REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    ISOLATION TOLERANCE &amp; REDUNDANCY TRACE
                  </h4>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2 text-xs">
                    <div className="flex justify-between font-mono pb-2 border-b border-border/40">
                      <span className="text-muted-foreground">CRITICAL BUS A/B</span>
                      <strong className="text-emerald-500">SYNCHRONIZED</strong>
                    </div>
                    <div className="flex justify-between font-mono pb-2 border-b border-border/40">
                      <span className="text-muted-foreground">PRIMARY DIESEL GENERATION</span>
                      <strong className="text-amber-500">N-1 DEGRADED (G-02 VIBRATION)</strong>
                    </div>
                    <div className="flex justify-between font-mono pb-2 border-b border-border/40">
                      <span className="text-muted-foreground">SATCOM ORBITAL WINDOW</span>
                      <strong className="text-emerald-500">99.8% AVAILABILITY</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-muted-foreground">CROSS-STATION MUTUAL AID</span>
                      <strong className="text-primary">MAITRI LINK STANDBY</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "SCENARIO ANALYSIS" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    WHAT-IF SCENARIOS EVALUATED
                  </h4>
                  <div className="space-y-2">
                    {demoScenarios.map(([name, desc, systems, risk]) => (
                      <div
                        key={name}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-mono flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-foreground block">{name}</strong>
                          <span className="text-[11px] text-muted-foreground">{desc}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            risk === "CRITICAL" || risk === "HIGH"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopySummary(selectedReportObj.title)}
                  className="font-mono text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                      COPIED SUMMARY
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      COPY BRIEF
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(selectedReportObj.title, "csv")}
                    className="font-mono text-xs"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExport(selectedReportObj.title, "json")}
                    className="font-mono text-xs"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    EXPORT JSON
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
