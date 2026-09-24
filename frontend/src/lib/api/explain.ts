/**
 * 5-Stage Causal Reasoning & Operational Explanation API
 * Owner: Kshitij (Product Owner & System Integration Lead)
 */

import { API_BASE, handleApiResponse } from "./client";
import type { RecoveryConstraint, RecommendedNextStep } from "./decision";

export interface ExplanationEvidence {
  factor: string;
  metric: string;
  value: string | number | boolean;
  threshold?: string | number | null;
  status: "NOMINAL" | "WARNING" | "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
  detail: string;
}

export interface ExplanationConsequence {
  domain: string;
  impact: string;
  blast_radius_depth: number;
  description: string;
}

export interface ExplanationResponse {
  subject: string;
  domain: string;
  entity_id: string;
  station_id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  summary: string;
  why_it_matters: string;
  evidence: ExplanationEvidence[];
  consequences: ExplanationConsequence[];
  recovery_constraints: RecoveryConstraint[];
  recommended_next_steps: RecommendedNextStep[];
  confidence: number;
  truth_type: string;
  source_context: string[];
  timestamp: string;
}

export async function fetchExplanation(
  domain: string,
  entityId: string,
  stationId: string = "STATION-BHARATI"
): Promise<ExplanationResponse> {
  const url = `${API_BASE}/explain/${encodeURIComponent(domain)}/${encodeURIComponent(entityId)}?station_id=${encodeURIComponent(stationId)}`;
  const res = await fetch(url);
  return handleApiResponse<ExplanationResponse>(res, "Failed to fetch operational explanation");
}
