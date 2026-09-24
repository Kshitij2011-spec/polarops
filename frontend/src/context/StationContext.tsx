/**
 * PolarOps Entity Context Engine & Shared Operational Context
 * Owner: Kshitij (Product Owner & System Integration Lead)
 * 
 * Implements the authoritative state architecture from FINAL_ENTITY_CONTEXT_MODEL.md:
 * - Server-derived state is managed via TanStack Query.
 * - Global client state is strictly bounded to activeStationId, activeIncidentId, localLinkState.
 * - Deep-linkable state is synchronized via validated URL search parameters with Zod fallback guards.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { z } from "zod";
import type { GlobalLinkState } from "@/components/foundation/LinkHealthPill";

export type StationId = "STATION-BHARATI" | "STATION-MAITRI";

export interface StationMetadata {
  id: StationId;
  name: string;
  code: string;
  coords: string;
  location: string;
  elevation: string;
  type: string;
}

export const STATIONS: Record<StationId, StationMetadata> = {
  "STATION-BHARATI": {
    id: "STATION-BHARATI",
    name: "Bharati Station",
    code: "BHARATI",
    coords: "69°24'S, 76°11'E",
    location: "Larsemann Hills, East Antarctica",
    elevation: "35m ASL",
    type: "Primary Operational Base",
  },
  "STATION-MAITRI": {
    id: "STATION-MAITRI",
    name: "Maitri Station",
    code: "MAITRI",
    coords: "70°46'S, 11°44'E",
    location: "Schirmacher Oasis, Queen Maud Land",
    elevation: "117m ASL",
    type: "Inland Research Base",
  },
};

/**
 * Universal URL Search Parameters Schema
 * Validates and safely guards against malformed URL parameters.
 */
export const SearchParamsSchema = z.object({
  station: z.enum(["STATION-BHARATI", "STATION-MAITRI"]).catch("STATION-BHARATI"),
  asset: z.string().optional(),
  incident: z.string().optional(),
  mode: z.enum(["active", "sim", "memory"]).optional().catch("active"),
  tab: z.enum(["fuel", "spares", "resupply", "resilience"]).optional().catch("fuel"),
  drawer: z.enum(["explain", "resilience"]).optional(),
  domain: z.enum(["ASSET", "INCIDENT", "STATION"]).optional(),
  id: z.string().optional(),
  view: z.enum(["topology", "schematic", "matrix"]).optional().catch("topology"),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export interface ExplanationDrawerState {
  isOpen: boolean;
  domain: string;
  id: string;
}

export interface StationContextValue {
  // Bounded Global Operational State
  activeStationId: StationId;
  activeStation: StationMetadata;
  setActiveStationId: (id: StationId) => void;
  activeIncidentId: string | null;
  setActiveIncidentId: (id: string | null) => void;
  localLinkState: GlobalLinkState;
  setLocalLinkState: (state: GlobalLinkState) => void;
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;

  // Drawer & Modal State
  isResilienceDrawerOpen: boolean;
  openResilienceDrawer: () => void;
  closeResilienceDrawer: () => void;

  explanationState: ExplanationDrawerState;
  openExplanation: (domain: string, id: string) => void;
  closeExplanation: () => void;

  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

const StationContext = createContext<StationContextValue | null>(null);

export interface StationProviderProps {
  children: React.ReactNode;
  initialStationId?: StationId;
}

export function StationProvider({
  children,
  initialStationId = "STATION-BHARATI",
}: StationProviderProps) {
  // Read initial station from URL search param if present in browser
  const [activeStationId, setActiveStationIdState] = useState<StationId>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const st = params.get("station");
        if (st === "STATION-MAITRI" || st === "STATION-BHARATI") {
          return st;
        }
      } catch {
        // Fallback safely
      }
    }
    return initialStationId;
  });

  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get("incident") || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [localLinkState, setLocalLinkState] = useState<GlobalLinkState>("NORMAL");
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Drawers
  const [isResilienceDrawerOpen, setIsResilienceDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [explanationState, setExplanationState] = useState<ExplanationDrawerState>({
    isOpen: false,
    domain: "ASSET",
    id: "",
  });

  // Station update wrapper that updates state and keeps URL param synchronized
  const setActiveStationId = useCallback((id: StationId) => {
    setActiveStationIdState(id);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("station", id);
        window.history.replaceState({}, "", url.toString());
      } catch {
        // Safe fallback in test environments
      }
    }
  }, []);

  const openResilienceDrawer = useCallback(() => setIsResilienceDrawerOpen(true), []);
  const closeResilienceDrawer = useCallback(() => setIsResilienceDrawerOpen(false), []);

  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);

  const openExplanation = useCallback((domain: string, id: string) => {
    setExplanationState({ isOpen: true, domain, id });
  }, []);

  const closeExplanation = useCallback(() => {
    setExplanationState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K opens command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isK = e.key === "k" || e.key === "K" || e.code === "KeyK";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      const isR = e.key === "r" || e.key === "R" || e.code === "KeyR";
      if ((e.ctrlKey || e.metaKey) && isR && e.shiftKey) {
        e.preventDefault();
        setIsResilienceDrawerOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsResilienceDrawerOpen(false);
        setExplanationState((prev) => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeStation = useMemo(() => STATIONS[activeStationId] || STATIONS["STATION-BHARATI"], [activeStationId]);

  const value = useMemo<StationContextValue>(
    () => ({
      activeStationId,
      activeStation,
      setActiveStationId,
      activeIncidentId,
      setActiveIncidentId,
      localLinkState,
      setLocalLinkState,
      pendingSyncCount,
      setPendingSyncCount,
      isResilienceDrawerOpen,
      openResilienceDrawer,
      closeResilienceDrawer,
      explanationState,
      openExplanation,
      closeExplanation,
      isCommandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
    }),
    [
      activeStationId,
      activeStation,
      setActiveStationId,
      activeIncidentId,
      localLinkState,
      pendingSyncCount,
      isResilienceDrawerOpen,
      openResilienceDrawer,
      closeResilienceDrawer,
      explanationState,
      openExplanation,
      closeExplanation,
      isCommandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
    ]
  );

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation(): StationContextValue {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error("useStation must be used within a StationProvider");
  }
  return context;
}
