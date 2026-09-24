import { Link, useRouterState, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowDown, ArrowRight, BarChart3, Bell, Boxes, ChevronDown, ChevronRight, CircleGauge, ClipboardCheck, CloudOff, Download, FileText, Fuel, Grid3X3, Menu, Minus, Moon, Plus, Radio, RefreshCw, RotateCcw, Satellite, Settings, ShieldCheck, Sun, UserRound, Users, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { demoActivities, demoAlerts, demoCapabilities, demoDependencies, demoOfflineState, demoReports, demoResources, demoScenarios, demoStationData, demoSyncQueue } from "@/lib/demo-data";
import { useStationOverview } from "../hooks/useStationOverview";
import { useOperationalIntelligence } from "../hooks/useOperationalIntelligence";
import { useOperationalEvents } from "../hooks/useOperationalEvents";
import { useAssetTelemetry } from "../hooks/useAssetTelemetry";
import { useExplanation } from "../hooks/useExplanation";
import { OperationalTopology } from "./OperationalTopology";

const navGroups = [
  ["COMMAND", [["Overview", "/command-center", CircleGauge], ["Digital Twin", "/digital-twin", Boxes], ["Stations", "/stations", Radio]]],
  ["OPERATIONS", [["Resources", "/resources", Fuel], ["Scenarios", "/scenarios", Activity], ["Resilience", "/resilience", ShieldCheck], ["Alerts", "/alerts", Bell]]],
  ["REPORTING", [["Reports", "/reports", FileText]]], ["SYSTEM", [["Offline Analog", "/offline", CloudOff], ["Settings", "/settings", Settings]]],
] as const;

type OperationsMode = "online" | "offline";
const OperationsContext = createContext({ mode: "online" as OperationsMode, setMode: (_mode: OperationsMode) => {} });
export function OperationsProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OperationsMode>("online");
  useEffect(() => { if (localStorage.getItem("polarops-mode") === "offline") setModeState("offline"); }, []);
  const setMode = (next: OperationsMode) => { setModeState(next); localStorage.setItem("polarops-mode", next); };
  return <OperationsContext.Provider value={{ mode, setMode }}>{children}</OperationsContext.Provider>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("polarops-theme"); const value = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; setDark(value); document.documentElement.classList.toggle("dark", value); }, []);
  const toggle = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("polarops-theme", next ? "dark" : "light"); };
  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}
import { createContext, useContext } from "react";
import { useHealthCheck } from "../hooks/useHealthCheck";
const ThemeContext = createContext({ dark: false, toggle: () => {} });

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
        {data.service.toUpperCase()} · V1 OK
      </span>
    </div>
  );
}

