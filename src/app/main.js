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
import { defaultLocale, normalizeLocale, supportedLocales, t } from "../i18n/i18n.js";

const appState = createAppState();
const appRoot = document.querySelector("#app");
const localeStorageKey = "marketDashboard.locale";

appState.locale = readStoredLocale();

function renderApp() {
  if (!appRoot) {
    return;
  }

  const route = getCurrentRoute();
  const isLoading = appState.status.kind === "loading";
  const isEmptyError = appState.status.kind === "error"
    && (appState.model?.transactions.length ?? 0) === 0;
  const snapshotExplorer = buildSnapshotExplorer(appState.model, route);
  appRoot.innerHTML = `
    <main class="app-shell">
      <section class="app-header" aria-labelledby="page-title">
        <div>
          <p class="eyebrow">${translate("app.versionEyebrow")}</p>
          <h1 id="page-title">${translate("app.title")}</h1>
          <p class="page-summary">
            ${translate("app.subtitle")}
          </p>
        </div>
        <div class="header-actions">
          ${renderLanguageSwitch(appState.locale)}
          <button class="refresh-button" type="button" data-action="refresh" ${isLoading ? "disabled" : ""}>
            ${isLoading ? translate("action.refreshing") : translate("action.refreshLiveData")}
          </button>
        </div>
      </section>

      ${renderDashboardView(appState.model, appState.status, route, appState.locale)}
      ${isEmptyError ? renderUnavailableWorkspace(appState.locale) : `
        ${renderCategoryFilterView(appState.coverageModel ?? appState.model, appState.selectedCategory, appState.locale)}
        ${renderAnalyticsView(appState.model, appState.locale)}
        ${renderSnapshotExplorerView(appState.model, route, snapshotExplorer, appState.locale)}
        ${renderSignalsView(appState.model, appState.locale)}
        ${renderTransactionsView(appState.model, appState.locale)}
      `}
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

function renderUnavailableWorkspace(locale) {
  return `
    <section class="content-panel unavailable-workspace" aria-labelledby="unavailable-workspace-title">
      <div class="section-heading">
        <h2 id="unavailable-workspace-title">${t("status.liveDataUnavailable", locale)}</h2>
        <span>${t("dashboard.pending", locale)}</span>
      </div>
      <p class="empty-state">
        ${t("status.waitingForData", locale)}
      </p>
      <p class="section-note">
        ${t("search.notHistoricalGlobal", locale)}
      </p>
    </section>
  `;
}

function renderLanguageSwitch(locale) {
  const normalizedLocale = normalizeLocale(locale);

  return `
    <label class="language-switch">
      <span>${translate("language.label")}</span>
      <select data-locale-switch aria-label="${translate("language.label")}">
        ${supportedLocales.map((supportedLocale) => `
          <option value="${supportedLocale}" ${supportedLocale === normalizedLocale ? "selected" : ""}>
            ${t("language.nativeName", supportedLocale)}
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
      translate("status.loadingLiveMarketTransactions"),
      translate("status.requestingCoverageItems", { count: ELF_MARKET_COVERAGE_ITEMS.length })
    );
    renderApp();

    const sourceSnapshot = await loadElfLiveTransactions(ELF_MARKET_COVERAGE_ITEMS);
    appState.sourceSnapshot = sourceSnapshot;
    appState.selectedCategory = keepValidCategory(appState.selectedCategory, sourceSnapshot.transactions);
    rebuildVisibleModel();

    if (appState.model.transactions.length === 0) {
      setError(appState, new Error("No transactions returned."), translate("status.noTransactionsReturned"));
    } else if (sourceSnapshot.partial) {
      setUpdated(
        appState,
        translate("status.partialDataLoaded"),
        getCoverageDetail(sourceSnapshot)
      );
    } else {
      setUpdated(appState, translate("status.updatedFromLiveAdapter"), getCoverageDetail(sourceSnapshot));
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
    return translate("status.itemsLoadedWithFailures", {
      loaded: coverage.loadedItems,
      requested: coverage.requestedItems,
      failed: coverage.failedItems
    });
  }

  return translate("status.itemsLoaded", {
    loaded: coverage.loadedItems,
    requested: coverage.requestedItems
  });
}

function getStatusMessage(error) {
  const messages = {
    token_refresh_failed: translate("status.tokenRefreshFailedLiveUnavailable"),
    item_request_failed: translate("status.itemRequestFailedLiveUnavailable"),
    unexpected_api_response_format: translate("status.unexpectedApiResponseFormat")
  };

  return messages[error?.kind] ?? translate("status.unexpectedApiResponseFormat");
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

function translate(key, params) {
  return t(key, appState.locale, params);
}

renderApp();
void loadDashboard();

window.addEventListener("hashchange", () => {
  renderApp();
});
