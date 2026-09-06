# PolarOps — Antarctic Operational Digital Twin

> SIH 2026 · SIH26060 — Digital Platform for efficient remote management of Indian Antarctic Research Stations.

## Live Production Deployments

- **Frontend UI (Vercel)**: [https://polarops-two.vercel.app](https://polarops-two.vercel.app)
- **Backend API (Render)**: [https://polarops-api.onrender.com](https://polarops-api.onrender.com)
- **Swagger API Docs**: [https://polarops-api.onrender.com/docs](https://polarops-api.onrender.com/docs)
- **GitHub Repository**: [https://github.com/Kshitij2011-spec/polarops](https://github.com/Kshitij2011-spec/polarops)

## What It Is

PolarOps is an operational digital twin for Indian Antarctic research stations (Bharati, Maitri). It provides station commanders and logistics operators with a unified operational picture, dependency-aware risk intelligence, what-if scenario simulation, and communication-resilient operation — even when satellite connectivity is disrupted.

**Core thesis:**

> When something changes at the station, the Digital Twin tells the operator what changed, what it affects, what may happen next, and what can be done about it — even when connectivity is disrupted.

**Core loop:** SENSE → UNDERSTAND → PREDICT → SIMULATE → DECIDE → LEARN

> [!IMPORTANT]
> Current operational data is **synthetic for demonstration**. Production deployment would integrate validated station systems through an edge/integration layer. No real SCADA, satellite modem, or NCPOR telemetry is connected in this prototype.

---

## Core Capabilities

| Pillar | Capability | Route |
|--------|-----------|-------|
| **Unify the Station** | Command Center — Common Operational Picture | `/` |
| **Understand & Predict** | Asset Intelligence — Dependency + Explainable Risk | `/assets/:id` |
| **Understand & Predict** | Resources — Energy, Fuel, Inventory, Resupply | `/resources` |
| **Understand & Predict** | Scenario Engine — What-If Simulation | `/scenarios` |
| **Operate Through Disruption** | Communication Resilience — Offline Queue + Priority Sync | `/resilience` |
| **Operate Through Disruption** | Science Continuity — Observation Buffering | `/resilience` (Science tab) |
| **Operate Through Disruption** | Incident Workspace — Blast Radius + Actions | `/resilience` (Incidents tab) |
| **Operate Through Disruption** | Operational Memory — Human-in-the-Loop Lessons | `/resilience` (Memory tab) |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│         React 19 + TypeScript + Vite + Tailwind v4              │
│         (Command Center, Asset Intelligence, Scenarios,         │
│          Resilience, Incidents, Science, Memory)                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST API (JSON + Provenance Metadata)
┌────────────────────────────────▼────────────────────────────────┐
│                      Backend Application                        │
│                     FastAPI (Python 3.11+)                      │
│  ┌────────────────────┬────────────────────┬─────────────────┐  │
│  │ Dependency Engine  │ Risk & Telemetry   │ Scenario Engine │  │
│  │ (Relational BFS)   │ Scoring Service    │ Simulator       │  │
│  ├────────────────────┼────────────────────┼─────────────────┤  │
│  │ Resilience Service │ Science Service    │ Incident/Memory │  │
│  │ (Offline Queue)    │ (Observation Buf)  │ (Human-in-Loop) │  │
│  └────────────────────┴────────────────────┴─────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ SQLAlchemy v2
┌────────────────────────────────▼────────────────────────────────┐
│                        Data Layer                               │
│     SQLite (local dev) │ PostgreSQL (production / Render)       │
│     Deterministic synthetic Antarctic station dataset            │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Technology | Role |
|-----------|------|
| React 19 + TypeScript + Vite | Frontend SPA |
| Tailwind CSS v4 + Lucide | Styling & icons |
| TanStack Query | Client data fetching & cache |
| Zod | Frontend runtime validation |
| FastAPI + Python 3.11+ | Backend API + domain logic |
| Pydantic v2 | Backend validation & schemas |
| SQLAlchemy v2 | ORM |
| Alembic | Migrations |
| PostgreSQL | Production database |
| SQLite | Local development database |
| Playwright | E2E testing + visual QA |

---

## Local Development

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | Frontend & Playwright |
| npm | ≥ 9 | Package manager |
| Python | ≥ 3.11 | Backend |
| pip | ≥ 23 | Python packages |

### 1. Backend

```powershell
cd backend
cp .env.example .env                # Configure as needed
pip install -r requirements.txt     # Or: pip install -e .
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend available at: `http://127.0.0.1:8000/`  
API docs at: `http://127.0.0.1:8000/docs`

### 2. Frontend

```powershell
cd frontend
cp .env.example .env
npm install
npx playwright install chromium     # One-time browser binary install
npm run dev -- --host 127.0.0.1     # → http://127.0.0.1:5173
```

The Vite dev server proxies `/api/*` requests to the backend at `127.0.0.1:8000`.

---

## Testing

| Action | Command | Working Dir |
|--------|---------|-------------|
| Backend tests | `python -m pytest tests/ -v` | `backend/` |
| Frontend build + typecheck | `npm run build` | `frontend/` |
| Playwright E2E (auto-boots servers) | `npm run test:e2e` | `frontend/` |
| Playwright UI debugger | `npm run test:e2e:ui` | `frontend/` |

### Current Test Status (Day 4)

- **Backend**: 36/36 pytest tests passing
- **Frontend**: Build + TypeScript strict check passing
- **Playwright E2E**: 30/30 tests passing across 5 spec files
- **Playwright MCP**: Interactive visual QA verified

---

## Deployment Architecture

```text
LOCAL DEVELOPMENT:
  React/Vite (5173) → /api proxy → FastAPI (8000) → SQLite

PRODUCTION:
  Vercel (React 19 SPA) — https://polarops-two.vercel.app
      ↓ VITE_API_BASE_URL
  Render (FastAPI Web Service) — https://polarops-api.onrender.com
      ↓ DATABASE_URL
  Render PostgreSQL (polarops_db) — dpg-daequmfqj5pc73aj9pg0-a
```

### Verified Production Endpoints

| Service | Environment | Endpoint URL | Status |
|---------|-------------|--------------|--------|
| **Frontend UI** | Vercel | [https://polarops-two.vercel.app](https://polarops-two.vercel.app) | `200 OK` (Vercel Production) |
| **Backend API Health** | Render | [https://polarops-api.onrender.com/health](https://polarops-api.onrender.com/health) | `200 OK` (`{"status":"ok","service":"polarops-api"}`) |
| **Backend Swagger Docs** | Render | [https://polarops-api.onrender.com/docs](https://polarops-api.onrender.com/docs) | `200 OK` (FastAPI OpenAPI) |
| **Managed Database** | Render PostgreSQL | `polarops-db` (`polarops_db`) | `AVAILABLE` (Alembic Migrated & Seeded) |
| **GitHub Repository** | GitHub | [https://github.com/Kshitij2011-spec/polarops](https://github.com/Kshitij2011-spec/polarops) | `main` branch |

### Render Backend Deployment

1. Connected GitHub repository: `https://github.com/Kshitij2011-spec/polarops`
2. Managed Web Service: `polarops-api`
3. Root directory: `./`
4. Build command: `pip install -r backend/requirements.txt`
5. Start command: `cd backend && alembic upgrade head && python -m app.core.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Environment variables configured:
   - `DATABASE_URL` — Internal PostgreSQL connection string to `polarops-db`
   - `FRONTEND_ORIGIN` — `https://polarops-two.vercel.app` (comma-separated origins supported for preview deploys)
   - `PYTHON_VERSION` — `3.11.12`
   - `DEBUG` — `false`

### Vercel Frontend Deployment

1. Connected GitHub repository: `https://github.com/Kshitij2011-spec/polarops`
2. Managed Project: `polarops`
3. Root directory: `frontend/`
4. Framework preset: Vite
5. Build command: `npm run build`
6. Output directory: `dist`
7. SPA Routing: Configured via `frontend/vercel.json` rewriting `/(.*)` to `/index.html` and proxying `/api/(.*)` to Render backend
8. Environment variables configured:
   - `VITE_API_BASE_URL` — `https://polarops-api.onrender.com`

### Database Environment Configuration

| Environment | DATABASE_URL | Description |
|-------------|-------------|-------------|
| Local dev | `sqlite:///./polarops_dev.db` | Default zero-config local development |
| Production | `postgresql://...` | Managed Render PostgreSQL with canonical Alembic migrations & idempotent seed |

---

## Project Documentation

| Document | Purpose |
|----------|---------|
| [PRD](docs/product/PRD.md) | Product requirements |
| [MVP Scope](docs/product/MVP_SCOPE.md) | Feature priority matrix |
| [Architecture](docs/architecture/ARCHITECTURE.md) | System design |
| [Data Model](docs/architecture/DATA_MODEL.md) | Entity relationships |
| [API Contracts](docs/architecture/API_CONTRACTS.md) | REST endpoint specs |
| [Offline Sync](docs/architecture/OFFLINE_SYNC.md) | Resilience architecture |
| [Test Strategy](docs/engineering/TEST_STRATEGY.md) | QA strategy |
| [Roadmap](tasks/ROADMAP.md) | Build schedule |

---

## Synthetic Data Disclaimer

All station data (Bharati, Maitri) is **deterministic synthetic data** created for demonstration purposes. This includes:

- Station telemetry and environmental readings
- Asset health scores and maintenance records
- Fuel, water, and inventory levels
- Energy generation models
- Communication link simulations
- Scientific instrument observations
- Incident records

**No real NCPOR data, satellite telemetry, or operational station measurements are used.**

Truth badges throughout the UI explicitly mark data provenance: `[MEASURED]`, `[SYNTHETIC DEMO DATASET]`, `[PROTOTYPE RESILIENCE MODEL]`.

---

## Future Work (NOT in current MVP)

1. Real station system/instrument integrations
2. Edge gateway / integration layer
3. Real communications adapters (satellite modem, HF radio)
4. Production-grade offline synchronization
5. Real-time telemetry ingestion
6. Validated Antarctic domain models (NCPOR-reviewed)
7. Historical operational analytics
8. Advanced forecasting models
9. More sophisticated scenario modeling
10. Multi-station federation
11. Authentication / RBAC
12. Audit/security hardening
13. AI-assisted explanation (only after deterministic foundations and validated data are mature)
