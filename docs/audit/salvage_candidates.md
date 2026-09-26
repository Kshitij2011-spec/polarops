# PolarOps — Salvage Candidates & Integration Evaluation

## Overview

This document records the evaluation of unmerged branch artifacts across `origin/Developer2`, `origin/reimagine/dhruv-twin`, `origin/reimagine/polarops-foundation`, and `origin/baseline/phase4-5c692ec`. In accordance with PolarOps Zero-Regression rules, candidate changes are evaluated against the current production source of truth (`origin/main` at `c9a099ba36e9153e5503c17a05ae9c6411ae237d`).

---

## Candidate 1: Historical Person B Backend QA and Audit Specification

- **Source Branch**: `origin/Developer2`
- **Source Commit**: `78d149e06ca75901f0ee25d20606dd4ff7948019`
- **Exact File**: `docs/engineering/PERSON_B_BACKEND_AUDIT_REPORT.md`
- **Reason it is still useful**:
  Contains extensive evaluator criteria for Person B backend deliverables (B1–B10), including canonical truth-type classification matrix, temporal consistency matrix, and boundary verification audit.
- **Why current main does not already provide it**:
  `main` preserves overall project architecture but lacked this specific historical handoff matrix.
- **Integration Method**:
  Preserved in `docs/audit/PERSON_B_BACKEND_AUDIT_REPORT.md` as pure documentation. Zero application source modifications.
- **Expected Impact**:
  Enriches repository audit trail with zero runtime or compilation risk.
- **Tests Required**:
  None (pure documentation).
- **Regression Risk**:
  **ZERO**.

---

## Candidate 2: Digital Twin Capability & Experience Specifications

- **Source Branch**: `origin/baseline/phase4-5c692ec`
- **Source Commit**: `fc8cfab36bd00406701a9de4a3f3bac6b7235c7b`
- **Exact Files**:
  - `docs/reimagination/DHRUV_TWIN_CAPABILITY_MAP.md` (213 lines)
  - `docs/reimagination/DHRUV_TWIN_EXPERIENCE.md` (210 lines)
- **Reason it is still useful**:
  Provides architectural traceability mapping all 15 backend REST endpoints to Digital Twin UI requirements, explicit 3D spatial layout vs 2D topology rules, and dual-flow BFS semantics.
- **Why current main does not already provide it**:
  Written as Phase 4 baseline specifications but omitted during the subsequent integration merge to `main`.
- **Integration Method**:
  Preserved in `docs/audit/DHRUV_TWIN_CAPABILITY_MAP.md` and `docs/audit/DHRUV_TWIN_EXPERIENCE.md` as pure documentation. Zero application source modifications.
- **Expected Impact**:
  Preserves valuable design rationale and SCADA visualization rules.
- **Tests Required**:
  None (pure documentation).
- **Regression Risk**:
  **ZERO**.

---

## Candidate 3: Alternative Topology Canvas & Tree Grid (REJECTED)

- **Source Branch**: `origin/reimagine/dhruv-twin` & `origin/reimagine/polarops-foundation`
- **Source Commit**: `71abf380f51908bc282894c67c81999191364466`
- **Exact Files**:
  - `frontend/src/components/topology/TopologyCanvas.tsx`
  - `frontend/src/components/topology/TopologyTreeGrid.tsx`
  - `frontend/src/components/twin/AssetInspector.tsx`
  - `frontend/src/components/twin/StationSpatialSchematic.tsx`
  - `frontend/src/components/workspaces/TwinWorkspaceSkeleton.tsx`
  - `frontend/src/features/twin/TwinWorkspace.tsx`
- **Reason Evaluated**:
  Investigated whether the alternative canvas implementation should replace or augment current Digital Twin.
- **Why Rejected**:
  Current `main` already contains the authoritative, production-deployed `DigitalTwinPage.tsx` (1,494 lines), `StationDigitalTwin.tsx`, and `OperationalTopology.tsx`, thoroughly verified across all Playwright E2E suites. Integrating `71abf38` would introduce duplicate topology engines, routing conflicts, and severe visual regressions.
- **Regression Risk**:
  **HIGH**.
- **Recommendation**:
  **REJECT / ARCHIVE**.

---

## Candidate 4: ModelLifecycleRecord & Sensor Health Service (REJECTED)

- **Source Branch**: `origin/Developer2`
- **Source Commits**: `e2dcacc` & `a2aad6a`
- **Exact Files**:
  - `backend/app/api/lifecycle.py`
  - `backend/app/models/entities.py` (`ComponentLifecycle`)
  - `backend/app/services/lifecycle_service.py`
  - `backend/app/services/sensor_health_service.py`
- **Reason Evaluated**:
  Investigated whether backend lifecycle tracking and statistical sensor anomaly detection should be merged into `main`.
- **Why Rejected**:
  1. The unmigrated `ComponentLifecycle` table violates the zero-unnecessary-infrastructure rule and lacks Alembic migrations for Render PostgreSQL.
  2. The frontend does not call `/api/v1/lifecycle` or `/assets/{id}/sensor-health`.
  3. Current `main` telemetry services already satisfy all active sensor telemetry requirements via `/assets/{id}/telemetry`.
- **Regression Risk**:
  **HIGH**.
- **Recommendation**:
  **REJECT / ARCHIVE**.

---

## Summary Matrix

| Candidate | Category | Recommendation | Action Taken |
|---|---|---|---|
| `PERSON_B_BACKEND_AUDIT_REPORT.md` | Audit Documentation | **SALVAGE (DOCS ONLY)** | Preserved in `docs/audit/` |
| `DHRUV_TWIN_CAPABILITY_MAP.md` | Architecture Documentation | **SALVAGE (DOCS ONLY)** | Preserved in `docs/audit/` |
| `DHRUV_TWIN_EXPERIENCE.md` | Architecture Documentation | **SALVAGE (DOCS ONLY)** | Preserved in `docs/audit/` |
| Topology Canvas Prototype (`71abf38`) | Frontend Code | **REJECT AS OBSOLETE** | No code merged |
| Lifecycle & Sensor Health (`Developer2`) | Backend Code | **REJECT AS OBSOLETE** | No code merged |
