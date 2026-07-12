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
