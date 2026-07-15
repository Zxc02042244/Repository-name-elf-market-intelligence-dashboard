import assert from "node:assert/strict";
import test from "node:test";

import { buildMarketModel } from "../src/core/data/market-model.js";
import {
  createMarketDataSourceState,
  createReservedMarketDataSource,
  defineMarketDataSource,
  hasMarketDataSourceCapabilities,
  isMarketDataSourceReady
} from "../src/features/market/data/market-data-source.js";
import {
  createMarketFeature,
  createMarketFeatureState,
  renderMarketFeatureView
} from "../src/features/market/market-feature.js";
import {
  createMarketLifecycleState,
  MARKET_ERROR_KIND
} from "../src/features/market/market-lifecycle.js";
import { createMarketLoadController } from "../src/features/market/market-load-controller.js";
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

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createGenerationDataSource(requests) {
  return defineMarketDataSource({
    id: "generation-test-source",
    capabilities: ["transactions"],
    load: ({ generation }) => {
      const request = createDeferred();
      requests.set(generation, request);
      return request.promise;
    }
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
  assert.equal(hasMarketDataSourceCapabilities(adapter), true);
  assert.equal(hasMarketDataSourceCapabilities({ capabilities: [] }), false);

  const publicState = createMarketDataSourceState({
    ...adapter,
    endpoint: "https://private.example",
    token: "secret"
  });
  assert.deepEqual(Object.keys(publicState), ["id", "kind", "capabilities", "available"]);
  assert.equal(publicState.available, true);

  const namespacedAdapter = defineMarketDataSource({
    id: "市場:elf/source",
    kind: "供應者:adapter/正式",
    capabilities: ["transactions", "市場:read/交易"],
    load: async () => ({ transactions: [] })
  });
  const namespacedState = createMarketDataSourceState(namespacedAdapter);
  assert.equal(namespacedState.id, "市場:elf/source");
  assert.equal(namespacedState.kind, "供應者:adapter/正式");
  assert.deepEqual(namespacedState.capabilities, ["transactions", "市場:read/交易"]);
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

test("reserved source remains planned and never calls load", async () => {
  let loadCount = 0;
  const controller = createMarketLoadController({
    dataSource: {
      id: "reserved-test-source",
      kind: "reserved",
      capabilities: [],
      load: async () => {
        loadCount += 1;
        return { transactions: [] };
      }
    }
  });

  const state = await controller.load();

  assert.equal(loadCount, 0);
  assert.equal(state.status, "planned");
  assert.equal(state.activeGeneration, 0);
  assert.equal(state.model, null);
  assert.equal(state.safeError, null);
});

test("latest request enters loading and classifies empty and ready results", async () => {
  const pending = createDeferred();
  const dataSource = defineMarketDataSource({
    id: "classification-source",
    capabilities: ["transactions"],
    load: () => pending.promise
  });
  const controller = createMarketLoadController({ dataSource }, { now: () => 123 });

  const loadPromise = controller.load();
  assert.equal(controller.getState().status, "loading");
  assert.equal(controller.getState().activeGeneration, 1);

  pending.resolve({ transactions: [{ id: "invalid-row" }] });
  const emptyState = await loadPromise;
  assert.equal(emptyState.status, "empty");
  assert.equal(emptyState.model.totals.totalTransactions, 0);
  assert.deepEqual(emptyState.model.meta.dataQuality, {
    receivedCount: 1,
    acceptedCount: 0,
    rejectedCount: 1,
    duplicateCount: 0
  });

  const readyController = createMarketFeature({
    dataSource: defineMarketDataSource({
      id: "ready-source",
      capabilities: ["transactions"],
      load: async () => ({ transactions: [createTransaction()] })
    })
  });
  const readyState = await readyController.load();
  assert.equal(readyState.status, "ready");
  assert.equal(readyState.model.totals.totalTransactions, 1);
  assert.equal(readyState.safeError, null);
  assert.notEqual(readyState.status, "policyPending");
  assert.equal(
    buildMarketIndicatorsModule(readyState.model, readyState.dataSource).status,
    "policyPending"
  );

  readyState.status = "policyPending";
  readyState.activeGeneration = 999;
  assert.equal(readyController.getState().status, "ready");
  assert.equal(readyController.getState().activeGeneration, 1);
});

test("invalid capabilities, payloads, normalization, and model failures are unavailable", async () => {
  const missingCapability = createMarketLoadController({
    dataSource: defineMarketDataSource({
      id: "missing-capability",
      capabilities: [],
      load: async () => ({ transactions: [] })
    })
  });
  assert.equal((await missingCapability.load()).safeError.kind, MARKET_ERROR_KIND.capabilityMissing);

  const invalidPayload = createMarketLoadController({
    dataSource: defineMarketDataSource({
      id: "invalid-payload",
      capabilities: ["transactions"],
      load: async () => ({ rows: [] })
    })
  });
  assert.equal((await invalidPayload.load()).safeError.kind, MARKET_ERROR_KIND.invalidResponse);

  const normalizationFailure = createMarketLoadController(
    { dataSource: createReadyDataSource() },
    { inspectTransactionList: () => { throw new Error("normalization failed"); } }
  );
  assert.equal(
    (await normalizationFailure.load()).safeError.kind,
    MARKET_ERROR_KIND.normalizationFailed
  );

  const modelFailure = createMarketLoadController(
    { dataSource: createReadyDataSource() },
    { buildMarketModel: () => { throw new Error("model failed"); } }
  );
  assert.equal((await modelFailure.load()).safeError.kind, MARKET_ERROR_KIND.modelBuildFailed);
});

test("public availability cannot replace the executable load capability", async () => {
  const dataSource = {
    id: "descriptor-without-load",
    kind: "adapter",
    available: true,
    capabilities: ["transactions"]
  };
  const controller = createMarketLoadController({
    dataSource
  });

  const state = await controller.load();

  assert.equal(isMarketDataSourceReady(dataSource), false);
  assert.equal(state.status, "unavailable");
  assert.equal(state.activeGeneration, 1);
  assert.equal(state.safeError.kind, MARKET_ERROR_KIND.capabilityMissing);
  assert.notEqual(state.safeError.kind, MARKET_ERROR_KIND.requestFailed);
});

test("invalid source configuration is rejected without lossy public fallbacks", async () => {
  assert.throws(
    () => defineMarketDataSource({ id: "", capabilities: [], load: async () => ({}) }),
    /stable id/
  );
  assert.throws(
    () => defineMarketDataSource({ id: "source", kind: 7, capabilities: [], load: async () => ({}) }),
    /valid kind/
  );
  assert.throws(
    () => defineMarketDataSource({ id: "source", kind: null, capabilities: [], load: async () => ({}) }),
    /valid kind/
  );
  assert.throws(
    () => defineMarketDataSource({ id: "source", capabilities: [""], load: async () => ({}) }),
    /capabilities must be non-empty strings/
  );

  let loadCount = 0;
  const invalidSources = [
    { id: "", kind: "adapter", capabilities: ["transactions"] },
    { id: 42, kind: "adapter", capabilities: ["transactions"] }
  ];

  for (const invalidSource of invalidSources) {
    const controller = createMarketLoadController({
      dataSource: {
        ...invalidSource,
        load: async () => {
          loadCount += 1;
          return { transactions: [] };
        }
      }
    });
    const state = await controller.load();

    assert.equal(state.status, "unavailable");
    assert.equal(state.safeError.kind, MARKET_ERROR_KIND.coreFailed);
    assert.equal(state.dataSource, null);
    assert.doesNotMatch(JSON.stringify(state), /"id":"unknown"|"kind":"adapter"/);
  }

  assert.equal(loadCount, 0);
});

test("unexpected source inspection errors stay inside the safe Core boundary", async () => {
  let loadCount = 0;
  const sensitiveErrorText = "endpoint=https://private.example token=secret-token";
  const controller = createMarketLoadController({
    dataSource: {
      get id() {
        throw new Error(sensitiveErrorText);
      },
      kind: "adapter",
      capabilities: ["transactions"],
      load: async () => {
        loadCount += 1;
        return { transactions: [] };
      }
    }
  });

  const state = await controller.load();
  const serializedState = JSON.stringify(state);

  assert.equal(loadCount, 0);
  assert.equal(state.status, "unavailable");
  assert.equal(state.safeError.kind, MARKET_ERROR_KIND.coreFailed);
  assert.equal(state.dataSource, null);
  assert.doesNotMatch(
    serializedState,
    /private\.example|secret-token|endpoint|token|stack|headers|cookies/i
  );
});

test("request failures expose only a stable safe error and sanitized source state", async () => {
  const rawError = new Error("token=secret-token endpoint=https://private.example");
  rawError.headers = { authorization: "Bearer secret-token" };
  rawError.response = { body: "private raw response" };
  const controller = createMarketLoadController({
    dataSource: {
      id: "safe-error-source",
      kind: "adapter",
      capabilities: ["transactions"],
      endpoint: "https://private.example",
      token: "secret-token",
      headers: rawError.headers,
      cookies: "session=private",
      load: async () => { throw rawError; }
    }
  });

  const state = await controller.load();
  const serializedState = JSON.stringify(state);

  assert.equal(state.status, "unavailable");
  assert.deepEqual(state.safeError, {
    kind: MARKET_ERROR_KIND.requestFailed,
    message: "Market data could not be loaded."
  });
  assert.deepEqual(Object.keys(state.dataSource), ["id", "kind", "capabilities", "available"]);
  assert.doesNotMatch(
    serializedState,
    /secret-token|private\.example|authorization|headers|cookies|raw response|stack/i
  );
  assert.notEqual(state.safeError, rawError);
});

test("a stale success cannot replace the latest successful generation", async () => {
  const requests = new Map();
  const controller = createMarketLoadController({
    dataSource: createGenerationDataSource(requests)
  });
  const requestA = controller.load();
  const requestB = controller.load();

  requests.get(2).resolve({
    transactions: [createTransaction({ id: "tx-b" })]
  });
  const stateB = await requestB;
  requests.get(1).resolve({
    transactions: [createTransaction({ id: "tx-a" })]
  });
  await requestA;

  const finalState = controller.getState();
  assert.equal(finalState.status, "ready");
  assert.equal(finalState.activeGeneration, 2);
  assert.equal(finalState.model, stateB.model);
  assert.equal(finalState.model.transactions[0].id, "tx-b");
  assert.equal(finalState.safeError, null);
});

test("a stale success cannot replace the latest generation failure", async () => {
  const requests = new Map();
  const controller = createMarketLoadController({
    dataSource: createGenerationDataSource(requests)
  });
  const requestA = controller.load();
  const requestB = controller.load();

  requests.get(2).reject(new Error("B failed"));
  const stateB = await requestB;
  requests.get(1).resolve({ transactions: [createTransaction({ id: "tx-a" })] });
  await requestA;

  assert.deepEqual(controller.getState(), stateB);
  assert.equal(stateB.status, "unavailable");
  assert.equal(stateB.activeGeneration, 2);
  assert.equal(stateB.model, null);
  assert.equal(stateB.safeError.kind, MARKET_ERROR_KIND.requestFailed);
});

test("a stale failure cannot replace the latest generation success", async () => {
  const requests = new Map();
  const controller = createMarketLoadController({
    dataSource: createGenerationDataSource(requests)
  });
  const requestA = controller.load();
  const requestB = controller.load();

  requests.get(2).resolve({ transactions: [] });
  const stateB = await requestB;
  requests.get(1).reject(new Error("A failed"));
  await requestA;

  const finalState = controller.getState();
  assert.deepEqual(finalState, stateB);
  assert.equal(finalState.status, "empty");
  assert.equal(finalState.activeGeneration, 2);
  assert.equal(finalState.model, stateB.model);
  assert.equal(finalState.safeError, null);
});

test("module derivation treats an unfrozen MarketModel and core state as read-only", () => {
  const model = buildMarketModel([
    createTransaction(),
    createTransaction({
      id: "readonly-tx-2",
      asset: { id: "asset-2", name: "Second Asset", category: "Other" },
      actors: {
        seller: { id: "seller-2", name: "Second Seller" },
        buyer: { id: "buyer-1", name: "Buyer" }
      }
    })
  ], { source: "readonly-test", generatedAt: 321 });
  const dataSource = createReadyDataSource();
  const featureState = createMarketLifecycleState({
    dataSource: createMarketDataSourceState(dataSource),
    status: "ready",
    model,
    activeGeneration: 7
  });
  const beforeModel = structuredClone(model);
  const beforeLifecycle = {
    status: featureState.status,
    activeGeneration: featureState.activeGeneration,
    safeError: featureState.safeError
  };
  const builders = [
    buildMarketOverview,
    buildMarketAssets,
    buildMarketActors,
    buildMarketIndicatorsModule
  ];

  for (const buildModule of builders) {
    const firstResult = buildModule(model, dataSource);
    const secondResult = buildModule(model, dataSource);
    assert.deepEqual(secondResult, firstResult);
    assert.deepEqual(model, beforeModel);
  }

  assert.deepEqual(model, beforeModel);
  assert.deepEqual({
    status: featureState.status,
    activeGeneration: featureState.activeGeneration,
    safeError: featureState.safeError
  }, beforeLifecycle);
});

test("policyPending is rejected as a top-level Market lifecycle", () => {
  assert.throws(
    () => createMarketLifecycleState({ status: "policyPending" }),
    /lifecycle state is invalid/
  );
});
