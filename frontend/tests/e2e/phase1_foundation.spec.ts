import { test, expect } from "@playwright/test";

test.describe("Phase 1: PolarOps Shared Product Foundation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root mission gateway
    await page.goto("/");
  });

  test("1. Mission Shell loads with identity, station dropdown, and operational ticker", async ({ page }) => {
    // Verify brand identity
    await expect(page.locator("header")).toContainText("POLAROPS");
    await expect(page.locator("header")).toContainText("Antarctic Mission OS");

    // Verify station switcher exists and shows Bharati by default
    const stationButton = page.locator("header button").filter({ hasText: /Bharati Station/i });
    await expect(stationButton).toBeVisible();

    // Verify UTC time ticker exists
    await expect(page.locator("header")).toContainText("UTC");

    // Verify Primary Workspace Navigation Bar exists
    const nav = page.locator("nav[aria-label='PolarOps Primary Workspaces']");
    await expect(nav).toBeVisible();
    await expect(nav).toContainText("COMMAND + DIGITAL TWIN");
    await expect(nav).toContainText("INCIDENT + DECISION COCKPIT");
    await expect(nav).toContainText("CONTINUITY + LOGISTICS");
  });

  test("2. Navigates seamlessly across the Three Macro-Workspaces", async ({ page }) => {
    // Navigate to Workspace 1: /twin
    await page.click("nav >> text=COMMAND + DIGITAL TWIN");
    await expect(page).toHaveURL(/\/twin/);
    await expect(page.locator("main")).toContainText("Command + Digital Twin");
    await expect(page.locator("aside[aria-label='Asset Telemetry & Risk Inspector']")).toBeVisible();

    // Navigate to Workspace 2: /cockpit
    await page.click("nav >> text=INCIDENT + DECISION COCKPIT");
    await expect(page).toHaveURL(/\/cockpit/);
    await expect(page.locator("main")).toContainText("Incident + Decision Cockpit");
    await expect(page.locator("main")).toContainText("Active Incident COP");

    // Navigate to Workspace 3: /continuity
    await page.click("nav >> text=CONTINUITY + LOGISTICS");
    await expect(page).toHaveURL(/\/continuity/);
    await expect(page.locator("main")).toContainText("Continuity + Logistics");
    await expect(page.locator("main")).toContainText("Fuel Runway");
  });

  test("3. Invalid search parameters fail safely without application crash", async ({ page }) => {
    // Navigate with completely malformed search parameters
    await page.goto("/twin?station=UNKNOWN_VOID_STATION&asset=MALFORMED_ASSET_XYZ&view=invalid_view");

    // Application should not crash or throw white screen
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("nav[aria-label='PolarOps Primary Workspaces']")).toBeVisible();
    await expect(page.locator("main")).toContainText("Command + Digital Twin");

    // Verify safe fallback rendered
    await expect(page.locator("aside[aria-label='Asset Telemetry & Risk Inspector']")).toBeVisible();
  });

  test("4. Station context persists across workspace navigation", async ({ page }) => {
    await page.goto("/twin?station=STATION-BHARATI");

    // Open station dropdown and switch to Maitri Station
    const stationDropdown = page.locator("header button").filter({ hasText: /Bharati Station/i });
    await stationDropdown.click();

    const maitriOption = page.locator("[role='listbox'] >> text=Maitri Station");
    await expect(maitriOption).toBeVisible();
    await maitriOption.click();

    // Verify header switched to Maitri Station
    await expect(page.locator("header")).toContainText("Maitri Station");

    // Navigate to Cockpit
    await page.click("nav >> text=INCIDENT + DECISION COCKPIT");
    await expect(page).toHaveURL(/\/cockpit.*station=STATION-MAITRI/);

    // Navigate to Continuity
    await page.click("nav >> text=CONTINUITY + LOGISTICS");
    await expect(page).toHaveURL(/\/continuity.*station=STATION-MAITRI/);

    // Verify Maitri remains selected in header
    await expect(page.locator("header")).toContainText("Maitri Station");
  });

  test("5. Ruggedized 1024x768 display standard: Zero horizontal overflow", async ({ page }) => {
    // Set explicit rugged field terminal resolution (Panasonic Toughbook standard)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/twin?station=STATION-BHARATI");

    // Wait for layout stability
    await page.waitForTimeout(500);

    // Check document scrollWidth vs clientWidth
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);

    // Check at Cockpit
    await page.goto("/cockpit?station=STATION-BHARATI");
    await page.waitForTimeout(500);
    const cockpitOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(cockpitOverflow).toBe(false);

    // Check at Continuity
    await page.goto("/continuity?station=STATION-BHARATI");
    await page.waitForTimeout(500);
    const continuityOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(continuityOverflow).toBe(false);
  });

  test("6. Keyboard navigation & Command Palette (Ctrl+K)", async ({ page }) => {
    await page.goto("/twin?station=STATION-BHARATI");
    await expect(page.locator("header")).toBeVisible();

    // Trigger Command Palette via keyboard shortcut or search button
    const searchBtn = page.getByRole("button", { name: "Open Command Palette" });
    await expect(searchBtn).toBeVisible();

    await page.keyboard.press("Control+k");
    const dialog = page.locator("[role='dialog'][aria-label='PolarOps Command Palette']");
    if (!(await dialog.isVisible())) {
      await searchBtn.click();
    }
    await expect(dialog).toBeVisible();

    // Type query to search G-02
    const searchInput = dialog.locator("input[aria-label='Search operational commands']");
    await searchInput.fill("G-02");
    await expect(dialog).toContainText("Generator G-02");

    // Dismiss dialog with Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("7. Ambient Satellite Resilience Pill triggers Resilience Drawer with real comms queue", async ({ page }) => {
    await page.goto("/twin?station=STATION-BHARATI");
    await expect(page.locator("header")).toBeVisible();

    // Find and click the global comms link pill
    const linkPill = page.locator("header button[aria-label*='Comms Status']");
    await expect(linkPill).toBeVisible();
    await linkPill.click();

    // Resilience Drawer should slide open
    const drawer = page.locator("aside[aria-label='Satellite Resilience & Edge Continuity Cockpit']");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Satellite Transceiver Link");
    await expect(drawer).toContainText("Store-and-Forward Priority Queue");

    // Close drawer via close button
    const closeBtn = drawer.locator("button[aria-label='Close Resilience Drawer']");
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });
});
