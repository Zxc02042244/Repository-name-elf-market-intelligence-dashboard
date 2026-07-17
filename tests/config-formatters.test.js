import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../src/config/locale-config.js";
import { hasCommunityServiceConfig, readPublicServiceConfig } from "../src/config/service-config.js";
import {
  HOME_TABS,
  MARKET_DISPLAY_LIMITS,
  PRODUCT_RULES,
  STORAGE_KEYS,
  isSupportedHomeTab,
  isSupportedMarketSort
} from "../src/config/product-config.js";
import { formatNumber, formatValue } from "../src/core/utils/numbers.js";
import { formatTime } from "../src/core/utils/time.js";

test("product rules expose one immutable configuration source", () => {
  assert.equal(PRODUCT_RULES.wishlistLimit, 3);
  assert.equal(PRODUCT_RULES.rankingLimit, 10);
  assert.equal(PRODUCT_RULES.mobileChampionLimit, 10);
  assert.equal(MARKET_DISPLAY_LIMITS.assetSummaries, 3);
  assert.deepEqual(HOME_TABS, ["wishlist", "supply", "gallery"]);
  assert.equal(STORAGE_KEYS.skinVisitorPending, "elfSkinGallery.visitorPending.v1");
  assert.equal(Object.isFrozen(PRODUCT_RULES), true);
  assert.equal(isSupportedHomeTab("supply"), true);
  assert.equal(isSupportedHomeTab("unknown"), false);
  assert.equal(isSupportedMarketSort("latest"), true);
  assert.equal(isSupportedMarketSort("unknown"), false);
});

test("locale configuration matches the document language contract", () => {
  assert.equal(DEFAULT_LOCALE, "zh-Hant");
  assert.equal(SUPPORTED_LOCALES.includes(DEFAULT_LOCALE), true);
});

test("public service settings are normalized through one runtime contract", () => {
  const config = readPublicServiceConfig({
    supabaseUrl: "https://example.supabase.co/",
    supabasePublishableKey: " publishable-key ",
    skinApiUrl: "https://example.test/skins/",
    fallbackSkinImageBaseUrl: "https://example.test/images/"
  });

  assert.equal(config.supabaseUrl, "https://example.supabase.co");
  assert.equal(config.skinApiUrl, "https://example.test/skins");
  assert.equal(hasCommunityServiceConfig(config), true);
  assert.equal(hasCommunityServiceConfig(readPublicServiceConfig({})), false);
});

test("number, value, and time formatters honor the requested locale", () => {
  const englishNumber = formatNumber(1234.5, { locale: "en" });
  const vietnameseNumber = formatNumber(1234.5, { locale: "vi" });
  const timestamp = Date.UTC(2026, 6, 13, 4, 30);

  assert.notEqual(englishNumber, vietnameseNumber);
  assert.equal(formatValue(1234.5, "SIGIL", { locale: "vi" }), `${vietnameseNumber} SIGIL`);
  assert.notEqual(
    formatTime(timestamp, { locale: "en", emptyText: "None" }),
    formatTime(timestamp, { locale: "zh-Hant", emptyText: "無" })
  );
  assert.equal(formatTime(null, { locale: "zh-Hant", emptyText: "沒有資料" }), "沒有資料");
});
