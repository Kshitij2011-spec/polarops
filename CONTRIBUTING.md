# Contributing to PolarOps

Thank you for contributing to PolarOps, the Antarctic Research Station Operational Digital Twin developed for the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Government of India.

To maintain mission-critical reliability, architectural clarity, and scientific integrity, all contributors must adhere to the engineering standards and workflows outlined below.

---

## 1. Architectural Boundaries & Ownership

- **Domain Logic Ownership (Backend)**:
  All business logic, mathematical balance models, risk index calculations (0–100), dependency graph BFS blast-radius traversals, and what-if scenario simulations reside strictly in the **FastAPI backend** (`backend/app/services/`).
- **Presentation Ownership (Frontend)**:
  The **React frontend** (`frontend/src/`) is dedicated to presentation, telemetry visualization, spatial schematics, and operator interaction. The UI does not perform ad-hoc domain calculations or synthetic scoring.
- **Data Honesty & Provenance**:
  Every telemetry reading and insight displayed must include provenance metadata (`source`, `timestamp`, `freshness`, `quality`, `truth_type`, `confidence`). Never present synthetic or simulated data as live NCPOR telemetry feeds without clear distinction.
- **Zero Unnecessary Infrastructure**:
  Do not introduce external brokers (Kafka, RabbitMQ), graph databases (Neo4j), or cache layers (Redis) without formal architectural review. SQLite is used for local development; PostgreSQL is used in production.

---

## 2. Local Development Setup

### Prerequisites
- **Node.js**: v20 or v22
- **Python**: 3.11.x
- **Package Managers**: `npm` (frontend) and `pip` (backend)

### Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pytest httpx

# Run database migrations and seed canonical Antarctic telemetry
alembic upgrade head
python -m app.core.seed

# Start FastAPI development server (http://127.0.0.1:8000)
uvicorn app.main:app --reload --port 8000
```
API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (http://localhost:5173)
npm run dev
```
The Vite development server automatically proxies `/api` requests to `http://127.0.0.1:8000`.

---

## 3. Testing & Verification

Every pull request must pass both frontend and backend verification gates before merge:

### Frontend Gates
```bash
cd frontend

# 1. Static linting with oxlint
npm run lint

# 2. Type checking and production build
npm run build

# 3. Playwright end-to-end tests (optional during local dev, required for UI changes)
npm run test:e2e
```

### Backend Gates
```bash
cd backend

# Run complete pytest test suite (95+ unit & integration tests)
pytest -v
```

---

## 4. UI Design & Styling Standards

The PolarOps interface is built for mission-critical command desks operating in extreme environments. Follow these rules:
- **Design System**: Strictly adhere to `docs/architecture/DESIGN.md`.
- **CSS Tokens**: All colors use CSS custom properties defined in `frontend/src/index.css`. Never use arbitrary hardcoded Tailwind colors (e.g. `bg-blue-500` or `text-red-400`); always use semantic tokens (`--bg-primary`, `--accent`, `--status-nominal`, `--status-warning`, `--status-critical`).
- **SCADA Aesthetic**: Avoid SaaS marketing gradients, heavy glassmorphism, or cartoon emojis. Use **Lucide React** stroke icons.
- **Progressive Disclosure**: Structure screens using the cognitive disclosure pattern: *Situation → Meaning → Impact → Constraint → Next Action → Evidence*.

---

## 5. Pull Request Process

1. Create a feature branch off `main` with a descriptive name (`feature/your-feature` or `fix/your-fix`).
2. Ensure all unit tests pass and code builds cleanly without lint warnings.
3. Fill out the pull request description using the `.github/pull_request_template.md`.
4. Include visual evidence (screenshots or recording) for any user-facing UI modifications.
5. All PRs require review and passing GitHub Actions CI before merging.
