export const PRODUCT_RULES = Object.freeze({
  wishlistLimit: 3,
  rankingLimit: 10,
  mobileChampionLimit: 10,
  desktopRankingPageSize: 30,
  desktopRankingColumnSize: 10,
  supplySyncLimit: 100
});

export const MARKET_DISPLAY_LIMITS = Object.freeze({
  assetSummaries: 3,
  actorSummaries: 3,
  actorMainAssets: 3
});

export const HOME_TABS = Object.freeze(["wishlist", "supply", "gallery"]);
export const MARKET_SORT_OPTIONS = Object.freeze(["value", "activity", "latest", "name"]);

export const STORAGE_KEYS = Object.freeze({
  locale: "marketDashboard.locale",
  skinWishlist: "elfSkinGallery.wishlist.v1",
  skinVisitor: "elfSkinGallery.visitorId.v1",
  skinVisitorToken: "elfSkinGallery.visitorToken.v1"
});

export function isSupportedHomeTab(tab) {
  return HOME_TABS.includes(tab);
}

export function isSupportedMarketSort(sort) {
  return MARKET_SORT_OPTIONS.includes(sort);
}
