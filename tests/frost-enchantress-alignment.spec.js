import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("Frost Enchantress rank text is optically aligned in its plaque", async ({ page }, testInfo) => {
  await page.goto("/?v=playwright-frost-alignment#home", {
    waitUntil: "domcontentloaded"
  });
  await page.waitForTimeout(1_200);

  const frostButton = page.getByRole("button", { name: /Frost Enchantress/ });
  await expect(frostButton).toHaveCount(1);
  await frostButton.click();

  const card = page.locator(".elf-champion-frame-frost-enchantress");
  const rank = card.locator(".elf-champion-rank");
  await expect(card).toHaveClass(/elf-champion-layered-frame/);
  await expect(rank).toContainText("TOP");

  const alignment = await card.evaluate((cardElement) => {
    const element = cardElement.querySelector(".elf-champion-rank");
    const cardRect = cardElement.getBoundingClientRect();
    const plaque = element.getBoundingClientRect();
    const textRange = document.createRange();
    textRange.selectNodeContents(element);
    const text = textRange.getBoundingClientRect();
    const expectedTextVerticalOffset =
      Number.parseFloat(getComputedStyle(element).paddingTop) / 2;

    return {
      plaqueHorizontalOffset:
        plaque.x + plaque.width / 2 - (cardRect.x + cardRect.width / 2),
      textHorizontalOffset:
        text.x + text.width / 2 - (plaque.x + plaque.width / 2),
      textVerticalOffset:
        text.y + text.height / 2 - (plaque.y + plaque.height / 2),
      expectedTextVerticalOffset,
      horizontalOverflow: element.scrollWidth > element.clientWidth,
      verticalOverflow: element.scrollHeight > element.clientHeight
    };
  });

  expect(Math.abs(alignment.plaqueHorizontalOffset)).toBeLessThanOrEqual(1);
  expect(Math.abs(alignment.textHorizontalOffset)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(alignment.textVerticalOffset - alignment.expectedTextVerticalOffset)
  ).toBeLessThanOrEqual(1);
  expect(alignment.horizontalOverflow).toBe(false);
  expect(alignment.verticalOverflow).toBe(false);

  await card.screenshot({
    path: testInfo.outputPath("frost-enchantress-card.png"),
    animations: "disabled"
  });
});
