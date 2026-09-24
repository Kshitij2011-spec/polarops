# PolarOps — End-to-End Data Flow & Architecture Map
**Phase 0 Output · Document 6 of 10**  
**Repository:** `C:\Users\Kshitij Parkhe\OneDrive\Desktop\PolarOps`  
**Date:** September 24, 2026  
**Auditor:** Antigravity Engineering (Automated Integration Audit)

---

## 1. Global Request / Response Architecture

The PolarOps data architecture enforces strict separation between server-side domain computation and client-side presentation:

```
[ User Interaction / Route Load ]
               │
               ▼
   [ React View Component ]
               │
               ▼
[ TanStack Query Hook (`useQuery` / `useMutation`) ]
               │
               ▼
   [ API Client (`api.ts`) ]
               │
               ▼  (HTTP GET/POST/PATCH)
   [ Vercel Proxy Rewrite / Vite Dev Proxy ]
               │  (/api/* → backend/*)
               ▼
     [ FastAPI Route Handler ]
               │
               ▼
  [ Pydantic V2 Request Validation ]
               │
               ▼
    [ Domain Service Layer ]
  (Risk / BFS / Energy / Sync / Event)
               │
               ▼
  [ SQLAlchemy 2.0 ORM Query / Commit ]
               │
               ▼
      [ PostgreSQL Database ]
               │
               ▼
    [ Domain Model Evaluation ]
               │
               ▼
  [ Pydantic V2 Response Serialization ]
               │
               ▼  (JSON HTTP 200 OK)
   [ API Client Type Assertion ]
               │
               ▼
 [ Adapter Transform (CamelCase / UI View Model) ]
               │
               ▼
 [ React Render: Loading → Error → Data Display ]
```

---

## 2. Domain-by-Domain Flow Maps

### A. Station Command Center (`/command-center` & `/`)
- **UI Trigger:** Navigation to `/command-center` or selecting station switcher (Bharati / Maitri).
- **Frontend Hook:** `useStationOverview(stationId)` + `useOperationalIntelligence(stationId)` + `useOperationalEvents(stationId)`.
- **HTTP Request:**
  - `GET /station/overview?station_id=STATION-BHARATI`
  - `GET /intelligence/narrative?station_id=STATION-BHARATI`
  - `GET /events?station_id=STATION-BHARATI&limit=10`
- **FastAPI Routing:** `backend/app/api/station.py`, `backend/app/api/intelligence.py`, `backend/app/api/events.py`.
- **Backend Services:** `station_service.py`, `intelligence_service.py`, `event_service.py`.
- **Database Evaluation:** Queries `stations`, active `weather_observations`, generator asset health, and event streams. Evaluates `operational_headroom_pct` and synthesizes the 7-stage causal narrative (`CHANGE → CONTEXT → DEPENDENCY → RISK → CONSEQUENCE → SCENARIO → ACTION`).
- **Response Schemas:** `StationOverviewResponse`, `OperationalInsightResponse`, `EventListResponse`.
- **Frontend Transform:** Maps `weather` into KPI cards, binds causal stages into accordion, and populates the activity stream.

### B. Asset Intelligence & BFS Dependency (`/digital-twin` & `/assets/{id}`)
- **UI Trigger:** Operator clicks an asset node on the Digital Twin topology or clicks "Inspect G-02".
- **Frontend Hook:** `useAssetDetail(assetId)`, `useAssetDependencies(assetId, maxDepth=5)`, `useAssetTelemetry(assetId, limit=50)`, `useAssetRisk(assetId)`.
- **HTTP Requests:**
  - `GET /assets/{asset_id}`
  - `GET /assets/{asset_id}/dependencies?max_depth=5`
  - `GET /assets/{asset_id}/telemetry?limit=50`
  - `GET /assets/{asset_id}/risk`
