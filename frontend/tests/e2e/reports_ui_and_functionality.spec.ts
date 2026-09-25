import { test, expect } from "@playwright/test";

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
      await expect(card.getByText("Generated from synchronized demo operational data.")).toBeVisible();
      await expect(card.getByRole("button", { name: "VIEW" })).toBeVisible();
      await expect(card.getByRole("button", { name: /EXPORT/ })).toBeVisible();
      await expect(card.getByText("READY")).toBeVisible();
    }
  });

  test("Category filter updates displayed reports", async ({ page }) => {
    // Filter by OPERATIONS
    await page.getByRole("button", { name: "OPERATIONS" }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("DAILY STATION REPORT");

    // Filter by LOGISTICS
    await page.getByRole("button", { name: "LOGISTICS" }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(".report-card")).toHaveCount(1);
    await expect(page.locator(".report-card")).toContainText("RESOURCE STATUS REPORT");

    // Filter by ALL
    await page.getByRole("button", { name: /ALL/ }).click();
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
});
