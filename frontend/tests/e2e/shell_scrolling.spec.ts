import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("PolarOps Application Shell — Independent Scrolling Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Standard desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("Desktop: Sidebar stays stationary and Header stays stable while Main Content scrolls on /digital-twin", async ({ page }) => {
    await page.goto("/digital-twin");
    await page.waitForLoadState("networkidle");

    const mainScroll = page.locator("main#main-content");
    await expect(mainScroll).toBeVisible();

    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    const header = page.locator("header[role='banner']");
    await expect(header).toBeVisible();

    // Initial bounding boxes
    const initialSidebarBox = await sidebar.boundingBox();
    const initialHeaderBox = await header.boundingBox();
    expect(initialSidebarBox).not.toBeNull();
    expect(initialHeaderBox).not.toBeNull();
    expect(initialSidebarBox!.y).toBe(0);
    expect(initialHeaderBox!.y).toBe(0);

    // Initial scroll states
    const initialScrollTop = await mainScroll.evaluate((el) => el.scrollTop);
    expect(initialScrollTop).toBe(0);

    const initialWindowScroll = await page.evaluate(() => window.scrollY);
    expect(initialWindowScroll).toBe(0);

    // 1. Scroll main content downward
    await mainScroll.evaluate((el) => el.scrollTo({ top: 600, behavior: "instant" }));
    await page.waitForTimeout(100);

    // 2. Verify main content actually scrolled
    const scrolledTop = await mainScroll.evaluate((el) => el.scrollTop);
    expect(scrolledTop).toBeGreaterThanOrEqual(500);

    // 3. Verify window / body did NOT scroll (NO double scrollbars)
    const windowScrollY = await page.evaluate(() => window.scrollY);
    expect(windowScrollY).toBe(0);

    // 4. Verify Sidebar position is 100% stationary
    const scrolledSidebarBox = await sidebar.boundingBox();
    expect(scrolledSidebarBox!.y).toBe(initialSidebarBox!.y);
    expect(scrolledSidebarBox!.x).toBe(initialSidebarBox!.x);
    expect(scrolledSidebarBox!.height).toBe(initialSidebarBox!.height);

    // 5. Verify HeaderBar position is stable at top of main column
    const scrolledHeaderBox = await header.boundingBox();
    expect(scrolledHeaderBox!.y).toBe(initialHeaderBox!.y);

    // 6. Scroll to the bottom of the main content
    await mainScroll.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(100);

    // 7. Verify Sidebar and Header STILL remain stationary at the bottom
    const bottomSidebarBox = await sidebar.boundingBox();
    expect(bottomSidebarBox!.y).toBe(initialSidebarBox!.y);
    expect(bottomSidebarBox!.x).toBe(initialSidebarBox!.x);

    const bottomHeaderBox = await header.boundingBox();
    expect(bottomHeaderBox!.y).toBe(initialHeaderBox!.y);

    const finalWindowScroll = await page.evaluate(() => window.scrollY);
    expect(finalWindowScroll).toBe(0);

    // Capture visual artifact
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");
    try {
      await page.screenshot({
        path: path.join(screenshotDir, "shell-scroll-desktop-digital-twin.png"),
      });
    } catch (e) {
      console.warn("Screenshot skipped:", e);
    }
  });

  test("Desktop: Shell scroll stability across other long routes (/resources, /stations, /command-center)", async ({ page }) => {
    const routes = ["/resources", "/stations", "/command-center"];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const mainScroll = page.locator("main#main-content");
      const sidebar = page.locator("aside").first();
      const header = page.locator("header[role='banner']");

      await expect(mainScroll).toBeVisible();
      await expect(sidebar).toBeVisible();
      await expect(header).toBeVisible();

      const origSidebarBox = await sidebar.boundingBox();
      const origHeaderBox = await header.boundingBox();

      // Scroll main area if content exceeds viewport
      const { scrollHeight, clientHeight } = await mainScroll.evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll > 0) {
        const targetScroll = Math.min(300, maxScroll);
        await mainScroll.evaluate((el, target) => el.scrollTo({ top: target, behavior: "instant" }), targetScroll);
        await page.waitForTimeout(50);

        // Verify main content scrolled
        const currentScrollTop = await mainScroll.evaluate((el) => el.scrollTop);
        expect(currentScrollTop).toBeGreaterThanOrEqual(Math.max(1, targetScroll - 10));
      }

      // Verify sidebar stayed fixed
      const currentSidebarBox = await sidebar.boundingBox();
      expect(currentSidebarBox!.y).toBe(origSidebarBox!.y);
      expect(currentSidebarBox!.x).toBe(origSidebarBox!.x);

      // Verify header stayed stable
      const currentHeaderBox = await header.boundingBox();
      expect(currentHeaderBox!.y).toBe(origHeaderBox!.y);

      // Verify body did not scroll
      const currentWindowScroll = await page.evaluate(() => window.scrollY);
      expect(currentWindowScroll).toBe(0);
    }
  });

  test("Mobile/Tablet: Preserves responsive drawer navigation and independent main scroll", async ({ page }) => {
    // iPhone / narrow viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/command-center");
    await page.waitForLoadState("networkidle");

    // Desktop sidebar should be hidden
    const desktopSidebar = page.locator("aside").first();
    await expect(desktopSidebar).not.toBeVisible();

    // Header hamburger button should be visible
    const hamburgerBtn = page.getByRole("button", { name: /Open navigation drawer/i });
    await expect(hamburgerBtn).toBeVisible();

    // Open mobile menu drawer
    await hamburgerBtn.click();
    const mobileDrawer = page.getByRole("dialog", { name: /Mobile Navigation Menu/i });
    await expect(mobileDrawer).toBeVisible();

    // Close mobile drawer by clicking backdrop
    const backdrop = mobileDrawer.locator(".backdrop-blur-sm");
    await backdrop.click({ position: { x: 350, y: 100 } });
    await expect(mobileDrawer).not.toBeVisible();

    // Verify main content scrolls normally on mobile without horizontal overflow
    const mainScroll = page.locator("main#main-content");
    await mainScroll.evaluate((el) => el.scrollTo({ top: 300, behavior: "instant" }));
    const scrolledTop = await mainScroll.evaluate((el) => el.scrollTop);
    expect(scrolledTop).toBeGreaterThanOrEqual(200);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
