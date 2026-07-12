import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("Toy Sheriff three-piece frame stays aligned", async ({ page }, testInfo) => {
  const transparentPixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  await page.route("**/api/v1/elf/skins**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        serverTime: "2026-07-12T00:00:00Z",
        skins: [
          {
            skinName: "Toy Sheriff",
            skinUrl: transparentPixel,
            quantity: 999
          },
          { skinName: "Flame Runner", skinUrl: transparentPixel, quantity: 8 },
          { skinName: "Bubble Beast", skinUrl: transparentPixel, quantity: 7 },
          { skinName: "Starborn Warrior", skinUrl: transparentPixel, quantity: 6 },
          { skinName: "Flame Brawler", skinUrl: transparentPixel, quantity: 5 },
          { skinName: "Frost Enchantress", skinUrl: transparentPixel, quantity: 4 },
          { skinName: "Zombie Walker", skinUrl: transparentPixel, quantity: 3 },
          { skinName: "Alien Hunter", skinUrl: transparentPixel, quantity: 2 },
          { skinName: "Arcane Prince", skinUrl: transparentPixel, quantity: 1 },
          { skinName: "Cosmic Sovereign", skinUrl: transparentPixel, quantity: 1 }
        ]
      })
    });
  });

  await page.goto("/?v=playwright-toy-sheriff#home", {
    waitUntil: "domcontentloaded"
  });
  await page.waitForTimeout(1_200);

  const skinButton = page.getByRole("button", { name: /Toy Sheriff/ });
  await expect(skinButton).toHaveCount(1);
  await skinButton.click();

  const card = page.locator('[data-view="desktop"] .elf-champion-frame-toy-sheriff');
  const rank = card.locator(".elf-champion-rank");
  const name = card.locator(".elf-champion-body > strong");
  await expect(card).toHaveClass(/elf-champion-layered-frame/);

  await expectLegacyChampionLayersDisabled(card);

  const alignment = await card.evaluate((cardElement) => {
    const rankElement = cardElement.querySelector(".elf-champion-rank");
    const nameContainer = cardElement.querySelector(".elf-champion-body");
    const nameElement = cardElement.querySelector(".elf-champion-body > strong");
    const cardRect = cardElement.getBoundingClientRect();
    const plaqueRect = rankElement.getBoundingClientRect();
    const textRange = document.createRange();
    textRange.selectNodeContents(rankElement);
    const textRect = textRange.getBoundingClientRect();
    const nameContainerRect = nameContainer.getBoundingClientRect();
    const nameRect = nameElement.getBoundingClientRect();

    return {
      plaqueHorizontalOffset:
        plaqueRect.x + plaqueRect.width / 2 - (cardRect.x + cardRect.width / 2),
      textHorizontalOffset:
        textRect.x + textRect.width / 2 - (plaqueRect.x + plaqueRect.width / 2),
      textVerticalOffset:
        textRect.y + textRect.height / 2 - (plaqueRect.y + plaqueRect.height / 2),
      rankHorizontalOverflow: rankElement.scrollWidth > rankElement.clientWidth,
      rankVerticalOverflow: rankElement.scrollHeight > rankElement.clientHeight,
      nameHorizontalOverflow: nameElement.scrollWidth > nameElement.clientWidth,
      nameOutsideContainer:
        nameRect.top < nameContainerRect.top - 1 ||
        nameRect.bottom > nameContainerRect.bottom + 1
    };
  });

  expect(Math.abs(alignment.plaqueHorizontalOffset)).toBeLessThanOrEqual(1);
  expect(Math.abs(alignment.textHorizontalOffset)).toBeLessThanOrEqual(1);
  expect(Math.abs(alignment.textVerticalOffset)).toBeLessThanOrEqual(1);
  expect(alignment.rankHorizontalOverflow).toBe(false);
  expect(alignment.rankVerticalOverflow).toBe(false);
  expect(alignment.nameHorizontalOverflow).toBe(false);
  expect(alignment.nameOutsideContainer).toBe(false);
  await expect(name).toHaveCSS("white-space", "nowrap");

  await card.screenshot({
    path: testInfo.outputPath("toy-sheriff-card.png"),
    animations: "disabled"
  });

  await page.locator("[data-skin-home-tab='gallery']").first().click();
  await page.locator(".elf-skin-card", { hasText: "Toy Sheriff" }).locator("[data-wishlist-toggle]").click();
  await page.locator("[data-skin-home-tab='wishlist']").first().click();

  const wishlistCard = page.locator('[data-view="desktop"] .elf-champion-wishlist.elf-champion-frame-toy-sheriff');
  await expect(wishlistCard).toHaveCount(1);
  await expectLegacyChampionLayersDisabled(wishlistCard);
});

async function expectLegacyChampionLayersDisabled(card) {
  await expect.poll(async () => card.locator(".elf-champion-art").evaluate((element) => {
    const before = window.getComputedStyle(element, "::before");
    const after = window.getComputedStyle(element, "::after");
    const style = window.getComputedStyle(element);

    return {
      backgroundImage: style.backgroundImage,
      borderTopWidth: style.borderTopWidth,
      beforeDisplay: before.display,
      afterDisplay: after.display
    };
  })).toEqual({
    backgroundImage: "none",
    borderTopWidth: "0px",
    beforeDisplay: "none",
    afterDisplay: "none"
  });
}
