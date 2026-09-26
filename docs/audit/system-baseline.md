# PolarOps — System Baseline & Repository Safety Audit
**Phase 0 Output · Document 1 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Git Safety Baseline

| Parameter | Recorded Value / State |
|---|---|
| **Active Local Branch** | `integration/polarops-insight` |
| **Active Local Branch HEAD SHA** | `6048a3bd855268aeeb9001c5714fe44083c8a879` |
| **Active Local Branch HEAD Commit** | `6048a3b files udavla` (Author: Dhruv Nayak, 2026-09-24 16:21:31 +0530) |
| **`origin/main` HEAD SHA** | `9e858ebe8de4a3d65057fe6a43878556582261a8` |
| **`origin/main` HEAD Commit** | `9e858eb feat: add privacy-minimal visitor session email alerts` (Author: Kshitij Parkhe, 2026-09-17) |
| **`origin/integration/polarops-insight` SHA** | `6048a3bd855268aeeb9001c5714fe44083c8a879` (Synchronized with local branch) |
| **Merge Base (`main` ↔ `integration`)** | `9e858ebe8de4a3d65057fe6a43878556582261a8` (`integration/polarops-insight` branched off `main` at HEAD) |
| **Working Tree State** | Clean (3 untracked repo-local tools: `.agents/skills/brag/`, `brag-output/`, `skills-lock.json`) |
| **Approved Baseline Rollback Checkpoints** | `v1.0-release-candidate` (`c4842be`), `v0-baseline-approved` (`9e06d8e`), `v0-baseline-pre-implementation` (`9e06d8e`) |

---

## 2. Location & Genesis of the New Frontend

The new frontend **already exists on the integration branch** (`integration/polarops-insight`).  
Its lineage was inspected via `git log 9e858eb..origin/integration/polarops-insight`:

1. `07342b2`: `template: tanstack_start_ts_current-78c8e5169cf8` — Initial scaffold generated via Lovable export (TanStack Start + Nitro SSR template).
2. `ece13a5`: `feat: integrate PolarOps Insight UI` — Addition of PolarOps Insight layout and demo components.
3. `3bb83fe`: `refactor: replace old PolarOps frontend with Insight UI` — **Destructive change:** Deleted the entire `frontend/` directory (where the approved production frontend lived) and placed the new application at repository root (`src/`, `package.json`, `vite.config.ts`, etc.).
4. `42f1fa8`: `feat: merge latest PolarOps Insight frontend changes` — Synchronized additional changes.
5. `6048a3b`: `files udavla` — **Defect commit:** Accidental deletion of `src/lib/demo-data.ts`, `src/lib/lovable-error-reporting.ts`, and `public/favicon.ico`. As a consequence, `src/components/polarops.tsx` has an unresolved import (`@/lib/demo-data`) and currently **fails to compile**.

---

## 3. Production Architecture Mapping

```
                                  [ INTERNET ]
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
        [ VERCEL (Frontend) ]                       [ RENDER (Backend) ]
    https://polarops-two.vercel.app/            https://polarops-api.onrender.com/
           (Project: polarops)                         (Service: polarops-api)
                 │                                             │
                 │ /api/(.*) rewrite                          │
                 └─────────────────────────────────────────────►│
                                                        [ FastAPI Service ]
                                                        (Python 3.11/3.13)
                                                               │
                                                               ▼
                                                     [ RENDER POSTGRESQL ]
                                                       (Database: polarops)
                                                       (23 Domain Tables)
```

### A. Existing Production Frontend
- **Hosting:** Vercel (`https://polarops-two.vercel.app/`)
- **Root Directory in Repository:** `frontend/`
- **Framework:** React 19 + Vite 8 + Tailwind CSS 4 + TanStack Query 5 + Lucide React
- **Entry Point:** `frontend/src/main.tsx` → `frontend/src/App.tsx`
- **Router:** View-state management in `App.tsx` with deep-link hash and browser URL sync
- **Routing Configuration (`frontend/vercel.json`):**
  - Rewrites `/api/(.*)` to `https://polarops-api.onrender.com/$1`
  - Rewrites `/(.*)` to `/index.html` (SPA fallback)
- **Local Dev Proxy (`frontend/vite.config.ts`):** Proxies `/api` to `http://127.0.0.1:8000` with `/api` prefix stripped (`rewrite: (path) => path.replace(/^\/api/, '')`)
- **API Client:** `frontend/src/lib/api.ts` (1,277 lines, 41 endpoint consumers, 100% backend contract coverage)
- **Hooks:** 20 modular hooks in `frontend/src/hooks/`
- **Test Infrastructure:** Playwright E2E (`frontend/playwright.config.ts`), 12 test suites, 63 automated tests (all green on approved baseline)

### B. Existing Production Backend
- **Hosting:** Render Web Service (`https://polarops-api.onrender.com/`)
- **Root Directory in Repository:** `backend/`
- **Specification:** `render.yaml`
- **Runtime:** Python 3.11.12 / 3.13
- **Entry Point:** `backend/app/main.py` (`app = FastAPI(...)`)
- **Lifespan Startup:** `alembic upgrade head && python -m app.core.seed && uvicorn app.main:app`
- **Health Check Endpoint:** `/health`
- **Database:** Managed PostgreSQL instance (`polarops-db`, database name `polarops`)
- **Routers:** 13 registered APIRouters (Health, Station, Assets, Resources, Scenarios, Resilience, Science, Incidents, Memory, Events, Explainability, Intelligence, Visitor)
- **Test Suite:** `backend/tests/` with 95 passing pytest tests (100% pass rate in 8.29s)

---

## 4. Protected Assets Summary

The following components represent the frozen, validated production baseline and must **never** be disturbed during integration:

1. **`backend/` Directory:** All routes, models, schemas, services, migrations, and database seeders.
2. **`render.yaml` & Render Service Configuration:** Production database connection strings and environment variables.
3. **Approved Production Frontend:** The complete `frontend/` structure on `main`, including its 63 Playwright tests, component hierarchies, and Vercel deployment configuration.
4. **Deterministic Domain Engines:** BFS graph traversal (`dependency_service.py`), 6-factor composite risk scoring (`risk_service.py`), energy balance calculations (`energy_service.py`), and offline priority reconciliation (`sync_service.py`).
5. **Data Provenance System:** Telemetry provenance annotations (`MEASURED`, `DERIVED`, `FORECAST`, `SYNTHETIC_SIMULATION`, `ADVISORY`).
