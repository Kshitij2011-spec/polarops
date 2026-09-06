---
name: database-migrations
description: Focused guidance for PostgreSQL/Supabase schema design, Alembic migrations, foreign-key integrity, and deterministic seeding in PolarOps.
---

# Database Migrations & Schema Skill

This skill provides mandatory rules and workflows for modifying database schemas, writing migrations, maintaining relational integrity, and creating deterministic seed data.

---

## 1. Responsibilities & Scope
- **Schema Management**: Managing relational tables in PostgreSQL / Supabase matching [DATA_MODEL.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/DATA_MODEL.md).
- **Migration Scripts**: Creating reversible Alembic or Supabase SQL migrations.
- **Relational Integrity**: Enforcing primary keys, foreign-key constraints, cascading rules, and check constraints.
- **Deterministic Seed Data**: Maintaining seed scripts for station topology, initial assets, and the G-02 hero scenario.
- **Security & RLS**: Establishing Row Level Security (RLS) policies and preventing credential exposure.

---

## 2. Core Implementation Rules
1. **Migration-Only Schema Changes**:
   - Never apply manual, uncommitted, or ad-hoc SQL changes directly to the database.
   - All schema modifications must exist as versioned, reproducible migration files.
2. **Inspect Specifications First**:
   - Before drafting any table or column change, inspect [DATA_MODEL.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/DATA_MODEL.md) and [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md) to ensure entity naming and field types match the canonical specification.
3. **Foreign-Key Integrity & Indexing**:
   - Always define explicit foreign keys for entity relationships (`station_id`, `building_id`, `zone_id`, `asset_id`).
   - Add indexes on foreign keys and frequently queried timestamp / status columns.
4. **Relational Structure Over JSON Blobs**:
   - Use relational columns for entities involved in filtering, joining, or foreign-key relations.
   - Reserve `JSONB` strictly for open-ended specifications (e.g. `specs_json`) or raw sensor extra metadata.
5. **Deterministic Seed Datasets**:
   - Seed scripts must produce identical station state on every execution (`Station`, `Asset`, `Sensor`, `MaintenanceWorkOrder`, `SparePart`, `InventoryItem`).
   - Never use random timestamp generators or non-deterministic IDs for hero scenario demo records.
6. **No Secrets in Migrations or Seeds**:
   - Never hardcode passwords, API keys, or service tokens in migration SQL or seed scripts.

---

## 3. Required Verification for Database Tasks
1. **Migration Rollforward & Rollback**: Verify migration applies cleanly and rolls back without orphan records.
2. **Seed Execution**: Run database seed script and verify all tables populate as expected.
3. **Constraint Validation**: Verify foreign-key constraints prevent invalid relationship insertions.
