/**
 * PolarOps Master API Barrel Re-export
 * Owner: Kshitij (Product Owner & System Integration Lead)
 * 
 * Re-exports all domain modules to maintain 100% backward compatibility
 * across all existing hooks and components while enabling isolated
 * domain-specific imports for Dhruv and Tanvi.
 */

export * from "./client";
export * from "./station";
export * from "./twin";
export * from "./resources";
export * from "./decision";
export * from "./resilience";
export * from "./incidents";
export * from "./memory";
export * from "./science";
export * from "./explain";
