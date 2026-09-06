import { test, expect } from "@playwright/test";

test.describe("PolarOps Station Command Center (Day 1 MVP)", () => {
  test("Test A — Command Center Loads and displays mission control header", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify primary application brand
    const heading = page.getByRole("heading", { name: /POLAROPS/i, level: 1 });
    await expect(heading).toBeVisible();

    const subtitle = page.getByText("Antarctic Operational Digital Twin");
    await expect(subtitle).toBeVisible();

    // 2. Verify Comms connectivity and mode
    const commsBadge = page.getByTestId("comms-indicator");
    await expect(commsBadge).toBeVisible();
    await expect(commsBadge).toContainText(/ONLINE/i);

    // 3. Verify Station switcher select exists
    const stationSelect = page.getByLabel("Select Antarctic Research Station");
    await expect(stationSelect).toBeVisible();
    await expect(stationSelect).toHaveValue("STATION-BHARATI");
  });

  test("Test B — Bharati Real Data Appears with status, weather, and fuel runway", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify Bharati station status card
    await expect(page.getByText(/STATION STATUS/i)).toBeVisible();
    await expect(page.getByText(/Composite Station Health/i)).toBeVisible();

    // 2. Verify Fuel & Runway values from backend
    await expect(page.getByText(/FUEL & RUNWAY/i)).toBeVisible();
    await expect(page.getByText(/142,500 L/i)).toBeVisible();
    await expect(page.getByText(/Estimated Runway:/i)).toBeVisible();

    // 3. Verify Ambient Weather from backend
    await expect(page.getByText(/ENVIRONMENT/i)).toBeVisible();
    await expect(page.getByText(/-28\.5°C/i)).toBeVisible();
    await expect(page.getByText(/42 kt/i)).toBeVisible();

    // 4. Verify G-02 Hero Anomaly in Critical Events
    await expect(page.getByText(/CRITICAL OPERATIONAL EVENT/i)).toBeVisible();
    await expect(page.getByText(/Generator G-02.*Vibration Anomaly/i)).toBeVisible();
    await expect(page.getByText(/4\.8 mm\/s/i).first()).toBeVisible();

    // 5. Verify Subsystem Grid
    await expect(page.getByText(/SUBSYSTEM HEALTH & TELEMETRY MATRIX/i)).toBeVisible();
    await expect(page.getByText(/Power Generation/i)).toBeVisible();
    await expect(page.getByText("Thermal Loop", { exact: true })).toBeVisible();
  });

  test("Test C — Station Switch to Maitri updates operational telemetry", async ({
    page,
  }) => {
    await page.goto("/");

    const stationSelect = page.getByLabel("Select Antarctic Research Station");
    await expect(stationSelect).toBeVisible();

    // Switch to Maitri
    await stationSelect.selectOption("STATION-MAITRI");

    // Verify UI updates with Maitri's spatial topology and footer
    await expect(page.getByText(/STATION SPATIAL TOPOLOGY · Maitri/i)).toBeVisible({ timeout: 10000 });
    await expect(stationSelect).toHaveValue("STATION-MAITRI");
  });

  test("Test D — Backend Failure displays resilient error state", async ({
    page,
  }) => {
    // Intercept station overview endpoint to simulate service failure
    await page.route(/.*\/station\/overview.*/, async (route) => {
      await route.abort("failed");
    });

    await page.goto("/");

    // Verify error state appears gracefully without crash
    const errorState = page.getByTestId("error-state");
    await expect(errorState).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Station Telemetry Feed Unavailable/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Retry Telemetry Connection/i })).toBeVisible();
  });

  test("Test E — G-02 Interaction navigates to Asset Intelligence placeholder", async ({
    page,
  }) => {
    await page.goto("/");

    // Click "Inspect Asset G-02" button in Critical Events
    const inspectBtn = page.getByRole("button", { name: /Inspect Asset G-02/i });
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // Verify transition to Asset Intelligence route
    await expect(page.getByText(/Diesel Generator G-02/i).first()).toBeVisible();
    await expect(page.getByText(/OPERATIONAL RISK/i).first()).toBeVisible();
    await expect(page.getByText(/Bearing Vibration/i).first()).toBeVisible();
    await expect(page.getByText(/4\.8 mm\/s/i).first()).toBeVisible();

    // Verify return navigation back to Command Center
    const backBtn = page.getByRole("button", { name: /Return to Station Command Center/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify Command Center view is restored
    await expect(page.getByText(/SUBSYSTEM HEALTH & TELEMETRY MATRIX/i)).toBeVisible();
  });
});
