import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 }
];

test("capture responsive UI sequentially", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: "zh-TW",
      reducedMotion: "reduce"
    });
    const page = await context.newPage();

    try {
      await page.goto("/?v=playwright-responsive#home", {
        waitUntil: "domcontentloaded"
      });
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(1_200);
      await page.screenshot({
        path: testInfo.outputPath(`${viewport.name}.png`),
        animations: "disabled",
        fullPage: false
      });
    } finally {
      await context.close();
    }
  }
});

test("mobile home tabs are deep linked and primary navigation stays reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-mobile-navigation#home", { waitUntil: "domcontentloaded" });

  const supplyTab = page.locator(".elf-home-tabs-content [data-skin-home-tab='supply']");
  await supplyTab.click();

  await expect(page).toHaveURL(/#home&tab=supply$/);
  await expect(page.locator(".elf-tab-panel-supply")).toBeVisible();
  await expect(page.locator(".elf-mobile-champion-carousel")).toBeVisible();
  await expect(page.locator('[data-view="mobile"]')).toBeVisible();
  await expect(page.locator('[data-view="desktop"]')).toBeHidden();
  await expect(page.locator(".elf-mobile-champion-carousel wa-carousel-item")).toHaveCount(3);
  await expect(page.locator(".mobile-primary-nav")).toBeVisible();
  await expect(page.locator(".mobile-primary-nav a[aria-current='page']")).toHaveAttribute("href", "#home");
  await expect(page.locator(".app-header .route-market-link")).toBeHidden();
  await expect(page.locator(".app-header-skins .page-summary")).toBeHidden();

  const homeHeaderHeight = await page.locator(".app-header-skins").evaluate((element) => element.getBoundingClientRect().height);
  expect(homeHeaderHeight).toBeLessThanOrEqual(130);

  const carouselUpgraded = await page.locator(".elf-mobile-champion-carousel").evaluate((element) => (
    Boolean(customElements.get("wa-carousel")) && Boolean(element.shadowRoot)
  ));
  expect(carouselUpgraded).toBe(true);

  const initialSlide = await page.locator(".elf-mobile-champion-carousel").evaluate((element) => element.activeSlide);
  await page.locator(".elf-mobile-champion-carousel").evaluate((element) => element.next("auto"));
  await expect.poll(async () => page.locator(".elf-mobile-champion-carousel").evaluate((element) => (
    element.activeSlide
  ))).toBeGreaterThan(initialSlide);
});

test("mobile carousel keeps its active rank after asynchronous community refresh", async ({ page }) => {
  let releaseCommunityResponse;
  const communityResponseGate = new Promise((resolve) => {
    releaseCommunityResponse = resolve;
  });

  await page.route("**/rest/v1/rpc/sync_skin_gallery_state", async (route) => {
    await communityResponseGate;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        visitorCount: 1284,
        wishlistLeaders: [
          { skinId: "genesis-pioneer", wishCount: 6 },
          { skinId: "flame-runner", wishCount: 5 },
          { skinId: "bubble-beast", wishCount: 4 }
        ]
      })
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-preserve-carousel#home", { waitUntil: "domcontentloaded" });

  const carousel = page.locator(".elf-mobile-champion-carousel");
  await expect(carousel).toBeVisible();
  await expect.poll(async () => carousel.evaluate((element) => Boolean(element.shadowRoot))).toBe(true);
  await page.waitForTimeout(1_200);
  await expect(carousel).toBeVisible();
  await carousel.evaluate((element) => {
    element.dataset.continuityMarker = "same-carousel-node";
  });
  await carousel.evaluate((element) => element.next("auto"));
  await expect.poll(async () => carousel.evaluate((element) => element.activeSlide)).toBe(1);

  releaseCommunityResponse();
  await expect.poll(async () => carousel.evaluate((element) => element.activeSlide), {
    timeout: 5_000
  }).toBe(1);
  await expect(carousel).toHaveAttribute("data-continuity-marker", "same-carousel-node");
});

test("mobile market uses a sticky horizontal section navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-mobile-navigation#market", { waitUntil: "domcontentloaded" });

  const sectionNavigation = page.locator("[data-dashboard-nav]");
  await expect(sectionNavigation).toBeVisible();
  await expect(sectionNavigation.locator("a")).toHaveCount(5);
  await expect(page.locator(".mobile-primary-nav a[aria-current='page']")).toHaveAttribute("href", "#market");
  await expect(page.locator(".app-header .route-tabs")).toBeHidden();
  await expect(page.locator(".app-header .page-summary")).toBeHidden();

  const marketHeaderHeight = await page.locator(".app-header").evaluate((element) => element.getBoundingClientRect().height);
  expect(marketHeaderHeight).toBeLessThanOrEqual(150);

  const navigationStyle = await sectionNavigation.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      display: style.display,
      overflowX: style.overflowX,
      position: style.position
    };
  });

  expect(navigationStyle).toEqual({
    display: "flex",
    overflowX: "auto",
    position: "sticky"
  });
});

test("desktop keeps the full header and does not render mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-desktop-navigation#home", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".mobile-primary-nav")).toBeHidden();
  await expect(page.locator(".app-header-skins .route-market-link")).toBeVisible();
  await expect(page.locator(".elf-home-tabs-desktop")).toBeVisible();

  const desktopSupplyTab = page.locator(".elf-home-tabs-desktop [data-skin-home-tab='supply']");
  await desktopSupplyTab.click();
  await expect(page).toHaveURL(/#home&tab=supply$/);
  await expect(page.locator(".elf-tab-panel-supply")).toBeVisible();
  await expect(page.locator('[data-view="desktop"]')).toBeVisible();
  await expect(page.locator('[data-view="mobile"]')).toBeHidden();

  const desktopGalleryTab = page.locator(".elf-home-tabs-desktop [data-skin-home-tab='gallery']");
  await desktopGalleryTab.click();
  await expect(page).toHaveURL(/#home&tab=gallery$/);
  await expect(page.locator(".elf-tab-panel-gallery")).toBeVisible();

  await page.goto("/?v=playwright-desktop-navigation#market", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".mobile-primary-nav")).toBeHidden();
  await expect(page.locator(".app-header .route-tabs")).toBeVisible();
});

test("responsive view boundary switches exactly between 920 and 921 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 920, height: 900 });
  await page.goto("/?v=playwright-breakpoint-boundary#home", { waitUntil: "domcontentloaded" });

  await expect(page.locator('[data-view="mobile"]')).toBeVisible();
  await expect(page.locator('[data-view="desktop"]')).toBeHidden();

  await page.setViewportSize({ width: 921, height: 900 });

  await expect(page.locator('[data-view="mobile"]')).toBeHidden();
  await expect(page.locator('[data-view="desktop"]')).toBeVisible();

  await page.setViewportSize({ width: 620, height: 900 });
  await expect(page.locator(".mobile-primary-nav")).toBeVisible();

  await page.setViewportSize({ width: 621, height: 900 });
  await expect(page.locator(".mobile-primary-nav")).toBeHidden();
});
