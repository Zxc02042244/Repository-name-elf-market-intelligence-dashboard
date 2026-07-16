import { expect, test } from "@playwright/test";
import {
  installPlaywrightSupabaseIsolation,
  SUPABASE_RPC_ALLOWLIST
} from "./playwright-supabase-isolation.js";

let supabaseIsolation;
let standardContextRequiresSync;

test.beforeAll(() => {
  expect(SUPABASE_RPC_ALLOWLIST).toEqual([
    "sync_skin_gallery_state",
    "delete_skin_gallery_state",
    "get_skin_gallery_stats",
    "get_skin_supply_stats"
  ]);
});

test.beforeEach(async ({ context }) => {
  standardContextRequiresSync = true;
  supabaseIsolation = await installPlaywrightSupabaseIsolation(context);
});

test.afterEach(async ({}, testInfo) => {
  const summary = supabaseIsolation.assertSafe({
    requiredRpcAttempts: {
      sync_skin_gallery_state: standardContextRequiresSync ? 1 : 0
    }
  });
  testInfo.annotations.push({
    type: "supabase-isolation",
    description: JSON.stringify(summary)
  });
});

const viewports = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 }
];

test("capture responsive UI sequentially", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  standardContextRequiresSync = false;

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: "zh-TW",
      reducedMotion: "reduce"
    });
    const manualContextIsolation = await installPlaywrightSupabaseIsolation(context);
    const page = await context.newPage();

    try {
      await page.goto("/?v=playwright-responsive#home", {
        waitUntil: "domcontentloaded"
      });
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(1_200);

      const responsiveBackground = await page.locator("body").evaluate((body) => {
        const style = getComputedStyle(body, "::before");
        return {
          image: style.backgroundImage,
          size: style.backgroundSize,
          repeat: style.backgroundRepeat,
          position: style.backgroundPosition
        };
      });
      expect(responsiveBackground.image).toContain(
        viewport.width >= 921 ? "elf-forest-desktop-v2.webp" : "elf-forest-mobile-v2.webp"
      );
      expect(responsiveBackground.size.split(",").map((value) => value.trim())).toContain("100%");
      expect(responsiveBackground.repeat.split(",").map((value) => value.trim())).toContain("no-repeat");
      expect(responsiveBackground.position.split(",").map((value) => value.trim())).toContain("50% 0%");

      if (viewport.width >= 1280) {
        const desktopShellWidth = await page.locator(".app-shell-home").evaluate((shell) => (
          shell.getBoundingClientRect().width
        ));
        expect(desktopShellWidth).toBeLessThanOrEqual(1400);
        expect((viewport.width - desktopShellWidth) / 2).toBeGreaterThanOrEqual(59);
      }

      if (viewport.width >= 921) {
        await expect(page.locator(".elf-mobile-carousel-shell")).toBeHidden();
        await expect(page.locator(".elf-desktop-champion .elf-champion-card")).toBeVisible();

        const desktopFrameLayers = await page.locator(".elf-desktop-champion .elf-champion-card").evaluate((card) => ({
          base: getComputedStyle(card).backgroundImage,
          rank: getComputedStyle(card.querySelector(".elf-champion-rank")).backgroundImage,
          name: getComputedStyle(card.querySelector(".elf-champion-body")).backgroundImage
        }));
        expect(desktopFrameLayers.base).toContain("unified-forest-card-frame-v1.png");
        expect(desktopFrameLayers.rank).toBe("none");
        expect(desktopFrameLayers.name).toBe("none");

        const desktopFrameAssetsLoaded = await page.locator(".elf-desktop-champion .elf-champion-card").evaluate(async (card) => {
          const extractUrl = (backgroundImage) => backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1] ?? "";
          const url = extractUrl(getComputedStyle(card).backgroundImage);
          return url !== "" && (await fetch(url)).ok;
        });
        expect(desktopFrameAssetsLoaded).toBe(true);
      }

      if (viewport.width >= 1120 && viewport.height >= 900) {
        const verticalFlow = await page.locator(".elf-tab-panel").evaluate((panel) => ({
          panelBottom: panel.getBoundingClientRect().bottom,
          footerTop: document.querySelector(".elf-home-footer")?.getBoundingClientRect().top ?? 0
        }));
        expect(verticalFlow.footerTop).toBeGreaterThan(verticalFlow.panelBottom);
      }

      await page.screenshot({
        path: testInfo.outputPath(`${viewport.name}.png`),
        animations: "disabled",
        fullPage: false
      });
    } finally {
      const summary = manualContextIsolation.assertSafe({
        requiredRpcAttempts: { sync_skin_gallery_state: 1 }
      });
      testInfo.annotations.push({
        type: `supabase-isolation-${viewport.name}`,
        description: JSON.stringify(summary)
      });
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
  await expect(page.locator('[data-skin-champion-view="mobile"]')).toBeVisible();
  await expect(page.locator('[data-skin-champion-view="desktop"]')).toBeHidden();
  await expect(page.locator(".elf-mobile-champion-carousel wa-carousel-item")).toHaveCount(10);
  await expect(page.locator(".elf-mobile-champion-carousel")).not.toHaveAttribute("navigation", "");
  await expect(page.locator(".elf-mobile-carousel-progress")).toBeHidden();
  await expect(page.locator(".elf-tab-panel-supply > .section-heading")).toBeHidden();
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

  await page.locator(".elf-mobile-champion-carousel").evaluate((element) => element.goToSlide(0, "auto"));
  await expect.poll(async () => page.locator(".elf-mobile-champion-carousel").evaluate((element) => (
    element.activeSlide
  ))).toBe(0);
  await page.locator(".elf-mobile-champion-carousel").evaluate((element) => element.next("auto"));
  await expect.poll(async () => page.locator(".elf-mobile-champion-carousel").evaluate((element) => (
    element.activeSlide
  ))).toBe(1);

  const mobileChampionLayout = await page.locator(".elf-mobile-champion-carousel wa-carousel-item > .elf-champion-card:visible").first().evaluate((card) => ({
    artHeight: card.querySelector(".elf-champion-art")?.getBoundingClientRect().height ?? 0,
    nameFontSize: Number.parseFloat(getComputedStyle(card.querySelector(".elf-champion-body > strong")).fontSize),
    outerBorderWidth: Number.parseFloat(getComputedStyle(card).borderTopWidth),
    innerFrameDisplay: getComputedStyle(card, "::before").display,
    artBorderWidth: Number.parseFloat(getComputedStyle(card.querySelector(".elf-champion-art")).borderTopWidth),
    rankBorderWidth: Number.parseFloat(getComputedStyle(card.querySelector(".elf-champion-rank")).borderTopWidth),
    statBorderWidth: Number.parseFloat(getComputedStyle(card.querySelector(".elf-champion-stat")).borderTopWidth),
    statLabelDisplay: getComputedStyle(card.querySelector(".elf-champion-stat span")).display,
    statValueBeforeContent: getComputedStyle(card.querySelector(".elf-champion-stat > :is(strong, .elf-rank-cancel)"), "::before").content,
    rankBottom: card.querySelector(".elf-champion-rank")?.getBoundingClientRect().bottom ?? 0,
    artImageTop: card.querySelector(".elf-champion-art img")?.getBoundingClientRect().top ?? 0,
    rankCenter: card.querySelector(".elf-champion-rank")?.getBoundingClientRect().x
      + (card.querySelector(".elf-champion-rank")?.getBoundingClientRect().width ?? 0) / 2,
    artImageCenter: card.querySelector(".elf-champion-art img")?.getBoundingClientRect().x
      + (card.querySelector(".elf-champion-art img")?.getBoundingClientRect().width ?? 0) / 2
  }));
  expect(mobileChampionLayout.artHeight).toBeGreaterThanOrEqual(170);
  expect(mobileChampionLayout.nameFontSize).toBeLessThanOrEqual(30);
  expect(mobileChampionLayout.outerBorderWidth).toBe(0);
  expect(mobileChampionLayout.innerFrameDisplay).toBe("none");
  expect(mobileChampionLayout.artBorderWidth).toBe(0);
  expect(mobileChampionLayout.rankBorderWidth).toBe(0);
  expect(mobileChampionLayout.statBorderWidth).toBe(0);
  expect(mobileChampionLayout.statLabelDisplay).toBe("none");
  expect(mobileChampionLayout.statValueBeforeContent).toContain("☆");
  expect(mobileChampionLayout.artImageTop - mobileChampionLayout.rankBottom).toBeGreaterThanOrEqual(0);
  expect(mobileChampionLayout.artImageTop - mobileChampionLayout.rankBottom).toBeLessThanOrEqual(120);
  expect(Math.abs(mobileChampionLayout.rankCenter - mobileChampionLayout.artImageCenter)).toBeLessThanOrEqual(4);

  await page.locator(".elf-mobile-champion-carousel").evaluate((element) => element.goToSlide(9, "auto"));
  await expect.poll(async () => page.locator(".elf-mobile-champion-carousel").evaluate((element) => (
    element.activeSlide
  ))).toBe(9);
  await expect(page.locator(".elf-mobile-champion-carousel wa-carousel-item[data-rank='10'] .elf-champion-rank"))
    .toHaveText("TOP 10");

  await page.locator(".elf-home-tabs-content [data-skin-home-tab='gallery']").click();
  await expect(page).toHaveURL(/#home&tab=gallery$/);
  await expect(page.locator(".elf-skin-grid")).toBeVisible();

  const mobileGalleryLayout = await page.locator(".elf-skin-grid").evaluate((element) => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length,
    wishlistButtonHeight: element.querySelector(".elf-wishlist-button")?.getBoundingClientRect().height ?? 0
  }));
  expect(mobileGalleryLayout.columns).toBe(2);
  expect(mobileGalleryLayout.wishlistButtonHeight).toBeGreaterThanOrEqual(44);
});

