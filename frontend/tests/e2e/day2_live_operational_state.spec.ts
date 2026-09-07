import { test, expect } from '@playwright/test';

test.describe('Day 2 Live Operational State & Deterministic Explainability Layer', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local frontend
    await page.goto('/');
    // Wait for the station overview to finish loading
    await expect(page.getByRole("heading", { name: /POLAROPS/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('Test 1 — Command Center displays Operational Activity Stream with chronological events and synthetic disclosure', async ({ page }) => {
    // 1. Verify Activity Stream is visible on Command Center
    const stream = page.locator('[data-testid="operational-activity-stream"]');
    await expect(stream).toBeVisible();

    // 2. Verify header elements
    await expect(stream.locator('text=OPERATIONAL ACTIVITY STREAM')).toBeVisible();
    await expect(stream.locator('[data-testid="simulate-event-btn"]')).toBeVisible();
    await expect(stream.locator('[data-testid="reset-events-btn"]')).toBeVisible();

    // 3. Verify synthetic demonstration badge is clearly visible
    const syntheticBadge = stream.locator('[data-testid="synthetic-activity-badge"]');
    await expect(syntheticBadge).toBeVisible();
    await expect(syntheticBadge).toContainText('SYNTHETIC DEMONSTRATION ACTIVITY');

    // 4. Verify chronological event list contains multiple operational events
    const eventItems = page.locator('[data-testid^="activity-event-"]');
    await expect(eventItems.first()).toBeVisible({ timeout: 15000 });
    const count = await eventItems.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // 5. Test Filters: Warnings & Critical, System & Comms
    const warningsBtn = page.locator('[data-testid="filter-warnings-btn"]');
    await warningsBtn.click();
    await expect(eventItems.first()).toBeVisible({ timeout: 10000 });

    const systemBtn = page.locator('[data-testid="filter-system-btn"]');
    await systemBtn.click();
    await expect(eventItems.first()).toBeVisible({ timeout: 10000 });

    const allBtn = page.locator('[data-testid="filter-all-btn"]');
    await allBtn.click();
    await expect(eventItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('Test 2 — G-02 event "WHY?" opens Deterministic Explanation Drawer with complete causal reasoning', async ({ page }) => {
    // 1. Locate the G-02 "WHY?" button in Activity Stream or Critical Events
    const g02Event = page.locator('[data-testid^="activity-event-"]').filter({ hasText: /G-02|Vibration/i }).first();
    const whyBtn = (await g02Event.isVisible())
      ? g02Event.locator('[data-testid="event-why-btn"]')
      : page.locator('[data-testid="critical-event-why-btn"]').first();
    await expect(whyBtn).toBeVisible({ timeout: 15000 });
    await whyBtn.click();

    // 2. Verify Explanation Drawer opens
    const drawer = page.locator('[data-testid="explanation-drawer"]');
    await expect(drawer).toBeVisible();

    // 3. Verify Section 1: WHAT CHANGED
    const whatChanged = page.locator('[data-testid="explanation-what-changed"]');
    await expect(whatChanged).toBeVisible();
    await expect(whatChanged).toContainText('vibration');

    // 4. Verify Section 2: WHY IT MATTERS
    const whyItMatters = page.locator('[data-testid="explanation-why-it-matters"]');
    await expect(whyItMatters).toBeVisible();
    await expect(whyItMatters).toContainText('Habitat');

    // 5. Verify Section 3: EVIDENCE & CONTRIBUTING FACTORS (Vibration & Coolant telemetry)
    const evidenceSection = page.locator('[data-testid="explanation-evidence-section"]');
    await expect(evidenceSection).toBeVisible();
    await expect(evidenceSection).toContainText('Bearing Vibration');
    await expect(evidenceSection).toContainText('4.8');

    // 6. Verify Section 4: WHAT IT AFFECTS (Dependency Blast Radius)
    const consequencesSection = page.locator('[data-testid="explanation-consequences-section"]');
    await expect(consequencesSection).toBeVisible();
    await expect(consequencesSection).toContainText('Hop');

    // 7. Verify Section 5: RECOVERY CONSTRAINTS (SK-402 Spare Stockout)
    const constraintsSection = page.locator('[data-testid="explanation-constraints-section"]');
    await expect(constraintsSection).toBeVisible();
    await expect(constraintsSection).toContainText('SK-402');
    await expect(constraintsSection).toContainText('stock');

    // 8. Verify Section 6: WHAT NOW? (Recommended Investigation)
    const nextStepsSection = page.locator('[data-testid="explanation-next-steps-section"]');
    await expect(nextStepsSection).toBeVisible();
    await expect(nextStepsSection).toContainText('Inspect Asset G-02');

    // 9. Close Drawer
    const closeBtn = page.locator('[data-testid="explanation-drawer-close-btn"]');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test('Test 3 — Critical Events "WHY?" button opens Explanation Drawer', async ({ page }) => {
    // 1. Click "WHY?" on the Critical Events card
    const criticalWhyBtn = page.locator('[data-testid="critical-event-why-btn"]');
    await expect(criticalWhyBtn).toBeVisible();
    await criticalWhyBtn.click();

    // 2. Verify drawer opens
    const drawer = page.locator('[data-testid="explanation-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Generator G-02');

    // 3. Close drawer
    await page.locator('[data-testid="explanation-drawer-close-btn"]').click();
    await expect(drawer).not.toBeVisible();
  });

  test('Test 4 — Recommended investigation links navigate to correct views', async ({ page }) => {
    // 1. Open G-02 explanation drawer
    const g02Event = page.locator('[data-testid^="activity-event-"]').filter({ hasText: /G-02|Vibration/i }).first();
    const whyBtn = (await g02Event.isVisible())
      ? g02Event.locator('[data-testid="event-why-btn"]')
      : page.locator('[data-testid="critical-event-why-btn"]').first();
    await expect(whyBtn).toBeVisible({ timeout: 15000 });
    await whyBtn.click();
    const drawer = page.locator('[data-testid="explanation-drawer"]');
    await expect(drawer).toBeVisible();

    // 2. Click "Open" on Inspect Asset G-02 step
    const inspectBtn = page.locator('[data-testid="next-step-btn-inspect_g02"]');
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // 3. Verify navigation to Asset Intelligence for G-02
    await expect(page).toHaveURL(/.*\/assets\/G-02/);
    await expect(page.getByRole('heading', { name: /Diesel Generator G-02/i })).toBeVisible();

    // 4. In Asset Intelligence, verify "Full Explanation" button opens the drawer too
    const fullExplanationBtn = page.locator('[data-testid="risk-card-why-btn"]');
    if (await fullExplanationBtn.isVisible()) {
      await fullExplanationBtn.click();
      await expect(drawer).toBeVisible();
      await page.locator('[data-testid="explanation-drawer-close-btn"]').click();
    }
  });

  test('Test 5 — Outage simulation produces local queue activity and stepped reconciliation', async ({ page, request }) => {
    // 1. Reset simulation baseline via API to ensure clean deterministic ONLINE state
    await request.post('/api/resilience/reset');
    await page.goto('/resilience');
    await expect(page.locator('text=OPERATE THROUGH DISRUPTION')).toBeVisible({ timeout: 15000 });

    const statusBadge = page.locator('[data-testid="comms-status-badge"]');
    await expect(statusBadge).toContainText('ONLINE', { timeout: 10000 });

    // 2. Simulate Outage
    const outageBtn = page.locator('[data-testid="simulate-outage-btn"]');
    await expect(outageBtn).toBeEnabled({ timeout: 10000 });
    await outageBtn.click();

    // 3. Verify Comms Status transitions to OFFLINE
    await expect(statusBadge).toContainText('OFFLINE', { timeout: 10000 });

    // 4. Verify priority queue items exist
    const queueTable = page.locator('[data-testid="sync-queue-table"]');
    await expect(queueTable).toBeVisible();
    await expect(page.locator('[data-testid="queue-item-P0"]').first()).toBeVisible();

    // 5. Click Restore & Reconcile
    const restoreBtn = page.locator('[data-testid="restore-sync-btn"]');
    await expect(restoreBtn).toBeVisible();
    await restoreBtn.click();

    // 6. Verify stepped reconciliation progress card appears
    const progressCard = page.locator('[data-testid="reconciliation-progress-card"]');
    await expect(progressCard).toBeVisible({ timeout: 5000 });
    await expect(progressCard).toContainText('STEPPED RECONNECTION');

    // 7. Verify priority progression text & checksum confirmation
    await expect(page.locator('text=Link restored. Priority queue synchronized and verified via canonical SHA-256.')).toBeVisible({ timeout: 10000 });

    // 8. Verify comms status returns to ONLINE
    await expect(statusBadge).toContainText('ONLINE', { timeout: 10000 });
  });

  test('Test 6 — Reset restores deterministic timeline baseline', async ({ page }) => {
    // 1. On Command Center, advance a demo event
    await page.goto('/');
    await expect(page.locator('[data-testid="operational-activity-stream"]')).toBeVisible();

    const advanceBtn = page.locator('[data-testid="simulate-event-btn"]');
    await expect(advanceBtn).toBeVisible();
    await advanceBtn.click();

    // Wait for step feedback message
    await expect(page.locator('text=Step triggered:')).toBeVisible({ timeout: 5000 });

    // 2. Click Reset Timeline
    const resetBtn = page.locator('[data-testid="reset-events-btn"]');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // 3. Verify reset confirmation message
    await expect(page.locator('text=Timeline reset to canonical baseline.')).toBeVisible({ timeout: 5000 });
  });
});
