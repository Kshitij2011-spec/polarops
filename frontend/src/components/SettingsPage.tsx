import React, { useState, useEffect } from "react";
import {
  Palette,
  Sliders,
  Radio,
  BellRing,
  Database,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  Server,
  Trash2,
} from "lucide-react";
import { useTheme, useOperations } from "@/components/polarops";
import { useStation, STATIONS, type StationId } from "@/context/StationContext";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export function SettingsPage() {
  const { dark, themeMode, setThemeMode } = useTheme();
  const { mode: operationsMode, setMode: setOperationsMode } = useOperations();
  const { activeStationId, setActiveStationId, localLinkState, pendingSyncCount } = useStation();
  const { data: healthData, isError: healthError, isLoading: healthLoading } = useHealthCheck();

  // Local state for motion preference
  const [motionPref, setMotionPref] = useState<"standard" | "reduced">(() => {
    if (typeof window === "undefined") return "standard";
    return (localStorage.getItem("polarops-motion") as "standard" | "reduced") || "standard";
  });

  // Local state for default alerts severity filter
  const [severityFilter, setSeverityFilter] = useState<"All" | "Critical + Warning" | "Critical Only">(() => {
    if (typeof window === "undefined") return "All";
    return (
      (localStorage.getItem("polarops-alert-severity") as "All" | "Critical + Warning" | "Critical Only") || "All"
    );
  });

  // Feedback toast banner
  const [feedback, setFeedback] = useState<string | null>(null);

  // Restore defaults modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Storage count helper
  const [storageKeyCount, setStorageKeyCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStorageKeyCount(localStorage.length);
    }
  }, [themeMode, motionPref, activeStationId, operationsMode, severityFilter]);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    const timer = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  };

  // 1. Theme Change Handler
  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    showNotification(`Theme set to ${mode.toUpperCase()}. Applied across entire application.`);
  };

  // 2. Motion Change Handler
  const handleMotionChange = (m: "standard" | "reduced") => {
    setMotionPref(m);
    localStorage.setItem("polarops-motion", m);
    if (m === "reduced") {
      document.documentElement.classList.add("reduced-motion");
      showNotification("Reduced motion enabled. Interface animations suppressed.");
    } else {
      document.documentElement.classList.remove("reduced-motion");
      showNotification("Standard motion enabled.");
    }
  };

  // 3. Station Preference Handler
  const handleStationChange = (id: StationId) => {
    setActiveStationId(id);
    localStorage.setItem("polarops-preferred-station", id);
    showNotification(`Preferred station updated to ${STATIONS[id].name}.`);
  };

  // 4. Operations Mode Handler
  const handleOperationsModeChange = (nextMode: "online" | "offline") => {
    setOperationsMode(nextMode);
    if (nextMode === "offline") {
      showNotification("Operational mode set to OFFLINE (Local-First). Edge buffer active.");
    } else {
      showNotification("Operational mode set to ONLINE (Satellite uplink).");
    }
  };

  // 5. Default Alerts Filter Handler
  const handleSeverityFilter = (sev: "All" | "Critical + Warning" | "Critical Only") => {
    setSeverityFilter(sev);
    localStorage.setItem("polarops-alert-severity", sev);
    showNotification(`Default telemetry alerts filter set to "${sev}".`);
  };

  // 6. Clear Local Session Cache
  const handleClearCache = () => {
    try {
      localStorage.removeItem("polarops-reviewed-alerts");
      localStorage.removeItem("polarops-mitigation-applied");
      showNotification("Local session cache cleared.");
      setStorageKeyCount(localStorage.length);
    } catch {
      showNotification("Unable to clear local cache.");
    }
  };

  // 7. Restore Defaults Handler
  const handleRestoreDefaults = () => {
    // Reset Theme
    setThemeMode("light");

    // Reset Motion
    setMotionPref("standard");
    localStorage.setItem("polarops-motion", "standard");
    document.documentElement.classList.remove("reduced-motion");

    // Reset Preferred Station
    setActiveStationId("STATION-BHARATI");
    localStorage.setItem("polarops-preferred-station", "STATION-BHARATI");

    // Reset Operations Mode
    setOperationsMode("online");
    localStorage.setItem("polarops-mode", "online");

    // Reset Alert Filter
    setSeverityFilter("All");
    localStorage.setItem("polarops-alert-severity", "All");

    setShowResetConfirm(false);
    showNotification("All operational preferences restored to system defaults.");
  };

  // Compute live API status label and color
  let apiStatusLabel = "Online · 200 OK";
  let apiStatusColor = "bg-emerald-500 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
  if (healthLoading) {
    apiStatusLabel = "Connecting...";
    apiStatusColor = "bg-amber-500 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800";
  } else if (healthError || healthData?.status !== "ok") {
    apiStatusLabel = "Unreachable / Offline";
    apiStatusColor = "bg-rose-500 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800";
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-sans text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              System Settings
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Operational Configuration
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Settings
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
            Configure local client environment, appearance, operational preferences, and telemetry filters.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-sans font-medium hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Reset all local client settings to factory defaults"
          >
            <RotateCcw size={13} className="text-slate-500" />
            <span>Restore Defaults</span>
          </button>
        </div>
      </header>

      {/* ── Live Notification Feedback Banner (notice) ── */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="notice p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-sans flex items-center justify-between gap-2 shadow-xs transition-all animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{feedback}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            SAVED LOCALLY
          </span>
        </div>
      )}

      {/* ── Reset Confirmation Dialog ── */}
      {showResetConfirm && (
        <div
          role="alertdialog"
          aria-labelledby="reset-dialog-title"
          aria-describedby="reset-dialog-desc"
          className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-3 shadow-md"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 id="reset-dialog-title" className="text-sm font-bold font-sans">
                Restore Factory Settings?
              </h2>
              <p id="reset-dialog-desc" className="text-xs font-sans text-amber-800 dark:text-amber-300 mt-0.5">
                This will reset your theme, motion preferences, default station, operations mode, and alert filters to system defaults.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-7">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-sans font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Confirm Restore
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-sans font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Main Settings Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ══════════════════════════════════════════════════════════
            SECTION 1: APPLICATION & APPEARANCE
            ══════════════════════════════════════════════════════════ */}
        <section
          data-testid="settings-section-appearance"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="appearance-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[#369ACC]/10 text-[#369ACC] dark:text-[#46B9C7] flex items-center justify-center">
                <Palette size={18} />
              </div>
              <div>
                <h2 id="appearance-heading" className="text-sm font-bold font-sans uppercase tracking-wide text-slate-900 dark:text-white">
                  APPEARANCE
                </h2>
                <p className="text-xs font-sans text-slate-500 dark:text-slate-400">
                  Client theme &amp; accessibility posture
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
              {/* Theme Preference */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">
                    Theme
                  </div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Synchronizes Navbar, Sidebar, and workspace surfaces
                  </div>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Theme mode selection"
                  className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs shrink-0 self-start sm:self-auto"
                >
                  {(["light", "dark", "system"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={themeMode === m}
                      onClick={() => handleThemeChange(m)}
                      className={`px-3 py-1.5 font-sans capitalize transition-colors cursor-pointer ${
                        themeMode === m
                          ? "bg-[#369ACC] text-white font-semibold"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion Preference */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">
                    Reduced Motion
                  </div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Suppress interface animations and telemetry pulses
                  </div>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Motion preference selection"
                  className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs shrink-0 self-start sm:self-auto"
                >
                  {(["standard", "reduced"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={motionPref === m}
                      onClick={() => handleMotionChange(m)}
                      className={`px-3 py-1.5 font-sans capitalize transition-colors cursor-pointer ${
                        motionPref === m
                          ? "bg-[#369ACC] text-white font-semibold"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {m === "standard" ? "Standard" : "Reduced (On)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1.5">
            <Info size={13} className="shrink-0 text-[#369ACC]" />
            <span>Appearance settings update immediately and persist locally.</span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: OPERATIONAL PREFERENCES
            ══════════════════════════════════════════════════════════ */}
        <section
          data-testid="settings-section-operational"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="operational-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Radio size={18} />
              </div>
              <div>
                <h2 id="operational-heading" className="text-sm font-bold font-sans uppercase tracking-wide text-slate-900 dark:text-white">
                  OPERATIONAL
                </h2>
                <p className="text-xs font-sans text-slate-500 dark:text-slate-400">
                  Station focus &amp; network posture
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
              {/* Preferred Station */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">
                    Preferred Station
                  </div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Active base selected across Digital Twin and telemetry
                  </div>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Preferred station selection"
                  className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs shrink-0 self-start sm:self-auto"
                >
                  {(["STATION-BHARATI", "STATION-MAITRI"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={activeStationId === id}
                      onClick={() => handleStationChange(id)}
                      className={`px-3 py-1.5 font-sans transition-colors cursor-pointer ${
                        activeStationId === id
                          ? "bg-emerald-600 text-white font-semibold"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {id === "STATION-BHARATI" ? "Bharati" : "Maitri"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operational Network Posture */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">
                    Network Posture
                  </div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    Toggle satellite uplink vs offline store-and-forward
                  </div>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Operational network mode"
                  className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs shrink-0 self-start sm:self-auto"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={operationsMode === "online"}
                    onClick={() => handleOperationsModeChange("online")}
                    className={`px-3 py-1.5 font-sans transition-colors cursor-pointer ${
                      operationsMode === "online"
                        ? "bg-emerald-600 text-white font-semibold"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Online (Satellite)
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={operationsMode === "offline"}
                    onClick={() => handleOperationsModeChange("offline")}
                    className={`px-3 py-1.5 font-sans transition-colors cursor-pointer ${
                      operationsMode === "offline"
                        ? "bg-amber-600 text-white font-semibold"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Offline (Local-First)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-sans flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              CURRENT FOCUS: {STATIONS[activeStationId].code}
            </span>
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              {STATIONS[activeStationId].coords}
            </span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: TELEMETRY & ALERTS
            ══════════════════════════════════════════════════════════ */}
        <section
          data-testid="settings-section-alerts"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="alerts-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[#F4895F]/10 text-[#F4895F] flex items-center justify-center">
                <BellRing size={18} />
              </div>
              <div>
                <h2 id="alerts-heading" className="text-sm font-bold font-sans uppercase tracking-wide text-slate-900 dark:text-white">
                  TELEMETRY &amp; ALERTS
                </h2>
                <p className="text-xs font-sans text-slate-500 dark:text-slate-400">
                  Event severity threshold &amp; stream filter
                </p>
              </div>
            </div>

            <div className="mt-3 text-xs space-y-3.5">
              {/* Default Severity Filter */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">
                    Default Alert Severity Filter
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    ACTIVE: {severityFilter}
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                  Initial filter preset applied when navigating to the Operational Alerts workspace
                </p>
                <div
                  role="radiogroup"
                  aria-label="Default alert severity filter"
                  className="grid grid-cols-3 gap-1.5 mt-2"
                >
                  {(["All", "Critical + Warning", "Critical Only"] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      role="radio"
                      aria-checked={severityFilter === sev}
                      onClick={() => handleSeverityFilter(sev)}
                      className={`py-2 px-2 rounded-lg text-center font-sans text-xs transition-colors cursor-pointer border ${
                        severityFilter === sev
                          ? "bg-[#369ACC] border-[#369ACC] text-white font-semibold shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edge Processing Notice */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-slate-200 block mb-1">
                  Station Edge Threshold Logic:
                </span>
                Critical alarms (vibration ceiling 4.0 mm/s, fuel runway limits, satellite loss) are evaluated locally at station edge nodes rather than browser push.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1.5">
            <Info size={13} className="shrink-0 text-[#F4895F]" />
            <span>Alerts stream directly to the Alerts tab with this default filter.</span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4: DATA & SYNCHRONIZATION
            ══════════════════════════════════════════════════════════ */}
        <section
          data-testid="settings-section-data-sync"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="data-sync-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Database size={18} />
              </div>
              <div>
                <h2 id="data-sync-heading" className="text-sm font-bold font-sans uppercase tracking-wide text-slate-900 dark:text-white">
                  DATA &amp; SYNC
                </h2>
                <p className="text-xs font-sans text-slate-500 dark:text-slate-400">
                  Local cache &amp; edge store-and-forward queue
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">Link Posture</div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Edge telemetry channel</div>
                </div>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {localLinkState}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">Store-and-Forward Buffer</div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Queued outbound actions</div>
                </div>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {pendingSyncCount} queued
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">Local Browser Storage</div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Preferences &amp; session cache</div>
                </div>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {storageKeyCount} active keys
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold font-sans text-slate-900 dark:text-slate-100">Session Cache</div>
                  <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Clear temporary reviewed alerts</div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-slate-600 dark:text-slate-400 text-xs font-sans font-medium transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Clear Cache</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1.5">
            <Info size={13} className="shrink-0 text-indigo-500" />
            <span>Store-and-forward queue automatically flushes on link recovery.</span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5: SYSTEM & DIAGNOSTICS (INFORMATIONAL)
            ══════════════════════════════════════════════════════════ */}
        <section
          data-testid="settings-section-system-info"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between md:col-span-2"
          aria-labelledby="system-info-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Server size={18} />
              </div>
              <div>
                <h2 id="system-info-heading" className="text-sm font-bold font-sans uppercase tracking-wide text-slate-900 dark:text-white">
                  SYSTEM INFORMATION
                </h2>
                <p className="text-xs font-sans text-slate-500 dark:text-slate-400">
                  Read-only operational environment &amp; build telemetry
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  APPLICATION VERSION
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  v2.4.0-antarctic
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  CORE API HEALTH
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                  <span className={`h-2 w-2 rounded-full ${apiStatusColor.split(" ")[0]} shrink-0`} />
                  <span className="text-slate-900 dark:text-white">{apiStatusLabel}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  PROVENANCE TIER
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  NCPOR SPEC V2 · MOCK
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  OPERATIONAL RUNTIME
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                  REACT 19 · TANSTACK ROUTER
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] font-sans text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>
              Production architecture integrates with NCPOR secure identity and role-based access control.
            </span>
            <span className="font-mono text-[10px] text-slate-400 shrink-0">
              BUILD: 2026-Q1-STABLE
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}
