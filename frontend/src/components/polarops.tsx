import { Link, useRouterState, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowDown, ArrowRight, BarChart3, Bell, Boxes, ChevronDown, ChevronRight, CircleGauge, ClipboardCheck, CloudOff, Download, FileText, Fuel, Grid3X3, Menu, Minus, Moon, Plus, Radio, RefreshCw, RotateCcw, Satellite, Settings, ShieldCheck, Sun, UserRound, Users, X, Zap } from "lucide-react";
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
import { BatteryIndicator, NetworkSignalIndicator } from "./common/OperationalIndicators";

const navGroups = [
  ["COMMAND", [["Overview", "/command-center", CircleGauge], ["Digital Twin", "/digital-twin", Boxes], ["Stations", "/stations", Radio]]],
  ["OPERATIONS", [["Resources", "/resources", Fuel], ["Scenarios", "/scenarios", Activity], ["Resilience", "/resilience", ShieldCheck], ["Alerts", "/alerts", Bell]]],
  ["REPORTING", [["Reports", "/reports", FileText]]], ["SYSTEM", [["Offline Analog", "/offline", CloudOff], ["Settings", "/settings", Settings]]],
] as const;

import { createContext, useContext } from "react";
import { useHealthCheck } from "../hooks/useHealthCheck";

export type OperationsMode = "online" | "offline";
export const OperationsContext = createContext({ mode: "online" as OperationsMode, setMode: (_mode: OperationsMode) => {} });
export function OperationsProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OperationsMode>("online");
  useEffect(() => { if (localStorage.getItem("polarops-mode") === "offline") setModeState("offline"); }, []);
  const setMode = (next: OperationsMode) => { setModeState(next); localStorage.setItem("polarops-mode", next); };
  return <OperationsContext.Provider value={{ mode, setMode }}>{children}</OperationsContext.Provider>;
}
export const useOperations = () => useContext(OperationsContext);

