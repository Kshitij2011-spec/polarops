import { test, expect } from '@playwright/test';

test.describe('Day 4 Multi-Station Operational Coordination & Approved Frontend Preservation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /POLAROPS/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('Test 1 — Command Center displays compact Cross-Station Context Card in correct hierarchy', async ({ page }) => {
    const card = page.locator('[data-testid="cross-station-context-card"]');
    await expect(card).toBeVisible({ timeout: 15000 });

    // Verify station comparison metrics
    await expect(card.getByText(/MULTI-STATION COORDINATION CONTEXT/i)).toBeVisible({ timeout: 15000 });
    await expect(card.getByText(/BHARATI UNDER ELEVATED PRESSURE/i)).toBeVisible();
    await expect(card.getByText(/BHARATI:/i).first()).toBeVisible();
    await expect(card.getByText(/MAITRI:/i).first()).toBeVisible();
    await expect(card.getByText(/Maitri holds \+62\.\d+d reserve runway/i)).toBeVisible();
    await expect(card.getByText(/Maitri has spare kit headroom/i)).toBeVisible();
    await expect(card.getByText(/FLIGHT FEASIBILITY/i)).toBeVisible();
    await expect(card.getByText(/RESTRICTED/i).first()).toBeVisible();

    // Verify non-actuating disclaimer
    await expect(card.getByText(/PolarOps never executes autonomous cargo transfers/i)).toBeVisible();
  });

  test('Test 2 — Cross-Station Explanation Drawer opens from Command Center "Why?" button', async ({ page }) => {
    const card = page.locator('[data-testid="cross-station-context-card"]');
    await expect(card.getByText(/MULTI-STATION COORDINATION CONTEXT/i)).toBeVisible({ timeout: 15000 });

    const explainBtn = page.locator('[data-testid="explain-cross-station-btn"]');
    await expect(explainBtn).toBeVisible({ timeout: 10000 });
    await explainBtn.click();

    // Verify drawer opens with structured multi-station reasoning
    const drawer = page.locator('[data-testid="explanation-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 10000 });
    await expect(drawer.getByText(/Cross-Station Operational Pressure/i)).toBeVisible();
    await expect(drawer.getByText(/is under significantly higher operational pressure/i)).toBeVisible();
    await expect(drawer.getByText(/3\. EVIDENCE & CONTRIBUTING FACTORS/i)).toBeVisible();
  });

  test('Test 3 — Evaluating Operational Alignment records canonical event in timeline', async ({ page }) => {
    const card = page.locator('[data-testid="cross-station-context-card"]');
    await expect(card.getByText(/MULTI-STATION COORDINATION CONTEXT/i)).toBeVisible({ timeout: 15000 });

    const evalBtn = page.locator('[data-testid="evaluate-alignment-btn"]');
    await expect(evalBtn).toBeVisible({ timeout: 10000 });
    await evalBtn.click();

    // Verify success banner appears
    await expect(page.locator('[data-testid="alignment-success-banner"]')).toBeVisible({ timeout: 10000 });

    // Verify Activity Stream contains the logged event
    const activityStream = page.locator('[data-testid="activity-stream"]');
    if (await activityStream.isVisible()) {
      await expect(activityStream.getByText(/Cross-station/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('Test 4 — Navigate to Station Portfolio (/stations) workspace and verify station comparison cards', async ({ page }) => {
    // Navigate via header tab button
    const navBtn = page.locator('[data-testid="nav-stations-btn"]');
    await expect(navBtn).toBeVisible();
    await navBtn.click();

    await expect(page).toHaveURL(/\/stations/);
    const stationsView = page.locator('[data-testid="stations-view"]');
    await expect(stationsView).toBeVisible({ timeout: 15000 });

    // Verify Bharati Station Card
    const bharatiCard = page.locator('[data-testid="station-card-bharati"]');
    await expect(bharatiCard).toBeVisible();
    await expect(bharatiCard.getByText('Larsemann Hills')).toBeVisible();
    await expect(bharatiCard.getByText('142,500 L on hand')).toBeVisible();
    await expect(bharatiCard.getByText('G-02 STOCKOUT')).toBeVisible();

    // Verify Maitri Station Card
    const maitriCard = page.locator('[data-testid="station-card-maitri"]');
    await expect(maitriCard).toBeVisible();
    await expect(maitriCard.getByText('Schirmacher Oasis')).toBeVisible();
    await expect(maitriCard.getByText(/\+62\.\d+d reserve surplus/i)).toBeVisible();
    await expect(maitriCard.getByText('LOCKER M-2 STOCKED')).toBeVisible();
  });

  test('Test 5 — Verify Modeled Operational Capability Headroom bars across 5 domains', async ({ page }) => {
    await page.goto('/stations');
    const capSection = page.locator('[data-testid="operational-capabilities-section"]');
    await expect(capSection).toBeVisible({ timeout: 15000 });

    // Verify all 5 domains are rendered
    await expect(page.locator('[data-testid="capability-card-energy_resilience"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-comms_continuity"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-science_continuity"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-life_support"]')).toBeVisible();
    await expect(page.locator('[data-testid="capability-card-recovery_buffer"]')).toBeVisible();

    // Verify score meters appear with percentages
    await expect(capSection.getByText(/Bharati:.*%/).first()).toBeVisible();
    await expect(capSection.getByText(/Maitri:.*%/).first()).toBeVisible();
  });

  test('Test 6 — Verify Operational Differences Table and Coordination Constraints', async ({ page }) => {
    await page.goto('/stations');
    const diffTable = page.locator('[data-testid="differences-table"]');
    await expect(diffTable).toBeVisible({ timeout: 15000 });

    // Check key comparative differences
    await expect(diffTable.getByText(/Overall System Health/i)).toBeVisible();
    await expect(diffTable.getByText(/Diesel Fuel Runway/i)).toBeVisible();
    await expect(diffTable.getByText(/SK-402 Rotary Seal Kit/i)).toBeVisible();

    // Check coordination constraints
    const constraintsCard = page.locator('[data-testid="coordination-constraints-card"]');
    await expect(constraintsCard).toBeVisible();
    await expect(constraintsCard.getByText(/Inter-Station Distance/i)).toBeVisible();
    await expect(constraintsCard.getByText(/Flight Operations Restriction|Flight Weather/i)).toBeVisible();
    await expect(constraintsCard.getByText(/Satellite Bandwidth Asymmetry/i)).toBeVisible();

    // Check advisory considerations
    const considerationsCard = page.locator('[data-testid="cross-station-considerations-card"]');
    await expect(considerationsCard).toBeVisible();
    await expect(considerationsCard.getByText(/Evaluate Inter-Station SK-402 Spare Kit/i)).toBeVisible();
  });

  test('Test 7 — Run Cross-Station Disruption Scenario Simulation and verify decision options', async ({ page }) => {
    await page.goto('/stations');
    const scenarioSection = page.locator('[data-testid="cross-station-scenario-section"]');
    await expect(scenarioSection).toBeVisible({ timeout: 15000 });

    // Click Run Cross-Station Simulation
    const runBtn = page.locator('[data-testid="run-cross-station-scenario-btn"]');
    await runBtn.click();

    // Verify results
    const results = page.locator('[data-testid="cross-station-scenario-results"]');
    await expect(results).toBeVisible({ timeout: 15000 });
    await expect(results.getByText(/DISRUPTED STATION: Bharati Research Station/i)).toBeVisible();
    await expect(results.getByText(/SUPPORT STATION HEADROOM: Maitri Research Station/i)).toBeVisible();
    await expect(results.getByText(/Remaining Reserve Margin/i)).toBeVisible();
    await expect(results.getByText(/Available Reserve Headroom: \+/i)).toBeVisible();

    // Verify advisory decision options
    await expect(results.getByText(/Evaluate Inter-Station SK-402 Spare Kit Request/i)).toBeVisible();
    await expect(results.getByText(/HIGH RISK REDUCTION/i).first()).toBeVisible();
  });

  test('Test 8 — Verify Existing Features Intact: Asset Intelligence, Resources, Scenarios, Resilience', async ({ page }) => {
    // 1. Asset Intelligence
    await page.goto('/assets/G-02');
    await expect(page.getByRole('heading', { name: /Diesel Generator G-02/i, level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/LIVE TELEMETRY & HISTORICAL TRENDS/i)).toBeVisible();

    // 2. Resources
    await page.goto('/resources');
    await expect(page.getByRole('heading', { name: /Resource & Energy Intelligence/i })).toBeVisible({ timeout: 15000 });

    // 3. Scenarios
    await page.goto('/scenarios');
    await expect(page.getByText(/WHAT-IF CONSEQUENCE SIMULATOR/i)).toBeVisible({ timeout: 15000 });

    // 4. Resilience
    await page.goto('/resilience');
    await expect(page.getByRole('heading', { name: /OPERATE THROUGH DISRUPTION/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });
});
