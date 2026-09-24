import { test } from "@playwright/test";
import * as path from "path";

test.describe("Capture Phase 3 Digital Twin Screenshots", () => {
  test("captures comprehensive screenshots of digital twin views", async ({ page }) => {
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/digital-twin");

    // Wait for all data to settle
    await page.waitForResponse((res) => res.url().includes("/api/assets/G-02/dependencies") && res.status() === 200);
    await page.waitForTimeout(1000);

    // 1. Digital Twin Overview
    await page.screenshot({
      path: path.join(screenshotDir, "phase3-digital-twin-overview.png"),
      fullPage: true,
    });

    // 2. Telemetry Section
    const telemEl = page.getByTestId("level-2-telemetry");
    if (await telemEl.isVisible()) {
      await telemEl.screenshot({
        path: path.join(screenshotDir, "phase3-telemetry-sparklines.png"),
      });
    }

    // 3. Topology Section
    const topoEl = page.getByTestId("level-4-topology");
    if (await topoEl.isVisible()) {
      await topoEl.screenshot({
        path: path.join(screenshotDir, "phase3-dependency-topology.png"),
      });
    }

    // 4. Risk Section
    const riskEl = page.getByTestId("level-3-risk");
    if (await riskEl.isVisible()) {
      await riskEl.screenshot({
        path: path.join(screenshotDir, "phase3-risk-intelligence.png"),
      });
    }

    // 5. Open Explanation Drawer & screenshot
    await page.getByTestId("open-explanation-btn").click();
    await page.waitForResponse((res) => res.url().includes("/api/explain/ASSET/G-02") && res.status() === 200);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "phase3-explanation-drawer.png"),
    });

    // Close drawer
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // 6. Mobile Digital Twin View (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, "phase3-mobile-digital-twin.png"),
      fullPage: false,
    });
  });
});
