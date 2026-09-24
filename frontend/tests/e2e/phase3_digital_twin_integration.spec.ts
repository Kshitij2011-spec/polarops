import { test, expect } from "@playwright/test";

test.describe("Phase 3 Integration: Digital Twin & Asset Intelligence", () => {
  test("loads real asset briefing, live telemetry, 6-factor risk, and multi-hop dependency topology", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Network interceptors for real backend endpoints
    const assetsPromise = page.waitForResponse(
      (res) => res.url().includes("/api/assets?") && res.status() === 200,
      { timeout: 30000 }
    );
    const detailPromise = page.waitForResponse(
      (res) => res.url().includes("/api/assets/G-02") && !res.url().includes("/dependencies") && !res.url().includes("/telemetry") && !res.url().includes("/risk") && res.status() === 200,
      { timeout: 30000 }
    );
    const telemPromise = page.waitForResponse(
      (res) => res.url().includes("/api/assets/G-02/telemetry") && res.status() === 200,
      { timeout: 30000 }
    );
    const riskPromise = page.waitForResponse(
      (res) => res.url().includes("/api/assets/G-02/risk") && res.status() === 200,
      { timeout: 30000 }
    );
    const depsPromise = page.waitForResponse(
      (res) => res.url().includes("/api/assets/G-02/dependencies") && res.status() === 200,
      { timeout: 30000 }
    );

    // 2. Navigate to Digital Twin
    await page.goto("/digital-twin");

    // 3. Await all real responses
    const [assetsRes, detailRes, telemRes, riskRes, depsRes] = await Promise.all([
      assetsPromise,
      detailPromise,
      telemPromise,
      riskPromise,
      depsPromise,
    ]);

    expect(assetsRes.ok()).toBeTruthy();
    expect(detailRes.ok()).toBeTruthy();
    expect(telemRes.ok()).toBeTruthy();
    expect(riskRes.ok()).toBeTruthy();
    expect(depsRes.ok()).toBeTruthy();

    const detailData = await detailRes.json();
    const telemData = await telemRes.json();
    const riskData = await riskRes.json();
    const depsData = await depsRes.json();

    // 4. Verify Level 1: Asset Briefing
    const briefing = page.getByTestId("level-1-briefing");
    await expect(briefing).toBeVisible();
    await expect(briefing).toContainText("Diesel Generator G-02 (G-02)");
    await expect(briefing).toContainText(`${detailData.health_score}`);
    await expect(briefing).toContainText(`${riskData.score}`);
    await expect(briefing).toContainText("MEASURED · GOOD");
    await expect(briefing).toContainText("GENERATOR · CRITICAL");

    // 5. Verify Level 2: Condition & Telemetry Cards
    const telemSection = page.getByTestId("level-2-telemetry");
    await expect(telemSection).toBeVisible();
    await expect(telemSection).toContainText("Sensor Telemetry & Trend Analysis");

    // Check specific telemetry cards
    const vibCard = page.getByTestId("telemetry-card-bearing_vibration_mm_s");
    await expect(vibCard).toBeVisible();
    await expect(vibCard).toContainText("G-02 Bearing Vibration");
    await expect(vibCard).toContainText("4.8");
    await expect(vibCard).toContainText("mm/s");
    await expect(vibCard).toContainText("WARNING");

    const tempCard = page.getByTestId("telemetry-card-coolant_temp_celsius");
    await expect(tempCard).toBeVisible();
    await expect(tempCard).toContainText("94.2");

    // 6. Verify Level 4: Operational Topology DAG
    const topologySection = page.getByTestId("level-4-topology");
    await expect(topologySection).toBeVisible();
    await expect(page.getByTestId("operational-topology-container")).toBeVisible();

    // Check backend nodes are present within topology section
    await expect(topologySection.getByRole("button", { name: /G-02/i })).toBeVisible();
    await expect(topologySection.getByRole("button", { name: /HVAC-02/i })).toBeVisible();
    await expect(topologySection.getByRole("button", { name: /PDU-SCI/i })).toBeVisible();

    // Check node selection interaction
    const hvacBtn = topologySection.getByRole("button", { name: /HVAC-02/i });
    await expect(hvacBtn).toBeVisible();
    await hvacBtn.click();
    await expect(page.getByText("HOP DEPTH: 1")).toBeVisible();

    // 7. Verify Level 3: Risk Intelligence 2.0
    const riskSection = page.getByTestId("level-3-risk");
    await expect(riskSection).toBeVisible();
    await expect(riskSection).toContainText("STATE TRANSITION LADDER");
    await expect(riskSection).toContainText("CRITICAL");
    await expect(riskSection).toContainText("RANKED RISK DRIVERS");
    await expect(riskSection).toContainText("Sensor Anomaly & Physical Condition");
    await expect(riskSection).toContainText("FAILURE EXPOSURE");
    await expect(riskSection).toContainText("RECOVERY EXPOSURE");
    await expect(riskSection).toContainText("OPERATIONAL HEADROOM");

    // 8. Verify Level 5: Explanation Drawer opens and loads real narrative
    const explainPromise = page.waitForResponse(
      (res) => res.url().includes("/api/explain/ASSET/G-02") && res.status() === 200,
      { timeout: 30000 }
    );
    await page.getByTestId("open-explanation-btn").click();
    const explainRes = await explainPromise;
    expect(explainRes.ok()).toBeTruthy();

    await expect(page.getByText("INCIDENT EXPLANATION")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("heading", { name: /G-02/i })).toBeVisible();

    // Close drawer
    await page.keyboard.press("Escape");

    // 9. Asset Switching: Select G-01
    const g01DetailPromise = page.waitForResponse(
      (res) => res.url().includes("/api/assets/G-01") && res.status() === 200,
      { timeout: 30000 }
    );
    await page.getByTestId("asset-tab-G-01").click();
    await g01DetailPromise;

    await expect(briefing).toContainText("Diesel Generator G-01");

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // 0 console errors
    expect(consoleErrors).toEqual([]);
  });

  test("verifies responsive layout and mobile cascade tree mode", async ({ page }) => {
    // Test on mobile viewport 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/digital-twin");

    await page.waitForResponse((res) => res.url().includes("/api/assets/G-02/dependencies") && res.status() === 200);

    await expect(page.getByText("Station Digital Twin")).toBeVisible();
    await expect(page.getByTestId("level-1-briefing")).toBeVisible();

    // Switch to Cascade Tree mode
    await page.getByRole("button", { name: "CASCADE TREE" }).click();
    await expect(page.getByText("HOP DEPTH 0")).toBeVisible();
    await expect(page.getByText("ROOT EQUIPMENT")).toBeVisible();

    // Verify zero horizontal overflow on mobile
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});
