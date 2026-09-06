---
name: testing-and-qa
description: Focused guidance for unit testing, API test suites, Playwright E2E automation, and verification gates in PolarOps.
---

# Testing and QA Skill

This skill provides mandatory standards for writing and executing automated tests across the PolarOps test pyramid according to [TEST_STRATEGY.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/engineering/TEST_STRATEGY.md).

---

## 1. Test Levels & Responsibilities

```text
               ┌───────────────────────────┐
               │   Playwright E2E Tests    │  (Operational User Journeys A, B, C, D)
               ├───────────────────────────┤
               │     FastAPI API Tests     │  (REST Endpoints, JSON Shapes, Status Codes)
               ├───────────────────────────┤
               │     Python Unit Tests     │  (Pure Domain Math, Risk Engine, Graph BFS)
               └───────────────────────────┘
```

---

## 2. Core Implementation Rules
1. **Meaningful Tests Over Vanity Metrics**:
   - Write tests that protect core operational logic and critical user journeys.
   - Do not create dozens of trivial tests merely to inflate test counts.
2. **Unit Test Coverage Targets**:
   - Pure domain algorithms MUST have dedicated unit tests:
     - Fuel runway math (`calculate_fuel_runway`)
     - Explainable risk formula
     - Anomaly detection thresholding
     - Graph BFS blast-radius calculation
     - Sync queue priority ordering (`P0` → `P1` → `P2` → `P3`)
3. **API Test Contract Enforcement**:
   - API tests must verify that response bodies contain required metadata (`source`, `timestamp`, `truth_type`, `quality`, `confidence`).
   - Test both success (HTTP 200/201) and explicit error responses (HTTP 404, 422).
4. **E2E Operational Journey Protection**:
   - End-to-end Playwright tests must mirror the user journeys defined in [USER_JOURNEYS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/product/USER_JOURNEYS.md):
     - `hero_generator.spec.ts` (Journey A)
     - `offline_sync.spec.ts` (Journey B)
     - `science_power_rationing.spec.ts` (Journey C)
     - `incident_triage.spec.ts` (Journey D)

---

## 3. Standard Test Execution Commands
```bash
# Backend Unit & API Tests
pytest backend/tests/ -v

# Single Domain Test File
pytest backend/tests/unit/test_risk_engine.py -v

# Frontend E2E Playwright Suite
npx playwright test
```
