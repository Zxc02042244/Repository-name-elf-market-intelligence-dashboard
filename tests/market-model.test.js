import assert from "node:assert/strict";
import test from "node:test";

import { buildMarketModel } from "../src/core/data/market-model.js";
import {
  inspectTransactionList,
  isValidMarketTransaction
} from "../src/core/data/normalize-contract.js";

function createTransaction(overrides = {}) {
  return {
    id: "tx-1",
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

test("accepts the generic market transaction contract", () => {
  assert.equal(isValidMarketTransaction(createTransaction()), true);
});

test("reports rejected and duplicate normalized transactions", () => {
  const valid = createTransaction();
  const duplicate = structuredClone(valid);
  const invalid = { ...valid, actors: { ...valid.actors, buyer: { id: "", name: "Buyer" } } };
  const inspected = inspectTransactionList([valid, duplicate, invalid]);

  assert.deepEqual(inspected.quality, {
    receivedCount: 3,
    acceptedCount: 1,
    rejectedCount: 1,
    duplicateCount: 1
  });
  assert.deepEqual(inspected.transactions, [valid]);
});

test("builds totals from accepted unique transactions only", () => {
  const first = createTransaction();
  const second = createTransaction({
    id: "tx-2",
    time: 1_700_000_100_000,
    value: { total: 4, unit: 2, currency: "SIGIL" }
  });
  const model = buildMarketModel([first, structuredClone(first), second], {
    source: "test",
    generatedAt: 456
  });

  assert.equal(model.totals.totalTransactions, 2);
  assert.equal(model.totals.totalVolume, 10);
  assert.equal(model.meta.source, "test");
  assert.equal(model.meta.generatedAt, 456);
  assert.deepEqual(model.meta.dataQuality, {
    receivedCount: 3,
    acceptedCount: 2,
    rejectedCount: 0,
    duplicateCount: 1
  });
  assert.equal(model.indicators.averageTransactionValue, 5);
  assert.equal(model.indicators.transactionsPerAsset, 2);
  assert.equal(model.indicators.topAssetShare, 1);
  assert.equal(model.indicators.liquidityDensity, 1);
});
