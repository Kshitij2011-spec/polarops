import React from "react";
import { Activity, ShieldCheck, Terminal, ExternalLink } from "lucide-react";

interface FooterProps {
  stationName: string;
  environmentMode: string;
  onNavigate: (view: "COMMAND_CENTER" | "PRIVACY" | "TERMS") => void;
}

export const Footer: React.FC<FooterProps> = ({
  stationName,
  environmentMode,
  onNavigate,
}) => {
  return (
    <footer className="border-t border-polar-800 bg-polar-950 px-6 py-4 text-xs text-polar-400 font-mono mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Operational Metadata */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-polar-300">
            <Terminal className="h-3.5 w-3.5 text-accent-cyan" />
            <span className="font-semibold tracking-wider">POLAROPS MISSION CONTROL</span>
          </div>
          <span className="text-polar-700 hidden sm:inline">|</span>
          <span className="text-polar-400">STATION: {stationName}</span>
          <span className="text-polar-700 hidden sm:inline">|</span>
          <span className="text-polar-400">MODE: {environmentMode}</span>
        </div>

        {/* Center: Context */}
        <div className="text-[11px] text-polar-400 text-center">
          SIH 2026 · Problem Statement SIH26060 · Remote Antarctic Management
        </div>

        {/* Right: Navigation & Legal Links */}
        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => onNavigate("COMMAND_CENTER")}
            className="hover:text-polar-200 transition-colors cursor-pointer"
          >
            Command Center
          </button>
          <span className="text-polar-700">·</span>
          <button
            onClick={() => onNavigate("PRIVACY")}
            className="hover:text-polar-200 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-polar-700">·</span>
          <button
            onClick={() => onNavigate("TERMS")}
            className="hover:text-polar-200 transition-colors cursor-pointer"
          >
            Terms of Use
          </button>
          <span className="text-polar-700">·</span>
          <a
            href="https://github.com/Kshitij2011-spec/polarops"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-polar-200 transition-colors"
          >
            <span>Source</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};
