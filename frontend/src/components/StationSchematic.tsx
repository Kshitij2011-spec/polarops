import { AlertTriangle, CheckCircle2, Flame, Layers, Radio, Zap } from "lucide-react";

export interface StationSchematicProps {
  stationName: string;
  onInspectAsset?: (assetId: string) => void;
}

export function StationSchematic({ stationName, onInspectAsset }: StationSchematicProps) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#181b24] p-5 shadow-2xs transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-[#2a2f3e]">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-[#e4e8f0]">
            STATION SPATIAL TOPOLOGY &middot; {stationName}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-[#7a8194]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Nominal
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Degraded / Attention
          </span>
        </div>
      </div>

      {/* Schematic Layout Container */}
      <div className="relative w-full rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-slate-50/80 dark:bg-[#0c0e14] p-6 overflow-hidden min-h-[300px]">
        {/* Technical Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0284c7 1px, transparent 1px), linear-gradient(to bottom, #0284c7 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* SVG Interconnecting Power & Thermal Buses */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Power Bus line from Powerhouse to Main Habitat and Science */}
          <path
            d="M 220 100 L 400 100 L 400 180"
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-50"
          />
          {/* Thermal Loop line from Powerhouse / HVAC to Water Plant */}
          <path
            d="M 220 130 L 320 130 L 320 230 L 220 230"
            fill="none"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            className="opacity-40"
          />
          {/* Comms uplink line to Satmast */}
          <path
            d="M 450 180 L 560 180 L 560 100"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="opacity-40"
          />
        </svg>

        {/* Zone Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* ── ZONE 1: Powerhouse (Hero Zone) ────────────── */}
          <div className="rounded-md border border-amber-300 dark:border-amber-700/80 bg-white/90 dark:bg-[#141721]/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/40 mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                  ZONE 1 &middot; POWERHOUSE
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 font-bold uppercase bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                DEGRADED
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Generator G-01 */}
              <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-[#181b24] px-3 py-2 border border-slate-200 dark:border-[#2a2f3e]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                      G-01 &middot; Primary Genset
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono">120 kW &middot; Nominal</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">100%</span>
              </div>

              {/* Generator G-02 (HERO ASSET - CLICKABLE) */}
              <div
                onClick={() => onInspectAsset?.("G-02")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onInspectAsset?.("G-02")}
                className="group relative flex items-center justify-between rounded-md bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 px-3 py-2.5 border border-amber-300 hover:border-amber-400 dark:border-amber-600/80 dark:hover:border-amber-400 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300 group-hover:text-amber-950 dark:group-hover:text-amber-200">
                        G-02 &middot; Backup Genset
                      </span>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400/90 font-mono">
                      Vib: 4.8 mm/s &middot; Temp: 94.2°C
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">62%</div>
                  <div className="text-[10px] font-mono text-blue-700 dark:text-[#5b9cf5] uppercase font-semibold group-hover:text-blue-900 dark:group-hover:text-white">
                    INSPECT →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ZONE 2: Main Habitat & HVAC ───────────────── */}
          <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white/90 dark:bg-[#141721]/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2a2f3e]/80 mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-slate-500 dark:text-[#9ca3b4]" />
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                  ZONE 2 &middot; HABITAT &amp; HVAC
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 font-bold uppercase bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                ATTENTION
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Thermal Loop A */}
              <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-[#181b24] px-3 py-2 border border-slate-200 dark:border-[#2a2f3e]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                      Loop A &middot; Core Living Qtrs
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono">+20.5°C &middot; Nominal</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">96%</span>
              </div>

              {/* Thermal Loop B */}
              <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-[#181b24] px-3 py-2 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                      Loop B &middot; Secondary Heat
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400/90 font-mono">Heat Margin Degraded</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">74%</span>
              </div>
            </div>
          </div>

          {/* ── ZONE 3: Science & Comms Mast ──────────────── */}
          <div className="rounded-md border border-slate-200 dark:border-[#2a2f3e] bg-white/90 dark:bg-[#141721]/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2a2f3e]/80 mb-3">
              <div className="flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-blue-600 dark:text-[#5b9cf5]" />
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#e4e8f0]">
                  ZONE 3 &middot; SCIENCE &amp; COMMS
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                NOMINAL
              </span>
            </div>

            <div className="space-y-2.5">
              {/* VSAT Uplink Dome */}
              <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-[#181b24] px-3 py-2 border border-slate-200 dark:border-[#2a2f3e]">
                <div className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                      VSAT Ku-Band Uplink
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono">Carrier Online &middot; 680ms</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">100%</span>
              </div>

              {/* S-17 Auroral Radar */}
              <div className="flex items-center justify-between rounded-md bg-slate-50 dark:bg-[#181b24] px-3 py-2 border border-slate-200 dark:border-[#2a2f3e]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#e4e8f0]">
                      S-17 &middot; Auroral Radar
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-[#7a8194] font-mono">146 TECU &middot; Sampling</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
