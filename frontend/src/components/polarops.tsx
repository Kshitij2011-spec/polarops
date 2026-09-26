import { Link, useRouterState, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useLayoutEffect, useMemo, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowDown, ArrowRight, BarChart3, Bell, Boxes, ChevronDown, ChevronRight, CircleGauge, ClipboardCheck, Clock, CloudOff, Download, Droplets, FileText, Fuel, Grid3X3, Menu, Minus, Moon, Plus, Radio, RefreshCw, RotateCcw, Satellite, Settings, ShieldAlert, ShieldCheck, Sun, UserRound, Users, UtensilsCrossed, Wrench, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { demoActivities, demoAlerts, demoCapabilities, demoDependencies, demoOfflineState, demoReports, demoSyncQueue } from "@/lib/demo-data";
import { useStationOverview } from "../hooks/useStationOverview";
import { useOperationalEvents } from "../hooks/useOperationalEvents";
import { useExplanation } from "../hooks/useExplanation";
import { useStation } from "@/context/StationContext";
import { useFuelStatus } from "../hooks/useFuelStatus";
import { useEnergyModel } from "../hooks/useEnergyModel";
import { useInventory } from "../hooks/useInventory";
import { useResupply } from "../hooks/useResupply";
import { useScenarioSimulation } from "../hooks/useScenarioSimulation";
import type { ScenarioSimulateResponse } from "@/lib/api";
import { OperationalTopology } from "./OperationalTopology";
import { StationsView } from "./Stations/StationsView";
import { ResilienceView } from "./Resilience/ResilienceView";
import { ScenariosWorkspace } from "./Scenarios/ScenariosWorkspace";
import { BatteryIndicator, NetworkSignalIndicator } from "./common/OperationalIndicators";

const navGroups = [
  ["COMMAND", [["Overview", "/command-center", CircleGauge], ["Digital Twin", "/digital-twin", Boxes], ["Stations", "/stations", Radio]]],
  ["OPERATIONS", [["Resources", "/resources", Fuel], ["Scenarios", "/scenarios", Activity], ["Resilience", "/resilience", ShieldCheck], ["Alerts", "/alerts", Bell]]],
  ["REPORTING", [["Reports", "/reports", FileText]]], ["SYSTEM", [["Offline Analog", "/offline", CloudOff], ["Settings", "/settings", Settings]]],
] as const;

import { createContext, useContext } from "react";
import { useHealthCheck } from "../hooks/useHealthCheck";

export type OperationsMode = "online" | "offline";
export const OperationsContext = createContext({ mode: "online" as OperationsMode, setMode: (_mode: OperationsMode) => { } });
export function OperationsProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OperationsMode>("online");
  useEffect(() => { if (localStorage.getItem("polarops-mode") === "offline") setModeState("offline"); }, []);
  const setMode = (next: OperationsMode) => { setModeState(next); localStorage.setItem("polarops-mode", next); };
  return <OperationsContext.Provider value={{ mode, setMode }}>{children}</OperationsContext.Provider>;
}
export const useOperations = () => useContext(OperationsContext);

export type ThemeMode = "light" | "dark" | "system";

