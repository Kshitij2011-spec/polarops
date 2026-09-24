import { test, expect } from "@playwright/test";

test.describe("PolarOps Operational Intelligence Consolidation & Causal Narrative", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base Command Center
    await page.goto("/");
    // Wait for the station overview to load
    await expect(page.getByText(/Antarctic Operational Digital Twin/i)).toBeVisible({ timeout: 15000 });
  });

  test("Test 1 — Operational Intelligence Surface renders full 7-stage causal narrative for Bharati G-02", async ({
    page,
  }) => {
    // 1. Locate the unified Operational Intelligence Surface at top of Command Center
    const surface = page.locator('[data-testid="operational-intelligence-surface"]');
    await expect(surface).toBeVisible({ timeout: 15000 });

    // 2. Verify Operational Posture Header
    await expect(surface).toContainText(/CRITICAL OPERATIONAL EVENT/i);
    await expect(surface).toContainText(/Bharati/i);
    await expect(surface).toContainText(/SINGLE FAULT VULNERABLE/i);

    // 3. Verify Hero Causal Narrative Headline and Summary
    await expect(surface).toContainText(/Generator G-02.*Vibration Anomaly/i);
    await expect(surface).toContainText(/Life Support Zone 2/i);

    // 4. Verify all 7 Stages are present in the causal progression pipeline
    const stages = [
      "1. CHANGE",
      "2. CONTEXT",
      "3. DEPENDENCY",
      "4. RISK",
      "5. CONSEQUENCE",
      "6. SCENARIO",
      "7. ACTION",
    ];
    for (const stageName of stages) {
      await expect(surface.getByText(stageName, { exact: false })).toBeVisible();
    }

    // 5. Verify supporting telemetry metrics are grounded and displayed
    await expect(surface.getByText(/4\.8 mm\/s/i).first()).toBeVisible();
    await expect(surface.getByText(/91/i).first()).toBeVisible(); // Risk 91/100
    await expect(surface.getByText(/98\.8/i).first()).toBeVisible(); // 72h reserve margin 98.8 kW

    // 6. Verify scientific truth badges exist on causal stages
    await expect(surface.getByText("[MEASURED]").first()).toBeVisible();
    await expect(surface.getByText("[DERIVED]").first()).toBeVisible();
    await expect(surface.getByText("[SCENARIO]").first()).toBeVisible();

    // 7. Verify action decisions are present
    await expect(surface.getByText(/Inspect Asset G-02/i).first()).toBeVisible();
    await expect(surface.getByText(/Simulate 72h Outage/i).first()).toBeVisible();
  });

  test("Test 2 — Interactive navigation from Operational Decision links to existing views", async ({
    page,
  }) => {
    const surface = page.locator('[data-testid="operational-intelligence-surface"]');
    await expect(surface).toBeVisible({ timeout: 15000 });

    // 1. Click "Inspect Asset G-02"
    const inspectBtn = surface.getByRole("button", { name: /Inspect Asset G-02/i }).first();
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // Verify URL transitions to /assets/G-02
    await expect(page).toHaveURL(/.*\/assets\/G-02/);
    await expect(page.getByText(/Generator G-02/i).first()).toBeVisible();

    // 2. Return to Command Center
    await page.getByLabel("Return to Station Command Center").click();
    await expect(surface).toBeVisible({ timeout: 15000 });

    // 3. Click "Simulate 72h Outage"
    const simulateBtn = surface.getByRole("button", { name: /Simulate 72h Outage/i }).first();
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();

    // Verify URL transitions to /scenarios
    await expect(page).toHaveURL(/.*\/scenarios/);
    await expect(page.getByRole("heading", { name: "Cross-Domain Scenario Engine" })).toBeVisible();

    // 4. Return to Command Center
    await page.getByLabel("Return to Station Command Center").click();
    await expect(surface).toBeVisible({ timeout: 15000 });

    // 5. Test "WHY?" deterministic explanation drawer
    const whyBtn = page.locator('[data-testid="critical-event-why-btn"]');
    await expect(whyBtn).toBeVisible();
    await whyBtn.click();

    const drawer = page.locator('[data-testid="explanation-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/Generator G-02/i);
    await page.locator('[data-testid="explanation-drawer-close-btn"]').click();
    await expect(drawer).not.toBeVisible();
  });

  test("Test 3 — Dynamic multi-station intelligence updates when switching to Maitri", async ({
    page,
  }) => {
    const surface = page.locator('[data-testid="operational-intelligence-surface"]');
    await expect(surface).toBeVisible({ timeout: 15000 });

    // Initially Bharati G-02 critical narrative
    await expect(surface).toContainText(/Bharati/i);
    await expect(surface).toContainText(/CRITICAL OPERATIONAL EVENT/i);

    // Switch to Maitri Research Station
    const stationSelect = page.getByLabel("Select Antarctic Research Station");
    await stationSelect.selectOption("STATION-MAITRI");

    // Verify surface updates dynamically to Maitri Nominal Fleet
    await expect(surface).toContainText(/Maitri/i, { timeout: 15000 });
    await expect(surface).toContainText(/NOMINAL OPERATIONAL POSTURE/i);
    await expect(surface).toContainText(/FLEET NOMINAL|NOMINAL FLEET/i);

    // Verify Maitri specific context: Oasis weather, 133.1d fuel runway, 2x SK-402 spares
    await expect(surface).toContainText(/133/i);
    await expect(surface).toContainText(/Oasis/i);

    // Verify prioritization does NOT remain hardcoded to G-02
    await expect(surface).not.toContainText(/SINGLE FAULT VULNERABLE/i);

    // Verify Maitri decision options (advisory coordination support for Bharati)
    await expect(surface.getByText(/Station Portfolio/i).first()).toBeVisible();

    // Switch back to Bharati and verify immediate return of critical G-02 causal narrative
    await stationSelect.selectOption("STATION-BHARATI");
    await expect(surface).toContainText(/Bharati/i, { timeout: 15000 });
    await expect(surface).toContainText(/CRITICAL OPERATIONAL EVENT/i);
    await expect(surface).toContainText(/SINGLE FAULT VULNERABLE/i);
  });
});
