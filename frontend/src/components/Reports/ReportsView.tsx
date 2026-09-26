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
  Copy,
  Check,
  Eye,
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
  summary: string;
  date: string;
  status: "READY";
  operationalStatus: "VERIFIED" | "ATTENTION" | "SIMULATED";
  statusBadge: string;
  icon: React.ElementType;
}

export function ReportsView() {
  const [msg, setMsg] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "ATTENTION">("ALL");
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

  // Canonical report definitions preserving exact demoReports titles, descriptions, and semantic status
  const reportsList: ReportItem[] = useMemo(() => {
    const timestampStr = eventsData?.last_updated
      ? new Date(eventsData.last_updated).toUTCString().replace("GMT", "UTC")
      : "25 SEP 2026 · 14:22 UTC";

    const metadataMap: Record<
      string,
      {
        category: ReportItem["category"];
        summary: string;
        operationalStatus: ReportItem["operationalStatus"];
        statusBadge: string;
        icon: React.ElementType;
      }
    > = {
      "DAILY STATION REPORT": {
        category: "OPERATIONS",
        summary:
          "Comprehensive 24h operational readiness audit covering life support, primary power generation, and environmental telemetry.",
        operationalStatus: "VERIFIED",
        statusBadge: "READY · VERIFIED",
        icon: FileText,
      },
      "RESOURCE STATUS REPORT": {
        category: "LOGISTICS",
        summary:
          "Endurance runway audit across bulk diesel reserves (81 days runway), potable water generation, and life support consumables.",
        operationalStatus: "VERIFIED",
        statusBadge: "READY · VERIFIED",
        icon: Fuel,
      },
      "INCIDENT REPORT": {
        category: "INCIDENTS",
        summary:
          "Chronological logging of operational threshold events, bearing vibration anomaly on generator G-02 (4.8 mm/s), and SATCOM lock.",
        operationalStatus: "ATTENTION",
        statusBadge: "READY · ATTENTION",
        icon: AlertTriangle,
      },
      "RESILIENCE REPORT": {
        category: "RESILIENCE",
        summary:
          "Isolation tolerance assessment, critical electrical bus A/B synchronization, and N-1 generator degradation trace.",
        operationalStatus: "ATTENTION",
        statusBadge: "READY · ATTENTION",
        icon: ShieldCheck,
      },
      "SCENARIO ANALYSIS": {
        category: "SCENARIOS",
        summary:
          "Predictive what-if simulation modeling compound blizzard severity, fuel transport disruption, and cross-station resupply.",
        operationalStatus: "VERIFIED",
        statusBadge: "READY · VERIFIED",
        icon: Activity,
      },
    };

    return demoReports.map((r, i) => {
      const meta = metadataMap[r] || {
        category: "OPERATIONS" as const,
        summary: "Operational station briefing and synchronized sensor records.",
        operationalStatus: "VERIFIED" as const,
        statusBadge: "READY · VERIFIED",
        icon: FileText,
      };

      return {
        id: `REP-0${i + 1}`,
        index: `0${i + 1}`,
        title: r,
        category: meta.category,
        summary: meta.summary,
        description: "Generated from synchronized demo operational data.",
        date: timestampStr,
        status: "READY",
        operationalStatus: meta.operationalStatus,
        statusBadge: meta.statusBadge,
        icon: meta.icon,
      };
    });
  }, [overview, eventsData]);

  // Dynamic status and report counts computed from actual report data
  const totalCount = reportsList.length;
  const verifiedCount = useMemo(
    () => reportsList.filter((r) => r.operationalStatus === "VERIFIED").length,
    [reportsList]
  );
  const attentionCount = useMemo(
    () => reportsList.filter((r) => r.operationalStatus === "ATTENTION").length,
    [reportsList]
  );

  const handleCategoryClick = (catKey: string) => {
    setActiveCategory(catKey);
    setStatusFilter("ALL");
  };

  const handleStatusFilterToggle = (status: "VERIFIED" | "ATTENTION") => {
    if (statusFilter === status) {
      setStatusFilter("ALL");
    } else {
      setStatusFilter(status);
      setActiveCategory("ALL");
    }
  };

  // Filter and search
  const filteredReports = useMemo(() => {
    return reportsList.filter((item) => {
      const matchesCategory =
        activeCategory === "ALL" || item.category === activeCategory;
      const matchesStatus =
        statusFilter === "ALL" || item.operationalStatus === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [reportsList, activeCategory, statusFilter, searchQuery]);

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
    <div className="space-y-2.5 max-w-[1600px] mx-auto pb-10">
      {/* ── 1. COMPACT HEADER ────────────────────────────────────── */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-mono font-bold tracking-widest text-[#369ACC] dark:text-[#46B9C7] uppercase">
              MISSION RECORD
            </span>
            <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
            <span className="text-xs font-semibold font-sans text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Radio className="h-3 w-3 text-[#369ACC]" />
              {activeStationId.replace(/^STATION-/, "")} BASE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 dark:text-white leading-tight">
            Operational Reports
          </h1>
          <p className="text-xs sm:text-sm font-sans text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
            Review and export station status, incident and simulation records.
          </p>
        </div>

        {/* Header Right Status & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-xs font-sans shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Telemetry Online
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono">· {totalCount} Archives Synced</span>
          </div>

          <TruthBadge type="DERIVED" />

          <button
            onClick={handleRefreshAll}
            title="Refresh All Report Telemetry"
            className="p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                overviewLoading || eventsLoading || invLoading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── FEEDBACK NOTICE (Preserves existing notice message) ───── */}
      {msg && (
        <div className="notice p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-sans text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{msg}</span>
          </div>
          <button
            onClick={() => setMsg("")}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── 2. OPERATIONAL SUMMARY STRIP ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-xs font-sans shadow-2xs">
        {/* Left Informational Metadata Items - Clearly Read-Only, No Button Cues */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 select-none cursor-default">
            <FileText className="h-3.5 w-3.5 text-[#369ACC] shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">TOTAL ARCHIVES</span>
            <span className="text-slate-900 dark:text-white font-bold font-sans">{totalCount} Reports</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

          <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 select-none cursor-default">
            <Radio className="h-3.5 w-3.5 text-[#369ACC] shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">MONITORED BASE</span>
            <span className="font-semibold text-slate-900 dark:text-white">{activeStationId.replace(/^STATION-/, "")}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

          <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 select-none cursor-default">
            <Clock className="h-3.5 w-3.5 text-[#369ACC] shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">CADENCE</span>
            <span className="font-semibold text-slate-900 dark:text-white">24h Cyclic</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

          {/* Read-Only Dispatch Status - Clearly an Operational Status Indicator */}
          <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 select-none cursor-default">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">DISPATCH STATUS</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ready</span>
          </div>
        </div>

        {/* Right Status Filter Controls & Synced Timestamp */}
        <div className="flex items-center gap-2 text-xs font-sans">
          {/* Verified Status Filter Button */}
          <button
            type="button"
            onClick={() => handleStatusFilterToggle("VERIFIED")}
            title={statusFilter === "VERIFIED" ? "Active filter: Click to clear and show all" : "Filter reports: Show 3 Verified"}
            aria-pressed={statusFilter === "VERIFIED"}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-sans transition-all cursor-pointer ${
              statusFilter === "VERIFIED"
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/50 ring-1 ring-emerald-500/30 font-bold shadow-2xs"
                : "bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold">{verifiedCount} Verified</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

          {/* Attention Status Filter Button */}
          <button
            type="button"
            onClick={() => handleStatusFilterToggle("ATTENTION")}
            title={statusFilter === "ATTENTION" ? "Active filter: Click to clear and show all" : "Filter reports: Show 2 Attention"}
            aria-pressed={statusFilter === "ATTENTION"}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-sans transition-all cursor-pointer ${
              statusFilter === "ATTENTION"
                ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/50 ring-1 ring-amber-500/30 font-bold shadow-2xs"
                : "bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-semibold">{attentionCount} Attention</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

          {/* Read-Only Synced Timestamp */}
          <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 select-none cursor-default">
            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
            <span>14:22 UTC SYNCED</span>
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER CONTROLS ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          {(
            [
              ["ALL", `ALL (${totalCount})`],
              ["OPERATIONS", "OPERATIONS"],
              ["LOGISTICS", "LOGISTICS"],
              ["INCIDENTS", "INCIDENTS"],
              ["RESILIENCE", "RESILIENCE"],
              ["SCENARIOS", "SCENARIOS"],
            ] as const
          ).map(([catKey, label]) => {
            const isSelected = activeCategory === catKey && statusFilter === "ALL";
            return (
              <button
                key={catKey}
                onClick={() => handleCategoryClick(catKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold border border-slate-200/80 dark:border-slate-700/80"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by keyword, domain, or ID..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs font-sans rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#369ACC]/30 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. REPORT CARDS GRID ─────────────────────────────────── */}
      {filteredReports.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-2">
          <FileText className="h-7 w-7 mx-auto text-slate-400" />
          <div className="text-sm font-bold text-slate-900 dark:text-white font-sans">
            No operational reports matching filter
          </div>
          <p className="text-xs font-sans text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or reset the category and status filters to view all
            mission archives.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveCategory("ALL");
              setStatusFilter("ALL");
              setSearchQuery("");
            }}
            className="mt-2 text-xs font-sans font-semibold cursor-pointer"
          >
            RESET FILTERS
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReports.map((r) => {
            const Icon = r.icon;

            // Semantic status styling based on operationalStatus
            let statusBadgeClass = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60";
            let statusDotClass = "bg-emerald-500";
            let categoryBadgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

            if (r.operationalStatus === "ATTENTION") {
              statusBadgeClass = "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60";
              statusDotClass = "bg-amber-500";
              categoryBadgeClass = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-800/40";
            } else if (r.operationalStatus === "SIMULATED") {
              statusBadgeClass = "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/60";
              statusDotClass = "bg-[#369ACC]";
              categoryBadgeClass = "bg-[#369ACC]/10 text-[#369ACC] dark:text-[#46B9C7] border-[#369ACC]/20 dark:border-[#46B9C7]/30";
            }

            return (
              <div
                key={r.title}
                data-testid={`report-card-${r.index}`}
                className="report-card !flex !flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0F172A] !p-3.5 sm:!p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Card Top: ID/Category + Semantic Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${categoryBadgeClass}`}>
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="font-mono">{r.id}</span>
                      <span>·</span>
                      <span>{r.category}</span>
                    </span>

                    {/* Semantic Status Badge - guaranteed to contain 'READY' for test compatibility */}
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                      <span>{r.statusBadge}</span>
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight leading-snug">
                    {r.title}
                  </h2>
                  
                  {/* Detailed operational scope summary */}
                  <p className="text-xs font-sans text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                    {r.summary}
                  </p>
                </div>

                {/* Card Metadata & Action Buttons (Tightened footer, no redundant station) */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{r.date}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(r.title)}
                      className="h-7 px-2.5 text-xs font-sans font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Eye className="mr-1.5 h-3 w-3 text-slate-500" />
                      VIEW
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExport(r.title, "json")}
                      className="h-7 px-2.5 text-xs font-sans font-semibold bg-[#369ACC] hover:bg-[#369ACC]/90 text-white cursor-pointer shadow-xs"
                    >
                      <Download className="mr-1.5 h-3 w-3" />
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
                <div className="text-[11px] font-sans uppercase tracking-widest text-[#369ACC] dark:text-[#46B9C7] font-bold flex items-center gap-2">
                  <span className="font-mono">{selectedReportObj.id}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                  <span>{selectedReportObj.category}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                  <span className="font-mono">{activeStationId}</span>
                </div>
                <SheetTitle className="text-xl font-bold font-sans text-slate-900 dark:text-white mt-1">
                  {selectedReportObj.title}
                </SheetTitle>
                <SheetDescription className="text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                  {selectedReportObj.summary}
                </SheetDescription>
              </SheetHeader>

              {/* Station Identity KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-sans">
                <div>
                  <span className="text-[10px] font-sans font-medium uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    STATION STATUS
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {overview?.status || "NOMINAL"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-sans font-medium uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    HEALTH INDEX
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {overview?.overall_health_score ? `${overview.overall_health_score.toFixed(1)}%` : "84.5%"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-sans font-medium uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    FUEL RUNWAY
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {overview?.fuel_runway_days ? `${overview.fuel_runway_days} DAYS` : "81 DAYS"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-sans font-medium uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    AMBIENT TEMP
                  </span>
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">
                    {overview?.ambient_weather?.temperature_celsius ? `${overview.ambient_weather.temperature_celsius}°C` : "-28.5°C"}
                  </span>
                </div>
              </div>

              {/* Report-Specific Detailed Data Tables */}
              {selectedReportObj.title === "DAILY STATION REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                    SUBSYSTEM OPERATIONAL READINESS MATRIX
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 font-sans text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Subsystem</th>
                          <th className="p-2.5">Health</th>
                          <th className="p-2.5">State</th>
                          <th className="p-2.5 text-right">Redundancy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(overview?.subsystem_summary || [
                          { code: "POWER", name: "Primary Power Gen", health_score: 84.5, status: "DEGRADED" },
                          { code: "LIFE_SUPPORT", name: "Life Support & HVAC", health_score: 96.0, status: "NOMINAL" },
                          { code: "COMMS", name: "SATCOM Carrier Link", health_score: 92.4, status: "NOMINAL" },
                          { code: "FUEL", name: "Bulk Fuel Distribution", health_score: 88.0, status: "NOMINAL" },
                        ]).map((sub) => (
                          <tr key={sub.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-white">{sub.name}</td>
                            <td className="p-2.5 font-mono">{sub.health_score.toFixed(1)}%</td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold font-sans ${
                                  sub.status === "NOMINAL"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                              N+1 ACTIVE
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "RESOURCE STATUS REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                    STATION RESOURCE ENDURANCE STOCKS
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 font-sans text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Resource</th>
                          <th className="p-2.5">Capacity</th>
                          <th className="p-2.5">Burn Rate</th>
                          <th className="p-2.5 text-right">Runway</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {demoResources.map(([type, pct, state, burn, runway]) => (
                          <tr key={type} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-white">{type}</td>
                            <td className="p-2.5 font-mono">{pct}%</td>
                            <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400">{burn}</td>
                            <td className="p-2.5 text-right font-sans font-semibold text-[#369ACC]">{runway}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "INCIDENT REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                    CHRONOLOGICAL OPERATIONAL INCIDENTS
                  </h4>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 font-sans text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5">Time</th>
                          <th className="p-2.5">Severity</th>
                          <th className="p-2.5">Incident Title</th>
                          <th className="p-2.5 text-right">Entity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(eventsData?.events?.slice(0, 5) || [
                          { id: "1", timestamp: new Date().toISOString(), severity: "WARNING", title: "Generator G-02 vibration anomaly", entity_id: "G-02" },
                          { id: "2", timestamp: new Date().toISOString(), severity: "INFO", title: "SATCOM tracking lock established", entity_id: "VSAT" },
                        ]).map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400">
                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                                  ev.severity === "CRITICAL"
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                                    : ev.severity === "WARNING"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                    : "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400"
                                }`}
                              >
                                {ev.severity}
                              </span>
                            </td>
                            <td className="p-2.5 font-sans font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {ev.title}
                            </td>
                            <td className="p-2.5 text-right font-mono text-[#369ACC]">[{ev.entity_id || "SYSTEM"}]</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "RESILIENCE REPORT" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                    ISOLATION TOLERANCE &amp; REDUNDANCY TRACE
                  </h4>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5 text-xs font-sans">
                    <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">CRITICAL BUS A/B</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">SYNCHRONIZED</strong>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">PRIMARY DIESEL GENERATION</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-mono">N-1 DEGRADED (G-02 VIBRATION)</strong>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">SATCOM ORBITAL WINDOW</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">99.8% AVAILABILITY</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">CROSS-STATION MUTUAL AID</span>
                      <strong className="text-[#369ACC] font-mono">MAITRI LINK STANDBY</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedReportObj.title === "SCENARIO ANALYSIS" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                    WHAT-IF SCENARIOS EVALUATED
                  </h4>
                  <div className="space-y-2">
                    {demoScenarios.map(([name, desc, systems, risk]) => (
                      <div
                        key={name}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-sans flex items-center justify-between gap-3"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white block">{name}</strong>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold shrink-0 ${
                            risk === "CRITICAL" || risk === "HIGH"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
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
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopySummary(selectedReportObj.title)}
                  className="font-sans text-xs font-semibold cursor-pointer"
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
                    className="font-sans text-xs font-semibold cursor-pointer"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExport(selectedReportObj.title, "json")}
                    className="font-sans text-xs font-semibold bg-[#369ACC] hover:bg-[#369ACC]/90 text-white cursor-pointer shadow-xs"
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
