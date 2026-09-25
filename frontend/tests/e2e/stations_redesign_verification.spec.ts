import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("PolarOps Stations Page Final Visual Refinement & Functionality", () => {
  test("1. Stations Page renders clean modern layout with clear visual hierarchy", async ({ page }) => {
    await page.goto("/stations?station=STATION-BHARATI");

    // Header Level 1
    await expect(page.locator("h1")).toContainText("STATIONS");
    await expect(page.getByText(/Antarctic Station Network/i).first()).toBeVisible();
    await expect(page.getByText(/Cross-station operational overview and resource headroom/i)).toBeVisible();
    await expect(page.getByText(/Network Online/i)).toBeVisible();

    // Operations Comparison removed as requested in Major Change #1
    await expect(page.locator('[data-testid="station-portfolio-briefing-banner"]')).toHaveCount(0);

    // Primary Station Cards Level 2
    const bharatiCard = page.locator('[data-testid="station-card-bharati"]');
    await expect(bharatiCard).toBeVisible();
    await expect(bharatiCard.getByRole("heading", { name: /Bharati/i })).toBeVisible();
    await expect(bharatiCard.getByText("Larsemann Hills")).toBeVisible();
    await expect(bharatiCard.getByText("82%")).toBeVisible();
    await expect(bharatiCard.getByText("Operational Headroom").first()).toBeVisible();
    await expect(bharatiCard.getByText("142,500 L on hand")).toBeVisible();
    await expect(bharatiCard.getByText("G-02 STOCKOUT")).toBeVisible();
    await expect(bharatiCard.getByRole("button", { name: /View Station/i })).toBeVisible();

    const maitriCard = page.locator('[data-testid="station-card-maitri"]');
    await expect(maitriCard).toBeVisible();
    await expect(maitriCard.getByRole("heading", { name: /Maitri/i })).toBeVisible();
    await expect(maitriCard.getByText("Schirmacher Oasis")).toBeVisible();
    await expect(maitriCard.getByText("98%")).toBeVisible();
    await expect(maitriCard.getByText(/\+62\.\d+d reserve surplus/i)).toBeVisible();
    await expect(maitriCard.getByText("LOCKER M-2 STOCKED")).toBeVisible();
    await expect(maitriCard.getByRole("button", { name: /View Station/i })).toBeVisible();

    // Level 3: Network Headroom
    await expect(page.getByRole("heading", { name: "Network Headroom" })).toBeVisible();
    const capSection = page.locator('[data-testid="operational-capabilities-section"]');
    await expect(capSection).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-energy_resilience"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-comms_continuity"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-science_continuity"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-life_support"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-recovery_buffer"]')).toBeVisible();

    // Level 4: Operational Context & Segmented Navigation
    await expect(page.getByRole("heading", { name: "Operational Context" })).toBeVisible();
    await expect(page.locator('[data-testid="differences-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="recovery-logistics-intelligence-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="coordination-constraints-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="cross-station-considerations-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="cross-station-scenario-section"]')).toBeVisible();
  });

  test("2. Station selection and View Station action navigates with station parameter", async ({ page }) => {
    await page.goto("/stations?station=STATION-BHARATI");

    // Click View Station on Maitri card
    const maitriCard = page.locator('[data-testid="station-card-maitri"]');
    const viewBtn = maitriCard.getByRole("button", { name: /View Station/i });
    await viewBtn.click();

    // Should navigate to command-center with station=STATION-MAITRI
    await expect(page).toHaveURL(/station=STATION-MAITRI/);
  });

  test("3. Segmented control filters or switches active operational context view", async ({ page }) => {
    await page.goto("/stations");

    // Click "Differences" tab
    await page.getByRole("button", { name: "Differences" }).click();
    await expect(page.locator('[data-testid="differences-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="recovery-logistics-intelligence-card"]')).toBeHidden();

    // Click "Recovery Chain" tab
    await page.getByRole("button", { name: "Recovery Chain" }).click();
    await expect(page.locator('[data-testid="recovery-logistics-intelligence-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="differences-table"]')).toBeHidden();

    // Click "All Views" tab
    await page.getByRole("button", { name: "All Views" }).click();
    await expect(page.locator('[data-testid="differences-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="recovery-logistics-intelligence-card"]')).toBeVisible();
  });

  test("4. Capture refined Stations page full screenshots for visual review", async ({ page }) => {
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");

    // Desktop viewport (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/stations?station=STATION-BHARATI");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, "stations-refined-desktop-overview.png"),
      fullPage: true,
    });

    // Run Cross-Station Simulation
    const runBtn = page.locator('[data-testid="run-cross-station-scenario-btn"]');
    await runBtn.click();
    await page.waitForSelector('[data-testid="cross-station-scenario-results"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, "stations-refined-desktop-simulated.png"),
      fullPage: true,
    });

    // Tablet viewport (1024x768)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "stations-refined-tablet.png"),
      fullPage: true,
    });

    // Mobile viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "stations-refined-mobile.png"),
      fullPage: true,
    });
  });
});
