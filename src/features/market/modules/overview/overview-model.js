import { isMarketDataSourceReady } from "../../data/market-data-source.js";

const EMPTY_METRICS = Object.freeze({
  activeBuyers: null,
  activeSellers: null,
  totalTransactions: null,
  totalVolume: null
});

export function buildMarketOverview(model, dataSource) {
  if (!isMarketDataSourceReady(dataSource)) {
    return createOverviewState("planned");
  }

  const totalTransactions = model?.totals?.totalTransactions;

  if (!Number.isFinite(totalTransactions) || totalTransactions <= 0) {
    return createOverviewState("empty");
  }

  return {
    status: "ready",
    currency: model.transactions?.[0]?.value?.currency ?? "",
    metrics: {
      totalTransactions,
      totalVolume: finiteOrNull(model.totals.totalVolume),
      activeBuyers: finiteOrNull(model.totals.activeBuyers),
      activeSellers: finiteOrNull(model.totals.activeSellers)
    },
    updatedAt: finiteOrNull(model.meta?.generatedAt),
    dataQuality: normalizeDataQuality(model.meta?.dataQuality)
  };
}

function createOverviewState(status) {
  return {
    status,
    currency: "",
    metrics: EMPTY_METRICS,
    updatedAt: null,
    dataQuality: null
  };
}

function normalizeDataQuality(dataQuality) {
  if (!dataQuality || typeof dataQuality !== "object") {
    return null;
  }

  return {
    receivedCount: finiteOrNull(dataQuality.receivedCount),
    acceptedCount: finiteOrNull(dataQuality.acceptedCount),
    rejectedCount: finiteOrNull(dataQuality.rejectedCount),
    duplicateCount: finiteOrNull(dataQuality.duplicateCount)
  };
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}
