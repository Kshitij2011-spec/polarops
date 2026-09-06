# Security & Operational Boundaries

> **Core Security Principle**: *The MVP demonstrates security-by-design principles, role-aware access controls, and data integrity verification — NOT production Operational Technology (OT) or SCADA security.*

---

## 1. Role-Aware Access Control Model (RBAC)

The system enforces four distinct operational roles with specific view and modification permissions:

| Operational Role | View Capabilities | Action / Modification Capabilities |
| :--- | :--- | :--- |
| **Station Commander** | Full operational digital twin overview, all assets, energy, incidents | Approve scenario actions, close incidents, record operational memory |
| **Chief Engineer** | Asset health, telemetry, maintenance logs, inventory stock | Create work orders, log spare parts allocation, trigger scenario simulations |
| **Science Expedition Lead** | Station environmental status, scientific instruments, data queues | Toggle science payload power states, set data buffering priorities |
| **HQ Inspector (NCPOR)** | Read-only station telemetry, resupply exposure, historical memory | Read-only monitoring; no local station action execution |

---

## 2. Security Boundaries & Enforced Protections

### A. Environment Variable Safety
- All backend database connection strings, JWT signing keys, and Supabase credentials MUST be supplied via environment variables (`.env`).
- `.env` files are explicitly excluded from Git source control (`.gitignore`). `.env.example` templates provide dummy reference configurations.

### B. Client-Side Non-Exposure Rule
- Frontend applications ONLY receive public Supabase keys (`SUPABASE_ANON_KEY`) or application access tokens.
- Master admin keys (`SUPABASE_SERVICE_ROLE_KEY`) remain strictly restricted to backend Python services.

### C. Data Integrity & Audit Timestamping
- Every database modification (incidents, scenario approvals, sync queue flushes) generates immutable audit timestamps (`created_at`, `updated_at`, `executed_by`).
- Local queue items append SHA-256 cryptographic hashes to verify payload integrity upon synchronization.

---

## 3. Explicit Security Non-Claims (MVP Limitations)

The PolarOps demonstration platform explicitly does NOT claim or provide:

1. **SCADA / Industrial OT Control**: Does NOT interface with hardware Programmable Logic Controllers (PLCs) or industrial Modbus devices.
2. **Production Network Security**: Does NOT implement encrypted satellite channel link wrapping or hardware VPN tunnels.
3. **Autonomous Physical Action**: Does NOT execute physical remote controls on physical station valves, switches, or generators.
4. **Proprietary NCPOR Data**: Does NOT store, transmit, or expose real classified internal NCPOR station operational records.
