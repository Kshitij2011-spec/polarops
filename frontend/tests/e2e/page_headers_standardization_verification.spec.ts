import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/command-center", name: "Command Center" },
  { path: "/digital-twin", name: "Digital Twin" },
  { path: "/stations", name: "Stations" },
  { path: "/resources", name: "Resources" },
  { path: "/scenarios", name: "Scenarios" },
  { path: "/resilience", name: "Resilience" },
  { path: "/offline", name: "Offline" },
  { path: "/reports", name: "Reports" },
  { path: "/settings", name: "Settings" },
];

test.describe("Page-Level Header Standardization Suite", () => {
  for (const route of ROUTES) {
    test(`Header compactness and structure on ${route.path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`http://127.0.0.1:5173${route.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      // Select the page-level header within <main>
      const header = page.locator("main header").first();
      await expect(header).toBeVisible();

      // Check bounding box height
      const box = await header.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        console.log(`[PAGE HEADER HEIGHT] ${route.path}: ${box.height.toFixed(1)}px`);
        // Target is compact operational header: 120-150px (content-driven, <= 165px)
        expect(box.height).toBeLessThanOrEqual(165);
        expect(box.height).toBeGreaterThanOrEqual(60);
      }

      // Check title readability
      const title = header.locator("h1");
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText?.trim().length).toBeGreaterThan(0);

      // Verify no horizontal overflow on page
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });

    test(`Theme consistency (Light & Dark) on ${route.path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`http://127.0.0.1:5173${route.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);

      // Light theme inspection
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      });
      await page.waitForTimeout(200);

      const header = page.locator("main header").first();
      await expect(header).toBeVisible();

      // Dark theme transition
      await page.evaluate(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      });
      await page.waitForTimeout(200);
      await expect(header).toBeVisible();

      // Revert to Light
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      });
      await page.waitForTimeout(200);
      await expect(header).toBeVisible();
    });
  }

  test("Responsive layout verification across mobile, tablet, and desktop", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, label: "desktop" },
      { width: 1024, height: 768, label: "tablet-landscape" },
      { width: 768, height: 1024, label: "tablet-portrait" },
      { width: 375, height: 667, label: "mobile" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ROUTES) {
        await page.goto(`http://127.0.0.1:5173${route.path}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(200);

        const header = page.locator("main header").first();
        await expect(header).toBeVisible();

        const noOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
        });
        expect(noOverflow).toBe(true);
      }
    }
  });

  test("Capture visual screenshots of standardized headers", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of ROUTES) {
      await page.goto(`http://127.0.0.1:5173${route.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);

      const safeName = route.path.replace(/\//g, "") || "root";

      // Light mode capture
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      });
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `frontend/tests/e2e/screenshots/header_${safeName}_light.png`,
        clip: { x: 0, y: 0, width: 1440, height: 350 },
      });

      // Dark mode capture
      await page.evaluate(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      });
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `frontend/tests/e2e/screenshots/header_${safeName}_dark.png`,
        clip: { x: 0, y: 0, width: 1440, height: 350 },
      });
    }
  });
});
