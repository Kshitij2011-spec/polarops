# Evidence Register & Claim Classification

This document classifies all technical, environmental, and software design assertions made within the PolarOps project into explicit evidence categories.

---

## 1. Evidence Classification Categories

```text
[PROVEN IN RESEARCH/DEPLOYMENT] ── Tested / Published empirical literature or official benchmarks
[OUR ANTARCTIC ADAPTATION]     ── Domain adaptation tailored to Maitri / Bharati operational context
[OUR DESIGN]                   ── Internal software architecture, UI layout, and risk algorithms
[SYNTHETIC DEMONSTRATION]      ── Simulated telemetry, inventory records, and scenario parameters
[REQUIRES FUTURE VALIDATION]   ── Assumptions requiring physical station testing or NCPOR integration
```

---

## 2. Classified Claims Register

### A. Environmental & Polar Operational Claims
- **Extreme Weather Isolation (-40°C, 100 kt catabatic winds)**: `[PROVEN IN RESEARCH/DEPLOYMENT]`  
  *Source*: Meteorological observations at Maitri and Bharati stations (NCPOR published reports).
- **Diesel Fuel as Primary Survival Lifeline**: `[PROVEN IN RESEARCH/DEPLOYMENT]`  
  *Source*: Scientific Antarctic Logistics studies (British Antarctic Survey & NCPOR).
- **Maitri & Bharati Dual Station Profile**: `[OUR ANTARCTIC ADAPTATION]`  
  *Context*: Adaptations for station layout, thermal loops, and seasonal wintering populations.

### B. Digital Twin & Systems Architecture
- **Integrated Digital Twin for Isolated Infrastructures**: `[PROVEN IN RESEARCH/DEPLOYMENT]`  
  *Source*: Cambridge University Center for Digital Built Britain & BAS data management studies.
- **Relational BFS Graph Traversal for Asset Dependencies**: `[OUR DESIGN]`  
  *Context*: In-memory Python BFS over PostgreSQL `AssetDependency` table replacing heavy graph databases.
- **Local-First Priority Queue Sync Engine**: `[OUR DESIGN]`  
  *Context*: Priority-ordered sync engine with SHA-256 payload integrity validation.

### C. Demonstration Data & Scenarios
- **Generator G-02 Vibration Anomaly (4.8 mm/s)**: `[SYNTHETIC DEMONSTRATION]`  
  *Context*: Synthetic dataset created specifically for the 3-minute hero scenario demonstration.
- **Fuel Stock (142,500 Liters) & 70-Day Runway Calculation**: `[SYNTHETIC DEMONSTRATION]` / `[OUR DESIGN]`  
  *Context*: Simulated inventory numbers processed through our deterministic fuel burn algorithm.
- **Resupply Vessel MV Vasiliy Golovnin (45-Day ETA)**: `[SYNTHETIC DEMONSTRATION]`  
  *Context*: Realistic resupply vessel timeline based on historical summer Antarctic expedition schedules.

### D. System Integration & Hardware Boundaries
- **Modbus/OPC-UA Field Gateway Integration**: `[REQUIRES FUTURE VALIDATION]`  
  *Context*: Physical IoT gateway protocols require future on-station hardware integration testing.
- **Iridium Satellite Link Bandwidth Optimization**: `[REQUIRES FUTURE VALIDATION]`  
  *Context*: Real-world satellite packet transmission rates require validation with active satellite transceivers.
