export function createAppState() {
  return {
    sourceName: "Elf Continent market coverage",
    status: {
      kind: "loading",
      message: "Loading live market transactions...",
      detail: "Requesting market coverage seed items.",
      updatedAt: null
    },
    sourceSnapshot: null,
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

export function setError(state, error, message = "Unable to build market model.", detail = "") {
  state.status = {
    kind: "error",
    message,
    detail,
    updatedAt: Date.now()
  };
  state.error = error;
}
