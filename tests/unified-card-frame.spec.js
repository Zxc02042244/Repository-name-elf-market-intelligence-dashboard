import { expect, test } from "@playwright/test";

test("every champion reuses the single global frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-unified-frame#home&tab=supply", {
    waitUntil: "domcontentloaded"
  });

  const card = page.locator('[data-skin-champion-view="desktop"] .elf-champion-card');
  await expect(card).toHaveCount(1);
  await expect(card).toHaveClass(/elf-champion-unified-frame/);
  await expect(card).not.toHaveClass(/elf-champion-layered-frame|elf-champion-frame-/);

  await expect.poll(async () => card.evaluate((element) => getComputedStyle(element).backgroundImage))
    .toContain("unified-forest-card-frame-v1.png");
  const firstBackground = await card.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(firstBackground).toContain("unified-forest-card-frame-v1.png");

  const rows = page.locator(".elf-tab-panel-supply .elf-rank-row-selectable");
  await expect(rows).toHaveCount(10);
  await rows.nth(1).click();

  const secondBackground = await card.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(secondBackground).toBe(firstBackground);
  await expect(card).toBeVisible();
  await expect.poll(async () => card.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThan(0);

  const layout = await card.evaluate((element) => {
    const rank = element.querySelector(".elf-champion-rank").getBoundingClientRect();
    const art = element.querySelector(".elf-champion-art img").getBoundingClientRect();
    const name = element.querySelector(".elf-champion-body > strong").getBoundingClientRect();
    const bounds = element.getBoundingClientRect();

    return {
      aspect: bounds.width / bounds.height,
      rankInside: rank.top >= bounds.top && rank.bottom <= bounds.bottom,
      artInside: art.top >= bounds.top && art.bottom <= bounds.bottom,
      nameInside: name.top >= bounds.top && name.bottom <= bounds.bottom
    };
  });

  expect(layout.aspect).toBeCloseTo(1041 / 1511, 2);
  expect(layout.rankInside).toBe(true);
  expect(layout.artInside).toBe(true);
  expect(layout.nameInside).toBe(true);
});

test("mobile carousel uses the same global frame", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-unified-frame-mobile#home&tab=supply", {
    waitUntil: "domcontentloaded"
  });

  const cards = page.locator(".elf-mobile-champion-carousel .elf-champion-card");
  await expect(cards).toHaveCount(10);

  const backgrounds = await cards.evaluateAll((elements) => (
    elements.map((element) => getComputedStyle(element).backgroundImage)
  ));
  expect(new Set(backgrounds).size).toBe(1);
  expect(backgrounds[0]).toContain("unified-forest-card-frame-v1.png");
});

test("wishlist and supply rankings share the champion card bounds", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-shared-ranking-layout#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator(".elf-tab-panel-wishlist .elf-rank-meter")).toHaveCount(10);
  await expect(page.locator('[data-skin-champion-view="desktop"] .elf-champion-card')).toBeVisible();

  const readLayout = () => page.locator(".elf-tab-panel:visible").evaluate((panel) => {
    const card = panel.querySelector('[data-skin-champion-view="desktop"] .elf-champion-card');
    const ranking = panel.querySelector(":scope > .elf-rank-list");
    const delta = panel.querySelector(":scope > .elf-delta-panel");
    const rect = (element) => {
      const bounds = element?.getBoundingClientRect();
      return bounds ? {
        top: bounds.top,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height
      } : null;
    };

    return {
      card: rect(card),
      ranking: rect(ranking),
      delta: rect(delta),
      meters: panel.querySelectorAll(":scope > .elf-rank-list .elf-rank-meter").length
    };
  });

  const wishlist = await readLayout();
  expect(wishlist.meters).toBe(10);
  expect(Math.abs(wishlist.ranking.top - wishlist.card.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(wishlist.ranking.bottom - wishlist.card.bottom)).toBeLessThanOrEqual(1);

  await page.locator(".elf-home-tabs-desktop [data-skin-home-tab='supply']").click();
  await expect(page.locator(".elf-tab-panel-supply")).toBeVisible();

  const supply = await readLayout();
  expect(supply.meters).toBe(10);
  expect(supply.card.width).toBeCloseTo(wishlist.card.width, 0);
  expect(supply.card.height).toBeCloseTo(wishlist.card.height, 0);
  expect(Math.abs(supply.ranking.top - supply.card.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(supply.ranking.bottom - supply.card.bottom)).toBeLessThanOrEqual(1);
  expect(Math.abs(supply.delta.top - supply.card.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(supply.delta.bottom - supply.card.bottom)).toBeLessThanOrEqual(1);
});
