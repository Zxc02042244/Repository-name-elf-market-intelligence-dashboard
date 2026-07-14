import { PRODUCT_RULES, STORAGE_KEYS } from "../../../config/product-config.js";

export function createSkinWishlistState() {
  const storedState = readStoredWishlist();
  const nextState = {
    visitorCount: normalizeVisitorCount(storedState.visitorCount),
    hasCountedLocalVisit: storedState.hasCountedLocalVisit === true,
    selectedIds: normalizeSelectedIds(storedState.selectedIds),
    notice: ""
  };

  if (!nextState.hasCountedLocalVisit) {
    nextState.visitorCount += 1;
    nextState.hasCountedLocalVisit = true;
    writeStoredWishlist(nextState);
  }

  return nextState;
}

export function toggleSkinWishlistSelection(wishlistState, skinId) {
  const selectedIds = normalizeSelectedIds(wishlistState?.selectedIds);
  const normalizedSkinId = String(skinId ?? "").trim();

  if (!normalizedSkinId) {
    return {
      ...wishlistState,
      selectedIds,
      notice: ""
    };
  }

  if (selectedIds.includes(normalizedSkinId)) {
    const nextState = {
      ...wishlistState,
      selectedIds: selectedIds.filter((selectedId) => selectedId !== normalizedSkinId),
      notice: ""
    };
    writeStoredWishlist(nextState);
    return nextState;
  }

  if (selectedIds.length >= PRODUCT_RULES.wishlistLimit) {
    return {
      ...wishlistState,
      selectedIds,
      notice: "limit"
    };
  }

  const nextState = {
    ...wishlistState,
    selectedIds: [...selectedIds, normalizedSkinId],
    notice: ""
  };
  writeStoredWishlist(nextState);
  return nextState;
}

export function clearSkinWishlistSelection(wishlistState) {
  const nextState = {
    ...wishlistState,
    selectedIds: [],
    notice: ""
  };
  writeStoredWishlist(nextState);
  return nextState;
}

function readStoredWishlist() {
  try {
    return JSON.parse(window.localStorage?.getItem(STORAGE_KEYS.skinWishlist) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

function writeStoredWishlist(wishlistState) {
  try {
    window.localStorage?.setItem(STORAGE_KEYS.skinWishlist, JSON.stringify({
      visitorCount: normalizeVisitorCount(wishlistState?.visitorCount),
      hasCountedLocalVisit: wishlistState?.hasCountedLocalVisit === true,
      selectedIds: normalizeSelectedIds(wishlistState?.selectedIds)
    }));
  } catch {
    // Wishlist persistence is optional; in-memory state keeps the UI usable.
  }
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

function normalizeVisitorCount(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : 0;
}
