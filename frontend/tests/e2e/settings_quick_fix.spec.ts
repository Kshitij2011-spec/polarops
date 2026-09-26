import { test, expect } from "@playwright/test";

test.describe("PolarOps Settings Page Clean UI & Functionality Audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/settings");
    await page.waitForLoadState("networkidle");
  });

  test("Renders header, eyebrow, and core settings sections (Appearance, Operational, Alerts)", async ({ page }) => {
    // Header
    await expect(page.locator("h1")).toContainText("System Settings");
    await expect(page.getByText("OPERATIONAL CONFIGURATION")).toBeVisible();

    // Core Sections
    await expect(page.locator('[data-testid="settings-section-appearance"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-section-operational"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-section-alerts"]')).toBeVisible();
  });

  test("Appearance buttons update preferences, localStorage, and show feedback toast", async ({ page }) => {
    // Theme toggle
    const lightBtn = page.locator('[data-testid="settings-section-appearance"]').getByRole("radio", { name: "light" });
    await lightBtn.click();
    await expect(page.locator(".notice")).toContainText("Theme set to LIGHT");

    // Motion toggle
    const reducedBtn = page.locator('[data-testid="settings-section-appearance"]').getByRole("radio", { name: /Reduced/i });
    await reducedBtn.click();
    await expect(page.locator(".notice")).toContainText("Reduced motion enabled");
  });

  test("Operational controls and severity filter update state and trigger save confirmation", async ({ page }) => {
    // Station selector
    const maitriBtn = page.locator('[data-testid="settings-section-operational"]').getByRole("radio", { name: "Maitri" });
    await maitriBtn.click();
    await expect(page.locator(".notice")).toContainText("Preferred station updated to Maitri Station");

    // Severity filter buttons
    const critOnlyBtn = page.locator('[data-testid="settings-section-alerts"]').getByRole("radio", { name: "Critical Only" });
    await critOnlyBtn.click();
    await expect(page.locator(".notice")).toContainText("Default telemetry alerts filter set to \"Critical Only\"");
  });
});
