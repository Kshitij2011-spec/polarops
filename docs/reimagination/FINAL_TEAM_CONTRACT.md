# PolarOps Final Team Working Contract & Engineering Governance

**Author:** Kshitij Parkhe (Product Owner & System Integration Lead)  
**Contributors:** Dhruv (Twin Lead), Tanvi (Decision Lead)  
**Date:** September 2026  
**Status:** AUTHORITATIVE & FINAL  
**Repository Branch:** `reimagine/product-blueprint`  
**Baseline:** `5c692ec` (`baseline/phase4-5c692ec`)  
**Target Repository Artifact:** `docs/reimagination/FINAL_TEAM_CONTRACT.md`

---

## 1. Team Ownership & Non-Overlapping Boundaries

To guarantee that three developers can work concurrently without Git merge chaos, directory ownership is strictly isolated:

```mermaid
classDiagram
    class Kshitij_Product_Lead {
        +Global Command Shell (Header, Navigation, Omnibar)
        +Persistent Context Engine (StationContext)
        +Design Tokens & Polaris Industrial CSS
        +Workspace 1: Command + Digital Twin Integration
        +Root Mission Gateway (/) & Router Architecture
        +End-to-End System Safety & Release QA
    }
    class Dhruv_Twin_Lead {
        +features/twin/ (All components)
        +Living Systems Topology DAG
        +Contextual Asset Inspector (380px)
        +50-pt SVG Telemetry Sparklines
        +6-Factor Risk Intelligence 2.0 Ladder
        +2D Spatial/Isometric Architectural Schematic
    }
    class Tanvi_Decision_Lead {
        +features/decision/ (Incident COP & What-If Sandbox)
        +features/continuity/ (Fuel, Energy, Warehouse, Resilience)
        +Route: /cockpit (Workspace 2)
        +Route: /continuity (Workspace 3)
        +Edge Resilience 7-Stage State Machine & Checksums
        +Institutional Memory Archive (/memory)
    }

    Kshitij_Product_Lead --> Dhruv_Twin_Lead : Delivers Shell, Navigation & Context
    Kshitij_Product_Lead --> Tanvi_Decision_Lead : Delivers Shell, Navigation & Context
    Dhruv_Twin_Lead --> Tanvi_Decision_Lead : Interoperates via URL & API Contracts
```

---

## 2. Directory & Route Allocation Matrix

| Developer | Dedicated Implementation Directory | Dedicated Route Files | Dedicated API Client Files | Shared / Protected Files |
|---|---|---|---|---|
| **Kshitij** | `frontend/src/components/shell/*`<br>`frontend/src/components/command/*`<br>`frontend/src/context/*` | `frontend/src/routes/__root.tsx`<br>`frontend/src/routes/index.tsx`<br>`frontend/src/routes/twin.tsx` | `frontend/src/lib/api/client.ts`<br>`frontend/src/lib/api/station.ts`<br>`frontend/src/lib/api/explain.ts`<br>`frontend/src/lib/api/index.ts` | Owns `__root.tsx`, `StationContext.tsx`, and design token CSS. |
| **Dhruv** | `frontend/src/features/twin/*` | Sub-views mounted in `/twin` | `frontend/src/lib/api/twin.ts` | Consumes `StationContext`; imports shared design tokens. |
| **Tanvi** | `frontend/src/features/decision/*`<br>`frontend/src/features/continuity/*` | `frontend/src/routes/cockpit.tsx`<br>`frontend/src/routes/continuity.tsx` | `frontend/src/lib/api/decision.ts`<br>`frontend/src/lib/api/resources.ts`<br>`frontend/src/lib/api/resilience.ts`<br>`frontend/src/lib/api/incidents.ts`<br>`frontend/src/lib/api/memory.ts`<br>`frontend/src/lib/api/science.ts` | Consumes `StationContext`; imports shared design tokens. |

**Golden Rule:** No developer touches another developer's dedicated feature directory without explicit prior coordination.

---

## 3. Git Branching & Merge Protocol

1. **`main` is Protected:** Direct commits or force-pushes to `main` are **STRICTLY FORBIDDEN**.
2. **`baseline/phase4-5c692ec` is Immutable:** Permanently points to commit `5c692ec`. Serves as the ultimate recovery anchor.
3. **Feature Branches:**
   - Kshitij: `reimagine/kshitij-product`
   - Dhruv: `reimagine/dhruv-twin`
   - Tanvi: `reimagine/tanvi-decision`
   - Architecture Truth: `reimagine/product-blueprint`
4. **Integration Merge Discipline:** Feature branches merge into `reimagine/product-blueprint` via verified Pull Requests following phase acceptance testing.

---

## 4. Engineering Verification Gates

Every pull request must pass **Four Automated Verification Gates** before merge approval:

1. **Backend Regression Gate:** All 95 backend unit and API tests must pass: `pytest backend/tests`.
2. **E2E Automation Gate:** Playwright automated test suite for the modified workspace must pass: `npm run test:e2e`.
3. **Compilation & Lint Gate:** `npm run build` must complete with zero TypeScript (`tsc --noEmit`) errors and zero lint warnings.
4. **Data Honesty Gate:** Every rendered metric must include explicit provenance metadata (`source`, `timestamp`, `truth_type`). Synthetic test data must never masquerade as measured telemetry.

---
