import assert from "node:assert/strict";
import test from "node:test";

import { buildMarketModel } from "../src/core/data/market-model.js";
import {
  createReservedMarketDataSource,
  defineMarketDataSource,
  isMarketDataSourceReady
} from "../src/features/market/data/market-data-source.js";
import {
  createMarketFeatureState,
  renderMarketFeatureView
} from "../src/features/market/market-feature.js";
import {
  getActiveMarketModules,
  renderActiveMarketModules
} from "../src/features/market/market-module-runtime.js";
import { MARKET_MODULES, getMarketModule } from "../src/features/market/market-modules.js";
import { buildMarketAssets } from "../src/features/market/modules/assets/assets-model.js";
import { renderMarketAssetsView } from "../src/features/market/modules/assets/assets-view.js";
import { buildMarketActors } from "../src/features/market/modules/actors/actors-model.js";
import { renderMarketActorsView } from "../src/features/market/modules/actors/actors-view.js";
import { buildMarketIndicatorsModule } from "../src/features/market/modules/indicators/indicators-model.js";
import { renderMarketIndicatorsView } from "../src/features/market/modules/indicators/indicators-view.js";
import { buildMarketOverview } from "../src/features/market/modules/overview/overview-model.js";
import { renderMarketOverviewView } from "../src/features/market/modules/overview/overview-view.js";

function createTransaction(overrides = {}) {
  return {
    id: "overview-tx-1",
    time: 1_700_000_000_000,
    source: { name: "test" },
    asset: { id: "asset-1", name: "Test Asset", category: "Test" },
    quantity: 2,
    value: { total: 6, unit: 3, currency: "SIGIL" },
    actors: {
      seller: { id: "seller-1", name: "Seller" },
      buyer: { id: "buyer-1", name: "Buyer" }
    },
    ...overrides
  };
}

function createReadyDataSource() {
  return defineMarketDataSource({
    id: "verified-test-source",
    capabilities: ["transactions"],
    load: async () => ({ transactions: [] })
  });
}

test("market modules have stable unique ids and declared requirements", () => {
  const moduleIds = MARKET_MODULES.map((moduleDefinition) => moduleDefinition.id);

  assert.equal(new Set(moduleIds).size, moduleIds.length);
  assert.deepEqual(moduleIds, ["overview", "assets", "actors", "indicators"]);
  assert.equal(getMarketModule("assets")?.labelKey, "coverage.assetCoverage");
  assert.equal(getMarketModule("missing"), null);
  assert.equal(getMarketModule("overview")?.status, "building");
  assert.equal(getMarketModule("assets")?.status, "building");
  assert.equal(getMarketModule("actors")?.status, "building");
  assert.equal(getMarketModule("indicators")?.status, "building");
  assert.equal(MARKET_MODULES.every((moduleDefinition) => (
    moduleDefinition.status === "building" && moduleDefinition.requiredCapabilities.length > 0
  )), true);
});

test("market runtime renders only modules with an attached implementation", () => {
  assert.deepEqual(
    getActiveMarketModules().map((moduleDefinition) => moduleDefinition.id),
    ["overview", "assets", "actors", "indicators"]
  );

  const html = renderActiveMarketModules(createMarketFeatureState(), "zh-Hant");

  assert.match(html, /data-market-active-module="overview"/);
  assert.match(html, /data-market-active-module="assets"/);
  assert.match(html, /data-market-active-module="actors"/);
  assert.match(html, /data-market-active-module="indicators"/);
});

test("reserved market source cannot accidentally perform a request", () => {
  const dataSource = createReservedMarketDataSource();

  assert.equal(dataSource.kind, "reserved");
  assert.equal(dataSource.load, null);
  assert.equal(isMarketDataSourceReady(dataSource), false);
});

