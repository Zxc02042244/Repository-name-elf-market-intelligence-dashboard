import { calculateTotals } from "../analytics/totals.js";
import { calculateAssetStats } from "../analytics/asset-stats.js";
import { calculateActorStats } from "../analytics/actor-stats.js";
import { calculateBasicAnalytics } from "../analytics/basic-analytics.js";
import { calculateMarketIndicators } from "../analytics/market-indicators.js";
import { calculateSignals } from "../analytics/signals.js";
import { inspectTransactionList } from "./normalize-contract.js";

export function buildMarketModel(transactions, context = {}) {
  const inspectedTransactions = inspectTransactionList(transactions);
  const normalizedTransactions = inspectedTransactions.transactions.sort(
    (left, right) => right.time - left.time
  );
  const totals = calculateTotals(normalizedTransactions);
  const assetStats = calculateAssetStats(normalizedTransactions);
  const actorStats = calculateActorStats(normalizedTransactions);
  const indicators = calculateMarketIndicators({ totals, assetStats, actorStats });

  return {
    meta: {
      source: context.source ?? "unknown",
      generatedAt: context.generatedAt ?? Date.now(),
      latestTransactionTime: totals.latestTransactionTime,
      dataQuality: inspectedTransactions.quality
    },
    transactions: normalizedTransactions,
    totals,
    assetStats,
    actorStats,
    analytics: calculateBasicAnalytics({
      transactions: normalizedTransactions,
      totals,
      assetStats,
      actorStats
    }),
    indicators,
    signals: calculateSignals(normalizedTransactions),
    marketHealth: null
  };
}
