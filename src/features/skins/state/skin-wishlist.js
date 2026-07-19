import { PRODUCT_RULES, STORAGE_KEYS } from "../../../config/product-config.js";

export function createSkinWishlistState() {
  const storedState = readStoredWishlist();
  return {
    selectedIds: normalizeSelectedIds(storedState.selectedIds),
    notice: ""
  };
}

export function toggleSkinWishlistSelection(wishlistState, skinId) {
  const selectedIds = normalizeSelectedIds(wishlistState?.selectedIds);
  const normalizedSkinId = String(skinId ?? "").trim();

  if (!normalizedSkinId) {
    return {
      selectedIds,
      notice: ""
    };
  }

  if (selectedIds.includes(normalizedSkinId)) {
    const nextState = {
      selectedIds: selectedIds.filter((selectedId) => selectedId !== normalizedSkinId),
      notice: ""
    };
    writeStoredWishlist(nextState);
    return nextState;
  }

  if (selectedIds.length >= PRODUCT_RULES.wishlistLimit) {
    return {
      selectedIds,
      notice: "limit"
    };
  }

  const nextState = {
    selectedIds: [...selectedIds, normalizedSkinId],
    notice: ""
  };
  writeStoredWishlist(nextState);
  return nextState;
}

export function clearSkinWishlistSelection(wishlistState) {
  const nextState = {
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
