import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("PolarOps Settings Workspace Full Audit & Functionality Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("1. Renders clean, professional settings workspace with all 5 grouped sections", async ({ page }) => {
    // Header
    await expect(page.locator("h1")).toContainText("System Settings");
    await expect(page.getByText("OPERATIONAL CONFIGURATION")).toBeVisible();
    await expect(page.getByText(/Configure local client environment, appearance, operational preferences/i)).toBeVisible();

    // 5 Distinct Grouped Sections
    await expect(page.locator('[data-testid="settings-section-appearance"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-section-operational"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-section-alerts"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-section-data-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-section-system-info"]')).toBeVisible();

    // System Information read-only metrics
    await expect(page.getByText("v2.4.0-antarctic")).toBeVisible();
    await expect(page.getByText(/NCPOR SPEC V2/i)).toBeVisible();
  });

  test("2. Theme controls are fully functional and synchronized with Navbar and DOM", async ({ page }) => {
    const appearanceSection = page.locator('[data-testid="settings-section-appearance"]');

    // Switch to dark theme
    const darkBtn = appearanceSection.getByRole("radio", { name: "dark" });
    await darkBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator(".notice")).toContainText("Theme set to DARK");

    // Verify localStorage persistence
    const savedMode = await page.evaluate(() => localStorage.getItem("polarops-theme-mode"));
    expect(savedMode).toBe("dark");

    // Switch to light theme
    const lightBtn = appearanceSection.getByRole("radio", { name: "light" });
    await lightBtn.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.locator(".notice")).toContainText("Theme set to LIGHT");

    const savedModeLight = await page.evaluate(() => localStorage.getItem("polarops-theme-mode"));
    expect(savedModeLight).toBe("light");
  });

  test("3. Reduced motion toggle is functional and updates DOM class and persistence", async ({ page }) => {
    const appearanceSection = page.locator('[data-testid="settings-section-appearance"]');

    // Enable Reduced Motion
    const reducedBtn = appearanceSection.getByRole("radio", { name: /Reduced/i });
    await reducedBtn.click();
    await expect(page.locator("html")).toHaveClass(/reduced-motion/);
    await expect(page.locator(".notice")).toContainText("Reduced motion enabled");

    const savedMotion = await page.evaluate(() => localStorage.getItem("polarops-motion"));
    expect(savedMotion).toBe("reduced");

    // Revert to Standard Motion
    const standardBtn = appearanceSection.getByRole("radio", { name: "Standard" });
    await standardBtn.click();
    await expect(page.locator("html")).not.toHaveClass(/reduced-motion/);
    await expect(page.locator(".notice")).toContainText("Standard motion enabled");

    const savedMotionStandard = await page.evaluate(() => localStorage.getItem("polarops-motion"));
    expect(savedMotionStandard).toBe("standard");
  });

  test("4. Preferred Station updates application station context and persists default", async ({ page }) => {
    const operationalSection = page.locator('[data-testid="settings-section-operational"]');
    const header = page.locator("header[role='banner']");
    const stationBtn = header.getByRole("button", { name: /Station:/i });

    // Switch to Maitri
    const maitriBtn = operationalSection.getByRole("radio", { name: "Maitri" });
    await maitriBtn.click();
    await expect(page.locator(".notice")).toContainText("Preferred station updated to Maitri Station");

    // Verify Navbar shows Maitri
    await expect(stationBtn).toContainText("Maitri");

    // Verify localStorage
    const savedStation = await page.evaluate(() => localStorage.getItem("polarops-preferred-station"));
    expect(savedStation).toBe("STATION-MAITRI");

    // Switch back to Bharati
    const bharatiBtn = operationalSection.getByRole("radio", { name: "Bharati" });
    await bharatiBtn.click();
    await expect(page.locator(".notice")).toContainText("Preferred station updated to Bharati Station");
    await expect(stationBtn).toContainText("Bharati");
  });

  test("5. Operational Mode updates application connectivity posture (Online vs Offline)", async ({ page }) => {
    const operationalSection = page.locator('[data-testid="settings-section-operational"]');
    const header = page.locator("header[role='banner']");
    const connectivityBtn = header.getByRole("button", { name: /Connectivity status:/i });

    // Switch to Offline mode
    const offlineBtn = operationalSection.getByRole("radio", { name: /Offline/i });
    await offlineBtn.click();
    await expect(page.locator(".notice")).toContainText("OFFLINE (Local-First)");

    // Navbar connectivity reflects OFFLINE
    await expect(connectivityBtn).toContainText("OFFLINE");

    const savedMode = await page.evaluate(() => localStorage.getItem("polarops-mode"));
    expect(savedMode).toBe("offline");

    // Switch back to Online mode
    const onlineBtn = operationalSection.getByRole("radio", { name: /Online/i });
    await onlineBtn.click();
    await expect(page.locator(".notice")).toContainText("ONLINE (Satellite uplink)");
    await expect(connectivityBtn).toContainText("ONLINE");
  });

  test("6. Default alert severity filter updates preference and persists", async ({ page }) => {
    const alertsSection = page.locator('[data-testid="settings-section-alerts"]');

    // Set to Critical Only
    const critOnlyBtn = alertsSection.getByRole("radio", { name: "Critical Only" });
    await critOnlyBtn.click();
    await expect(page.locator(".notice")).toContainText("Default telemetry alerts filter set to \"Critical Only\"");

    let savedSeverity = await page.evaluate(() => localStorage.getItem("polarops-alert-severity"));
    expect(savedSeverity).toBe("Critical Only");

    // Set to Critical + Warning
    const critWarnBtn = alertsSection.getByRole("radio", { name: "Critical + Warning" });
    await critWarnBtn.click();
    await expect(page.locator(".notice")).toContainText("Default telemetry alerts filter set to \"Critical + Warning\"");

    savedSeverity = await page.evaluate(() => localStorage.getItem("polarops-alert-severity"));
    expect(savedSeverity).toBe("Critical + Warning");

    // Set back to All
    const allBtn = alertsSection.getByRole("radio", { name: "All" });
    await allBtn.click();
    await expect(page.locator(".notice")).toContainText("Default telemetry alerts filter set to \"All\"");
  });

  test("7. Restore Defaults shows confirmation and resets all settings to baseline", async ({ page }) => {
    // First, modify a few settings
    const appearanceSection = page.locator('[data-testid="settings-section-appearance"]');
    await appearanceSection.getByRole("radio", { name: "dark" }).click();
    await appearanceSection.getByRole("radio", { name: /Reduced/i }).click();

    // Click Restore Defaults
    const restoreBtn = page.getByRole("button", { name: /Restore Defaults/i });
    await restoreBtn.click();

    // Confirmation dialog should be visible
    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Restore Factory Settings?")).toBeVisible();

    // Confirm Restore
    await dialog.getByRole("button", { name: "Confirm Restore" }).click();

    // Dialog should dismiss and feedback appear
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".notice")).toContainText("All operational preferences restored to system defaults");

    // Verify settings were restored
    await expect(page.locator("html")).not.toHaveClass(/reduced-motion/);
  });

  test("8. Visual capture across viewports: Desktop (light & dark), Tablet, Mobile", async ({ page }) => {
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");

    // 1440x900 Desktop Light
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("polarops-theme-mode", "light");
      localStorage.setItem("polarops-theme", "light");
    });
    await page.goto("/settings");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "settings-refined-desktop-light.png"),
      fullPage: false,
    });

    // 1440x900 Desktop Dark
    const darkBtn = page.locator('[data-testid="settings-section-appearance"]').getByRole("radio", { name: "dark" });
    await darkBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "settings-refined-desktop-dark.png"),
      fullPage: false,
    });

    // 1024x768 Tablet
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, "settings-refined-tablet.png"),
      fullPage: false,
    });

    // 375x812 Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, "settings-refined-mobile.png"),
      fullPage: false,
    });
  });
});
