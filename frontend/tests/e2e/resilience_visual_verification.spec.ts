import { test, expect } from "@playwright/test";

test.describe("Resilience Page Visual & Responsive Verification", () => {
  test("Desktop 1440px Light & Dark, Simulation & Responsive Verification", async ({ page, request }) => {
    // Deterministic reset before visual test
    await request.post("/api/resilience/reset");

    // 1. Desktop 1440x900 Light
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resilience");
    await page.waitForLoadState("networkidle");

    // Verify key sections are present
    await expect(page.getByRole("heading", { name: /OPERATE THROUGH DISRUPTION/i, level: 1 })).toBeVisible();
    await expect(page.getByText("Resilience Posture")).toBeVisible();
    await expect(page.getByText("Headroom & Survival Windows")).toBeVisible();
    await expect(page.getByText("Active Vulnerabilities & Single Points of Failure")).toBeVisible();
    await expect(page.getByTestId("sync-queue-table")).toBeVisible();

    await page.screenshot({ path: "docs/integration/screenshots/resilience-redesign-1440-light.png", fullPage: true });

    // 2. Desktop 1440x900 Dark Mode
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(200);
    await page.screenshot({ path: "docs/integration/screenshots/resilience-redesign-1440-dark.png", fullPage: true });

    // 3. Test Outage Simulation in Dark Mode
    const outageBtn = page.getByTestId("simulate-outage-btn");
    await outageBtn.click();
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/OFFLINE/i);
    await page.waitForTimeout(300);
    await page.screenshot({ path: "docs/integration/screenshots/resilience-redesign-outage-dark.png", fullPage: true });

    // 4. Test Restore & Reconcile
    const restoreBtn = page.getByTestId("restore-sync-btn");
    await restoreBtn.click();
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/ONLINE/i);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "docs/integration/screenshots/resilience-redesign-reconcile-dark.png", fullPage: true });

    // Reset back to Light
    await page.evaluate(() => document.documentElement.classList.remove("dark"));

    // 5. Tablet 1024x768
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: "docs/integration/screenshots/resilience-redesign-1024.png", fullPage: true });

    // 6. Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: "docs/integration/screenshots/resilience-redesign-768.png", fullPage: true });

    // 7. Mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: "docs/integration/screenshots/resilience-redesign-375.png", fullPage: true });

    // 8. Verify No Horizontal Overflow on mobile
    const overflow = await page.evaluate(() => {
      const el = document.getElementById("main-content") || document.documentElement;
      return el.scrollWidth > el.clientWidth;
    });
    expect(overflow).toBe(false);

    // Final reset
    await request.post("/api/resilience/reset");
  });
});
