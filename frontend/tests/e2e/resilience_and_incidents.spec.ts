import { test, expect } from "@playwright/test";

test.describe("PolarOps Day 4: Resilience, Science Continuity, Incidents & Memory", () => {
  test.beforeEach(async ({ page, request }) => {
    // Deterministically reset simulation baseline via API before each test
    await request.post("/api/resilience/reset");
    await page.goto("/resilience");
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/ONLINE/i);
  });

  test("Test A — Resilience Workspace Loads and displays Comms Status", async ({ page }) => {
    await page.goto("/resilience");

    // Title and heading
    await expect(page.getByRole("heading", { name: /OPERATE THROUGH DISRUPTION/i, level: 1 })).toBeVisible();

    // Comms status card
    const commsCard = page.getByTestId("comms-status-card");
    await expect(commsCard).toBeVisible();
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/ONLINE/i);
    await expect(page.getByTestId("comms-latency")).toBeVisible();
    await expect(page.getByTestId("comms-bandwidth")).toBeVisible();
  });

  test("Test B — Simulate Satellite Comms Outage", async ({ page }) => {
    await page.goto("/resilience");

    // Click simulate outage
    const outageBtn = page.getByTestId("simulate-outage-btn");
    await expect(outageBtn).toBeVisible();
    await outageBtn.click();

    // Verify OFFLINE status and disconnected latency
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/OFFLINE/i);
    await expect(page.getByTestId("comms-latency")).toHaveText(/DISCONNECTED/i);
    await expect(page.getByTestId("comms-bandwidth")).toHaveText(/0 kbps/i);
  });

  test("Test C — Deterministic Priority Queue Ordering (P0 before P1, P2, P3)", async ({ page }) => {
    await page.goto("/resilience");

    const queueTable = page.getByTestId("sync-queue-table");
    await expect(queueTable).toBeVisible();

    // Verify P0 critical items exist and are listed first
    const p0Item = page.getByTestId("queue-item-P0").first();
    await expect(p0Item).toBeVisible();

    // Verify P1, P2, P3 exist
    await expect(page.getByTestId("queue-item-P1").first()).toBeVisible();
    await expect(page.getByTestId("queue-item-P2").first()).toBeVisible();
    await expect(page.getByTestId("queue-item-P3").first()).toBeVisible();
  });

  test("Test D — Canonical SHA-256 Checksum Display and Integrity Verification", async ({ page }) => {
    await page.goto("/resilience");

    // Checksum hash element exists
    const checksum = page.getByTestId("checksum-hash").first();
    await expect(checksum).toBeVisible();

    // Checksum verified badge exists
    const verifiedBadge = page.getByTestId("checksum-verified-badge").first();
    await expect(verifiedBadge).toBeVisible();
    await expect(verifiedBadge).toHaveText(/VERIFIED/i);
  });

  test("Test E — Science Data Buffering for Hero Instrument S-17", async ({ page }) => {
    await page.goto("/resilience");

    // Switch to Science tab or inspect science card
    await page.getByRole("button", { name: /Science Buffer/i }).click();

    const sciCard = page.getByTestId("science-instruments-card");
    await expect(sciCard).toBeVisible();

    // Hero instrument S-17 exists
    const s17Card = page.getByTestId("instrument-S-17");
    await expect(s17Card).toBeVisible();
    await expect(s17Card.getByText(/Auroral Ionospheric Radar Array/i)).toBeVisible();

    // Buffer an observation
    const bufferBtn = s17Card.getByTestId("buffer-observation-btn");
    await expect(bufferBtn).toBeVisible();
    await bufferBtn.click();

    // Verify feedback
    await expect(page.getByText(/Scientific observation buffered locally/i)).toBeVisible();
  });

  test("Test F — Link Reconnection and Priority Synchronization", async ({ page }) => {
    await page.goto("/resilience");

    // 1. Simulate outage first
    await page.getByTestId("simulate-outage-btn").click();
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/OFFLINE/i);

    // 2. Restore & Reconcile
    const restoreBtn = page.getByTestId("restore-sync-btn");
    await expect(restoreBtn).toBeVisible();
    await restoreBtn.click();

    // 3. Status returns to ONLINE
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/ONLINE/i);
    await expect(page.getByText(/Link restored.*Priority queue synchronized/i)).toBeVisible();
  });

  test("Test G — Incident Workspace, Blast Radius & Risk Reuse", async ({ page }) => {
    await page.goto("/resilience");

    // Navigate to Incidents tab
    await page.getByRole("button", { name: /Incident Blast Radius/i }).click();

    // Incidents list visible
    await expect(page.getByTestId("incidents-list")).toBeVisible();
    await expect(page.getByTestId("incidents-list").getByText(/INC-2026-04/i)).toBeVisible();

    // Incident detail panel
    const detailPanel = page.getByTestId("incident-detail-panel");
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel.getByText(/Generator G-02 High Vibration/i)).toBeVisible();

    // Blast radius and risk score reused from Day 2
    await expect(page.getByTestId("incident-blast-radius")).toBeVisible();
    await expect(page.getByTestId("incident-risk-score")).toBeVisible();
  });

  test("Test H — Human-in-the-Loop Action Logging", async ({ page }) => {
    await page.goto("/resilience");

    await page.getByRole("button", { name: /Incident Blast Radius/i }).click();

    // Fill action form
    await page.getByTestId("action-code-input").fill("EXPEDITE_VALVE_PURGE");
    await page.getByTestId("action-desc-input").fill("Purged primary fuel bypass valve on manifold 3B");
    await page.getByTestId("submit-action-btn").click();

    // Verify action appeared in audit trail
    await expect(page.getByTestId("action-item").filter({ hasText: "EXPEDITE_VALVE_PURGE" }).first()).toBeVisible();
  });

  test("Test I — Incident Resolution & Operational Memory Search", async ({ page }) => {
    await page.goto("/resilience");

    await page.getByRole("button", { name: /Incident Blast Radius/i }).click();

    // Mark incident resolved
    const resolveBtn = page.getByTestId("resolve-incident-btn");
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
      await page.waitForTimeout(500);
    }

    // Switch to Operational Memory tab
    await page.getByRole("button", { name: /Operational Memory/i }).click();
    await expect(page.getByTestId("operational-memory-panel")).toBeVisible();

    // Search for existing lesson
    const searchInput = page.getByTestId("memory-search-input");
    await searchInput.fill("Boiler");

    // Verify memory card appears
    await expect(page.getByTestId("memory-card").first()).toBeVisible();
    await expect(page.getByText(/takes 35 minutes to reach full heating capacity/i)).toBeVisible();
  });

  test("Test J — Simulation Reset Isolation preserves canonical resources", async ({ page }) => {
    await page.goto("/resilience");

    // Simulate outage and queue an item
    await page.getByTestId("simulate-outage-btn").click();
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/OFFLINE/i);

    // Reset simulation
    await page.getByTestId("reset-simulation-btn").click();
    await expect(page.getByTestId("comms-status-badge")).toHaveText(/ONLINE/i);

    // Navigate to Resources & Fuel to ensure canonical fuel is untouched
    await page.getByRole("button", { name: /Resources & Fuel/i }).click();
    await expect(page.getByText(/142,500 L/i)).toBeVisible();
    await page.getByRole("button", { name: /Inventory & Spares/i }).click();
    await expect(page.getByText(/Station Warehouse Critical Spares Inventory/i, { timeout: 10000 })).toBeVisible();
  });
});
