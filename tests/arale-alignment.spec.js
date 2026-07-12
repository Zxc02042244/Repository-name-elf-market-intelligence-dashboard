import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("Arale three-piece frame stays aligned", async ({ page }) => {
  const transparentPixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  await page.route("**/api/v1/elf/skins**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        skins: [
          { skinName: "Arale", skinUrl: transparentPixel, quantity: 999 },
          { skinName: "Flame Runner", skinUrl: transparentPixel, quantity: 8 }
        ]
      })
    });
  });

  await page.goto("/?v=playwright-arale#home", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1_200);
  await page.locator("[data-skin-home-tab='supply']").first().click();

  const card = page.locator(".elf-champion-frame-arale");
  const rank = card.locator(".elf-champion-rank");
  const name = card.locator(".elf-champion-body > strong");
  await expect(card).toHaveClass(/elf-champion-layered-frame/);

  const alignment = await card.evaluate((cardElement) => {
    const cardRect = cardElement.getBoundingClientRect();
    const rankRect = cardElement.querySelector(".elf-champion-rank").getBoundingClientRect();
    const nameContainerRect = cardElement.querySelector(".elf-champion-body").getBoundingClientRect();
    const nameRect = cardElement.querySelector(".elf-champion-body > strong").getBoundingClientRect();

    return {
      rankCenterOffset: rankRect.x + rankRect.width / 2 - (cardRect.x + cardRect.width / 2),
      rankBackground: window.getComputedStyle(cardElement.querySelector(".elf-champion-rank")).backgroundImage,
      nameBackground: window.getComputedStyle(cardElement.querySelector(".elf-champion-body")).backgroundImage,
      nameOutsideContainer: nameRect.top < nameContainerRect.top - 1 || nameRect.bottom > nameContainerRect.bottom + 1
    };
  });

  expect(Math.abs(alignment.rankCenterOffset)).toBeLessThanOrEqual(1);
  expect(alignment.rankBackground).toContain("arale-rank-plaque-v1.png");
  expect(alignment.nameBackground).toContain("arale-name-plaque-v1.png");
  expect(alignment.nameOutsideContainer).toBe(false);
  await expect(rank).toHaveText("TOP 1");
  await expect(name).toHaveText("Arale");
});
