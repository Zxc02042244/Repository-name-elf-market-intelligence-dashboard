const RESULT_LIMIT = 12;
const DETAIL_TRANSACTION_LIMIT = 40;

export function buildSnapshotExplorer(model, route = {}) {
  const search = normalizeSearch(route.search);
  const mode = route.mode === "actors" ? "actors" : "assets";
  const sort = isSupportedSort(route.sort) ? route.sort : "value";

  return {
    controls: {
      mode,
      search: route.search ?? "",
      sort
    },
    assetResults: searchAssets(model, search, sort),
    actorResults: searchActors(model, search, sort),
    selectedAsset: route.assetId ? getAssetDetail(model, route.assetId) : null,
    selectedActor: route.actorId ? getActorDetail(model, route.actorId) : null
  };
}

function searchAssets(model, search, sort) {
  return (model?.assetStats ?? [])
    .filter((stat) => matchesSearch(search, [
      stat.asset.name,
      stat.asset.category,
      stat.asset.assetClass,
      stat.asset.group
    ]))
    .sort((left, right) => compareAssetStats(left, right, sort))
    .slice(0, RESULT_LIMIT);
}

function searchActors(model, search, sort) {
  return (model?.actorStats ?? [])
    .filter((stat) => matchesSearch(search, [stat.actor.name]))
    .sort((left, right) => compareActorStats(left, right, sort))
    .slice(0, RESULT_LIMIT);
}

function getAssetDetail(model, assetId) {
  const stat = (model?.assetStats ?? []).find((entry) => String(entry.asset.id) === String(assetId));

  if (!stat) {
    return null;
  }

  return {
    stat,
    transactions: (model?.transactions ?? [])
      .filter((transaction) => String(transaction.asset.id) === String(assetId))
      .slice(0, DETAIL_TRANSACTION_LIMIT)
  };
}

function getActorDetail(model, actorId) {
  const stat = (model?.actorStats ?? []).find((entry) => String(entry.actor.id) === String(actorId));

  if (!stat) {
    return null;
  }

  return {
    stat,
    transactions: (model?.transactions ?? [])
      .filter(
        (transaction) =>
          String(transaction.actors.seller.id) === String(actorId) ||
          String(transaction.actors.buyer.id) === String(actorId)
      )
      .slice(0, DETAIL_TRANSACTION_LIMIT)
  };
}

function compareAssetStats(left, right, sort) {
  const comparators = {
    activity: right.tradeCount - left.tradeCount,
    latest: right.latestTransactionTime - left.latestTransactionTime,
    name: left.asset.name.localeCompare(right.asset.name),
    value: right.totalVolume - left.totalVolume
  };

  return comparators[sort] || comparators.value || right.tradeCount - left.tradeCount;
}

function compareActorStats(left, right, sort) {
  const leftValue = left.totalSoldValue + left.totalBoughtValue;
  const rightValue = right.totalSoldValue + right.totalBoughtValue;
  const leftActivity = left.soldCount + left.boughtCount;
  const rightActivity = right.soldCount + right.boughtCount;
  const comparators = {
    activity: rightActivity - leftActivity,
    latest: right.lastSeen - left.lastSeen,
    name: left.actor.name.localeCompare(right.actor.name),
    value: rightValue - leftValue
  };

  return comparators[sort] || comparators.value || rightActivity - leftActivity;
}

function matchesSearch(search, fields) {
  if (!search) {
    return true;
  }

  return fields.some((field) => String(field ?? "").toLowerCase().includes(search));
}

function normalizeSearch(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isSupportedSort(sort) {
  return ["value", "activity", "latest", "name"].includes(sort);
}
