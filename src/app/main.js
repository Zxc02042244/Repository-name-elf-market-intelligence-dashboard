import { createAppState, setError, setLoading, setUpdated } from "./state.js";
import { buildRouteHash, getCurrentRoute } from "./router.js";
import { buildMarketModel } from "../core/data/market-model.js";
import { buildSnapshotExplorer } from "../core/analytics/snapshot-details.js";
import { loadElfLiveTransactions } from "../sources/elf/elf-api.js";
import { ELF_MARKET_COVERAGE_ITEMS } from "../sources/elf/elf-items.js";
import { renderCategoryFilterView } from "../views/category-filter-view.js";
import { renderDashboardView } from "../views/dashboard-view.js";
import { renderTransactionsView } from "../views/transactions-view.js";
import { renderAnalyticsView } from "../views/analytics-view.js";
import { renderSnapshotExplorerView } from "../views/snapshot-explorer-view.js";
import { renderSignalsView } from "../views/signals-view.js";
import { defaultLocale, normalizeLocale, supportedLocales } from "../i18n/i18n.js";

const appState = createAppState();
const appRoot = document.querySelector("#app");
const localeStorageKey = "marketDashboard.locale";
const localeLabels = Object.freeze({
  en: "English",
  "zh-Hant": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  vi: "Tiếng Việt"
});

appState.locale = readStoredLocale();

function renderApp() {
  if (!appRoot) {
    return;
  }

  const route = getCurrentRoute();
  const isLoading = appState.status.kind === "loading";
  const snapshotExplorer = buildSnapshotExplorer(appState.model, route);
  appRoot.innerHTML = `
    <main class="app-shell">
      <section class="app-header" aria-labelledby="page-title">
        <div>
          <p class="eyebrow">V2-2 Market Coverage</p>
          <h1 id="page-title">Market Intelligence Dashboard</h1>
          <p class="page-summary">
            Reusable market model foundation with Elf Continent as the first source adapter.
          </p>
        </div>
        <div class="header-actions">
          ${renderLanguageSwitch(appState.locale)}
          <button class="refresh-button" type="button" data-action="refresh" ${isLoading ? "disabled" : ""}>
            ${isLoading ? "Refreshing..." : "Refresh Live Data"}
          </button>
        </div>
      </section>

      ${renderDashboardView(appState.model, appState.status, route)}
      ${renderCategoryFilterView(appState.coverageModel ?? appState.model, appState.selectedCategory)}
      ${renderAnalyticsView(appState.model)}
      ${renderSnapshotExplorerView(appState.model, route, snapshotExplorer, appState.locale)}
      ${renderSignalsView(appState.model)}
      ${renderTransactionsView(appState.model)}
    </main>
  `;

  const localeSelect = appRoot.querySelector("[data-locale-switch]");
  localeSelect?.addEventListener("change", () => {
    appState.locale = normalizeLocale(localeSelect.value);
    writeStoredLocale(appState.locale);
    renderApp();
  });

  const refreshButton = appRoot.querySelector("[data-action='refresh']");
  refreshButton?.addEventListener("click", () => {
    void loadDashboard();
  });

  for (const tab of appRoot.querySelectorAll("[data-category]")) {
    tab.addEventListener("click", () => {
      appState.selectedCategory = tab.dataset.category ?? "all";
      rebuildVisibleModel();
      renderApp();
    });
  }

  const explorerForm = appRoot.querySelector("[data-explorer-search]");
  explorerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(explorerForm);
    const search = String(formData.get("q") ?? "").trim();
    const sort = String(formData.get("sort") ?? "value");
    window.location.hash = buildRouteHash(route, {
      search,
      sort,
      assetId: "",
      actorId: ""
    });
  });
}

function renderLanguageSwitch(locale) {
  const normalizedLocale = normalizeLocale(locale);

  return `
    <label class="language-switch">
      <span>Language</span>
      <select data-locale-switch aria-label="Language">
        ${supportedLocales.map((supportedLocale) => `
          <option value="${supportedLocale}" ${supportedLocale === normalizedLocale ? "selected" : ""}>
            ${localeLabels[supportedLocale] ?? supportedLocale}
          </option>
        `).join("")}
      </select>
    </label>
  `;
}

async function loadDashboard() {
  try {
    setLoading(
      appState,
      "Loading live market transactions...",
      `Requesting ${ELF_MARKET_COVERAGE_ITEMS.length} coverage items.`
    );
    renderApp();

    const sourceSnapshot = await loadElfLiveTransactions(ELF_MARKET_COVERAGE_ITEMS);
    appState.sourceSnapshot = sourceSnapshot;
    appState.selectedCategory = keepValidCategory(appState.selectedCategory, sourceSnapshot.transactions);
    rebuildVisibleModel();

    if (appState.model.transactions.length === 0) {
      setError(appState, new Error("No transactions returned."), "No transactions returned.");
    } else if (sourceSnapshot.partial) {
      setUpdated(
        appState,
        "Partial data loaded. Some items failed.",
        getCoverageDetail(sourceSnapshot)
      );
    } else {
      setUpdated(appState, "Updated from Elf live adapter.", getCoverageDetail(sourceSnapshot));
    }
  } catch (error) {
    setError(appState, error, getStatusMessage(error));
  }

  renderApp();
}

function rebuildVisibleModel() {
  const sourceSnapshot = appState.sourceSnapshot;

  if (!sourceSnapshot) {
    return;
  }

  const transactions = filterTransactionsByCategory(
    sourceSnapshot.transactions,
    appState.selectedCategory
  );

  appState.coverageModel = buildMarketModel(sourceSnapshot.transactions, {
    source: sourceSnapshot.source,
    generatedAt: sourceSnapshot.fetchedAt
  });

  appState.model = buildMarketModel(transactions, {
    source: sourceSnapshot.source,
    generatedAt: sourceSnapshot.fetchedAt
  });
}

function filterTransactionsByCategory(transactions, selectedCategory) {
  if (selectedCategory === "all") {
    return transactions;
  }

  return transactions.filter((transaction) => transaction.asset.category === selectedCategory);
}

function keepValidCategory(selectedCategory, transactions) {
  if (selectedCategory === "all") {
    return selectedCategory;
  }

  return transactions.some((transaction) => transaction.asset.category === selectedCategory)
    ? selectedCategory
    : "all";
}

function getCoverageDetail(sourceSnapshot) {
  const coverage = sourceSnapshot.coverage;

  if (!coverage) {
    return "";
  }

  if (coverage.failedItems > 0) {
    return `${coverage.loadedItems}/${coverage.requestedItems} items loaded, ${coverage.failedItems} failed.`;
  }

  return `${coverage.loadedItems}/${coverage.requestedItems} items loaded.`;
}

function getStatusMessage(error) {
  const messages = {
    token_refresh_failed: "Token refresh failed. Live data is unavailable.",
    item_request_failed: "Item request failed. Live data is unavailable.",
    unexpected_api_response_format: "Unexpected API response format."
  };

  return messages[error?.kind] ?? "Unexpected API response format.";
}

function readStoredLocale() {
  try {
    return normalizeLocale(window.localStorage?.getItem(localeStorageKey) ?? defaultLocale);
  } catch {
    return defaultLocale;
  }
}

function writeStoredLocale(locale) {
  try {
    window.localStorage?.setItem(localeStorageKey, normalizeLocale(locale));
  } catch {
    // Locale persistence is optional; rendering should continue with in-memory state.
  }
}

renderApp();
void loadDashboard();

window.addEventListener("hashchange", () => {
  renderApp();
});
