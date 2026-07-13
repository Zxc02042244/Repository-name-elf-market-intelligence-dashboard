import { MARKET_DISPLAY_LIMITS } from "../../config/product-config.js";

export function calculateActorStats(transactions) {
  const statsByActor = new Map();

  for (const transaction of transactions) {
    recordSoldTransaction(statsByActor, transaction.actors.seller, transaction);
    recordBoughtTransaction(statsByActor, transaction.actors.buyer, transaction);
  }

  return [...statsByActor.values()]
    .map((stat) => ({
      actor: stat.actor,
      soldCount: stat.soldCount,
      boughtCount: stat.boughtCount,
      totalSoldValue: stat.totalSoldValue,
      totalBoughtValue: stat.totalBoughtValue,
      currency: stat.currency,
      mainTradedAssets: getTopAssets(stat.assetCounts),
      counterpartyCount: stat.counterpartyIds.size,
      lastSeen: stat.lastSeen
    }))
    .sort(
      (left, right) =>
        right.totalSoldValue + right.totalBoughtValue - (left.totalSoldValue + left.totalBoughtValue)
    );
}

function recordSoldTransaction(statsByActor, actor, transaction) {
  const stat = getActorStat(statsByActor, actor);
  stat.soldCount += 1;
  stat.totalSoldValue += transaction.value.total;
  stat.counterpartyIds.add(transaction.actors.buyer.id);
  recordActorAsset(stat, transaction);
}

function recordBoughtTransaction(statsByActor, actor, transaction) {
  const stat = getActorStat(statsByActor, actor);
  stat.boughtCount += 1;
  stat.totalBoughtValue += transaction.value.total;
  stat.counterpartyIds.add(transaction.actors.seller.id);
  recordActorAsset(stat, transaction);
}

function getActorStat(statsByActor, actor) {
  const current = statsByActor.get(actor.id) ?? {
    actor,
    soldCount: 0,
    boughtCount: 0,
    totalSoldValue: 0,
    totalBoughtValue: 0,
    currency: null,
    assetCounts: new Map(),
    counterpartyIds: new Set(),
    lastSeen: null
  };

  statsByActor.set(actor.id, current);
  return current;
}

function recordActorAsset(stat, transaction) {
  const assetKey = transaction.asset.id;
  const current = stat.assetCounts.get(assetKey) ?? {
    asset: transaction.asset,
    count: 0
  };

  current.count += 1;
  stat.assetCounts.set(assetKey, current);
  stat.currency = stat.currency ?? transaction.value.currency;
  stat.lastSeen = Math.max(stat.lastSeen ?? 0, transaction.time);
}

function getTopAssets(assetCounts) {
  return [...assetCounts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, MARKET_DISPLAY_LIMITS.actorMainAssets)
    .map((entry) => entry.asset);
}