- **FastAPI Routing:** `backend/app/api/assets.py`.
- **Backend Services:**
  - `dependency_service.py`: Executes deterministic **Breadth-First Search (BFS)** traversal over `asset_dependencies` table to discover upstream power buses and downstream critical services (HVAC, Water).
  - `risk_service.py`: Computes 6-factor composite risk score (0–100) using normalized sensor z-scores, environmental amplification (-38°C blizzard), recovery exposure (missing seal), and downstream criticality.
  - `telemetry_service.py`: Pulls chronological sensor time-series for vibration (mm/s), coolant temperature (°C), fuel burn, and electrical load.
- **Frontend Transform:** Feeds nodes/edges into topology renderer, binds time-series to Recharts `LineChart`, and renders the 6-factor risk breakdown card.

### C. What-If Scenario Simulation (`/scenarios`)
- **UI Trigger:** Operator adjusts scenario sliders (e.g. 72h Generator G-02 failure, -42°C temp, 30% load shedding, auxiliary boiler preheat enabled) and clicks "RUN SCENARIO".
- **Frontend Hook:** `useMutation` calling `simulateScenario(request)`.
- **HTTP Request:** `POST /scenarios/simulate` with body:
  ```json
  {
    "station_id": "STATION-BHARATI",
    "scenario_type": "GENERATOR_FAILURE",
    "duration_hours": 72,
    "ambient_temp_celsius": -38.5,
    "load_shedding_percentage": 25.0,
    "auxiliary_boiler_preheat": true
  }
  ```
- **Backend Service:** `scenario_service.py`: Completely **in-memory and stateless**. Traverses asset power/thermal model, evaluates battery and reserve margins, and computes comparative metric deltas without writing to the database.
- **Response Schema:** `ScenarioSimulateResponse` (baseline vs. scenario deltas, affected services, decision options).
- **Frontend Transform:** Renders side-by-side comparative cards with color-coded deltas and recommended mitigations.

### D. Communication Resilience & Offline Sync (`/offline`)
- **UI Trigger:**
  1. Operator toggles "SIMULATE OUTAGE" → `POST /resilience/simulate-offline`.
  2. Operator logs local event during outage → `POST /resilience/events`.
  3. Operator clicks "RESTORE & SYNCHRONIZE" → `POST /resilience/restore`.
- **Backend Service:** `sync_service.py`:
  - When disconnected: Buffers telemetry into `sync_queue_items` with priority tiers (P0 Life Support, P1 Power, P2 Thermal, P3 Science).
  - On restore: Iterates queue by `priority ASC, created_at ASC`, verifies SHA-256 payload checksums, transitions status from `PENDING` to `VERIFIED` to `ACKNOWLEDGED`, and marks reconciled.
- **Response Schema:** `RestoreLinkResponse` containing array of synced items, SHA-256 checksums, and link state.
- **Frontend Transform:** Updates store-and-forward queue visualizer, displays verified SHA-256 hashes, and flips UI status from Offline to Synchronized.

---

## 3. Architecture Hazards & Duplication Audit

1. **Hazard: Frontend Re-computation of Risk:**  
   The new frontend currently presents static numbers or attempts simplistic arithmetic in JSX.  
   **Rule:** The frontend must NEVER calculate risk scores or cascade depths. All risk scores (0–100) must come directly from `GET /assets/{id}/risk`.
2. **Hazard: Mock Disconnection Timer (`setTimeout`):**  
   The new frontend's `reconnect()` method uses nested `window.setTimeout()` calls to simulate a 3-step synchronization progress.  
   **Rule:** Replace fake timers with the real asynchronous backend mutation `POST /resilience/restore`, rendering true server reconciliation status.
3. **Hazard: Missing Error Boundaries & Loading States:**  
   The new frontend assumes instant data availability from static memory. When bound to asynchronous network calls, the UI will flash empty or crash on null properties if proper loading skeletons and error fallbacks are omitted.
4. **Hazard: Cache Invalidation Races:**  
   Mutations like `POST /scenarios/simulate` or `POST /station/comparison/evaluate` log new operational events in the database. If the query client does not invalidate the `["events"]` cache key upon mutation success, the Activity Stream will become out-of-sync with the server state.
