import { AlertTriangle, CheckCircle2, Flame, Layers, Radio, Waves, Zap } from "lucide-react";

export interface StationSchematicProps {
  stationName: string;
  onInspectAsset?: (assetId: string) => void;
}

export function StationSchematic({ stationName, onInspectAsset }: StationSchematicProps) {
  return (
    <div className="rounded-xl border border-polar-700 bg-polar-800/70 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-polar-700">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-polar-200">
            STATION SPATIAL TOPOLOGY &middot; {stationName}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-polar-400">
            <span className="h-2 w-2 rounded-full bg-accent-green" />
            Nominal
          </span>
          <span className="flex items-center gap-1.5 text-accent-amber">
            <span className="h-2 w-2 rounded-full bg-accent-amber animate-ping" />
            Degraded / Attention
          </span>
        </div>
      </div>

      {/* Schematic Layout Container */}
      <div className="relative w-full rounded-lg border border-polar-700/80 bg-polar-950/80 p-6 overflow-hidden min-h-[320px]">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#22d3ee 1px, transparent 1px), radial-gradient(#22d3ee 1px, #0a0e1a 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
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
            stroke="#22d3ee"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-40 animate-pulse"
          />
          {/* Thermal Loop line from Powerhouse / HVAC to Water Plant */}
          <path
            d="M 220 130 L 320 130 L 320 230 L 220 230"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            className="opacity-30"
          />
          {/* Comms uplink line to Satmast */}
          <path
            d="M 450 180 L 560 180 L 560 100"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="opacity-30"
          />
        </svg>

        {/* Zone Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── ZONE 1: Powerhouse (Hero Zone) ────────────── */}
          <div className="rounded-lg border-2 border-amber-500/60 bg-polar-900/90 p-4 shadow-lg shadow-amber-950/20">
            <div className="flex items-center justify-between pb-2 border-b border-polar-700 mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-polar-200">
                  ZONE 1 &middot; POWERHOUSE
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
                DEGRADED
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Generator G-01 */}
              <div className="flex items-center justify-between rounded bg-polar-800/80 px-3 py-2 border border-polar-700/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
                  <div>
                    <div className="text-xs font-mono font-bold text-polar-200">
                      G-01 &middot; Primary Genset
                    </div>
                    <div className="text-[10px] text-polar-400">120 kW &middot; Nominal</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-accent-green">100%</span>
              </div>

              {/* Generator G-02 (HERO ASSET - CLICKABLE) */}
              <div
                onClick={() => onInspectAsset?.("G-02")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onInspectAsset?.("G-02")}
                className="group relative flex items-center justify-between rounded-lg bg-amber-950/40 hover:bg-amber-950/70 px-3 py-2.5 border-2 border-amber-500 hover:border-amber-400 transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-amber-300 group-hover:text-amber-200">
                        G-02 &middot; Backup Genset
                      </span>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono">
                      Vib: 4.8 mm/s &middot; Temp: 94.2°C
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-amber-300">62%</div>
                  <div className="text-[9px] font-mono text-accent-cyan uppercase underline group-hover:text-white">
                    INSPECT →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ZONE 2: Main Habitat & HVAC ───────────────── */}
          <div className="rounded-lg border border-polar-700 bg-polar-900/90 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-polar-700 mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-accent-amber" />
                <span className="text-xs font-mono font-bold text-polar-200">
                  ZONE 2 &middot; HABITAT & HVAC
                </span>
              </div>
              <span className="text-[10px] font-mono text-polar-400 font-semibold uppercase">
                OPERATIONAL
              </span>
            </div>

            <div className="space-y-2.5">
              {/* HVAC Unit 02 */}
              <div className="flex items-center justify-between rounded bg-polar-800/80 px-3 py-2 border border-polar-700/60">
                <div className="flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5 text-accent-amber" />
                  <div>
                    <div className="text-xs font-mono font-bold text-polar-200">
                      HVAC-02 &middot; Habitat Thermal
                    </div>
                    <div className="text-[10px] text-polar-400">Heating Loop Zone B</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400">80%</span>
              </div>

              {/* Life Support & Crew Quarters */}
              <div className="flex items-center justify-between rounded bg-polar-800/80 px-3 py-2 border border-polar-700/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />
                  <div>
                    <div className="text-xs font-mono font-bold text-polar-200">
                      Habitat Life Support
                    </div>
                    <div className="text-[10px] text-polar-400">22 Personnel &middot; 21.0°C</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-accent-green">100%</span>
              </div>
            </div>
          </div>

          {/* ── ZONE 3 & 4: Water & Science & Comms ───────── */}
          <div className="rounded-lg border border-polar-700 bg-polar-900/90 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-polar-700 mb-3">
              <div className="flex items-center gap-1.5">
                <Waves className="h-4 w-4 text-accent-cyan" />
                <span className="text-xs font-mono font-bold text-polar-200">
                  UTILITIES & SCIENCE
                </span>
              </div>
              <span className="text-[10px] font-mono text-accent-green font-semibold uppercase">
                NOMINAL
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Water Plant Pump */}
              <div className="flex items-center justify-between rounded bg-polar-800/80 px-3 py-2 border border-polar-700/60">
                <div className="flex items-center gap-2">
                  <Waves className="h-3.5 w-3.5 text-accent-cyan" />
                  <div>
                    <div className="text-xs font-mono font-bold text-polar-200">
                      Water Plant Pump #1
                    </div>
                    <div className="text-[10px] text-polar-400">Desalination Loop</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-accent-green">95%</span>
              </div>

              {/* Science Distribution & Satcom */}
              <div className="flex items-center justify-between rounded bg-polar-800/80 px-3 py-2 border border-polar-700/60">
                <div className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-accent-green" />
                  <div>
                    <div className="text-xs font-mono font-bold text-polar-200">
                      Science Bus & Satcom
                    </div>
                    <div className="text-[10px] text-polar-400">Earth Science Labs</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-accent-green">98%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
