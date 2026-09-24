import { useMutation } from "@tanstack/react-query";
import { simulateScenario, type ScenarioSimulateRequest, type ScenarioSimulateResponse } from "../lib/api";

export function useScenarioSimulation() {
  return useMutation<ScenarioSimulateResponse, Error, ScenarioSimulateRequest>({
    mutationFn: (request: ScenarioSimulateRequest) => simulateScenario(request),
  });
}
