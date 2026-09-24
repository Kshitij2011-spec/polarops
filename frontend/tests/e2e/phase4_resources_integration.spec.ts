import { test, expect } from "@playwright/test";

test.describe("Phase 4 Integration: Resources, Fuel, and Recovery Intelligence", () => {
  test("verifies real fuel metrics, inventory stockout, recovery pathway, resupply, and mutual aid", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Intercept real backend responses
    const fuelPromise = page.waitForResponse(
      (res) => res.url().includes("/api/resources/fuel?station_id=STATION-BHARATI") && res.status() === 200,
      { timeout: 30000 }
    );
    const invPromise = page.waitForResponse(
      (res) => res.url().includes("/api/resources/inventory?station_id=STATION-BHARATI") && res.status() === 200,
      { timeout: 30000 }
    );
    const maitriInvPromise = page.waitForResponse(
      (res) => res.url().includes("/api/resources/inventory?station_id=STATION-MAITRI") && res.status() === 200,
      { timeout: 30000 }
    );
    const resupplyPromise = page.waitForResponse(
      (res) => res.url().includes("/api/resources/resupply?station_id=STATION-BHARATI") && res.status() === 200,
      { timeout: 30000 }
    );
    const energyPromise = page.waitForResponse(
      (res) => res.url().includes("/api/resources/energy?station_id=STATION-BHARATI") && res.status() === 200,
      { timeout: 30000 }
    );
    const recoveryPromise = page.waitForResponse(
      (res) => res.url().includes("/api/resources/recovery/G-02") && res.status() === 200,
      { timeout: 30000 }
    );

    // 2. Navigate to Resources page
    await page.goto("/resources");

    // 3. Await all authoritative backend responses
    const [fuelRes, invRes, maitriInvRes, resupplyRes, energyRes, recoveryRes] = await Promise.all([
      fuelPromise,
      invPromise,
      maitriInvPromise,
      resupplyPromise,
      energyPromise,
      recoveryPromise,
    ]);

    expect(fuelRes.ok()).toBeTruthy();
    expect(invRes.ok()).toBeTruthy();
    expect(maitriInvRes.ok()).toBeTruthy();
    expect(resupplyRes.ok()).toBeTruthy();
    expect(energyRes.ok()).toBeTruthy();
    expect(recoveryRes.ok()).toBeTruthy();

    const fuelData = await fuelRes.json();
    const invData = await invRes.json();
    const resupplyData = await resupplyRes.json();
    const energyData = await energyRes.json();
    const recoveryData = await recoveryRes.json();

    // 4. Verify Level 1: Operational Resource Situation (Summary KPI Cards)
    const situation = page.getByTestId("level-1-situation");
    await expect(situation).toBeVisible();

    // Fuel Stock Card
    const fuelStockCard = page.getByTestId("fuel-stock-card");
    await expect(fuelStockCard).toBeVisible();
    await expect(fuelStockCard).toContainText("142,500 L");
    await expect(fuelStockCard).toContainText(`${fuelData.burn_rate_liters_per_hour} L/h`);
    await expect(fuelStockCard).toContainText("57.0% Full");

    // Fuel Runway Card
    const fuelRunwayCard = page.getByTestId("fuel-runway-card");
    await expect(fuelRunwayCard).toBeVisible();
    await expect(fuelRunwayCard).toContainText(`${fuelData.projected_runway_days}`);
    await expect(fuelRunwayCard).toContainText(`Winter Target: ${fuelData.winter_target_days}d`);
    await expect(fuelRunwayCard).toContainText(`-${fuelData.resupply_gap_days}d`);

    // Spares Stockout Card
    const sparesStockoutCard = page.getByTestId("spares-stockout-card");
    await expect(sparesStockoutCard).toBeVisible();
    await expect(sparesStockoutCard).toContainText("1 Item");
    await expect(sparesStockoutCard).toContainText("SK-402");
    await expect(sparesStockoutCard).toContainText("MWO-2026-089");

    // Resupply Overview Card
    const resupplyOverviewCard = page.getByTestId("resupply-overview-card");
    await expect(resupplyOverviewCard).toBeVisible();
    await expect(resupplyOverviewCard).toContainText(`${resupplyData[0].eta_days} Days`);
    await expect(resupplyOverviewCard).toContainText("MV Vasiliy Golovnin");
    await expect(resupplyOverviewCard).toContainText("2x SK-402");

    // 5. Verify Level 2: Equipment Recovery Pathway ("Can We Fix G-02?")
    const recoverySection = page.getByTestId("level-2-recovery");
    await expect(recoverySection).toBeVisible();
    await expect(recoverySection).toContainText("RECOVERY STATUS FOR G-02");
    await expect(recoverySection).toContainText("HIGH RECOVERY EXPOSURE");

    // 6-step recovery chain verification
    await expect(recoverySection).toContainText("1. AFFECTED ASSET");
    await expect(recoverySection).toContainText("Diesel Generator G-02");
    await expect(recoverySection).toContainText("2. ACTIVE WORK ORDER");
    await expect(recoverySection).toContainText(recoveryData.active_work_order_id);
    await expect(recoverySection).toContainText(recoveryData.work_order_status);
    await expect(recoverySection).toContainText("3. REQUIRED SPARE");
    await expect(recoverySection).toContainText("SK-402");
    await expect(recoverySection).toContainText("4. LOCAL STOCK");
    await expect(recoverySection).toContainText("0 Available");
    await expect(recoverySection).toContainText("STOCKOUT (0 UNITS)");
    await expect(recoverySection).toContainText("5. INBOUND VESSEL");
    await expect(recoverySection).toContainText("MV Vasiliy Golovnin");
    await expect(recoverySection).toContainText(`${recoveryData.resupply_eta_days} Days`);
    await expect(recoverySection).toContainText("6. MAITRI MUTUAL AID");
    await expect(recoverySection).toContainText("2 Units Available");
    await expect(recoverySection).toContainText("Locker M-2 (Airlift)");

    // Reasoning card
    await expect(recoverySection).toContainText("DETERMINISTIC RECOVERY REASONING & CONSTRAINTS");
    await expect(recoverySection).toContainText(recoveryData.reasoning);

    // 6. Verify Level 3: Fuel & Capacity Autonomy Engine
    const energySection = page.getByTestId("level-3-energy");
    await expect(energySection).toBeVisible();
    await expect(page.getByTestId("fuel-gauge")).toBeVisible();
    await expect(energySection).toContainText("STATION FUEL GAUGE");
    await expect(energySection).toContainText(`${energyData.outside_temp_celsius}°C`);
    await expect(energySection).toContainText(`${energyData.thermal_demand_kw} kW`);
    await expect(energySection).toContainText(`${energyData.projected_electrical_load_kw} kW`);
    await expect(energySection).toContainText("FLEET RESERVE");

    // 7. Verify Level 4: Station Warehouse Spares Inventory
    const sparesSection = page.getByTestId("level-4-spares");
    await expect(sparesSection).toBeVisible();
    const table = page.getByTestId("spares-table");
    await expect(table).toBeVisible();

    // Check Hero spare SK-402 in table
    const sk402Row = page.getByTestId("spare-row-SK-402");
    await expect(sk402Row).toBeVisible();
    await expect(sk402Row).toContainText("SK-402");
    await expect(sk402Row).toContainText("CRITICAL SHORTAGE");
    await expect(sk402Row).toContainText("0 Units");
    await expect(sk402Row).toContainText("Powerhouse Spares Rack B-04");

    // Test Spares Filter: Critical
    await page.getByTestId("spares-filter-CRITICAL").click();
    await expect(page.getByTestId("spare-row-SK-402")).toBeVisible();

    // Return to ALL filter
    await page.getByTestId("spares-filter-ALL").click();

    // Test Search input
    const searchInput = page.getByTestId("spares-search-input");
    await searchInput.fill("SK-402");
    await expect(page.getByTestId("spare-row-SK-402")).toBeVisible();
    await searchInput.clear();

    // 8. Verify Level 5: Maritime Resupply & Cross-Station Mutual Aid
    const logisticsSection = page.getByTestId("level-5-logistics");
    await expect(logisticsSection).toBeVisible();

    const maritimeCard = page.getByTestId("maritime-resupply-card");
    await expect(maritimeCard).toBeVisible();
    await expect(maritimeCard).toContainText("MV Vasiliy Golovnin");
    await expect(maritimeCard).toContainText("IN_TRANSIT");
    await expect(maritimeCard).toContainText("2x SK-402");

    const mutualAidCard = page.getByTestId("mutual-aid-card");
    await expect(mutualAidCard).toBeVisible();
    await expect(mutualAidCard).toContainText("Maitri Emergency Spare Stock");
    await expect(mutualAidCard).toContainText("TRANSFER FEASIBLE");
    await expect(mutualAidCard).toContainText("2 Units Available");
    await expect(mutualAidCard).toContainText("Locker M-2");
    await expect(mutualAidCard).toContainText("Twin Otter ski-plane");

    // 9. Verify Level 6: Spare Detail Inspection Drawer
    const inspectBtn = page.getByTestId("inspect-btn-SK-402");
    await inspectBtn.click();

    const drawer = page.getByTestId("spare-detail-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("WAREHOUSE SPARE INSPECTION");
    await expect(drawer).toContainText("SK-402");
    await expect(drawer).toContainText("0 Units");
    await expect(drawer).toContainText("MWO-2026-089");
    await expect(drawer).toContainText("BLOCKED (PARTS)");
    await expect(drawer).toContainText("Carried by MV Vasiliy Golovnin");

    // Close drawer
    await page.getByTestId("close-drawer-btn").click();
    await expect(drawer).not.toBeVisible();

    // 10. Verify Asset Handoff: Digital Twin -> Resources
    await page.goto("/digital-twin?asset=G-02");
    await page.waitForResponse((res) => res.url().includes("/api/assets/G-02/risk") && res.status() === 200);

    const viewInResourcesBtn = page.getByRole("button", { name: "VIEW IN RESOURCES & RECOVERY" });
    await expect(viewInResourcesBtn).toBeVisible();
    await viewInResourcesBtn.click();

    await page.waitForURL("**/resources?asset=G-02");
    await expect(page.getByTestId("level-2-recovery")).toBeVisible();
    await expect(page.getByTestId("level-2-recovery")).toContainText("RECOVERY STATUS FOR G-02");

    // 11. Zero console errors
    expect(consoleErrors).toEqual([]);

    // 12. Zero horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("verifies responsive layout on mobile viewport without horizontal overflow", async ({ page }) => {
    // 390x844 (Mobile Viewport)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/resources");

    await page.waitForResponse((res) => res.url().includes("/api/resources/fuel") && res.status() === 200);

    await expect(page.getByText("Resource & Logistics Command")).toBeVisible();
    await expect(page.getByTestId("level-1-situation")).toBeVisible();
    await expect(page.getByTestId("level-2-recovery")).toBeVisible();
    await expect(page.getByTestId("level-3-energy")).toBeVisible();
    await expect(page.getByTestId("level-4-spares")).toBeVisible();
    await expect(page.getByTestId("level-5-logistics")).toBeVisible();

    // Zero horizontal overflow on mobile
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});
