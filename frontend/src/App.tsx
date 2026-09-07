import { useState, useEffect } from "react";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { useStationOverview } from "./hooks/useStationOverview";
import { Header, type ViewMode } from "./components/Header";
import { Footer } from "./components/Footer";
import { StatusSummary } from "./components/StatusSummary";
import { CriticalEvents } from "./components/CriticalEvents";
import { StationSchematic } from "./components/StationSchematic";
import { SubsystemGrid } from "./components/SubsystemGrid";
import { AssetIntelligenceView } from "./components/AssetIntelligence/AssetIntelligenceView";
import { ResourcesView } from "./components/Resources/ResourcesView";
import { ScenariosView } from "./components/Scenarios/ScenariosView";
import { ResilienceView } from "./components/Resilience/ResilienceView";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsAndConditions } from "./components/TermsAndConditions";
import { ActivityStream } from "./components/ActivityStream";
import { ExplanationDrawer } from "./components/ExplanationDrawer";

function getViewFromPath(): ViewMode {
  if (typeof window === "undefined") return "COMMAND_CENTER";
  const path = window.location.pathname;
  if (path.startsWith("/assets")) return "ASSET_DETAIL";
  if (path.startsWith("/resources")) return "RESOURCES";
  if (path.startsWith("/scenarios")) return "SCENARIOS";
  if (path.startsWith("/resilience")) return "RESILIENCE";
  if (path.startsWith("/privacy")) return "PRIVACY";
  if (path.startsWith("/terms")) return "TERMS";
  return "COMMAND_CENTER";
}

function getAssetIdFromPath(): string {
  if (typeof window === "undefined") return "G-02";
  const match = window.location.pathname.match(/\/assets\/([^/]+)/);
  if (!match || !match[1]) return "G-02";
  return match[1] === "ASSET-GEN-02" ? "G-02" : match[1];
}

