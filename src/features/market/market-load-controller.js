import { buildMarketModel } from "../../core/data/market-model.js";
import { inspectTransactionList } from "../../core/data/normalize-contract.js";
import {
  createMarketDataSourceState,
  createReservedMarketDataSource,
  hasMarketDataSourceCapabilities,
  isMarketDataSourceLoadable
} from "./data/market-data-source.js";
import {
  createMarketLifecycleState,
  createMarketSafeError,
  MARKET_ERROR_KIND,
  MARKET_LIFECYCLE
} from "./market-lifecycle.js";

export function createMarketLoadController(
  { dataSource = createReservedMarketDataSource() } = {},
  dependencies = {}
) {
  const inspectTransactions = dependencies.inspectTransactionList ?? inspectTransactionList;
  const buildModel = dependencies.buildMarketModel ?? buildMarketModel;
  const now = dependencies.now ?? Date.now;
  let dataSourceState = null;
  let sourceInspectionFailed = false;

  try {
    dataSourceState = createMarketDataSourceState(dataSource);
  } catch {
    sourceInspectionFailed = true;
  }

  let nextGeneration = 0;
  let state = createMarketLifecycleState({ dataSource: dataSourceState });

  function getState() {
    return { ...state };
  }

  function commit(generation, nextState) {
    if (generation !== state.activeGeneration) {
      return false;
    }

    state = createMarketLifecycleState({
      dataSource: dataSourceState,
      activeGeneration: generation,
      ...nextState
    });
    return true;
  }

  function commitUnavailable(generation, kind) {
    return commit(generation, {
      status: MARKET_LIFECYCLE.unavailable,
      model: null,
      safeError: createMarketSafeError(kind)
    });
  }

  async function load() {
    if (!sourceInspectionFailed && dataSourceState.kind === "reserved") {
      return getState();
    }

    const generation = ++nextGeneration;
    state = createMarketLifecycleState({
      dataSource: dataSourceState,
      status: MARKET_LIFECYCLE.loading,
      activeGeneration: generation
    });

    try {
      if (sourceInspectionFailed) {
        commitUnavailable(generation, MARKET_ERROR_KIND.coreFailed);
        return getState();
      }

      if (!isMarketDataSourceLoadable(dataSource) || !hasMarketDataSourceCapabilities(dataSource)) {
        commitUnavailable(generation, MARKET_ERROR_KIND.capabilityMissing);
        return getState();
      }

      let payload;

      try {
        payload = await dataSource.load({ generation });
      } catch {
        commitUnavailable(generation, MARKET_ERROR_KIND.requestFailed);
        return getState();
      }

      if (generation !== state.activeGeneration) {
        return getState();
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload) ||
        !Array.isArray(payload.transactions)
      ) {
        commitUnavailable(generation, MARKET_ERROR_KIND.invalidResponse);
        return getState();
      }

      let inspectedTransactions;

      try {
        inspectedTransactions = inspectTransactions(payload.transactions);
      } catch {
        commitUnavailable(generation, MARKET_ERROR_KIND.normalizationFailed);
        return getState();
      }

      let model;

      try {
        model = buildModel(payload.transactions, {
          source: dataSourceState.id,
          generatedAt: now()
        });

        assertMarketModel(model, inspectedTransactions.transactions.length);
      } catch {
        commitUnavailable(generation, MARKET_ERROR_KIND.modelBuildFailed);
        return getState();
      }

      commit(generation, {
        status: inspectedTransactions.transactions.length === 0
          ? MARKET_LIFECYCLE.empty
          : MARKET_LIFECYCLE.ready,
        model,
        safeError: null
      });
    } catch {
      commitUnavailable(generation, MARKET_ERROR_KIND.coreFailed);
    }

    return getState();
  }

  return Object.freeze({ getState, load });
}

function assertMarketModel(model, acceptedTransactionCount) {
  if (
    !model ||
    typeof model !== "object" ||
    !Array.isArray(model.transactions) ||
    !Number.isFinite(model.totals?.totalTransactions) ||
    model.totals.totalTransactions !== acceptedTransactionCount
  ) {
    throw new TypeError("MarketModel is invalid.");
  }
}
