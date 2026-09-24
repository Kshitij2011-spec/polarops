import { test, expect } from "@playwright/test";

test.describe("Phase 1 Integration: Workspace Normalization & Real Backend Health", () => {
  test("loads new frontend and communicates with real backend via /api/health", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Listen for network requests to verify real /api/health call
    const healthRequestPromise = page.waitForResponse(
      (response) => response.url().includes("/api/health") && response.status() === 200,
      { timeout: 20000 }
    );

    // 2. Navigate to Command Center
    await page.goto("/command-center");

    // 3. Await the real /api/health response from FastAPI backend
    const healthResponse = await healthRequestPromise;
    expect(healthResponse.ok()).toBeTruthy();
    const json = await healthResponse.json();
    expect(json).toEqual({
      status: "ok",
      service: "polarops-api",
    });

    // 4. Verify the UI renders the real backend health status badge
    const healthBadge = page.getByTestId("health-status");
    await expect(healthBadge).toBeVisible();
    await expect(healthBadge).toContainText("POLAROPS API ONLINE");
    await expect(healthBadge).toContainText("POLAROPS-API · V1 OK");

    // 5. Verify the header connectivity indicator reflects real online connection
    await expect(page.getByText("CONNECTED")).toBeVisible();
    await expect(page.getByText("LIVE API / DEMO MIX")).toBeVisible();

    // 6. Verify page title and header
    await expect(page).toHaveTitle(/PolarOps/i);
    await expect(page.getByText("Operational Command Center")).toBeVisible();

    // 7. Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 8. Verify 0 console errors
    expect(consoleErrors).toEqual([]);
  });

  test("landing page renders with navigation into system", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await expect(page).toHaveTitle(/PolarOps/i);
    await expect(page.getByRole("heading", { name: "POLAROPS", level: 1 })).toBeVisible();
    await expect(page.getByText("ANTARCTIC OPERATIONAL DIGITAL TWIN")).toBeVisible();

    // Verify no horizontal overflow on landing page
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Click "ENTER COMMAND CENTER"
    await page.getByRole("link", { name: /ENTER COMMAND CENTER/i }).click();
    await expect(page).toHaveURL(/.*command-center/);
    await expect(page.getByText("Operational Command Center")).toBeVisible();

    // Verify 0 console errors
    expect(consoleErrors).toEqual([]);
  });
});
