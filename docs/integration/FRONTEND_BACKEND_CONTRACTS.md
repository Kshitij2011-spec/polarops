# PolarOps Frontend-Backend Contracts

This document formalizes the serialization contracts, data models, and provenance rules connecting the React frontend and FastAPI backend.

## 1. Universal Provenance Contract
Every operational data object returned from the backend MUST include provenance metadata. The frontend must never omit or fabricate provenance indicators.

```typescript
export interface Provenance {
  source: string;              // e.g. "STATION_SCADA_PRIMARY", "NCPOR_TELEMETRY"
  timestamp: string;           // ISO 8601 UTC timestamp
  freshness_seconds?: number | null;
  quality: "GOOD" | "SUSPECT" | "BAD" | "NOMINAL" | "DEGRADED" | "STALE";
  truth_type: "MEASURED" | "DERIVED" | "SIMULATED" | "ESTIMATED" | "OVERRIDDEN";
  confidence: number;          // 0.0 to 1.0 (float)
}
```

---

## 2. Health Contract (Phase 1 Baseline)

### Endpoint: `GET /health` (or `/api/health`)
- **Backend Schema**: `app.schemas.system.HealthResponse`
- **Frontend Type**: `HealthResponse`

```json
{
  "status": "ok",
  "service": "polarops-api"
}
```

---

## 3. Core Operational Schemas (Staged for Phases 2–10)

### Station Overview Contract (`GET /stations/{id}/overview`)
- **Backend Schema**: `app.schemas.station.StationOverview`
- **Fields**:
  - `station_id`: string (e.g. `"STATION-BHARATI"`)
  - `station_name`: string (e.g. `"Bharati"`)
  - `status`: `"NOMINAL" | "DEGRADED" | "CRITICAL" | "OFFLINE"`
  - `environment_mode`: `"SUMMER" | "WINTER" | "TRANSITION"`
  - `weather`: `AmbientWeather`
  - `subsystems`: `SubsystemSummaryItem[]`
  - `critical_events`: `CriticalEventItem[]`
  - `power_generation_kw`: number
  - `power_consumption_kw`: number
  - `thermal_generation_kw`: number
  - `provenance`: `Provenance`

### Asset Risk Intelligence Contract (`GET /assets/{id}/risk`)
- **Backend Schema**: `app.schemas.asset.AssetRisk`
- **Six Risk Factors**:
  1. `THERMAL_MARGIN`: Bearing and stator thermal headroom
  2. `VIBRATION_SEVERITY`: Velocity & acceleration spectral amplitude
  3. `OIL_DEGRADATION`: Viscosity, moisture, and particle count
  4. `HOURS_SINCE_OVERHAUL`: Operational runtime against maintenance interval
  5. `LOAD_FACTOR`: Continuous electrical output relative to rated capacity
  6. `ENVIRONMENTAL_STRESS`: Ambient exterior temperature impact on intake air

---

## 4. Error Response Contract
Backend returns standard RFC 7807 / FastAPI validation errors:
```json
{
  "detail": [
    {
      "loc": ["query", "station_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```
Client error handling in `frontend/src/lib/api.ts` extracts `.detail` and presents friendly operator recovery messages without crashing the view.
