export function calculateBasicAnalytics({ transactions, totals, assetStats, actorStats }) {
  return {
    topSellers: getTopSellers(actorStats),
    topBuyers: getTopBuyers(actorStats),
    topAssets: getTopAssets(assetStats),
    activitySummary: {
      totals,
      assetClassBreakdown: getAssetBreakdown(transactions, "assetClass"),
      categoryBreakdown: getAssetBreakdown(transactions, "category")
    }
  };
}

function getTopSellers(actorStats) {
  return [...actorStats]
    .filter((stat) => stat.soldCount > 0)
    .sort(compareSellerStats)
    .slice(0, 5);
}

function getTopBuyers(actorStats) {
  return [...actorStats]
    .filter((stat) => stat.boughtCount > 0)
    .sort(compareBuyerStats)
    .slice(0, 5);
}

function getTopAssets(assetStats) {
  return [...assetStats]
    .sort(compareAssetStats)
    .slice(0, 5);
}

function compareSellerStats(left, right) {
  return (
    right.totalSoldValue - left.totalSoldValue ||
    right.soldCount - left.soldCount ||
    right.lastSeen - left.lastSeen
  );
}

function compareBuyerStats(left, right) {
  return (
    right.totalBoughtValue - left.totalBoughtValue ||
    right.boughtCount - left.boughtCount ||
    right.lastSeen - left.lastSeen
  );
}

function compareAssetStats(left, right) {
  return (
    right.totalVolume - left.totalVolume ||
    right.tradeCount - left.tradeCount ||
    right.latestTransactionTime - left.latestTransactionTime
  );
}

function getAssetBreakdown(transactions, assetField) {
  const breakdownByName = new Map();

  for (const transaction of transactions) {
    const name = transaction.asset?.[assetField] ?? "Unclassified / Other";
    const current = breakdownByName.get(name) ?? {
      name,
      tradeCount: 0,
      totalVolume: 0,
      totalQuantity: 0,
      assetIds: new Set()
    };

    current.tradeCount += 1;
    current.totalVolume += transaction.value.total;
    current.totalQuantity += transaction.quantity;
    current.assetIds.add(transaction.asset.id);
    breakdownByName.set(name, current);
  }

  return [...breakdownByName.values()]
    .map((entry) => ({
      name: entry.name,
      tradeCount: entry.tradeCount,
      totalVolume: entry.totalVolume,
      totalQuantity: entry.totalQuantity,
      assetCount: entry.assetIds.size
    }))
    .sort(
      (left, right) =>
        right.totalVolume - left.totalVolume ||
        right.tradeCount - left.tradeCount ||
        left.name.localeCompare(right.name)
    );
}
