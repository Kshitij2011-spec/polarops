import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Radio,
  Fuel,
  Activity,
  ShieldCheck,
  Eye,
  GitFork,
  CheckCircle2,
  Satellite,
  Compass,
  Zap,
  Menu,
  X,
  Sun,
  Moon,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/components/polarops";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Pulsing live status dot with calm tactical animation                        */
/* ─────────────────────────────────────────────────────────────────────────── */
function LiveDot({ color = "bg-emerald-500 dark:bg-emerald-400" }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 motion-reduce:hidden ${color}`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Count-Up Stat with Guaranteed DOM Default Value (No-Zero Flash Architecture) */
/* ─────────────────────────────────────────────────────────────────────────── */
function StatCounter({ target, label }: { target: string; label: string }) {
  const [displayVal, setDisplayVal] = useState(target);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const match = target.match(/^(\d+)(.*)$/);
          if (match && typeof match[1] === "string") {
            const endNum = parseInt(match[1], 10);
            const suffix = match[2] ?? "";
            const startTime = performance.now();
            const duration = 650;
            const startNum = Math.max(0, Math.floor(endNum * 0.35));

            const updateCount = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(1, elapsed / duration);
              // Ease-out quad
              const easeOut = 1 - (1 - progress) * (1 - progress);
              const current = Math.floor(startNum + (endNum - startNum) * easeOut);
              setDisplayVal(`${current}${suffix}`);

              if (progress < 1) {
                requestAnimationFrame(updateCount);
              } else {
                setDisplayVal(target);
              }
            };
            requestAnimationFrame(updateCount);
          }
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={elementRef} className="space-y-1">
      <div className="text-2xl sm:text-3xl font-black text-[#0E7490] dark:text-sky-400 font-mono tabular-nums transition-transform duration-200">
        {displayVal}
      </div>
      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Connected Workflow Pipeline with Viewport Sequential Illumination          */
/* ─────────────────────────────────────────────────────────────────────────── */
function WorkflowPipeline() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedOnce = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !animatedOnce.current) {
          animatedOnce.current = true;
          const steps = [0, 1, 2, 3, 4];
          steps.forEach((stepIdx) => {
            setTimeout(() => {
              setActiveStep(stepIdx);
            }, stepIdx * 280);
          });
          setTimeout(() => {
            setActiveStep(null);
          }, steps.length * 280 + 750);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const pipelineStages = [
    { step: "01", phase: "Telemetry", name: "OBSERVE", desc: "Raw sensor feeds from vibration transducers, fuel gauges, and electrical buses." },
    { step: "02", phase: "State", name: "UNDERSTAND", desc: "5-stage degradation ladder classifies equipment health from Nominal to Critical." },
    { step: "03", phase: "Graph", name: "TRACE IMPACT", desc: "BFS dependency engine traverses physical topology to identify threatened life support." },
    { step: "04", phase: "Engine", name: "SIMULATE", desc: "Deterministic thermodynamic & load calculation engines test 24h–72h horizons." },
    { step: "05", phase: "Action", name: "DECIDE", desc: "Human commander reviews vetted countermeasures and authorizes emergency dispatch." },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Connected dynamic track line behind cards (desktop) */}
      <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 -translate-y-5 bg-gradient-to-r from-sky-400/25 via-sky-500/50 to-sky-400/25 dark:from-sky-500/20 dark:via-sky-400/50 dark:to-sky-500/20 animate-line-signal z-0" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        {pipelineStages.map(({ step, phase, name, desc }, idx) => {
          const isIlluminated = activeStep === idx;
          return (
            <div
              key={step}
              className={`p-5 rounded-xl border transition-all duration-200 relative group cursor-default ${
                isIlluminated
                  ? "border-sky-500 shadow-md ring-1 ring-sky-500/40 -translate-y-0.5 bg-white dark:bg-slate-900/95"
                  : "border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#080D18] hover:border-sky-400 dark:hover:border-sky-500/40 hover:bg-white dark:hover:bg-slate-900/80 shadow-xs hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-mono font-black text-[#0E7490] dark:text-sky-400 text-base">{step}</span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
                  {phase}
                </span>
              </div>
              <div className="text-sm font-black text-[#0F1F33] dark:text-white tracking-wide font-sans flex items-center justify-between mb-2">
                <span className="group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{name}</span>
                {idx < 4 && (
                  <ChevronRight
                    className={`w-4 h-4 hidden lg:block transition-all duration-200 ${
                      isIlluminated
                        ? "text-sky-500 translate-x-1"
                        : "text-sky-500/70 dark:text-sky-500/60 group-hover:translate-x-1 group-hover:text-sky-400"
                    }`}
                  />
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main PolarOps Landing Page Component                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
export function LandingPage() {
  const { dark, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-[#060A12] text-[#0F1F33] dark:text-slate-100 flex flex-col font-sans selection:bg-sky-500/25 selection:text-sky-900 dark:selection:text-sky-200 transition-colors duration-200">
      {/* ============================================================== */}
      {/* 1. NAVBAR                                                      */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 h-16 bg-white/90 dark:bg-[#060A12]/90 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/80 transition-colors duration-200 shadow-xs dark:shadow-none">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm shadow-sm text-white transition-all duration-200 group-hover:shadow-sky-500/40 group-hover:shadow-md group-hover:scale-105"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)" }}
            >
              PO
            </div>
            <div>
              <div className="font-bold font-sans text-sm tracking-tight text-[#0F1F33] dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                POLAROPS
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-none">
                Antarctic Digital Twin
              </div>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
            {([
              ["Digital Twin", "/digital-twin"],
              ["Stations", "/stations"],
              ["Resources", "/resources"],
              ["Scenarios", "/scenarios"],
              ["Resilience", "/resilience"],
            ] as [string, string][]).map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="relative py-1 text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-sky-600 dark:after:bg-sky-400 after:transition-all after:duration-200 hover:after:w-full"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              title={dark ? "Switch to light theme" : "Switch to dark theme"}
              className="p-2 rounded-lg text-slate-600 hover:text-[#0F1F33] hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {dark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-200" />
              )}
            </button>

            <Link
              to="/command-center"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold text-xs transition-all duration-200 shadow hover:shadow-sky-500/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)" }}
            >
              <span>ENTER OPERATIONS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#070B14] border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3 shadow-2xl">
            <nav className="flex flex-col space-y-1.5 text-sm font-medium">
              <Link
                to="/command-center"
                className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Command Center
              </Link>
              <Link
                to="/digital-twin"
                className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Digital Twin
              </Link>
              <Link
                to="/stations"
                className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Stations
              </Link>
              <Link
                to="/resources"
                className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                to="/scenarios"
                className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Scenarios
              </Link>
              <Link
                to="/resilience"
                className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resilience
              </Link>
            </nav>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/command-center"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>ENTER OPERATIONS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 2. HERO — Authentic Antarctic photography with Digital Twin UI   */}
      {/* ============================================================== */}
      <section className="relative min-h-[88vh] flex flex-col items-stretch overflow-hidden border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {/* Optimized background image with subtle entrance */}
        <div className="absolute inset-0">
          <picture>
            <source srcSet="/antarctic-hero.webp" type="image/webp" />
            <img
              src="/antarctic-hero.jpg"
              alt="Indian Antarctic research station Bharati on the ice shelf"
              className="w-full h-full object-cover object-center animate-hero-image"
              loading="eager"
            />
          </picture>
          {/* Dark mode polar gradient overlays for high text contrast */}
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-r from-[#060A12]/95 via-[#060A12]/80 to-[#060A12]/35" />
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-[#060A12] via-transparent to-[#060A12]/40" />
          <div className="hidden dark:block absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

          {/* Light mode atmospheric overlays — preserves photography while ensuring readable navy text */}
          <div className="dark:hidden absolute inset-0 bg-gradient-to-r from-[#F5F9FC]/98 via-[#F5F9FC]/88 to-[#F5F9FC]/45" />
          <div className="dark:hidden absolute inset-0 bg-gradient-to-t from-[#F5F9FC] via-transparent to-[#F5F9FC]/50" />
          <div className="dark:hidden absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
        </div>

        {/* Subtle dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.03] bg-[radial-gradient(#0284c7_1px,transparent_1px)] dark:bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

        {/* Hero content with structured entrance sequencing */}
        <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center w-full">

            {/* ── Left: Hero Text ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Provenance kicker (Sequence Step 1) */}
              <div className="animate-hero-1 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-300 dark:border-sky-400/30 bg-sky-100/90 dark:bg-sky-950/60 backdrop-blur-sm text-sky-900 dark:text-sky-300 font-mono text-xs font-semibold tracking-wider uppercase shadow-2xs">
                <Compass className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                <span>NCPOR · 44TH INDIAN ANTARCTIC EXPEDITION</span>
              </div>

              {/* Unified Brand Headline (Sequence Step 1) */}
              <div className="animate-hero-1 space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0F1F33] dark:text-white font-sans">
                  POLAR<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0E7490] via-[#0284C7] to-[#0369A1] dark:from-sky-400 dark:via-sky-300 dark:to-cyan-200">OPS</span>
                </h1>
                <div className="text-xl sm:text-2xl font-semibold text-[#1E293B] dark:text-sky-200/90 tracking-tight font-sans">
                  Antarctic Operational Digital Twin
                </div>
              </div>

              {/* Concise operational summary (Sequence Step 2) */}
              <div className="animate-hero-2 space-y-3">
                <p className="text-base sm:text-lg text-[#334155] dark:text-slate-200/90 max-w-xl leading-relaxed">
                  Understand station conditions. Trace operational impact. Support decisions under Antarctic constraints.
                </p>
                <p className="text-sm text-[#475569] dark:text-slate-400 max-w-xl leading-relaxed">
                  PolarOps connects physical infrastructure, resource reserves, equipment degradation, and deterministic scenario models into one cohesive operational platform for Indian polar research stations.
                </p>
              </div>

              {/* Dual CTAs (Sequence Step 3) */}
              <div className="animate-hero-3 pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/command-center"
                  className="group inline-flex items-center justify-center gap-2 text-white font-bold text-sm px-7 py-3.5 rounded-xl shadow-lg hover:shadow-sky-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)" }}
                >
                  <span>ENTER OPERATIONS</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <Link
                  to="/digital-twin"
                  className="group inline-flex items-center justify-center gap-2 bg-white/90 hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 backdrop-blur-sm border border-slate-300/90 dark:border-slate-700/80 text-[#0F1F33] dark:text-slate-200 dark:hover:text-white font-semibold text-sm px-6 py-3.5 rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-xs"
                >
                  <span>EXPLORE DIGITAL TWIN</span>
                  <Boxes className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform duration-200" />
                </Link>
              </div>

              {/* Station telemetry badges */}
              <div className="animate-hero-3 pt-4 flex flex-wrap items-center gap-5 text-xs font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80">
                <span className="flex items-center gap-2">
                  <LiveDot color="bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Bharati (69°24'S, 76°11'E)</span>
                </span>
                <span className="flex items-center gap-2">
                  <LiveDot color="bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Maitri (70°45'S, 11°44'E)</span>
                </span>
                <span className="text-slate-500 dark:text-slate-500">Store &amp; Forward Ready</span>
              </div>
            </div>

            {/* ── Right: Glassmorphic Digital Twin Topology Schematic (Sequence Step 4) ── */}
            <div className="lg:col-span-5 animate-hero-card">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/75 backdrop-blur-xl shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-[#EEF5F8] dark:bg-slate-950/50">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#0F1F33] dark:text-slate-300 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>DIGITAL TWIN TOPOLOGY</span>
                  </div>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold font-mono flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-slow-pulse" />
                    ONLINE · 2 STATIONS
                  </span>
                </div>

                {/* Schematic Body */}
                <div className="p-5 space-y-3">
                  {/* Bharati Station Node */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/70 space-y-2.5 transition-all duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F1F33] dark:text-slate-100 flex items-center gap-1.5 font-sans">
                        <Radio className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        Bharati Station
                      </span>
                      <span className="font-mono text-[10.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/25 font-semibold transition-colors">
                        G-02 · WATCH
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-2xs">
                        <div className="text-slate-500 text-[10px] uppercase font-mono mb-0.5">Power Gen</div>
                        <div className="font-semibold text-[#0F1F33] dark:text-slate-200 font-mono tabular-nums">201 kW / 600 kW</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-2xs">
                        <div className="text-slate-500 text-[10px] uppercase font-mono mb-0.5">Fuel Runway</div>
                        <div className="font-semibold text-[#0F1F33] dark:text-slate-200 font-mono tabular-nums">70.3 Days (57%)</div>
                      </div>
                    </div>
                  </div>

                  {/* Dependency Indicator with subtle pulse */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/30 text-[11px] font-mono text-sky-800 dark:text-sky-300 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <GitFork className="w-3 h-3 text-sky-600 dark:text-sky-400 rotate-90 animate-slow-pulse" />
                      Cross-Subsystem BFS Traversal
                    </span>
                    <span className="font-semibold">N+1 Redundancy</span>
                  </div>

                  {/* Maitri Station Node */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/70 space-y-2.5 transition-all duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F1F33] dark:text-slate-100 flex items-center gap-1.5 font-sans">
                        <Radio className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        Maitri Station
                      </span>
                      <span className="font-mono text-[10.5px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/25 font-semibold transition-colors">
                        ALL NOMINAL
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-2xs">
                        <div className="text-slate-500 text-[10px] uppercase font-mono mb-0.5">Electrical Load</div>
                        <div className="font-semibold text-[#0F1F33] dark:text-slate-200 font-mono tabular-nums">180 kW (420 margin)</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-2xs">
                        <div className="text-slate-500 text-[10px] uppercase font-mono mb-0.5">Fuel Reserves</div>
                        <div className="font-semibold text-[#0F1F33] dark:text-slate-200 font-mono tabular-nums">133.1 Days (83%)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono border-t border-slate-200 dark:border-slate-800/60 pt-3 bg-[#F8FAFC]/50 dark:bg-transparent">
                  <span>TRUTH: DETERMINISTIC &amp; MEASURED</span>
                  <Link
                    to="/digital-twin"
                    className="text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 hover:underline flex items-center gap-1 transition-colors font-semibold"
                  >
                    <span>Inspect Twin</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. STAT BAR — Values animate smoothly on viewport entry         */}
      {/* ============================================================== */}
      <div className="bg-[#EEF5F8] dark:bg-[#080D18] border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {([
              { val: "2", label: "Research Stations" },
              { val: "47+", label: "Monitored Subsystems" },
              { val: "72h", label: "Scenario Horizon" },
              { val: "5-Stage", label: "Degradation Ladder" },
            ] as { val: string; label: string }[]).map(({ val, label }) => (
              <StatCounter key={label} target={val} label={label} />
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. WHAT POLAROPS DOES — OBSERVE / TRACE / DECIDE               */}
      {/* ============================================================== */}
      <section className="py-20 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060A12] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              ONE OPERATIONAL MODEL
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F1F33] dark:text-white font-sans">
              Integrated Polar Station Intelligence
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              PolarOps brings station telemetry, system relationships, resource constraints, resilience, and scenario analysis into one operational workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              {
                icon: <Eye className="w-5 h-5" />,
                kicker: "OBSERVE",
                heading: "Understand station and system state.",
                body: "Continuous telemetry monitoring across electrical generation, fuel reserves, life-support loops, and expedition crew complement under extreme Antarctic conditions.",
              },
              {
                icon: <GitFork className="w-5 h-5" />,
                kicker: "TRACE",
                heading: "Follow asset dependencies and operational impact.",
                body: "Graph traversal traces how mechanical degradation in primary generators cascades across water production, heating, and satellite communications.",
              },
              {
                icon: <CheckCircle2 className="w-5 h-5" />,
                kicker: "DECIDE",
                heading: "Evaluate constraints and scenario outcomes.",
                body: "Deterministic 24h–72h simulations model consequences and recommend human-approved countermeasures before critical thresholds are breached.",
              },
            ]).map(({ icon, kicker, heading, body }) => (
              <div
                key={kicker}
                className="group p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#080D18] space-y-4 hover:border-sky-400 dark:hover:border-sky-500/40 hover:bg-white dark:hover:bg-slate-900/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-sky-400 flex items-center justify-center group-hover:bg-[#0284c7] group-hover:text-white dark:group-hover:bg-sky-500 dark:group-hover:text-white transition-all duration-200">
                  {icon}
                </div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">{kicker}</div>
                <h3 className="text-lg font-bold text-[#0F1F33] dark:text-white leading-snug font-sans group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">{heading}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CORE OPERATIONAL CAPABILITIES (Card Hover Interactions)      */}
      {/* ============================================================== */}
      <section className="py-20 border-b border-slate-200 dark:border-slate-800/80 bg-[#EEF5F8] dark:bg-[#080D18] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 space-y-2">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              OPERATIONAL DOMAINS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F1F33] dark:text-white font-sans">
              Core Capabilities
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Specialized workspaces connecting station engineering reality directly to mission command.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {([
              {
                icon: <Boxes className="w-5 h-5" />,
                name: "Digital Twin",
                desc: "Interactive topology, vibration telemetry, and cross-subsystem cascading failure modeling.",
                artifact: "5-Stage Degradation: Nominal → Watch → Critical",
                to: "/digital-twin",
                cta: "Explore Digital Twin",
              },
              {
                icon: <Radio className="w-5 h-5" />,
                name: "Station Network",
                desc: "Monitor simultaneous operational posture between Bharati in Larsemann Hills and Maitri in Schirmacher Oasis.",
                artifact: "Headroom: Bharati 201 kW · Maitri 180 kW",
                to: "/stations",
                cta: "View Station Network",
              },
              {
                icon: <Fuel className="w-5 h-5" />,
                name: "Resources",
                desc: "Real-time runway calculations, inventory stockouts, and inbound maritime resupply ETAs.",
                artifact: "Fuel Runway: 70.3d Remaining (57% Stock)",
                to: "/resources",
                cta: "Inspect Resources",
              },
              {
                icon: <Activity className="w-5 h-5" />,
                name: "Scenarios",
                desc: "Evaluate generator trips, blizzard isolations, and load-shedding policies over 24h–72h.",
                artifact: "Horizon: 24h – 72h Deterministic Engine",
                to: "/scenarios",
                cta: "Run Scenarios",
              },
              {
                icon: <ShieldCheck className="w-5 h-5" />,
                name: "Resilience",
                desc: "Measure cross-subsystem redundancy margins and store-and-forward edge reconciliation.",
                artifact: "Redundancy: N+1 Generation · Priority Sync",
                to: "/resilience",
                cta: "Check Resilience",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                name: "Command Center",
                desc: "Immediate operational cockpit with active incident queue, telemetry timeline, and action dispatch.",
                artifact: "Active Alerts: 1 Incident (G-02 Watch)",
                to: "/command-center",
                cta: "Open Command Center",
              },
            ]).map(({ icon, name, desc, artifact, to, cta }) => (
              <div
                key={name}
                className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060A12] hover:border-sky-400 dark:hover:border-sky-500/40 hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-slate-900/60 shadow-xs transition-all duration-200 ease-out flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      {icon}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF5F8] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sky-800 dark:text-sky-300 font-medium">
                      {artifact}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0F1F33] dark:text-white font-sans group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors duration-200">{name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
                <Link
                  to={to}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300 inline-flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 transition-colors"
                >
                  <span>{cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. WORKFLOW: PHYSICAL ASSET → DECISIVE ACTION (CONNECTED PIPELINE) */}
      {/* ============================================================== */}
      <section className="py-20 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060A12] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-14">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              OPERATIONAL WORKFLOW
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F1F33] dark:text-white font-sans">
              From Physical Asset to Decisive Action
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400">
              How PolarOps transforms raw station transducers into clear, verified operator choices.
            </p>
          </div>

          {/* Connected Engineering Pipeline Component with sequential illumination */}
          <WorkflowPipeline />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. OPERATIONAL CONTEXT & ANTARCTIC GEOSPATIAL VISUAL          */}
      {/* ============================================================== */}
      <section className="py-20 border-b border-slate-200 dark:border-slate-800/80 bg-[#EEF5F8] dark:bg-[#080D18] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

            {/* Left: Antarctic Geospatial Network Visual */}
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                ANTARCTIC OPERATIONAL REALITY
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1F33] dark:text-white font-sans">
                Engineered for Environmental Constraint
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Antarctic stations operate thousands of kilometers from immediate supply lines. PolarOps acknowledges physical isolation, satellite intermittency, and the requirement for verifiable, explainable calculations.
              </p>

              {/* Clean Antarctic Geospatial Network Card with Radar Signal */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060A12] p-5 space-y-4 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#0F1F33] dark:text-slate-300 font-semibold">
                    <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>INDIAN ANTARCTIC RESEARCH NETWORK</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-800 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800/40 font-semibold">
                    ~3,000 km Distance
                  </span>
                </div>

                {/* Vector map schematic */}
                <div className="relative h-48 rounded-xl bg-[#F8FAFC] dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-4">
                  {/* Concentric polar latitude rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 dark:opacity-20">
                    <div className="w-72 h-72 rounded-full border border-sky-400/40" />
                    <div className="w-48 h-48 rounded-full border border-sky-400/50" />
                    <div className="w-24 h-24 rounded-full border border-dashed border-sky-400/60" />
                  </div>

                  {/* Geodesic Connection Line with slow calm radar pulse */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <line
                      x1="28%"
                      y1="48%"
                      x2="72%"
                      y2="52%"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-sky-600 dark:text-sky-400 opacity-75 animate-radar-dash"
                    />
                  </svg>

                  {/* Maitri Station Marker (West: 11°44'E) */}
                  <div className="absolute left-[24%] top-[40%] -translate-x-1/2 -translate-y-1/2 text-left space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 motion-reduce:hidden" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900 animate-slow-pulse" />
                      </span>
                      <span className="text-xs font-bold text-[#0F1F33] dark:text-white font-sans">Maitri</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pl-4">
                      70°45'S, 11°44'E
                      <div className="text-emerald-700 dark:text-emerald-400 font-semibold">133d Fuel · Standalone Grid</div>
                    </div>
                  </div>

                  {/* Bharati Station Marker (East: 76°11'E) */}
                  <div className="absolute left-[74%] top-[46%] -translate-x-1/2 -translate-y-1/2 text-left space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75 motion-reduce:hidden" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border-2 border-white dark:border-slate-900 animate-slow-pulse" />
                      </span>
                      <span className="text-xs font-bold text-[#0F1F33] dark:text-white font-sans">Bharati</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pl-4">
                      69°24'S, 76°11'E
                      <div className="text-amber-700 dark:text-amber-400 font-semibold">70.3d Fuel · G-02 Watch</div>
                    </div>
                  </div>

                  {/* Center distance label */}
                  <div className="absolute bottom-2.5 px-2.5 py-1 rounded bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 shadow-2xs">
                    Standalone Microgrids · Zero Direct Cable · Mutual Aid Logistical Corridor
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Operational Constraints */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                {
                  icon: <Satellite className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
                  title: "Store-and-Forward Sync",
                  desc: "Local offline station instances queue state snapshots and synchronize automatically when high-latitude satellite passes occur.",
                },
                {
                  icon: <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
                  title: "Deterministic Analysis",
                  desc: "Calculations use explicit thermodynamic and electrical load formulas—ensuring auditable, repeatable results that station engineers can trust.",
                },
                {
                  icon: <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
                  title: "Human-in-the-Loop Authority",
                  desc: "PolarOps never makes autonomous operational changes. It calculates consequences and presents recommendations for commander sign-off.",
                },
                {
                  icon: <Radio className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
                  title: "Multi-Station Context",
                  desc: "Maintains unified tracking across Bharati and Maitri, preserving individual microclimate, fuel reserve, and logistics timelines.",
                },
              ]).map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060A12] hover:border-sky-400 dark:hover:border-sky-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:-translate-y-0.5 shadow-xs hover:shadow-md transition-all duration-200 space-y-2"
                >
                  <div className="font-bold text-sm text-[#0F1F33] dark:text-white flex items-center gap-2 font-sans">
                    {icon}
                    {title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. PRIMARY BOTTOM CTA — Deep Polar Command Station Console     */}
      {/* ============================================================== */}
      <section className="relative py-24 overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-[#EEF5F8] via-[#E7F0F4] to-[#F5F9FC] dark:from-[#060A12] dark:via-[#080D1A] dark:to-[#04070D] transition-colors duration-200">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.10] animate-slow-pulse"
            style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-300 dark:border-sky-400/30 bg-sky-100/90 dark:bg-sky-950/60 backdrop-blur-sm text-sky-900 dark:text-sky-300 font-mono text-xs font-semibold tracking-wider uppercase shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>OPERATIONAL READINESS · MISSION 44</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#0F1F33] dark:text-white font-sans">
            Ready to enter the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0E7490] via-[#0284C7] to-[#0369A1] dark:from-sky-400 dark:via-sky-300 dark:to-cyan-200">
              operational workspace?
            </span>
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-300/80 max-w-xl mx-auto leading-relaxed">
            Access live station telemetry, dependency topologies, resource runway projections, and scenario simulations.
          </p>

          <div className="pt-3 flex justify-center">
            <Link
              to="/command-center"
              className="group inline-flex items-center justify-center gap-2 text-white font-bold text-sm px-10 py-4 rounded-xl shadow-xl hover:shadow-sky-500/40 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)" }}
            >
              <span>ENTER OPERATIONS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. FOOTER                                                      */}
      {/* ============================================================== */}
      <footer className="py-12 bg-[#EEF5F8] dark:bg-[#04070D] text-slate-600 dark:text-slate-400 text-xs border-t border-slate-200 dark:border-transparent transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-[#0F1F33] dark:text-white text-sm tracking-tight font-sans">
                POLAROPS
              </div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                Antarctic Operational Digital Twin
              </div>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm">
                Operational decision-support platform for Indian Antarctic Research Stations.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium">
              <Link to="/command-center" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Command Center
              </Link>
              <Link to="/digital-twin" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Digital Twin
              </Link>
              <Link to="/stations" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Stations
              </Link>
              <Link to="/resources" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Resources
              </Link>
              <Link to="/scenarios" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Scenarios
              </Link>
              <Link to="/resilience" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Resilience
              </Link>
              <Link to="/reports" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Reports
              </Link>
              <Link to="/settings" className="text-slate-700 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                Settings
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
            <div>
              National Centre for Polar and Ocean Research (NCPOR) · Ministry of Earth Sciences
            </div>
            <div>
              PolarOps v2.0 · Station Bharati &amp; Maitri
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
