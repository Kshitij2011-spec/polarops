import { test, expect } from "@playwright/test";

test.describe("Day 2 Asset Intelligence, Multi-Hop Dependency & Explainable Risk", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Test A — Open G-02 from Command Center and display Asset Intelligence", async ({
    page,
  }) => {
    // 1. Locate and click "Inspect Asset G-02" in the Critical Events banner
    const inspectBtn = page.getByRole("button", { name: /Inspect Asset G-02/i });
    await expect(inspectBtn).toBeVisible({ timeout: 10000 });
    await inspectBtn.click();

    // 2. Assert Asset Header details
    await expect(page.getByText("G-02").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Diesel Generator G-02/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/WARNING/i).first()).toBeVisible();
    await expect(page.getByText(/CRITICAL/i).first()).toBeVisible();
    await expect(page.getByText("/assets/G-02")).toBeVisible();

    // 3. Assert Health score is displayed with derived provenance
    await expect(page.getByText(/HEALTH: 62\/100/i)).toBeVisible();
    await expect(page.getByText(/Derived Prototype Operational Health Score/i)).toBeVisible();
  });

  test("Test B — Telemetry displays real backend data for Vibration, Temp, and Efficiency", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Inspect Asset G-02/i }).click();

    // Verify Telemetry section heading
    await expect(page.getByText(/LIVE TELEMETRY & HISTORICAL TRENDS/i)).toBeVisible({ timeout: 10000 });

    // Verify key metrics from seeded telemetry
    await expect(page.getByText(/G-02 Bearing Vibration/i).first()).toBeVisible();
    await expect(page.getByText(/4\.8 mm\/s/i).first()).toBeVisible();

    await expect(page.getByText(/G-02 Coolant Temperature/i).first()).toBeVisible();
    await expect(page.getByText(/94\.2 °C/i).first()).toBeVisible();

    await expect(page.getByText(/G-02 Fuel Efficiency/i).first()).toBeVisible();
    await expect(page.getByText(/32\.4 %/i).first()).toBeVisible();
  });

  test("Test C — Telemetry Trend displays trend direction and threshold alerts", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Inspect Asset G-02/i }).click();

    // Verify trend directions (Rising vibration, falling efficiency)
    await expect(page.getByText(/↑ Rising/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/↓ Falling/i).first()).toBeVisible();

    // Verify threshold warning display
    await expect(page.getByText(/ABOVE THRESHOLD/i).first()).toBeVisible();
    await expect(page.getByText(/Threshold limit:/i).first()).toBeVisible();
    await expect(page.getByText(/4\.0 mm\/s/i).first()).toBeVisible();
  });

  test("Test D — 'Why is this high risk?' reveals structured evidence factors", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Inspect Asset G-02/i }).click();

    // Verify Risk summary card
    await expect(page.getByText(/DETERMINISTIC OPERATIONAL RISK & EXPLAINABLE ENGINE/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/OPERATIONAL RISK/i).first()).toBeVisible();

    // Locate "Why is this high risk?" button
    const whyRiskBtn = page.getByRole("button", { name: /Why is this high risk\?/i });
    await expect(whyRiskBtn).toBeVisible();

    // Click to toggle evidence drawer (if not already expanded)
    const isExpanded = await whyRiskBtn.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await whyRiskBtn.click();
    }

    // Verify evidence factors are presented with structured evidence
    await expect(page.getByText(/OPERATIONAL EVIDENCE & RATIONALE BREAKDOWN/i)).toBeVisible();
    await expect(page.getByText(/G-02 Bearing Vibration: 4\.8 mm\/s.*exceeds warning threshold/i).first()).toBeVisible();
    await expect(page.getByText(/Habitat Zone 2 Heating/i).first()).toBeVisible();
    await expect(page.getByText(/Work Order MWO-2026-089 is BLOCKED_PARTS/i)).toBeVisible();
    await expect(page.getByText(/has 0 available units in station stock/i)).toBeVisible();
    await expect(page.getByText(/MV Vasiliy Golovnin.*ETA is in ≈ \d+(\.\d+)? days/i)).toBeVisible();
  });

  test("Test E — Multi-Hop Dependency blast radius exposes downstream cascade", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Inspect Asset G-02/i }).click();

    // Verify Dependency section
    await expect(page.getByText(/MULTI-HOP DEPENDENCY & OPERATIONAL BLAST RADIUS/i)).toBeVisible({ timeout: 10000 });

    // Verify Multi-Hop discovery: Root -> Equipment -> Service -> Zone
    await expect(page.getByText(/Max Graph Depth/i)).toBeVisible();
    await expect(page.getByText(/HVAC-02/i).first()).toBeVisible();
    await expect(page.getByText(/Habitat Zone 2 Heating/i).first()).toBeVisible();

    // Verify Propagation Paths list
    await expect(page.getByText(/DISCOVERED PROPAGATION PATHS/i)).toBeVisible();
    await expect(page.getByText(/G-02 → HVAC-02 → Habitat Zone 2 Heating/i)).toBeVisible();
  });

  test("Test F — Maintenance and Spare section exposes blockers and resupply exposure", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Inspect Asset G-02/i }).click();

    // Verify Maintenance section
    await expect(page.getByText(/MAINTENANCE, LOCAL SPARES & RESUPPLY LOGISTICS/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/MWO-2026-089/i).first()).toBeVisible();
    await expect(page.getByText(/BLOCKED_PARTS/i).first()).toBeVisible();

    // Verify Spare inventory status
    await expect(page.getByText(/SK-402/i).first()).toBeVisible();
    await expect(page.getByText(/0 Units \(UNAVAILABLE\)/i).first()).toBeVisible();

    // Verify Resupply vessel ETA
    await expect(page.getByText(/MV Vasiliy Golovnin/i).first()).toBeVisible();
    await expect(page.getByText(/≈ \d+(\.\d+)? Days/i).first()).toBeVisible();
  });

  test("Test G — Full Hero Journey: Station Command Center ↔ Asset Intelligence", async ({
    page,
  }) => {
    // 1. Start at Station Command Center
    await expect(page.getByText(/SUBSYSTEM HEALTH & TELEMETRY MATRIX/i)).toBeVisible({ timeout: 10000 });

    // 2. Click inspect G-02
    await page.getByRole("button", { name: /Inspect Asset G-02/i }).click();

    // 3. Confirm Asset Intelligence loads with all cards
    await expect(page.getByRole("heading", { name: /Diesel Generator G-02/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/LIVE TELEMETRY & HISTORICAL TRENDS/i)).toBeVisible();
    await expect(page.getByText(/DETERMINISTIC OPERATIONAL RISK & EXPLAINABLE ENGINE/i)).toBeVisible();
    await expect(page.getByText(/MULTI-HOP DEPENDENCY & OPERATIONAL BLAST RADIUS/i)).toBeVisible();
    await expect(page.getByText(/MAINTENANCE, LOCAL SPARES & RESUPPLY LOGISTICS/i)).toBeVisible();

    // 4. Navigate back to Command Center
    const backBtn = page.getByRole("button", { name: /Return to Station Command Center/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // 5. Confirm Command Center view is restored
    await expect(page.getByText(/SUBSYSTEM HEALTH & TELEMETRY MATRIX/i)).toBeVisible();
    await expect(page.getByText(/CRITICAL OPERATIONAL EVENT/i)).toBeVisible();
  });
});
