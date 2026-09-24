import { test, expect } from "@playwright/test";

test.describe("Workspace 3: Continuity + Logistics", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Continuity Workspace route
    await page.goto("/continuity?station=STATION-BHARATI");
    // Wait for the workspace container to appear
    await expect(
      page.locator("h1:has-text('Continuity + Logistics Workspace')")
    ).toBeVisible({ timeout: 15000 });
  });

  test("1. Fuel & Energy Runway displays authoritative stock, burn rate, coupled thermodynamics, and multi-station headroom", async ({
    page,
  }) => {
    // 1. Verify Fuel tab is active
    const fuelTab = page.locator("button:has-text('Fuel & Energy Runway')");
    await expect(fuelTab).toBeVisible();

    // 2. Verify Hero Fuel Metrics
    await expect(
      page.locator("text=Station Fuel Runway & Autonomous Endurance")
    ).toBeVisible();
    await expect(page.locator("text=Projected Runway")).toBeVisible();
    await expect(page.locator("text=Remaining Fuel Stock")).toBeVisible();
    await expect(page.locator("text=Average Hourly Burn Rate")).toBeVisible();

    // 3. Verify Truth Badges for Provenance
    const derivedBadges = page.locator("span[role='note']:has-text('DERIVED')");
    await expect(derivedBadges.first()).toBeVisible();

    // 4. Verify Coupled Thermodynamic Energy Model
    await expect(
      page.locator("text=Coupled Energy Model & Thermal Heating Load")
    ).toBeVisible();
    await expect(page.locator("text=Outside Air Temperature")).toBeVisible();
    await expect(page.locator("text=Habitat Thermal Demand")).toBeVisible();
    await expect(page.locator("text=Electrical Load vs Capacity")).toBeVisible();

    // 5. Test Cold-Snap Sensitivity Toggle
    const sensitivityBtn = page.locator("button:has-text('Test Cold-Snap Sensitivity')");
    await expect(sensitivityBtn).toBeVisible();
    await sensitivityBtn.click();
    await expect(
      page.locator("text=Hypothetical Ambient Cold-Snap Override:")
    ).toBeVisible();

    // 6. Verify Cross-Station Mutual Aid & Logistics Headroom
    await expect(
      page.locator("text=Cross-Station Mutual Aid & Logistics Headroom")
    ).toBeVisible();
    await expect(page.locator("text=STATION-BHARATI").first()).toBeVisible();
    await expect(page.locator("text=STATION-MAITRI").first()).toBeVisible();
  });

  test("2. Equipment Recovery & Spares displays causal chain, recovery blockers, and searchable spares catalog", async ({
    page,
  }) => {
    // 1. Switch to Recovery & Spares tab
    const sparesTab = page.locator("button:has-text('Recovery & Spares')");
    await sparesTab.click();

    // 2. Verify Recovery Chain Hero
    await expect(
      page.locator("text=Equipment Recovery & Spare Exposure Chain")
    ).toBeVisible();
    await expect(page.locator("text=1. Degraded Asset")).toBeVisible();
    await expect(page.locator("text=2. Active Work Order")).toBeVisible();
    await expect(page.locator("text=3. Required Part")).toBeVisible();
    await expect(page.locator("text=4. Warehouse Stock")).toBeVisible();
    await expect(page.locator("text=5. Inbound Resupply")).toBeVisible();

    // 3. Verify Operational Consequence Callout
    await expect(
      page.locator("text=Operational Consequence & Exposure Assessment:")
    ).toBeVisible();

    // 4. Verify Active Station Recovery Blockers
    await expect(page.locator("text=Active Station Recovery Blockers")).toBeVisible();

    // 5. Test Secondary Deep-Dive Spares Catalog Inspection
    const inspectSparesBtn = page.locator("button:has-text('Inspect All Spares')");
    await expect(inspectSparesBtn).toBeVisible();
    await inspectSparesBtn.click();

    // Verify catalog table appeared
    await expect(page.locator("th:has-text('Part Number')")).toBeVisible();
    await expect(page.locator("th:has-text('Bin Location')")).toBeVisible();

    // Test Search input
    const searchInput = page.locator("input[placeholder*='Search spare parts']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("bearing");
  });

  test("3. Inbound Maritime Resupply displays expedition voyages, manifested cargo, and pack ice constraints", async ({
    page,
  }) => {
    // 1. Switch to Maritime Resupply tab
    const resupplyTab = page.locator("button:has-text('Maritime Resupply')");
    await resupplyTab.click();

    // 2. Verify Maritime Header & Truth Badge
    await expect(
      page.locator("text=Maritime & Aviation Inbound Resupply Logistics")
    ).toBeVisible();
    await expect(page.locator("span[role='note']:has-text('ESTIMATED')").first()).toBeVisible();

    // 3. Verify Scheduled Vessels & Voyage Metrics
    await expect(page.locator("text=MV Vasiliy Golovnin").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Manifested Cargo:").first()).toBeVisible();
    await expect(page.locator("text=Expected Arrival:").first()).toBeVisible();
    await expect(page.locator("text=Voyage Drift / Delay:").first()).toBeVisible();
  });

  test("4. Edge Resilience & Priority Queue displays 7-state lifecycle, transceiver metrics, and queue reconciliation", async ({
    page,
  }) => {
    // 1. Switch to Edge Resilience & Sync tab
    const resilienceTab = page.locator("button:has-text('Edge Resilience & Sync')");
    await resilienceTab.click();

    // 2. Verify Resilience Header
    await expect(
      page.locator("text=Resilience & Offline Priority Synchronization Engine")
    ).toBeVisible();

    // 3. Verify 7-State Lifecycle Stepper
    await expect(page.locator("text=NORMAL").first()).toBeVisible();
    await expect(page.locator("text=LOCAL EDGE").first()).toBeVisible();
    await expect(page.locator("text=QUEUE BUFFER").first()).toBeVisible();
    await expect(page.locator("text=SYNCHRONIZING").first()).toBeVisible();
    await expect(page.locator("text=RECONCILED").first()).toBeVisible();

    // 4. Verify Transceiver Metrics
    await expect(page.locator("text=Round-Trip Latency:")).toBeVisible();
    await expect(page.locator("text=Link Bandwidth:")).toBeVisible();
    await expect(page.locator("text=Pending Unsynced Queue:")).toBeVisible();

    // 5. Verify Queue Table / Reconcile Button
    await expect(page.locator("text=Station Edge Priority Sync Queue")).toBeVisible();
  });

  test("5. Science Experiment Continuity displays controllable load, local buffer, and policy curtailment", async ({
    page,
  }) => {
    // 1. Switch to Science Continuity tab
    const scienceTab = page.locator("button:has-text('Science Continuity')");
    await scienceTab.click();

    // 2. Verify Science Header
    await expect(
      page.locator("text=Scientific Experiment Continuity & Controllable Load")
    ).toBeVisible();

    // 3. Verify KPI summary
    await expect(page.locator("text=Active Science Payloads:")).toBeVisible();
    await expect(page.locator("text=Total Controllable Load:")).toBeVisible();
    await expect(page.locator("text=Total Local Buffered Data:")).toBeVisible();

    // 4. Test Operational Policy Curtailment
    const policySelect = page.locator("select:has-text('Nominal')");
    await expect(policySelect).toBeVisible();
    await policySelect.selectOption("TIER_3_DEFERRED");

    // Verify at least one instrument was curtailed
    await expect(page.locator("text=CURTAILED").first()).toBeVisible({ timeout: 5000 });
  });

  test("6. Tablet ergonomics (1024x768), touch target sizing, and zero horizontal overflow", async ({
    page,
  }) => {
    // Set viewport to standard ruggedized polar field tablet
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/continuity?station=STATION-BHARATI");

    await expect(
      page.locator("h1:has-text('Continuity + Logistics Workspace')")
    ).toBeVisible();

    // Verify tab switcher touch buttons have adequate height (>= 40px)
    const fuelButton = page.locator("button:has-text('Fuel & Energy Runway')");
    const box = await fuelButton.boundingBox();
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
