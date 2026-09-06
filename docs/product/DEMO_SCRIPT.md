# Demonstration Script & Live Pitch Guide

This document defines the 3-minute deterministic demonstration script for presenting the PolarOps Operational Digital Twin during evaluations and pitch sessions.

---

## 1. Demonstration Timing & Workflow (3-Minute Script)

| Time | Screen | User Action | Expected Visual | Verbal Narration | Fallback Plan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0:00** | Command Center | Load page | Unified station overview showing Bharati station status (-28.5°C, 42 kt winds, 70 days fuel runway). | *"Welcome to PolarOps — the Operational Digital Twin for Indian Antarctic Research Stations. Here is our live Command Center."* | Hard reload browser if cache issue. |
| **0:15** | Command Center | Hover / click `G-02` warning card | Power Subsystem turns amber; `G-02 Generator` displays red alert badge. | *"An anomaly triggers on Generator G-02: bearing vibration has reached 4.8 mm/s against a 4.0 limit."* | Direct navigation to `/assets/G-02`. |
| **0:30** | Asset Intelligence | Click **"Why High Risk?"** | Modal opens presenting composite risk score (74/100) and weighted risk factors. | *"Instead of just showing a sensor number, PolarOps explains WHY this is high risk based on weather severity and single-point thermal reliance."* | Ensure mock risk response is cached. |
| **0:50** | Dependency View | Click **"Dependency Graph"** tab | Directed graph highlights `G-02` → `Thermal Loop B` → `Habitat Zone 2 Heating`. | *"Tracing dependencies reveals that G-02 failure directly impacts living quarters heating in Zone 2."* | Static topology image fallback. |
| **1:05** | Inventory & Resupply | Click **"Inventory & Resupply"** tab | Seal kit `SK-402` shows `0 Available`; *MV Vasiliy Golovnin* is 45 days away. | *"Checking inventory reveals local spare seals are unavailable, and the next resupply ship is 45 days away."* | Pre-loaded inventory JSON. |
| **1:20** | Scenario Engine | Click **"Simulate G-02 Shutdown"** | Thermal decay curve projects Zone 2 freezing in 14.5 hours; fuel runway extends +8.5 days. | *"We simulate a complete shutdown: habitat temperature drops to freezing within 14.5 hours."* | In-memory pre-computed simulation. |
| **1:40** | Scenario Engine | Click **"Approve Countermeasure"** | System shifts thermal load to Auxiliary Boiler `B-01`; action logged to Operational Memory. | *"The twin recommends shifting load to Auxiliary Boiler B-01. The commander approves, protecting the station."* | Direct decision API call. |
| **1:50** | Resilience UI | Toggle **"Simulate Offline"** switch | Status changes to **OFFLINE (Local)**; local action queued (`P1 High - 1 item`). | *"When satellite comms drop during severe storms, PolarOps maintains local edge autonomy."* | LocalStorage fallback. |
| **2:05** | Resilience UI | Toggle **"Restore Connection"** switch | Queue flushes in priority order; status turns green **SYNCHRONIZED** with SHA-256 ACK. | *"Once comms return, queued decisions flush in priority order with cryptographic SHA-256 verification."* | Automatic sync trigger. |
| **2:20** | Science Workspace | Toggle Auroral Radar to **STANDBY** | Energy allocation shifts 35 kW back to habitat heating bank. | *"During energy rationing, operators can temporarily shed non-critical science payloads to preserve life support."* | Static power indicator toggle. |
| **2:35** | Incident & Memory | Click **"Operational Memory"** | Searchable timeline displays decision record and lessons learned for future expedition crews. | *"All decisions build institutional memory, ensuring future expedition teams learn from operational events."* | Pre-populated memory log. |
| **2:50** | Closing Summary | Return to Command Center | All metrics green/nominal; station operational continuity secured. | *"PolarOps turns fragmented data into explainable context, proactive simulation, and resilient operational continuity."* | End pitch slide. |

---

## 2. Key Demo Rules
1. **Zero Randomness**: All demo triggers rely on deterministic mock datasets to guarantee 100% reproducible execution.
2. **Speed & Clarity**: Do not pause on technical code; keep narration focused on operational decision-making value.
3. **Emergency Fallbacks**: Ensure local state contains pre-computed fallback responses for every scenario step in case of network latency.
