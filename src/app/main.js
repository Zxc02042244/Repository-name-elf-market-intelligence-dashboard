import { createAppState, setError, setFallback, setLoading, setUpdated } from "./state.js";
import {
  clearSkinWishlistSelection,
  createSkinWishlistState,
  toggleSkinWishlistSelection
} from "./skin-wishlist.js";
import {
  createSkinCommunityState,
  markSkinCommunityError,
  markSkinCommunityLoading,
  syncSkinCommunityWishlist
} from "./skin-community-stats.js";
import { buildRouteHash, getCurrentRoute } from "./router.js";
import { buildMarketModel } from "../core/data/market-model.js";
import { buildSnapshotExplorer } from "../core/analytics/snapshot-details.js";
import { formatNumber } from "../core/utils/numbers.js";
import { loadElfLiveTransactions, loadElfMockMarketTransactions } from "../sources/elf/elf-api.js";
import { ELF_MARKET_COVERAGE_ITEMS } from "../sources/elf/elf-items.js";
import { getFallbackElfSkins, loadElfSkinCatalog } from "../sources/elf/elf-skins.js";
import { renderCategoryFilterView } from "../views/category-filter-view.js";
import { renderDashboardView } from "../views/dashboard-view.js";
import { renderTransactionsView } from "../views/transactions-view.js";
import { renderAnalyticsView } from "../views/analytics-view.js";
import { renderSnapshotExplorerView } from "../views/snapshot-explorer-view.js";
import { renderSignalsView } from "../views/signals-view.js";
import { renderElfSkinLandingView } from "../views/elf-skin-landing-view.js?v=20260709-flame-frame-hard-refresh";
import { defaultLocale, normalizeLocale, supportedLocales, t } from "../i18n/i18n.js";

const appState = createAppState();
const appRoot = document.querySelector("#app");
const localeStorageKey = "marketDashboard.locale";
const skinWishlistLimit = 3;
let dashboardLoadStarted = false;
let skinCatalogLoadStarted = false;
let skinCommunitySyncStarted = false;

appState.locale = readStoredLocale();
appState.skinWishlist = createSkinWishlistState();
appState.skinCommunity = createSkinCommunityState();
appState.skinCatalog = {
  kind: "fallback",
  source: "CiDi official fallback skins",
  serverTime: "",
  skins: getFallbackElfSkins(),
  error: null
};

