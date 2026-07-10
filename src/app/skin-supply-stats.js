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

export async function syncSkinSupplySnapshots(skins) {
  const config = readSupplyConfig();

  if (!config.enabled) {
    return createSkinSupplyState();
  }

  const normalizedSkins = normalizeSupplySkins(skins);

  if (normalizedSkins.length === 0) {
    return {
      ...createSkinSupplyState(),
      status: "idle",
      detail: "No skin supply data to sync."
    };
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/sync_skin_supply_snapshot`, {
    method: "POST",
    headers: {
      apikey: config.supabasePublishableKey,
      Authorization: `Bearer ${config.supabasePublishableKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_skins: normalizedSkins
    })
  });

  if (!response.ok) {
    throw new Error(`Skin supply snapshot sync failed with HTTP ${response.status}.`);
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
  const runtimeConfig = window.ELF_SKIN_COMMUNITY_CONFIG ?? {};
  const supabaseUrl = normalizeUrl(
    runtimeConfig.supabaseUrl
      ?? document.querySelector("meta[name='elf-community-supabase-url']")?.content
  );
  const supabasePublishableKey = String(
    runtimeConfig.supabasePublishableKey
      ?? runtimeConfig.supabaseAnonKey
      ?? document.querySelector("meta[name='elf-community-supabase-publishable-key']")?.content
      ?? document.querySelector("meta[name='elf-community-supabase-anon-key']")?.content
      ?? ""
  ).trim();

  return {
    enabled: Boolean(supabaseUrl && supabasePublishableKey),
    supabaseUrl,
    supabasePublishableKey
  };
}

function normalizeSupplySkins(skins) {
  if (!Array.isArray(skins)) {
    return [];
  }

  return skins
    .map((skin) => ({
      skinId: String(skin?.id ?? "").trim(),
      skinName: String(skin?.name ?? "").trim(),
      supply: normalizeNullableCount(skin?.quantity)
    }))
    .filter((skin) => skin.skinId && skin.skinName && skin.supply !== null && skin.supply > 0)
    .slice(0, 100);
}

function normalizeUrl(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
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
