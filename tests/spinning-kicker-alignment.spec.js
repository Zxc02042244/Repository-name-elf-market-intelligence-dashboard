import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("Spinning Kicker three-piece frame stays aligned", async ({ page }, testInfo) => {
  await page.goto("/?v=playwright-spinning-kicker#home", {
    waitUntil: "domcontentloaded"
  });
  await page.waitForTimeout(1_200);

  const skinButton = page.getByRole("button", { name: /Spinning Kicker/ });
  await expect(skinButton).toHaveCount(1);
  await skinButton.click();

  const card = page.locator('[data-view="desktop"] .elf-champion-frame-spinning-kicker');
  const rank = card.locator(".elf-champion-rank");
  const name = card.locator(".elf-champion-body > strong");
  await expect(card).toHaveClass(/elf-champion-layered-frame/);

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
    path: testInfo.outputPath("spinning-kicker-card.png"),
    animations: "disabled"
  });
});
