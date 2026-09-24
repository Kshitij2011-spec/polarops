import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Phase 2: Visual & Interaction Verification", () => {
  const screenshotsDir = path.resolve(process.cwd(), "../docs/integration/screenshots");

  test("captures Command Center across desktop, tablet, mobile viewports, drawer and theme", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // ── 1. Desktop Viewport (1440x900) ───────────────────────────────────
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/command-center");
    await page.waitForResponse((res) => res.url().includes("/api/station/overview") && res.status() === 200);
    await page.waitForSelector("[data-testid='metric-power']");
    await page.screenshot({ path: path.join(screenshotsDir, "command_center_desktop_1440x900.png"), fullPage: true });

    // Check no horizontal overflow
    let hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow, "Overflow on desktop").toBe(false);

    // ── 2. Explanation Drawer ───────────────────────────────────────────
    await page.getByTestId("open-explanation-btn").click();
    await page.waitForResponse((res) => res.url().includes("/api/explain/ASSET/G-02") && res.status() === 200);
    await expect(page.getByText("INCIDENT EXPLANATION")).toBeVisible();
    await page.waitForTimeout(500); // allow drawer animation to complete
    await page.screenshot({ path: path.join(screenshotsDir, "command_center_explanation_drawer.png") });

    // Close drawer
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // ── 3. Theme Toggle ─────────────────────────────────────────────────
    const themeBtn = page.getByRole("button", { name: /Toggle theme/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(screenshotsDir, "command_center_theme_toggle.png"), fullPage: true });
      // toggle back
      await themeBtn.click();
      await page.waitForTimeout(400);
    }

    // ── 4. Tablet Viewport (1024x768) ────────────────────────────────────
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow, "Overflow on tablet").toBe(false);
    await page.screenshot({ path: path.join(screenshotsDir, "command_center_tablet_1024x768.png"), fullPage: true });

    // ── 5. Mobile Viewport (390x844) ─────────────────────────────────────
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow, "Overflow on mobile").toBe(false);
    await page.screenshot({ path: path.join(screenshotsDir, "command_center_mobile_390x844.png"), fullPage: true });

    // ── 6. Navigation and Browser Back/Forward ───────────────────────────
    await page.setViewportSize({ width: 1440, height: 900 });
    // Click inspect G-02 link
    await page.getByRole("link", { name: "INSPECT G-02" }).first().click();
    await expect(page).toHaveURL(/.*digital-twin/);

    // Navigate back to Command Center
    await page.goBack();
    await expect(page).toHaveURL(/.*command-center/);
    await expect(page.getByText("Operational Command Center")).toBeVisible();

    // Browser Refresh
    await page.reload();
    await expect(page.getByText("Operational Command Center")).toBeVisible();
    await expect(page.getByTestId("metric-power")).toBeVisible();

    // ── 7. Verify Console Cleanliness ────────────────────────────────────
    expect(consoleErrors).toEqual([]);
  });
});