function renderApp() {
  if (!appRoot) {
    return;
  }

  const route = getCurrentRoute();
  const isHome = route.name === "home";
  const headerCopy = getHeaderCopy(isHome);
  const isLoading = appState.status.kind === "loading";
  const isEmptyError = appState.status.kind === "error"
    && (appState.model?.transactions.length ?? 0) === 0;
  const snapshotExplorer = buildSnapshotExplorer(appState.model, route);
  appRoot.innerHTML = `
    <main class="app-shell" id="main-content" tabindex="-1">
      <section class="app-header ${isHome ? "app-header-skins" : ""}" aria-labelledby="page-title">
        <div class="header-copy">
          <div class="ledger-rail" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p class="eyebrow">${headerCopy.eyebrow}</p>
          <h1 id="page-title">${headerCopy.title}</h1>
          <p class="page-summary">
            ${headerCopy.subtitle}
          </p>
          ${isHome ? renderHomeHeaderDetails(appState.skinWishlist, appState.skinCommunity) : ""}
        </div>
        <div class="header-actions">
          ${renderLanguageSwitch(appState.locale)}
          ${renderRouteTabs(isHome)}
          ${!isHome ? `
            <button class="refresh-button" type="button" data-action="refresh" ${isLoading ? "disabled" : ""}>
              ${isLoading ? translate("action.refreshing") : translate("action.refreshLiveData")}
            </button>
          ` : ""}
        </div>
      </section>

      ${isHome ? renderElfSkinLandingView(appState.skinCatalog, withCommunityWishlist(appState.skinWishlist, appState.skinCommunity), appState.locale) : `
        ${renderDashboardNavigation()}
        ${renderDashboardView(appState.model, appState.status, route, appState.locale)}
        ${isEmptyError ? renderUnavailableWorkspace(appState.locale) : `
          ${renderCategoryFilterView(appState.coverageModel ?? appState.model, appState.selectedCategory, appState.locale)}
          ${renderAnalyticsView(appState.model, appState.locale)}
          ${renderSnapshotExplorerView(appState.model, route, snapshotExplorer, appState.locale)}
          ${renderSignalsView(appState.model, appState.locale)}
          ${renderTransactionsView(appState.model, route, appState.locale)}
        `}
      `}
    </main>
  `;

  const localeSelect = appRoot.querySelector("[data-locale-switch]");
  localeSelect?.addEventListener("change", () => {
    appState.locale = normalizeLocale(localeSelect.value);
    writeStoredLocale(appState.locale);
    renderApp();
  });

  for (const refreshButton of appRoot.querySelectorAll("[data-action='refresh']")) {
    refreshButton.addEventListener("click", () => {
      if (refreshButton.hasAttribute("disabled")) {
        return;
      }

      void loadDashboard();
    });
  }

  for (const wishlistButton of appRoot.querySelectorAll("[data-wishlist-toggle]")) {
    wishlistButton.addEventListener("click", () => {
      appState.skinWishlist = toggleSkinWishlistSelection(
        appState.skinWishlist,
        wishlistButton.dataset.wishlistToggle
      );
      renderApp();
      void syncSkinCommunity();
    });
  }

  const wishlistClearButton = appRoot.querySelector("[data-wishlist-clear]");
  wishlistClearButton?.addEventListener("click", () => {
    appState.skinWishlist = clearSkinWishlistSelection(appState.skinWishlist);
    renderApp();
    void syncSkinCommunity();
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

  if (isHome) {
    ensureSkinCatalogLoaded();
    ensureSkinCommunityLoaded();
  } else {
    ensureDashboardLoaded();
  }
}

function renderDashboardNavigation() {
  const links = [
    ["#market-overview", translate("dashboard.marketTotals")],
    ["#asset-coverage", translate("coverage.assetCoverage")],
    ["#activity-summary-title", translate("analytics.marketActivitySummary")],
    ["#snapshot-explorer-title", translate("snapshot.searchTitle")],
    ["#recent-transactions-title", translate("transactions.recentTransactions")]
  ];

  return `
    <nav class="dashboard-nav" aria-label="Dashboard sections">
      ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
    </nav>
  `;
}

function renderRouteTabs(isHome) {
  const tabs = [
    ["#home", translate("elfLanding.siteShortTitle"), isHome],
    ["#market", translate("elfLanding.analyzeMarket"), !isHome]
  ];

  return `
    <nav class="route-tabs" aria-label="${translate("elfLanding.primaryNavigation")}">
      ${tabs.map(([href, label, active]) => `
        <a href="${href}" ${active ? "aria-current=\"page\"" : ""}>${label}</a>
      `).join("")}
    </nav>
  `;
}

function renderHomeHeaderDetails(wishlistState, communityState) {
  const wishlist = normalizeHeaderWishlist(wishlistState);
  const community = normalizeCommunityState(communityState);
  const visitorCount = community.visitorCount ?? wishlist.visitorCount;
  const visitorCopy = getVisitorMetricCopy(appState.locale, community.status);

  return `
    <div class="home-header-details">
      <div class="home-header-summary">
        <p>${translate("elfLanding.summary")}</p>
        <a class="utility-link" href="https://www.cidi.games/#/elf" target="_blank" rel="noreferrer">
          ${translate("elfLanding.officialPage")}
        </a>
      </div>
      <div class="home-header-metrics" aria-label="${translate("elfLanding.localStats")}">
        ${renderHomeHeaderMetric(
          visitorCopy.label,
          formatNumber(visitorCount),
          visitorCopy.detail
        )}
        ${renderHomeHeaderMetric(translate("elfLanding.selectedWishes"), translate("elfLanding.wishlistCount", {
          selected: formatNumber(wishlist.selectedIds.length),
          limit: formatNumber(skinWishlistLimit)
        }))}
        ${renderHomeHeaderMetric(translate("elfLanding.skinRanking"), translate("elfLanding.rankedBySupply"))}
      </div>
    </div>
  `;
}

function withCommunityWishlist(wishlistState, communityState) {
  return {
    ...wishlistState,
    community: normalizeCommunityState(communityState)
  };
}

function renderHomeHeaderMetric(label, value, detail = "") {
  return `
    <div class="home-header-metric">
      <span>${label}</span>
      <strong>${value}</strong>
      ${detail ? `<small>${detail}</small>` : ""}
    </div>
  `;
}

function normalizeHeaderWishlist(wishlistState) {
  return {
    visitorCount: Number.isFinite(Number(wishlistState?.visitorCount))
      ? Number(wishlistState.visitorCount)
      : 0,
    selectedIds: Array.isArray(wishlistState?.selectedIds)
      ? wishlistState.selectedIds
      : []
  };
}

function normalizeCommunityState(communityState) {
  const visitorCount = Number(communityState?.visitorCount);

  return {
    status: communityState?.status ?? "disabled",
    visitorCount: Number.isFinite(visitorCount) && visitorCount > 0
      ? Math.floor(visitorCount)
      : null,
    wishlistLeaders: Array.isArray(communityState?.wishlistLeaders)
      ? communityState.wishlistLeaders
      : []
  };
}

function getVisitorMetricCopy(locale, communityStatus) {
  if (communityStatus === "remote" || communityStatus === "loading") {
    return locale === "zh-Hant"
      ? {
        label: "全站來訪",
        detail: "每個瀏覽器匿名計一次"
      }
      : {
        label: "Community visitors",
        detail: "One anonymous browser counts once"
      };
  }

  return {
    label: translate("elfLanding.localVisitors"),
    detail: translate("elfLanding.localVisitorsHint")
  };
}

function getHeaderCopy(isHome) {
  if (isHome) {
    return {
      eyebrow: translate("elfLanding.siteEyebrow"),
      title: translate("elfLanding.siteTitle"),
      subtitle: translate("elfLanding.siteSubtitle")
    };
  }

  return {
    eyebrow: translate("app.versionEyebrow"),
    title: translate("app.title"),
    subtitle: translate("app.subtitle")
  };
}

function renderUnavailableWorkspace(locale) {
  return `
    <section class="content-panel unavailable-workspace" aria-labelledby="unavailable-workspace-title">
      <div class="section-heading">
        <h2 id="unavailable-workspace-title">${t("status.liveDataUnavailable", locale)}</h2>
        <span>${t("dashboard.pending", locale)}</span>
      </div>
      <div class="unavailable-workspace-body">
        <p class="empty-state unavailable-primary">
          ${t("status.waitingForData", locale)}
        </p>
        <div class="unavailable-checklist" aria-label="${t("dashboard.modelSnapshot", locale)}">
          ${renderUnavailableCheck(t("dashboard.modelSnapshot", locale), t("dashboard.pending", locale))}
          ${renderUnavailableCheck(t("transactions.recentLoadedTransactions", locale), t("status.noTransactionsReturned", locale))}
        </div>
        <div class="unavailable-actions">
          <button class="refresh-button" type="button" data-action="refresh">
            ${t("action.refreshLiveData", locale)}
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderUnavailableCheck(label, value) {
  return `
    <div class="unavailable-check">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
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
    try {
      await loadDemoFallback(error);
    } catch (fallbackError) {
      setError(appState, fallbackError, getStatusMessage(error));
    }
  }

  renderApp();
}

async function loadDemoFallback(liveError) {
  const sourceSnapshot = await loadElfMockMarketTransactions();
  appState.sourceSnapshot = sourceSnapshot;
  appState.selectedCategory = keepValidCategory(appState.selectedCategory, sourceSnapshot.transactions);
  rebuildVisibleModel();
  setFallback(
    appState,
    liveError,
    translate("status.liveUnavailableShowingDemoSnapshot"),
    translate("status.liveSourceFailed", { reason: getStatusMessage(liveError) })
  );
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

function ensureDashboardLoaded() {
  if (dashboardLoadStarted || appState.sourceSnapshot) {
    return;
  }

  dashboardLoadStarted = true;
  void loadDashboard().finally(() => {
    dashboardLoadStarted = false;
  });
}

function ensureSkinCatalogLoaded() {
  if (
    skinCatalogLoadStarted
    || appState.skinCatalog?.kind === "api"
    || appState.skinCatalog?.error
  ) {
    return;
  }

  skinCatalogLoadStarted = true;
  appState.skinCatalog = {
    ...appState.skinCatalog,
    kind: "loading",
    error: null
  };

  void loadElfSkinCatalog()
    .then((skinCatalog) => {
      appState.skinCatalog = {
        kind: "api",
        source: skinCatalog.source,
        serverTime: skinCatalog.serverTime,
        fetchedAt: skinCatalog.fetchedAt,
        skins: skinCatalog.skins,
        error: null
      };
    })
    .catch((error) => {
      appState.skinCatalog = {
        kind: "fallback",
        source: "CiDi official fallback skins",
        serverTime: "",
        skins: getFallbackElfSkins(),
        error
      };
    })
    .finally(() => {
      skinCatalogLoadStarted = false;
      if (getCurrentRoute().name === "home") {
        renderApp();
      }
    });
}

function ensureSkinCommunityLoaded() {
  if (
    skinCommunitySyncStarted
    || appState.skinCommunity?.status === "remote"
    || appState.skinCommunity?.status === "disabled"
    || appState.skinCommunity?.status === "error"
  ) {
    return;
  }

  void syncSkinCommunity();
}

async function syncSkinCommunity() {
  if (
    skinCommunitySyncStarted
    || appState.skinCommunity?.status === "disabled"
  ) {
    return;
  }

  skinCommunitySyncStarted = true;
  appState.skinCommunity = markSkinCommunityLoading(appState.skinCommunity);

  try {
    appState.skinCommunity = await syncSkinCommunityWishlist(appState.skinWishlist?.selectedIds);
  } catch (error) {
    appState.skinCommunity = markSkinCommunityError(appState.skinCommunity, error);
  } finally {
    skinCommunitySyncStarted = false;
    if (getCurrentRoute().name === "home") {
      renderApp();
    }
  }
}

renderApp();

window.addEventListener("hashchange", () => {
  renderApp();
});
