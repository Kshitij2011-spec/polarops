/**
 * Backward compatibility stub for PolarOps API client.
 * The API has been modularized under ./api/ according to FINAL_API_OWNERSHIP.md.
 * 
 * Domain modules:
 * - ./api/client.ts      (Base fetch & Provenance) - Owner: Kshitij
 * - ./api/station.ts     (Overview & Coordination) - Owner: Kshitij
 * - ./api/twin.ts        (Assets, Telemetry & Risk) - Owner: Dhruv
 * - ./api/resources.ts   (Fuel, Energy & Spares)   - Owner: Tanvi
 * - ./api/decision.ts    (Scenarios & Mitigation)   - Owner: Tanvi
 * - ./api/resilience.ts  (Edge Link & Sync Queue)   - Owner: Tanvi
 * - ./api/incidents.ts   (Incidents COP & Ledger)  - Owner: Tanvi
 * - ./api/memory.ts      (Institutional Memory)     - Owner: Tanvi
 * - ./api/science.ts     (Instruments & Buffering)  - Owner: Tanvi
 * - ./api/explain.ts     (Causal Explanations)      - Owner: Kshitij
 */

export * from "./api/index";
