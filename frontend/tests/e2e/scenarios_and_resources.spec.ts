import { test, expect } from "@playwright/test";

test.describe("PolarOps Day 3: Cross-Domain Resources, Energy & Scenario Engine", () => {
  test("Test A — Resources: Energy, Fuel, and Inventory visibility", async ({ page }) => {
    // 1. Navigate to /resources
    await page.goto("/resources");

    // 2. Verify title and heading
    await expect(page.getByRole("heading", { name: /Resource & Energy Intelligence/i, level: 1 })).toBeVisible();

    // 3. Verify Energy & Fuel tab contents (default active tab)
    await expect(page.getByText(/REMAINING FUEL STOCK/i)).toBeVisible();
    await expect(page.getByText(/142,500 L/i)).toBeVisible();
    await expect(page.getByText(/Deterministic Energy & Thermal Balance Model/i)).toBeVisible();
    await expect(page.getByText(/Outside Climate & Thermal Demand/i)).toBeVisible();

    // 4. Switch to Inventory & Spares tab
    await page.getByRole("button", { name: /Inventory & Spares/i }).click();
    await expect(page.getByText(/Station Warehouse Critical Spares Inventory/i)).toBeVisible();
    await expect(page.getByText("SK-402", { exact: true })).toBeVisible();
    await expect(page.getByText(/Fuel Pump Seal Kit/i)).toBeVisible();
  });

  test("Test B — Recovery Exposure: G-02 spare unavailable and resupply exposure visible", async ({ page }) => {
    await page.goto("/resources");

    // Click G-02 Recovery Chain tab
    await page.getByRole("button", { name: /G-02 Recovery Chain/i }).click();

    // Verify recovery chain steps
    await expect(page.getByText(/Generator G-02 End-to-End Recovery Chain/i)).toBeVisible();
    await expect(page.getByText(/STEP 1: ASSET/i)).toBeVisible();
    await expect(page.getByText(/STEP 3: REQUIRED SPARE/i)).toBeVisible();
    await expect(page.getByText("SK-402", { exact: true })).toBeVisible();
    await expect(page.getByText(/STEP 4: WAREHOUSE STOCK/i)).toBeVisible();
    await expect(page.getByText(/0 Units Available/i)).toBeVisible();
    await expect(page.getByText(/STEP 5: INBOUND VESSEL/i)).toBeVisible();

    // Verify evaluated HIGH recovery exposure
    await expect(page.getByText(/OPERATIONAL RECOVERY EXPOSURE: HIGH/i)).toBeVisible();
    await expect(page.getByText(/Recovery is constrained/i)).toBeVisible();
  });

  test("Test C — Scenario: Run Generator G-02 Failure Simulation for 72h", async ({ page }) => {
    await page.goto("/scenarios");

    // Verify simulation controls exist
    await expect(page.getByRole("heading", { name: /Cross-Domain Scenario Engine/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/WHAT-IF CONSEQUENCE SIMULATOR/i)).toBeVisible();

    // Select 72h duration
    await page.getByRole("button", { name: "72h" }).click();

    // Run simulation
    const runBtn = page.getByRole("button", { name: /^Run Simulation$/i });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Verify simulation results container appears
    await expect(page.getByText(/Baseline vs\. Simulated Scenario Impact Deltas/i)).toBeVisible();
    await expect(page.getByText(/Prototype Decision-Support Countermeasures/i)).toBeVisible();
  });

  test("Test D — Baseline vs Scenario: Both sections appear separately with truth badges", async ({ page }) => {
    await page.goto("/scenarios");

    // Run default 72h G-02 failure simulation
    await page.getByRole("button", { name: /^Run Simulation$/i }).click();
    await expect(page.getByText(/Baseline vs\. Simulated Scenario Impact Deltas/i)).toBeVisible();

    // Verify baseline & scenario indicators are distinct
    await expect(page.getByText("Baseline", { exact: true })).toBeVisible();
    await expect(page.getByText("Scenario", { exact: true })).toBeVisible();

    // Verify truth badges
    await expect(page.getByText("SCENARIO").first()).toBeVisible();
  });

  test("Test E — Consequence Change: Metric deltas, affected services, and countermeasures appear", async ({ page }) => {
    await page.goto("/scenarios");

    await page.getByRole("button", { name: /^Run Simulation$/i }).click();
    await expect(page.getByText(/Baseline vs\. Simulated Scenario Impact Deltas/i)).toBeVisible();

    // Assert metric deltas differ from baseline
    await expect(page.getByText(/Available Generation Capacity/i)).toBeVisible();
    await expect(page.getByText(/-300/i).first()).toBeVisible();

    // Assert downstream exposed services are listed
    await expect(page.getByText(/Downstream Services Exposed by Outage/i)).toBeVisible();
    await expect(page.getByText("Habitat Zone 2 Heating", { exact: true })).toBeVisible();

    // Assert prototype decision-support options are present and clearly advisory
    await expect(page.getByText(/Prototype Decision-Support Countermeasures/i)).toBeVisible();
    await expect(page.getByText(/Prioritize G-01 Generation Dispatch/i)).toBeVisible();
    await expect(page.getByText(/Shed Non-Critical Science Payloads/i)).toBeVisible();
  });

  test("Test F — Re-run: Changing duration from 72h to 24h updates the model projection", async ({ page }) => {
    await page.goto("/scenarios");

    // 1. Run 72h
    await page.getByRole("button", { name: "72h" }).click();
    await page.getByRole("button", { name: /^Run Simulation$/i }).click();
    await expect(page.getByText(/OFFLINE FOR 72H/i)).toBeVisible();

    // 2. Switch to 24h and re-run
    await page.getByRole("button", { name: "24h" }).click();
    await page.getByRole("button", { name: /^Run Simulation$/i }).click();

    // Verify duration updated to 24H
    await expect(page.getByText(/OFFLINE FOR 24H/i)).toBeVisible();
  });

  test("Test G — Baseline Preservation: Returning to Command Center preserves baseline state", async ({ page }) => {
    await page.goto("/scenarios");

    // Run simulation
    await page.getByRole("button", { name: /^Run Simulation$/i }).click();
    await expect(page.getByText(/Baseline vs\. Simulated Scenario Impact Deltas/i)).toBeVisible();

    // Return to Command Center via Header nav button
    await page.getByRole("button", { name: "Command Center", exact: true }).first().click();

    // Verify Command Center loads with intact baseline telemetry
    await expect(page.getByText(/STATION STATUS/i)).toBeVisible();
    await expect(page.getByText(/FUEL & RUNWAY/i)).toBeVisible();
    await expect(page.getByText(/142,500 L/i)).toBeVisible();
    await expect(page.getByText(/Generator G-02.*Vibration Anomaly/i)).toBeVisible();
  });
});
