# Engineering Standards & Guidelines

## 1. Code Quality & Design Principles

### Small Cohesive Modules
- Limit file sizes to <300 lines where practical. Split large components or domain functions into clear, single-responsibility modules.
- Use explicit descriptive naming (`calculate_fuel_runway_days` rather than `calc_runway`).

### Strong Typing & Schema Enforcement
- **Frontend**: Full TypeScript strictly configured. No `any` types. Define explicit types/interfaces for all API contracts in `types/`.
- **Backend**: Pydantic models for request/response validation and domain schemas. Explicit return type annotations on all FastAPI handlers and domain functions.

### Single Source of Truth
- Business logic (risk calculation, dependency graph traversal, scenario simulation, fuel consumption forecasting) must live exclusively in backend python domain services (`backend/app/services/`).
- Frontend components consume calculated results and focus strictly on rendering UI and handling user interaction.

## 2. Dependency Management
- **Audit Before Add**: Verify whether existing standard library or already-installed tools solve the problem before adding npm/pip packages.
- **Lightweight Preference**: Prefer lightweight, well-maintained libraries (e.g. Lucide, Tailwind, Pydantic, NetworkX, Vitest, Playwright).
- **No Speculative Infrastructure**: Do not introduce message brokers, caching daemons, or heavy databases unless explicitly required by the project roadmap.

## 3. Data Honesty Standards
- **Never Synthesize Without Tagging**: Any simulated sensor value or generated dataset must be explicitly tagged with `truth_type: "MEASURED" | "DERIVED" | "FORECAST" | "SCENARIO"`.
- **No Hardcoded Telemetry in UI**: UI must fetch telemetry and state from backend APIs or local mock providers structured with provenance metadata.
- **Uncertainty Propagation**: If a sensor's quality is `DEGRADED` or `INVALID`, downstream health scores must reflect reduced confidence.

## 4. Security & Environment Safety
- **No Exposed Secrets**: Never check API keys, passwords, or service-role JWTs into source control.
- **Environment Variables**: Use `.env` with a corresponding `.env.example` template detailing required configuration variables.
- **Frontend Safety**: Client applications must only access public or user-scoped API keys; service-role admin keys remain strictly backend-side.

## 5. Testing & Verification Standards
- **Backend**: Unit test domain logic and risk engines with `pytest`.
- **Frontend**: Test UI components and E2E operational workflows with `Playwright`.
- **Validation Gate**: Before completing any milestone, verify application startup and clean build checks (`tsc`, `vite build`, `pytest`).
