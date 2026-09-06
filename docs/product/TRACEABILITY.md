# Requirement Traceability Matrix

This document provides a compact traceability mapping connecting target problem facets to solution pillars, product features, user journeys, data entities, backend APIs, and automated tests.

---

## Traceability Mapping Table

| ID | Problem Facet | Solution Pillar | Product Feature | User Journey | Data Entities | Backend API Endpoint | Validation Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P-01** | Fragmented station telemetry & status visibility | Pillar 1 — Unify Station | Command Center Overview Dashboard | Journey A | `Station`, `Sensor`, `Measurement` | `GET /station/overview` | API Test + Playwright E2E |
| **P-02** | Asset telemetry alerts lack root-cause context | Pillar 2 — Understand Impact | Asset Intelligence & Threshold Monitor | Journey A | `Asset`, `Sensor`, `Measurement` | `GET /assets/{id}` | API Test + Playwright E2E |
| **P-03** | Unknown cascading downstream effects of equipment failure | Pillar 2 — Understand Impact | Relational Dependency Graph Engine | Journey A | `AssetDependency`, `Service`, `Zone` | `GET /assets/{id}/dependencies` | Pytest BFS Unit + API Test |
| **P-04** | Opaque health metrics without explainable rationale | Pillar 2 — Understand Impact | Explainable Risk Scoring Engine | Journey A | `Asset`, `WeatherObservation` | `GET /assets/{id}/risk` | Pytest Risk Unit + API Test |
| **P-05** | Unclear spare parts availability during asset breakdown | Pillar 1 — Unify Station | Maintenance & Inventory Integration | Journey A | `MaintenanceWorkOrder`, `SparePart`, `InventoryItem` | `GET /resources/inventory` | Pytest Inventory Unit + API Test |
| **P-06** | Vulnerability to months-long resupply ship delays | Pillar 2 — Understand Impact | Resupply Exposure Tracker | Journey A | `ResupplyOpportunity` | `GET /resources/resupply` | API Test + Playwright E2E |
| **P-07** | Extreme winter fuel consumption & runway uncertainty | Pillar 2 — Understand Impact | Energy & Fuel Runway Model | Journey A / C | `EnergyResource`, `FuelRunwayLog` | `GET /resources/fuel` | Pytest Fuel Math Unit + API Test |
| **P-08** | Inability to test "What-If" operational disruption risks | Pillar 2 — Understand Impact | Scenario Simulation Engine | Journey A | `Scenario`, `OperationalAction` | `POST /scenarios/simulate` | Pytest Sim Unit + Playwright E2E |
| **P-09** | Satellite blackouts cause data loss & comms disruption | Pillar 3 — Operate Disruption | Local-First Priority Sync Queue | Journey B | `CommunicationLink`, `SyncQueueItem` | `POST /resilience/restore` | Pytest Queue Unit + Playwright E2E |
| **P-10** | Power rationing forces unmanaged science data loss | Pillar 3 — Operate Disruption | Science Payload Continuity Manager | Journey C | `ScientificInstrument`, `Observation` | `GET /science/instruments` | Playwright E2E Science Test |
| **P-11** | Incident response & crew handover lack historical memory | Pillar 3 — Operate Disruption | Incident Workspace & Operational Memory | Journey D | `Incident`, `OperationalAction`, `OperationalMemory` | `POST /decisions`, `GET /memory` | API Test + Playwright E2E |
