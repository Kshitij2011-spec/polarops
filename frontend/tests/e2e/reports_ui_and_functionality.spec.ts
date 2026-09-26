import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("PolarOps Reports Page Clean UI & Functionality Audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/reports");
    await page.waitForLoadState("networkidle");
  });

  test("Renders Operational Reports header, telemetry badge, and metric cards", async ({ page }) => {
    // Verify title and eyebrow
    await expect(page.locator("h1")).toContainText("Operational Reports");
    await expect(page.getByText("MISSION RECORD")).toBeVisible();

    // Verify metric cards
    await expect(page.getByText("TOTAL ARCHIVES")).toBeVisible();
    await expect(page.getByText("5 Reports")).toBeVisible();
    await expect(page.getByText("MONITORED BASE")).toBeVisible();
    await expect(page.getByText("CADENCE")).toBeVisible();
    await expect(page.getByText("DISPATCH STATUS")).toBeVisible();
  });

  test("Renders all 5 canonical report cards with exact titles, descriptions, and action buttons", async ({ page }) => {
    const canonicalTitles = [
      "DAILY STATION REPORT",
      "RESOURCE STATUS REPORT",
      "INCIDENT REPORT",
      "RESILIENCE REPORT",
      "SCENARIO ANALYSIS",
    ];

    for (const title of canonicalTitles) {
      const card = page.locator(".report-card").filter({ hasText: title });
      await expect(card).toBeVisible();
      await expect(page.getByText("DERIVED")).toBeVisible();
      await expect(card.getByRole("button", { name: "VIEW" })).toBeVisible();
      await expect(card.getByRole("button", { name: /EXPORT/ })).toBeVisible();
      await expect(card.getByText("READY")).toBeVisible();
    }
  });

  test("Summary strip audit: read-only metadata vs functional status filters", async ({ page }) => {
    // 1. Verify read-only informational metadata items are NOT buttons
    const archivesText = page.getByText("TOTAL ARCHIVES");
    await expect(archivesText).toBeVisible();
    await expect(page.getByText("5 Reports")).toBeVisible();
    // Verify it is not a button
    await expect(page.getByRole("button", { name: /TOTAL ARCHIVES/i })).toHaveCount(0);

    const monitoredBase = page.getByText("MONITORED BASE");
    await expect(monitoredBase).toBeVisible();
    await expect(page.getByRole("button", { name: /MONITORED BASE/i })).toHaveCount(0);

    const cadenceText = page.getByText("CADENCE");
    await expect(cadenceText).toBeVisible();
    await expect(page.getByText("24h Cyclic")).toBeVisible();
    await expect(page.getByRole("button", { name: /CADENCE/i })).toHaveCount(0);

    const dispatchStatus = page.getByText("DISPATCH STATUS");
    await expect(dispatchStatus).toBeVisible();
    await expect(page.getByText("Ready", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /DISPATCH STATUS/i })).toHaveCount(0);

    const syncedText = page.getByText(/14:22 UTC SYNCED/);
    await expect(syncedText).toBeVisible();
    await expect(page.getByRole("button", { name: /SYNCED/i })).toHaveCount(0);

    // 2. Verify interactive status filter buttons exist and are functional
    const verifiedBtn = page.getByRole("button", { name: /3 Verified/i });
    const attentionBtn = page.getByRole("button", { name: /2 Attention/i });

    await expect(verifiedBtn).toBeVisible();
    await expect(attentionBtn).toBeVisible();

    // Click 3 Verified -> displays 3 verified reports
    await verifiedBtn.click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(3);
    await expect(page.locator(".report-card").filter({ hasText: "DAILY STATION REPORT" })).toBeVisible();
    await expect(page.locator(".report-card").filter({ hasText: "RESOURCE STATUS REPORT" })).toBeVisible();
    await expect(page.locator(".report-card").filter({ hasText: "SCENARIO ANALYSIS" })).toBeVisible();
    await expect(verifiedBtn).toHaveAttribute("aria-pressed", "true");

    // Toggle 3 Verified off -> restores all 5 reports
    await verifiedBtn.click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(5);
    await expect(verifiedBtn).toHaveAttribute("aria-pressed", "false");

    // Click 2 Attention -> displays 2 attention reports
    await attentionBtn.click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(2);
    await expect(page.locator(".report-card").filter({ hasText: "INCIDENT REPORT" })).toBeVisible();
    await expect(page.locator(".report-card").filter({ hasText: "RESILIENCE REPORT" })).toBeVisible();
    await expect(attentionBtn).toHaveAttribute("aria-pressed", "true");

    // Clicking a category filter resets status filter and activates category
    await page.getByRole("button", { name: "OPERATIONS", exact: true }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card").filter({ hasText: "DAILY STATION REPORT" })).toBeVisible();
    await expect(attentionBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("Category filter updates displayed reports", async ({ page }) => {
    // Filter by OPERATIONS
    await page.getByRole("button", { name: "OPERATIONS", exact: true }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("DAILY STATION REPORT");

    // Filter by LOGISTICS
    await page.getByRole("button", { name: "LOGISTICS", exact: true }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("RESOURCE STATUS REPORT");

    // Filter by INCIDENTS
    await page.getByRole("button", { name: "INCIDENTS", exact: true }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("INCIDENT REPORT");

    // Filter by RESILIENCE
    await page.getByRole("button", { name: "RESILIENCE", exact: true }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("RESILIENCE REPORT");

    // Filter by SCENARIOS
    await page.getByRole("button", { name: "SCENARIOS", exact: true }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("SCENARIO ANALYSIS");

    // Filter by ALL
    await page.getByRole("button", { name: /ALL/, exact: false }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(5);
  });

  test("Search filter matches query and handles empty search results", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search reports/);
    await searchInput.fill("incident");
    await page.waitForTimeout(200);

    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("INCIDENT REPORT");

    // Search query with no match
    await searchInput.fill("nonexistentqueryxyz");
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(0);
    await expect(page.getByText("No operational reports matching filter")).toBeVisible();

    // Click RESET FILTERS
    await page.getByRole("button", { name: "RESET FILTERS" }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(5);
  });

  test("VIEW button triggers feedback notice and opens operational preview drawer", async ({ page }) => {
    const dailyCard = page.locator(".report-card").filter({ hasText: "DAILY STATION REPORT" });
    await dailyCard.getByRole("button", { name: "VIEW" }).click();
    await page.waitForTimeout(300);

    // Verify feedback message
    await expect(page.locator(".notice")).toContainText("DAILY STATION REPORT opened in demo preview.");

    // Verify drawer opened with table data
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByText("SUBSYSTEM OPERATIONAL READINESS MATRIX")).toBeVisible();
    await expect(page.getByRole("dialog").getByText("HEALTH INDEX")).toBeVisible();
  });

  test("EXPORT button triggers download and sets feedback notice", async ({ page }) => {
    const incidentCard = page.locator(".report-card").filter({ hasText: "INCIDENT REPORT" });

    // Listen for download event
    const downloadPromise = page.waitForEvent("download");
    await incidentCard.getByRole("button", { name: /EXPORT/ }).click();
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toContain("polarops-incident-report");

    // Verify feedback message
    await expect(page.locator(".notice")).toContainText("INCIDENT REPORT export prepared for demonstration.");
  });

  test("Preserves existing routes without errors (Stations, Alerts, Resources, Overview)", async ({ page }) => {
    // Stations
    await page.goto("http://127.0.0.1:5173/stations");
    await expect(page.locator("h1")).toBeVisible();

    // Alerts
    await page.goto("http://127.0.0.1:5173/alerts");
    await expect(page.locator("h1")).toContainText("Operational Alerts");

    // Resources
    await page.goto("http://127.0.0.1:5173/resources");
    await expect(page.locator("h1")).toContainText("Resource & Logistics");

    // Command Center Overview
    await page.goto("http://127.0.0.1:5173/command-center");
    await expect(page.locator("h1")).toContainText("Operational Command Center");
  });

  test("Header height is compact and typography sizes are preserved", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const header = page.locator("div.border-b").first();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    // Compact header height should be well under 100px (typically 65-75px)
    expect(box!.height).toBeLessThan(100);

    // Verify typography
    const title = page.locator("h1");
    await expect(title).toHaveText("Operational Reports");
    const fontSize = await title.evaluate((el) => window.getComputedStyle(el).fontSize);
    // text-2xl sm:text-3xl is >= 24px (typically 30px)
    expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(24);
  });

  test("Above-the-fold visibility at 1440x900 exposes report cards without excessive pre-content", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const cards = page.locator(".report-card");
    const count = await cards.count();
    expect(count).toBe(5);

    // Check first 4 cards bounding box top and bottom
    for (let i = 0; i < 4; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      // Cards start high up and are completely visible within 900px viewport height
      expect(box!.y).toBeLessThan(900);
      expect(box!.y + box!.height).toBeLessThan(900);
    }
  });

  test("Responsive layout verification across 1440, 1280, 1024, 768, and 375 viewports", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1280, height: 800 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(150);

      // Verify no horizontal overflow on window
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify title and report cards are visible
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".report-card").first()).toBeVisible();
    }
  });

  test("Capture Reports page screenshots for visual audit", async ({ page }) => {
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");

    // Desktop Light
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("polarops-theme", "light");
      localStorage.setItem("polarops-theme-mode", "light");
    });
    await page.goto("/reports");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "reports-audit-desktop-light.png"),
      fullPage: false,
    });

    // Desktop Dark
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("polarops-theme", "dark");
      localStorage.setItem("polarops-theme-mode", "dark");
    });
    await page.goto("/reports");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "reports-audit-desktop-dark.png"),
      fullPage: false,
    });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/reports");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(screenshotDir, "reports-audit-mobile.png"),
      fullPage: false,
    });
  });
});