test("future adapters must implement the market source contract", () => {
  assert.throws(
    () => defineMarketDataSource({ id: "invalid" }),
    /requires a load function/
  );

  const adapter = defineMarketDataSource({
    id: "future-api",
    capabilities: ["transactions", "transactions"],
    load: async () => ({ transactions: [] })
  });

  assert.equal(isMarketDataSourceReady(adapter), true);
  assert.deepEqual(adapter.capabilities, ["transactions"]);
});

test("planned market view is module-driven and contains no fake metrics", () => {
  const html = renderMarketFeatureView(createMarketFeatureState(), "zh-Hant");

  assert.equal((html.match(/data-market-module=/g) ?? []).length, MARKET_MODULES.length);
  assert.match(html, /data-market-source-kind="reserved"/);
  assert.match(html, /市場總覽/);
  assert.match(html, /市場指標/);
  assert.match(html, /data-market-overview-status="planned"/);
  assert.equal((html.match(/data-market-overview-metric=/g) ?? []).length, 4);
  assert.equal((html.match(/>—</g) ?? []).length, 6);
  assert.doesNotMatch(html, /data-action="refresh"/);
  assert.doesNotMatch(html, /metric-card/);
});

test("overview distinguishes planned, empty, and ready data states", () => {
  const reservedState = buildMarketOverview(null, createReservedMarketDataSource());
  const dataSource = createReadyDataSource();
  const emptyModel = buildMarketModel([], { source: "test", generatedAt: 100 });
  const readyModel = buildMarketModel([createTransaction()], {
    source: "test",
    generatedAt: 1_700_000_100_000
  });

  assert.equal(reservedState.status, "planned");
  assert.equal(reservedState.metrics.totalTransactions, null);
  assert.equal(buildMarketOverview(emptyModel, dataSource).status, "empty");

  const readyState = buildMarketOverview(readyModel, dataSource);
  assert.equal(readyState.status, "ready");
  assert.equal(readyState.metrics.totalTransactions, 1);
  assert.equal(readyState.metrics.totalVolume, 6);
  assert.deepEqual(readyState.dataQuality, {
    receivedCount: 1,
    acceptedCount: 1,
    rejectedCount: 0,
    duplicateCount: 0
  });
});

test("ready overview renders verified values and quality metadata", () => {
  const model = buildMarketModel([createTransaction()], {
    source: "test",
    generatedAt: 1_700_000_100_000
  });
  const html = renderMarketOverviewView({
    dataSource: createReadyDataSource(),
    model
  }, "zh-Hant");

  assert.match(html, /data-market-overview-status="ready"/);
  assert.match(html, />1<\/strong>/);
  assert.match(html, /6 SIGIL/);
  assert.match(html, /採用 1\/1 筆交易/);
});

test("asset module distinguishes planned, empty, and ready data states", () => {
  const dataSource = createReadyDataSource();
  const emptyModel = buildMarketModel([], { source: "test", generatedAt: 100 });
  const readyModel = buildMarketModel([
    createTransaction(),
    createTransaction({
      id: "overview-tx-2",
      time: 1_700_000_010_000,
      asset: { id: "asset-2", name: "Second Asset", category: "Other" },
      quantity: 1,
      value: { total: 2, unit: 2, currency: "SIGIL" }
    })
  ], { source: "test", generatedAt: 1_700_000_100_000 });

  assert.equal(buildMarketAssets(null, createReservedMarketDataSource()).status, "planned");
  assert.equal(buildMarketAssets(emptyModel, dataSource).status, "empty");

  const readyState = buildMarketAssets(readyModel, dataSource);
  assert.equal(readyState.status, "ready");
  assert.equal(readyState.metrics.assetCount, 2);
  assert.equal(readyState.metrics.categoryCount, 2);
  assert.equal(readyState.metrics.leadingAssetName, "Test Asset");
  assert.equal(readyState.metrics.leadingVolumeShare, 0.75);
  assert.equal(readyState.assets.length, 2);
});

