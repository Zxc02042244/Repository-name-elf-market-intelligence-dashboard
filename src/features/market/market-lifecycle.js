export const MARKET_LIFECYCLE = Object.freeze({
  planned: "planned",
  loading: "loading",
  empty: "empty",
  ready: "ready",
  unavailable: "unavailable"
});

export const MARKET_ERROR_KIND = Object.freeze({
  capabilityMissing: "capabilityMissing",
  requestFailed: "requestFailed",
  invalidResponse: "invalidResponse",
  normalizationFailed: "normalizationFailed",
  modelBuildFailed: "modelBuildFailed",
  coreFailed: "coreFailed"
});

const SAFE_ERROR_MESSAGES = Object.freeze({
  [MARKET_ERROR_KIND.capabilityMissing]: "The market data source is not available.",
  [MARKET_ERROR_KIND.requestFailed]: "Market data could not be loaded.",
  [MARKET_ERROR_KIND.invalidResponse]: "Market data could not be safely read.",
  [MARKET_ERROR_KIND.normalizationFailed]: "Market data could not be safely validated.",
  [MARKET_ERROR_KIND.modelBuildFailed]: "Market data could not be prepared.",
  [MARKET_ERROR_KIND.coreFailed]: "The market feature is temporarily unavailable."
});

const VALID_LIFECYCLES = new Set(Object.values(MARKET_LIFECYCLE));

export function createMarketLifecycleState({
  dataSource,
  status = MARKET_LIFECYCLE.planned,
  model = null,
  safeError = null,
  activeGeneration = 0
} = {}) {
  if (!VALID_LIFECYCLES.has(status)) {
    throw new TypeError("Market lifecycle state is invalid.");
  }

  if (!Number.isSafeInteger(activeGeneration) || activeGeneration < 0) {
    throw new TypeError("Market active generation must be a non-negative safe integer.");
  }

  if (status !== MARKET_LIFECYCLE.unavailable && safeError !== null) {
    throw new TypeError("Market safe errors are only valid for unavailable state.");
  }

  if (status === MARKET_LIFECYCLE.unavailable && !isSafeError(safeError)) {
    throw new TypeError("Unavailable Market state requires a safe error.");
  }

  if (status !== MARKET_LIFECYCLE.ready && status !== MARKET_LIFECYCLE.empty && model !== null) {
    throw new TypeError("Market models are only valid for ready or empty state.");
  }

  if (status === MARKET_LIFECYCLE.ready && (!model || typeof model !== "object")) {
    throw new TypeError("Ready Market state requires a MarketModel.");
  }

  return {
    dataSource,
    model,
    status,
    safeError,
    activeGeneration
  };
}

export function createMarketSafeError(kind) {
  const message = SAFE_ERROR_MESSAGES[kind];

  if (!message) {
    return Object.freeze({
      kind: MARKET_ERROR_KIND.coreFailed,
      message: SAFE_ERROR_MESSAGES[MARKET_ERROR_KIND.coreFailed]
    });
  }

  return Object.freeze({ kind, message });
}

function isSafeError(error) {
  return Boolean(
    error &&
    typeof error === "object" &&
    typeof error.kind === "string" &&
    typeof error.message === "string" &&
    Object.keys(error).length === 2 &&
    SAFE_ERROR_MESSAGES[error.kind] === error.message
  );
}
