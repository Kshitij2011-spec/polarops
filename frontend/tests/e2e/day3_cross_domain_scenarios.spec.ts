import { test, expect } from '@playwright/test';

test.describe('Day 3 Cross-Domain Operational Impact & Scenario Coupling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local frontend and ensure application is loaded
    await page.goto('/');
    await expect(page.getByRole("heading", { name: /POLAROPS/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('Test 1 — Navigate to /scenarios and verify interactive controls', async ({ page }) => {
    // Navigate to Scenarios view via nav button
    const scenarioNavBtn = page.getByRole('button', { name: /scenarios/i });
    if (await scenarioNavBtn.isVisible()) {
      await scenarioNavBtn.click();
    } else {
      await page.goto('/scenarios');
    }

    // Verify header and controls
    await expect(page.getByText('WHAT-IF CONSEQUENCE SIMULATOR')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Cross-Domain Scenario Engine')).toBeVisible();
    await expect(page.getByText('Stateless Simulator: Current database state is completely preserved.')).toBeVisible();

    // Verify form controls exist
    await expect(page.locator('#scenario-type-select')).toBeVisible();
    await expect(page.locator('#target-asset-select')).toBeVisible();
    await expect(page.getByRole('button', { name: '24h' })).toBeVisible();
    await expect(page.getByRole('button', { name: '48h' })).toBeVisible();
    await expect(page.getByRole('button', { name: '72h' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Run Simulation/i })).toBeVisible();
    await expect(page.getByText(/Simulated Ambient Cold Snap/i)).toBeVisible();
  });

  test('Test 2 — Execute G-02 72h Failure simulation and verify Cross-Domain Energy Reserve Margin', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page.getByText('Cross-Domain Scenario Engine')).toBeVisible({ timeout: 10000 });

    // Click Run Simulation
    const runBtn = page.getByRole('button', { name: /Run Simulation/i });
    await runBtn.click();

    // Wait for simulation results to appear
    await expect(page.getByText(/OFFLINE FOR 72H/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Cross-Domain Energy Reserve Margin')).toBeVisible();

    // Verify the 4 KPI boxes: Thermal Demand, Projected Load, Available Capacity, Reserve Margin
    await expect(page.getByText('Thermal Demand', { exact: true })).toBeVisible();
    await expect(page.getByText('Projected Load', { exact: true })).toBeVisible();
    await expect(page.getByText('Available Capacity', { exact: true })).toBeVisible();
    await expect(page.getByText('Reserve Margin', { exact: true })).toBeVisible();

    // Verify gauge bar text contains Load and Reserve
    await expect(page.getByText(/Load:.*Reserve:/i)).toBeVisible();
  });

  test('Test 3 — Verify Recovery Constraints coupling (SK-402 Stockout & Resupply Logistics)', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page.getByText('Cross-Domain Scenario Engine')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Run Simulation/i }).click();
    await expect(page.getByText(/OFFLINE FOR 72H/i)).toBeVisible({ timeout: 15000 });

    // Verify Recovery Constraints section
    await expect(page.getByText('Recovery Constraints — Logistics & Supply Chain')).toBeVisible();
    await expect(page.getByText('SK-402', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('BLOCKING').first()).toBeVisible();
    await expect(page.getByText(/0 units in local warehouse stock/i).first()).toBeVisible();

    // Verify resupply vessel reference if present
    await expect(page.getByText(/MV Vasiliy Golovnin|Expedition vessel/i).first()).toBeVisible();
  });

  test('Test 4 — Click "WHY? Explain Disruption" and verify Explanation Drawer opens with causal reasoning', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page.getByText('Cross-Domain Scenario Engine')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Run Simulation/i }).click();
    await expect(page.getByText(/OFFLINE FOR 72H/i)).toBeVisible({ timeout: 15000 });

    // Locate and click the explain button
    const explainBtn = page.locator('[data-testid="explain-scenario-btn"]');
    await expect(explainBtn).toBeVisible();
    await explainBtn.click();

    // Verify Explanation Drawer opens
    const drawer = page.locator('[data-testid="explanation-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // Verify drawer contents
    await expect(drawer.getByText(/What-If Scenario/i)).toBeVisible();
    await expect(drawer.getByText(/Outage Impact & Reserve Exposure/i)).toBeVisible();
    await expect(drawer.getByText('Available Generation Capacity')).toBeVisible();
    await expect(drawer.getByText('Generation Reserve Margin')).toBeVisible();
    await expect(drawer.getByText(/SK-402/i).first()).toBeVisible();

    // Close drawer
    const closeBtn = page.locator('[data-testid="explanation-drawer-close-btn"]');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test('Test 5 — Re-run with 24h duration and verify dynamic projection update', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page.getByText('Cross-Domain Scenario Engine')).toBeVisible({ timeout: 10000 });

    // Select 24h duration
    await page.getByRole('button', { name: '24h' }).click();
    await page.getByRole('button', { name: /Run Simulation/i }).click();

    // Verify 24h results appear
    await expect(page.getByText(/OFFLINE FOR 24H/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Cross-Domain Energy Reserve Margin')).toBeVisible();
  });

  test('Test 6 — Verify SCENARIO_EVALUATED event appears in Command Center Activity Stream', async ({ page }) => {
    // 1. Run simulation on /scenarios
    await page.goto('/scenarios');
    await expect(page.getByText('Cross-Domain Scenario Engine')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Run Simulation/i }).click();
    await expect(page.getByText(/OFFLINE FOR/i)).toBeVisible({ timeout: 15000 });

    // 2. Navigate back to Command Center
    const backBtn = page.locator('button[aria-label="Return to Station Command Center"]');
    await backBtn.click();
    await expect(page.getByText('OPERATIONAL ACTIVITY STREAM')).toBeVisible({ timeout: 10000 });

    // 3. Activity Stream should contain a Scenario evaluation event
    const stream = page.locator('[data-testid="operational-activity-stream"]');
    await expect(stream.getByText(/Scenario Evaluated|Outage/i).first()).toBeVisible({ timeout: 10000 });
  });
});
