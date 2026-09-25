import React, { useState, useEffect } from "react";
import { Shield, Palette, BellRing, Check, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/polarops";

export function SettingsPage() {
  const { dark, toggle: toggleTheme } = useTheme();

  // APPEARANCE PREFERENCES
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("polarops-theme-mode") as "light" | "dark" | "system") || (dark ? "dark" : "light");
  });

  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    if (typeof window === "undefined") return "comfortable";
    return (localStorage.getItem("polarops-density") as "comfortable" | "compact") || "comfortable";
  });

  const [sidebarPref, setSidebarPref] = useState<"expanded" | "collapsed">(() => {
    if (typeof window === "undefined") return "expanded";
    return localStorage.getItem("polarops-sidebar-collapsed") === "true" ? "collapsed" : "expanded";
  });

  const [motionPref, setMotionPref] = useState<"standard" | "reduced">(() => {
    if (typeof window === "undefined") return "standard";
    return (localStorage.getItem("polarops-motion") as "standard" | "reduced") || "standard";
  });

  // ALERTS PREFERENCES
  const [criticalAlerts, setCriticalAlerts] = useState<boolean>(() => {
    return localStorage.getItem("polarops-alert-critical") !== "false";
  });
  const [warningAlerts, setWarningAlerts] = useState<boolean>(() => {
    return localStorage.getItem("polarops-alert-warning") !== "false";
  });
  const [connectivityAlerts, setConnectivityAlerts] = useState<boolean>(() => {
    return localStorage.getItem("polarops-alert-connectivity") !== "false";
  });
  const [syncAlerts, setSyncAlerts] = useState<boolean>(() => {
    return localStorage.getItem("polarops-alert-sync") !== "false";
  });
  const [scenarioRiskAlerts, setScenarioRiskAlerts] = useState<boolean>(() => {
    return localStorage.getItem("polarops-alert-scenario") !== "false";
  });
  const [severityFilter, setSeverityFilter] = useState<"Critical Only" | "Critical + Warning" | "All">(() => {
    return (localStorage.getItem("polarops-alert-severity") as "Critical Only" | "Critical + Warning" | "All") || "All";
  });

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const showSaveMessage = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    localStorage.setItem("polarops-theme-mode", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("polarops-theme", "dark");
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("polarops-theme", "light");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem("polarops-theme", isDark ? "dark" : "light");
    }
    showSaveMessage("Theme preference updated and saved locally.");
  };

  const handleDensityChange = (d: "comfortable" | "compact") => {
    setDensity(d);
    localStorage.setItem("polarops-density", d);
    showSaveMessage("Display density updated.");
  };

  const handleSidebarChange = (s: "expanded" | "collapsed") => {
    setSidebarPref(s);
    localStorage.setItem("polarops-sidebar-collapsed", s === "collapsed" ? "true" : "false");
    showSaveMessage("Default sidebar mode updated.");
  };

  const handleMotionChange = (m: "standard" | "reduced") => {
    setMotionPref(m);
    localStorage.setItem("polarops-motion", m);
    showSaveMessage("Motion preference updated.");
  };

  const handleAlertCritical = (val: boolean) => {
    setCriticalAlerts(val);
    localStorage.setItem("polarops-alert-critical", String(val));
    showSaveMessage("Critical alerts setting saved.");
  };

  const handleAlertWarning = (val: boolean) => {
    setWarningAlerts(val);
    localStorage.setItem("polarops-alert-warning", String(val));
    showSaveMessage("Warning alerts setting saved.");
  };

  const handleAlertConnectivity = (val: boolean) => {
    setConnectivityAlerts(val);
    localStorage.setItem("polarops-alert-connectivity", String(val));
    showSaveMessage("Connectivity alerts setting saved.");
  };

  const handleAlertSync = (val: boolean) => {
    setSyncAlerts(val);
    localStorage.setItem("polarops-alert-sync", String(val));
    showSaveMessage("Sync failure alerts setting saved.");
  };

  const handleAlertScenario = (val: boolean) => {
    setScenarioRiskAlerts(val);
    localStorage.setItem("polarops-alert-scenario", String(val));
    showSaveMessage("Scenario risk alerts setting saved.");
  };

  const handleSeverityFilter = (sev: "Critical Only" | "Critical + Warning" | "All") => {
    setSeverityFilter(sev);
    localStorage.setItem("polarops-alert-severity", sev);
    showSaveMessage(`Alert severity filter set to ${sev}.`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="text-[11px] font-mono tracking-widest text-[#369ACC] font-bold uppercase mb-1">
          OPERATIONAL CONFIGURATION
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-slate-900 dark:text-white tracking-tight">
          System Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Configure local client environment, appearance, security parameters and telemetry alerts.
        </p>
      </div>

      {savedFeedback && (
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check size={14} className="shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Grid of only 3 sections: APPEARANCE, SECURITY, ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================
            1. APPEARANCE
            ============================================================ */}
        <section
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="appearance-settings-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded bg-[#369ACC]/10 text-[#369ACC] flex items-center justify-center">
                <Palette size={18} />
              </div>
              <div>
                <h2 id="appearance-settings-heading" className="text-sm font-bold font-mono uppercase tracking-wide text-slate-900 dark:text-white">
                  APPEARANCE
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Visual density &amp; theme</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
              {/* Theme */}
              <div className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Theme</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Light, Dark or System</div>
                </div>
                <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden font-mono text-[11px]">
                  {(["light", "dark", "system"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleThemeChange(m)}
                      className={`px-2.5 py-1 capitalize transition-colors ${
                        themeMode === m
                          ? "bg-[#369ACC] text-white font-bold"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Density */}
              <div className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Density</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Spacing &amp; compactness</div>
                </div>
                <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden font-mono text-[11px]">
                  {(["comfortable", "compact"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDensityChange(d)}
                      className={`px-2.5 py-1 capitalize transition-colors ${
                        density === d
                          ? "bg-[#369ACC] text-white font-bold"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Sidebar</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Default navigation posture</div>
                </div>
                <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden font-mono text-[11px]">
                  {(["expanded", "collapsed"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSidebarChange(s)}
                      className={`px-2.5 py-1 capitalize transition-colors ${
                        sidebarPref === s
                          ? "bg-[#369ACC] text-white font-bold"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion */}
              <div className="py-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Motion</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Subtle animations</div>
                </div>
                <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden font-mono text-[11px]">
                  {(["standard", "reduced"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMotionChange(m)}
                      className={`px-2.5 py-1 capitalize transition-colors ${
                        motionPref === m
                          ? "bg-[#369ACC] text-white font-bold"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
            <Info size={13} className="shrink-0 text-[#369ACC]" />
            <span>Preferences are stored locally on this device.</span>
          </div>
        </section>

        {/* ============================================================
            2. SECURITY
            ============================================================ */}
        <section
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="security-settings-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <div>
                <h2 id="security-settings-heading" className="text-sm font-bold font-mono uppercase tracking-wide text-slate-900 dark:text-white">
                  SECURITY
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Operational trust &amp; boundaries</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Session</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Current connection scope</div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Local Prototype Session
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Authentication</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Identity verification provider</div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Demo Authentication
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Data</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Telemetry provenance tier</div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Local / Demo Operational Data
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Access Control</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Policy enforcement level</div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Prototype Role Model
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            <span className="font-semibold text-slate-900 dark:text-white block mb-0.5 font-mono text-[10px] tracking-wider uppercase text-[#369ACC]">
              HONEST ARCHITECTURAL NOTICE:
            </span>
            Production deployment would connect these controls to the approved authentication and authorization layer.
          </div>
        </section>

        {/* ============================================================
            3. ALERTS
            ============================================================ */}
        <section
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shadow-xs flex flex-col justify-between"
          aria-labelledby="alerts-settings-heading"
        >
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded bg-[#F4895F]/10 text-[#F4895F] flex items-center justify-center">
                <BellRing size={18} />
              </div>
              <div>
                <h2 id="alerts-settings-heading" className="text-sm font-bold font-mono uppercase tracking-wide text-slate-900 dark:text-white">
                  ALERTS
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Operational condition thresholds</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Critical Operational Alerts</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Immediate station safety events</div>
                </div>
                <Switch
                  checked={criticalAlerts}
                  onCheckedChange={handleAlertCritical}
                  aria-label="Toggle Critical Operational Alerts"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Warning Alerts</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Telemetry trend deviations</div>
                </div>
                <Switch
                  checked={warningAlerts}
                  onCheckedChange={handleAlertWarning}
                  aria-label="Toggle Warning Alerts"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Connectivity Degradation</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">HF/Satellite margin drops</div>
                </div>
                <Switch
                  checked={connectivityAlerts}
                  onCheckedChange={handleAlertConnectivity}
                  aria-label="Toggle Connectivity Degradation Alerts"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Sync Failure</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Store-and-forward queue stalls</div>
                </div>
                <Switch
                  checked={syncAlerts}
                  onCheckedChange={handleAlertSync}
                  aria-label="Toggle Sync Failure Alerts"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Scenario Risk Changes</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">What-if simulation deltas</div>
                </div>
                <Switch
                  checked={scenarioRiskAlerts}
                  onCheckedChange={handleAlertScenario}
                  aria-label="Toggle Scenario Risk Changes Alerts"
                />
              </div>

              <div className="py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Severity Filter</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Display filter for telemetry streams</div>
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono text-[11px] mt-0.5">
                  {(["Critical Only", "Critical + Warning", "All"] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => handleSeverityFilter(sev)}
                      className={`py-1.5 px-2 rounded text-center border transition-colors ${
                        severityFilter === sev
                          ? "bg-[#369ACC] border-[#369ACC] text-white font-bold"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
            <Info size={13} className="shrink-0 text-[#F4895F]" />
            <span>Alert filter thresholds stored locally.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