export default function App() {
  const [selectedStationId, setSelectedStationId] = useState<string>("STATION-BHARATI");
  const [activeView, setActiveView] = useState<ViewMode>(getViewFromPath);
  const [inspectedAssetId, setInspectedAssetId] = useState<string>(getAssetIdFromPath);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);
  const [explanationDomain, setExplanationDomain] = useState<string>("ASSET");
  const [explanationEntityId, setExplanationEntityId] = useState<string>("G-02");

  const handleOpenExplanation = (domain: string, entityId: string) => {
    setExplanationDomain(domain);
    setExplanationEntityId(entityId);
    setIsExplanationOpen(true);
  };

  const handleRouteNavigation = (route: string) => {
    if (route.startsWith("/assets/")) {
      const id = route.replace("/assets/", "");
      handleInspectAsset(id);
    } else if (route.startsWith("/scenarios")) {
      navigateToView("SCENARIOS");
    } else if (route.startsWith("/resources")) {
      navigateToView("RESOURCES");
    } else if (route.startsWith("/resilience")) {
      navigateToView("RESILIENCE");
    } else if (route === "/") {
      navigateToView("COMMAND_CENTER");
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getViewFromPath());
      setInspectedAssetId(getAssetIdFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToView = (view: ViewMode) => {
    setActiveView(view);
    const path =
      view === "RESOURCES"
        ? "/resources"
        : view === "SCENARIOS"
        ? "/scenarios"
        : view === "RESILIENCE"
        ? "/resilience"
        : view === "PRIVACY"
        ? "/privacy"
        : view === "TERMS"
        ? "/terms"
        : "/";
    window.history.pushState({}, "", path);
  };

  const {
    data: overview,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useStationOverview(selectedStationId);

  const handleInspectAsset = (assetId: string) => {
    // Canonicalize to G-02 if alias passed
    const canonicalId = assetId === "ASSET-GEN-02" ? "G-02" : assetId;
    setInspectedAssetId(canonicalId);
    setActiveView("ASSET_DETAIL");
    window.history.pushState({}, "", `/assets/${canonicalId}`);
  };

  const handleBackToCommandCenter = () => {
    navigateToView("COMMAND_CENTER");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-[#e4e8f0] flex flex-col font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40 transition-colors">
      {/* ── Top Command Bar ─────────────────────────────── */}
      <Header
        selectedStationId={selectedStationId}
        onSelectStation={(id) => {
          setSelectedStationId(id);
          setActiveView("COMMAND_CENTER");
        }}
        environmentMode={overview?.environment_mode ?? "WINTER"}
        connectivityStatus={overview?.connectivity_status ?? (isError ? "OFFLINE" : "ONLINE")}
        isFetching={isFetching}
        activeView={activeView}
        onNavigateView={navigateToView}
        onRefresh={() => refetch()}
        onNavigateHome={handleBackToCommandCenter}
      />

      {/* ── Main Operations Viewport ────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div
            data-testid="loading-indicator"
            className="flex flex-col items-center justify-center min-h-[420px] gap-4 rounded-lg border border-slate-200 dark:border-[#2a2f3e] bg-white/70 dark:bg-[#181b24]/40 p-12 backdrop-blur-sm"
          >
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-[#5b9cf5]" />
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-[#e4e8f0] uppercase tracking-wider">
                CONNECTING TO STATION TELEMETRY BUS…
              </div>
              <p className="text-xs text-slate-500 dark:text-[#7a8194] mt-1 font-mono">
                Synchronizing real-time sensor metrics and topological state from {selectedStationId}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div
            data-testid="error-state"
            className="flex flex-col items-center justify-center min-h-[380px] gap-4 rounded border border-rose-800 bg-rose-950/20 p-8 text-center"
          >
            <div className="p-3 rounded bg-rose-900/40 text-rose-400 border border-rose-700">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div className="max-w-md">
              <h2 className="text-base font-bold font-mono text-rose-300 uppercase tracking-wider">
                Station Telemetry Feed Unavailable
              </h2>
              <p className="text-xs text-polar-300 mt-2 leading-relaxed">
                Unable to query live operational data from the backend API for{" "}
                <span className="font-mono font-bold text-rose-200">{selectedStationId}</span>.{" "}
                {error?.message || "Check network connection or backend service status."}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700 px-4 py-2 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Telemetry Connection</span>
            </button>
          </div>
        )}

        {/* View Routing */}
        {activeView === "PRIVACY" ? (
          <PrivacyPolicy onBack={handleBackToCommandCenter} />
        ) : activeView === "TERMS" ? (
          <TermsAndConditions onBack={handleBackToCommandCenter} />
        ) : overview ? (
          <>
            {activeView === "ASSET_DETAIL" ? (
              <AssetIntelligenceView
                assetId={inspectedAssetId}
                onBack={handleBackToCommandCenter}
                onOpenExplanation={handleOpenExplanation}
              />
            ) : activeView === "RESOURCES" ? (
              <ResourcesView
                stationId={selectedStationId}
                onBack={handleBackToCommandCenter}
                onInspectAsset={handleInspectAsset}
              />
            ) : activeView === "SCENARIOS" ? (
              <ScenariosView
                stationId={selectedStationId}
                onBack={handleBackToCommandCenter}
                onInspectAsset={handleInspectAsset}
                onOpenExplanation={handleOpenExplanation}
              />
            ) : activeView === "RESILIENCE" ? (
              <ResilienceView
                stationId={selectedStationId}
                onBack={handleBackToCommandCenter}
                onInspectAsset={handleInspectAsset}
              />
            ) : (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* 1. Situation Awareness / Top Status Row */}
                <StatusSummary overview={overview} />

                {/* 2. Critical Operational Anomaly Banner */}
                <CriticalEvents
                  events={overview.critical_events}
                  onInspectAsset={handleInspectAsset}
                  onOpenExplanation={handleOpenExplanation}
                />

                {/* 3. Live Operational Activity Stream (Day 2) */}
                <ActivityStream
                  stationId={selectedStationId}
                  onOpenExplanation={handleOpenExplanation}
                  onNavigate={handleRouteNavigation}
                />

                {/* 4. Spatial Topology & Schematic */}
                <StationSchematic
                  stationName={overview.name}
                  onInspectAsset={handleInspectAsset}
                />

                {/* 5. Subsystem Telemetry & Health Grid */}
                <SubsystemGrid subsystems={overview.subsystem_summary} />
              </div>
            )}
          </>
        ) : null}

        {/* ── Deterministic Operational Explanation Drawer (Day 2) ── */}
        <ExplanationDrawer
          isOpen={isExplanationOpen}
          onClose={() => setIsExplanationOpen(false)}
          domain={explanationDomain}
          entityId={explanationEntityId}
          stationId={selectedStationId}
          onNavigate={handleRouteNavigation}
        />
      </main>

      {/* ── Operational Status Footer ───────────────────── */}
      <Footer
        stationName={overview?.name ?? selectedStationId}
        environmentMode={overview?.environment_mode ?? "WINTER"}
        onNavigate={(view) => navigateToView(view)}
      />
    </div>
  );
}
