import { test, expect } from "@playwright/test";

test.describe("Workspace 1: Command + Digital Twin (Dhruv)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to /twin
    await page.goto("/twin");
  });

  test("1. Station Headroom Bar renders real posture, reserve margin, thermal hold, and active anomaly banner", async ({
    page,
  }) => {
    // Workspace region header
    const mainWorkspace = page.locator("div[aria-label='Command & Digital Twin Workspace']");
    await expect(mainWorkspace).toBeVisible();

    // Verify Headroom Bar contents
    const headroomBar = page.locator("div[aria-label='Station Operational Headroom Bar']");
    await expect(headroomBar).toBeVisible();
    await expect(headroomBar).toContainText("Command + Digital Twin");
    await expect(headroomBar).toContainText("POSTURE:");
    await expect(headroomBar).toContainText("RESERVE MARGIN:");
    await expect(headroomBar).toContainText("350 kW");
    await expect(headroomBar).toContainText("THERMAL HOLD:");
    await expect(headroomBar).toContainText("14.2 Hours");

    // Verify Anomaly Banner for G-02
    const anomalyBanner = page.locator("div[role='alert']");
    await expect(anomalyBanner).toBeVisible();
    await expect(anomalyBanner).toContainText("ACTIVE ANOMALY:");
    await expect(anomalyBanner).toContainText("G-02");
    await expect(anomalyBanner).toContainText("4.8 mm/s");
  });

  test("2. Deterministic Operational Topology DAG renders hierarchical layers, nodes, and conduits", async ({
    page,
  }) => {
    // Verify Topology Canvas is active by default
    const canvas = page.locator("div[role='region'][aria-label='Operational Topology Canvas']");
    await expect(canvas).toBeVisible();

    // Verify deterministic layers exist
    await expect(canvas).toContainText("PRIME MOVERS");
    await expect(canvas).toContainText("DISTRIBUTION BUSES");
    await expect(canvas).toContainText("CONSUMERS / PUMPS");

    // Verify root node G-02 is visible
    const g02Node = canvas.locator("[data-node-id='G-02']");
    await expect(g02Node).toBeVisible();
    await expect(g02Node).toContainText("G-02");

    // Verify conduits legend is present
    await expect(canvas).toContainText("Electrical Grid (415V)");
    await expect(canvas).toContainText("Hydronic Glycol Heating");
    await expect(canvas).toContainText("Arctic Diesel LFO");
  });

  test("3. 1-Click Accessible TreeGrid Table synchronizes with selection and allows switching back", async ({
    page,
  }) => {
    // Switch to Accessible TreeGrid via view switcher
    await page.click("button[role='tab']:has-text('Accessible TreeGrid')");

    // Verify table is visible
    const table = page.locator("table[role='treegrid']");
    await expect(table).toBeVisible();

    // Check table headers
    await expect(table).toContainText("DEPTH / NODE CODE");
    await expect(table).toContainText("RELATIONSHIP");
    await expect(table).toContainText("REDUNDANCY POSTURE");

    // Check G-02 row exists and is selected
    const g02Row = table.locator("tr[role='row']").filter({ hasText: "G-02" });
    await expect(g02Row).toBeVisible();
    await expect(g02Row).toHaveAttribute("aria-selected", "true");

    // Select a different row if available (e.g. G-01)
    const g01Row = table.locator("tr[role='row']").filter({ hasText: "G-01" });
    if (await g01Row.count() > 0) {
      await g01Row.first().click();
      // Verify inspector header updates
      const inspector = page.locator("aside[aria-label='Asset Telemetry & Risk Inspector']");
      await expect(inspector).toContainText("G-01");
    }

    // Switch back to Living DAG Canvas using the 1-click button inside table header
    await page.click("button:has-text('Switch to Living DAG Canvas')");
    await expect(page.locator("div[role='region'][aria-label='Operational Topology Canvas']")).toBeVisible();
  });

  test("4. 2D Station Spatial Schematic renders physical modules, windward blizzard exposure, and equipment placement", async ({
    page,
  }) => {
    // Switch to 2D Schematic
    await page.click("button[role='tab']:has-text('2D Station Schematic')");

    // Verify schematic container
    const schematic = page.locator("div[role='region'][aria-label='2D Isometric Station Physical Compartment Schematic']");
    await expect(schematic).toBeVisible();

    // Verify blizzard and environmental telemetry
    await expect(schematic).toContainText("Blizzard 48 kts");
    await expect(schematic).toContainText("Exterior: -38.2°C");
    await expect(schematic).toContainText("Prevailing Windward Face");

    // Verify SVG floor plan contains key station blocks
    const svg = schematic.locator("svg[role='img']");
    await expect(svg).toBeVisible();
    await expect(svg).toContainText("PWR-BLOCK-A");
    await expect(svg).toContainText("HABITAT-01");
  });

  test("5. Contextual Asset Inspector exposes live telemetry sparkline, thresholds, and measured truth badge", async ({
    page,
  }) => {
    // Ensure G-02 is selected
    await page.goto("/twin?asset=G-02");

    const inspector = page.locator("aside[aria-label='Asset Telemetry & Risk Inspector']");
    await expect(inspector).toBeVisible();

    // Verify asset identity
    await expect(inspector).toContainText("G-02");
    await expect(inspector).toContainText("WARNING");

    // Telemetry Tab (default)
    await expect(inspector).toContainText("Bearing Vibration");
    await expect(inspector).toContainText("4.8");
    await expect(inspector).toContainText("mm/s");
    await expect(inspector).toContainText("WARNING LIMIT:");
    await expect(inspector).toContainText("4");
    await expect(inspector).toContainText("TRIP CRITICAL:");
    await expect(inspector).toContainText("6");

    // Verify SVG Sparkline is rendered
    const sparkline = inspector.locator("svg line[stroke='#ef4444']");
    await expect(sparkline).toBeAttached();
    await expect(inspector.locator("svg").first()).toBeVisible();
  });

  test("6. Contextual Asset Inspector exposes Risk Intelligence 2.0, state ladder, and spare part bottleneck", async ({
    page,
  }) => {
    await page.goto("/twin?asset=G-02");

    const inspector = page.locator("aside[aria-label='Asset Telemetry & Risk Inspector']");
    await expect(inspector).toBeVisible();

    // Switch to Risk 2.0 tab
    await inspector.locator("button:has-text('Risk 2.0')").click();

    // Verify overall risk score and level
    await expect(inspector).toContainText("Risk Intelligence 2.0");
    await expect(inspector).toContainText("87");
    await expect(inspector).toContainText("CRITICAL");

    // Verify State Transition Ladder
    await expect(inspector).toContainText("STATE TRANSITION POSTURE:");
    await expect(inspector).toContainText("NOMINAL");
    await expect(inspector).toContainText("CRITICAL");

    // Verify Ranked Risk Drivers
    await expect(inspector).toContainText("Ranked Causal Risk Drivers");
    await expect(inspector).toContainText("Bearing Vibration");
    await expect(inspector).toContainText("Coolant Temperature");

    // Verify Recovery Exposure / Spares Bottleneck
    await expect(inspector).toContainText("RECOVERY BOTTLENECK & SPARES");
    await expect(inspector).toContainText("SK-402");
    await expect(inspector).toContainText("Stockout");
    await expect(inspector).toContainText("11 Days Out");
  });

  test("7. Contextual Asset Inspector exposes 5-Stage Causal Reasoning chain", async ({
    page,
  }) => {
    await page.goto("/twin?asset=G-02");

    const inspector = page.locator("aside[aria-label='Asset Telemetry & Risk Inspector']");
    await expect(inspector).toBeVisible();

    // Switch to Reasoning tab
    await inspector.locator("button:has-text('Reasoning')").click();

    // Verify 5-stage causal breakdown
    await expect(inspector).toContainText("5-Stage Causal Chain");
    await expect(inspector).toContainText("Stage 1 • Observed Physical Condition");
    await expect(inspector).toContainText("Stage 2 • Physical Failure Mechanism");
    await expect(inspector).toContainText("Stage 3 • Dependency Blast Radius");
    await expect(inspector).toContainText("Stage 4 • Operational Consequence");
    await expect(inspector).toContainText("Stage 5 • Recovery Constraints & Action");
  });

  test("8. Cross-Workspace Workflows preserve entity context to /cockpit and /continuity", async ({
    page,
  }) => {
    await page.goto("/twin?asset=G-02");

    const inspector = page.locator("aside[aria-label='Asset Telemetry & Risk Inspector']");
    await expect(inspector).toBeVisible();

    // Check link to Cockpit with simulation query params
    const cockpitLink = inspector.locator("a[href*='/cockpit']");
    await expect(cockpitLink).toBeVisible();
    const cockpitHref = await cockpitLink.getAttribute("href");
    expect(cockpitHref).toContain("asset=G-02");
    expect(cockpitHref).toContain("mode=sim");

    // Check link to Continuity with spares query params
    const continuityLink = inspector.locator("a[href*='/continuity']");
    await expect(continuityLink).toBeVisible();
    const continuityHref = await continuityLink.getAttribute("href");
    expect(continuityHref).toContain("asset=G-02");
    expect(continuityHref).toContain("tab=spares");
  });

  test("9. Responsive layout at 1024x768 has zero horizontal overflow", async ({
    page,
  }) => {
    // Set viewport to 1024x768
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/twin?asset=G-02");

    const main = page.locator("div[aria-label='Command & Digital Twin Workspace']");
    await expect(main).toBeVisible();

    // Check horizontal scroll overflow on body and main container
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);
  });
});
