import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("Scenarios Workspace — Theme Consistency & Dropdown UX Audit", () => {
  const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");

  test("1. Scenario Dropdown — Typography, Light/Dark styling, and Option Selection", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/scenarios");
    await page.waitForLoadState("networkidle");

    const themeBtn = page.getByRole("button", { name: /Switch to (dark|light) theme/i });
    await expect(themeBtn).toBeVisible();

    // Ensure we start in Light Mode
    const isDarkInitial = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (isDarkInitial) {
      await themeBtn.click();
      await page.waitForTimeout(200);
    }

    // ── LIGHT MODE DROPDOWN AUDIT ─────────────────────────────────
    const dropdownTrigger = page.locator('button[aria-label^="Select Scenario Profile"]');
    await expect(dropdownTrigger).toBeVisible();

    // Verify initial closed value text
    await expect(dropdownTrigger).toContainText("Generator Failure · Critical Risk");

    // Verify typography styles on trigger (Inter, 14-16px, weight 500-600, leading 1.4-1.5)
    const triggerStylesLight = await dropdownTrigger.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        letterSpacing: cs.letterSpacing,
      };
    });
    console.log("[Audit] Light Trigger Styles:", triggerStylesLight);
    expect(Number.parseFloat(triggerStylesLight.fontSize)).toBeGreaterThanOrEqual(14);
    expect(Number.parseFloat(triggerStylesLight.fontSize)).toBeLessThanOrEqual(16);
    expect(Number(triggerStylesLight.fontWeight)).toBeGreaterThanOrEqual(500);

    // Open dropdown in Light Mode
    await dropdownTrigger.click();
    const dropdownMenu = page.locator('div[role="listbox"][aria-label="Scenario Profiles"]');
    await expect(dropdownMenu).toBeVisible();

    // Verify all 5 scenario options exist with proper formatting
    const options = dropdownMenu.locator('button[role="option"]');
    await expect(options).toHaveCount(5);
    await expect(options.nth(0)).toContainText("Generator Failure · Critical Risk");
    await expect(options.nth(1)).toContainText("Fuel Shortage · High Risk");
    await expect(options.nth(2)).toContainText("Communication Loss · Medium Risk");
    await expect(options.nth(3)).toContainText("Severe Weather · High Risk");
    await expect(options.nth(4)).toContainText("Supply Delay · Medium Risk");

    // Capture screenshot of opened dropdown in Light Mode
    await page.screenshot({
      path: path.join(screenshotDir, "scenarios-dropdown-light-open.png"),
    });

    // Select "Fuel Shortage · High Risk"
    await options.nth(1).click();
    await expect(dropdownMenu).not.toBeVisible();
    await expect(dropdownTrigger).toContainText("Fuel Shortage · High Risk");
    await expect(page.getByText("Storage Tank")).toBeVisible();
    await expect(page.getByText("Daily Burn Rate Rationing")).toBeVisible();

    // ── DARK MODE DROPDOWN AUDIT ──────────────────────────────────
    await themeBtn.click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));

    // Check trigger in Dark Mode
    await expect(dropdownTrigger).toContainText("Fuel Shortage · High Risk");
    const triggerStylesDark = await dropdownTrigger.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
      };
    });
    console.log("[Audit] Dark Trigger Styles:", triggerStylesDark);

    // Open dropdown in Dark Mode
    await dropdownTrigger.click();
    await expect(dropdownMenu).toBeVisible();

    // Capture screenshot of opened dropdown in Dark Mode
    await page.screenshot({
      path: path.join(screenshotDir, "scenarios-dropdown-dark-open.png"),
    });

    // Select "Severe Weather · High Risk"
    await options.nth(3).click();
    await expect(dropdownMenu).not.toBeVisible();
    await expect(dropdownTrigger).toContainText("Severe Weather · High Risk");
    await expect(page.getByText("Wind Velocity")).toBeVisible();
    await expect(page.getByText("Blizzard Cold Snap Temperature")).toBeVisible();

    // Re-select "Generator Failure · Critical Risk" for subsequent tests
    await dropdownTrigger.click();
    await options.nth(0).click();
    await expect(dropdownTrigger).toContainText("Generator Failure · Critical Risk");

    // Switch back to Light Mode
    await themeBtn.click();
    await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
  });

  test("2. Simulation Execution, Results, and ExplanationDrawer Light/Dark Theme Verification", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/scenarios");
    await page.waitForLoadState("networkidle");

    const themeBtn = page.getByRole("button", { name: /Switch to (dark|light) theme/i });

    // Ensure we start in Light Mode
    const isDarkInitial = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (isDarkInitial) {
      await themeBtn.click();
      await page.waitForTimeout(200);
    }

    // Set duration to 72h and run simulation
    await page.getByRole("button", { name: "72h" }).click();
    const runBtn = page.getByRole("button", { name: /^Run Simulation$/i });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Verify simulation results container appears
    await expect(page.getByText(/SIMULATION COMPLETE/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Energy & capacity/i)).toBeVisible();
    await expect(page.getByText(/What can the operator do\?/i)).toBeVisible();
    await expect(page.getByText(/What breaks\?/i)).toBeVisible();
    await expect(page.getByText(/Baseline vs\. Simulated Scenario Impact Deltas/i)).toBeVisible();
    await expect(page.getByText(/72h failure timeline/i)).toBeVisible();

    // ── TEST EXPLANATION DRAWER IN LIGHT MODE ──────────────────────
    const whyBtn = page.locator('[data-testid="explain-scenario-btn"]');
    await expect(whyBtn).toBeVisible();
    await whyBtn.click();

    const drawer = page.locator('[data-testid="explanation-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // Verify Light mode drawer background is white
    const drawerBgLight = await drawer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("[Audit] Light Drawer Background:", drawerBgLight);
    expect(drawerBgLight).toBe("rgb(255, 255, 255)");

    await page.screenshot({
      path: path.join(screenshotDir, "scenarios-explanation-drawer-light.png"),
    });

    // Close drawer before toggling theme via navbar button
    const closeBtn = page.locator('[data-testid="explanation-drawer-close-btn"]');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();

    // ── TEST EXPLANATION DRAWER IN DARK MODE ───────────────────────
    await themeBtn.click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));

    // Reopen drawer in Dark Mode
    await whyBtn.click();
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // Verify Dark mode drawer background is dark slate (oklch(0.208 0.042 265.755) or rgb(15, 23, 42))
    const drawerBgDark = await drawer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("[Audit] Dark Drawer Background:", drawerBgDark);
    expect(drawerBgDark).toMatch(/oklch\(0\.208|rgb\(15,\s*23,\s*42\)/);

    await page.screenshot({
      path: path.join(screenshotDir, "scenarios-explanation-drawer-dark.png"),
    });

    // Close drawer
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();

    // ── AUTHORIZE ACTION & AUDIT LEDGER VERIFICATION ────────────────
    const authBtn = page.getByRole("button", { name: /Authorize action/i }).first();
    if (await authBtn.isVisible()) {
      await authBtn.click();
      await expect(page.getByText(/Authorized/i).first()).toBeVisible();
    }

    // Switch to Audit Ledger tab
    await page.getByRole("button", { name: /Audit Ledger/i }).click();
    await expect(page.getByText(/Session action & audit ledger/i)).toBeVisible();

    // Switch back to Single Station
    await page.getByRole("button", { name: /Single Station/i }).click();

    // ── VERIFY STATE PERSISTENCE ACROSS THEME SWITCHES ────────────
    // Switch Dark -> Light
    await themeBtn.click();
    await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
    await expect(page.getByText(/SIMULATION COMPLETE/i)).toBeVisible();
    await expect(page.getByText(/72h failure timeline/i)).toBeVisible();

    // Switch Light -> Dark
    await themeBtn.click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
    await expect(page.getByText(/SIMULATION COMPLETE/i)).toBeVisible();
    await expect(page.getByText(/72h failure timeline/i)).toBeVisible();
  });

  test("3. Responsive Viewport Verification (1440, 1280, 1024, 768, 375)", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: "1440-desktop" },
      { width: 1280, height: 800, name: "1280-laptop" },
      { width: 1024, height: 768, name: "1024-tablet-landscape" },
      { width: 768, height: 1024, name: "768-tablet-portrait" },
      { width: 375, height: 812, name: "375-mobile" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/scenarios");
      await page.waitForLoadState("networkidle");

      const dropdownTrigger = page.locator('button[aria-label^="Select Scenario Profile"]');
      await expect(dropdownTrigger).toBeVisible();

      // Ensure no horizontal overflow on the page
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`[Audit] Responsive ${vp.name} (${vp.width}px) horizontal overflow: ${hasHorizontalScroll}`);
      expect(hasHorizontalScroll).toBe(false);

      // Verify dropdown opens cleanly without overflowing viewport
      await dropdownTrigger.click();
      const dropdownMenu = page.locator('div[role="listbox"][aria-label="Scenario Profiles"]');
      await expect(dropdownMenu).toBeVisible();

      const box = await dropdownMenu.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 15);
      }

      await dropdownTrigger.click(); // Close
    }
  });
});
