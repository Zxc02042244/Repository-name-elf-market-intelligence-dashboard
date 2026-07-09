import { defaultLocale } from "../i18n/i18n.js";

export function createAppState() {
  return {
    sourceName: "Elf Continent market coverage",
    locale: defaultLocale,
    status: {
      kind: "loading",
      message: "Loading live market transactions...",
      detail: "Requesting market coverage seed items.",
      updatedAt: null
    },
    sourceSnapshot: null,
    skinCatalog: null,
    skinWishlist: null,
    skinCommunity: null,
    skinSupply: null,
    selectedCategory: "all",
    coverageModel: null,
    model: null,
    error: null
  };
}

export function setLoading(state, message = "Loading market data...", detail = "") {
  state.status = {
    kind: "loading",
    message,
    detail,
    updatedAt: null
  };
  state.error = null;
}

export function setUpdated(state, message = "Market model updated.", detail = "") {
  state.status = {
    kind: "updated",
    message,
    detail,
    updatedAt: Date.now()
  };
  state.error = null;
}

export function setFallback(
  state,
  error,
  message = "Live unavailable, showing demo snapshot.",
  detail = ""
) {
  state.status = {
    kind: "fallback",
    message,
    detail,
    updatedAt: Date.now()
  };
  state.error = error;
}

export function setError(state, error, message = "Unable to build market model.", detail = "") {
  state.status = {
    kind: "error",
    message,
    detail,
    updatedAt: null
  };
  state.error = error;
}
