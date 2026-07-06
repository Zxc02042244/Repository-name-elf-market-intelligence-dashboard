import { createAppState, setError, setLoading, setUpdated } from "./state.js";
import { getCurrentRoute } from "./router.js";
import { buildMarketModel } from "../core/data/market-model.js";
import { loadElfLiveTransactions } from "../sources/elf/elf-api.js";
import { ELF_LIVE_CANARY_ITEMS } from "../sources/elf/elf-items.js";
import { renderDashboardView } from "../views/dashboard-view.js";
import { renderTransactionsView } from "../views/transactions-view.js";
import { renderAssetView } from "../views/asset-view.js";
import { renderActorView } from "../views/actor-view.js";
import { renderSignalsView } from "../views/signals-view.js";

const appState = createAppState();
const appRoot = document.querySelector("#app");

function renderApp() {
  if (!appRoot) {
    return;
  }

  const route = getCurrentRoute();
  appRoot.innerHTML = `
    <main class="app-shell">
      <section class="app-header" aria-labelledby="page-title">
        <div>
          <p class="eyebrow">BETA 1.0.0</p>
          <h1 id="page-title">Market Intelligence Dashboard</h1>
          <p class="page-summary">
            Reusable market model foundation with Elf Continent as the first source adapter.
          </p>
        </div>
        <button class="refresh-button" type="button" data-action="refresh">Refresh Live Data</button>
      </section>

      ${renderDashboardView(appState.model, appState.status, route)}
      ${renderAssetView(appState.model)}
      ${renderActorView(appState.model)}
      ${renderSignalsView(appState.model)}
      ${renderTransactionsView(appState.model)}
    </main>
  `;

  const refreshButton = appRoot.querySelector("[data-action='refresh']");
  refreshButton?.addEventListener("click", () => {
    void loadDashboard();
  });
}

async function loadDashboard() {
  try {
    setLoading(appState, "Loading live market transactions...");
    renderApp();

    const sourceSnapshot = await loadElfLiveTransactions(ELF_LIVE_CANARY_ITEMS);
    const model = buildMarketModel(sourceSnapshot.transactions, {
      source: sourceSnapshot.source,
      generatedAt: sourceSnapshot.fetchedAt
    });

    appState.model = model;

    if (model.transactions.length === 0) {
      setError(appState, new Error("No transactions returned."), "No transactions returned.");
    } else if (sourceSnapshot.partial) {
      setUpdated(appState, "Partial data loaded. Some items failed.");
    } else {
      setUpdated(appState, "Updated from Elf live adapter.");
    }
  } catch (error) {
    setError(appState, error, getStatusMessage(error));
  }

  renderApp();
}

function getStatusMessage(error) {
  const messages = {
    token_refresh_failed: "Token refresh failed. Live data is unavailable.",
    item_request_failed: "Item request failed. Live data is unavailable.",
    unexpected_api_response_format: "Unexpected API response format."
  };

  return messages[error?.kind] ?? "Unexpected API response format.";
}

renderApp();
void loadDashboard();
