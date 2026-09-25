import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("Digital Twin Redesign Verification & Screenshots", () => {
  test("verifies full card architecture, station switching, asset switching, and captures visual screenshots", async ({
    page,
  }) => {
    const screenshotDir = path.resolve(process.cwd(), "tests", "e2e", "screenshots");

    // 1. Desktop Viewport (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/digital-twin");

    // Wait for page to initialize
    await page.waitForLoadState("domcontentloaded");

    // Verify Page Header
    await expect(page.getByRole("heading", { name: "Station Digital Twin", level: 1 })).toBeVisible();
    await expect(page.getByText("Live Twin")).toBeVisible();
    await expect(page.getByTestId("twin-station-tab-bharati")).toBeVisible();
    await expect(page.getByTestId("twin-station-tab-maitri")).toBeVisible();

    // Verify Main Twin View Card
    await expect(page.getByText("STATION TOPOLOGY & EQUIPMENT MAP · BHARATI")).toBeVisible();
    await expect(page.getByText("LIVE TOPOLOGY")).toBeVisible();
    await expect(page.getByTestId("level-4-topology")).toBeVisible();
    await expect(page.getByTestId("operational-topology-container")).toBeVisible();

    // Verify System Summary Cards
    await expect(page.getByText("TWIN STATE")).toBeVisible();
    await expect(page.getByText("SYSTEMS", { exact: true })).toBeVisible();
    await expect(page.getByText("DATA FRESHNESS")).toBeVisible();
    await expect(page.getByText("SYSTEM RISK")).toBeVisible();

    // Verify Asset Intelligence Card
    const briefing = page.getByTestId("level-1-briefing");
    await expect(briefing).toBeVisible();
    await expect(briefing).toContainText("Diesel Generator G-02 (G-02)");
    await expect(briefing).toContainText("GENERATOR · CRITICAL");
    await expect(page.getByTestId("level-2-telemetry")).toBeVisible();
    await expect(page.getByTestId("telemetry-card-bearing_vibration_mm_s")).toBeVisible();

    // Verify Causal Risk Card
    const riskSection = page.getByTestId("level-3-risk");
    await expect(riskSection).toBeVisible();
    await expect(riskSection).toContainText("STATE TRANSITION LADDER");
    await expect(riskSection).toContainText("RANKED RISK DRIVERS");
    await expect(riskSection).toContainText("FAILURE EXPOSURE");
    await expect(riskSection).toContainText("RECOVERY EXPOSURE");
    await expect(riskSection).toContainText("OPERATIONAL HEADROOM");

    // Verify Dependency & Impact Card
    const depSection = page.getByTestId("operational-dependency-section");
    await expect(depSection).toBeVisible();
    await expect(depSection).toContainText("OPERATIONAL DEPENDENCY");
    await expect(depSection).toContainText("Multi-Hop System Impact");
    await expect(depSection).toContainText("01 · TARGET ASSET");
    await expect(depSection).toContainText("02 · SUBSYSTEM ROLE");
    await expect(depSection).toContainText("03 · DEPENDENT EQUIPMENT & PATHS");
    await expect(depSection).toContainText("04 · OPERATIONAL IMPACT");
    await expect(depSection).toContainText("View Spares & Logistics in Resources");

    await depSection.screenshot({
      path: path.join(screenshotDir, "digital-twin-operational-dependency.png"),
    });

    // Verify Recent Operational Events Card (Collapsible, default collapsed)
    const eventsBtn = page.getByTestId("events-collapsible-btn");
    await expect(eventsBtn).toBeVisible();
    await expect(eventsBtn).toContainText("RECENT OPERATIONAL EVENTS");
    await expect(eventsBtn).toHaveAttribute("aria-expanded", "false");

    // Click to expand events
    await eventsBtn.click();
    await expect(eventsBtn).toHaveAttribute("aria-expanded", "true");

    // Capture Desktop Screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "digital-twin-desktop-redesign.png"),
      fullPage: true,
    });

    // 2. Open Explanation Drawer
    const explainPromise = page.waitForResponse(
      (res) => res.url().includes("/api/explain/ASSET/G-02") && res.status() === 200,
      { timeout: 15000 }
    );
    await page.getByTestId("open-explanation-btn").click();
    await explainPromise;
    await expect(page.getByText("INCIDENT EXPLANATION")).toBeVisible();

    // Screenshot with Drawer Open
    await page.screenshot({
      path: path.join(screenshotDir, "digital-twin-drawer-open.png"),
      fullPage: false,
    });

    // Close Drawer
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // 3. Station Switching: Switch to Maitri
    const maitriAssetsPromise = page.waitForResponse(
      (res) => res.url().includes("/assets?station_id=STATION-MAITRI") && res.status() === 200,
      { timeout: 15000 }
    );
    await page.getByTestId("twin-station-tab-maitri").click();
    await maitriAssetsPromise;

    // Verify Maitri is active
    await expect(page.getByText("STATION TOPOLOGY & EQUIPMENT MAP · MAITRI")).toBeVisible();
    await expect(page.getByTestId("asset-tab-GEN-01")).toBeVisible();

    // Capture Maitri Screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "digital-twin-maitri-redesign.png"),
      fullPage: true,
    });

    // 4. Mobile Viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId("twin-station-tab-bharati").click();
    await page.waitForTimeout(600);

    // Check zero horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // Capture Mobile Screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "digital-twin-mobile-redesign.png"),
      fullPage: true,
    });
  });

  test("verifies generic asset intelligence for G-02, PDU-SCI, B-01, stale data prevention, and honest empty states", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Load G-02
    await page.goto("/digital-twin?station=STATION-BHARATI&asset=G-02");
    await page.waitForResponse(
      (res) => res.url().includes("/assets/G-02") && res.status() === 200,
      { timeout: 15000 }
    );

    const briefing = page.getByTestId("level-1-briefing");
    await expect(briefing).toContainText("Diesel Generator G-02 (G-02)");
    await expect(page.getByTestId("telemetry-card-bearing_vibration_mm_s")).toBeVisible();
    await expect(page.getByTestId("telemetry-card-coolant_temp_celsius")).toBeVisible();
    await expect(page.getByText("4 ACTIVE TRANSDUCER CHANNELS")).toBeVisible();

    // Verify G-02 Operational Dependency
    await expect(page.getByText("GENERATOR · N-0")).toBeVisible();

    // 2. Switch to PDU-SCI
    const pduDetailPromise = page.waitForResponse(
      (res) => res.url().includes("/assets/PDU-SCI") && res.status() === 200,
      { timeout: 15000 }
    );
    await page.getByTestId("asset-tab-PDU-SCI").click();
    await pduDetailPromise;

    // Verify PDU-SCI identity and condition
    await expect(briefing).toContainText("Research Power Distribution Unit (PDU-SCI)");
    await expect(briefing).toContainText("96/100");
    await expect(briefing).toContainText("POWER_DISTRIBUTION · STANDARD");

    // CRITICAL: Verify NO stale G-02 data persists
    await expect(page.getByTestId("telemetry-card-bearing_vibration_mm_s")).not.toBeVisible();
    await expect(page.getByTestId("telemetry-card-coolant_temp_celsius")).not.toBeVisible();
    await expect(page.getByText("Diesel Generator G-02")).not.toBeVisible();

    // Verify honest, intentional empty state for PDU-SCI matching user reference
    const telemetrySection = page.getByTestId("level-2-telemetry");
    await expect(telemetrySection).toContainText("0 ACTIVE TRANSDUCER CHANNELS");
    await expect(telemetrySection).toContainText("SENSOR TELEMETRY");
    await expect(telemetrySection).toContainText("No historical trend available for this asset.");
    await expect(telemetrySection).toContainText("Current channels: 0");
    await expect(telemetrySection).toContainText("HEALTH ASSESSMENT");
    await expect(telemetrySection).toContainText("96");

    // Verify PDU-SCI Operational Dependency is dynamic (not G-02's primary power generation)
    await expect(page.getByText("POWER DISTRIBUTION · N+1 Redundant")).toBeVisible();
    await expect(page.getByText("Primary Power Generation (N+1 Redundancy)")).not.toBeVisible();

    // Verify PDU-SCI Causal Risk has NO stale G-02 SK-402
    const riskSection = page.getByTestId("level-3-risk");
    await expect(riskSection).not.toContainText("SK-402");

    // Capture PDU-SCI Selected Asset Intelligence card & Level 2 Screenshot
    const screenshotDir = path.resolve(process.cwd(), "tests", "e2e", "screenshots");
    await briefing.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await briefing.screenshot({
      path: path.join(screenshotDir, "digital-twin-pdu-sci-card.png"),
    });
    await telemetrySection.screenshot({
      path: path.join(screenshotDir, "digital-twin-level2-pdu-sci.png"),
    });

    // 3. Switch to B-01 (Auxiliary Boiler)
    const b01DetailPromise = page.waitForResponse(
      (res) => res.url().includes("/assets/B-01") && res.status() === 200,
      { timeout: 15000 }
    );
    await page.getByTestId("asset-tab-B-01").click();
    await b01DetailPromise;

    // Verify B-01 identity
    await expect(briefing).toContainText("Auxiliary Thermal Boiler B-01 (B-01)");
    await expect(briefing).toContainText("91/100");
    await expect(briefing).toContainText("BOILER · CRITICAL");

    // Verify B-01 dependency and no stale PDU-SCI or G-02 data
    await expect(page.getByText("Research Power Distribution Unit")).not.toBeVisible();
    await expect(page.getByText("BOILER · N-0")).toBeVisible();

    // Capture B-01 Screenshot
    await briefing.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await briefing.screenshot({
      path: path.join(screenshotDir, "digital-twin-b01-card.png"),
    });

    // 4. Switch back to G-02: verify G-02 graphs restore immediately from cache/query
    await page.getByTestId("asset-tab-G-02").click();

    await expect(briefing).toContainText("Diesel Generator G-02 (G-02)");
    await expect(page.getByTestId("telemetry-card-bearing_vibration_mm_s")).toBeVisible();
    await expect(page.getByText("4 ACTIVE TRANSDUCER CHANNELS")).toBeVisible();

    // Capture G-02 restored Screenshot
    await briefing.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await briefing.screenshot({
      path: path.join(screenshotDir, "digital-twin-g02-card.png"),
    });
    await page.getByTestId("level-2-telemetry").screenshot({
      path: path.join(screenshotDir, "digital-twin-level2-g02.png"),
    });
  });

  test("verifies State Transition progressive disclosure, ladder criteria inspection, and asset switching", async ({
    page,
  }) => {
    const screenshotDir = path.resolve(process.cwd(), "tests", "e2e", "screenshots");
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Navigate to G-02
    await page.goto("/digital-twin?station=STATION-BHARATI&asset=G-02");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForResponse(
      (res) => res.url().includes("/assets/G-02/risk") && res.status() === 200,
      { timeout: 15000 }
    );

    const stateSection = page.getByTestId("state-transition-section");
    await expect(stateSection).toBeVisible();

    // 2. Verify Header & Current State
    await expect(stateSection).toContainText("STATE TRANSITION");
    await expect(stateSection).toContainText("Equipment Degradation Ladder");
    await expect(stateSection).toContainText("ESCALATING");
    await expect(stateSection).toContainText("CURRENT: CRITICAL");

    // 3. Verify Default Collapsed State
    const toggleBtn = page.getByTestId("toggle-transition-details-btn");
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText("WHY IS THE TWIN IN THIS STATE?");
    await expect(toggleBtn).toContainText("View transition details");
    await expect(page.getByTestId("transition-details-expanded")).not.toBeVisible();

    // 4. Verify Summary Row
    await expect(stateSection).toContainText("Main operational trigger:");
    await expect(stateSection).toContainText(/Condition [Aa]nomaly/);
    await expect(stateSection).toContainText("3 contributing factors");
    await expect(stateSection).toContainText("TRUTH: DERIVED");

    // 5. Verify Next Threshold Card
    const nextThreshold = page.getByTestId("next-threshold-callout");
    await expect(nextThreshold).toBeVisible();
    await expect(nextThreshold).toContainText("NEXT THRESHOLD");
    await expect(nextThreshold).toContainText("Vibration breach > 6.5 mm/s or thermal trip triggers emergency load shed");

    // Screenshot of Collapsed State Transition Card
    await stateSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await stateSection.screenshot({
      path: path.join(screenshotDir, "digital-twin-state-transition-collapsed.png"),
    });

    // 6. Expand Transition Details
    await toggleBtn.click();
    await expect(toggleBtn).toContainText("Hide transition details");
    const expandedDetails = page.getByTestId("transition-details-expanded");
    await expect(expandedDetails).toBeVisible();

    // Verify structured disclosure categories
    await expect(expandedDetails).toContainText("TRIGGER");
    await expect(expandedDetails).toContainText(/Condition [Aa]nomaly/);
    await expect(expandedDetails).toContainText("CONTRIBUTING FACTORS");
    await expect(expandedDetails).toContainText("Bearing Vibration");
    await expect(expandedDetails).toContainText("Coolant Temperature");
    await expect(expandedDetails).toContainText("OPERATIONAL EFFECT");
    await expect(expandedDetails).toContainText("RECOVERY CONSTRAINT");

    // Screenshot of Expanded State Transition Card
    await stateSection.screenshot({
      path: path.join(screenshotDir, "digital-twin-state-transition-expanded.png"),
    });

    // Collapse back
    await toggleBtn.click();
    await expect(expandedDetails).not.toBeVisible();

    // 7. Interactive Ladder Criteria Inspection (Clicking WATCH)
    const watchBtn = stateSection.getByRole("button", { name: "WATCH" });
    await watchBtn.click();
    await expect(stateSection).toContainText("STAGE CRITERIA · WATCH");
    await expect(stateSection).toContainText("Minor variance detected");
    await expect(stateSection).toContainText("Current equipment operating state remains: CRITICAL");

    // Screenshot with stage criteria visible
    await stateSection.screenshot({
      path: path.join(screenshotDir, "digital-twin-state-transition-criteria.png"),
    });

    // Dismiss criteria
    await watchBtn.click();
    await expect(stateSection).not.toContainText("STAGE CRITERIA · WATCH");

    // 8. Asset Switching: Switch to PDU-SCI
    const pduRiskPromise = page.waitForResponse(
      (res) => res.url().includes("/assets/PDU-SCI/risk") && res.status() === 200,
      { timeout: 15000 }
    );
    await page.getByTestId("asset-tab-PDU-SCI").click();
    await pduRiskPromise;

    // Verify PDU-SCI State Transition Updates
    await expect(stateSection).toContainText("CURRENT: NOMINAL");
    await expect(stateSection).toContainText("STABLE");
    await expect(stateSection).toContainText("0 contributing factors");
    await expect(stateSection).not.toContainText("G-02");
    await expect(stateSection).not.toContainText("Vibration breach > 6.5 mm/s");
    await expect(stateSection).toContainText("Any additional component degradation or spare stockout escalates to next operational state");

    // Screenshot of PDU-SCI State Transition Card
    await stateSection.screenshot({
      path: path.join(screenshotDir, "digital-twin-state-transition-pdu-sci.png"),
    });
  });
});

