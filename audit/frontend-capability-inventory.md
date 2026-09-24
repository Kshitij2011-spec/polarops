# PolarOps — New Frontend Capability Inventory
**Phase 0 Output · Document 3 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Technical Architecture & Framework

| Dimension | New Frontend Specification (on `integration/polarops-insight`) |
|---|---|
| **Framework** | React 19.2.0 + TanStack Start 1.168.32 + Nitro 3.0.260603-beta (SSR engine) |
| **Build Tooling** | Vite 8.1.5 (`@lovable.dev/vite-tanstack-config` + `@tailwindcss/vite` 4.2.1) |
| **Location in Repo** | Root level (`package.json`, `src/`, `public/`, `tsconfig.json`) |
| **Entry Point** | Client: `src/start.ts` → `src/router.tsx` → `src/routeTree.gen.ts` |
| **Server Entry** | `src/server.ts` (Nitro SSR request handler with h3 error interception) |
| **Routing System** | `@tanstack/react-router` file-based routing under `src/routes/` |
| **Styling** | Tailwind CSS 4 (`src/styles.css`, 192 lines of custom CSS tokens and utility classes) |
| **Component Library** | Radix UI primitives with shadcn/ui wrappers (47 UI components in `src/components/ui/`) |
| **State Management** | React local state (`useState`), two Contexts (`OperationsContext`, `ThemeContext`), `localStorage` |
| **Data Fetching Layer** | **ABSENT.** Zero `fetch` calls, zero `axios`, zero API hooks, zero query clients |
| **Active Test Suites** | **ABSENT.** Zero unit tests, zero Playwright E2E tests in the new frontend |
| **Build Status** | **BROKEN (Fails compilation due to missing module in commit `6048a3b`)** |

---

## 2. Route & View Inventory

The new frontend defines 11 distinct file routes in `src/routes/`:

```
src/routes/
├── __root.tsx            # Global layout shell, ThemeProvider, OperationsProvider, NotFound, Error boundary
├── index.tsx             # Landing Page (Marketing / Introduction to PolarOps)
├── command-center.tsx    # Station Bharati Command Center / Situational Overview
├── digital-twin.tsx      # Interactive Station Spatial & Subsystem Topology
├── stations.tsx          # Station Portfolio Overview (Bharati & Maitri)
├── resources.tsx         # Station Logistics, Fuel & Resource Reserves
├── scenarios.tsx         # What-If Scenario Simulation
├── resilience.tsx        # Station Operational Resilience Domains
├── alerts.tsx            # Prioritized Operational Alerts
├── reports.tsx           # Mission Records & Exportable Reports
├── offline.tsx           # Offline Analog (Local-first store-and-forward demonstration)
└── settings.tsx          # Local Prototype Settings & Configuration
```

All route components delegate directly to view functions exported by the monolith presentation component in `src/components/polarops.tsx`:

| Route Path | Exported Component | Visual Purpose & User Story | Current Data Source |
|---|---|---|---|
| `/` | `LandingPage` | Public-facing intro, SIH 2026 header, operational logic chain, system capabilities list, and CTA buttons. | Hardcoded arrays in `polarops.tsx` & `demoCapabilities` |
| `/command-center` | `OverviewPage` | Main situational awareness dashboard: 4 top KPIs, Digital Twin mini-view, G-02 incident card, 5-question explanation drawer, timeline, causal reasoning accordion, operational recommendations, activity feed. | `demoMetrics`, `demoG02`, `demoTimeline`, `demoDependencies`, `demoActivities` |
| `/digital-twin` | `DigitalTwinPage` | Full-screen interactive SVG topology with zoom controls (+, -, reset) and asset detail sidebar for node inspection. | `topologyNodes` array |
| `/stations` | `StationsPage` | Portfolio cards for Indian Antarctic Research Stations (Bharati & Maitri) showing status, connectivity, personnel, power, alerts. | `demoStationData.stations` |
| `/resources` | `ResourcesPage` | 6 resource cards (Fuel, Power, Water, Food, Medical, Logistics) with progress bars, daily consumption, and reserve autonomy days. | `demoResources` tuple array |
| `/scenarios` | `ScenariosPage` | List of 5 operational scenarios. Clicking "RUN SCENARIO" displays a mock impact assessment card. | `demoScenarios` array + static JSX strings |
| `/resilience` | `ResiliencePage` | 6 resilience domain cards (Power Redundancy, Fuel Autonomy, Comms, Life Support, Logistics, Data Sync) with 5-segment LED-style status bars. | Hardcoded `rows` tuple array |
| `/alerts` | `AlertsPage` | Filterable alert list (ALL, CRITICAL, WARNING, INFO) with interactive "MARK AS REVIEWED" button. | `demoAlerts` array |
| `/reports` | `ReportsPage` | 5 operational report cards with interactive "VIEW" and "EXPORT" demo buttons that trigger temporary banner notices. | `demoReports` string array |
| `/offline` | `OfflinePage` | Offline Analog workspace with store-and-forward counters, priority sync queue, and simulated reconnect button. | `demoOfflineState`, `demoSyncQueue` |
| `/settings` | `SettingsPage` | Theme toggle (dark/light), offline mode toggle, dropdowns for active station, default view, and notification switches. | Local React state |

