import { PRODUCT_RULES, STORAGE_KEYS } from "../../../config/product-config.js";
import { hasCommunityServiceConfig, readPublicServiceConfig } from "../../../config/service-config.js";

export function createSkinCommunityState() {
  const config = readCommunityConfig();

  return {
    status: config.enabled ? "idle" : "disabled",
    visitorId: readStoredVisitorId(),
    visitorCount: null,
    wishlistLeaders: [],
    detail: config.enabled
      ? ""
      : "Community stats API is not configured."
  };
}

export async function syncSkinCommunityWishlist(selectedIds) {
  const config = readCommunityConfig();

  if (!config.enabled) {
    return createSkinCommunityState();
  }

  const visitor = getOrCreateVisitorCredentials();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/sync_skin_gallery_state`, {
    method: "POST",
    headers: {
      apikey: config.supabasePublishableKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_visitor_id: visitor.id,
      p_visitor_token: visitor.token,
      p_skin_ids: normalizeSelectedIds(selectedIds)
    })
  });

  if (!response.ok) {
    throw new Error(`Community stats sync failed with HTTP ${response.status}.`);
  }

  const payload = await response.json();
  return normalizeCommunityPayload(payload, visitor.id);
}

export async function forgetSkinCommunityData() {
  const config = readCommunityConfig();
  const visitor = readStoredVisitorCredentials();

  if (config.enabled && visitor.id && visitor.token) {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/delete_skin_gallery_state`, {
      method: "POST",
      headers: {
        apikey: config.supabasePublishableKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_visitor_id: visitor.id,
        p_visitor_token: visitor.token
      })
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Community data deletion failed with HTTP ${response.status}.`);
    }
  }

  clearStoredVisitorCredentials();
  return {
    ...createSkinCommunityState(),
    status: "forgotten",
    detail: "Community identifier and wish records were deleted."
  };
}

export function markSkinCommunityLoading(state) {
  return {
    ...state,
    status: "loading",
    detail: ""
  };
}

export function markSkinCommunityError(state, error) {
  return {
    ...state,
    status: "error",
    detail: error instanceof Error ? error.message : "Community stats sync failed."
  };
}

function normalizeCommunityPayload(payload, visitorId) {
  return {
    status: "remote",
    visitorId,
    visitorCount: normalizeCount(payload?.visitorCount),
    wishlistLeaders: Array.isArray(payload?.wishlistLeaders)
      ? payload.wishlistLeaders
        .map((leader) => ({
          skinId: String(leader?.skinId ?? "").trim(),
          wishCount: normalizeCount(leader?.wishCount)
        }))
        .filter((leader) => leader.skinId && leader.wishCount > 0)
        .slice(0, PRODUCT_RULES.rankingLimit)
      : [],
    detail: ""
  };
}

function readCommunityConfig() {
  const publicConfig = readPublicServiceConfig();

  return {
    enabled: hasCommunityServiceConfig(publicConfig),
    supabaseUrl: publicConfig.supabaseUrl,
    supabasePublishableKey: publicConfig.supabasePublishableKey
  };
}

function getOrCreateVisitorCredentials() {
  const stored = readStoredVisitorCredentials();

  if (stored.id && stored.token) {
    return stored;
  }

  const visitor = { id: createVisitorId(), token: createVisitorId() };
  writeStoredVisitorCredentials(visitor);
  return visitor;
}

function readStoredVisitorId() {
  return readStoredVisitorCredentials().id;
}

function readStoredVisitorCredentials() {
  try {
    return {
      id: normalizeVisitorId(window.localStorage?.getItem(STORAGE_KEYS.skinVisitor)),
      token: normalizeVisitorId(window.localStorage?.getItem(STORAGE_KEYS.skinVisitorToken))
    };
  } catch {
    return { id: "", token: "" };
  }
}

function writeStoredVisitorCredentials(visitor) {
  try {
    window.localStorage?.setItem(STORAGE_KEYS.skinVisitor, visitor.id);
    window.localStorage?.setItem(STORAGE_KEYS.skinVisitorToken, visitor.token);
  } catch {
    // Visitor persistence is optional; the UI still works without remote stats.
  }
}

function clearStoredVisitorCredentials() {
  try {
    window.localStorage?.removeItem(STORAGE_KEYS.skinVisitor);
    window.localStorage?.removeItem(STORAGE_KEYS.skinVisitorToken);
  } catch {
    // The remote deletion has still completed when localStorage is unavailable.
  }
}

function createVisitorId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  window.crypto?.getRandomValues?.(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizeVisitorId(value) {
  const visitorId = String(value ?? "").trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(visitorId)
    ? visitorId
    : "";
}

function normalizeSelectedIds(selectedIds) {
  if (!Array.isArray(selectedIds)) {
    return [];
  }

  return [...new Set(
    selectedIds
      .map((selectedId) => String(selectedId ?? "").trim())
      .filter(Boolean)
  )].slice(0, PRODUCT_RULES.wishlistLimit);
}

function normalizeCount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : 0;
}
