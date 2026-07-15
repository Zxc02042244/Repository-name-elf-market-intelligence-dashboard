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

  const rows = page.locator(".elf-tab-panel-supply .elf-rank-list-desktop .elf-rank-row-selectable");
  await expect(rows).toHaveCount(30);
  await rows.nth(1).locator("button[data-skin-preview]").click();

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

test("ranking preview and wishlist controls keep independent keyboard semantics", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-ranking-keyboard-contract#home", {
    waitUntil: "domcontentloaded"
  });

  const skinId = "pioneer-spark";
  const row = page.locator(`.elf-tab-panel-wishlist .elf-rank-list-desktop .elf-rank-row-selectable:has(> button[data-skin-preview='${skinId}'])`);
  const previewButton = row.locator(`:scope > button[data-skin-preview='${skinId}']`);
  const wishlistButton = row.locator(`:scope > button[data-wishlist-toggle='${skinId}']`);

  await expect(previewButton).toHaveCount(1);
  await expect(wishlistButton).toHaveCount(1);
  await expect(row).not.toHaveAttribute("role", "button");
  await expect(row).not.toHaveAttribute("tabindex", "0");
  await expect(row.locator("button button")).toHaveCount(0);
  await expect(previewButton.locator("img")).toHaveAttribute("alt", "");

  await previewButton.focus();
  await expect(previewButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(previewButton).toHaveAttribute("aria-pressed", "true");
  await expect(previewButton).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(wishlistButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(wishlistButton).toHaveAttribute("aria-pressed", "true");
  await expect(wishlistButton).toBeFocused();

  await page.keyboard.press("Space");
  await expect(wishlistButton).toHaveAttribute("aria-pressed", "false");
  await wishlistButton.click();
  await expect(wishlistButton).toHaveAttribute("aria-pressed", "true");
});

test("mobile ranking preview remains independently clickable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-ranking-mobile-preview-contract#home", {
    waitUntil: "domcontentloaded"
  });

  const row = page.locator(".elf-rank-list-mobile .elf-rank-row-selectable").nth(1);
  const previewButton = row.locator(":scope > button[data-skin-preview]");
  const wishlistButton = row.locator(":scope > button[data-wishlist-toggle]");

  await expect(previewButton).toBeVisible();
  await expect(wishlistButton).toBeHidden();
  await expect(previewButton).toHaveAttribute("aria-pressed", "false");
  await previewButton.click();
  await expect(previewButton).toHaveAttribute("aria-pressed", "true");
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
  await expect(page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop .elf-rank-meter")).toHaveCount(30);
  await expect(page.locator('[data-skin-champion-view="desktop"] .elf-champion-card')).toBeVisible();

  const readLayout = () => page.locator(".elf-tab-panel:visible").evaluate((panel) => {
    const card = panel.querySelector('[data-skin-champion-view="desktop"] .elf-champion-card');
    const ranking = panel.querySelector(":scope > .elf-rank-list-desktop");
    const pagination = panel.querySelector(":scope > .elf-ranking-pagination");
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
      pagination: rect(pagination),
      delta: rect(delta),
      meters: panel.querySelectorAll(":scope > .elf-rank-list-desktop .elf-rank-meter").length
    };
  });

  const wishlist = await readLayout();
  expect(wishlist.meters).toBe(30);
  expect(Math.abs(wishlist.ranking.top - wishlist.card.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(wishlist.pagination.bottom - wishlist.card.bottom)).toBeLessThanOrEqual(1);

  await page.locator(".elf-home-tabs-desktop [data-skin-home-tab='supply']").click();
  await expect(page.locator(".elf-tab-panel-supply")).toBeVisible();

  const supply = await readLayout();
  expect(supply.meters).toBe(30);
  expect(supply.card.width).toBeCloseTo(wishlist.card.width, 0);
  expect(supply.card.height).toBeCloseTo(wishlist.card.height, 0);
  expect(Math.abs(supply.ranking.top - supply.card.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(supply.pagination.bottom - supply.card.bottom)).toBeLessThanOrEqual(1);
  expect(supply.delta.height).toBe(0);
});

test("desktop ranking paginates all 49 skins while mobile stays at top ten", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-ranking-pages#home", { waitUntil: "domcontentloaded" });

  const desktopRows = page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop .elf-rank-row");
  await expect(desktopRows).toHaveCount(30);
  await expect(page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop")).toHaveAttribute("data-ranking-columns", "3");

  await page.locator("[data-skin-ranking-page='1']").click();
  await expect(desktopRows).toHaveCount(19);
  await expect(page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop")).toHaveAttribute("data-ranking-columns", "2");
  await expect(desktopRows.nth(0).locator(".elf-rank-index")).toHaveText("31");
  await expect(desktopRows.nth(18).locator(".elf-rank-index")).toHaveText("49");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".elf-mobile-champion-carousel .elf-champion-card")).toHaveCount(10);
  await expect(page.locator(".elf-rank-list-mobile .elf-rank-row")).toHaveCount(10);
  await expect(page.locator(".elf-ranking-pagination")).toBeHidden();
});
