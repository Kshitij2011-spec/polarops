import React, { useState, useContext } from "react";
import { Link } from "@tanstack/react-router";
import {
  CloudOff,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Database,
  HardDrive,
  Radio,
  FileText,
  Activity,
  Clock,
  Layers,
  Lock,
  Eye,
  SlidersHorizontal,
  ArrowUpRight,
  WifiOff,
  Server,
} from "lucide-react";
import { OperationsContext, Topology } from "@/components/polarops";
import { useStation } from "@/context/StationContext";
import { demoOfflineState, demoSyncQueue } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

export function OfflineView() {
  const { mode, setMode } = useContext(OperationsContext);
  const { activeStation } = useStation();
  const [sync, setSync] = useState<string>("IDLE");
  const [queueItems, setQueueItems] = useState(demoSyncQueue);

  const offline = mode === "offline";

  // Reconnection & reconciliation sequence
  const reconnect = () => {
    setSync("RECONNECTING");
    setTimeout(() => {
      setSync("SYNC IN PROGRESS");
    }, 700);
    setTimeout(() => {
      setSync("SYNC COMPLETE");
      setQueueItems((prev) =>
        prev.map((item) => ({ ...item, state: "ACKNOWLEDGED" }))
      );
    }, 1500);
    setTimeout(() => {
      setMode("online");
      setSync("EVENTS RECONCILED");
    }, 2300);
  };

  const pendingCount = queueItems.filter((i) => i.state !== "ACKNOWLEDGED").length;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ========================================================
          COMPACT OPERATIONAL HEADER (Font size preserved exactly)
          ======================================================== */}
      <header className="pb-2 pt-0 border-b border-slate-200 dark:border-slate-800 select-none">
        {/* ROW 1: Title & Grouped Right Context Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h1 className="page-title text-slate-900 dark:text-white">
            Offline Operations
          </h1>

          {/* Grouped Right Context Area */}
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-xs shrink-0">
            {/* Connection Status Badge */}
            <div className="inline-flex items-center gap-1.5 font-sans font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${
                  offline ? "bg-slate-400 dark:bg-slate-500" : "bg-emerald-500"
                }`}
                aria-hidden="true"
              />
              <span className={offline ? "text-slate-700 dark:text-slate-300" : "text-emerald-700 dark:text-emerald-400"}>
                {offline ? "OFFLINE" : "ONLINE LINK"}
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-600 font-light select-none" aria-hidden="true">|</span>

            {/* Dynamic Station Context */}
            <div className="inline-flex items-center gap-1">
              <span className="font-sans font-medium text-slate-800 dark:text-slate-200">
                {activeStation.name.replace("Station", "").trim()}
              </span>
              <span className="font-mono text-xs font-semibold text-[#369ACC] dark:text-[#46B9C7]">
                [{activeStation.code}]
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-600 font-light select-none" aria-hidden="true">|</span>

            {/* Last Synchronized Timestamp */}
            <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock size={12} className="text-slate-400 shrink-0" />
              <span className="font-sans">Sync:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                {demoOfflineState.lastAcknowledged}
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2: Context Eyebrow + Unified Operational Description */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 dark:text-slate-400 text-[15px] sm:text-[16px] leading-normal font-normal font-sans">
          <span className="eyebrow text-[#369ACC] dark:text-[#46B9C7] inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-wide uppercase shrink-0">
            <Radio size={13} className="shrink-0" />
            <span>RESILIENT LOCAL-FIRST OPERATIONS</span>
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline select-none" aria-hidden="true">·</span>
          <span>Station operational picture remains fully accessible during satellite/network degradation.</span>
        </div>
      </header>

      {/* ========================================================
          ROW 1: CONNECTION STATUS & LOCAL TWIN STATE
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Local Twin State (Topology DAG + Provenance) */}
        <section
          className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden flex flex-col"
          aria-labelledby="local-twin-heading"
        >
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40 flex items-center justify-between gap-3">
            <div>
              <h2
                id="local-twin-heading"
                className="font-sans font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2"
              >
                <Layers size={16} className="text-[#369ACC] dark:text-[#46B9C7]" />
                <span>LOCAL DIGITAL TWIN STATE</span>
              </h2>
              <p className="text-xs sm:text-[13px] font-sans font-normal text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                Deterministic station graph cached on local edge runtime
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#369ACC]/10 text-[#369ACC] dark:bg-[#369ACC]/20 dark:text-[#46B9C7] border border-[#369ACC]/30">
              CACHED TOPOLOGY
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            {/* Interactive Topology Component */}
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <Topology />
            </div>

            {/* Provenance Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              {[
                { label: "LOCAL SNAPSHOT", desc: "Cached Edge DAG" },
                { label: "IMMUTABLE JOURNAL", desc: "SHA-256 Verified" },
                { label: "DERIVED TELEMETRY", desc: "Physics Assessment" },
                { label: "STORE & FORWARD", desc: "Autonomous Queue" },
              ].map((x) => (
                <div
                  key={x.label}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center"
                >
                  <div className="font-sans text-[11px] font-semibold text-[#172554] dark:text-[#46B9C7] tracking-tight uppercase">
                    {x.label}
                  </div>
                  <div className="font-sans text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-normal">
                    {x.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Connection Status & Operating Mode */}
        <section
          className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs p-4 flex flex-col justify-between"
          aria-labelledby="connection-status-heading"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2
                id="connection-status-heading"
                className="font-sans font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2"
              >
                <Radio size={16} className="text-[#369ACC] dark:text-[#46B9C7]" />
                <span>LINK & TELEMETRY STATUS</span>
              </h2>
              <span
                className={`text-xs font-sans px-2.5 py-0.5 rounded font-semibold ${
                  offline
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {offline ? "DISCONNECTED" : "CONNECTED"}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Active Station:</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-sans text-xs">
                    {activeStation.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Coordinates:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                    {activeStation.coords}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Uplink Pathway:</span>
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-300 text-xs">
                    {offline ? "SAT-1 Standby (No Carrier)" : "SAT-1 Active Transponder"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Last Full Sync:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                    {demoOfflineState.lastSynchronized}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Next Pass Window:</span>
                  <span className="font-sans text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    {demoOfflineState.nextSync}
                  </span>
                </div>
              </div>

              {/* Operating Mode Toggle without "Online Demo" labeling */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2 font-sans">
                  Operating Link Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={!offline ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("online")}
                    className={`text-xs font-sans font-semibold cursor-pointer ${
                      !offline
                        ? "bg-[#172554] dark:bg-[#1E3A8A] text-white"
                        : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Online Uplink
                  </Button>
                  <Button
                    type="button"
                    variant={offline ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("offline")}
                    className={`text-xs font-sans font-semibold cursor-pointer flex items-center gap-1.5 ${
                      offline
                        ? "bg-slate-700 text-white dark:bg-slate-700"
                        : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <WifiOff size={13} />
                    <span>Offline Mode</span>
                  </Button>
                </div>
                <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-normal">
                  Toggle link simulator to exercise store-and-forward buffers and test autonomous edge operations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Status Notice */}
          <div className="mt-4 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/30 flex items-start gap-2 text-xs">
            <Server size={14} className="text-[#369ACC] dark:text-[#46B9C7] shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-400 text-xs font-sans font-normal leading-normal">
              Local SQLite & IndexedDB stores are currently operating in full read/write isolation.
            </span>
          </div>
        </section>
      </div>

      {/* ========================================================
          ROW 2: SYNC QUEUE & RECONCILIATION PIPELINE
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sync Queue */}
        <section
          className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden flex flex-col"
          aria-labelledby="sync-queue-heading"
        >
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40 flex items-center justify-between gap-3">
            <div>
              <h2
                id="sync-queue-heading"
                className="font-sans font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2"
              >
                <Database size={16} className="text-[#369ACC] dark:text-[#46B9C7]" />
                <span>STORE & FORWARD SYNCHRONIZATION QUEUE</span>
              </h2>
              <p className="text-xs sm:text-[13px] font-sans font-normal text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                Local telemetry and operator actions queued for central relay upon link restore
              </p>
            </div>
            <span
              className={`text-xs font-sans font-semibold px-2.5 py-0.5 rounded ${
                pendingCount > 0
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60"
                  : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60"
              }`}
            >
              {pendingCount} PENDING
            </span>
          </div>

          <div className="p-4 flex-1">
            {queueItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-sans">
                No pending synchronization items
              </div>
            ) : (
              <div className="space-y-2">
                {queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#369ACC] dark:text-[#46B9C7]">
                        0{item.id}
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900 dark:text-white font-sans">
                          {item.event}
                        </div>
                        <div className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                          {item.priority} Priority · Local Event Log
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded border ${
                        item.state === "ACKNOWLEDGED"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                      }`}
                    >
                      {item.state}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Store & Forward Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="block text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  LOCAL EVENTS
                </span>
                <strong className="block text-base font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                  {demoOfflineState.localEvents}
                </strong>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="block text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  PENDING SYNC
                </span>
                <strong className="block text-base font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                  {pendingCount}
                </strong>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="block text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  LAST ACK
                </span>
                <strong className="block text-xs sm:text-[13px] font-mono font-semibold text-slate-900 dark:text-white mt-1">
                  {demoOfflineState.lastAcknowledged}
                </strong>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="block text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                  BUFFER HEALTH
                </span>
                <strong className="block text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  99.8%
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Reconciliation Pipeline & Reconnect Action */}
        <section
          className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs p-4 flex flex-col justify-between"
          aria-labelledby="reconciliation-heading"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2
                id="reconciliation-heading"
                className="font-sans font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2"
              >
                <Activity size={16} className="text-[#369ACC] dark:text-[#46B9C7]" />
                <span>EVENT RECONCILIATION PIPELINE</span>
              </h2>
              <span className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                STATE MACHINE
              </span>
            </div>

            {/* Reconciliation Pipeline Flow */}
            <div className="mt-4 space-y-2">
              <div className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 font-sans mb-2 font-normal leading-normal">
                Linear synchronization path for local deterministic state:
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  { step: "01", name: "LOCAL TWIN STATE", active: true },
                  { step: "02", name: "STORE & FORWARD BUFFER", active: true },
                  { step: "03", name: "PRIORITY QUEUE", active: true },
                  {
                    step: "04",
                    name: "SYNCHRONIZATION",
                    active: sync === "SYNC IN PROGRESS" || sync === "SYNC COMPLETE" || sync === "EVENTS RECONCILED",
                  },
                  {
                    step: "05",
                    name: "ACK / RECONCILE",
                    active: sync === "EVENTS RECONCILED" || !offline,
                  },
                ].map((s) => (
                  <div
                    key={s.name}
                    className={`px-3 py-2 rounded border flex items-center justify-between transition-colors ${
                      s.active
                        ? "bg-[#369ACC]/10 dark:bg-[#369ACC]/20 border-[#369ACC]/40 text-[#172554] dark:text-white font-semibold"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-mono text-[#369ACC] dark:text-[#46B9C7] font-bold">
                        {s.step}
                      </span>
                      <span className="font-sans text-xs font-semibold tracking-normal">{s.name}</span>
                    </div>
                    {s.active ? (
                      <CheckCircle2 size={13} className="text-[#369ACC] dark:text-[#46B9C7]" />
                    ) : (
                      <ArrowRight size={13} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trigger Reconnection Button */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {offline ? (
              <Button
                type="button"
                onClick={reconnect}
                disabled={sync !== "IDLE"}
                className="w-full bg-[#172554] hover:bg-[#1E3A8A] text-white dark:bg-[#369ACC] dark:hover:bg-[#2F85B0] font-sans font-semibold text-xs py-2.5 h-auto transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw
                  size={14}
                  className={sync.includes("SYNC") || sync === "RECONNECTING" ? "animate-spin" : ""}
                />
                <span>
                  {sync === "IDLE"
                    ? "RECONNECT & SYNCHRONIZE"
                    : sync}
                </span>
              </Button>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-sans text-center font-semibold">
                {sync === "EVENTS RECONCILED"
                  ? "EVENTS RECONCILED · 3 | ACKNOWLEDGED · 3"
                  : "Uplink Active · Telemetry Fully Synchronized"}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ========================================================
          ROW 3: DATA INTEGRITY & OFFLINE CAPABILITIES
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Data Integrity Card */}
        <section
          className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs p-4"
          aria-labelledby="data-integrity-heading"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2
              id="data-integrity-heading"
              className="font-sans font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2"
            >
              <ShieldCheck size={16} className="text-[#369ACC] dark:text-[#46B9C7]" />
              <span>DATA INTEGRITY VERIFICATION</span>
            </h2>
            <span className="text-xs font-sans text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              AUDITED
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Storage Engine:</span>
                <span className="font-sans text-slate-800 dark:text-slate-200 text-xs font-semibold">
                  IndexedDB LocalStore <span className="font-mono font-medium">v2</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Journal Status:</span>
                <span className="font-sans text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  Append-Only Immutable
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Telemetry Vectors:</span>
                <span className="text-slate-800 dark:text-slate-200 text-xs font-semibold">
                  <span className="font-mono">14 / 14</span> <span className="font-sans">Vectors Validated</span>
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans text-xs block mb-1">
                  SHA-256 State Checksum:
                </span>
                <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all tracking-wide">
                  8f4c2e17a93b4d58e2f6c019d821ea34b95f019c
                </div>
              </div>
            </div>

            <p className="text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed font-normal mt-3">
              Cryptographic hash verified across local SQLite store and edge cache. All state mutations remain logged in the append-only operational journal.
            </p>
          </div>
        </section>

        {/* Available Offline Capabilities */}
        <section
          className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs p-4"
          aria-labelledby="capabilities-heading"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2
              id="capabilities-heading"
              className="font-sans font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2"
            >
              <HardDrive size={16} className="text-[#369ACC] dark:text-[#46B9C7]" />
              <span>ACTIVE OFFLINE CAPABILITIES</span>
            </h2>
            <span className="text-xs font-sans text-[#369ACC] dark:text-[#46B9C7] font-semibold">
              4 OPERATIONAL ENGINES
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: Eye,
                tag: "VIEW",
                title: "Digital Twin & Telemetry",
                desc: "Full interactive topology, asset hierarchy, and cached sensor readings remain active.",
              },
              {
                icon: SlidersHorizontal,
                tag: "ANALYZE",
                title: "Scenario Simulation",
                desc: "Run failure cascades, winter resource burn rates, and N-1 generator simulations locally.",
              },
              {
                icon: Database,
                tag: "QUEUE",
                title: "Local State Mutations",
                desc: "Record inspection logs, threshold acknowledgments, and operational decisions safely.",
              },
              {
                icon: FileText,
                tag: "REVIEW",
                title: "Operational Documentation",
                desc: "Access historical compliance reports, SOPs, and cold-soak survival checklists.",
              },
            ].map((cap) => {
              const CapIcon = cap.icon;
              return (
                <div
                  key={cap.tag}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-[#369ACC]/10 text-[#369ACC] dark:bg-[#369ACC]/20 dark:text-[#46B9C7] flex items-center justify-center shrink-0">
                      <CapIcon size={13} />
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#369ACC] dark:text-[#46B9C7]">
                      [{cap.tag}]
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">
                      {cap.title}
                    </h3>
                  </div>
                  <p className="text-xs font-sans text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
                    {cap.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================
          BOTTOM CTA: RETURN TO OPERATIONS
          ======================================================== */}
      <footer className="pt-2 pb-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">
          <span>PolarOps Resilient Edge Runtime </span>
          <span className="font-mono font-medium">v1.2.0</span>
          <span> · Station {activeStation.name}</span>
        </div>

        <Link
          to="/command-center"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] dark:bg-[#369ACC] dark:hover:bg-[#2F85B0] text-white font-sans text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#369ACC]"
        >
          <span>RETURN TO OPERATIONS</span>
          <ArrowRight size={14} />
        </Link>
      </footer>
    </div>
  );
}
