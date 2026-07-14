import { hasCommunityServiceConfig, readPublicServiceConfig } from "../../../config/service-config.js";

export function createSkinSupplyState() {
  const config = readSupplyConfig();

  return {
    status: config.enabled ? "idle" : "disabled",
    snapshotDate: "",
    skinTrends: [],
    detail: config.enabled
      ? ""
      : "Skin supply snapshot API is not configured."
  };
}

export async function loadSkinSupplySnapshots() {
  const config = readSupplyConfig();

  if (!config.enabled) {
    return createSkinSupplyState();
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/get_skin_supply_stats`, {
    method: "POST",
    headers: {
      apikey: config.supabasePublishableKey,
      "Content-Type": "application/json"
    },
    body: "{}"
  });

  if (!response.ok) {
    throw new Error(`Skin supply snapshot read failed with HTTP ${response.status}.`);
  }

  const payload = await response.json();
  return normalizeSupplyPayload(payload);
}

export function markSkinSupplyLoading(state) {
  return {
    ...state,
    status: "loading",
    detail: ""
  };
}

export function markSkinSupplyError(state, error) {
  return {
    ...state,
    status: "error",
    detail: error instanceof Error ? error.message : "Skin supply snapshot sync failed."
  };
}

export function applySkinSupplyStatsToCatalog(skinCatalog, skinSupplyState) {
  const trendsBySkinId = new Map(
    normalizeSupplyPayload(skinSupplyState).skinTrends.map((trend) => [trend.skinId, trend])
  );

  return {
    ...skinCatalog,
    skins: Array.isArray(skinCatalog?.skins)
      ? skinCatalog.skins.map((skin) => ({
        ...skin,
        supplyTrend: trendsBySkinId.get(skin.id) ?? null
      }))
      : []
  };
}

function normalizeSupplyPayload(payload) {
  const skinTrends = Array.isArray(payload?.skinTrends)
    ? payload.skinTrends
      .map((trend) => ({
        skinId: String(trend?.skinId ?? "").trim(),
        snapshotDate: String(trend?.snapshotDate ?? payload?.snapshotDate ?? "").trim(),
        supply: normalizeNullableCount(trend?.supply),
        previousSupply: normalizeNullableCount(trend?.previousSupply),
        todayAdded: normalizeNullableCount(trend?.todayAdded)
      }))
      .filter((trend) => trend.skinId)
    : [];

  return {
    status: payload?.status ?? (skinTrends.length > 0 ? "remote" : "idle"),
    snapshotDate: String(payload?.snapshotDate ?? skinTrends[0]?.snapshotDate ?? "").trim(),
    skinTrends,
    detail: ""
  };
}

function readSupplyConfig() {
  const publicConfig = readPublicServiceConfig();

  return {
    enabled: hasCommunityServiceConfig(publicConfig),
    supabaseUrl: publicConfig.supabaseUrl,
    supabasePublishableKey: publicConfig.supabasePublishableKey
  };
}

function normalizeNullableCount(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.floor(numberValue)
    : null;
}
