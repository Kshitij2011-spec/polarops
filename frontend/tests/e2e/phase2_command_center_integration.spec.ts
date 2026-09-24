import { test, expect } from "@playwright/test";

test.describe("Phase 2 Integration: Command Center Real Backend Integration", () => {
  test("loads real station overview, telemetry, intelligence, events, and explanation from backend", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Set up network listeners to verify real API communication
    const overviewPromise = page.waitForResponse(
      (res) => res.url().includes("/api/station/overview") && res.status() === 200,
      { timeout: 30000 }
    );
    const intelPromise = page.waitForResponse(
      (res) => res.url().includes("/api/intelligence/narrative") && res.status() === 200,
      { timeout: 30000 }
    );
    const eventsPromise = page.waitForResponse(
      (res) => res.url().includes("/api/events") && res.status() === 200,
      { timeout: 30000 }
    );

    // 2. Navigate to Command Center
    await page.goto("/command-center");

    // 3. Verify real API responses were received
    const [overviewRes, intelRes, eventsRes] = await Promise.all([
      overviewPromise,
      intelPromise,
      eventsPromise,
    ]);

    expect(overviewRes.ok()).toBeTruthy();
    expect(intelRes.ok()).toBeTruthy();
    expect(eventsRes.ok()).toBeTruthy();

    const overviewData = await overviewRes.json();
    const intelData = await intelRes.json();
    const eventsData = await eventsRes.json();

    // 4. Verify Station Header and Identity
    await expect(page.getByText("Operational Command Center")).toBeVisible();
    await expect(page.getByText("STATION BHARATI · WINTER OPERATIONS")).toBeVisible();

    // 5. Verify Real Operational Metric Cards
    // Power Card
    const powerCard = page.getByTestId("metric-power");
    await expect(powerCard).toBeVisible();
    await expect(powerCard).toContainText("POWER SUBSYSTEM");
    await expect(powerCard).toContainText("MEASURED · TELEMETRY");

    // Fuel Runway Card
    const fuelCard = page.getByTestId("metric-fuel");
    await expect(fuelCard).toBeVisible();
    await expect(fuelCard).toContainText(`${overviewData.fuel_runway_days ?? 81} DAYS`);
    await expect(fuelCard).toContainText("MEASURED · RESERVES");

    // Environment Card
    const envCard = page.getByTestId("metric-environment");
    await expect(envCard).toBeVisible();
    await expect(envCard).toContainText(`${overviewData.ambient_weather.temperature_celsius.toFixed(1)}°C`);
    await expect(envCard).toContainText(`Wind ${overviewData.ambient_weather.wind_speed_knots} kts`);
    await expect(envCard).toContainText("WEATHER SENSOR");

    // Station Health / Readiness Card
    const healthCard = page.getByTestId("metric-health");
    await expect(healthCard).toBeVisible();
    await expect(healthCard).toContainText(`${overviewData.overall_health_score.toFixed(1)}%`);
    await expect(healthCard).toContainText("DERIVED · ASSESSMENT");

    // 6. Verify Critical Operational Event Panel
    const eventTitle = page.getByTestId("critical-event-title");
    await expect(eventTitle).toBeVisible();
    await expect(eventTitle).toContainText(overviewData.critical_events?.[0]?.title ?? intelData.headline);
    await expect(page.getByText("MEASURED TELEMETRY · PROVENANCE ACTIVE")).toBeVisible();

    // 7. Verify Causal Reasoning Chain
    const causalChain = page.getByTestId("causal-reasoning-chain");
    await expect(causalChain).toBeVisible();
    if (intelData.causal_chain && intelData.causal_chain.length > 0) {
      await expect(causalChain).toContainText(intelData.causal_chain[0].stage);
    }
    await expect(page.getByText("DETERMINISTIC REASONING ENGINE")).toBeVisible();

    // 8. Verify Operational Recommendation
    const recSection = page.getByTestId("operational-recommendation");
    await expect(recSection).toBeVisible();
    await expect(recSection).toContainText("RECOMMENDED ACTION");
    await expect(recSection).toContainText("RATIONALE");

    // 9. Verify Explanation Drawer opens with real backend explanation data
    const explainPromise = page.waitForResponse(
      (res) => res.url().includes("/api/explain/ASSET/G-02") && res.status() === 200,
      { timeout: 30000 }
    );
    await page.getByTestId("open-explanation-btn").click();
    const explainRes = await explainPromise;
    expect(explainRes.ok()).toBeTruthy();
    const explainData = await explainRes.json();

    // Verify drawer contents
    await expect(page.getByText("INCIDENT EXPLANATION")).toBeVisible();
    await expect(page.getByText("WHAT HAPPENED?")).toBeVisible();
    await expect(page.getByText("WHY DOES IT MATTER?")).toBeVisible();
    await expect(page.getByText(explainData.summary)).toBeVisible();
    await expect(page.getByText(new RegExp(`CONFIDENCE:\\s*${Math.round(explainData.confidence * 100)}%`))).toBeVisible();

    // Close drawer with Escape key
    await page.keyboard.press("Escape");

    // 10. Verify Operational Activity Stream
    const activityList = page.getByTestId("operational-activity-list");
    await expect(activityList).toBeVisible();
    if (eventsData.events && eventsData.events.length > 0) {
      await expect(activityList).toContainText(eventsData.events[0].title);
    }

    // 11. Verify 0 Horizontal Overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 12. Verify 0 Console Errors
    expect(consoleErrors).toEqual([]);
  });

  test("handles backend failure gracefully and recovers upon retry", async ({ page }) => {
    // Intercept /api/station/overview and force a 500 error initially
    await page.route("**/api/station/overview*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Simulated Backend Fault" }),
      });
    });

    await page.goto("/command-center");

    // Verify Error State Banner is shown
    const errorBanner = page.getByTestId("command-center-error");
    await expect(errorBanner).toBeVisible({ timeout: 15000 });
    await expect(errorBanner).toContainText("Failed to load real-time station telemetry");
    await expect(errorBanner).toContainText("RETRY CONNECTION");

    // Now restore normal behavior for /api/station/overview
    await page.unroute("**/api/station/overview*");

    // Click retry
    const retryPromise = page.waitForResponse(
      (res) => res.url().includes("/api/station/overview") && res.status() === 200
    );
    await errorBanner.getByRole("button", { name: /RETRY CONNECTION/i }).click();
    await retryPromise;

    // Verify Error Banner disappears and normal Command Center content appears
    await expect(page.getByTestId("command-center-error")).not.toBeVisible();
    await expect(page.getByTestId("metric-power")).toBeVisible();
    await expect(page.getByTestId("metric-fuel")).toBeVisible();
  });

  test("renders without horizontal overflow across desktop, tablet, and mobile viewports", async ({ page }) => {
    const viewports = [
      { name: "desktop", width: 1440, height: 900 },
      { name: "tablet", width: 1024, height: 768 },
      { name: "mobile", width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/command-center");
      await page.waitForLoadState("networkidle");

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Horizontal overflow detected at ${vp.name} (${vp.width}x${vp.height})`).toBe(false);
    }
  });
});