test("asset module renders guidance without fake values and verified data when ready", () => {
  const plannedHtml = renderMarketAssetsView(createMarketFeatureState(), "zh-Hant");

  assert.match(plannedHtml, /data-market-assets-status="planned"/);
  assert.match(plannedHtml, /API 位置預留期間不推測任何資產數值/);
  assert.doesNotMatch(plannedHtml, /market-assets-metrics/);

  const model = buildMarketModel([createTransaction()], {
    source: "test",
    generatedAt: 1_700_000_100_000
  });
  const readyHtml = renderMarketAssetsView({
    dataSource: createReadyDataSource(),
    model
  }, "zh-Hant");

  assert.match(readyHtml, /data-market-assets-status="ready"/);
  assert.match(readyHtml, /Test Asset/);
  assert.match(readyHtml, /100%/);
});

test("actor module distinguishes planned, empty, and ready data states", () => {
  const dataSource = createReadyDataSource();
  const emptyModel = buildMarketModel([], { source: "test", generatedAt: 100 });
  const readyModel = buildMarketModel([
    createTransaction(),
    createTransaction({
      id: "overview-tx-2",
      time: 1_700_000_010_000,
      actors: {
        seller: { id: "seller-1", name: "Seller" },
        buyer: { id: "buyer-2", name: "Second Buyer" }
      }
    })
  ], { source: "test", generatedAt: 1_700_000_100_000 });

  assert.equal(buildMarketActors(null, createReservedMarketDataSource()).status, "planned");
  assert.equal(buildMarketActors(emptyModel, dataSource).status, "empty");

  const readyState = buildMarketActors(readyModel, dataSource);
  assert.equal(readyState.status, "ready");
  assert.equal(readyState.metrics.actorCount, 3);
  assert.equal(readyState.metrics.sellerCount, 1);
  assert.equal(readyState.metrics.buyerCount, 2);
  assert.equal(readyState.metrics.activityLeaderName, "Seller");
  assert.equal(readyState.actors[0].transactionCount, 2);
});

test("actor module explains its identity boundary and renders only verified activity", () => {
  const plannedHtml = renderMarketActorsView(createMarketFeatureState(), "zh-Hant");

  assert.match(plannedHtml, /data-market-actors-status="planned"/);
  assert.match(plannedHtml, /不代表真實身份、帳戶所有權、彼此關係或交易意圖/);
  assert.doesNotMatch(plannedHtml, /market-actors-metrics/);

  const model = buildMarketModel([createTransaction()], {
    source: "test",
    generatedAt: 1_700_000_100_000
  });
  const readyHtml = renderMarketActorsView({
    dataSource: createReadyDataSource(),
    model
  }, "zh-Hant");

  assert.match(readyHtml, /data-market-actors-status="ready"/);
  assert.match(readyHtml, /Seller/);
  assert.match(readyHtml, /Buyer/);
  assert.match(readyHtml, /交易對手/);
});

test("indicator module keeps scores disabled until source and policy are ready", () => {
  const dataSource = createReadyDataSource();
  const emptyModel = buildMarketModel([], { source: "test", generatedAt: 100 });
  const readyModel = buildMarketModel([createTransaction()], {
    source: "test",
    generatedAt: 1_700_000_100_000
  });

  assert.equal(buildMarketIndicatorsModule(null, createReservedMarketDataSource()).status, "planned");
  assert.equal(buildMarketIndicatorsModule(emptyModel, dataSource).status, "empty");
  assert.equal(buildMarketIndicatorsModule(readyModel, dataSource).status, "policyPending");
});

test("indicator module documents TTS and MPS without rendering scores or accusations", () => {
  const html = renderMarketIndicatorsView(createMarketFeatureState(), "zh-Hant");

  assert.match(html, /data-market-indicators-status="planned"/);
  assert.match(html, /Market Pattern Score \/ Index/);
  assert.match(html, /Two-Step Transfer Confidence/);
  assert.match(html, /不代表作弊、違規/);
  assert.doesNotMatch(html, /data-market-indicator-score/);
  assert.doesNotMatch(html, /已確認操縱|洗交易判定|可疑玩家/);
});
