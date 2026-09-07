# Current Task

## Task ID
TASK-DAY-3-CROSS-DOMAIN-SCENARIOS — Cross-Domain Operational Impact & Scenario Coupling Engine

## Context
Extend the existing scenario engine into a genuine Cross-Domain Operational Impact & Scenario Coupling Engine. Operators can evaluate hypothetical station disruptions (e.g. *Generator G-02 offline for 24h / 48h / 72h during an ambient cold snap*) along the complete cross-domain causal chain:
`ASSET DISRUPTION → GENERATION CAPACITY → THERMAL / ENVIRONMENTAL LOAD → RESERVE MARGIN → CRITICAL SERVICES → RISK ESCALATION → RECOVERY & LOGISTICS CONSTRAINTS → OPERATIONAL OPTIONS`.

## Objective
Implement coupled domain calculation in `scenario_service.py` integrating energy balance, cold-snap thermal demand, reserve margins, spare parts stockouts (SK-402), work order blocking, and expedition resupply vessel windows. Publish canonical `SCENARIO_EVALUATED` operational events to `EventLog`. Implement multi-domain scenario explainability in `explainability_service.py` (`/explain/scenarios/{id}`). Update frontend `ScenariosView.tsx` with Cross-Domain Energy Reserve Margin gauge bar, Recovery Constraints panel, and "WHY? Explain Disruption" drawer button. Implement automated test suites and complete Playwright verification.

## Relevant Docs
- [AGENTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/AGENTS.md)
- [DESIGN.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/DESIGN.md)
- [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md)
- [DATA_MODEL.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/DATA_MODEL.md)

## In Scope
- **Cross-Domain Calculation Engine**:
  - Coupled `scenario_service.py` with `energy_service.py` (`calculate_energy_balance`) and `resource_service.py` (`get_asset_recovery_exposure`).
  - Added deterministic modeling of cold-snap temperature sensitivity ($5.2\text{ kW/}^\circ\text{C}$ thermal heating demand, $2.5\text{ kW/}^\circ\text{C}$ electrical heat tracing below $-20^\circ\text{C}$).
  - Computed available generation capacity, projected load, reserve margin kW, and reserve margin percentage.
  - Coupled logistics blockers: Rotary Seal Kit SK-402 stockout (0 units, BLOCKING), maintenance work order MWO-2026-089 blocked, and MV Vasiliy Golovnin expedition vessel resupply window (≈ 11.0 days).
  - Published canonical `SCENARIO_EVALUATED` event into `EventLog` with truth type `SCENARIO`.
- **Explainability Layer Extension**:
  - Implemented `explain_scenario` in `explainability_service.py` registered for domain `"SCENARIO"` / `"SCENARIOS"`.
  - Explains 6-stage causal chain: What changed, why it matters, evidence (capacity, margin, demand, burn rate), downstream service impacts, recovery constraints, and advisory next steps.
- **Frontend Scenario Experience**:
  - Updated `ScenarioSimulateResponse` TypeScript interface in `api.ts`.
  - Enhanced `ScenariosView.tsx` with Cross-Domain Energy Reserve Margin KPI grid and visual load-vs-reserve gauge bar.
  - Added Recovery Constraints panel highlighting logistics & supply chain bottlenecks.
  - Added "WHY? Explain Disruption" button opening the Explanation Drawer.
  - Connected `onOpenExplanation` in `App.tsx`.
- **Automated Testing & Browser Verification**:
  - 56 of 56 backend Pytest tests passing (added `test_day3_scenarios_cross_domain.py`).
  - 48 of 48 Playwright E2E tests passing (added `day3_cross_domain_scenarios.spec.ts`).
  - Playwright visual inspection at 1440x900 in Light and Dark themes, with full page, scrolled panels, and explanation drawer captures.

## Out of Scope
- Zero LLM, chatbot, embeddings, vector database, or non-deterministic AI.
- No autonomous physical actuation (all scenario outputs are advisory).
- No database mutation of physical station entities during what-if simulations.

## Status
CONVERGED

## Verification Summary
- **Backend Test Suite**: 56 of 56 pytest tests passing (`python -m pytest tests/ -q`).
- **Playwright E2E Test Suite**: 48 of 48 Playwright tests passing (`npx playwright test`).
- **TypeScript & Production Build**: `npm run build` (`tsc -b && vite build`) built in 1.64s with zero errors.
- **Browser Visual Verification**: Verified parameter controls, impact deltas, reserve margin gauge bar, recovery constraints, and explanation drawer in Light and Dark themes.
