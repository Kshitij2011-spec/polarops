import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("PolarOps Offline Analog / Offline Operations Refinement", () => {
  const outDir = "C:\\Users\\patil\\.gemini\\antigravity-ide\\brain\\2ce4e0a9-dc28-4455-95ef-d463def8ecb3";

  test("1. Verifies removal of Online Demo card, compact header with preserved font size, and offline capabilities", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://127.0.0.1:5173/offline");
    await page.waitForLoadState("networkidle");

    // 1. CONFIRM "ONLINE DEMO" card is completely removed
    const onlineDemoCard = page.locator("text='OPERATING MODE'").filter({ hasText: "ONLINE DEMO" });
    const demoCardHeading = page.getByRole("heading", { name: /^OPERATING MODE$/i });
    expect(await demoCardHeading.count()).toBe(0);

    // Ensure there is no button or tag saying "ONLINE DEMO" in header or cards
    const onlineDemoButton = page.getByRole("button", { name: /^ONLINE DEMO$/i });
    expect(await onlineDemoButton.count()).toBe(0);

    // 2. CHECK HEADER FONT SIZE (Critical font rule)
    const headerTitle = page.locator("header h1.page-title");
    await expect(headerTitle).toBeVisible();
    await expect(headerTitle).toHaveText(/Offline Operations/i);

    const titleFontSize = await headerTitle.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    console.log(`Computed title font size: ${titleFontSize}px`);
    // clamp(2.15rem, 2.6vw, 2.35rem) translates to ~34px-38px on 1440px desktop
    expect(titleFontSize).toBeGreaterThanOrEqual(32);

    // 3. CHECK HEADER IS COMPACT VERTICALLY
    const headerElement = page.locator("main header");
    const headerBoundingBox = await headerElement.boundingBox();
    console.log("Header bounding box:", headerBoundingBox);
    expect(headerBoundingBox).not.toBeNull();
    // Header should be compact (typically under 115px height, significantly shorter than previous ~200px+ with banner)
    expect(headerBoundingBox!.height).toBeLessThanOrEqual(130);

    // 4. CHECK DYNAMIC STATION CONTEXT
    await expect(page.locator("#main-content header").getByText(/Bharati|Maitri/i).first()).toBeVisible();

    // 5. CHECK LOCAL TWIN STATE
    const localTwinHeading = page.getByRole("heading", { name: /LOCAL DIGITAL TWIN STATE/i });
    await expect(localTwinHeading).toBeVisible();

    // 6. CHECK SYNC QUEUE
    const syncQueueHeading = page.getByRole("heading", { name: /STORE & FORWARD SYNCHRONIZATION QUEUE/i });
    await expect(syncQueueHeading).toBeVisible();
    await expect(page.getByText(/G-02 inspection reviewed/i)).toBeVisible();
    await expect(page.getByText(/Scenario T-12 evaluated/i)).toBeVisible();

    // 7. CHECK RECONCILIATION PIPELINE & FLOW
    const reconciliationHeading = page.getByRole("heading", { name: /EVENT RECONCILIATION PIPELINE/i });
    await expect(reconciliationHeading).toBeVisible();
    await expect(page.getByText("LOCAL TWIN STATE", { exact: false })).toBeVisible();
    await expect(page.getByText("STORE & FORWARD BUFFER", { exact: false })).toBeVisible();

    // 8. CHECK DATA INTEGRITY
    const dataIntegrityHeading = page.getByRole("heading", { name: /DATA INTEGRITY VERIFICATION/i });
    await expect(dataIntegrityHeading).toBeVisible();
    await expect(page.getByText("8f4c2e17a93b4d58e2f6c019d821ea34b95f019c")).toBeVisible();
    // Verify no false claim of "ZERO DATA LOSS"
    const zeroDataLossClaim = page.getByText(/zero data loss/i);
    expect(await zeroDataLossClaim.count()).toBe(0);

    // 9. CHECK ACTIVE OFFLINE CAPABILITIES
    const capabilitiesHeading = page.getByRole("heading", { name: /ACTIVE OFFLINE CAPABILITIES/i });
    await expect(capabilitiesHeading).toBeVisible();
    await expect(page.getByText(/\[VIEW\]/i)).toBeVisible();
    await expect(page.getByText(/\[ANALYZE\]/i)).toBeVisible();
    await expect(page.getByText(/\[QUEUE\]/i)).toBeVisible();
    await expect(page.getByText(/\[REVIEW\]/i)).toBeVisible();

    // 10. CHECK "RETURN TO OPERATIONS" LINK
    const returnToOps = page.getByRole("link", { name: /RETURN TO OPERATIONS/i });
    await expect(returnToOps).toBeVisible();
    await expect(returnToOps).toHaveAttribute("href", "/command-center");

    // Capture Light Theme Screenshot - Top
    await page.screenshot({
      path: path.join(outDir, "offline-refined-light-top.png"),
    });

    // Scroll to bottom section and capture
    await page.locator("main footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(outDir, "offline-refined-light-bottom.png"),
    });

    // Scroll back to top
    await page.locator("header h1.page-title").scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // 11. CHECK DARK THEME
    const themeBtn = page.locator("header[role='banner']").getByRole("button", { name: /Switch to (dark|light) theme/i });
    await themeBtn.click();
    await page.waitForTimeout(300);

    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDark).toBe(true);

    // Capture Dark Theme Screenshot - Top
    await page.screenshot({
      path: path.join(outDir, "offline-refined-dark-top.png"),
    });

    // Scroll to bottom section and capture
    await page.locator("main footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(outDir, "offline-refined-dark-bottom.png"),
    });

    // Switch back to light theme for consistency
    await themeBtn.click();
    await page.waitForTimeout(200);
  });

  test("2. Interactive Reconnect & Synchronize state progression", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://127.0.0.1:5173/offline");
    await page.waitForLoadState("networkidle");

    // Click Offline Mode button to ensure offline mode
    const offlineModeBtn = page.getByRole("button", { name: /Offline Mode/i });
    await offlineModeBtn.click();
    await page.waitForTimeout(200);

    // Click Reconnect & Synchronize
    const syncBtn = page.getByRole("button", { name: /RECONNECT & SYNCHRONIZE/i });
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // Check intermediate or completed state
    await page.waitForTimeout(2500);
    await expect(page.getByText(/EVENTS RECONCILED/i)).toBeVisible();
  });

  test("3. Responsive layout at 1024px and 768px viewports", async ({ page }) => {
    // Tablet (1024px)
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("http://127.0.0.1:5173/offline");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(outDir, "offline-refined-1024px.png"),
      fullPage: true,
    });

    // Mobile (768px)
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("http://127.0.0.1:5173/offline");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(outDir, "offline-refined-768px.png"),
      fullPage: true,
    });
  });
});
