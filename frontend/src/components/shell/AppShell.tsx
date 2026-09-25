import React, { useState, useEffect } from "react";
import { HeaderBar } from "./HeaderBar";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { ResilienceDrawer } from "./ResilienceDrawer";
import { ExplanationDrawer } from "./ExplanationDrawer";

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Authoritative PolarOps Application Shell
 * 
 * Provides consistent Antarctic operations software layout:
 * - Collapsible Sidebar (240px expanded, 68px collapsed, persisted in localStorage)
 * - Mobile Off-Canvas Navigation Drawer with backdrop and scroll lock
 * - Top Command Bar with Station Switcher, Winter State, Live Connectivity, Sync, Weather & UTC Clock
 * - Main workspace canvas expanding cleanly
 * - Zero horizontal overflow across all responsive viewports
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("polarops-sidebar-collapsed") === "true";
  });

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("polarops-sidebar-collapsed", String(next));
      return next;
    });
  };

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Keyboard shortcut Ctrl+\ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B12] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-[#369ACC]/30 selection:text-[#172554] dark:selection:text-[#46B9C7]">
      {/* WCAG 2.2 Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#369ACC] focus:text-white focus:font-bold focus:rounded focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Command Bar */}
      <HeaderBar
        isMobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        isDesktopSidebarCollapsed={sidebarCollapsed}
        onDesktopSidebarToggle={handleToggleCollapse}
      />

      {/* Body: Sidebar + Main Content Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Fixed/Sticky Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </div>

        {/* Mobile Off-Canvas Drawer Navigation */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Content */}
            <div className="relative z-10 w-72 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <Sidebar
                collapsed={false}
                onToggleCollapse={() => {}}
                mobile
                onCloseMobile={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Operational Canvas */}
        <main
          id="main-content"
          className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto outline-none"
          role="main"
          tabIndex={-1}
        >
          <div className="flex-1 p-3 sm:p-5 lg:p-7 max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Globally Mounted Drawers & Command Palette */}
      <CommandPalette />
      <ResilienceDrawer />
      <ExplanationDrawer />
    </div>
  );
}
