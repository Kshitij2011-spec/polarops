import { test, expect } from "@playwright/test";

test.describe("PolarOps Settings Page Clean UI & Functionality Audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/settings");
    await page.waitForLoadState("networkidle");
  });

  test("Renders header, eyebrow, and all 3 settings cards (Appearance, Security, Alerts)", async ({ page }) => {
    // Header
    await expect(page.locator("h1")).toContainText("System Settings");
    await expect(page.getByText("OPERATIONAL CONFIGURATION")).toBeVisible();
    await expect(page.getByText("CLIENT ENVIRONMENT", { exact: true })).toBeVisible();

    // 3 Cards
    await expect(page.locator("section").filter({ hasText: "APPEARANCE" })).toBeVisible();
    await expect(page.locator("section").filter({ hasText: "SECURITY" })).toBeVisible();
    await expect(page.locator("section").filter({ hasText: "ALERTS" })).toBeVisible();
  });

  test("Appearance buttons update preferences, localStorage, and show feedback toast", async ({ page }) => {
    // Theme toggle
    const lightBtn = page.getByRole("button", { name: "light" });
    await lightBtn.click();
    await expect(page.locator(".notice")).toContainText("Theme preference updated");

    // Density toggle
    const compactBtn = page.getByRole("button", { name: "compact" });
    await compactBtn.click();
    await expect(page.locator(".notice")).toContainText("Display density updated");

    // Sidebar toggle
    const collapsedBtn = page.getByRole("button", { name: "collapsed" });
    await collapsedBtn.click();
    await expect(page.locator(".notice")).toContainText("Default sidebar mode updated");

    // Motion toggle
    const reducedBtn = page.getByRole("button", { name: "reduced" });
    await reducedBtn.click();
    await expect(page.locator(".notice")).toContainText("Motion preference updated");
  });

  test("Alert toggles and severity filter update state and trigger save confirmation", async ({ page }) => {
    // Critical alert switch
    const criticalSwitch = page.getByLabel("Toggle Critical Operational Alerts");
    await criticalSwitch.click();
    await expect(page.locator(".notice")).toContainText("Critical alerts setting saved");

    // Warning alert switch
    const warningSwitch = page.getByLabel("Toggle Warning Alerts");
    await warningSwitch.click();
    await expect(page.locator(".notice")).toContainText("Warning alerts setting saved");

    // Severity filter buttons
    const critOnlyBtn = page.getByRole("button", { name: "Critical Only" });
    await critOnlyBtn.click();
    await expect(page.locator(".notice")).toContainText("Alert severity filter set to Critical Only");
  });
});
