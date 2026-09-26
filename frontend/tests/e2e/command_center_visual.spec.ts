import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

test.describe("Command Center Refined Visual & Operational Verification", () => {
  const screenshotDir = path.join(process.cwd(), "test-results");

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("captures desktop visual review and verifies all operational interactions", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Wait for real backend responses
    const overviewPromise = page.waitForResponse(
      (res) => res.url().includes("/station/overview") && res.status() === 200,
      { timeout: 20000 }
    );
    const intelPromise = page.waitForResponse(
      (res) => res.url().includes("/intelligence/narrative") && res.status() === 200,
      { timeout: 20000 }
    );

    await page.goto("/command-center");
    await Promise.all([overviewPromise, intelPromise]);

    // 1. Verify Header
    await expect(page.getByText("COMMAND CENTER", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operational Command Center" })).toBeVisible();
    await expect(page.getByText("SAT-1 LIVE")).toBeVisible();

    // 2. Verify 4 Summary Cards
    await expect(page.getByTestId("metric-health")).toBeVisible();
    await expect(page.getByTestId("metric-power")).toBeVisible();
    await expect(page.getByTestId("metric-fuel")).toBeVisible();
    await expect(page.getByTestId("metric-environment")).toBeVisible();

    // 3. Verify Topology Schematic is prominent
    await expect(page.getByText("Station Subsystem Topology & Problem Isolation")).toBeVisible();
    await expect(page.getByTestId("digital-twin-topology")).toBeVisible();

    // 4. Verify Critical Event & Human Approval Cards
    await expect(page.getByTestId("critical-event-title")).toBeVisible();
    await expect(page.getByTestId("operational-recommendation")).toBeVisible();
    await expect(page.getByTestId("causal-reasoning-chain")).toBeVisible();

    // 5. Verify Cross-Station Context
    await expect(page.getByText("Which Station Needs Attention Right Now?")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bharati Station" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Maitri Station" })).toBeVisible();

    // 6. Verify Activity Stream
    await expect(page.getByTestId("operational-activity-list")).toBeVisible();

    // Capture initial full page desktop screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "command_center_desktop_1440x900.png"),
      fullPage: true,
    });

    // 7. Test ExplanationDrawer interaction
    const explainPromise = page.waitForResponse(
      (res) => res.url().includes("/explain/ASSET/G-02") && res.status() === 200,
      { timeout: 20000 }
    );
    await page.getByTestId("open-explanation-btn").click();
    await explainPromise;
    await expect(page.getByText("INCIDENT EXPLANATION")).toBeVisible();
    await expect(page.getByText("WHY DOES IT MATTER?")).toBeVisible();

    // Close ExplanationDrawer
    await page.keyboard.press("Escape");
    await expect(page.getByText("INCIDENT EXPLANATION")).not.toBeVisible();

    // 8. Test Progressive Disclosure: Causal Trace
    const causalToggle = page.getByRole("button", { name: /WHY DOES THIS MATTER\? DETERMINISTIC CAUSAL TRACE/i });
    await causalToggle.click();
    await expect(page.getByText("STAGE 01")).toBeVisible();
    await expect(page.getByText("STAGE 07")).toBeVisible();

    // 9. Test Human-in-the-Loop decision approval
    const approveBtn = page.getByRole("button", { name: /APPROVE ACTION/i });
    await approveBtn.click();
    await expect(page.getByText("OPERATOR APPROVED · DISPATCHED")).toBeVisible();

    // 10. Test Collapsible Activity Stream
    const activityToggle = page.getByRole("button", { name: /Expand Activity Log/i });
    await activityToggle.click();
    await expect(page.getByRole("button", { name: /Collapse Activity/i })).toBeVisible();

    // Capture interactive state screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "command_center_expanded_interactions.png"),
      fullPage: true,
    });
  });

  test("captures mobile responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/command-center");
    await page.waitForLoadState("networkidle");

    // Verify zero horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await page.screenshot({
      path: path.join(screenshotDir, "command_center_mobile_390x844.png"),
      fullPage: true,
    });
  });
});
