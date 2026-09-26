import { test, expect } from "@playwright/test";

test.describe("PolarOps UI Preservation & Real Backend Data Verification", () => {
  test("Resources Page: Preserves approved .resource-card UI and renders real backend data for STATION-BHARATI", async ({ page }) => {
    await page.goto("/resources?station=STATION-BHARATI");

    // PageHeader verification
    await expect(page.locator("h1")).toContainText("Resource & Logistics");
    await expect(page.getByText(/Current station resources, consumption and operational reserves/i)).toBeVisible();

    // Verify 8 resource cards exist with .resource-card styling
    const resourceCards = page.locator(".resource-card");
    await expect(resourceCards).toHaveCount(8);

    // POWER card: real energy model values
    const powerCard = resourceCards.filter({ has: page.getByRole("heading", { name: /power/i }) });
    await expect(powerCard).toBeVisible();
    await expect(powerCard.locator(".resource-number")).toContainText("kW");
    await expect(powerCard).toContainText(/load \/ capacity/i);
    await expect(powerCard).toContainText(/reserve margin/i);

    // FUEL card: real fuel status values calculated by backend
    const fuelCard = resourceCards.filter({ has: page.getByRole("heading", { name: /fuel/i }) });
    await expect(fuelCard).toBeVisible();
    await expect(fuelCard.locator(".resource-number")).toContainText("57%");
    await expect(fuelCard).toContainText("2,028 L/day");
    await expect(fuelCard).toContainText("142,500 L");
    await expect(fuelCard).toContainText("70.3 days");

    // LOGISTICS card: resupply vessel for Bharati
    const logisticsCard = resourceCards.filter({ has: page.getByRole("heading", { name: /logistics/i }) });
    await expect(logisticsCard).toBeVisible();
    await expect(logisticsCard).toContainText("MV Vasiliy Golovnin");

    // CRITICAL SPARES card: SK-402 inventory for Bharati
    const sparesCard = resourceCards.filter({ has: page.getByRole("heading", { name: /critical spares/i }) });
    await expect(sparesCard).toBeVisible();
    await expect(sparesCard).toContainText("SK-402");
    await expect(sparesCard).toContainText(/0 available/i);
  });

  test("Resources Page: Multi-station dynamic data updates for STATION-MAITRI", async ({ page }) => {
    await page.goto("/resources?station=STATION-MAITRI");

    // Header updates with station ID
    await expect(page.getByText(/STATION-MAITRI/i)).toBeVisible();

    const resourceCards = page.locator(".resource-card");
    await expect(resourceCards).toHaveCount(8);

    // FUEL card for Maitri
    const fuelCard = resourceCards.filter({ has: page.getByRole("heading", { name: /fuel/i }) });
    await expect(fuelCard).toBeVisible();
    await expect(fuelCard.locator(".resource-number")).toContainText("83%");
    await expect(fuelCard).toContainText("1,488 L/day");
    await expect(fuelCard).toContainText("198,000 L");
    await expect(fuelCard).toContainText("133.1 days");

    // LOGISTICS card for Maitri
    const logisticsCard = resourceCards.filter({ has: page.getByRole("heading", { name: /logistics/i }) });
    await expect(logisticsCard).toBeVisible();
    await expect(logisticsCard).toContainText("Air traverse active");

    // CRITICAL SPARES card for Maitri
    const sparesCard = resourceCards.filter({ has: page.getByRole("heading", { name: /critical spares/i }) });
    await expect(sparesCard).toBeVisible();
    await expect(sparesCard).toContainText("2 unreserved in M-2");
  });

  test("Scenarios Page: Preserves approved .scenario-item & .simulation-result UI and executes real backend simulation", async ({ page }) => {
    await page.goto("/scenarios?station=STATION-BHARATI");

    // PageHeader verification
    await expect(page.locator("h1")).toContainText("Scenario Simulation");
    await expect(page.getByText(/Explore operational consequences before action/i)).toBeVisible();

    // Verify scenario items list
    const scenarioItems = page.locator(".scenario-item");
    const count = await scenarioItems.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // First item should be selected by default and have parameter controls
    const firstScenario = scenarioItems.first();
    await expect(firstScenario).toContainText("GENERATOR FAILURE");
    await expect(firstScenario.locator("select").first()).toBeVisible();

    // Initial state of simulation panel: empty state prompt
    await expect(page.getByText(/Select a scenario and run the simulation/i)).toBeVisible();

    // Click RUN SCENARIO on the first scenario
    const runBtn = firstScenario.getByRole("button", { name: "RUN SCENARIO" });
    await runBtn.click();

    // Simulation result panel updates with real backend simulation response
    const simResult = page.locator(".simulation-result");
    await expect(simResult).toBeVisible({ timeout: 10000 });

    // Verify real backend data fields
    await expect(simResult).toContainText("Operational impact");
    await expect(simResult).toContainText("Affected dependencies");
    await expect(simResult).toContainText("Resource impact");
    await expect(simResult).toContainText("Available generation drops");
    await expect(simResult).toContainText("Recommended mitigation");
    await expect(simResult).toContainText("SIMULATION ENGINE");
    await expect(simResult).toContainText("COMPUTED");
  });
});
