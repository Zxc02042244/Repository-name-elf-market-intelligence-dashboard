export function calculateMarketIndicators({ totals, assetStats, actorStats }) {
  const totalTransactions = totals?.totalTransactions ?? 0;
  const totalVolume = totals?.totalVolume ?? 0;
  const activeSellers = totals?.activeSellers ?? 0;
  const activeBuyers = totals?.activeBuyers ?? 0;
  const activeParticipantCount = activeSellers + activeBuyers;
  const assetCount = assetStats?.length ?? 0;
  const activeActors = new Set([
    ...(actorStats ?? []).filter((stat) => stat.soldCount > 0).map((stat) => stat.actor.id),
    ...(actorStats ?? []).filter((stat) => stat.boughtCount > 0).map((stat) => stat.actor.id)
  ]).size;
  const topAsset = [...(assetStats ?? [])].sort(
    (left, right) => right.totalVolume - left.totalVolume
  )[0];

  return {
    activeBuyerShare: activeParticipantCount > 0 ? activeBuyers / activeParticipantCount : 0,
    activeSellerShare: activeParticipantCount > 0 ? activeSellers / activeParticipantCount : 0,
    averageTransactionValue: totalTransactions > 0 ? totalVolume / totalTransactions : 0,
    liquidityDensity: activeActors > 0 ? totalTransactions / activeActors : 0,
    topAsset,
    topAssetShare: totalVolume > 0 && topAsset ? topAsset.totalVolume / totalVolume : 0,
    transactionsPerAsset: assetCount > 0 ? totalTransactions / assetCount : 0
  };
}