---

## 3. Component Inventory

### A. Core Operational Components (`src/components/polarops.tsx`)
1. `AppShell`: Top mission navigation bar, station/connectivity/sync badges, mobile drawer navigation, theme toggle.
2. `Sidebar`: Desktop navigation drawer with grouped links (COMMAND, OPERATIONS, REPORTING, SYSTEM).
3. `PageHeader`: Standardized operational header with eyebrow, title, subtitle, and status badge.
4. `Panel`: Card wrapper with header, subtitle, actions, and standardized borders.
5. `StatusBadge`: Color-coded pill badge for statuses (`status-nominal`, `status-warning`, `status-critical`, `status-watch`, `status-attention`, `status-info`).
6. `Topology`: Interactive SVG grid with coordinate-positioned subsystem nodes and dependency SVG lines.
7. `ExplanationDrawer`: Slide-out Sheet displaying the 5 cognitive progressive disclosure steps for Generator G-02.
8. `OperationsProvider` & `ThemeProvider`: Context providers for operational mode and theme.

### B. Radix UI / shadcn Component Library (`src/components/ui/`)
Contains 47 production-grade UI components including:
`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle-group`, `toggle`, `tooltip`.

---

## 4. State Management & Data-Flow Audit

### Real vs. Mock Analysis

| Feature Area | Current Status in New Frontend | Real Logic? | Mock Logic? |
|---|---|---|---|
| **Network Communication** | Completely absent | **No** | None (No network layer) |
| **Theme Toggle** | Fully functional (`dark` class toggle + `localStorage`) | **Yes** | No |
| **Offline Mode Toggle** | Context state + `localStorage` ("polarops-mode") | **Yes** (UI only) | Simulation of offline state |
| **Scenario Execution** | Button click updates `run` string in local state | **No** | Hardcoded text block in JSX |
| **Sync Reconnection** | `reconnect()` executes 4 cascading `window.setTimeout()` calls | **No** | Simulated timing |
| **Alert Review** | Appends alert ID to local state array `reviewed: number[]` | **No** | Local in-memory array |
| **Report Export** | Sets temporary state string `msg` | **No** | Local string |
| **Topology Selection** | Updates URL query parameter `?asset=...` and selected node state | **Yes** (Router level) | Static coordinate array |
| **Telemetry Time-Series** | 11 static vertical `<i>` bars representing vibration | **No** | Hardcoded heights `[4,7,10,15,23,35,24,16,10,6,4]` |
| **Dependency Graph** | Hardcoded SVG line coordinates | **No** | Hardcoded percentages |
| **Risk Scoring** | Text label "+3.1% deviation" | **No** | Missing 6-factor calculations |

---

## 5. Critical Build Defect in Commit `6048a3b`

In commit `6048a3b` (`files udavla`), collaborator Dhruv Nayak executed a git deletion of three files:
- `src/lib/demo-data.ts`
- `src/lib/lovable-error-reporting.ts`
- `public/favicon.ico`

However, `src/components/polarops.tsx` (line 7) still explicitly imports from `@/lib/demo-data`:
```typescript
import {
  demoActivities,
  demoAlerts,
  demoCapabilities,
  demoDependencies,
  demoG02,
  demoMetrics,
  demoOfflineState,
  demoReports,
  demoResources,
  demoScenarios,
  demoStationData,
  demoSyncQueue,
  demoTimeline,
  topologyNodes
} from "@/lib/demo-data";
```

Because `demo-data.ts` was deleted, running `npm run build` or `vite build` on the integration branch immediately fails with:
`[vite] Rollup failed to resolve import "@/lib/demo-data" from "src/components/polarops.tsx"`.
This defect must be addressed before any build or visual verification can occur.
