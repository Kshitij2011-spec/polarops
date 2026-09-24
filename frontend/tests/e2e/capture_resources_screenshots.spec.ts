import { test } from "@playwright/test";
import * as path from "path";

test.describe("Capture Phase 4 Resources Screenshots", () => {
  test("captures comprehensive screenshots of resources, fuel, and recovery views", async ({ page }) => {
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resources");

    // Wait for all data to settle
    await page.waitForResponse((res) => res.url().includes("/api/resources/fuel") && res.status() === 200);
    await page.waitForResponse((res) => res.url().includes("/api/resources/recovery/G-02") && res.status() === 200);
    await page.waitForTimeout(1000);

    // 1. Resources Overview (Full page at 1440x900)
    await page.screenshot({
      path: path.join(screenshotDir, "phase4-resources-overview.png"),
      fullPage: true,
    });

    // 2. Recovery Intelligence Section
    const recoveryEl = page.getByTestId("level-2-recovery");
    if (await recoveryEl.isVisible()) {
      await recoveryEl.screenshot({
        path: path.join(screenshotDir, "phase4-recovery-intelligence.png"),
      });
    }

    // 3. Fuel Intelligence & Energy Model Section
    const fuelEl = page.getByTestId("level-3-energy");
    if (await fuelEl.isVisible()) {
      await fuelEl.screenshot({
        path: path.join(screenshotDir, "phase4-fuel-intelligence.png"),
      });
    }

    // 4. Resource Detail Drawer for SK-402
    await page.getByTestId("inspect-btn-SK-402").click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "phase4-resource-detail.png"),
    });

    // Close drawer
    await page.getByTestId("close-drawer-btn").click();
    await page.waitForTimeout(400);

    // 5. Mobile Resources View (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "phase4-mobile-resources.png"),
      fullPage: true,
    });
  });
});
