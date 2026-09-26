import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("PolarOps Navbar Light / Dark Theme Transition", () => {
  test("Navbar controls adapt completely and genuinely in both Light and Dark themes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://127.0.0.1:5173/command-center");
    await page.waitForLoadState("networkidle");

    const header = page.locator("header[role='banner']");
    const themeBtn = header.getByRole("button", { name: /Switch to (dark|light) theme/i });

    // Ensure we start in light mode
    const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (isDarkInitially) {
      await themeBtn.click();
      await page.waitForTimeout(300);
    }

    // --- 1. LIGHT MODE INSPECTION ---
    const lightHeaderBg = await header.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const stationBtn = header.getByRole("button", { name: /Station:/i });
    const stationBtnLightBg = await stationBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const envStatus = header.locator("div[title*='Seasonal State']");
    const envStatusLightBg = await envStatus.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const connBtn = header.getByRole("button", { name: /Connectivity status:/i });
    const connBtnLightBg = await connBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const searchBtn = header.getByRole("button", { name: /Search or open command palette/i });
    const searchBtnLightBg = await searchBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const userBtn = header.getByRole("button", { name: /Open user menu/i });
    const userBtnLightBg = await userBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    console.log("LIGHT MODE COMPUTED BACKGROUNDS:");
    console.log("  Header:", lightHeaderBg);
    console.log("  Station Btn:", stationBtnLightBg);
    console.log("  Env Status:", envStatusLightBg);
    console.log("  Connectivity Btn:", connBtnLightBg);
    console.log("  Search Btn:", searchBtnLightBg);
    console.log("  User Btn:", userBtnLightBg);

    const outDir = "C:\\Users\\patil\\.gemini\\antigravity-ide\\brain\\2ce4e0a9-dc28-4455-95ef-d463def8ecb3";
    await page.screenshot({
      path: path.join(outDir, "navbar-light-theme.png"),
      clip: { x: 0, y: 0, width: 1440, height: 180 },
    });

    // --- 2. SWITCH TO DARK MODE ---
    await themeBtn.click();
    await page.waitForTimeout(400);

    const isDarkNow = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkNow).toBe(true);

    const darkHeaderBg = await header.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const stationBtnDarkBg = await stationBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const envStatusDarkBg = await envStatus.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const connBtnDarkBg = await connBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const searchBtnDarkBg = await searchBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const userBtnDarkBg = await userBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    console.log("DARK MODE COMPUTED BACKGROUNDS:");
    console.log("  Header:", darkHeaderBg);
    console.log("  Station Btn:", stationBtnDarkBg);
    console.log("  Env Status:", envStatusDarkBg);
    console.log("  Connectivity Btn:", connBtnDarkBg);
    console.log("  Search Btn:", searchBtnDarkBg);
    console.log("  User Btn:", userBtnDarkBg);

    // Verify none of the dark mode controls retain light background (rgb(241, 245, 249) is slate-100)
    expect(stationBtnDarkBg).not.toBe("rgb(241, 245, 249)");
    expect(envStatusDarkBg).not.toBe("rgb(241, 245, 249)");
    expect(connBtnDarkBg).not.toBe("rgb(241, 245, 249)");
    expect(searchBtnDarkBg).not.toBe("rgb(241, 245, 249)");
    expect(userBtnDarkBg).not.toBe("rgb(241, 245, 249)");

    await page.screenshot({
      path: path.join(outDir, "navbar-dark-theme.png"),
      clip: { x: 0, y: 0, width: 1440, height: 180 },
    });

    // Capture dark mode dropdowns
    await userBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(outDir, "navbar-dark-profile-dropdown.png"),
      clip: { x: 0, y: 0, width: 1440, height: 350 },
    });
    await page.keyboard.press("Escape");

    await stationBtn.click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(outDir, "navbar-dark-station-dropdown.png"),
      clip: { x: 0, y: 0, width: 1440, height: 350 },
    });
    await page.keyboard.press("Escape");

    // --- 3. MULTIPLE CYCLES (LIGHT -> DARK -> LIGHT -> DARK) ---
    // Switch to Light
    await themeBtn.click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);

    // Switch to Dark
    await themeBtn.click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });
});
