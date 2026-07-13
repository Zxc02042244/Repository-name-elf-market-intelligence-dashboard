import { isMarketDataSourceReady } from "../../data/market-data-source.js";
import { MARKET_DISPLAY_LIMITS } from "../../../../config/product-config.js";

const EMPTY_METRICS = Object.freeze({
  assetCount: null,
  categoryCount: null,
  leadingAssetName: null,
  leadingVolumeShare: null
});

export function buildMarketAssets(model, dataSource) {
  if (!isMarketDataSourceReady(dataSource)) {
    return createAssetState("planned");
  }

  const assetStats = Array.isArray(model?.assetStats) ? model.assetStats : [];

  if (assetStats.length === 0) {
    return createAssetState("empty");
  }

  const categories = new Set(
    assetStats.map((stat) => String(stat?.asset?.category ?? "").trim()).filter(Boolean)
  );
  const leadingAsset = assetStats[0];
  const totalVolume = model?.totals?.totalVolume;
  const leadingVolume = leadingAsset?.totalVolume;

  return {
    status: "ready",
    metrics: {
      assetCount: assetStats.length,
      categoryCount: categories.size,
      leadingAssetName: nonEmptyOrNull(leadingAsset?.asset?.name),
      leadingVolumeShare: Number.isFinite(totalVolume) && totalVolume > 0 && Number.isFinite(leadingVolume)
        ? leadingVolume / totalVolume
        : null
    },
    assets: assetStats.slice(0, MARKET_DISPLAY_LIMITS.assetSummaries).map(toAssetSummary)
  };
}

function createAssetState(status) {
  return {
    status,
    metrics: EMPTY_METRICS,
    assets: []
  };
}

function toAssetSummary(stat) {
  return {
    id: nonEmptyOrNull(stat?.asset?.id),
    name: nonEmptyOrNull(stat?.asset?.name),
    category: nonEmptyOrNull(stat?.asset?.category),
    tradeCount: finiteOrNull(stat?.tradeCount),
    totalVolume: finiteOrNull(stat?.totalVolume),
    currency: nonEmptyOrNull(stat?.currency)
  };
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function nonEmptyOrNull(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue || null;
}
