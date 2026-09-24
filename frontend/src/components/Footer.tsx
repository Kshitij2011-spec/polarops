import React from "react";
import { Terminal, ExternalLink } from "lucide-react";

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
    <footer className="border-t border-slate-200 dark:border-[#2a2f3e] bg-white dark:bg-[#0f1117] px-6 py-4 text-xs text-slate-500 dark:text-[#7a8194] font-mono mt-auto transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Operational Metadata */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-[#9ca3b4]">
            <Terminal className="h-3.5 w-3.5 text-blue-600 dark:text-[#5b9cf5]" />
            <span className="font-semibold tracking-wider text-slate-900 dark:text-[#e4e8f0]">POLAROPS MISSION CONTROL</span>
          </div>
          <span className="text-slate-300 dark:text-[#2a2f3e] hidden sm:inline">|</span>
          <span className="text-slate-600 dark:text-[#9ca3b4]">STATION: {stationName}</span>
          <span className="text-slate-300 dark:text-[#2a2f3e] hidden sm:inline">|</span>
          <span className="text-slate-600 dark:text-[#9ca3b4]">MODE: {environmentMode}</span>
        </div>

        {/* Center: Context */}
        <div className="text-[11px] text-slate-400 dark:text-[#6b7280] text-center">
          SIH 2026 · Problem Statement SIH26060 · Remote Antarctic Management
        </div>

        {/* Right: Navigation & Legal Links */}
        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => onNavigate("COMMAND_CENTER")}
            className="hover:text-slate-900 dark:hover:text-[#e4e8f0] transition-colors cursor-pointer"
          >
            Command Center
          </button>
          <span className="text-slate-300 dark:text-[#2a2f3e]">·</span>
          <button
            onClick={() => onNavigate("PRIVACY")}
            className="hover:text-slate-900 dark:hover:text-[#e4e8f0] transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-slate-300 dark:text-[#2a2f3e]">·</span>
          <button
            onClick={() => onNavigate("TERMS")}
            className="hover:text-slate-900 dark:hover:text-[#e4e8f0] transition-colors cursor-pointer"
          >
            Terms of Use
          </button>
          <span className="text-slate-300 dark:text-[#2a2f3e]">·</span>
          <a
            href="https://github.com/Kshitij2011-spec/polarops"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-[#e4e8f0] transition-colors"
          >
            <span>Source</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};
