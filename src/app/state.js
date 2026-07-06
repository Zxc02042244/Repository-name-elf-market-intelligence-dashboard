export function createAppState() {
  return {
    sourceName: "Elf Continent live canary",
    status: {
      kind: "loading",
      message: "Loading live market transactions...",
      updatedAt: null
    },
    model: null,
    error: null
  };
}

export function setLoading(state, message = "Loading market data...") {
  state.status = {
    kind: "loading",
    message,
    updatedAt: null
  };
  state.error = null;
}

export function setUpdated(state, message = "Market model updated.") {
  state.status = {
    kind: "updated",
    message,
    updatedAt: Date.now()
  };
  state.error = null;
}

export function setError(state, error, message = "Unable to build market model.") {
  state.status = {
    kind: "error",
    message,
    updatedAt: Date.now()
  };
  state.error = error;
}
