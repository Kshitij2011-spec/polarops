# PolarOps Master Integration & Migration Plan

## 1. Overview & Strategy
This plan coordinates the progressive integration of the new PolarOps Insight user experience with the production PolarOps backend without disrupting the protected production baseline on `main`.

---

## 2. Phase Breakdown & Milestones

| Phase | Title | Scope & Objectives | Acceptance Criteria | Status |
|---|---|---|---|---|
| **Phase 0** | Complete System Audit | Full inventory of backend endpoints, frontend capabilities, and contracts. | 10 audit artifacts in `audit/` | ✅ COMPLETE |
| **Phase 1** | Workspace Normalization | House new UI in `frontend/src/`, restore build, remove broken imports, wire real `/health`. | Frontend builds, backend tests 95/95 pass, `/health` real, E2E tests pass. | ✅ COMPLETE |
| **Phase 2** | Command Center | Wire Bharati state, weather, power, critical events, and causal narrative. | Real telemetry, remove mock metrics, loading/error states. | ⏳ NEXT |
| **Phase 3** | Asset Intelligence | Integrate G-02 telemetry trends, 6-factor risk scoring, and driver breakdown. | Real risk calculations, provenance, maintenance blocks. | ⏳ PENDING |
| **Phase 4** | Dependency Graph + Explainability | Implement interactive topology using researched library, blast radius, 5-step drawer. | Live BFS traversal, blast radius isolation, explainability. | ⏳ PENDING |
| **Phase 5** | Resources & Recovery | Wire fuel autonomy, energy model, warehouse spares, resupply windows. | Real inventory, fault-to-spare recovery chain. | ⏳ PENDING |
| **Phase 6** | What-If Scenarios | Connect scenario simulation engine with baseline vs hypothetical deltas. | Real calculation consequences, parameter controls. | ⏳ PENDING |
| **Phase 7** | Human-in-the-Loop Decision Support | Operator advisories, countermeasure reviews, command approval boundary. | No autonomous physical actuation, clear advisory labels. | ⏳ PENDING |
| **Phase 8** | Resilience & Offline | Link status, simulated outage, priority queue (P0-P3), store & forward. | Local storage, reconciliation checksums, sync toggle. | ⏳ PENDING |
| **Phase 9** | Incidents & Memory | Live incident streams, triage actions, operational memory search. | Real incident mutation, past lesson retrieval. | ⏳ PENDING |
| **Phase 10** | Science & Multi-Station | Instrument buffers, Bharati vs Maitri comparison, mutual-aid headroom. | Real station comparison, buffer telemetry. | ⏳ PENDING |
| **Phase 11** | Visitor Alerts & Analytics | Preserve Vercel Analytics, anonymous session tracking, Mailgun alerts. | Visitor session hook active, no leaked credentials. | ⏳ PENDING |
| **Phase 12** | UX Polish & Hardening | Loading skeletons, error boundaries, empty states, keyboard a11y, mobile layout. | 0 console errors, no horizontal overflow. | ⏳ PENDING |
| **Phase 13** | Full Regression | Run full backend pytest and complete Playwright E2E suite. | 95/95 backend, 100% E2E pass. | ⏳ PENDING |
| **Phase 14** | Production-Like Verification | Test with Vercel SPA preview configuration and Render backend. | Proper headers, CORS, rewrites, deep links. | ⏳ PENDING |
| **Phase 15** | Parity Audit | Detailed comparison matrix confirming 100% old capabilities preserved. | `audit/final-capability-parity.md` approved. | ⏳ PENDING |
| **Phase 16** | Final Migration | Merge PR from integration branch to `main`, deploy, verify live. | Clean rollout, zero downtime, rollback tag set. | ⏳ PENDING |

---

## 3. Rollback Policy
- Every phase is encapsulated in an isolated git commit checkpoint.
- The `main` branch remains untouched throughout the integration.
- The existing production frontend on `main` remains deployed and functional at `https://polarops-two.vercel.app/`.
