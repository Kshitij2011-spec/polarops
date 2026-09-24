# Resource & Recovery Intelligence API Traceability Mapping

This document provides exhaustive, end-to-end traceability for every UI element in the PolarOps Resource & Recovery Decision Center (`/resources`) to its backend API endpoint, response schema, and authoritative Python domain service.

---

## 1. Traceability Architecture Matrix

| Operational Capability | Backend Endpoint | Backend Service / Function | Frontend Hook / Component | Data Schema | Truth Type | Integration Status |
|---|---|---|---|---|---|---|
| **Fuel Reserve & Stock Level** | `GET /resources/fuel?station_id={id}` | `resource_service.py:get_station_fuel_status()` | `useFuelStatus()` → Fuel Runway Meter | `FuelStatusResponse` | `DERIVED` | ✅ ACTIVE REAL |
| **Fuel Consumption Rate** | `GET /resources/fuel?station_id={id}` | `resource_service.py:get_station_fuel_status()` | `useFuelStatus()` → Burn Rate Gauge | `FuelStatusResponse` | `DERIVED` | ✅ ACTIVE REAL |
| **Operational Fuel Runway** | `GET /resources/fuel?station_id={id}` | `resource_service.py:get_station_fuel_status()` | `useFuelStatus()` → Projected Runway | `FuelStatusResponse` | `DERIVED` | ✅ ACTIVE REAL |
| **Winter Isolation Target & Shortfall** | `GET /resources/fuel?station_id={id}` | `resource_service.py:get_station_fuel_status()` | `useFuelStatus()` → Winter Target Delta | `FuelStatusResponse` | `DERIVED` | ✅ ACTIVE REAL |
| **Station Energy & Thermal Balance** | `GET /resources/energy?station_id={id}` | `energy_service.py:calculate_energy_balance()` | `useEnergyModel()` → Thermal/Load Balance | `EnergyModelResponse` | `DERIVED` | ✅ ACTIVE REAL |
| **Critical Spare Parts Inventory** | `GET /resources/inventory?station_id={id}` | `resource_service.py:list_station_inventory()` | `useInventory()` → Warehouse Inventory Table | `list[InventorySpareItem]` | `MEASURED` | ✅ ACTIVE REAL |
| **Spare Stockout & Shortages** | `GET /resources/inventory?station_id={id}` | `resource_service.py:list_station_inventory()` | `useInventory()` → Stockout Alert Banner | `list[InventorySpareItem]` | `MEASURED` | ✅ ACTIVE REAL |
| **Inbound Maritime Resupply Logistics** | `GET /resources/resupply?station_id={id}` | `resource_service.py:list_station_resupply()` | `useResupply()` → Logistics Voyage Card | `list[ResupplyOpportunityItem]` | `DERIVED` | ✅ ACTIVE REAL |
| **Equipment Recovery Constraint Exposure** | `GET /resources/recovery/{asset_id}` | `resource_service.py:get_asset_recovery_exposure()` | `useRecoveryExposure()` → Recovery Blocker Card | `AssetRecoveryExposureResponse` | `DERIVED` | ✅ ACTIVE REAL |
| **Active Maintenance Work Order Link** | `GET /resources/recovery/{asset_id}` | `resource_service.py:get_asset_recovery_exposure()` | `useRecoveryExposure()` → Work Order Banner | `AssetRecoveryExposureResponse` | `DERIVED` | ✅ ACTIVE REAL |
| **Cross-Station Spare Availability (Maitri)** | `GET /resources/inventory?station_id=STATION-MAITRI` | `resource_service.py:list_station_inventory()` | `useInventory("STATION-MAITRI")` → Inter-Station Mutual Aid | `list[InventorySpareItem]` | `MEASURED` | ✅ ACTIVE REAL |
| **Asset Context & Identity** | `GET /assets?station_id={id}` | `assets.py:list_assets()` | `useAssets()` → Asset Recovery Selector | `list[AssetListItem]` | `MEASURED` | ✅ ACTIVE REAL |

---

## 2. Operational Decision Tracing: G-02 Cascade Case

The `/resources` experience enables direct operator tracing of physical recovery bottlenecks:

```text
CRITICAL ASSET: G-02 (Diesel Generator G-02)
      ↓ (Status: WARNING / Risk: 87 CRITICAL)
ACTIVE WORK ORDER: MWO-2026-089 (Fuel Injection Pump & Bearing Seal Replacement)
      ↓ (Status: BLOCKED_PARTS)
REQUIRED SPARE PART: SK-402 (Generator G-02 Gasket & Fuel Pump Seal Kit)
      ↓
LOCAL WAREHOUSE STOCK: 0 AVAILABLE (Location: Powerhouse Spares Rack B-04)
      ↓
RECOVERY CONSTRAINT: HIGH EXPOSURE — Physical Maintenance Blocked by Stockout
      ↓
RESUPPLY VOYAGE: MV Vasiliy Golovnin (Carrying 2 units SK-402, ETA 11.0 Days)
      ↓
INTER-STATION CONTINGENCY: Maitri Station has 2 units SK-402 in local inventory!
      ↓
OPERATIONAL RUNWAY: Bharati Fuel Runway is 70.3 Days (Shortfall -19.7 days vs 90d Winter Target)
      ↓
OPERATOR DECISION: Evaluate inter-station air-drop transfer vs vessel arrival vs load shed
```

---

## 3. Provenance Disciplines

- **`MEASURED`**: Physical warehouse stock quantities (`quantity_available`, `quantity_reserved`), physical bin/rack locations (`location`), work order identifiers.
- **`DERIVED`**: Fuel runway days (calculated from $V_{\text{fuel}} / (\dot{m}_{\text{burn}} \times 24)$), recovery exposure scores, resupply transit day calculations.
- **Data Honesty**: All values originate from the FastAPI backend and test fixtures seeded from NCPOR station architecture. No fabricated values are introduced.
