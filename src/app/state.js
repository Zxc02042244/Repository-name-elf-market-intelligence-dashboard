import { defaultLocale } from "../i18n/i18n.js";

export function createAppState() {
  return {
    locale: defaultLocale,
    market: null,
    skinCatalog: null,
    skinWishlist: null,
    skinCommunity: null,
    skinSupply: null,
    skinHomeTab: "wishlist",
    skinPreviewIds: {
      wishlist: "",
      supply: ""
    }
  };
}
