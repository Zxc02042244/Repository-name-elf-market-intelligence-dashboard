import { isMarketDataSourceReady } from "../../data/market-data-source.js";

export const MARKET_INDICATOR_CATALOG = Object.freeze([
  Object.freeze({
    id: "market-pattern-index",
    nameKey: "dashboard.indicatorModuleDetail.mpsName",
    detailKey: "dashboard.indicatorModuleDetail.mpsDetail",
    status: "documented"
  }),
  Object.freeze({
    id: "two-step-transfer",
    nameKey: "dashboard.indicatorModuleDetail.ttsName",
    detailKey: "dashboard.indicatorModuleDetail.ttsDetail",
    status: "documented"
  })
]);

export function buildMarketIndicatorsModule(model, dataSource) {
  if (!isMarketDataSourceReady(dataSource)) {
    return createIndicatorState("planned");
  }

  if (!Number.isFinite(model?.totals?.totalTransactions) || model.totals.totalTransactions <= 0) {
    return createIndicatorState("empty");
  }

  return createIndicatorState("policyPending");
}

function createIndicatorState(status) {
  return {
    status,
    indicators: MARKET_INDICATOR_CATALOG
  };
}
