# PolarOps — Production Safety & Deployment Isolation Audit
**Phase 0 Output · Document 8 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Production Safety Questions & Answers

### 1. What currently serves the production frontend?
- **Host:** Vercel
- **Live URL:** `https://polarops-two.vercel.app/`
- **Vercel Project:** `polarops` (`prj_M28rMMZdeyAfaWwAhyScuPTWqPPy`)
- **Root Directory Setting:** `frontend`
- **Build Output Directory:** `frontend/dist`
- **Build Command:** `npm run build` (`tsc -b && vite build`)

### 2. What currently serves the production API?
- **Host:** Render Web Service
- **Live API URL:** `https://polarops-api.onrender.com/`
- **Render Service Name:** `polarops-api` (defined in `render.yaml`)
- **Runtime:** Python 3.11.12 with Uvicorn
- **Start Command:** `alembic upgrade head && python -m app.core.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Database:** Managed PostgreSQL instance `polarops-db`

### 3. How does the current frontend reach the backend?
- **Production (Vercel):** The frontend issues HTTP requests to `/api/*`. `frontend/vercel.json` contains a rewrite rule:
  ```json
  { "source": "/api/(.*)", "destination": "https://polarops-api.onrender.com/$1" }
  ```
  Vercel proxies the request server-side, stripping the `/api` prefix and forwarding directly to the Render endpoint (e.g., `/api/station/overview` → `https://polarops-api.onrender.com/station/overview`).
- **Local Development:** `frontend/vite.config.ts` proxies `/api` requests to `http://127.0.0.1:8000`, also stripping the `/api` prefix via `rewrite: (path) => path.replace(/^\/api/, '')`.

### 4. Which branch deploys to production?
- Both Vercel and Render are connected to `origin/main`.
- Any commit pushed to `origin/main` triggers an automatic production rebuild on Vercel and Render.
- `origin/integration/polarops-insight` is **NOT** connected to the production deployment pipelines.

### 5. Will development of the new frontend affect production?
- **NO**, as long as development strictly remains isolated on branch `integration/polarops-insight`.
- **CRITICAL WARNING:** If `integration/polarops-insight` were merged into `main` in its current state, **PRODUCTION WOULD IMMEDIATELY SUFFER CATASTROPHIC FAILURE**:
  1. The Vercel build would fail because the `frontend/` directory was deleted.
  2. The TanStack Start SSR configuration at repo root requires a Node/Nitro serverless runtime that is incompatible with the existing Vercel static SPA configuration.
  3. The broken import `@/lib/demo-data` would halt compilation.

### 6. What files are shared between old and new frontend?
- Currently on `integration/polarops-insight`: **Zero files are shared**, because commit `3bb83fe` deleted the entire `frontend/` folder.
- Both frontends intend to share:
  - `backend/` API routes and PostgreSQL database
  - `render.yaml` infrastructure configuration
  - Conceptual design tokens and PolarOps domain entities

### 7. Could a frontend refactor accidentally alter the old frontend?
- On branch `main`: No, `main` is completely untouched.
- On branch `integration/polarops-insight`: The old frontend was already deleted by collaborator commits. To maintain safety, we must restore `frontend/` on the integration branch and house the new frontend cleanly inside `frontend/` rather than at the root.

### 8. Could a backend change affect both frontends?
- Yes. If any backend endpoint, schema, or route parameter were modified, it could cause regressions in the approved frontend.
- **Rule:** The backend is frozen and protected. **Zero backend code changes** are permitted unless an explicit gap is discovered that cannot be resolved in the presentation layer.

### 9. What is the safest isolation strategy?
- **Option C (Unified Frontend Directory with Dual-Mode or Clean Migration):**
  1. Keep all integration changes strictly on `integration/polarops-insight`.
  2. Restore the `frontend/` directory structure so that Vite, TypeScript, Playwright, and Vercel configs remain standard and functional.
  3. Place the new Insight UI inside `frontend/src/` (reusing the proven `api.ts` client and query hooks).
  4. Never push to `main` or trigger a production deploy until all 14 Acceptance Criteria and 63+ E2E tests are 100% green.

---

## 2. Protected Baseline Checklist

The following items are officially classified as **PROTECTED**:

- [x] Existing production frontend codebase (`main:frontend/`)
- [x] Existing production backend codebase (`backend/`)
- [x] Existing PostgreSQL database models and migrations (`backend/app/models/`, `backend/alembic/`)
- [x] Deterministic 6-factor risk scoring engine (`risk_service.py`)
- [x] Deterministic BFS dependency traversal (`dependency_service.py`)
- [x] In-memory scenario simulation engine (`scenario_service.py`)
- [x] Store-and-forward priority queue & SHA-256 verification (`sync_service.py`)
- [x] Telemetry provenance classification (`TruthType`, `ProvenanceSchema`)
- [x] Production deployment configuration (`render.yaml`, `frontend/vercel.json`)
- [x] Vercel Web Analytics integration (`@vercel/analytics`)
- [x] Anonymous visitor alert service (`visitor.py`, `visitor_session_service.py`, `mailgun_service.py`)
- [x] Existing 95 backend pytest tests and 63 frontend Playwright tests
