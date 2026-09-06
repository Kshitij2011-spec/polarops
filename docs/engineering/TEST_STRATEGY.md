# Test Strategy & Quality Assurance Plan

This document establishes the testing strategy, test pyramid, automated validation requirements, and Playwright verification architecture for PolarOps.

---

## 1. The Test Pyramid

```text
               ┌───────────────────────────┐
               │    Manual Verification    │  (Supplementary browser visual check)
               ├───────────────────────────┤
               │   Playwright E2E Tests    │  (CANONICAL: Smoke & Journeys A, B, C, D)
               ├───────────────────────────┤
               │     FastAPI API Tests     │  (Endpoints & HTTP response contracts)
               ├───────────────────────────┤
               │     Python Unit Tests     │  (Domain engines, BFS math, sync queue)
               └───────────────────────────┘
```

---

## 2. Playwright Browser Architecture

Browser verification in PolarOps is strictly divided into two distinct, non-overlapping mechanisms:

### A. Playwright Test (`@playwright/test`) — Canonical Automated Regression
The authoritative framework for regression, deterministic assertion suites, and pass/fail gate checks.
- **Command**: `npm run test:e2e` (or `npm run test:e2e:ui` for local UI runner)
- **Configuration**: `frontend/playwright.config.ts`
- **Test Suites**: `frontend/tests/e2e/*.spec.ts` (Smoke, Command Center, Asset Intelligence, Scenarios)
- **Execution**: Automated headless Chromium testing with automatic server startup (`webServer`) for FastAPI backend and Vite frontend.
- **Rule**: Every UI task must pass the relevant Playwright Test suite before being declared complete. Manual inspection alone is never sufficient.

### B. Playwright MCP (`@playwright/mcp`) — Interactive Visual QA & Debugging
The interactive headed tool used by agents and developers for visual exploration, accessibility snapshotting, and targeted interaction.
- **Server**: Configured via `@playwright/mcp@latest` in `mcp_config.json`.
- **Mode**: Headed execution by default, allowing real-time developer visibility.
- **Capabilities**: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`, `browser_fill_form`.
- **Usage**: Exploratory layout verification, CSS/typography validation, and interactive debugging before codifying automated test specs.
- **Rule**: Playwright MCP is a visual debugging and exploration aid; it does not replace automated Playwright Test regression suites.

---

## 3. Test Execution & Automation Suite

### A. Python Unit Tests (`pytest`)
- **Fuel Runway Calculation**: Test `calculate_fuel_runway(current_stock, burn_rate, ambient_temp)` outputs exact expected days under extreme winter temperatures.
- **Explainable Risk Scoring**: Test risk composite formula given mock vibration anomaly + severe weather multiplier.
- **Dependency Graph BFS Traversal**: Test `get_downstream_blast_radius("G-02")` correctly identifies `THERMAL_LOOP_B` and `HABITAT_HEATING_Z2`.
- **Scenario Simulator**: Test `simulate_asset_shutdown("G-02")` produces valid thermal decay predictions and recommended countermeasures.
- **Sync Priority Ordering**: Test queue sorting algorithm processes `P0` items before `P1` and `P2`.

### B. Backend API Tests (`pytest` + `httpx`)
- `GET /health`: Verify HTTP 200 OK and service identity.
- `GET /station/overview`: Verify HTTP 200 OK and presence of weather & subsystem summary.
- `GET /assets/G-02`: Verify HTTP 200 OK and metric threshold status flags.
- `GET /assets/G-02/dependencies`: Verify downstream impact list contains `HABITAT_HEATING_Z2`.
- `POST /scenarios/simulate`: Verify request payload returns `SIM-2026-001` with recommended actions.
- `POST /incidents`: Verify incident creation persists and returns HTTP 201 Created.
- `POST /resilience/restore`: Verify queue flush returns checksum validation status.

---

## 4. Verification Commands & CI Criteria

Before declaring any milestone complete, all three test gates MUST pass:

```bash
# 1. Backend Unit & API Tests
cd backend && python -m pytest tests/ -v

# 2. Frontend Type Checking & Build Verification
cd frontend && npx tsc -b && npm run build

# 3. Canonical Playwright Browser Verification
cd frontend && npm run test:e2e
```
