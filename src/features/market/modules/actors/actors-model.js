import { isMarketDataSourceReady } from "../../data/market-data-source.js";
import { MARKET_DISPLAY_LIMITS } from "../../../../config/product-config.js";

const EMPTY_METRICS = Object.freeze({
  actorCount: null,
  buyerCount: null,
  sellerCount: null,
  activityLeaderName: null
});

export function buildMarketActors(model, dataSource) {
  if (!isMarketDataSourceReady(dataSource)) {
    return createActorState("planned");
  }

  const actorStats = Array.isArray(model?.actorStats) ? model.actorStats : [];

  if (actorStats.length === 0) {
    return createActorState("empty");
  }

  const actors = actorStats.map(toActorSummary).sort(compareActorActivity);

  return {
    status: "ready",
    metrics: {
      actorCount: actors.length,
      buyerCount: actors.filter((actor) => actor.boughtCount > 0).length,
      sellerCount: actors.filter((actor) => actor.soldCount > 0).length,
      activityLeaderName: actors[0]?.name ?? null
    },
    actors: actors.slice(0, MARKET_DISPLAY_LIMITS.actorSummaries)
  };
}

function createActorState(status) {
  return {
    status,
    metrics: EMPTY_METRICS,
    actors: []
  };
}

function toActorSummary(stat) {
  const boughtCount = finiteOrZero(stat?.boughtCount);
  const soldCount = finiteOrZero(stat?.soldCount);

  return {
    id: nonEmptyOrNull(stat?.actor?.id),
    name: nonEmptyOrNull(stat?.actor?.name),
    boughtCount,
    soldCount,
    transactionCount: boughtCount + soldCount,
    counterpartyCount: finiteOrNull(stat?.counterpartyCount),
    mainAssets: Array.isArray(stat?.mainTradedAssets)
      ? stat.mainTradedAssets
        .map((asset) => nonEmptyOrNull(asset?.name))
        .filter(Boolean)
        .slice(0, MARKET_DISPLAY_LIMITS.actorMainAssets)
      : []
  };
}

function compareActorActivity(left, right) {
  return right.transactionCount - left.transactionCount
    || String(left.name ?? left.id ?? "").localeCompare(String(right.name ?? right.id ?? ""));
}

function finiteOrZero(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function finiteOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function nonEmptyOrNull(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue || null;
}
