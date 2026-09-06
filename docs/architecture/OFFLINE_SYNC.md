# Offline Synchronization & Edge Resilience Architecture

This document defines the local-first synchronization state machine, priority queue architecture, and operational integrity guarantees used to simulate Antarctic station operational continuity during communication outages.

---

## 1. Dual State Machines

### A. Communication Link State Machine

The satellite communication link status reflects physical transceiver connectivity and transit sync phases:

```text
ONLINE ──(Outage)──► OFFLINE ──(Reconnect)──► RESTORING ──(Transferring)──► SYNCING ──(Finished)──► ONLINE
```

> **Architectural Invariant**: `RECONCILED` belongs strictly to individual queue items, **never** to the communication link itself. The link returns to `ONLINE` upon completing batch synchronization.

### B. Queue Item Lifecycle

Every buffered event or science observation transitions through discrete, validated states:

```text
       ┌───────────┐
       │  PENDING  │ (Locally generated during outage; canonical SHA-256 computed)
       └─────┬─────┘
             │ Link enters RESTORING / SYNCING
             ▼
       ┌──────────────┐
       │ TRANSFERRING │ (Dispatched in deterministic priority order)
       └─────┬────────┘
             │ Payload received & checksum recomputed
             ▼
       ┌───────────┐
       │  VERIFIED │ (Canonical UTF-8 SHA-256 matches stored checksum)
       └─────┬─────┘
             │ Server generates ACK token
             ▼
       ┌──────────────┐
       │ ACKNOWLEDGED │
       └─────┬────────┘
             │ Merged into station database state
             ▼
       ┌────────────┐
       │ RECONCILED │ (Terminal success state)
       └────────────┘

Failure Branch:
TRANSFERRING ──(Checksum Mismatch / Timeout)──► FAILED_RETRY ──(Manual/Auto Re-evaluation)──► TRANSFERRING
```

---

## 2. Deterministic Priority Ordering

To eliminate database incidental ordering and non-deterministic race conditions during network recovery, the queue is strictly ordered:

```sql
ORDER BY priority ASC, created_at ASC, id ASC
```

| Priority Code | Numeric Rank | Classification | Description & Payload Examples | Max Buffer Policy |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | `0` | **Critical** | Emergency incident alerts, asset emergency trips, life-support overrides | Persistent (No prune) |
| **P1** | `1` | **High** | Maintenance work orders, generator fault diagnostics, fuel stock adjustments | 30 Days |
| **P2** | `2` | **Important** | Science experiment logs, buffered sensor sweeps, operational memory lessons | 14 Days |
| **P3** | `3` | **Routine** | Ambient meteorological logs, high-frequency telemetry, background battery pings | 3 Days (FIFO prune) |

---

## 3. Canonical SHA-256 Integrity Verification

All queue items calculate their integrity checksum using a deterministic canonical payload representation:
1. **Sorted Keys**: JSON object keys are recursively sorted.
2. **Deterministic Separators**: Compact separators `(',', ':')` with zero arbitrary whitespace.
3. **UTF-8 Encoding**: Bytes encoded deterministically.
4. **SHA-256 Hash**: Recomputed upon arrival at destination and compared against `checksum_sha256`.

```python
def compute_canonical_checksum(payload: Any) -> str:
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
```

If the recomputed hash does not match the stored checksum, the item is quarantined in `FAILED_RETRY`.

---

## 4. Generic Science Data Continuity

Scientific observations follow the same resilience abstraction:
- Instruments (e.g. hero `INST-S17-RADAR`, `INST-S08-SEIS`) maintain local edge observation buffers.
- During offline periods, `POST /science/observations/buffer` logs samples to the local buffer and enqueues a `P2` sync queue item.
- Upon reconnection, observations transfer, verify checksums, receive ACK, and reconcile with the central telemetry repository.

---

## 5. Incident Workspace & Operational Memory

1. **Multi-Hop Blast Radius & Risk Engine Reuse**:
   - Incident analysis reuses Day 2 BFS graph traversal (`traverse_asset_dependencies()`) and composite scoring (`calculate_asset_risk()`).
   - Zero duplicated dependency or scoring logic.
2. **Human-Controlled "Record to Memory" Workflow**:
   - Incidents progress through: `ACTIVE → CONTAINED → RESOLVED`.
   - Resolution does **not** automatically create an operational memory record.
   - Operators explicitly invoke "Record to Memory", capturing structured lessons:
     $$\text{Incident} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Outcome} \longrightarrow \text{Lesson}$$
   - Lessons are permanently queryable through keyword search (`GET /memory?q=...`).

---

## 6. Simulation Reset Boundary

`POST /resilience/reset` operates within a strict isolation boundary:
- **Resets**: Communication link back to `ONLINE` and demo queue items to `PENDING`.
- **Restores**: Baseline hero incident `INC-2026-04` back to `ACTIVE` if it was resolved during tests.
- **Preserves**: Does **NOT** delete canonical seed data, mutate Day 1–3 baseline resources (fuel, water, warehouse spares), or create duplicate entities.
