import { test, expect } from "@playwright/test";

test.describe("PolarOps Alerts Page UI Improvement & Functionality Preservation", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh alert state
    await page.goto("http://127.0.0.1:5173/alerts");
    await page.evaluate(() => localStorage.removeItem("polarops-reviewed-alerts"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("Renders Operational Alerts header and mission-control metric strip", async ({ page }) => {
    // Check page title and eyebrow
    await expect(page.locator("h1")).toContainText("Operational Alerts");
    await expect(page.locator(".eyebrow")).toContainText("EVENT MANAGEMENT");

    // Check metric cards
    await expect(page.getByText("ACTIVE INCIDENTS")).toBeVisible();
    await expect(page.locator(".metric-card").filter({ hasText: "CRITICAL" })).toBeVisible();
    await expect(page.locator(".metric-card").filter({ hasText: "WARNING" })).toBeVisible();
    await expect(page.locator(".metric-card").filter({ hasText: "INFO" })).toBeVisible();
    await expect(page.locator(".metric-card").filter({ hasText: "REVIEWED" })).toBeVisible();
  });

  test("Renders alert cards with severity indicators, station badges, and timestamps", async ({ page }) => {
    const cards = page.locator(".alert-row");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    // Check station pill
    await expect(firstCard.getByText(/STATION/)).toBeVisible();

    // Check timestamp has UTC
    await expect(firstCard.getByText(/UTC/)).toBeVisible();

    // Check status button
    const reviewButton = firstCard.getByRole("button", { name: /MARK AS REVIEWED|REVIEWED/ });
    await expect(reviewButton).toBeVisible();
  });

  test("Filters alerts by severity level (CRITICAL, WARNING, INFO, ALL)", async ({ page }) => {
    // Filter by CRITICAL
    const criticalFilterBtn = page.getByRole("button", { name: /^CRITICAL/ });
    await criticalFilterBtn.click();
    await page.waitForTimeout(300);

    const criticalCards = page.locator(".alert-row");
    const criticalCount = await criticalCards.count();
    for (let i = 0; i < criticalCount; i++) {
      await expect(criticalCards.nth(i)).toContainText("CRITICAL");
    }

    // Filter by WARNING
    const warningFilterBtn = page.getByRole("button", { name: /^WARNING/ });
    await warningFilterBtn.click();
    await page.waitForTimeout(300);

    const warningCards = page.locator(".alert-row");
    const warningCount = await warningCards.count();
    for (let i = 0; i < warningCount; i++) {
      await expect(warningCards.nth(i)).toContainText("WARNING");
    }

    // Filter by ALL
    const allFilterBtn = page.getByRole("button", { name: /^ALL/ });
    await allFilterBtn.click();
    await page.waitForTimeout(300);

    const allCards = page.locator(".alert-row");
    expect(await allCards.count()).toBeGreaterThanOrEqual(criticalCount + warningCount);
  });

  test("Toggles alert review status and updates visual state and metrics", async ({ page }) => {
    const firstCard = page.locator(".alert-row").first();
    const reviewBtn = firstCard.getByRole("button", { name: "MARK AS REVIEWED" });
    await expect(reviewBtn).toBeVisible();

    // Initially not reviewed
    await expect(firstCard).not.toHaveClass(/reviewed/);

    // Click MARK AS REVIEWED
    await reviewBtn.click();
    await page.waitForTimeout(200);

    // Now has reviewed class and button text is REVIEWED
    await expect(firstCard).toHaveClass(/reviewed/);
    await expect(firstCard.getByRole("button", { name: "REVIEWED" })).toBeVisible();
    await expect(firstCard.getByText("RESOLVED")).toBeVisible();

    // Click again to toggle back
    await firstCard.getByRole("button", { name: "REVIEWED" }).click();
    await page.waitForTimeout(200);

    // Toggled back to unreviewed
    await expect(firstCard).not.toHaveClass(/reviewed/);
    await expect(firstCard.getByRole("button", { name: "MARK AS REVIEWED" })).toBeVisible();
  });
});
