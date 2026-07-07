import { calculateTotals } from "../analytics/totals.js";
import { calculateAssetStats } from "../analytics/asset-stats.js";
import { calculateActorStats } from "../analytics/actor-stats.js";
import { calculateBasicAnalytics } from "../analytics/basic-analytics.js";
import { calculateSignals } from "../analytics/signals.js";
import { normalizeTransactionList } from "./normalize-contract.js";

export function buildMarketModel(transactions, context = {}) {
  const normalizedTransactions = normalizeTransactionList(transactions).sort(
    (left, right) => right.time - left.time
  );
  const totals = calculateTotals(normalizedTransactions);
  const assetStats = calculateAssetStats(normalizedTransactions);
  const actorStats = calculateActorStats(normalizedTransactions);

  return {
    meta: {
      source: context.source ?? "unknown",
      generatedAt: context.generatedAt ?? Date.now(),
      latestTransactionTime: totals.latestTransactionTime
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
    signals: calculateSignals(normalizedTransactions),
    marketHealth: null
  };
}
