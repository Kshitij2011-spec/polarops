import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("PolarOps Root Route — Product Landing Page Verification", () => {
  test("renders modern product landing page on / and ensures Mission Gateway is removed", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Navigate to root URL
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 2. Verify page title
    await expect(page).toHaveTitle(/PolarOps/i);

    // 3. Verify Navbar
    const nav = page.locator("header");
    await expect(nav).toBeVisible();
    await expect(nav.getByText("POLAROPS").first()).toBeVisible();
    await expect(nav.getByText("Antarctic Digital Twin").first()).toBeVisible();
    const navLinks = nav.getByRole("navigation");
    await expect(navLinks.getByRole("link", { name: "Digital Twin", exact: true })).toBeVisible();
    await expect(navLinks.getByRole("link", { name: "Stations" })).toBeVisible();
    await expect(navLinks.getByRole("link", { name: "Resources" })).toBeVisible();
    await expect(navLinks.getByRole("link", { name: "Scenarios" })).toBeVisible();
    await expect(navLinks.getByRole("link", { name: "Resilience" })).toBeVisible();
    await expect(nav.getByRole("link", { name: /ENTER OPERATIONS/i }).first()).toBeVisible();

    // 4. Verify Hero Section
    const heroH1 = page.getByRole("heading", { name: "POLAROPS", level: 1 });
    await expect(heroH1).toBeVisible();
    await expect(page.getByText("Antarctic Operational Digital Twin").first()).toBeVisible();
    await expect(page.getByText(/Understand station conditions\. Trace operational impact\. Support decisions under Antarctic constraints\./i)).toBeVisible();

    // 5. Verify Hero CTAs
    const heroSection = page.locator("section").first();
    const enterOpsBtn = heroSection.getByRole("link", { name: /ENTER OPERATIONS/i });
    await expect(enterOpsBtn).toBeVisible();
    await expect(enterOpsBtn).toHaveAttribute("href", "/command-center");

    const exploreTwinBtn = heroSection.getByRole("link", { name: /EXPLORE DIGITAL TWIN/i });
    await expect(exploreTwinBtn).toBeVisible();
    await expect(exploreTwinBtn).toHaveAttribute("href", "/digital-twin");

    // 6. Verify What PolarOps Does
    await expect(page.getByText(/ONE OPERATIONAL MODEL/i)).toBeVisible();
    await expect(page.getByText(/OBSERVE/i).first()).toBeVisible();
    await expect(page.getByText(/TRACE/i).first()).toBeVisible();
    await expect(page.getByText(/DECIDE/i).first()).toBeVisible();

    // 7. Verify Core Capabilities
    await expect(page.getByRole("heading", { name: "Core Capabilities", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Digital Twin", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Station Network", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resources", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Scenarios", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resilience", level: 3 })).toBeVisible();

    // 8. Verify Digital Twin Workflow
    await expect(page.getByRole("heading", { name: /From Physical Asset to Decisive Action/i })).toBeVisible();
    await expect(page.getByText("TRACE IMPACT")).toBeVisible();
    await expect(page.getByText("SIMULATE")).toBeVisible();

    // 9. Verify Operational Context
    await expect(page.getByText(/ANTARCTIC OPERATIONAL REALITY/i)).toBeVisible();
    await expect(page.getByText(/Store-and-Forward Sync/i)).toBeVisible();
    await expect(page.getByText(/Deterministic Analysis/i)).toBeVisible();

    // 10. Verify Primary Bottom CTA & Footer
    await expect(page.getByRole("heading", { name: /Ready to enter the operational workspace\?/i })).toBeVisible();
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/National Centre for Polar and Ocean Research \(NCPOR\)/i)).toBeVisible();

    // ==============================================================
    // CRITICAL: VERIFY OLD MISSION GATEWAY IS GONE
    // ==============================================================
    await expect(page.getByText("PolarOps Mission Gateway")).not.toBeVisible();
    await expect(page.getByText("ENTER OPERATIONS (BHARATI)")).not.toBeVisible();
    await expect(page.getByText("ENTER OPERATIONS (MAITRI)")).not.toBeVisible();

    // Capture screenshot of the new landing page safely
    try {
      const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");
      await page.screenshot({
        path: path.join(screenshotDir, "landing-page-desktop.png"),
        fullPage: true,
      });
    } catch (e) {
      console.warn("Screenshot capture skipped:", e);
    }
  });

  test("interactive CTA navigates from landing page into operations (/command-center)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click primary hero CTA
    const heroEnterBtn = page.locator("section").first().getByRole("link", { name: /ENTER OPERATIONS/i });
    await heroEnterBtn.click();

    // Verifies navigation to /command-center
    await expect(page).toHaveURL(/\/command-center/);
    await expect(page.locator("h1")).toContainText(/Command/i);
  });

  test("preserves operational routes continuity", async ({ page }) => {
    // 1. Digital Twin
    await page.goto("/digital-twin");
    await expect(page).toHaveURL(/\/digital-twin/);
    await expect(page.getByText(/Operational Topology|Condition & Evidence/i).first()).toBeVisible();

    // 2. Stations
    await page.goto("/stations");
    await expect(page).toHaveURL(/\/stations/);
    await expect(page.getByText(/Bharati|Maitri/i).first()).toBeVisible();

    // 3. Resources
    await page.goto("/resources");
    await expect(page).toHaveURL(/\/resources/);
    await expect(page.locator(".resource-card")).toHaveCount(8);
  });

  test("renders cleanly on mobile viewport without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X/11/12 mini dimensions
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check header and heading
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByRole("heading", { name: "POLAROPS", level: 1 })).toBeVisible();

    // Verify mobile menu button is present and clickable
    const mobileMenuBtn = page.getByRole("button", { name: /Toggle mobile menu/i });
    await expect(mobileMenuBtn).toBeVisible();
    await mobileMenuBtn.click();

    // Verify expanded mobile navigation contains Digital Twin link
    await expect(page.locator("header").getByRole("link", { name: "Digital Twin", exact: true })).toBeVisible();

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Capture screenshot safely
    try {
      const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");
      await page.screenshot({
        path: path.join(screenshotDir, "landing-page-mobile.png"),
        fullPage: true,
      });
    } catch (e) {
      console.warn("Mobile screenshot capture skipped:", e);
    }
  });

  test("theme toggle switches between light and dark modes and persists preference", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Start on landing page (ensure clean or default dark state)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Ensure initial theme is dark
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("polarops-theme", "dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify dark mode class on <html>
    const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkInitially).toBe(true);

    const toggleBtn = page.getByRole("button", { name: /Switch to light theme|Switch to dark theme|Toggle theme/i });
    await expect(toggleBtn).toBeVisible();

    // Capture baseline approved dark theme screenshot
    const screenshotDir = path.resolve(process.cwd(), "..", "docs", "integration", "screenshots");
    await page.screenshot({
      path: path.join(screenshotDir, "landing-page-dark-1440.png"),
      fullPage: true,
    });

    // 2. Click toggle button to switch to LIGHT mode
    await toggleBtn.click();

    // Verify dark class is removed
    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains("dark"));
    }).toBe(false);

    // Verify toggle button updated accessible label
    await expect(toggleBtn).toHaveAttribute("aria-label", "Switch to dark theme");

    // Verify light theme elements are visible and properly styled
    const lightHeading = page.getByRole("heading", { name: "POLAROPS", level: 1 });
    await expect(lightHeading).toBeVisible();
    await expect(page.getByText(/Integrated Polar Station Intelligence/i)).toBeVisible();
    await expect(page.getByText(/Indian Antarctic Research Network/i)).toBeVisible();

    // Capture light theme screenshot at 1440x900
    await page.screenshot({
      path: path.join(screenshotDir, "landing-page-light-1440.png"),
      fullPage: true,
    });

    // 3. Test persistence: reload page in light mode
    await page.reload();
    await page.waitForLoadState("networkidle");

    const isLightPersisted = await page.evaluate(() => !document.documentElement.classList.contains("dark"));
    expect(isLightPersisted).toBe(true);
    const storedTheme = await page.evaluate(() => localStorage.getItem("polarops-theme"));
    expect(storedTheme).toBe("light");

    // 4. Test 1024px tablet viewport in light mode
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(200);
    const scrollWidth1024 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth1024 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth1024).toBeLessThanOrEqual(clientWidth1024 + 1);

    await page.screenshot({
      path: path.join(screenshotDir, "landing-page-light-1024.png"),
      fullPage: true,
    });

    // 5. Test 375px mobile viewport in light mode
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);
    const scrollWidth375 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth375 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth375).toBeLessThanOrEqual(clientWidth375 + 1);

    await page.screenshot({
      path: path.join(screenshotDir, "landing-page-light-375.png"),
      fullPage: true,
    });

    // 6. Switch back to DARK theme
    await page.setViewportSize({ width: 1440, height: 900 });
    const toggleToDarkBtn = page.getByRole("button", { name: "Switch to dark theme" });
    await toggleToDarkBtn.click();

    // Verify dark class is back
    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains("dark"));
    }).toBe(true);

    // Verify toggle button updated accessible label to switch back to light
    const toggleToLightBtn = page.getByRole("button", { name: "Switch to light theme" });
    await expect(toggleToLightBtn).toBeVisible();

    // Reload in dark mode to verify dark persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    const isDarkPersisted = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkPersisted).toBe(true);
    const storedDarkTheme = await page.evaluate(() => localStorage.getItem("polarops-theme"));
    expect(storedDarkTheme).toBe("dark");

    // Capture dark screenshot on return to confirm no regressions
    await page.screenshot({
      path: path.join(screenshotDir, "landing-page-dark-restored.png"),
      fullPage: true,
    });
  });

  test("verifies purposeful animation classes, stats immediate values, and reduced-motion compliance", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 1. Verify Hero entrance animation classes exist on structured elements
    await expect(page.locator(".animate-hero-1").first()).toBeVisible();
    await expect(page.locator(".animate-hero-2").first()).toBeVisible();
    await expect(page.locator(".animate-hero-3").first()).toBeVisible();
    await expect(page.locator(".animate-hero-card")).toBeVisible();
    await expect(page.locator(".animate-hero-image")).toBeVisible();

    // 2. Verify Stats: all target numbers exist immediately in the DOM without zero-flash
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/47\+/i).first()).toBeVisible();
    await expect(page.getByText(/72h/i).first()).toBeVisible();
    await expect(page.getByText(/5-Stage/i).first()).toBeVisible();

    // 3. Verify Workflow Pipeline connected track line is present
    await expect(page.locator(".animate-line-signal")).toBeAttached();

    // 4. Verify Radar dash line is attached on map visual
    await expect(page.locator(".animate-radar-dash")).toBeAttached();

    // 5. Verify Capability cards hover elevation classes
    const capCards = page.locator("section:has-text('Core Capabilities')").locator(".group");
    await expect(capCards.first()).toBeVisible();

    // 6. Test with prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Ensure all critical content remains 100% visible under reduced motion
    await expect(page.getByRole("heading", { name: "POLAROPS", level: 1 })).toBeVisible();
    await expect(page.getByText("Antarctic Operational Digital Twin").first()).toBeVisible();
    await expect(page.getByText("DIGITAL TWIN TOPOLOGY")).toBeVisible();
    await expect(page.getByText("Core Capabilities")).toBeVisible();
    await expect(page.getByText(/From Physical Asset to Decisive Action/i)).toBeVisible();
  });
});

