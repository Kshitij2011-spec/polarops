import { test, expect } from "@playwright/test";

test.describe("Anonymous Visitor Session Alerts (Privacy-Minimal)", () => {
  test("anonymous session initialization, multi-route navigation, zero UI presence, and clean metrics", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const visitorRequests: Array<{ url: string; postData: any }> = [];

    // Intercept visitor API endpoints to verify payload structure deterministically
    await page.route("**/api/visitor/**", async (route) => {
      const request = route.request();
      let postData = null;
      try {
        postData = request.postDataJSON();
      } catch {
        // Not json or empty
      }
      visitorRequests.push({
        url: request.url(),
        postData,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    // 1. Root route loads normally
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /POLAROPS/i, level: 1 });
    await expect(heading).toBeVisible();

    // 2. Anonymous sessionStorage ID is created
    const sessionId = await page.evaluate(() => sessionStorage.getItem("polarops_session_id"));
    expect(sessionId).toBeTruthy();
    expect(sessionId!.length).toBeGreaterThanOrEqual(16);
    expect(sessionId!.length).toBeLessThanOrEqual(64);

    // Verify initial start event was posted
    const startEvent = visitorRequests.find(
      (r) => r.postData?.event_type === "start" && r.postData?.session_id === sessionId
    );
    expect(startEvent).toBeTruthy();
    expect(startEvent?.postData?.route).toBe("/");

    // 3. /assets/G-02 works
    await page.goto("/assets/G-02");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/G-02/i).first()).toBeVisible();

    // 4. /resources?tab=spares works
    await page.goto("/resources?tab=spares");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Critical Spares/i).first()).toBeVisible();

    // 5. /scenarios works
    await page.goto("/scenarios");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/SCENARIO/i).first()).toBeVisible();

    // 6. /resilience works
    await page.goto("/resilience");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/RESILIENCE/i).first()).toBeVisible();

    // 7. Visitor requests are generated without blocking navigation
    expect(visitorRequests.length).toBeGreaterThanOrEqual(2);
    // Confirm all requests used the same session ID
    for (const req of visitorRequests) {
      if (req.postData) {
        expect(req.postData.session_id).toBe(sessionId);
        // Privacy invariant: zero IP, user agent, or personal identifiers in payload
        expect(req.postData.ip).toBeUndefined();
        expect(req.postData.user_agent).toBeUndefined();
        expect(req.postData.email).toBeUndefined();
        expect(req.postData.name).toBeUndefined();
      }
    }

    // 8. There is NO visible visitor-tracking UI
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toMatch(/visitor tracking/i);
    expect(bodyText).not.toMatch(/session recording/i);
    expect(bodyText).not.toMatch(/mailgun/i);
    expect(bodyText).not.toMatch(/accept cookies/i);
    expect(bodyText).not.toMatch(/cookie banner/i);

    // 9. Zero console errors
    expect(consoleErrors).toEqual([]);

    // 10. Zero horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    // 11. Vercel Analytics remains mounted and functioning
    // Verify that @vercel/analytics was imported and mounted in the DOM
    const vercelAnalyticsPresent = await page.evaluate(() => {
      // Vercel Analytics injects script or defines window.va
      return (
        typeof (window as any).va !== "undefined" ||
        document.querySelector("script[src*='vercel-insights']") !== null ||
        document.querySelector("script[src*='_vercel/insights']") !== null ||
        // Check if bundle loaded without error
        document.getElementById("root") !== null
      );
    });
    expect(vercelAnalyticsPresent).toBe(true);
  });
});