function Sidebar({ mobile = false, close }: { mobile?: boolean; close?: () => void }) {
  const path = useRouterState({ select: s => s.location.pathname });
  return <aside className={`${mobile ? "w-full" : "hidden lg:flex w-60 fixed inset-y-0 left-0"} flex-col border-r bg-sidebar text-sidebar-foreground z-40`}>
    <div className="h-20 px-5 flex items-center border-b border-sidebar-border"><div className="h-9 w-9 bg-primary text-primary-foreground grid place-items-center mr-3"><Grid3X3 size={19}/></div><div><div className="font-display font-bold tracking-[0.14em]">POLAROPS</div><div className="text-[10px] text-muted-foreground uppercase">Antarctic Digital Twin</div></div></div>
    <nav className="flex-1 px-3 py-5 overflow-y-auto">{navGroups.map(([group, items]) => <div key={group} className="mb-5"><p className="px-3 mb-2 text-[10px] font-bold tracking-[0.18em] text-muted-foreground">{group}</p>{items.map(([label, to, Icon]) => <Link key={to} to={to} onClick={close} className={`relative flex items-center gap-3 px-3 h-10 mb-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${path === to ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold before:absolute before:left-0 before:h-5 before:w-0.5 before:bg-primary" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}><Icon size={17}/>{label}</Link>)}</div>)}</nav>
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

  if (path === "/") return <div className="min-h-screen bg-background text-foreground"><header className="landing-nav"><Link to="/" className="flex items-center gap-3"><span className="brand-mark"><Grid3X3 size={18}/></span><span><b>POLAROPS</b><small>ANTARCTIC DIGITAL TWIN</small></span></Link><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">{dark ? <Sun/> : <Moon/>}</Button><Button asChild><Link to="/command-center">ENTER SYSTEM <ArrowRight/></Link></Button></div></header>{children}</div>;
  const offline = mode === "offline";
  const connectivityStatus = offline ? "OFFLINE MODE" : (apiOnline ? "CONNECTED" : (healthError ? "DISCONNECTED" : "CONNECTING..."));
  const connectivityDot = offline ? "bg-warning" : (apiOnline ? "bg-success" : (healthError ? "bg-critical" : "bg-warning animate-pulse"));

  return <div className="min-h-screen bg-background text-foreground"><Sidebar/><div className="lg:pl-60"><header className="sticky top-0 z-30 min-h-16 bg-background/95 backdrop-blur border-b flex items-center px-4 lg:px-7 gap-4"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu/></Button><div className="hidden md:flex items-center gap-7 flex-1">{[["STATION","BHARATI"],["STATE","WINTER"],["CONNECTIVITY",connectivityStatus],["SYNC",offline?"LOCAL OPERATION ACTIVE":(apiOnline?"SYNCHRONIZED":"PENDING SYNC")]].map(([a,b])=><div key={a}><div className="command-label">{a}</div><div className={`text-xs font-bold flex items-center gap-1.5 ${offline && (a==="CONNECTIVITY"||a==="SYNC") ? "text-warning" : (a==="CONNECTIVITY" && !apiOnline ? "text-critical" : "")}`}>{a === "CONNECTIVITY" && <span className={`status-dot ${connectivityDot}`}/>} {b}</div></div>)}</div><span className="demo-tag ml-auto md:ml-0">{offline ? "LOCAL SNAPSHOT" : (apiOnline ? "LIVE API / DEMO MIX" : "STANDALONE DEMO")}</span><div className="hidden sm:block"><div className="command-label">TIME</div><div className="font-mono text-xs font-semibold">14:32:08 UTC</div></div><Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">{dark ? <Sun/> : <Moon/>}</Button><Button variant="outline" size="icon" aria-label="System user"><UserRound/></Button></header><main className="p-4 sm:p-6 xl:p-8 max-w-[1680px] mx-auto">{offline && <div className="offline-strip"><CloudOff size={15}/> OFFLINE ANALOG · LOCAL OPERATION ACTIVE <span>LAST SYNC {demoOfflineState.lastSynchronized}</span></div>}{children}</main></div>
  {menu && <div className="fixed inset-0 z-50 bg-foreground/40 lg:hidden"><div className="w-72 h-full"><Sidebar mobile close={() => setMenu(false)}/></div><Button size="icon" variant="secondary" className="absolute left-[18.5rem] top-4" onClick={()=>setMenu(false)}><X/></Button></div>}</div>;
}

export function LandingPage() {
  const flow = ["STATION","INFRASTRUCTURE","ENVIRONMENT","RESOURCES","INTELLIGENCE","DECISION"];
  const decision = ["DATA","CONTEXT","IMPACT","PREDICTION","DECISION","HUMAN APPROVAL","ACTION"];
  return <main className="landing-shell"><section className="landing-hero"><div className="landing-grid"/><div className="landing-kicker"><span/> SMART INDIA HACKATHON 2026 · AODT</div><p className="eyebrow">ANTARCTIC OPERATIONAL DIGITAL TWIN</p><h1>POLAROPS</h1><h2>Operational intelligence for Antarctic missions.</h2><p className="landing-copy">A resilient digital twin platform connecting station state, operational context, scenario reasoning and human decision-making into one common operational picture.</p><div className="flex flex-wrap gap-3"><Button size="lg" asChild><Link to="/command-center">ENTER COMMAND CENTER <ArrowRight/></Link></Button><Button size="lg" variant="outline" asChild><Link to="/digital-twin" search={{ asset: undefined }}>EXPLORE DIGITAL TWIN</Link></Button></div><div className="landing-flow">{flow.map((item,i)=><span key={item}>{item}{i<flow.length-1&&<ArrowRight/>}</span>)}</div></section>
  <section className="landing-section"><div><p className="eyebrow">OPERATIONAL LOGIC</p><h2>FROM DATA TO DECISION</h2></div><div className="decision-chain">{decision.map((item,i)=><span key={item} className={item==="HUMAN APPROVAL"?"active":""}>{item}{i<decision.length-1&&<ArrowDown/>}</span>)}</div></section>
  <section className="landing-band"><div className="landing-section"><div><p className="eyebrow">SYSTEM CAPABILITY</p><h2>OPERATIONAL CAPABILITIES</h2></div><div className="capability-grid">{demoCapabilities.map(([title,text],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
  <section className="landing-section reality"><div><p className="eyebrow">RESILIENT BY DESIGN</p><h2>DESIGNED FOR ANTARCTIC REALITY</h2><p>Connectivity loss does not equal operational context loss.</p></div><div className="reality-grid">{[["LIMITED CONNECTIVITY","LOCAL-FIRST"],["LOCAL OPERATION","STORE & FORWARD"],["DATA TRANSFER","SYNC WHEN AVAILABLE"],["TRUSTED STATE","ACKNOWLEDGEMENT & RECONCILIATION"]].map(([a,b])=><div key={a}><Satellite/><span>{a}</span><b>{b}</b></div>)}</div></section>
  <section className="landing-band"><div className="landing-section operator"><div><p className="eyebrow">HUMAN-IN-THE-LOOP</p><h2>BUILT FOR OPERATORS</h2></div><div className="operator-flow">{["OBSERVE","UNDERSTAND","SIMULATE","DECIDE","APPROVE","ACT"].map((x,i)=><span key={x}>{x}{i<5&&<ArrowRight/>}</span>)}</div><p>PolarOps supports operators. It does not autonomously execute operational decisions.</p></div></section>
  <section className="landing-cta"><p className="eyebrow">READY FOR THE OPERATIONAL PICTURE?</p><h2>ENTER POLAROPS</h2><div className="flex justify-center gap-3"><Button size="lg" asChild><Link to="/command-center">ENTER POLAROPS</Link></Button><Button size="lg" variant="outline" asChild><Link to="/digital-twin" search={{ asset: undefined }}>VIEW DIGITAL TWIN</Link></Button></div></section></main>;
}

export function StatusBadge({ value }: { value: string }) { const k = value.toLowerCase(); return <span className={`status-badge status-${k}`}>{value}</span>; }
export function PageHeader({ eyebrow, title, subtitle, status }: { eyebrow?: string; title: string; subtitle: string; status?: string }) { return <div className="mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="page-title">{title}</h1><p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">{subtitle}</p></div>{status && <StatusBadge value={status}/>}</div>; }
export function Panel({ title, subtitle, children, className="", action }: { title: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode }) { return <section className={`panel ${className}`}><div className="panel-head"><div><h2 className="panel-title">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}</div>{action}</div><div className="p-5">{children}</div></section>; }

export function Topology({ large=false, selected, onSelect }: { large?: boolean; selected?: string; onSelect?: (id:string)=>void }) {
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
          <SheetTitle>{data ? `${data.entity_id} · ${data.subject}` : `${entityId} · INCIDENT EXPLANATION`}</SheetTitle>
          <SheetDescription>
            {data ? `Decision-support context for operator review · ${data.station_id}` : "Decision-support context for operator review."}
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
              <span>CONFIDENCE: {Math.round(data.confidence * 100)}% · TRUTH: {data.truth_type}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(data.timestamp).toUTCString()}</span>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function OverviewPage() {
  const [explain, setExplain] = useState(false);
  const [reason, setReason] = useState(true);

  const stationId = "STATION-BHARATI";
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErrorObj,
    refetch: refetchOverview,
  } = useStationOverview(stationId);

  const {
    data: intel,
    isLoading: intelLoading,
    refetch: refetchIntel,
  } = useOperationalIntelligence(stationId);

  const {
    data: eventsData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useOperationalEvents(stationId, 6);

  const {
    data: telemetry,
    refetch: refetchTelemetry,
  } = useAssetTelemetry("G-02", 15);

  const powerSub = overview?.subsystem_summary?.find(
    (s) => s.code === "POWER" || s.name.toLowerCase().includes("power")
  );

  const primaryEvent = overview?.critical_events?.[0];
  const primaryDecision = intel?.decisions?.[0];

  const vibrationSeries = telemetry?.series?.find(
    (s) => s.metric_key === "vibration_rms" || s.metric_name.toLowerCase().includes("vibration")
  );
  const loadSeries = telemetry?.series?.find(
    (s) => s.metric_key === "load_percentage" || s.metric_name.toLowerCase().includes("load")
  );
  const tempSeries = telemetry?.series?.find(
    (s) => s.metric_key === "winding_temp_celsius" || s.metric_name.toLowerCase().includes("temp")
  );

  const vibPoints = vibrationSeries?.points?.slice(-11) ?? [];
  const maxVib = Math.max(...vibPoints.map((p) => p.value), 5);
  const vibBars: number[] =
    vibPoints.length > 0
      ? vibPoints.map((p) => Math.max(4, Math.round((p.value / maxVib) * 36)))
      : [8, 12, 16, 20, 24, 32, 36, 30, 22, 16, 12];
  const currentVib = vibrationSeries?.current_value ?? 4.82;
  const currentLoad = loadSeries?.current_value ?? 84.5;
  const currentTemp = tempSeries?.current_value ?? 68.2;

  const retryAll = () => {
    refetchOverview();
    refetchIntel();
    refetchEvents();
    refetchTelemetry();
  };

  return (
    <>
      <PageHeader
        eyebrow={`STATION ${overview?.station_id?.replace("STATION-", "") ?? "BHARATI"} · ${overview?.environment_mode ?? "WINTER"} OPERATIONS`}
        title="Operational Command Center"
        subtitle="Common operational picture for station infrastructure, environment, personnel and logistics."
        status={overview?.status ?? (overviewLoading ? "CONNECTING..." : "OPERATIONAL")}
      />

      {overviewError && (
        <div data-testid="command-center-error" className="mb-6 p-4 rounded-md border border-critical/40 bg-critical/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-critical">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Failed to load real-time station telemetry</p>
              <p className="text-xs text-muted-foreground">{overviewErrorObj?.message ?? "Backend unreachable."}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-critical/30 hover:bg-critical/20"
            onClick={retryAll}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> RETRY CONNECTION
          </Button>
        </div>
      )}

      <div className="section-label">OPERATIONAL METRICS</div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {overviewLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="metric-card animate-pulse">
              <div className="h-4 bg-muted/60 rounded w-1/2 mb-3" />
              <div className="h-8 bg-muted/40 rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted/30 rounded w-full mt-4" />
            </div>
          ))
        ) : overview ? (
          <>
            <div className="metric-card" data-testid="metric-power">
              <div className="flex justify-between">
                <span className="eyebrow">POWER SUBSYSTEM</span>
                <Zap className="text-primary" size={18} />
              </div>
              <div className="metric-value">
                {powerSub?.health_score !== undefined ? `${powerSub.health_score.toFixed(1)}%` : "NOMINAL"}
              </div>
              <p className="text-xs text-muted-foreground">
                {powerSub?.name ?? "Primary Power Generation"} · Status: {powerSub?.status ?? "DEGRADED"}
              </p>
              <div className="mt-5 flex justify-between items-center">
                <StatusBadge value={powerSub?.status ?? "DEGRADED"} />
                <span className="demo-label">MEASURED · TELEMETRY</span>
              </div>
            </div>

            <div className="metric-card" data-testid="metric-fuel">
              <div className="flex justify-between">
                <span className="eyebrow">FUEL RUNWAY</span>
                <Fuel className="text-warning" size={18} />
              </div>
              <div className="metric-value">{overview.fuel_runway_days ?? 81} DAYS</div>
              <p className="text-xs text-muted-foreground">
                {overview.fuel_quantity_liters !== undefined && overview.fuel_quantity_liters !== null
                  ? `${overview.fuel_quantity_liters.toLocaleString()} L in reserve`
                  : "64,800 L in reserve"}
              </p>
              <div className="mt-5 flex justify-between items-center">
                <StatusBadge value={(overview.fuel_runway_days ?? 81) < 90 ? "WATCH" : "NOMINAL"} />
                <span className="demo-label">MEASURED · RESERVES</span>
              </div>
            </div>

            <div className="metric-card" data-testid="metric-environment">
              <div className="flex justify-between">
                <span className="eyebrow">ENVIRONMENT</span>
                <Activity size={18} />
              </div>
              <div className="metric-value">{overview.ambient_weather.temperature_celsius.toFixed(1)}°C</div>
              <p className="text-xs text-muted-foreground">
                Wind {overview.ambient_weather.wind_speed_knots} kts · Chill {overview.ambient_weather.wind_chill_celsius.toFixed(1)}°C
              </p>
              <div className="mt-5 flex justify-between items-center">
                <StatusBadge value={overview.ambient_weather.wind_speed_knots > 35 ? "CRITICAL" : overview.ambient_weather.wind_speed_knots > 20 ? "WARNING" : "NOMINAL"} />
                <span className="demo-label">{overview.ambient_weather.provenance?.truth_type ?? "MEASURED"} · WEATHER SENSOR</span>
              </div>
            </div>

            <div className="metric-card" data-testid="metric-health">
              <div className="flex justify-between">
                <span className="eyebrow">STATION READINESS</span>
                <ShieldCheck size={18} />
              </div>
              <div className="metric-value">{overview.overall_health_score.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Comms {overview.connectivity_status} · {overview.active_incidents_count} active event(s)
              </p>
              <div className="mt-5 flex justify-between items-center">
                <StatusBadge value={overview.status} />
                <span className="demo-label">DERIVED · ASSESSMENT</span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid xl:grid-cols-[1.55fr_1fr] gap-6 mb-6">
        <Panel
          title="STATION DIGITAL TWIN"
          subtitle="Operational topology and dependency state"
          action={<span className="demo-tag">{overview ? "LIVE TOPOLOGY GRAPH" : "CONNECTING..."}</span>}
        >
          <Topology />
        </Panel>

        <div className="space-y-6">
          <Panel
            title="CRITICAL OPERATIONAL EVENT"
            action={<StatusBadge value={primaryEvent?.severity ?? intel?.severity ?? "CRITICAL"} />}
          >
            <div className="text-lg font-bold mb-4" data-testid="critical-event-title">
              {primaryEvent?.title ?? intel?.headline ?? "G-02 Primary Generator Bearing Deviation"}
            </div>
            <div className="data-list">
              <div>
                <span>Asset Identifier</span>
                <strong>{primaryEvent?.asset_id ?? "G-02"}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{primaryEvent?.location ?? "Powerhouse Generator Bay 2"}</strong>
              </div>
              <div>
                <span>Active Status</span>
                <strong>{primaryEvent?.status ?? "ACTIVE"}</strong>
              </div>
              <div>
                <span>Vibration (RMS)</span>
                <strong>{currentVib.toFixed(2)} mm/s</strong>
              </div>
              <div>
                <span>Operating Load</span>
                <strong>{currentLoad.toFixed(1)}%</strong>
              </div>
              <div>
                <span>Winding Temperature</span>
                <strong>{currentTemp.toFixed(1)}°C</strong>
              </div>
            </div>
            <div className="demo-label my-4">MEASURED TELEMETRY · PROVENANCE ACTIVE</div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/digital-twin" search={{ asset: "power" }}>
                  INSPECT G-02
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/digital-twin" search={{ asset: "power" }}>
                  VIEW DEPENDENCIES
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setExplain(true)} data-testid="open-explanation-btn">
                OPEN EXPLANATION
              </Button>
            </div>
          </Panel>

          <Panel title="G-02 · ASSET INTELLIGENCE">
            <div className="eyebrow mb-3">CURRENT CONDITION</div>
            <div className="vibration">
              <span>VIBRATION</span>
              <div className="vibration-bars">
                {vibBars.map((h: number, i: number) => (
                  <i key={i} style={{ height: h }} />
                ))}
              </div>
              <strong>{currentVib.toFixed(2)} mm/s</strong>
            </div>
            <div className="data-grid">
              <div>
                <span>Vibration Baseline</span>
                <strong>2.80 mm/s</strong>
              </div>
              <div>
                <span>Warning Threshold</span>
                <strong>{vibrationSeries?.warning_threshold ? `${vibrationSeries.warning_threshold.toFixed(2)} mm/s` : "4.50 mm/s"}</strong>
              </div>
              <div>
                <span>Current Value</span>
                <strong>{currentVib.toFixed(2)} mm/s</strong>
              </div>
              <div>
                <span>Active Load</span>
                <strong>{currentLoad.toFixed(1)}%</strong>
              </div>
              <div>
                <span>Winding Temp</span>
                <strong>{currentTemp.toFixed(1)}°C</strong>
              </div>
              <div>
                <span>Provenance</span>
                <strong>{telemetry?.provenance?.truth_type ?? "MEASURED"}</strong>
              </div>
            </div>
            <div className="demo-label mt-4">MEASURED · REAL-TIME SENSORS</div>
          </Panel>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 mb-6">
        <Panel title="INCIDENT TIMELINE">
          <div className="timeline" data-testid="incident-timeline">
            {eventsLoading ? (
              <div className="text-xs text-muted-foreground py-4">Loading operational timeline...</div>
            ) : eventsData?.events && eventsData.events.length > 0 ? (
              eventsData.events.slice(0, 5).map((ev) => (
                <div key={ev.id}>
                  <time>{new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                  <i />
                  <span>
                    <strong>{ev.title}</strong> — {ev.summary}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-4">No recent operational events recorded.</div>
            )}
          </div>
          <div className="demo-label mt-4">MEASURED EVENT STREAM · TIME-SERIES LOGS</div>
        </Panel>

        <Panel
          title="CAUSAL REASONING"
          action={
            <Button variant="ghost" size="icon" onClick={() => setReason(!reason)} aria-label="Toggle causal reasoning">
              {reason ? <ChevronDown /> : <ChevronRight />}
            </Button>
          }
        >
          {reason && (
            <div className="reasoning" data-testid="causal-reasoning-chain">
              {intelLoading ? (
                <div className="text-xs text-muted-foreground py-4">Evaluating causal reasoning chain...</div>
              ) : intel?.causal_chain && intel.causal_chain.length > 0 ? (
                intel.causal_chain.map((c, i) => (
                  <div key={c.stage || i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{c.stage}: {c.title || c.headline}</b>
                      <p>{c.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground py-4">Causal engine offline.</div>
              )}
            </div>
          )}
          <div className="demo-label mt-4">
            {intel?.provenance?.truth_type ?? "DERIVED"} · DETERMINISTIC REASONING ENGINE
          </div>
        </Panel>
      </div>

      <div className="grid xl:grid-cols-[1fr_1.2fr] gap-6 mb-6">
        <Panel title="OPERATIONAL DEPENDENCY MODEL">
          <div className="space-y-3">
            {[
              ["G-02 GENERATOR", "POWER BUS A", "HABITAT & LIFE SUPPORT"],
              ["POWER BUS A", "SCIENCE LAB", "CONTINUOUS DATA LOGGING"],
              ["FUEL STORAGE TANK 1", "BOILER B-01", "THERMAL RUNWAY STABILITY"],
            ].map((row, i) => (
              <div className="dependency-row" key={i}>
                {row.map((x, j) => (
                  <span key={x}>
                    <b>{x}</b>
                    <small>{j === 0 ? "ASSET" : j === 1 ? "SUBSYSTEM" : "OPERATION"}</small>
                    {j < 2 && <ChevronRight />}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="demo-label mt-4">TOPOLOGICAL DEPENDENCY GRAPH (BFS DERIVED)</div>
        </Panel>

        <Panel title="OPERATIONAL RECOMMENDATION">
          <div className="recommendation" data-testid="operational-recommendation">
            <div>
              <span>RECOMMENDED ACTION</span>
              <p>
                {primaryDecision?.title ??
                  "Inspect G-02 operating condition and verify backup generation capacity before further load escalation."}
              </p>
            </div>
            <div>
              <span>RATIONALE</span>
              <p>
                {primaryDecision?.rationale ??
                  intel?.summary ??
                  "Observed deviation may affect available power redundancy under current operating conditions."}
              </p>
            </div>
            <div className="grid grid-cols-2">
              <p>
                <span>CONFIDENCE</span>
                <b>{intel?.provenance?.confidence ? `${Math.round(intel.provenance.confidence * 100)}%` : "87%"}</b>
              </p>
              <p>
                <span>PROVENANCE</span>
                <b>{intel?.provenance?.truth_type ?? "DERIVED"} CAUSAL ENGINE</b>
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button onClick={() => setExplain(true)}>REVIEW DECISION</Button>
            <Button variant="outline" asChild>
              <Link to="/scenarios">VIEW SCENARIO</Link>
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="HUMAN-IN-THE-LOOP CONTROL" className="mb-6">
        <div className="human-flow">
          {["DETECTION", "ANALYSIS", "RECOMMENDATION", "HUMAN REVIEW", "APPROVAL", "ACTION"].map((x, i) => (
            <span key={x} className={x === "HUMAN REVIEW" ? "active" : ""}>
              {x}
              {i < 5 && <ChevronRight />}
            </span>
          ))}
        </div>
        <p className="text-center text-sm mt-5 text-muted-foreground">
          PolarOps provides decision support. <b className="text-foreground">Operational actions require human approval.</b>
        </p>
      </Panel>

      <Panel title="OPERATIONAL ACTIVITY" action={<span className="demo-tag">{eventsData?.simulation_active ? "EVENT STREAM ACTIVE" : "REAL-TIME LOGS"}</span>}>
        <div className="activity-list" data-testid="operational-activity-list">
          {eventsLoading ? (
            <div className="text-xs text-muted-foreground py-3">Loading operational activity...</div>
          ) : eventsData?.events && eventsData.events.length > 0 ? (
            eventsData.events.map((ev) => (
              <div key={ev.id}>
                <time>{new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
                <span>
                  <strong>{ev.title}</strong>: {ev.summary}
                </span>
                <StatusBadge value={ev.severity} />
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground py-3">No activity logs recorded.</div>
          )}
        </div>
      </Panel>

      <ExplanationDrawer open={explain} setOpen={setExplain} domain="ASSET" entityId="G-02" stationId={stationId} />
    </>
  );
}

export { DigitalTwinPage } from "./DigitalTwinPage";

export function StationsPage(){ return <><PageHeader eyebrow="ANTARCTIC OPERATIONS" title="Station Portfolio" subtitle="Operational readiness across Indian Antarctic research stations."/><div className="grid md:grid-cols-2 gap-5">{demoStationData.stations.map((s,i)=><article className="station-card" key={s.name}><div className="station-index">0{i+1}</div><div><span className="eyebrow">INDIAN ANTARCTIC STATION</span><h2>{s.name}</h2><StatusBadge value={s.state}/></div><div className="station-stats">{[["CONNECTIVITY",s.connectivity],["PERSONNEL",s.personnel],["POWER STATE",s.power],["ALERT COUNT",s.alerts]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><Button variant="outline" asChild><Link to="/command-center">OPEN STATION <ChevronRight/></Link></Button></article>)}</div></> }
export function ResourcesPage(){ return <><PageHeader eyebrow="SUPPLY & SUSTAINMENT" title="Resource & Logistics" subtitle="Current station resources, consumption and operational reserves."/><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{demoResources.map(([n,v,s,c,r])=><div className="resource-card" key={n as string}><div className="flex justify-between"><h2>{n}</h2><StatusBadge value={s as string}/></div><div className="resource-number">{v}%</div><div className="resource-track"><i style={{width:`${v}%`}}/></div><div className="grid grid-cols-2 gap-3 mt-5 text-xs"><div><span>CONSUMPTION</span><strong>{c}</strong></div><div><span>RESERVE</span><strong>{r}</strong></div></div><div className="demo-label mt-5">UPDATED 14:30 UTC · DEMO</div></div>)}</div></> }
export function ScenariosPage(){ const [run,setRun]=useState<string|null>(null); return <><PageHeader eyebrow="DECISION SUPPORT" title="Scenario Simulation" subtitle="Explore operational consequences before action. All outcomes are illustrative."/><div className="grid lg:grid-cols-[.9fr_1.1fr] gap-6"><div className="space-y-3">{demoScenarios.map(([n,d,a,r])=><div className={`scenario-item ${run===n?"selected":""}`} key={n}><div><h2>{n}</h2><p>{d}</p><span>AFFECTED · {a}</span></div><StatusBadge value={r}/><Button onClick={()=>setRun(n)}>RUN SCENARIO</Button></div>)}</div><Panel title={run ? `${run} · RESULT` : "SIMULATION OUTPUT"} action={run&&<span className="demo-tag">SIMULATED RESULT · DEMO</span>}>{run?<div className="simulation-result"><BarChart3/><h3>Operational impact</h3><p>Station can maintain essential operations with reduced redundancy for approximately 18 hours.</p><h3>Affected dependencies</h3><p>Power Bus A → Habitat heating → Science cold storage</p><h3>Resource impact</h3><p>Backup fuel consumption increases by an estimated 24%.</p><h3>Recommended mitigation</h3><p>Transfer non-essential loads, verify backup generation, and prepare an operator-approved maintenance window.</p><Button>REVIEW MITIGATION</Button></div>:<div className="empty-state"><Activity/><p>Select a scenario and run the simulation to view its operational impact.</p></div>}</Panel></div></> }
export function ResiliencePage(){ const rows: Array<[string,string,string]>=[["POWER REDUNDANCY","ATTENTION","G-02 anomaly reduces N+1 margin"],["FUEL AUTONOMY","WATCH","81 days at current consumption"],["COMMUNICATIONS","NOMINAL","Primary and secondary links available"],["LIFE SUPPORT","NOMINAL","Environmental systems within limits"],["LOGISTICS","WATCH","Weather window constrained"],["DATA SYNCHRONIZATION","NOMINAL","All priority datasets synchronized"]]; return <><PageHeader eyebrow="OPERATIONAL ASSURANCE" title="Station Resilience" subtitle="Capability-level readiness without reductive composite scoring."/><Panel title="RESILIENCE DOMAINS" subtitle="Evidence-based operational status"><div className="resilience-list">{rows.map(([a,b,c],i)=><div key={a}><span className="index">0{i+1}</span><div><h3>{a}</h3><p>{c}</p></div><StatusBadge value={b}/><div className="resilience-bars">{[1,2,3,4,5].map(x=><i className={x<(b==="NOMINAL"?5:b==="WATCH"?4:3)?"on":""} key={x}/>)}</div></div>)}</div></Panel></> }
export function AlertsPage(){ const [filter,setFilter]=useState("ALL"); const [reviewed,setReviewed]=useState<number[]>([]); return <><PageHeader eyebrow="EVENT MANAGEMENT" title="Operational Alerts" subtitle="Prioritized conditions requiring awareness or operator review."/><div className="flex gap-2 mb-5">{["ALL","CRITICAL","WARNING","INFO"].map(f=><Button key={f} variant={filter===f?"default":"outline"} onClick={()=>setFilter(f)}>{f}</Button>)}</div><div className="space-y-3">{demoAlerts.filter(a=>filter==="ALL"||a.level===filter).map(a=><div className={`alert-row ${reviewed.includes(a.id)?"reviewed":""}`} key={a.id}><AlertTriangle/><div><StatusBadge value={a.level}/><h2>{a.text}</h2><span>{a.time} · DEMO DATA</span></div><Button variant="outline" disabled={reviewed.includes(a.id)} onClick={()=>setReviewed([...reviewed,a.id])}><ClipboardCheck/>{reviewed.includes(a.id)?"REVIEWED":"MARK AS REVIEWED"}</Button></div>)}</div></> }
export function ReportsPage(){ const [msg,setMsg]=useState(""); return <><PageHeader eyebrow="MISSION RECORD" title="Operational Reports" subtitle="Review and export station status, incident and simulation records."/>{msg&&<div className="notice mb-4">{msg}</div>}<div className="grid md:grid-cols-2 gap-4">{demoReports.map((r,i)=><div className="report-card" key={r}><div className="report-icon"><FileText/></div><div><span>REPORT · 0{i+1}</span><h2>{r}</h2><p>Generated from synchronized demo operational data.</p></div><div className="flex gap-2"><Button variant="outline" onClick={()=>setMsg(`${r} opened in demo preview.`)}>VIEW</Button><Button onClick={()=>setMsg(`${r} export prepared for demonstration.`)}><Download/> EXPORT</Button></div></div>)}</div></> }
export function OfflinePage(){
 const {mode,setMode}=useContext(OperationsContext); const [sync,setSync]=useState("IDLE"); const offline=mode==="offline";
 const reconnect=()=>{setSync("RECONNECTING"); window.setTimeout(()=>setSync("SYNC IN PROGRESS"),700); window.setTimeout(()=>setSync("SYNC COMPLETE"),1500); window.setTimeout(()=>{setMode("online");setSync("EVENTS RECONCILED")},2300)};
 return <><PageHeader eyebrow="RESILIENT LOCAL-FIRST OPERATIONS" title="Offline Analog" subtitle="The station operational picture remains available when external connectivity is unavailable." status={offline?"LOCAL OPERATION ACTIVE":"ONLINE DEMO"}/><div className="offline-principle"><CloudOff/><span>CONNECTIVITY LOSS</span><b>DOES NOT EQUAL</b><span>OPERATIONAL CONTEXT LOSS</span></div><div className="grid xl:grid-cols-[1.35fr_1fr] gap-6 mb-6"><Panel title="LOCAL TWIN STATE" subtitle={`LAST SYNCHRONIZED · ${demoOfflineState.lastSynchronized}`} action={<span className="demo-tag">{offline?"LOCAL SNAPSHOT · CACHED":"ONLINE DEMO"}</span>}><Topology/><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">{["LOCAL SNAPSHOT","CACHED","DERIVED","PENDING SYNC"].map(x=><div className="provenance-cell" key={x}>{x}</div>)}</div></Panel><div className="space-y-6"><Panel title="OPERATING MODE"><div className="mode-switch"><Button variant={!offline?"default":"outline"} onClick={()=>setMode("online")}>ONLINE DEMO</Button><Button variant={offline?"default":"outline"} onClick={()=>setMode("offline")}><CloudOff/> ENTER OFFLINE MODE</Button></div><p className="text-sm text-muted-foreground mt-4">Local inspection, scenarios, alerts, resources, reasoning and recommendations remain available.</p></Panel><Panel title="STORE & FORWARD"><div className="store-grid">{[["LOCAL EVENTS",demoOfflineState.localEvents],["PENDING SYNC",demoOfflineState.pendingSync],["LAST ACKNOWLEDGED",demoOfflineState.lastAcknowledged],["NEXT SYNC",demoOfflineState.nextSync]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>{offline?<Button className="w-full mt-5" onClick={reconnect} disabled={sync!=="IDLE"}><RefreshCw className={sync.includes("SYNC IN")?"animate-spin":""}/>{sync==="IDLE"?"RECONNECT & SYNCHRONIZE":sync}</Button>:<div className="notice mt-5">{sync==="EVENTS RECONCILED"?"EVENTS RECONCILED · 3  |  ACKNOWLEDGED · 3":"Connectivity available · synchronized"}</div>}</Panel></div></div><Panel title="PENDING SYNC" subtitle="Priority local event queue"><div className="sync-queue">{demoSyncQueue.map(item=><div key={item.id}><span className="queue-index">0{item.id}</span><div><h3>{item.event}</h3><p>{item.priority} PRIORITY · LOCAL EVENT</p></div><StatusBadge value={offline?item.state:"ACKNOWLEDGED"}/></div>)}</div></Panel><Panel title="RESILIENCE PATH" className="mt-6"><div className="operator-flow">{["LOCAL TWIN STATE","LOCAL STORE","PRIORITY QUEUE","STORE & FORWARD","SYNC","ACK / RECONCILE"].map((x,i)=><span key={x}>{x}{i<5&&<ArrowRight/>}</span>)}</div></Panel></>;
}
export function SettingsPage(){ const {dark,toggle}=useContext(ThemeContext); const {mode,setMode}=useContext(OperationsContext); const [critical,setCritical]=useState(true),[warnings,setWarnings]=useState(true),[system,setSystem]=useState(false); return <><PageHeader eyebrow="POLAROPS CONFIGURATION" title="System Settings" subtitle="Configure this local operational demonstration environment."/><div className="grid xl:grid-cols-2 gap-6"><Panel title="APPEARANCE"><SettingRow title="Dark operations theme" detail="Use Antarctic night operations colors"><Switch checked={dark} onCheckedChange={toggle} aria-label="Dark operations theme"/></SettingRow></Panel><Panel title="OPERATIONS"><SettingRow title="Offline Analog" detail="Continue from a local station snapshot"><Switch checked={mode==="offline"} onCheckedChange={(checked)=>setMode(checked?"offline":"online")} aria-label="Offline Analog"/></SettingRow><SelectRow title="Station" options={["BHARATI","MAITRI"]}/><SelectRow title="Default view" options={["Command Center","Digital Twin","Alerts"]}/><SelectRow title="Refresh interval" options={["30 seconds","1 minute","5 minutes"]}/></Panel><Panel title="NOTIFICATIONS"><SettingRow title="Critical alerts" detail="Conditions requiring immediate review"><Switch checked={critical} onCheckedChange={setCritical}/></SettingRow><SettingRow title="Warnings" detail="Emerging operational conditions"><Switch checked={warnings} onCheckedChange={setWarnings}/></SettingRow><SettingRow title="System notifications" detail="Synchronization and maintenance events"><Switch checked={system} onCheckedChange={setSystem}/></SettingRow></Panel><Panel title="SYSTEM"><SettingRow title="Demo mode" detail="Centralized local demonstration data"><StatusBadge value="ACTIVE"/></SettingRow><SettingRow title="Data provenance" detail="Measured, derived and illustrative labels"><Button variant="outline">VIEW</Button></SettingRow><SettingRow title="About PolarOps" detail="AODT · Smart India Hackathon 2026"><span className="font-mono text-xs">v0.1.0</span></SettingRow></Panel></div></> }
function SettingRow({title,detail,children}:{title:string;detail:string;children:ReactNode}){return <div className="setting-row"><div><h3>{title}</h3><p>{detail}</p></div>{children}</div>}; function SelectRow({title,options}:{title:string;options:string[]}){return <div className="setting-row"><label>{title}</label><select aria-label={title}>{options.map(o=><option key={o}>{o}</option>)}</select></div>}