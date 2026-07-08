const visitorStorageKey = "elfSkinGallery.visitorId.v1";
const wishlistLimit = 3;

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

  const visitorId = getOrCreateVisitorId();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/sync_skin_gallery_state`, {
    method: "POST",
    headers: {
      apikey: config.supabasePublishableKey,
      Authorization: `Bearer ${config.supabasePublishableKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_visitor_id: visitorId,
      p_skin_ids: normalizeSelectedIds(selectedIds)
    })
  });

  if (!response.ok) {
    throw new Error(`Community stats sync failed with HTTP ${response.status}.`);
  }

  const payload = await response.json();
  return normalizeCommunityPayload(payload, visitorId);
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
        .slice(0, 5)
      : [],
    detail: ""
  };
}

function readCommunityConfig() {
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

function getOrCreateVisitorId() {
  const storedVisitorId = readStoredVisitorId();

  if (storedVisitorId) {
    return storedVisitorId;
  }

  const visitorId = createVisitorId();
  writeStoredVisitorId(visitorId);
  return visitorId;
}

function readStoredVisitorId() {
  try {
    return normalizeVisitorId(window.localStorage?.getItem(visitorStorageKey));
  } catch {
    return "";
  }
}

function writeStoredVisitorId(visitorId) {
  try {
    window.localStorage?.setItem(visitorStorageKey, visitorId);
  } catch {
    // Visitor persistence is optional; the UI still works without remote stats.
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
  )].slice(0, wishlistLimit);
}

function normalizeUrl(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function normalizeCount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : 0;
}