test("mobile carousel keeps its active rank after asynchronous community refresh", async ({ page }) => {
  let releaseCommunityResponse;
  const communityResponseGate = new Promise((resolve) => {
    releaseCommunityResponse = resolve;
  });

  supabaseIsolation.setRpcMock("sync_skin_gallery_state", async () => {
    await communityResponseGate;
    return {
      visitorCount: 1284,
      wishlistLeaders: [
        { skinId: "genesis-pioneer", wishCount: 6 },
        { skinId: "flame-runner", wishCount: 5 },
        { skinId: "bubble-beast", wishCount: 4 }
      ]
    };
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

test("mobile can enter the reserved market workspace without loading fake data", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-mobile-navigation#home", { waitUntil: "domcontentloaded" });

  await page.locator(".mobile-primary-nav a[href='#market']").click();
  await expect(page).toHaveURL(/#market$/);
  await expect(page.locator(".mobile-primary-nav a[aria-current='page']")).toHaveAttribute("href", "#market");
  await expect(page.locator(".app-header .route-tabs")).toBeHidden();
  await expect(page.locator(".app-header .page-summary")).toBeHidden();
  await expect(page.locator(".market-planned-workspace")).toBeVisible();
  await expect(page.locator("[data-market-source-kind='reserved']")).toBeVisible();
  await expect(page.locator("[data-market-module]")).toHaveCount(4);
  await expect(page.locator("[data-market-overview-status='planned']")).toBeVisible();
  await expect(page.locator("[data-market-overview-metric]")).toHaveCount(4);
  await expect(page.locator("[data-market-assets-status='planned']")).toBeVisible();
  await expect(page.locator(".market-assets-empty")).toBeVisible();
  await expect(page.locator(".market-assets-metrics")).toHaveCount(0);
  await expect(page.locator("[data-market-actors-status='planned']")).toBeVisible();
  await expect(page.locator(".market-actors-empty")).toBeVisible();
  await expect(page.locator(".market-actors-metrics")).toHaveCount(0);
  await expect(page.locator(".market-actors-boundary")).toContainText(/real identity|真實身份/);
  await expect(page.locator("[data-market-indicators-status='planned']")).toBeVisible();
  await expect(page.locator("[data-market-indicator]")).toHaveCount(2);
  await expect(page.locator("[data-market-indicator-score]")).toHaveCount(0);
  await expect(page.locator("[data-dashboard-nav]")).toHaveCount(0);
  await expect(page.locator("[data-action='refresh']")).toHaveCount(0);
  await expect(page.locator(".metric-card")).toHaveCount(0);

  const marketHeaderHeight = await page.locator(".app-header").evaluate((element) => element.getBoundingClientRect().height);
  expect(marketHeaderHeight).toBeLessThanOrEqual(150);

  const mobileOverview = await page.locator(".market-overview-metrics").evaluate((element) => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length,
    values: [...element.querySelectorAll("strong")].map((value) => value.textContent.trim())
  }));
  expect(mobileOverview.columns).toBe(2);
  expect(mobileOverview.values).toEqual(["—", "—", "—", "—"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.locator(".mobile-primary-nav a[href='#home']").click();
  await expect(page).toHaveURL(/#home$/);
  await expect(page.locator(".elf-home-workspace")).toBeVisible();
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
  await expect(page.locator('[data-skin-champion-view="desktop"]')).toBeVisible();
  await expect(page.locator('[data-skin-champion-view="mobile"]')).toBeHidden();

  const desktopGalleryTab = page.locator(".elf-home-tabs-desktop [data-skin-home-tab='gallery']");
  await desktopGalleryTab.click();
  await expect(page).toHaveURL(/#home&tab=gallery$/);
  await expect(page.locator(".elf-tab-panel-gallery")).toBeVisible();

  await page.locator(".app-header-skins .route-market-link").click();
  await expect(page).toHaveURL(/#market$/);
  await expect(page.locator(".mobile-primary-nav")).toBeHidden();
  await expect(page.locator(".app-header .route-tabs")).toBeVisible();
  await expect(page.locator(".market-planned-workspace")).toBeVisible();
  await expect(page.locator("[data-market-module]")).toHaveCount(4);
  await expect(page.locator("[data-market-overview-status='planned']")).toBeVisible();
  await expect(page.locator("[data-market-overview-metric]")).toHaveCount(4);
  await expect(page.locator("[data-market-assets-status='planned']")).toBeVisible();
  await expect(page.locator(".market-assets-empty")).toBeVisible();
  await expect(page.locator(".market-assets-metrics")).toHaveCount(0);
  await expect(page.locator("[data-market-actors-status='planned']")).toBeVisible();
  await expect(page.locator(".market-actors-empty")).toBeVisible();
  await expect(page.locator(".market-actors-metrics")).toHaveCount(0);
  await expect(page.locator(".market-actors-boundary")).toBeVisible();
  await expect(page.locator("[data-market-indicators-status='planned']")).toBeVisible();
  await expect(page.locator("[data-market-indicator]")).toHaveCount(2);
  await expect(page.locator("[data-market-indicator-score]")).toHaveCount(0);
  await expect(page.locator("[data-action='refresh']")).toHaveCount(0);

  const desktopOverviewColumns = await page.locator(".market-overview-metrics").evaluate((element) => (
    getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length
  ));
  expect(desktopOverviewColumns).toBe(4);

  await page.locator(".app-header .route-tabs a[href='#home']").click();
  await expect(page).toHaveURL(/#home$/);
  await expect(page.locator(".elf-home-workspace")).toBeVisible();
});

test("responsive view boundary switches exactly between 920 and 921 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 920, height: 900 });
  await page.goto("/?v=playwright-breakpoint-boundary#home", { waitUntil: "domcontentloaded" });

  await expect(page.locator('[data-skin-champion-view="mobile"]')).toBeVisible();
  await expect(page.locator('[data-skin-champion-view="desktop"]')).toBeHidden();

  await page.setViewportSize({ width: 921, height: 900 });

  await expect(page.locator('[data-skin-champion-view="mobile"]')).toBeHidden();
  await expect(page.locator('[data-skin-champion-view="desktop"]')).toBeVisible();

  await page.setViewportSize({ width: 620, height: 900 });
  await expect(page.locator(".mobile-primary-nav")).toBeVisible();

  await page.setViewportSize({ width: 621, height: 900 });
  await expect(page.locator(".mobile-primary-nav")).toBeHidden();
});
