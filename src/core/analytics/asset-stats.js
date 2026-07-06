export function calculateAssetStats(transactions) {
  const statsByAsset = new Map();

  for (const transaction of transactions) {
    const assetId = transaction.asset.id;
    const current = statsByAsset.get(assetId) ?? createAssetStat(transaction);

    current.tradeCount += 1;
    current.totalVolume += transaction.value.total;
    current.totalQuantity += transaction.quantity;
    current.latestTransactionTime = Math.max(current.latestTransactionTime ?? 0, transaction.time);
    current.lastUnitValue =
      transaction.time >= current.latestTransactionTime ? transaction.value.unit : current.lastUnitValue;
    current.activeSellerIds.add(transaction.actors.seller.id);
    current.activeBuyerIds.add(transaction.actors.buyer.id);

    statsByAsset.set(assetId, current);
  }

  return [...statsByAsset.values()]
    .map((stat) => ({
      asset: stat.asset,
      tradeCount: stat.tradeCount,
      totalVolume: stat.totalVolume,
      totalQuantity: stat.totalQuantity,
      averageUnitValue: stat.totalQuantity > 0 ? stat.totalVolume / stat.totalQuantity : 0,
      lastUnitValue: stat.lastUnitValue,
      currency: stat.currency,
      latestTransactionTime: stat.latestTransactionTime,
      activeSellers: stat.activeSellerIds.size,
      activeBuyers: stat.activeBuyerIds.size
    }))
    .sort((left, right) => right.totalVolume - left.totalVolume);
}

function createAssetStat(transaction) {
  return {
    asset: transaction.asset,
    tradeCount: 0,
    totalVolume: 0,
    totalQuantity: 0,
    averageUnitValue: 0,
    lastUnitValue: transaction.value.unit,
    currency: transaction.value.currency,
    latestTransactionTime: transaction.time,
    activeSellerIds: new Set(),
    activeBuyerIds: new Set()
  };
}
