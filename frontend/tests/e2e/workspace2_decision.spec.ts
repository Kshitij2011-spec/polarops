import { test, expect } from "@playwright/test";

test.describe("Workspace 2: Incident + Decision Cockpit", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Decision Cockpit route
    await page.goto("/cockpit?station=STATION-BHARATI");
    // Wait for the workspace container to appear
    await expect(page.locator("h1:has-text('Incident + Decision Cockpit')")).toBeVisible({
      timeout: 15000,
    });
  });

  test("1. Active Incident COP displays incident context, blast radius, truth badges, and chronological timeline", async ({
    page,
  }) => {
    // 1. Verify Active COP tab is selected by default
    const copTab = page.locator("button:has-text('Active Incident COP')");
    await expect(copTab).toBeVisible();

    // 2. Verify Incident Header and Metadata
    await expect(page.locator("text=INC-2026-04")).toBeVisible();
    await expect(
      page.locator("h2:has-text('Generator G-02 High Vibration Anomaly')")
    ).toBeVisible();
    await expect(page.locator("text=MAJOR SEVERITY")).toBeVisible();

    // 3. Verify Truth Badge provenance (MEASURED data honesty)
    const truthBadges = page.locator("span[role='note']:has-text('MEASURED')");
    await expect(truthBadges.first()).toBeVisible();

    // 4. Verify Blast Radius & Risk Score
    await expect(page.locator("text=Composite Modeled Risk")).toBeVisible();
    await expect(page.locator("text=Directly Affected Physical Equipment")).toBeVisible();
    await expect(page.locator("text=Degrading Life-Support & Science Services")).toBeVisible();

    // 5. Verify Chronological Sequence Timeline
    await expect(page.locator("text=Temporal Sequence & Action Ledger")).toBeVisible();
    await expect(page.locator("text=Incident Inception & Automated Sensor Breach")).toBeVisible();
    await expect(page.locator("text=SCADA Telemetry Alarm Loop")).toBeVisible();

    // 6. Verify Action Ledger is present
    await expect(page.locator("text=Human Action Execution Ledger")).toBeVisible();
  });

  test("2. What-If Counterfactual Sandbox provides isolated simulation, baseline comparison, and decision packages", async ({
    page,
  }) => {
    // 1. Switch to What-If Sandbox mode
    const sandboxTab = page.locator("button:has-text('What-If Sandbox')");
    await sandboxTab.click();

    // 2. Verify Sandbox Visual Isolation and Warning Banner
    await expect(page.locator("text=HYPOTHETICAL SIMULATION SANDBOX")).toBeVisible();
    await expect(
      page.locator("text=Zero System Mutation. Counterfactual projections evaluated in-memory")
    ).toBeVisible();

    // 3. Verify SCENARIO TruthBadge
    const scenarioBadge = page.locator("span[role='note']:has-text('SCENARIO')");
    await expect(scenarioBadge.first()).toBeVisible();

    // 4. Test Presets (Cold Snap G-02 Outage)
    const genFailPreset = page.locator("button:has-text('Cold Snap G-02 Outage')");
    await expect(genFailPreset).toBeVisible();
    await genFailPreset.click();

    // 5. Execute Simulation
    const runSimBtn = page.locator("button:has-text('Evaluate What-If Scenario')");
    await expect(runSimBtn).toBeVisible();
    await runSimBtn.click();

    // 6. Verify Simulation Comparison Deltas (Baseline vs Scenario)
    await expect(
      page.locator("text=Deterministic Impact & Headroom Deltas")
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Grid Reserve Margin")).toBeVisible();
    await expect(page.locator("text=Risk Surge:")).toBeVisible();

    // 7. Verify Candidate Countermeasures & Decision Package
    await expect(page.locator("text=Evaluated Decision Packages")).toBeVisible();
    await expect(page.locator("text=1. Observation (Condition):").first()).toBeVisible();
    await expect(page.locator("text=3. Derivation (Math):").first()).toBeVisible();

    // 8. Test Hold-to-Confirm Authorization Bridge
    const holdBtn = page.locator("button:has-text('Authorize Action')").first();
    await expect(holdBtn).toBeVisible();

    // Perform Hold interaction via accessible keyboard hold
    await holdBtn.focus();
    await page.keyboard.down("Enter");
    await page.waitForTimeout(1600); // Exceeds 1200ms hold threshold
    await page.keyboard.up("Enter");

    // Verify action commit bridge transitions to active incident ledger with confirmation
    await expect(
      page.locator("text=successfully authorized and committed to ledger")
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Action: DISPATCH_G01_PRIORITY").first()).toBeVisible();
  });

  test("3. Institutional Memory Browser is discoverable and distinct from live telemetry", async ({
    page,
  }) => {
    // 1. Switch to Institutional Memory tab
    const memoryTab = page.locator("button:has-text('Institutional Memory')");
    await memoryTab.click();

    // 2. Verify header & archive distinction
    await expect(
      page.locator("text=Institutional Memory & Operational Precedents")
    ).toBeVisible();

    // 3. Verify precedent search functionality
    const searchInput = page.locator("input[placeholder*='operational memory']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("generator");

    // 4. Verify precedent item details
    await expect(
      page.locator("text=2025 Winter Generator Tripping Incident").first()
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Institutional Lesson Learned:").first()).toBeVisible();
  });

  test("4. Tablet ergonomics (1024x768) and no horizontal overflow", async ({ page }) => {
    // Set viewport to standard ruggedized polar field tablet
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/cockpit?station=STATION-BHARATI");

    await expect(page.locator("h1:has-text('Incident + Decision Cockpit')")).toBeVisible();

    // Verify touch buttons have adequate height (>= 40px)
    const modeButtons = page.locator("button:has-text('Active Incident COP')");
    const box = await modeButtons.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
    }

    // Verify no horizontal overflow on the page body
    const isHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isHorizontalOverflow).toBe(false);
  });
});
