import React, { useState } from "react";
import { HeaderBar } from "./HeaderBar";
import { WorkspaceNav } from "./WorkspaceNav";
import { CommandPalette } from "./CommandPalette";
import { ResilienceDrawer } from "./ResilienceDrawer";
import { ExplanationDrawer } from "./ExplanationDrawer";

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Authoritative PolarOps Application Shell
 * Owner: Kshitij (Product Owner & System Integration Lead)
 * 
 * Provides mission-critical polar engineering chrome:
 * - 64px Header Bar with Station Context, Blizzard Warning & Comms Status
 * - 48px Workspace Navigation Bar (/twin, /cockpit, /continuity)
 * - Globally mounted Command Palette (Ctrl+K)
 * - Globally mounted Resilience & Store-and-Forward Drawer
 * - Globally mounted 5-Stage Explanation Drawer
 * - Strict 1024×768 ruggedized display compatibility with zero horizontal overflow
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-sky-900 selection:text-sky-200">
      {/* WCAG 2.2 Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-slate-950 focus:font-bold focus:rounded focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Primary Mission Header */}
      <HeaderBar
        isMobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Primary Workspace Navigation */}
      <WorkspaceNav />

      {/* Main Workspace Canvas */}
      <main
        id="main-content"
        className="flex-1 flex flex-col min-h-0 w-full relative outline-none"
        role="main"
        tabIndex={-1}
      >
        {children}
      </main>

      {/* Globally Mounted Drawers & Overlays */}
      <CommandPalette />
      <ResilienceDrawer />
      <ExplanationDrawer />
    </div>
  );
}
