import { createAppState, setError, setLoading, setUpdated } from "./state.js";
import { getCurrentRoute } from "./router.js";
import { buildMarketModel } from "../core/data/market-model.js";
import { loadElfMockMarketTransactions } from "../sources/elf/elf-api.js";
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
        <button class="refresh-button" type="button" data-action="refresh">Refresh Mock Data</button>
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
    setLoading(appState, "Loading mock market transactions...");
    renderApp();

    const sourceSnapshot = await loadElfMockMarketTransactions();
    const model = buildMarketModel(sourceSnapshot.transactions, {
      source: sourceSnapshot.source,
      generatedAt: sourceSnapshot.fetchedAt
    });

    appState.model = model;

    if (model.transactions.length === 0) {
      setError(appState, new Error("No transactions returned."), "No transactions returned.");
    } else {
      setUpdated(appState, "Updated from mock source adapter.");
    }
  } catch (error) {
    setError(appState, error, "Unexpected market data format.");
  }

  renderApp();
}

renderApp();
void loadDashboard();
