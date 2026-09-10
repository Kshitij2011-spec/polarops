import { test, expect } from "@playwright/test";

test.describe("Risk Intelligence 2.0 — Multi-Layer Operational Reasoning", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Test A — Asset Intelligence G-02 exposes all 4 layers of Risk Intelligence 2.0", async ({
    page,
  }) => {
    // 1. Open Asset Intelligence for G-02
    const inspectBtn = page.getByRole("button", { name: /Inspect Asset G-02/i });
    await expect(inspectBtn).toBeVisible({ timeout: 10000 });
    await inspectBtn.click();

    // 2. LAYER 1: Current Risk & Deterministic State Transition
    await expect(page.getByText(/DETERMINISTIC OPERATIONAL RISK & EXPLAINABLE ENGINE/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/OPERATIONAL RISK LEVEL:/i)).toBeVisible();
    await expect(page.getByText(/CRITICAL OPERATIONAL RISK/i).first()).toBeVisible();

    // State transition ladder
    await expect(page.getByText(/OPERATIONAL RISK STATE TRANSITION LADDER/i)).toBeVisible();
    await expect(page.getByText(/NOMINAL/i).first()).toBeVisible();
    await expect(page.getByText(/WATCH/i).first()).toBeVisible();
    await expect(page.getByText(/ELEVATED/i).first()).toBeVisible();
    await expect(page.getByText(/HIGH/i).first()).toBeVisible();
    await expect(page.getByText(/CRITICAL/i).first()).toBeVisible();
    await expect(page.getByText(/TRIGGERED BY:/i)).toBeVisible();

    // 3. LAYER 2: Ranked Risk Drivers Matrix
    await expect(page.getByText(/RANKED RISK DRIVERS & CONTRIBUTION MATRIX/i)).toBeVisible();
    await expect(page.getByText(/#1/i).first()).toBeVisible();
    await expect(page.getByText(/Sensor Anomaly & Physical Condition/i).first()).toBeVisible();
    await expect(page.getByText(/Multi-Hop Dependency Blast Radius/i).first()).toBeVisible();
    await expect(page.getByText(/Maintenance Work Order Status/i).first()).toBeVisible();

    // 4. LAYER 4: Where Does Risk Propagate (Failure Exposure) & Recovery Exposure
    await expect(page.getByText(/WHERE DOES RISK PROPAGATE\?/i)).toBeVisible();
    await expect(page.getByText(/FAILURE EXPOSURE/i)).toBeVisible();
    await expect(page.getByText(/N-0 \(Loss of single-point redundant backup\)/i).first()).toBeVisible();
    await expect(page.getByText(/Habitat Zone 2 Heating/i).first()).toBeVisible();

    await expect(page.getByText(/WHAT MAKES RECOVERY HARD\?/i)).toBeVisible();
    await expect(page.getByText(/RECOVERY EXPOSURE/i)).toBeVisible();
    await expect(page.getByText(/BLOCKED_PARTS/i).first()).toBeVisible();
    await expect(page.getByText(/SK-402/i).first()).toBeVisible();

    // 5. Environmental Amplification & Headroom
    await expect(page.getByText(/ENVIRONMENTAL AMPLIFICATION/i).first()).toBeVisible();
    await expect(page.getByText(/SEVERE/i).first()).toBeVisible();
    await expect(page.getByText(/OPERATIONAL HEADROOM & MARGINS/i)).toBeVisible();
    await expect(page.getByText(/COMPRESSED MARGIN/i)).toBeVisible();

    // 6. LAYER 3: Deterministic Scenario Projections
    await expect(page.getByText(/HOW DOES RISK CHANGE\? \(DETERMINISTIC SCENARIO PROJECTIONS\)/i)).toBeVisible();
    await expect(page.getByText(/72H Complete Outage/i)).toBeVisible();
    await expect(page.getByText(/Extreme Cold-Snap/i)).toBeVisible();
    await expect(page.getByText(/Resupply Vessel Ice Delay/i)).toBeVisible();
    await expect(page.getByText(/Satellite Uplink Degraded/i)).toBeVisible();
  });

  test("Test B — 'Why is this high risk?' toggle and WHY drawer integration", async ({
    page,
  }) => {
    // 1. Open Asset Intelligence for G-02
    await page.getByRole("button", { name: /Inspect Asset G-02/i }).click();
    await expect(page.getByText(/DETERMINISTIC OPERATIONAL RISK & EXPLAINABLE ENGINE/i)).toBeVisible({ timeout: 10000 });

    // 2. Open Full Explanation Drawer
    const fullExpBtn = page.getByTestId("risk-card-why-btn");
    await expect(fullExpBtn).toBeVisible();
    await fullExpBtn.click();

    // 3. Confirm Explanation Drawer opens with causal chain
    const drawer = page.getByTestId("explanation-drawer");
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("explanation-what-changed")).toBeVisible();
    await expect(page.getByTestId("explanation-why-it-matters")).toBeVisible();
    await expect(page.getByTestId("explanation-evidence-section")).toBeVisible();
    await expect(page.getByTestId("explanation-consequences-section")).toBeVisible();
    await expect(page.getByTestId("explanation-constraints-section")).toBeVisible();

    // Close drawer
    await page.getByTestId("explanation-drawer-close-btn").click();
    await expect(drawer).not.toBeVisible();
  });

  test("Test C — Station switch to Maitri demonstrates nominal risk divergence", async ({
    page,
  }) => {
    // 1. Switch station from Bharati to Maitri using select#station-select
    const stationSelect = page.getByLabel("Select Antarctic Research Station");
    await stationSelect.selectOption("STATION-MAITRI");

    // 2. Wait for operational surface to load Maitri context
    const surface = page.getByTestId("operational-intelligence-surface");
    await expect(surface).toContainText(/Maitri/i, { timeout: 15000 });

    // 3. Confirm Maitri shows nominal readiness posture
    await expect(surface).toContainText(/NOMINAL OPERATIONAL POSTURE/i);
    await expect(surface).toContainText(/FLEET NOMINAL|NOMINAL FLEET/i);
    await expect(surface).toContainText(/133/i);
  });
});
