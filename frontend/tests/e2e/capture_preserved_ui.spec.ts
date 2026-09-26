import { test } from "@playwright/test";
import * as path from "path";

test.describe("Capture Preserved UI Screenshots", () => {
  test("captures screenshots of Resources and Scenarios for Bharati and Maitri", async ({ page }) => {
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");

    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Resources - Station Bharati
    await page.goto("/resources?station=STATION-BHARATI");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, "preserved-resources-bharati.png"),
      fullPage: true,
    });

    // 2. Resources - Station Maitri
    await page.goto("/resources?station=STATION-MAITRI");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, "preserved-resources-maitri.png"),
      fullPage: true,
    });

    // 2b. Resources - Responsive (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/resources?station=STATION-BHARATI");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, "preserved-resources-responsive.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 900 });

    // 3. Scenarios - Station Bharati
    await page.goto("/scenarios?station=STATION-BHARATI");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, "preserved-scenarios-bharati-initial.png"),
      fullPage: true,
    });

    // 4. Scenarios - Run Simulation on Bharati
    const firstScenario = page.locator(".scenario-item").first();
    const runBtn = firstScenario.getByRole("button", { name: "RUN SCENARIO" });
    await runBtn.click();
    await page.waitForSelector(".simulation-result", { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, "preserved-scenarios-bharati-simulated.png"),
      fullPage: true,
    });

    // 5. Scenarios - Station Maitri
    await page.goto("/scenarios?station=STATION-MAITRI");
    await page.waitForTimeout(1000);
    const maitriFirstScenario = page.locator(".scenario-item").first();
    await maitriFirstScenario.getByRole("button", { name: "RUN SCENARIO" }).click();
    await page.waitForSelector(".simulation-result", { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, "preserved-scenarios-maitri-simulated.png"),
      fullPage: true,
    });
  });
});
