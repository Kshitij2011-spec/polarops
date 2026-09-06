# System Architecture & Tech Stack Lock

## 1. System Overview

PolarOps is built as an edge-capable, local-first operational digital twin platform for Indian Antarctic Research Stations.

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│         React 18 + TypeScript + Vite + Tailwind CSS             │
│         (Command Center, Dependency View, Incident UI)          │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST API (JSON + Provenance Meta)
┌────────────────────────────────▼────────────────────────────────┐
│                      Backend Application                        │
│                     FastAPI (Python 3.11+)                      │
│  ┌────────────────────┬────────────────────┬─────────────────┐  │
│  │ Dependency Engine  │ Risk & Telemetry   │ Scenario Engine │  │
│  │ (Relational BFS)   │ Scoring Service    │ Simulator       │  │
│  └────────────────────┴────────────────────┴─────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ SQLAlchemy v2 / Supabase Client
┌────────────────────────────────▼────────────────────────────────┐
│                        Data Layer                               │
│              PostgreSQL / Supabase (Local / Remote)             │
│        (Entities, Telemetry Logs, Work Orders, Sync Queue)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Decision Rationale

| Technology | Role | Why Chosen | Alternative Rejected | What It Does NOT Do |
| :--- | :--- | :--- | :--- | :--- |
| **React + TypeScript + Vite** | Frontend presentation & interaction layer | Fast HMR, strong typing, component reusability, rapid developer feedback loop | Next.js / Angular | Does NOT perform domain risk scoring or dependency calculations. |
| **Tailwind CSS + Lucide + shadcn/ui** | Styling & UI component library | High visual polish, rapid layout composition, dark-mode polar theme aesthetics | Material UI / Bootstrap / Plain CSS | Does NOT handle state management or business logic. |
| **FastAPI + Python** | Backend API, domain logic & scenario simulation | Native Pydantic validation, async REST support, concise data modeling, python math/graph ease | Node.js Express / Django / Flask | Does NOT directly control physical hardware or SCADA devices. |
| **PostgreSQL / Supabase** | Primary relational persistence & local store | Robust foreign keys, JSONB support, built-in RLS security, local-first/cloud flexibility | Neo4j / MongoDB / Redis | Does NOT execute graph algorithms natively inside DB; relies on clean Python BFS queries. |
| **TanStack Query (React Query)** | Client-side async data fetching & caching | Automatic cache invalidation, loading/error states, offline refetch resilience | Redux Thunk / Raw useEffect | Does NOT replace local component UI state (Zustand/React Context). |
| **Zod** | Frontend runtime validation | Type-safe form & API payload validation matching TypeScript interfaces | Yup / Joi | Does NOT validate backend domain logic. |
| **Pydantic v2** | Backend data validation & schema definitions | High-performance Rust-backed validation, seamless OpenAPI generation | Marshmallow / dataclasses | Does NOT persist state to disk automatically. |
| **pytest + Playwright** | Testing framework (Unit, API, E2E) | Fast Python unit testing, real browser automation for operational workflows | Selenium / Cypress / Jest | Does NOT replace continuous manual visual checks during development. |

---

## 3. Architecture Correction — Graph Dependency Processing

> **Architectural Decision**: NetworkX graph library is **REMOVED** as a strict dependency requirement.

### Rationale
The station's physical dependency structure (Assets → Subsystems → Services → Zones) is inherently tree-like and DAG-structured with predictable depth (typically <10 hops). Introducing NetworkX or Neo4j adds unnecessary serialization overhead and external dependencies without functional benefit.

### Selected Approach
1. **Data Layer**: Dependencies are stored in PostgreSQL relational table `AssetDependency` (`parent_asset_id`, `child_asset_id`, `dependency_type`, `impact_factor`, `is_redundant`).
2. **Domain Service Layer**: Python backend service (`dependency_service.py`) executes standard Breadth-First Search (BFS) / Depth-First Search (DFS) algorithms over SQLAlchemy models to calculate root causes and blast-radius nodes.
3. **Presentation Layer**: Frontend renders graph nodes and directional edges using SVG / HTML Canvas components.

---

## 4. Subsystem Boundaries

### A. Telemetry & Data Honesty Engine
Consumes sensor readings and tags every record with `source`, `timestamp`, `freshness_seconds`, `quality`, `truth_type` (`MEASURED`, `DERIVED`, `FORECAST`, `SCENARIO`), and `confidence`.

### B. Relational Dependency Engine
Traverses `AssetDependency` table to derive upstream root causes and downstream affected services when an asset degrades.

### C. Explainable Risk Engine
Combines single-asset health metrics, dependency weightings, redundancy factors, and harsh weather indices into transparent, explainable risk scores (0–100).

### D. What-If Scenario Simulation Engine
Executes non-destructive in-memory simulations of operational disruptions (e.g. generator shutdown, fuel line leak, comms blackout). Generates projected state transitions and recommended operational countermeasures.

### E. Offline / Priority Sync Simulation Layer
Simulates edge-station operational continuity during satellite comms outages. Queues operational events locally with priority weights, generating SHA-256 checksums for reconciliation upon link restoration.

---

## 5. Production Edge vs. MVP Simulation Architecture

```text
PRODUCTION ARCHITECTURE (Future Target):
Station Sensors/PLC → Station Edge Gateway → Local SQLite/PG → Local Sync Queue → Satellite Link → HQ Cloud

MVP ARCHITECTURE (Current Locked Project):
Simulated Telemetry Engine → FastAPI Backend (Local) → PostgreSQL/Supabase → React Frontend UI
                                   ↑
                           Local Queue Simulator
```

---

## 6. Conceptual Production Evolution Path

```text
Station Systems
      ↓
Integration / Edge Gateway
      ↓
Validation + Provenance Metadata
      ↓
Canonical Station Model
      ↓
Operational Digital Twin
      ↓
Events + Time + Dependencies
      ↓
Analytics + Scenario Engine
      ↓
Decision Support UI
      ↓
Human Operator Decision
```
