# MVP Scope & Feature Prioritization

## Priority Matrix Overview

The 6-day MVP focuses strictly on **high technical credibility, operational realism, visual polish, and demonstrable architecture**.

```text
┌─────────────────────────────────────────────────────────────────┐
│                          MUST HAVE                              │
│  - Unified Command Center          - Dependency Graph Engine    │
│  - Asset Intelligence & Telemetry  - Explainable Risk Scoring   │
│  - Energy & Fuel Runway Model      - Maintenance & Inventory    │
│  - Scenario Simulation Engine      - Offline Sync Queue Demo    │
├─────────────────────────────────────────────────────────────────┤
│                         SHOULD HAVE                             │
│  - Science Payload Continuity      - Incident Workspace         │
│  - Operational Memory / Audit Log  - Lightweight Role Switching │
├─────────────────────────────────────────────────────────────────┤
│                        NICE TO HAVE                             │
│  - Interactive 3D Spatial Map      - Predictive ML Degradation  │
│  - Weather Overlay GIS Integration                              │
├─────────────────────────────────────────────────────────────────┤
│                         CUT FIRST                               │
│  - Heavy 3D mesh rendering         - Complex external GIS APIs  │
│  - Automated autonomous controls   - Multi-tenant cloud infra   │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Capability Breakdown

### 1. MUST HAVE (Core Operational Loop)
- **Command Center**: Unified dashboard presenting station status, active alerts, environmental conditions, fuel runway, and subsystem health indicators.
- **Asset Intelligence**: Detail view for critical station assets (Generators G-01/02/03, Boilers, Water Treatment, HVAC, Satellite Comms) showing operational metrics and threshold status.
- **Dependency Graph**: Graph model connecting Assets → Subsystems → Services → Station Zones. Enables root-cause and downstream blast-radius analysis.
- **Explainable Risk Engine**: Calculates risk score based on sensor anomalies, structural dependencies, redundancy state, and harsh weather factors.
- **Maintenance & Inventory Integration**: Tracks work orders, spare parts availability, and resupply ship exposure for critical assets.
- **Energy & Fuel Runway Model**: Calculates current fuel burn rate, thermal demand, electrical load, and projected days of autonomy remaining.
- **Scenario Simulation Engine**: Interactive "What-If" simulator allowing operators to trigger asset failures (e.g. G-02 trip, cold snap) and observe simulated cascade impacts and recommended responses.
- **Offline / Sync Demonstration**: Visual simulation of comms loss, local event queuing, connection recovery, checksum verification, and state reconciliation.

### 2. SHOULD HAVE (Enhanced Operational Value)
- **Science Payload Continuity**: Management of scientific experiments (e.g., Auroral Radar, Seismometer, Micro-meteorology) with power rationing controls during energy degradation.
- **Incident Workspace**: Structured timeline for logging station incidents, assigning corrective actions, and tracking resolution status.
- **Operational Memory**: Persistent log of operator decisions, scenario outcomes, and lessons learned for future expedition crews.
- **Role-Aware View**: Quick toggle between Station Commander, Chief Engineer, Science Lead, and HQ Inspector perspectives.

### 3. NICE TO HAVE (Visual & Analytics Enhancements)
- **3D Spatial Overview**: Interactive 2.5D/3D station isometric model highlighting building health and zone risk colors.
- **Predictive Degradation Curves**: Simple trend forecasting for asset maintenance intervals based on run hours and load profiles.

### 4. CUT FIRST (Non-Essential Complexity)
- High-polygon 3D WebGL rendering engine.
- External live satellite mapping integrations.
- Multi-cloud deployment orchestration.
- Real-time video stream ingestion.
