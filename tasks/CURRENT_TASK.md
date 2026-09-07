# Current Task

## Task ID
TASK-DAY-4-MULTI-STATION-PORTFOLIO — Multi-Station Operational Coordination + Security Hardening + Approved Frontend Preservation

## Context
Expand PolarOps from single-station situational awareness into a Multi-Station Operational Coordination System (comparing Bharati and Maitri stations) while strictly preserving the approved, high-information-density frontend design (`https://polarops-two.vercel.app/`), maintaining 100% deterministic decision-support logic with zero autonomous actuation, and upholding strict credential hygiene.

## Objective
Implement deterministic cross-station operational comparison, operational capabilities (headroom scoring), difference engine, coordination constraints (3,000 km distance, blizzard window, comms asymmetry), and non-actuating advisory considerations. Extend Day 3 scenario engine to simulate cross-station disruption coupling. Extend Day 2 explainability layer with 8-stage causal reasoning. Embed a compact Cross-Station Context Card into Command Center without removing any existing content, and add a dedicated `/stations` workspace. Conduct full automated testing, headed Playwright MCP visual verification, and deploy to Render and Vercel.

## Relevant Docs
- [AGENTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/AGENTS.md)
- [DESIGN.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/DESIGN.md)
- [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md)
- [DATA_MODEL.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/DATA_MODEL.md)

## In Scope
- **Security & Credential Hardening**:
  - Verify zero exposed bearer tokens or credentials in source, git history, or documentation.
  - Deployments via GitHub Git integration.
- **Backend Multi-Station Architecture**:
  - `OperationalEventType.CROSS_STATION_ANALYSIS` enum.
  - Canonical idempotent seed data for `STATION-MAITRI` (assets, energy resource 198k L, weather -18.2°C, 2 SK-402 spares).
  - Pydantic schemas in `station.py` for portfolio items, capabilities, differences, constraints, and considerations.
  - `get_station_comparison` in `station_service.py` computing headroom and difference engine.
  - `simulate_cross_station_coordination` in `scenario_service.py` with `CROSS_STATION_ANALYSIS` event logging.
  - 8-stage causal explainability in `explainability_service.py`.
  - API routes: `GET /station/comparison` and `POST /scenarios/cross-station`.
- **Approved Frontend Preservation & UI Integration**:
  - Preserve all existing views, cards, themes, and information density without simplification.
  - Add compact Cross-Station Context Card to Command Center (`App.tsx`).
  - Add dedicated `/stations` workspace tab and route (`StationsView.tsx`).
  - Wire Explanation Drawer for cross-station explainability.
- **Automated Testing & Browser Verification**:
  - Backend pytest tests in `test_day4_multi_station.py` (56 baseline + new tests).
  - Playwright E2E tests in `day4_multi_station.spec.ts` (48 baseline + new tests).
  - Headed Playwright MCP visual verification at 1440×900 and 1024×768 across Light and Dark themes.

## Out of Scope
- No autonomous physical actuation or fake physical resource transfers.
- No redesign, simplification, or deletion of existing frontend components.
- No modification to the unrelated `polarops.vercel.app` external project.
- No LLMs, RAG, vector databases, or non-deterministic AI.

## Status
IN_PROGRESS

## Verification Summary
- Baseline: 56 pytest tests passing, 48 Playwright tests passing.