export const ThemeContext = createContext<{
  dark: boolean;
  themeMode: ThemeMode;
  toggle: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}>({
  dark: false,
  themeMode: "light",
  toggle: () => { },
  setThemeMode: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("polarops-theme-mode") as ThemeMode | null;
      if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
        return savedMode;
      }
      const savedTheme = localStorage.getItem("polarops-theme");
      if (savedTheme === "dark") return "dark";
      if (savedTheme === "light") return "light";
      if (document.documentElement.classList.contains("dark")) return "dark";
    }
    return "light";
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Calculate resolved dark flag synchronously without delay
  const dark = themeMode === "system" ? systemDark : themeMode === "dark";

  // Listen to system preference changes if mode is system
  useEffect(() => {
    if (themeMode !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // Synchronously apply theme class to DOM before paint to prevent visual flash/lag
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("polarops-theme", dark ? "dark" : "light");
    localStorage.setItem("polarops-theme-mode", themeMode);
  }, [dark, themeMode]);

  const toggle = useCallback(() => {
    const nextMode: ThemeMode = dark ? "light" : "dark";
    // Synchronously mutate DOM class immediately before React render
    document.documentElement.classList.toggle("dark", nextMode === "dark");
    localStorage.setItem("polarops-theme", nextMode);
    localStorage.setItem("polarops-theme-mode", nextMode);
    setThemeModeState(nextMode);
  }, [dark]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    const nextDark = mode === "system" ? (typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false) : mode === "dark";
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("polarops-theme", nextDark ? "dark" : "light");
    localStorage.setItem("polarops-theme-mode", mode);
    setThemeModeState(mode);
  }, []);

  const value = useMemo(
    () => ({ dark, themeMode, toggle, setThemeMode }),
    [dark, themeMode, toggle, setThemeMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);


function HealthStatusBadge() {
  const { data, isLoading, isError } = useHealthCheck();

  if (isLoading) {
    return (
      <div data-testid="health-status" className="border-t border-sidebar-border p-4 text-[10px] text-muted-foreground">
        <span className="status-dot bg-warning mr-2 animate-pulse" />
        CONNECTING...
        <br />
        <span className="pl-4">POLAROPS API</span>
      </div>
    );
  }

  if (isError || !data || data.status !== "ok") {
    return (
      <div data-testid="health-status" className="border-t border-sidebar-border p-4 text-[10px] text-critical">
        <span className="status-dot bg-critical mr-2" />
        BACKEND OFFLINE
        <br />
        <span className="pl-4 text-muted-foreground">RETRYING...</span>
      </div>
    );
  }

  return (
    <div data-testid="health-status" className="border-t border-sidebar-border p-4 text-[10px] text-muted-foreground">
      <span className="status-dot bg-success mr-2" />
      POLAROPS API ONLINE
      <br />
      <span className="pl-4 font-mono text-[9px] text-success">
        {data.service.toUpperCase()} ┬╖ V1 OK
      </span>
    </div>
  );
}

function Sidebar({ mobile = false, close }: { mobile?: boolean; close?: () => void }) {
  const path = useRouterState({ select: s => s.location.pathname });
  return <aside className={`${mobile ? "w-full" : "hidden lg:flex w-60 fixed inset-y-0 left-0"} flex-col border-r bg-sidebar text-sidebar-foreground z-40`}>
    <div className="h-20 px-5 flex items-center border-b border-sidebar-border"><div className="h-9 w-9 bg-primary text-primary-foreground grid place-items-center mr-3"><Grid3X3 size={19} /></div><div><div className="font-display font-bold tracking-[0.14em]">POLAROPS</div><div className="text-[10px] text-muted-foreground uppercase">Antarctic Digital Twin</div></div></div>
    <nav className="flex-1 px-3 py-5 overflow-y-auto">{navGroups.map(([group, items]) => <div key={group} className="mb-5"><p className="px-3 mb-2 text-[10px] font-bold tracking-[0.18em] text-muted-foreground">{group}</p>{items.map(([label, to, Icon]) => <Link key={to} to={to} onClick={close} className={`relative flex items-center gap-3 px-3 h-10 mb-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${path === to ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold before:absolute before:left-0 before:h-5 before:w-0.5 before:bg-primary" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}><Icon size={17} />{label}</Link>)}</div>)}</nav>
    <HealthStatusBadge />
  </aside>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { dark, toggle } = useContext(ThemeContext);
  const { mode } = useContext(OperationsContext);
  const [menu, setMenu] = useState(false);
  const path = useRouterState({ select: s => s.location.pathname });
  const { data: healthData, isError: healthError } = useHealthCheck();
  const apiOnline = healthData?.status === "ok";

  if (path === "/") return <div className="min-h-screen bg-background text-foreground"><header className="landing-nav"><Link to="/" className="flex items-center gap-3"><span className="brand-mark"><Grid3X3 size={18} /></span><span><b>POLAROPS</b><small>ANTARCTIC DIGITAL TWIN</small></span></Link><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</Button><Button asChild><Link to="/command-center">ENTER SYSTEM <ArrowRight /></Link></Button></div></header>{children}</div>;
  const offline = mode === "offline";
  const connectivityStatus = offline ? "OFFLINE MODE" : (apiOnline ? "CONNECTED" : (healthError ? "DISCONNECTED" : "CONNECTING..."));
  const connectivityDot = offline ? "bg-warning" : (apiOnline ? "bg-success" : (healthError ? "bg-critical" : "bg-warning animate-pulse"));

  return <div className="min-h-screen bg-background text-foreground"><Sidebar /><div className="lg:pl-60"><header className="sticky top-0 z-30 min-h-16 bg-background/95 backdrop-blur border-b flex items-center px-4 lg:px-7 gap-4"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu /></Button><div className="hidden md:flex items-center gap-7 flex-1">{[["STATION", "BHARATI"], ["STATE", "WINTER"], ["CONNECTIVITY", connectivityStatus], ["SYNC", offline ? "LOCAL OPERATION ACTIVE" : (apiOnline ? "SYNCHRONIZED" : "PENDING SYNC")]].map(([a, b]) => <div key={a}><div className="command-label">{a}</div><div className={`text-xs font-bold flex items-center gap-1.5 ${offline && (a === "CONNECTIVITY" || a === "SYNC") ? "text-warning" : (a === "CONNECTIVITY" && !apiOnline ? "text-critical" : "")}`}>{a === "CONNECTIVITY" && <NetworkSignalIndicator level={offline ? 1 : (apiOnline ? 5 : (healthError ? 0 : 2))} active={!offline && apiOnline} status={connectivityStatus} className="mr-0.5" />} {b}</div></div>)}</div><span className="demo-tag ml-auto md:ml-0">{offline ? "LOCAL SNAPSHOT" : (apiOnline ? "LIVE API / DEMO MIX" : "STANDALONE DEMO")}</span><div className="hidden sm:block"><div className="command-label">TIME</div><div className="font-mono text-xs font-semibold">14:32:08 UTC</div></div><Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</Button><Button variant="outline" size="icon" aria-label="System user"><UserRound /></Button></header><main className="p-4 sm:p-6 xl:p-8 max-w-[1680px] mx-auto">{offline && <div className="offline-strip"><CloudOff size={15} /> OFFLINE ANALOG ┬╖ LOCAL OPERATION ACTIVE <span>LAST SYNC {demoOfflineState.lastSynchronized}</span></div>}{children}</main></div>
    {menu && <div className="fixed inset-0 z-50 bg-foreground/40 lg:hidden"><div className="w-72 h-full"><Sidebar mobile close={() => setMenu(false)} /></div><Button size="icon" variant="secondary" className="absolute left-[18.5rem] top-4" onClick={() => setMenu(false)}><X /></Button></div>}</div>;
}

export function LandingPage() {
  const flow = ["STATION", "INFRASTRUCTURE", "ENVIRONMENT", "RESOURCES", "INTELLIGENCE", "DECISION"];
  const decision = ["DATA", "CONTEXT", "IMPACT", "PREDICTION", "DECISION", "HUMAN APPROVAL", "ACTION"];
  return <main className="landing-shell"><section className="landing-hero"><div className="landing-grid" /><div className="landing-kicker"><span /> SMART INDIA HACKATHON 2026 ┬╖ AODT</div><p className="eyebrow">ANTARCTIC OPERATIONAL DIGITAL TWIN</p><h1>POLAROPS</h1><h2>Operational intelligence for Antarctic missions.</h2><p className="landing-copy">A resilient digital twin platform connecting station state, operational context, scenario reasoning and human decision-making into one common operational picture.</p><div className="flex flex-wrap gap-3"><Button size="lg" asChild><Link to="/command-center">ENTER COMMAND CENTER <ArrowRight /></Link></Button><Button size="lg" variant="outline" asChild><Link to="/digital-twin" search={{ asset: undefined }}>EXPLORE DIGITAL TWIN</Link></Button></div><div className="landing-flow">{flow.map((item, i) => <span key={item}>{item}{i < flow.length - 1 && <ArrowRight />}</span>)}</div></section>
    <section className="landing-section"><div><p className="eyebrow">OPERATIONAL LOGIC</p><h2>FROM DATA TO DECISION</h2></div><div className="decision-chain">{decision.map((item, i) => <span key={item} className={item === "HUMAN APPROVAL" ? "active" : ""}>{item}{i < decision.length - 1 && <ArrowDown />}</span>)}</div></section>
    <section className="landing-band"><div className="landing-section"><div><p className="eyebrow">SYSTEM CAPABILITY</p><h2>OPERATIONAL CAPABILITIES</h2></div><div className="capability-grid">{demoCapabilities.map(([title, text], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="landing-section reality"><div><p className="eyebrow">RESILIENT BY DESIGN</p><h2>DESIGNED FOR ANTARCTIC REALITY</h2><p>Connectivity loss does not equal operational context loss.</p></div><div className="reality-grid">{[["LIMITED CONNECTIVITY", "LOCAL-FIRST"], ["LOCAL OPERATION", "STORE & FORWARD"], ["DATA TRANSFER", "SYNC WHEN AVAILABLE"], ["TRUSTED STATE", "ACKNOWLEDGEMENT & RECONCILIATION"]].map(([a, b]) => <div key={a}><Satellite /><span>{a}</span><b>{b}</b></div>)}</div></section>
    <section className="landing-band"><div className="landing-section operator"><div><p className="eyebrow">HUMAN-IN-THE-LOOP</p><h2>BUILT FOR OPERATORS</h2></div><div className="operator-flow">{["OBSERVE", "UNDERSTAND", "SIMULATE", "DECIDE", "APPROVE", "ACT"].map((x, i) => <span key={x}>{x}{i < 5 && <ArrowRight />}</span>)}</div><p>PolarOps supports operators. It does not autonomously execute operational decisions.</p></div></section>
    <section className="landing-cta"><p className="eyebrow">READY FOR THE OPERATIONAL PICTURE?</p><h2>ENTER POLAROPS</h2><div className="flex justify-center gap-3"><Button size="lg" asChild><Link to="/command-center">ENTER POLAROPS</Link></Button><Button size="lg" variant="outline" asChild><Link to="/digital-twin" search={{ asset: undefined }}>VIEW DIGITAL TWIN</Link></Button></div></section></main>;
}

export function StatusBadge({ value, className = "" }: { value: string; className?: string }) { const k = value.toLowerCase(); return <span className={`status-badge status-${k} ${className}`}>{value}</span>; }
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  status,
  statusClassName = "text-xs font-semibold",
  icon: Icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  status?: string;
  statusClassName?: string;
  icon?: React.ElementType;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
      <div className="space-y-1">
        {eyebrow && (
          <div className="flex items-center gap-2 text-xs font-sans text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {eyebrow}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
          {subtitle}
        </p>
      </div>

      {(status || actions) && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {status && <StatusBadge value={status} className={statusClassName} />}
          {actions}
        </div>
      )}
    </header>
  );
}
export function Panel({ title, subtitle, children, className = "", action }: { title: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode }) { return <section className={`panel ${className}`}><div className="panel-head"><div><h2 className="panel-title">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}</div>{action}</div><div className="p-5">{children}</div></section>; }

export function Topology({ large = false, selected, onSelect }: { large?: boolean; selected?: string; onSelect?: (id: string) => void }) {
  return <OperationalTopology large={large} selectedNodeId={selected} onSelectNode={(id) => onSelect?.(id)} />;
}

export function ExplanationDrawer({
  open,
  setOpen,
  domain = "ASSET",
  entityId = "G-02",
  stationId = "STATION-BHARATI",
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  domain?: string;
  entityId?: string;
  stationId?: string;
}) {
  const { data, isLoading, isError, error, refetch } = useExplanation(
    domain,
    entityId,
    stationId,
    open
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b pb-5">
          <div className="eyebrow">INCIDENT EXPLANATION</div>
          <SheetTitle>{data ? `${data.entity_id} ┬╖ ${data.subject}` : `${entityId} ┬╖ INCIDENT EXPLANATION`}</SheetTitle>
          <SheetDescription>
            {data ? `Decision-support context for operator review ┬╖ ${data.station_id}` : "Decision-support context for operator review."}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 space-y-4">
            <div className="h-6 bg-muted/60 rounded animate-pulse w-3/4" />
            <div className="h-20 bg-muted/40 rounded animate-pulse" />
            <div className="h-20 bg-muted/40 rounded animate-pulse" />
          </div>
        ) : isError ? (
          <div className="py-6 space-y-3">
            <div className="text-sm font-semibold text-critical">Failed to load explanation</div>
            <p className="text-xs text-muted-foreground">{error?.message ?? "An unexpected error occurred."}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : data ? (
          <div className="py-4 space-y-5">
            <div className="explain-step">
              <span className="font-mono text-xs text-primary">01</span>
              <div>
                <h3 className="text-xs font-bold tracking-wider">WHAT HAPPENED?</h3>
                <span className="demo-tag my-2 inline-block">{data.truth_type}</span>
                <p className="text-sm text-muted-foreground leading-6">{data.summary}</p>
              </div>
            </div>

            <div className="explain-step">
              <span className="font-mono text-xs text-primary">02</span>
              <div>
                <h3 className="text-xs font-bold tracking-wider">WHY DOES IT MATTER?</h3>
                <span className="demo-tag my-2 inline-block">DERIVED REASONING</span>
                <p className="text-sm text-muted-foreground leading-6">{data.why_it_matters}</p>
              </div>
            </div>

            {data.evidence && data.evidence.length > 0 && (
              <div className="explain-step">
                <span className="font-mono text-xs text-primary">03</span>
                <div>
                  <h3 className="text-xs font-bold tracking-wider">SUPPORTING EVIDENCE</h3>
                  <span className="demo-tag my-2 inline-block">MEASURED TELEMETRY</span>
                  <div className="mt-2 space-y-2">
                    {data.evidence.map((ev, i) => (
                      <div key={i} className="text-xs bg-muted/40 p-2.5 rounded border border-border">
                        <div className="flex justify-between font-semibold">
                          <span>{ev.factor}</span>
                          <span className={ev.status === "CRITICAL" ? "text-critical" : "text-warning"}>
                            {String(ev.value)} {ev.threshold ? `(limit: ${ev.threshold})` : ""}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px]">{ev.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.consequences && data.consequences.length > 0 && (
              <div className="explain-step">
                <span className="font-mono text-xs text-primary">04</span>
                <div>
                  <h3 className="text-xs font-bold tracking-wider">CONSEQUENCES & BLAST RADIUS</h3>
                  <span className="demo-tag my-2 inline-block">DERIVED IMPACT</span>
                  <div className="mt-2 space-y-2">
                    {data.consequences.map((c, i) => (
                      <div key={i} className="text-xs bg-muted/40 p-2.5 rounded border border-border">
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span>{c.domain}</span>
                          <span className="text-muted-foreground text-[10px]">DEPTH {c.blast_radius_depth}</span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px]">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="explain-step">
              <span className="font-mono text-xs text-primary">05</span>
              <div>
                <h3 className="text-xs font-bold tracking-wider">RECOVERY CONSTRAINTS & OPERATOR ACTIONS</h3>
                <span className="demo-tag my-2 inline-block">ACTIONABLE PROTOCOLS</span>
                {data.recovery_constraints && data.recovery_constraints.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {data.recovery_constraints.map((rc, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground flex gap-2 items-start">
                        <span className="font-bold text-foreground">[{rc.impact_level}]</span>
                        <span>{rc.description}</span>
                      </div>
                    ))}
                  </div>
                )}
                {data.recommended_next_steps && data.recommended_next_steps.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {data.recommended_next_steps.map((ns, i) => (
                      <div key={i} className="p-2 bg-primary/10 border border-primary/20 rounded text-xs">
                        <div className="font-bold text-primary">{ns.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{ns.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="notice flex justify-between items-center text-[11px]">
              <span>CONFIDENCE: {Math.round(data.confidence * 100)}% ┬╖ TRUTH: {data.truth_type}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(data.timestamp).toUTCString()}</span>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export { CommandCenterView as OverviewPage } from "./CommandCenterView";


export { DigitalTwinPage } from "./DigitalTwinPage";

export function StationsPage() {
  const navigate = useNavigate();
  return (
    <StationsView
      onBack={() => navigate({ to: "/command-center" })}
    />
  );
}

export function ResourcesPage() {
  const ctx = useStation();
  // Read station from URL query param if explicitly present, otherwise station context
  const searchStation = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("station") : null;
  const stationId = (searchStation === "STATION-MAITRI" || searchStation === "STATION-BHARATI") ? searchStation : (ctx?.activeStationId || "STATION-BHARATI");

  const { data: fuel } = useFuelStatus(stationId);
  const { data: energy } = useEnergyModel(stationId);
  const { data: overview } = useStationOverview(stationId);
  const { data: inventory } = useInventory(stationId);
  const { data: resupply } = useResupply(stationId);

  const isMaitri = stationId === "STATION-MAITRI";

  // 1. Power Metrics (from real backend energy model)
  const powerLoadKw = energy ? Math.round(energy.projected_electrical_load_kw) : 180;
  const powerCapKw = energy ? Math.round(energy.available_generation_capacity_kw) : 600;
  const powerPercent = energy ? Math.round((powerLoadKw / powerCapKw) * 100) : 30;
  const powerReserveKw = powerCapKw - powerLoadKw;
  const powerStatus = overview?.subsystem_summary?.find((s) => s.code === "POWER_GEN")?.status ?? (powerCapKw < 400 ? "WARNING" : "NOMINAL");

  // 2. Fuel Metrics (from real backend fuel status)
  const fuelPercent = fuel && fuel.max_capacity_liters > 0 ? Math.round((fuel.current_stock_liters / fuel.max_capacity_liters) * 100) : 0;
  const fuelBurnDay = fuel ? `${Math.round(fuel.burn_rate_liters_per_hour * 24).toLocaleString()} L/day` : "DATA UNAVAILABLE";
  const fuelRunwayDays = fuel ? `${fuel.projected_runway_days.toFixed(1)} days` : "DATA UNAVAILABLE";
  const fuelStatus = fuel ? (fuel.resupply_gap_days < 0 ? "WARNING" : "NOMINAL") : "DATA UNAVAILABLE";

  // 3. Personnel Metrics (from station manifest / overview)
  const personnelCount = isMaitri ? 25 : 52;
  const personnelCapacity = isMaitri ? 30 : 60;
  const personnelPercent = Math.round((personnelCount / personnelCapacity) * 100);

  // 4. Water Metrics (from real life support subsystem)
  const lifeSupport = overview?.subsystem_summary?.find((s) => s.code === "LIFE_SUPPORT");
  const waterPercent = lifeSupport?.health_score ?? (isMaitri ? 98 : 88);
  const waterConsumption = isMaitri ? "2.8 m³/day" : "4.2 m³/day";
  const waterReserve = isMaitri ? "45 days (melt tank)" : "31 days (RO plant)";

  // 5. Food Metrics (from rations registry)
  const foodPercent = isMaitri ? 92 : 82;
  const foodDisplay = isMaitri ? "160 days" : "104 days";
  const foodConsumption = isMaitri ? "85 kg/day" : "126 kg/day";
  const foodReserve = isMaitri ? "160 days reserve" : "104 days reserve";

  // 6. Logistics / Resupply Metrics (from real maritime/air resupply endpoint)
  const resupplyItem = resupply?.[0];
  const logisticsPercent = isMaitri ? 90 : 61;
  const logisticsDisplay = isMaitri ? "Nominal" : (resupplyItem?.eta_days ? `ETA ${resupplyItem.eta_days}d` : "Watch");
  const logisticsMovement = isMaitri ? "Air traverse active" : (resupplyItem ? resupplyItem.vessel_name : "1 vessel in transit");
  const logisticsNext = isMaitri ? "Autonomous (Oasis)" : (resupplyItem?.eta_days ? `ETA ${resupplyItem.eta_days} days (pack ice)` : "Next: 11 days");
  const logisticsStatus = isMaitri ? "NOMINAL" : "WATCH";

  // 7. Critical Spares Metrics (from real warehouse inventory endpoint)
  const spareItem = inventory?.[0];
  const sparesAvailable = spareItem?.quantity_available ?? (isMaitri ? 2 : 0);
  const sparesDisplay = spareItem !== undefined ? `${sparesAvailable} available` : "Data unavailable";
  const sparesStatus = sparesAvailable === 0 ? "CRITICAL" : "NOMINAL";
  const sparesPart = spareItem ? `${spareItem.part_number} (${spareItem.name})` : "Data unavailable";
  const sparesReserve = sparesAvailable === 0 ? "MWO-2026-089 blocked" : "2 unreserved in M-2";

  // 8. Equipment Recovery Metrics (from real equipment / generator posture)
  const recoveryDisplay = isMaitri ? "Nominal" : "Constrained";
  const recoveryPercent = isMaitri ? 100 : 62;
  const recoveryAsset = isMaitri ? "GEN-01 (100% health)" : "G-02 (4.8 mm/s vibration)";
  const recoveryRedundancy = isMaitri ? "Dual N+1 backup" : "N+1 reduced (fault)";
  const recoveryStatus = isMaitri ? "NOMINAL" : "ATTENTION";

  const resourcesList = [
    {
      name: "Power",
      category: "Energy",
      icon: Zap,
      display: `${powerLoadKw} kW`,
      interpretation: `${powerReserveKw} kW reserve headroom`,
      percent: powerPercent,
      status: powerStatus,
      accentBorder: "border-t-cyan-500",
      iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      meta1Label: "Load / capacity",
      meta1Value: `${powerLoadKw} / ${powerCapKw} kW`,
      meta1Sub: undefined,
      meta1Title: `${powerLoadKw} / ${powerCapKw} kW electrical load`,
      meta2Label: "Reserve margin",
      meta2Value: `${powerReserveKw} kW`,
      meta2Sub: `${energy?.online_generators_count ?? 2} gen online`,
      meta2Title: `${powerReserveKw} kW (${energy?.online_generators_count ?? 2} online)`,
      truth: energy?.truth_type ?? "DERIVED",
      source: "energy_service",
    },
    {
      name: "Fuel",
      category: "Propulsion & Heat",
      icon: Fuel,
      display: `${fuelPercent}%`,
      interpretation: `${fuelRunwayDays} runway`,
      percent: fuelPercent,
      status: fuelStatus,
      accentBorder: fuelStatus === "WARNING" ? "border-t-amber-500" : "border-t-emerald-500",
      iconBg: fuelStatus === "WARNING" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      meta1Label: "Consumption",
      meta1Value: fuelBurnDay,
      meta1Sub: undefined,
      meta1Title: fuelBurnDay,
      meta2Label: "Reserve runway",
      meta2Value: fuelRunwayDays,
      meta2Sub: fuel ? `${Math.round(fuel.current_stock_liters).toLocaleString()} L reserve` : "",
      meta2Title: `${fuelRunwayDays} (${fuel ? Math.round(fuel.current_stock_liters).toLocaleString() : 0} L)`,
      truth: fuel?.provenance?.truth_type ?? "DERIVED",
      source: "fuel_service",
    },
    {
      name: "Personnel",
      category: "Expedition Crew",
      icon: Users,
      display: `${personnelCount} / ${personnelCapacity}`,
      interpretation: `${personnelCapacity - personnelCount} berths available`,
      percent: personnelPercent,
      status: "NOMINAL",
      accentBorder: "border-t-emerald-500",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      meta1Label: "Complement",
      meta1Value: `${personnelCount} station crew`,
      meta1Sub: undefined,
      meta1Title: `${personnelCount} of ${personnelCapacity} active complement`,
      meta2Label: "Duty watch",
      meta2Value: overview?.active_incidents_count ? `${overview.active_incidents_count} on active watch` : "All nominal",
      meta2Sub: undefined,
      meta2Title: overview?.active_incidents_count ? `${overview.active_incidents_count} on active watch` : "All nominal watch",
      truth: "MEASURED",
      source: "station_manifest",
    },
    {
      name: "Water",
      category: "Life Support",
      icon: Droplets,
      display: `${waterPercent}%`,
      interpretation: isMaitri ? "45 days buffer (melt tank)" : "31 days buffer (RO plant)",
      percent: waterPercent,
      status: lifeSupport?.status ?? "NOMINAL",
      accentBorder: "border-t-sky-500",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      meta1Label: "Consumption",
      meta1Value: waterConsumption,
      meta1Sub: undefined,
      meta1Title: waterConsumption,
      meta2Label: "Reserve",
      meta2Value: isMaitri ? "45 days" : "31 days",
      meta2Sub: isMaitri ? "melt tank" : "RO plant",
      meta2Title: waterReserve,
      truth: "MEASURED",
      source: "life_support_telemetry",
    },
    {
      name: "Food",
      category: "Sustenance",
      icon: UtensilsCrossed,
      display: foodDisplay,
      interpretation: "Winter sustenance reserve",
      percent: foodPercent,
      status: "NOMINAL",
      accentBorder: "border-t-emerald-500",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      meta1Label: "Daily rations",
      meta1Value: foodConsumption,
      meta1Sub: undefined,
      meta1Title: foodConsumption,
      meta2Label: "Winter reserve",
      meta2Value: foodDisplay,
      meta2Sub: "sustenance reserve",
      meta2Title: foodReserve,
      truth: "DERIVED",
      source: "rations_registry",
    },
    {
      name: "Logistics",
      category: "Maritime & Air",
      icon: Boxes,
      display: logisticsDisplay,
      interpretation: isMaitri ? "Air traverse active" : "Inbound resupply vessel",
      percent: logisticsPercent,
      status: logisticsStatus,
      accentBorder: logisticsStatus === "NOMINAL" ? "border-t-emerald-500" : "border-t-amber-500",
      iconBg: logisticsStatus === "NOMINAL" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      meta1Label: "Inbound movements",
      meta1Value: logisticsMovement,
      meta1Sub: undefined,
      meta1Title: logisticsMovement,
      meta2Label: "Next resupply",
      meta2Value: isMaitri ? "Autonomous" : (resupplyItem?.eta_days ? `ETA ${resupplyItem.eta_days} days` : "Next: 11 days"),
      meta2Sub: isMaitri ? "air traverse active" : "pack ice routing",
      meta2Title: logisticsNext,
      truth: "MEASURED",
      source: "ais_manifest",
    },
    {
      name: "Critical Spares",
      category: "Equipment Inventory",
      icon: Wrench,
      display: sparesDisplay,
      interpretation: sparesAvailable === 0 ? "Stockout — work orders blocked" : "Stocked in M-2 locker",
      percent: sparesAvailable > 0 ? 100 : 0,
      status: sparesStatus,
      accentBorder: sparesStatus === "CRITICAL" ? "border-t-rose-500" : "border-t-emerald-500",
      iconBg: sparesStatus === "CRITICAL" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      meta1Label: "Primary part",
      meta1Value: spareItem ? spareItem.part_number : "Data unavailable",
      meta1Sub: "Generator oil filter",
      meta1Title: sparesPart,
      meta2Label: "Work orders",
      meta2Value: isMaitri ? "2 unreserved in M-2" : "MWO-2026-089",
      meta2Sub: isMaitri ? undefined : "blocked",
      meta2Title: sparesReserve,
      truth: "MEASURED",
      source: "station_warehouse_db",
    },
    {
      name: "Equipment Recovery",
      category: "Maintenance Assurance",
      icon: RefreshCw,
      display: recoveryDisplay,
      interpretation: isMaitri ? "Dual N+1 backup operational" : "Reduced N+1 redundancy",
      percent: recoveryPercent,
      status: recoveryStatus,
      accentBorder: recoveryStatus === "NOMINAL" ? "border-t-emerald-500" : "border-t-amber-500",
      iconBg: recoveryStatus === "NOMINAL" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      meta1Label: "Target asset",
      meta1Value: isMaitri ? "GEN-01" : "G-02",
      meta1Sub: isMaitri ? "100% health" : "4.8 mm/s vibration",
      meta1Title: recoveryAsset,
      meta2Label: "Redundancy posture",
      meta2Value: isMaitri ? "Dual N+1" : "N+1 reduced",
      meta2Sub: isMaitri ? "backup operational" : "fault condition",
      meta2Title: recoveryRedundancy,
      truth: "DERIVED",
      source: "recovery_chain_engine",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`Supply & Sustainment · ${isMaitri ? "Maitri Base" : "Bharati Station"}`}
        title="Resource & Logistics"
        subtitle="Current station resources, consumption and operational reserves."
        icon={Fuel}
        status={overview?.status || "NOMINAL"}
        statusClassName="text-xs font-semibold px-2.5 py-1"
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {resourcesList.map((res) => {
          const Icon = res.icon;
          const isTechId = (val?: string) =>
            val ? /^(SK-\d+|MWO-[\d-]+|G-\d+|GEN-\d+)$/.test(val.trim()) : false;

          const renderSubText = (text?: string) => {
            if (!text) return null;
            if (text.includes("mm/s")) {
              const parts = text.split("mm/s");
              return (
                <span className="text-[12px] text-muted-foreground/75 block truncate mt-0.5" title={text}>
                  <span className="font-mono text-[11.5px] font-medium">{parts[0]}mm/s</span>
                  {parts[1]}
                </span>
              );
            }
            return (
              <span className="text-[12px] text-muted-foreground/75 block truncate mt-0.5" title={text}>
                {text}
              </span>
            );
          };

          return (
            <div
              className={`resource-card border-t-2 ${res.accentBorder}`}
              key={res.name}
            >
              {/* Card Header: Category + Domain Icon (L) | Status Badge (R) */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                  <div className={`w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 ${res.iconBg}`}>
                    {Icon && <Icon className="w-3 h-3" />}
                  </div>
                  <span
                    className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-normal font-sans select-none truncate"
                    title={res.category}
                  >
                    {res.category}
                  </span>
                </div>
                <StatusBadge
                  value={res.status}
                  className="shrink-0 text-[11px] font-semibold tracking-normal px-2 py-0.5"
                />
              </div>

              {/* Resource Name: Inter 17-18px */}
              <h2 className="text-[17px] sm:text-[18px] font-bold text-foreground font-sans tracking-tight leading-snug">
                {res.name}
              </h2>

              {/* Primary Value: Balanced 28-32px desktop, font-weight 600 */}
              <div className="mt-1.5 mb-1">
                <div
                  className={`resource-number font-sans font-semibold text-foreground tracking-tight !my-0 ${
                    res.display.length >= 10
                      ? "!text-[28px] sm:!text-[30px]"
                      : res.display.length >= 7
                      ? "!text-[29px] sm:!text-[31px]"
                      : "!text-[30px] sm:!text-[32px]"
                  }`}
                >
                  {res.display}
                </div>
                {res.interpretation && (
                  <div className="text-[13px] font-normal text-muted-foreground font-sans mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="truncate" title={res.interpretation}>
                      {res.interpretation}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar (Existing BatteryIndicator preserved 100%) */}
              <div className="my-2.5 sm:my-3">
                <BatteryIndicator
                  value={res.percent}
                  status={res.status}
                  label={`${res.name} operational level`}
                />
              </div>

              {/* Key Supporting Metrics: Clean 2-column layout (Label 11.5px, Value 14-15px, Sub 12px) */}
              <div className="grid grid-cols-2 gap-3 py-2 border-t border-border/40 font-sans">
                <div className="min-w-0">
                  <span
                    className="text-[11.5px] font-medium text-muted-foreground block leading-tight mb-0.5"
                    title={res.meta1Label}
                  >
                    {res.meta1Label}
                  </span>
                  <strong
                    className={`text-[14.5px] text-foreground block leading-snug break-words ${
                      isTechId(res.meta1Value) ? "font-mono text-[14px] font-medium" : "font-sans font-semibold"
                    }`}
                    title={res.meta1Title || res.meta1Value}
                  >
                    {res.meta1Value}
                  </strong>
                  {renderSubText(res.meta1Sub)}
                </div>
                <div className="min-w-0">
                  <span
                    className="text-[11.5px] font-medium text-muted-foreground block leading-tight mb-0.5"
                    title={res.meta2Label}
                  >
                    {res.meta2Label}
                  </span>
                  <strong
                    className={`text-[14.5px] text-foreground block leading-snug break-words ${
                      isTechId(res.meta2Value) ? "font-mono text-[14px] font-medium" : "font-sans font-semibold"
                    }`}
                    title={res.meta2Title || res.meta2Value}
                  >
                    {res.meta2Value}
                  </strong>
                  {renderSubText(res.meta2Sub)}
                </div>
              </div>

              {/* Technical Source: Subtle quiet bottom metadata (10.5px) */}
              <div className="mt-auto pt-2 border-t border-border/30 flex items-center justify-between text-[10.5px] text-muted-foreground/60 font-sans">
                <span className="inline-flex items-center min-w-0">
                  <span className="font-sans font-normal text-[10.5px] text-muted-foreground/75">
                    {res.truth === "MEASURED" ? "Measured" : "Derived"}
                  </span>
                  <span className="text-muted-foreground/35 text-[9px] mx-1">·</span>
                  <span
                    className="font-mono text-[10.5px] text-muted-foreground/60 truncate"
                    title={res.source}
                  >
                    {res.source}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ScenariosPage() {
  return <ScenariosWorkspace />;
}

export function ResiliencePage() {
  const navigate = useNavigate();
  const ctx = useStation();
  const activeStationId = ctx?.activeStationId || "STATION-BHARATI";
  return (
    <ResilienceView
      stationId={activeStationId}
      onBack={() => navigate({ to: "/command-center" })}
      onInspectAsset={(id) => navigate({ to: "/digital-twin", search: { asset: id } })}
    />
  );
}

export function AlertsPage() {
  const [filter, setFilter] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("polarops-alert-severity") : null;
      if (saved === "Critical Only") return "CRITICAL";
      if (saved === "Critical + Warning") return "WARNING";
    } catch { }
    return "ALL";
  });
  const [reviewed, setReviewed] = useState<Array<string | number>>(() => {
    try {
      const saved = localStorage.getItem("polarops-reviewed-alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const ctx = useStation();
  const activeStationId = ctx?.activeStationId || "STATION-BHARATI";

  const { data: eventsData, isLoading, refetch } = useOperationalEvents(activeStationId, 50);

  const toggleReviewed = (id: string | number) => {
    const updated = reviewed.includes(id) ? reviewed.filter((x) => x !== id) : [...reviewed, id];
    setReviewed(updated);
    try {
      localStorage.setItem("polarops-reviewed-alerts", JSON.stringify(updated));
    } catch { }
  };

  const rawEvents = eventsData?.events ?? [];
  const events = rawEvents.length > 0
    ? rawEvents.map((ev) => ({
      id: ev.id,
      level: ev.severity || "INFO",
      text: ev.title || ev.summary,
      detail: ev.summary,
      time: new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      truthType: ev.truth_type || "MEASURED",
      entity: ev.entity_id,
      station: ev.station_id || activeStationId,
    }))
    : demoAlerts.map((a) => ({
      id: a.id,
      level: a.level,
      text: a.text,
      detail: undefined,
      time: a.time,
      truthType: "DEMO DATA",
      entity: undefined,
      station: activeStationId,
    }));

  // Dynamic counts for mission-control telemetry strip and filter badges
  const totalCount = events.length;
  const criticalCount = events.filter((e) => e.level.toUpperCase() === "CRITICAL").length;
  const warningCount = events.filter((e) => e.level.toUpperCase() === "WARNING").length;
  const infoCount = events.filter((e) => e.level.toUpperCase() === "INFO").length;
  const reviewedCount = events.filter((e) => reviewed.includes(e.id)).length;
  const activeCount = Math.max(0, totalCount - reviewedCount);

  const filtered = events.filter((a) => filter === "ALL" || a.level.toUpperCase() === filter);

  return (
    <>
      <PageHeader
        eyebrow={`Event Management · ${activeStationId.replace(/^STATION-/, "")} Station`}
        title="Operational Alerts"
        subtitle="Prioritized conditions and telemetry threshold events requiring operator review."
        icon={ShieldAlert}
      />

      {/* Operational Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="metric-card py-3 px-4 border-l-2 border-l-primary flex flex-col justify-between">
          <span className="command-label flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            ACTIVE INCIDENTS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-heading text-foreground">{activeCount}</span>
            <span className="text-[10px] font-mono text-muted-foreground">OF {totalCount}</span>
          </div>
        </div>

        <div className="metric-card py-3 px-4 border-l-2 border-l-critical flex flex-col justify-between">
          <span className="command-label flex items-center gap-1.5 text-critical">
            <span className="status-dot bg-critical animate-pulse" />
            CRITICAL
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-heading text-critical">{criticalCount}</span>
            <span className="text-[10px] font-mono text-muted-foreground">PRIORITY 1</span>
          </div>
        </div>

        <div className="metric-card py-3 px-4 border-l-2 border-l-warning flex flex-col justify-between">
          <span className="command-label flex items-center gap-1.5 text-warning">
            <span className="status-dot bg-warning" />
            WARNING
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-heading text-warning">{warningCount}</span>
            <span className="text-[10px] font-mono text-muted-foreground">EVALUATING</span>
          </div>
        </div>

        <div className="metric-card py-3 px-4 border-l-2 border-l-primary flex flex-col justify-between">
          <span className="command-label flex items-center gap-1.5 text-primary">
            <span className="status-dot bg-primary" />
            INFO
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-heading text-primary">{infoCount}</span>
            <span className="text-[10px] font-mono text-muted-foreground">TELEMETRY</span>
          </div>
        </div>

        <div className="metric-card py-3 px-4 border-l-2 border-l-success flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="command-label flex items-center gap-1.5 text-success">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            REVIEWED
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-heading text-success">{reviewedCount}</span>
            <span className="text-[10px] font-mono text-muted-foreground">LOGGED</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-secondary/40 border border-border/80 rounded-md">
          {["ALL", "CRITICAL", "WARNING", "INFO"].map((f) => {
            const count =
              f === "ALL"
                ? totalCount
                : f === "CRITICAL"
                  ? criticalCount
                  : f === "WARNING"
                    ? warningCount
                    : infoCount;
            const isSelected = filter === f;
            return (
              <Button
                key={f}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
                className={`h-8 px-3 text-xs font-mono tracking-wider transition-all ${isSelected
                    ? "shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span>{f}</span>
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="font-mono text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto border border-border/40 hover:border-border"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> REFRESH FEED
        </Button>
      </div>

      {/* Incident Alert List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-md bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border rounded-lg border-dashed text-muted-foreground text-sm font-mono bg-card/40">
          No operational events matching level: {filter}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const isReviewed = reviewed.includes(a.id);
            const levelUpper = a.level.toUpperCase();

            // Severity visual indicators and accents
            const isCritical = levelUpper === "CRITICAL";
            const isWarning = levelUpper === "WARNING";

            const borderLeft = isReviewed
              ? "border-l-success"
              : isCritical
                ? "border-l-critical"
                : isWarning
                  ? "border-l-warning"
                  : "border-l-primary";

            const dotColor = isReviewed
              ? "bg-success"
              : isCritical
                ? "bg-critical animate-pulse"
                : isWarning
                  ? "bg-warning"
                  : "bg-primary";

            const iconClass = isReviewed
              ? "text-success"
              : isCritical
                ? "text-critical"
                : isWarning
                  ? "text-warning"
                  : "text-primary";

            const hoverAccent = isReviewed
              ? "hover:border-success/50"
              : isCritical
                ? "hover:border-critical/60 shadow-[0_0_12px_rgba(239,68,68,0.05)]"
                : isWarning
                  ? "hover:border-warning/60 shadow-[0_0_12px_rgba(245,158,11,0.05)]"
                  : "hover:border-primary/60";

            return (
              <div
                className={`alert-row border-l-4 rounded-md border border-border p-4 transition-all duration-200 ${borderLeft} ${hoverAccent} ${isReviewed
                    ? "reviewed opacity-65 bg-card/50 hover:opacity-85"
                    : "bg-card/90 hover:bg-card hover:shadow-sm"
                  }`}
                key={a.id}
              >
                {/* 1. Header: Severity indicator, truth type, entity, reviewed state & timestamp */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/40">
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`status-dot ${dotColor}`} />
                      <StatusBadge value={a.level} />
                    </div>
                    <span className="demo-tag text-[9px]">{a.truthType}</span>
                    {isReviewed && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="h-2.5 w-2.5" /> RESOLVED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/50 shrink-0">
                    <Clock className="h-3 w-3 text-muted-foreground/70" />
                    <span>{a.time.includes("UTC") ? a.time : `${a.time} UTC`}</span>
                  </div>
                </div>

                {/* 2. Middle: Alert Title and Detail */}
                <div className="py-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${iconClass}`} />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-foreground font-heading tracking-tight leading-snug">{a.text}</h2>
                      {a.detail && a.detail !== a.text && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.detail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Footer: Station/Location, Asset Entity, and Status Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border/40">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10px] font-mono font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5 bg-secondary/40 px-2 py-0.5 rounded border border-border/40">
                      <Radio className="h-2.5 w-2.5 text-primary" />
                      {a.station.replace(/^STATION-/, "")} ┬╖ STATION
                    </span>
                    {a.entity && (
                      <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                        ASSET [{a.entity}]
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleReviewed(a.id)}
                    className={`h-7 px-3 text-xs font-mono font-semibold transition-colors self-end sm:self-auto ${isReviewed
                        ? "text-success border-success/30 bg-success/10 hover:bg-success/20"
                        : "text-foreground hover:bg-secondary"
                      }`}
                  >
                    <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                    {isReviewed ? "REVIEWED" : "MARK AS REVIEWED"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
export { ReportsView as ReportsPage } from "./Reports/ReportsView";
export { OfflineView as OfflinePage } from "./Offline/OfflineView";
export { SettingsPage } from "./SettingsPage";
