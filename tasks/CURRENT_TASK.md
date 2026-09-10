# Current Task

## Task ID
TASK-RISK-INTELLIGENCE-2.0 — Deterministic Risk Intelligence 2.0 & Multi-Layer Operational Reasoning Engine (Person A)

## Context
Evolve the existing deterministic composite risk engine from *"This asset has a high risk score"* into **Risk Intelligence 2.0**:
*"This asset has a high risk score because of these conditions, these dependencies, these constraints, and these operational exposures, and the risk changes under these conditions."*
Transform PolarOps into an operational reasoning system grounded in structured station facts, deterministic BFS graph traversal, inventory records, weather coupling, and bounded scenario projections—with zero black-box ML, zero LLM, and 100% data honesty.

## Objective
Implement 4 core layers in the deterministic risk engine:
1. **Layer 1 — Current Risk**: Deterministic score (0–100) and operational state transition ladder (`NOMINAL` → `WATCH` → `ELEVATED` → `HIGH` → `CRITICAL`) with explicit trigger facts.
2. **Layer 2 — Risk Drivers**: Ranked matrix of contributors (factor, score, max_score, severity, evidence, threshold, trend, derivation rule, provenance).
3. **Layer 3 — Risk Projection**: Deterministic scenario evolutions (72h outage, cold snap, resupply delay, degraded comms) clearly distinguished from current risk with `[SCENARIO]` label.
4. **Layer 4 — Risk Concentration & Exposures**: Topological concentration from BFS traversal, Failure Exposure, Recovery Exposure, Environmental Amplification, and Operational Headroom.
Upgrade `RiskEngineCard.tsx` and `ExplanationDrawer.tsx` to present this multi-layer reasoning hierarchy while preserving existing layout density, Light/Dark modes, and backward-compatible test hooks. Ensure multi-station grounding: Bharati G-02 critical case vs. Maitri nominal fleet case.

## Relevant Docs
- [AGENTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/AGENTS.md)
- [PRD.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/product/PRD.md)
- [ARCHITECTURE.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/ARCHITECTURE.md)
- [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md)
- [DATA_MODEL.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/DATA_MODEL.md)

## In Scope
- Backend Pydantic schemas in `backend/app/schemas/asset.py` (`RiskDriverItem`, `FailureExposureItem`, `RecoveryExposureItem`, `EnvironmentalAmplificationItem`, `OperationalHeadroomItem`, `RiskConcentrationItem`, `RiskProjectionItem`, `RiskStateTransitionItem`).
- Backend domain logic in `backend/app/services/risk_service.py` to calculate all layers, exposures, and projections deterministically.
- Backend unit and integration pytest suite in `backend/tests/test_risk_intelligence.py`.
- Frontend API contracts in `frontend/src/lib/api.ts`.
- Upgraded `RiskEngineCard.tsx` rendering all 4 layers, exposures, and projections in both Light & Dark modes.
- Extended `ExplanationDrawer.tsx` presenting the causal reasoning chain.
- Playwright E2E test suite in `frontend/tests/e2e/risk_intelligence.spec.ts`.
- Official Playwright MCP visual inspection at 1440x900 in Light and Dark themes.

## Out of Scope
- No Person B work (no auth, no CI/CD pipelines, no cloud provisioning).
- No LLMs, black-box ML, or probabilistic failure predictions.
- No redesign of the high-density layout.
- No touching of the unrelated `polarops.vercel.app`.

## Status
CONVERGED — All acceptance criteria met, backend pytest suite (76/76) passed, Playwright E2E suite passed, production build succeeded, and official Playwright MCP headed visual verification verified at 1440x900 across Light and Dark themes.

## Verification Summary
- **Pytest**: 76 passed in 6.02s (`backend/tests/test_risk_intelligence.py` + full test suite).
- **Playwright Test**: `risk_intelligence.spec.ts` (3/3 passed), `asset_intelligence.spec.ts` (7/7 passed), `operational_intelligence.spec.ts` (3/3 passed).
- **Build**: `npm run build` completed in 833ms with 0 errors.
- **Playwright MCP**: Visual inspection confirmed at 1440×900 in Light and Dark themes. Multi-layer reasoning, ranked drivers, state transition ladder, failure/recovery exposures, environmental amplification, headroom metrics, scenario projections, and Maitri nominal state verified.