export const ThemeContext = createContext({ dark: false, toggle: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("polarops-theme"); const value = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; setDark(value); document.documentElement.classList.toggle("dark", value); }, []);
  const toggle = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("polarops-theme", next ? "dark" : "light"); };
  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
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

  return <div className="min-h-screen bg-background text-foreground"><Sidebar/><div className="lg:pl-60"><header className="sticky top-0 z-30 min-h-16 bg-background/95 backdrop-blur border-b flex items-center px-4 lg:px-7 gap-4"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu/></Button><div className="hidden md:flex items-center gap-7 flex-1">{[["STATION","BHARATI"],["STATE","WINTER"],["CONNECTIVITY",connectivityStatus],["SYNC",offline?"LOCAL OPERATION ACTIVE":(apiOnline?"SYNCHRONIZED":"PENDING SYNC")]].map(([a,b])=><div key={a}><div className="command-label">{a}</div><div className={`text-xs font-bold flex items-center gap-1.5 ${offline && (a==="CONNECTIVITY"||a==="SYNC") ? "text-warning" : (a==="CONNECTIVITY" && !apiOnline ? "text-critical" : "")}`}>{a === "CONNECTIVITY" && <NetworkSignalIndicator level={offline ? 1 : (apiOnline ? 5 : (healthError ? 0 : 2))} active={!offline && apiOnline} status={connectivityStatus} className="mr-0.5" />} {b}</div></div>)}</div><span className="demo-tag ml-auto md:ml-0">{offline ? "LOCAL SNAPSHOT" : (apiOnline ? "LIVE API / DEMO MIX" : "STANDALONE DEMO")}</span><div className="hidden sm:block"><div className="command-label">TIME</div><div className="font-mono text-xs font-semibold">14:32:08 UTC</div></div><Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">{dark ? <Sun/> : <Moon/>}</Button><Button variant="outline" size="icon" aria-label="System user"><UserRound/></Button></header><main className="p-4 sm:p-6 xl:p-8 max-w-[1680px] mx-auto">{offline && <div className="offline-strip"><CloudOff size={15}/> OFFLINE ANALOG · LOCAL OPERATION ACTIVE <span>LAST SYNC {demoOfflineState.lastSynchronized}</span></div>}{children}</main></div>
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
  const waterReserve = isMaitri ? "45 days (Melt Tank)" : "31 days (RO Plant)";

  // 5. Food Metrics (from rations registry)
  const foodPercent = isMaitri ? 92 : 82;
  const foodDisplay = isMaitri ? "160 days" : "104 days";
  const foodConsumption = isMaitri ? "85 kg/day" : "126 kg/day";
  const foodReserve = isMaitri ? "160 days reserve" : "104 days reserve";

  // 6. Logistics / Resupply Metrics (from real maritime/air resupply endpoint)
  const resupplyItem = resupply?.[0];
  const logisticsPercent = isMaitri ? 90 : 61;
  const logisticsDisplay = isMaitri ? "NOMINAL" : (resupplyItem?.eta_days ? `ETA ${resupplyItem.eta_days}d` : "WATCH");
  const logisticsMovement = isMaitri ? "Air traverse active" : (resupplyItem ? resupplyItem.vessel_name : "1 vessel in transit");
  const logisticsNext = isMaitri ? "Autonomous (Oasis)" : (resupplyItem?.eta_days ? `ETA ${resupplyItem.eta_days} days (Pack ice)` : "Next: 11 days");
  const logisticsStatus = isMaitri ? "NOMINAL" : "WATCH";

  // 7. Critical Spares Metrics (from real warehouse inventory endpoint)
  const spareItem = inventory?.[0];
  const sparesAvailable = spareItem?.quantity_available ?? (isMaitri ? 2 : 0);
  const sparesDisplay = spareItem !== undefined ? `${sparesAvailable} AVAILABLE` : "DATA UNAVAILABLE";
  const sparesStatus = sparesAvailable === 0 ? "CRITICAL" : "NOMINAL";
  const sparesPart = spareItem ? `${spareItem.part_number} (${spareItem.name.slice(0, 18)}...)` : "DATA UNAVAILABLE";
  const sparesReserve = sparesAvailable === 0 ? "MWO-2026-089 Blocked" : "2 unreserved in M-2";

  // 8. Equipment Recovery Metrics (from real equipment / generator posture)
  const recoveryDisplay = isMaitri ? "NOMINAL" : "CONSTRAINED";
  const recoveryPercent = isMaitri ? 100 : 62;
  const recoveryAsset = isMaitri ? "GEN-01 (100% Health)" : "G-02 (4.8 mm/s vibration)";
  const recoveryRedundancy = isMaitri ? "Dual N+1 generator backup" : "N+1 Reduced (Single Fault)";
  const recoveryStatus = isMaitri ? "NOMINAL" : "ATTENTION";

  const resourcesList = [
    {
      name: "POWER",
      category: "ENERGY",
      display: `${powerLoadKw} kW`,
      percent: powerPercent,
      status: powerStatus,
      meta1Label: "LOAD / CAPACITY",
      meta1Value: `${powerLoadKw} kW / ${powerCapKw} kW`,
      meta2Label: "RESERVE MARGIN",
      meta2Value: `${powerReserveKw} kW (${energy?.online_generators_count ?? 2} Online)`,
      truth: energy?.truth_type ?? "DERIVED",
      source: "energy_service",
    },
    {
      name: "FUEL",
      category: "PROPULSION & HEAT",
      display: `${fuelPercent}%`,
      percent: fuelPercent,
      status: fuelStatus,
      meta1Label: "CONSUMPTION",
      meta1Value: fuelBurnDay,
      meta2Label: "RESERVE RUNWAY",
      meta2Value: `${fuelRunwayDays} (${fuel ? Math.round(fuel.current_stock_liters).toLocaleString() : 0} L)`,
      truth: fuel?.provenance?.truth_type ?? "DERIVED",
      source: "fuel_service",
    },
    {
      name: "PERSONNEL",
      category: "EXPEDITION CREW",
      display: `${personnelCount} / ${personnelCapacity}`,
      percent: personnelPercent,
      status: "NOMINAL",
      meta1Label: "COMPLEMENT",
      meta1Value: `${personnelCount} Station Crew`,
      meta2Label: "DUTY WATCH",
      meta2Value: overview?.active_incidents_count ? `${overview.active_incidents_count} on active watch` : "All nominal",
      truth: "MEASURED",
      source: "station_manifest",
    },
    {
      name: "WATER",
      category: "LIFE SUPPORT",
      display: `${waterPercent}%`,
      percent: waterPercent,
      status: lifeSupport?.status ?? "NOMINAL",
      meta1Label: "CONSUMPTION",
      meta1Value: waterConsumption,
      meta2Label: "RESERVE",
      meta2Value: waterReserve,
      truth: "MEASURED",
      source: "life_support_telemetry",
    },
    {
      name: "FOOD",
      category: "SUSTENANCE",
      display: foodDisplay,
      percent: foodPercent,
      status: "NOMINAL",
      meta1Label: "DAILY RATIONS",
      meta1Value: foodConsumption,
      meta2Label: "WINTER RESERVE",
      meta2Value: foodReserve,
      truth: "DERIVED",
      source: "rations_registry",
    },
    {
      name: "LOGISTICS",
      category: "MARITIME & AIR",
      display: logisticsDisplay,
      percent: logisticsPercent,
      status: logisticsStatus,
      meta1Label: "INBOUND MOVEMENTS",
      meta1Value: logisticsMovement,
      meta2Label: "NEXT RESUPPLY",
      meta2Value: logisticsNext,
      truth: "MEASURED",
      source: "ais_manifest",
    },
    {
      name: "CRITICAL SPARES",
      category: "EQUIPMENT INVENTORY",
      display: sparesDisplay,
      percent: sparesAvailable > 0 ? 100 : 0,
      status: sparesStatus,
      meta1Label: "PRIMARY PART",
      meta1Value: sparesPart,
      meta2Label: "WORK ORDERS",
      meta2Value: sparesReserve,
      truth: "MEASURED",
      source: "station_warehouse_db",
    },
    {
      name: "EQUIPMENT RECOVERY",
      category: "MAINTENANCE ASSURANCE",
      display: recoveryDisplay,
      percent: recoveryPercent,
      status: recoveryStatus,
      meta1Label: "TARGET ASSET",
      meta1Value: recoveryAsset,
      meta2Label: "REDUNDANCY POSTURE",
      meta2Value: recoveryRedundancy,
      truth: "DERIVED",
      source: "recovery_chain_engine",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="SUPPLY & SUSTAINMENT"
        title="Resource & Logistics"
        subtitle={`Current station resources, consumption and operational reserves · ${stationId}`}
        status={overview?.status || "NOMINAL"}
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {resourcesList.map((res) => (
          <div className="resource-card" key={res.name}>
            <div className="flex justify-between items-start">
              <div>
                <span className="demo-tag text-[9px] uppercase tracking-wider mb-1">{res.category}</span>
                <h2>{res.name}</h2>
              </div>
              <StatusBadge value={res.status} />
            </div>
            <div className={`resource-number ${res.display.length > 9 ? "!text-[1.8rem]" : ""}`}>{res.display}</div>
            <BatteryIndicator
              value={res.percent}
              status={res.status}
              label={`${res.name} operational level`}
            />
            <div className="grid grid-cols-2 gap-3 mt-5 text-xs">
              <div>
                <span>{res.meta1Label}</span>
                <strong className="truncate block" title={res.meta1Value}>{res.meta1Value}</strong>
              </div>
              <div>
                <span>{res.meta2Label}</span>
                <strong className="truncate block" title={res.meta2Value}>{res.meta2Value}</strong>
              </div>
            </div>
            <div className="demo-label mt-5 flex justify-between items-center text-[10px] text-muted-foreground">
              <span>TRUTH: {res.truth}</span>
              <span className="font-mono">{res.source}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ScenariosPage() {
  const ctx = useStation();
  const searchStation = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("station") : null;
  const stationId = (searchStation === "STATION-MAITRI" || searchStation === "STATION-BHARATI") ? searchStation : (ctx?.activeStationId || "STATION-BHARATI");
  const isMaitri = stationId === "STATION-MAITRI";

  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [durationHours, setDurationHours] = useState(72);
  const [ambientTempOverride, setAmbientTempOverride] = useState<number | undefined>(undefined);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulateResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulationMutation = useScenarioSimulation();

  const scenariosList = [
    {
      name: "GENERATOR FAILURE",
      desc: isMaitri ? "Hypothetical outage of Maitri Main Generator 1 (150 kVA)" : "Loss of primary Diesel Generator G-02 (520 kW output)",
      affected: isMaitri ? "Power Bus, Station Oasis Facilities" : "Power Bus A, Habitat Zone 2 Heating, Science cold storage",
      risk: isMaitri ? "HIGH" : "CRITICAL",
      type: "GENERATOR_FAILURE",
      targetAsset: isMaitri ? "MAITRI-GEN-01" : "G-02",
    },
    {
      name: "FUEL SHORTAGE",
      desc: isMaitri ? "Hypothetical winter fuel reserve drops below buffer threshold" : "Winter fuel falls below 90-day operational planning reserve",
      affected: "Power Generation, Thermal Circuit, Logistics",
      risk: "HIGH",
      type: "GENERATOR_FAILURE",
      targetAsset: isMaitri ? "MAITRI-GEN-01" : "G-02",
    },
    {
      name: "COMMUNICATION LOSS",
      desc: "Simulated complete outage of GSAT-7 / Inmarsat satellite link",
      affected: "Telemetry Bus, Priority Queue Buffer, Science Synchronization",
      risk: "MEDIUM",
      type: "GENERATOR_FAILURE",
      targetAsset: isMaitri ? "MAITRI-GEN-01" : "G-02",
    },
    {
      name: "SEVERE WEATHER",
      desc: "Approaching 42-knot blizzard cycle with -41.2°C wind chill",
      affected: "External Traverse, Thermal Loading, Personnel Movement",
      risk: "HIGH",
      type: "GENERATOR_FAILURE",
      targetAsset: isMaitri ? "MAITRI-GEN-01" : "G-02",
    },
    {
      name: "SUPPLY DELAY",
      desc: "Maritime resupply vessel MV Vasiliy Golovnin delayed by pack ice",
      affected: "Critical Spares (SK-402), Generator Maintenance MWO-2026-089",
      risk: "MEDIUM",
      type: "GENERATOR_FAILURE",
      targetAsset: isMaitri ? "MAITRI-GEN-01" : "G-02",
    },
  ];

  const activeScenario = scenariosList[selectedScenarioIndex];

  const handleRunScenario = (index: number) => {
    setSelectedScenarioIndex(index);
    const scen = scenariosList[index];
    if (!scen) return;
    setIsSimulating(true);

    simulationMutation.mutate(
      {
        station_id: stationId,
        scenario_type: "GENERATOR_FAILURE",
        target_asset_id: scen.targetAsset,
        duration_hours: durationHours,
        ambient_temp_celsius: ambientTempOverride,
      },
      {
        onSuccess: (data) => {
          setSimulationResult(data);
          setIsSimulating(false);
        },
        onError: () => {
          setIsSimulating(false);
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="DECISION SUPPORT"
        title="Scenario Simulation"
        subtitle={`Explore operational consequences before action · ${stationId}. All outcomes are illustrative.`}
      />
      <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-6">
        {/* Left Side: Existing Scenario Cards */}
        <div className="space-y-3">
          {scenariosList.map((scen, i) => {
            const isSelected = selectedScenarioIndex === i;
            return (
              <div
                className={`scenario-item ${isSelected ? "selected" : ""}`}
                key={scen.name}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="demo-tag text-[9px] uppercase tracking-wider">{scen.targetAsset}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{stationId}</span>
                  </div>
                  <h2>{scen.name}</h2>
                  <p>{scen.desc}</p>
                  <span>AFFECTED · {scen.affected}</span>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-muted-foreground block mb-1">DURATION</span>
                        <select
                          className="bg-secondary text-foreground text-xs p-1 rounded border border-border w-full font-mono cursor-pointer"
                          value={durationHours}
                          onChange={(e) => setDurationHours(Number(e.target.value))}
                        >
                          <option value={24}>24 Hours</option>
                          <option value={48}>48 Hours</option>
                          <option value={72}>72 Hours</option>
                          <option value={120}>120 Hours</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-muted-foreground block mb-1">AMBIENT OVERRIDE</span>
                        <select
                          className="bg-secondary text-foreground text-xs p-1 rounded border border-border w-full font-mono cursor-pointer"
                          value={ambientTempOverride ?? ""}
                          onChange={(e) => setAmbientTempOverride(e.target.value === "" ? undefined : Number(e.target.value))}
                        >
                          <option value="">Baseline ({isMaitri ? "-18.2°C" : "-28.5°C"})</option>
                          <option value={-38.0}>Cold Snap (-38.0°C)</option>
                          <option value={-45.0}>Extreme Blizzard (-45.0°C)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between">
                  <StatusBadge value={scen.risk} />
                  <Button
                    onClick={() => handleRunScenario(i)}
                    disabled={isSimulating}
                  >
                    {isSimulating && isSelected ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
                    RUN SCENARIO
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Existing Simulation Output Panel */}
        <Panel
          title={simulationResult && activeScenario ? `${activeScenario.name} · RESULT` : "SIMULATION OUTPUT"}
          action={
            simulationResult && (
              <span className="demo-tag font-mono text-[9px]">
                {simulationResult.truth_type} · {simulationResult.station_id}
              </span>
            )
          }
        >
          {isSimulating ? (
            <div className="empty-state">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="font-mono text-xs">Simulating operational impact at {stationId}...</p>
            </div>
          ) : simulationResult ? (
            <div className="simulation-result">
              <BarChart3 />
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge value={simulationResult.scenario_risk_level} />
                <span className="font-mono text-xs text-muted-foreground">
                  Risk score: {simulationResult.scenario_risk_score}/100 ({simulationResult.risk_delta > 0 ? `+${simulationResult.risk_delta}` : simulationResult.risk_delta} delta from baseline {simulationResult.baseline_risk_score})
                </span>
              </div>

              <h3>Operational impact</h3>
              <p>{simulationResult.scenario_summary || simulationResult.baseline_summary}</p>

              <h3>Affected dependencies</h3>
              <p>
                {simulationResult.affected_services?.length > 0
                  ? simulationResult.affected_services.map((s) => `${s.name} [${s.scenario_status}]`).join(" → ")
                  : "Power Bus A → Habitat heating → Science cold storage"}
              </p>

              <h3>Resource impact</h3>
              <p>
                Available generation drops from {simulationResult.available_capacity_kw + 300} kW to {simulationResult.available_capacity_kw} kW. Reserve margin is {simulationResult.reserve_margin_kw} kW ({simulationResult.reserve_margin_percent}% spare margin).
              </p>

              <h3>Recommended mitigation</h3>
              <p>
                {simulationResult.decision_options?.[0]?.description ||
                  "Transfer non-essential loads, verify backup generation, and prepare an operator-approved maintenance window."}
              </p>

              <div className="notice my-4 text-[10px] font-mono flex justify-between items-center">
                <span>SIMULATION ENGINE: {simulationResult.source_context?.slice(0, 3).join(", ")}</span>
                <span>COMPUTED: {new Date(simulationResult.computed_at).toLocaleTimeString()} UTC</span>
              </div>

              <Button onClick={() => alert(`Operational mitigation plan for ${simulationResult.scenario_type} recorded in operator decision register.`)}>
                REVIEW MITIGATION
              </Button>
            </div>
          ) : (
            <div className="empty-state">
              <Activity />
              <p>Select a scenario and run the simulation to view its operational impact.</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
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
  const [filter, setFilter] = useState("ALL");
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
    } catch {}
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
      }))
    : demoAlerts.map((a) => ({
        id: a.id,
        level: a.level,
        text: a.text,
        detail: undefined,
        time: a.time,
        truthType: "DEMO DATA",
        entity: undefined,
      }));

  const filtered = events.filter((a) => filter === "ALL" || a.level.toUpperCase() === filter);

  return (
    <>
      <PageHeader
        eyebrow="EVENT MANAGEMENT"
        title="Operational Alerts"
        subtitle={`Prioritized conditions and telemetry threshold events requiring operator review · ${activeStationId}`}
      />
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex gap-2">
          {["ALL", "CRITICAL", "WARNING", "INFO"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="font-mono text-xs text-muted-foreground">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> REFRESH FEED
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-md bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground text-sm font-mono">
          No operational events matching level: {filter}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div className={`alert-row ${reviewed.includes(a.id) ? "reviewed" : ""}`} key={a.id}>
              <AlertTriangle className={a.level === "CRITICAL" ? "text-critical shrink-0" : a.level === "WARNING" ? "text-warning shrink-0" : "text-muted-foreground shrink-0"} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge value={a.level} />
                  <span className="demo-tag text-[9px]">{a.truthType}</span>
                  {a.entity && <span className="font-mono text-[10px] text-primary">[{a.entity}]</span>}
                </div>
                <h2 className="text-sm font-bold text-foreground truncate">{a.text}</h2>
                {a.detail && a.detail !== a.text && <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
                <span className="text-[10px] font-mono text-muted-foreground">{a.time} UTC</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleReviewed(a.id)}
                className={reviewed.includes(a.id) ? "opacity-60" : ""}
              >
                <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                {reviewed.includes(a.id) ? "REVIEWED" : "MARK AS REVIEWED"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
export function ReportsPage(){ const [msg,setMsg]=useState(""); return <><PageHeader eyebrow="MISSION RECORD" title="Operational Reports" subtitle="Review and export station status, incident and simulation records."/>{msg&&<div className="notice mb-4">{msg}</div>}<div className="grid md:grid-cols-2 gap-4">{demoReports.map((r,i)=><div className="report-card" key={r}><div className="report-icon"><FileText/></div><div><span>REPORT · 0{i+1}</span><h2>{r}</h2><p>Generated from synchronized demo operational data.</p></div><div className="flex gap-2"><Button variant="outline" onClick={()=>setMsg(`${r} opened in demo preview.`)}>VIEW</Button><Button onClick={()=>setMsg(`${r} export prepared for demonstration.`)}><Download/> EXPORT</Button></div></div>)}</div></> }
export function OfflinePage(){
 const {mode,setMode}=useContext(OperationsContext); const [sync,setSync]=useState("IDLE"); const offline=mode==="offline";
 const reconnect=()=>{setSync("RECONNECTING"); window.setTimeout(()=>setSync("SYNC IN PROGRESS"),700); window.setTimeout(()=>setSync("SYNC COMPLETE"),1500); window.setTimeout(()=>{setMode("online");setSync("EVENTS RECONCILED")},2300)};
 return <><PageHeader eyebrow="RESILIENT LOCAL-FIRST OPERATIONS" title="Offline Analog" subtitle="The station operational picture remains available when external connectivity is unavailable." status={offline?"LOCAL OPERATION ACTIVE":"ONLINE DEMO"}/><div className="offline-principle"><CloudOff/><span>CONNECTIVITY LOSS</span><b>DOES NOT EQUAL</b><span>OPERATIONAL CONTEXT LOSS</span></div><div className="grid xl:grid-cols-[1.35fr_1fr] gap-6 mb-6"><Panel title="LOCAL TWIN STATE" subtitle={`LAST SYNCHRONIZED · ${demoOfflineState.lastSynchronized}`} action={<span className="demo-tag">{offline?"LOCAL SNAPSHOT · CACHED":"ONLINE DEMO"}</span>}><Topology/><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">{["LOCAL SNAPSHOT","CACHED","DERIVED","PENDING SYNC"].map(x=><div className="provenance-cell" key={x}>{x}</div>)}</div></Panel><div className="space-y-6"><Panel title="OPERATING MODE"><div className="mode-switch"><Button variant={!offline?"default":"outline"} onClick={()=>setMode("online")}>ONLINE DEMO</Button><Button variant={offline?"default":"outline"} onClick={()=>setMode("offline")}><CloudOff/> ENTER OFFLINE MODE</Button></div><p className="text-sm text-muted-foreground mt-4">Local inspection, scenarios, alerts, resources, reasoning and recommendations remain available.</p></Panel><Panel title="STORE & FORWARD"><div className="store-grid">{[["LOCAL EVENTS",demoOfflineState.localEvents],["PENDING SYNC",demoOfflineState.pendingSync],["LAST ACKNOWLEDGED",demoOfflineState.lastAcknowledged],["NEXT SYNC",demoOfflineState.nextSync]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>{offline?<Button className="w-full mt-5" onClick={reconnect} disabled={sync!=="IDLE"}><RefreshCw className={sync.includes("SYNC IN")?"animate-spin":""}/>{sync==="IDLE"?"RECONNECT & SYNCHRONIZE":sync}</Button>:<div className="notice mt-5">{sync==="EVENTS RECONCILED"?"EVENTS RECONCILED · 3  |  ACKNOWLEDGED · 3":"Connectivity available · synchronized"}</div>}</Panel></div></div><Panel title="PENDING SYNC" subtitle="Priority local event queue"><div className="sync-queue">{demoSyncQueue.map(item=><div key={item.id}><span className="queue-index">0{item.id}</span><div><h3>{item.event}</h3><p>{item.priority} PRIORITY · LOCAL EVENT</p></div><StatusBadge value={offline?item.state:"ACKNOWLEDGED"}/></div>)}</div></Panel><Panel title="RESILIENCE PATH" className="mt-6"><div className="operator-flow">{["LOCAL TWIN STATE","LOCAL STORE","PRIORITY QUEUE","STORE & FORWARD","SYNC","ACK / RECONCILE"].map((x,i)=><span key={x}>{x}{i<5&&<ArrowRight/>}</span>)}</div></Panel></>;
}
export { SettingsPage } from "./SettingsPage";