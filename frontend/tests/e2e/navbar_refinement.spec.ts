import { test, expect } from "@playwright/test";

test.describe("PolarOps Application Navbar / Top Header Refinement", () => {
  const targetUrl = "/command-center";

  test("1. Renders clean, un-duplicated navbar hierarchy at desktop (1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header[role='banner']");
    await expect(header).toBeVisible();

    // Verify Brand Identity: exactly one in navbar
    const brandLink = header.getByRole("link", { name: /PolarOps Mission Gateway/i });
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toContainText("POLAROPS");
    // Verify no v2.0 clutter in primary visual hierarchy
    await expect(header).not.toContainText("v2.0");

    // Verify Center: Station Switcher
    const stationBtn = header.getByRole("button", { name: /Station:/i });
    await expect(stationBtn).toBeVisible();
    await expect(stationBtn).toContainText("STATION:");
    await expect(stationBtn).toContainText("Bharati");

    // Verify Center: Consolidated Environmental Status (one unified strip)
    await expect(header).toContainText("WINTER");
    // Verify no separate redundant pills
    await expect(header.locator("text=STATE: WINTER")).toHaveCount(0);

    // Verify Right: Connectivity Status
    const connBtn = header.getByRole("button", { name: /Connectivity status:/i });
    await expect(connBtn).toBeVisible();
    await expect(connBtn).toContainText("ONLINE");

    // Verify Right: Clock (IBM Plex Mono)
    const clock = header.locator("text=UTC");
    await expect(clock).toBeVisible();

    // Verify Right: Search (Ctrl+K)
    const searchBtn = header.getByRole("button", { name: /Search or open command palette/i });
    await expect(searchBtn).toBeVisible();
    await expect(searchBtn).toContainText("Ctrl+K");

    // Verify Right: Theme Toggle
    const themeBtn = header.getByRole("button", { name: /Switch to (light|dark) theme/i });
    await expect(themeBtn).toBeVisible();

    // Verify Right: Profile Control (Generic User Icon — No personal names)
    const profileBtn = header.getByRole("button", { name: /Open user menu/i });
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).not.toContainText("TP");
    await expect(profileBtn).not.toContainText("Tanvi");
  });

  test("2. Station Selector: Functional switching between Bharati and Maitri", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header[role='banner']");
    const stationBtn = header.getByRole("button", { name: /Station:/i });

    // Open station dropdown
    await stationBtn.click();
    const listbox = page.locator("[role='listbox'][aria-label='Select Antarctic Station']");
    await expect(listbox).toBeVisible();

    // Switch to Maitri Station
    const maitriOption = listbox.locator("button", { hasText: "Maitri Station" });
    await expect(maitriOption).toBeVisible();
    await maitriOption.click();

    // Verify header updates to Maitri
    await expect(stationBtn).toContainText("Maitri");

    // Verify dropdown is closed
    await expect(listbox).not.toBeVisible();

    // Switch back to Bharati Station
    await stationBtn.click();
    await expect(listbox).toBeVisible();
    const bharatiOption = listbox.locator("button", { hasText: "Bharati Station" });
    await bharatiOption.click();
    await expect(stationBtn).toContainText("Bharati");
  });

  test("3. Profile Menu: Opens dropdown, displays generic User Session, and contains valid routes without personal names", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header[role='banner']");
    const profileBtn = header.getByRole("button", { name: /Open user menu/i });

    // Open Profile dropdown
    await profileBtn.click();
    const menu = page.locator("[role='menu'][aria-label='User Menu']");
    await expect(menu).toBeVisible();

    // Verify Generic Session header
    await expect(menu).toContainText("User Session");
    // Verify no personal names or fabricated identities
    await expect(menu).not.toContainText("Tanvi");
    await expect(menu).not.toContainText("Patil");

    // Verify Navigation links inside profile menu
    const settingsLink = menu.getByRole("menuitem", { name: /Settings/i });
    await expect(settingsLink).toBeVisible();

    const reportsLink = menu.getByRole("menuitem", { name: /Operational Reports/i });
    await expect(reportsLink).toBeVisible();

    const offlineLink = menu.getByRole("menuitem", { name: /Offline Storage/i });
    await expect(offlineLink).toBeVisible();

    // Test Esc key dismisses menu
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
  });

  test("4. Connectivity button triggers Edge Resilience Drawer", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header[role='banner']");
    const connBtn = header.getByRole("button", { name: /Connectivity status:/i });

    await connBtn.click();
    // Edge Resilience Drawer should open
    const drawer = page.locator("aside[aria-label*='Resilience'], [role='dialog']").first();
    await expect(drawer).toBeVisible();
  });

  test("5. Search button triggers Command Palette modal", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header[role='banner']");
    const searchBtn = header.getByRole("button", { name: /Search or open command palette/i });

    await searchBtn.click();
    const palette = page.locator("input[placeholder*='Search commands'], [role='dialog']").first();
    await expect(palette).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
  });

  test("6. Theme toggle switches between light and dark themes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");

    const header = page.locator("header[role='banner']");
    const html = page.locator("html");

    const initialDark = await html.evaluate((el) => el.classList.contains("dark"));

    const themeBtn = header.getByRole("button", { name: /Switch to (light|dark) theme/i });
    await themeBtn.click();

    const toggledDark = await html.evaluate((el) => el.classList.contains("dark"));
    expect(toggledDark).not.toBe(initialDark);

    // Toggle back
    await themeBtn.click();
    const restoredDark = await html.evaluate((el) => el.classList.contains("dark"));
    expect(restoredDark).toBe(initialDark);
  });

  test("7. Responsiveness & Zero Overlap across viewports: 1440, 1280, 1180, 1024, 900, 768", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: "1440px desktop" },
      { width: 1280, height: 800, name: "1280px standard" },
      { width: 1180, height: 800, name: "1180px narrow desktop" },
      { width: 1024, height: 768, name: "1024px toughbook/tablet" },
      { width: 900, height: 700, name: "900px intermediate" },
      { width: 768, height: 1024, name: "768px portrait tablet" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(targetUrl);
      await page.waitForLoadState("networkidle");

      const header = page.locator("header[role='banner']");
      await expect(header).toBeVisible();

      // Check header bounds
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      expect(headerBox!.height).toBeGreaterThanOrEqual(56);
      expect(headerBox!.height).toBeLessThanOrEqual(72);

      // Verify no horizontal overflow in body or header
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px tolerance for fractional subpixels

      // Ensure key controls remain visible and unclipped
      const stationBtn = header.getByRole("button", { name: /Station:/i });
      await expect(stationBtn).toBeVisible();

      const profileBtn = header.getByRole("button", { name: /Open user menu/i });
      await expect(profileBtn).toBeVisible();

      const connBtn = header.getByRole("button", { name: /Connectivity status:/i });
      await expect(connBtn).toBeVisible();
    }
  });

  test("8. Consistency across core routes: /digital-twin, /stations, /resources, /scenarios, /resilience, /alerts, /reports, /settings", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const routes = [
      "/digital-twin",
      "/stations",
      "/resources",
      "/scenarios",
      "/resilience",
      "/alerts",
      "/reports",
      "/settings",
    ];

    for (const r of routes) {
      await page.goto(r);
      await page.waitForLoadState("networkidle");

      const header = page.locator("header[role='banner']");
      await expect(header).toBeVisible();

      // Verify Brand is present
      await expect(header.getByRole("link", { name: /PolarOps Mission Gateway/i })).toBeVisible();

      // Verify Station dropdown is present
      await expect(header.getByRole("button", { name: /Station:/i })).toBeVisible();

      // Verify Profile is present
      await expect(header.getByRole("button", { name: /Open user menu/i })).toBeVisible();
    }
  });

  test("9. Sidebar Branding: Top of sidebar displays PolarOps logo and brand in expanded mode, and compact logo in collapsed mode", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // In expanded mode: Top header contains PolarOps brand
    const sidebarTop = sidebar.locator("> div").first();
    await expect(sidebarTop).toContainText("POLAROPS");
    await expect(sidebarTop).toContainText(/Antarctic Digital Twin/i);

    // Click collapse button in sidebar top
    const collapseBtn = sidebarTop.getByRole("button", { name: /Collapse sidebar/i });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    // Verify sidebar is now collapsed
    await expect(sidebar).toHaveClass(/w-\[68px\]/);

    // In collapsed mode: Top header displays compact logo link only, no expanded text
    await expect(sidebarTop).not.toContainText("POLAROPS");
    const compactLogo = sidebarTop.getByRole("link", { name: /PolarOps Mission Home/i });
    await expect(compactLogo).toBeVisible();

    // Re-expand sidebar via bottom toggle or keyboard
    const expandBtn = sidebar.getByRole("button", { name: /Expand sidebar/i });
    await expandBtn.click();
    await expect(sidebar).toHaveClass(/w-\[240px\]/);
    await expect(sidebarTop).toContainText("POLAROPS");
  });
});
