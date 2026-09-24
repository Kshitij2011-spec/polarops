import { test, expect } from "@playwright/test";

test.describe("PolarOps Application Smoke Test", () => {
  test("renders root application shell and connects to station telemetry", async ({ page }) => {
    // 1. Navigate to PolarOps application root
    await page.goto("/");

    // 2. Verify page title and metadata
    await expect(page).toHaveTitle(/PolarOps/i);

    // 3. Verify primary application brand
    const heading = page.getByRole("heading", { name: /POLAROPS/i, level: 1 });
    await expect(heading).toBeVisible();

    const subtitle = page.getByText("Antarctic Operational Digital Twin");
    await expect(subtitle).toBeVisible();

    // 4. Verify comms indicator is online
    const commsBadge = page.getByTestId("comms-indicator");
    await expect(commsBadge).toBeVisible();
    await expect(commsBadge).toContainText(/ONLINE/i);

    // 5. Verify footer mission control text
    await expect(page.getByText(/POLAROPS MISSION CONTROL/i)).toBeVisible();
  });
});
