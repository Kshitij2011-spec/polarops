---
name: backend-development
description: Focused guidance for FastAPI, Pydantic, domain services, calculation engines, and scenario simulation in PolarOps.
---

# Backend Development Skill

This skill provides focused standards for implementing FastAPI endpoints, Pydantic validation schemas, and core calculation domain services.

---

## 1. Responsibilities & Scope
- **API Endpoints**: Clean, async REST endpoints in `app/api/v1/`.
- **Validation Schemas**: Strict Pydantic v2 schemas defining input payloads and response contracts in `app/schemas/`.
- **Domain Services**: Business logic, dependency graph traversal, risk scoring, scenario simulations, and fuel runway math in `app/services/`.
- **Database Integration**: SQLAlchemy v2 ORM models and repository queries in `app/db/` and `app/models/`.
- **Error Handling**: Standardized HTTP exception responses matching [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md).

---

## 2. Core Implementation Rules
1. **Thin Route Handlers / Thick Domain Services**:
   - Route handlers orchestrate requests, extract parameters, invoke services, and return validated schemas.
   - Route handlers must NEVER contain mathematical calculations, SQL queries, or graph algorithms directly.
2. **Deterministic & Testable Calculations**:
   - Risk scoring, thermal decay modeling, and dependency blast-radius traversals must be pure, deterministic Python functions.
   - Domain functions MUST be independently unit-testable without requiring a running database server or frontend.
3. **Data Honesty & Metadata Injection**:
   - Every returned telemetry or calculation response MUST include standard metadata: `source`, `timestamp`, `freshness_seconds`, `quality`, `truth_type`, and `confidence`.
   - Never label synthetic test data as real measured telemetry.
4. **Relational Graph Traversal**:
   - Traversal of station physical dependencies (Asset → Subsystem → Service → Zone) must use clean Python BFS/DFS algorithms over relational models. Avoid introducing external graph databases or libraries.
5. **Pydantic Validation at System Boundaries**:
   - Validate all incoming request bodies and outgoing responses using Pydantic models. No raw unvalidated dictionaries.

---

## 3. Required Verification for Backend Tasks
Before declaring any backend task complete:
1. **Unit & API Tests**: Run `pytest tests/ -v` (100% pass required).
2. **Lint & Type Check**: Ensure code adheres to clean Python standards and type annotations.
3. **API Contract Alignment**: Verify that response JSON exactly matches [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md).
