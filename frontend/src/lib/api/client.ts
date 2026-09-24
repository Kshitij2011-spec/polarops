/**
 * Core API Client & Shared Base Types
 * Owner: Kshitij (Product Owner & System Integration Lead)
 * 
 * Provides base fetch infrastructure, RFC 7807 problem details parsing,
 * API_BASE resolution, and universal Provenance typing.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface HealthResponse {
  status: string;
  service: string;
}

export type StationStatus = "NOMINAL" | "DEGRADED" | "CRITICAL" | "OFFLINE";
export type EnvironmentMode = "SUMMER" | "WINTER" | "TRANSITION";

export type TruthType = "MEASURED" | "DERIVED" | "FORECAST" | "SCENARIO" | "ESTIMATED" | "OVERRIDDEN" | "SIMULATED";

export interface Provenance {
  source: string;
  timestamp: string;
  freshness_seconds?: number | null;
  quality: "GOOD" | "SUSPECT" | "BAD" | "NOMINAL" | "DEGRADED" | "STALE";
  truth_type: TruthType;
  confidence: number;
}

/**
 * Universal error parser supporting RFC 7807 Problem Details
 */
export async function handleApiResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    let errorDetail = fallbackMessage;
    try {
      const errorBody = await res.json();
      if (errorBody && typeof errorBody === "object") {
        errorDetail = errorBody.detail || errorBody.message || errorBody.title || `${fallbackMessage} (${res.status})`;
      }
    } catch {
      errorDetail = `${fallbackMessage} (${res.status})`;
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return handleApiResponse<HealthResponse>(res, "Backend health check failed");
}
