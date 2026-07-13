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
import {
  applySkinSupplyStatsToCatalog,
  createSkinSupplyState,
  loadSkinSupplySnapshots,
  markSkinSupplyError,
  markSkinSupplyLoading
} from "./skin-supply-stats.js?v=20260710-hourly-supply-action";
import { buildRouteHash, getCurrentRoute } from "./router.js";
import { buildMarketModel } from "../core/data/market-model.js";
import { buildSnapshotExplorer } from "../core/analytics/snapshot-details.js";
import { formatNumber } from "../core/utils/numbers.js";
import { loadElfLiveTransactions, loadElfMockMarketTransactions } from "../sources/elf/elf-api.js";
import { ELF_MARKET_COVERAGE_ITEMS } from "../sources/elf/elf-items.js";
import { getFallbackElfSkins, loadElfSkinCatalog } from "../sources/elf/elf-skins.js";
import { renderCategoryFilterView } from "../views/category-filter-view.js";
import { renderDashboardView } from "../views/dashboard-view.js?v=20260710-source-disclosure";
import { renderTransactionsView } from "../views/transactions-view.js";
import { renderAnalyticsView } from "../views/analytics-view.js";
import { renderSnapshotExplorerView } from "../views/snapshot-explorer-view.js";
import { renderSignalsView } from "../views/signals-view.js";
import {
  renderElfSkinHomeTabs,
  renderElfSkinLandingView
} from "../views/elf-skin-landing-view.js?v=20260713-trailblazer-frame-1";
import { defaultLocale, normalizeLocale, supportedLocales, t } from "../i18n/i18n.js";

const appState = createAppState();
const appRoot = document.querySelector("#app");
const localeStorageKey = "marketDashboard.locale";
const skinWishlistLimit = 3;
const skinHomeTabs = new Set(["wishlist", "supply", "gallery"]);
let dashboardLoadStarted = false;
let skinCatalogLoadStarted = false;
let skinCommunitySyncStarted = false;
let skinSupplySyncStarted = false;
let dashboardSectionObserver = null;
let pendingUiSnapshot = null;

appState.locale = readStoredLocale();
appState.skinWishlist = createSkinWishlistState();
appState.skinCommunity = createSkinCommunityState();
appState.skinSupply = createSkinSupplyState();
appState.skinCatalog = {
  kind: "fallback",
  source: "CiDi official fallback skins",
  serverTime: "",
  skins: getFallbackElfSkins(),
  error: null
};

if (appRoot) {
  appRoot.addEventListener("click", handleAppClick);
  appRoot.addEventListener("change", handleAppChange);
  appRoot.addEventListener("submit", handleAppSubmit);
  appRoot.addEventListener("keydown", handleAppKeydown);
  appRoot.addEventListener("wa-slide-change", handleCarouselSlideChange);
}

function renderApp({ preserveUi = false } = {}) {
  if (!appRoot) {
    return;
  }

  const uiSnapshot = preserveUi ? captureUiSnapshot() : null;
  const route = getCurrentRoute();
  const isHome = route.name === "home";
  appState.skinHomeTab = route.tab;
  const headerCopy = getHeaderCopy(isHome);
  const isLoading = appState.status.kind === "loading";
  const isEmptyError = appState.status.kind === "error"
    && (appState.model?.transactions.length ?? 0) === 0;
  const snapshotExplorer = buildSnapshotExplorer(appState.model, route);
  appRoot.innerHTML = `
    <main class="app-shell ${isHome ? "app-shell-home" : ""}" id="main-content" tabindex="-1">
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
          ${!isHome ? renderLanguageSwitch(appState.locale) : ""}
          ${renderRouteTabs(isHome)}
          ${!isHome ? `
            <button class="refresh-button" type="button" data-action="refresh" ${isLoading ? "disabled" : ""}>
              ${isLoading ? translate("action.refreshing") : translate("action.refreshLiveData")}
            </button>
          ` : ""}
        </div>
        ${isHome ? renderElfSkinHomeTabs(appState.skinHomeTab, appState.locale, "desktop") : ""}
      </section>

      ${isHome ? renderElfSkinLandingView(
        applySkinSupplyStatsToCatalog(appState.skinCatalog, appState.skinSupply),
        withCommunityWishlist(appState.skinWishlist, appState.skinCommunity),
        appState.locale,
        appState.skinHomeTab,
        appState.skinPreviewIds?.[appState.skinHomeTab] ?? "",
        true
      ) : `
        ${renderDashboardNavigation()}
        <div class="market-dashboard-workspace">
          ${renderDashboardView(appState.model, appState.status, route, appState.locale)}
          ${isEmptyError ? renderUnavailableWorkspace(appState.locale) : `
            ${renderCategoryFilterView(appState.coverageModel ?? appState.model, appState.selectedCategory, appState.locale)}
            <div class="market-analytics-grid">
              ${renderAnalyticsView(appState.model, appState.locale)}
            </div>
            ${renderSnapshotExplorerView(appState.model, route, snapshotExplorer, appState.locale)}
            <div class="market-lower-grid">
              ${renderSignalsView(appState.model, appState.locale)}
              ${renderTransactionsView(appState.model, route, appState.locale)}
            </div>
          `}
        </div>
      `}
      ${renderMobilePrimaryNavigation(isHome)}
    </main>
  `;

  setupDashboardSectionObserver();
  restoreUiSnapshot(uiSnapshot);

  if (isHome) {
    ensureSkinCatalogLoaded();
    ensureSkinCommunityLoaded();
    ensureSkinSupplyLoaded();
  } else {
    ensureDashboardLoaded();
  }
}

function captureUiSnapshot() {
  const activeElement = document.activeElement;
  const carousel = [...appRoot.querySelectorAll(".elf-mobile-champion-carousel")]
    .find((element) => !element.closest('[data-view="mobile"]') || isElementVisible(element));

  return {
    carouselSlide: pendingUiSnapshot?.carouselSlide ?? (Number.isFinite(Number(carousel?.activeSlide))
      ? Number(carousel.activeSlide)
      : 0),
    focus: getElementIdentity(activeElement) ?? pendingUiSnapshot?.focus ?? null,
    scrollX: pendingUiSnapshot?.scrollX ?? window.scrollX,
    scrollY: pendingUiSnapshot?.scrollY ?? window.scrollY
  };
}

function restoreUiSnapshot(snapshot) {
  if (!snapshot) {
    return;
  }

  pendingUiSnapshot = snapshot;
  const restore = () => {
    const carousel = [...appRoot.querySelectorAll(".elf-mobile-champion-carousel")]
      .find((element) => isElementVisible(element));
    carousel?.goToSlide?.(snapshot.carouselSlide, "auto");

    const focusTarget = findElementByIdentity(snapshot.focus);
    focusTarget?.focus?.({ preventScroll: true });
    window.scrollTo(snapshot.scrollX, snapshot.scrollY);
    if (pendingUiSnapshot === snapshot) {
      pendingUiSnapshot = null;
    }
  };

  if (window.customElements?.whenDefined) {
    void window.customElements.whenDefined("wa-carousel").then(async () => {
      const carousel = [...appRoot.querySelectorAll(".elf-mobile-champion-carousel")]
        .find((element) => isElementVisible(element));
      await carousel?.updateComplete;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(restore);
      });
    });
  } else {
    window.requestAnimationFrame(restore);
  }
}

function refreshHomeDataView() {
  if (!appRoot || getCurrentRoute().name !== "home") {
    return;
  }

  const snapshot = captureUiSnapshot();
  const currentWorkspace = appRoot.querySelector(".elf-home-workspace");
  const currentFooter = appRoot.querySelector(".elf-home-footer");
  const currentHeaderDetails = appRoot.querySelector(".home-header-details");
  const template = document.createElement("template");
  const catalog = applySkinSupplyStatsToCatalog(appState.skinCatalog, appState.skinSupply);
  const wishlist = withCommunityWishlist(appState.skinWishlist, appState.skinCommunity);

  template.innerHTML = `
    ${renderHomeHeaderDetails(appState.skinWishlist, appState.skinCommunity)}
    ${renderElfSkinLandingView(
      catalog,
      wishlist,
      appState.locale,
      appState.skinHomeTab,
      appState.skinPreviewIds?.[appState.skinHomeTab] ?? "",
      true
    )}
  `;

  const nextWorkspace = template.content.querySelector(".elf-home-workspace");
  const nextFooter = template.content.querySelector(".elf-home-footer");
  const nextHeaderDetails = template.content.querySelector(".home-header-details");
  const currentCarousel = currentWorkspace?.querySelector(".elf-mobile-champion-carousel");
  const nextCarousel = nextWorkspace?.querySelector(".elf-mobile-champion-carousel");

  if (currentCarousel && nextCarousel) {
    currentCarousel.replaceChildren(...nextCarousel.childNodes);
    nextCarousel.replaceWith(currentCarousel);
  }

  if (currentWorkspace && nextWorkspace) {
    currentWorkspace.replaceWith(nextWorkspace);
  }

  if (currentFooter && nextFooter) {
    currentFooter.replaceWith(nextFooter);
  }

  if (currentHeaderDetails && nextHeaderDetails) {
    currentHeaderDetails.replaceWith(nextHeaderDetails);
  }

  restoreUiSnapshot(snapshot);
}

function getElementIdentity(element) {
  if (!(element instanceof Element) || element === document.body) {
    return null;
  }

  const attributes = [
    "id",
    "data-action",
    "data-locale-switch",
    "data-wishlist-toggle",
    "data-wishlist-clear",
    "data-skin-home-tab",
    "data-skin-preview",
    "data-category",
    "name",
    "href"
  ];

  for (const attribute of attributes) {
    if (element.hasAttribute(attribute)) {
      return {
        attribute,
        tagName: element.tagName,
        value: element.getAttribute(attribute)
      };
    }
  }

  return null;
}

function findElementByIdentity(identity) {
  if (!identity) {
    return null;
  }

  return [...appRoot.querySelectorAll(identity.tagName.toLowerCase())]
    .find((element) => element.getAttribute(identity.attribute) === identity.value && isElementVisible(element))
    ?? null;
}

function isElementVisible(element) {
  return element instanceof Element && element.getClientRects().length > 0;
}

function handleAppClick(event) {
  const target = getEventElement(event);

  if (!target) {
    return;
  }

  const wishlistButton = target.closest("[data-wishlist-toggle]");
  if (wishlistButton) {
    event.stopPropagation();
    appState.skinWishlist = toggleSkinWishlistSelection(
      appState.skinWishlist,
      wishlistButton.dataset.wishlistToggle
    );
    renderApp({ preserveUi: true });
    void syncSkinCommunity();
    return;
  }

  const refreshButton = target.closest("[data-action='refresh']");
  if (refreshButton) {
    if (!refreshButton.hasAttribute("disabled")) {
      void loadDashboard();
    }
    return;
  }

  const skinHomeTab = target.closest("[data-skin-home-tab]");
  if (skinHomeTab) {
    event.preventDefault();
    selectSkinHomeTab(skinHomeTab.dataset.skinHomeTab);
    return;
  }

  const skinPreview = target.closest("[data-skin-preview]");
  if (skinPreview) {
    selectSkinPreview(skinPreview.dataset.skinPreview);
    return;
  }

  if (target.closest("[data-wishlist-clear]")) {
    appState.skinWishlist = clearSkinWishlistSelection(appState.skinWishlist);
    renderApp();
    void syncSkinCommunity();
    return;
  }

  const categoryTab = target.closest("[data-category]");
  if (categoryTab) {
    appState.selectedCategory = categoryTab.dataset.category ?? "all";
    rebuildVisibleModel();
    renderApp();
  }
}

function handleAppChange(event) {
  const localeSelect = getEventElement(event)?.closest("[data-locale-switch]");

  if (!localeSelect) {
    return;
  }

  appState.locale = normalizeLocale(localeSelect.value);
  writeStoredLocale(appState.locale);
  renderApp({ preserveUi: true });
}

function handleAppSubmit(event) {
  const explorerForm = getEventElement(event)?.closest("[data-explorer-search]");

  if (!explorerForm) {
    return;
  }

  event.preventDefault();
  const route = getCurrentRoute();
  const formData = new FormData(explorerForm);
  window.location.hash = buildRouteHash(route, {
    search: String(formData.get("q") ?? "").trim(),
    sort: String(formData.get("sort") ?? "value"),
    assetId: "",
    actorId: ""
  });
}

function handleAppKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const skinPreview = getEventElement(event)?.closest("[data-skin-preview]");
  if (!skinPreview) {
    return;
  }

  event.preventDefault();
  selectSkinPreview(skinPreview.dataset.skinPreview);
}

function handleCarouselSlideChange(event) {
  const carousel = getEventElement(event)?.closest(".elf-mobile-champion-carousel");
  const activeSlide = Number(carousel?.activeSlide);

  if (!carousel || !Number.isFinite(activeSlide) || !pendingUiSnapshot) {
    return;
  }

  pendingUiSnapshot = {
    ...pendingUiSnapshot,
    carouselSlide: activeSlide
  };
}

function selectSkinHomeTab(nextTab) {
  if (!skinHomeTabs.has(nextTab)) {
    return;
  }

  const route = getCurrentRoute();
  const nextHash = buildRouteHash(route, {
    name: "home",
    tab: nextTab,
    search: "",
    sort: "value",
    assetId: "",
    actorId: ""
  });

  appState.skinHomeTab = nextTab;
  if (window.location.hash === nextHash) {
    renderApp();
  } else {
    window.location.hash = nextHash;
  }
}

function selectSkinPreview(skinId) {
  if (!skinId || !["wishlist", "supply"].includes(appState.skinHomeTab)) {
    return;
  }

  appState.skinPreviewIds = {
    ...appState.skinPreviewIds,
    [appState.skinHomeTab]: skinId
  };
  renderApp();
}

function getEventElement(event) {
  return event.target instanceof Element ? event.target : null;
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
    <nav class="dashboard-nav" aria-label="Dashboard sections" data-dashboard-nav>
      ${links.map(([href, label], index) => `
        <a href="${href}" ${index === 0 ? 'aria-current="location"' : ""}>${label}</a>
      `).join("")}
    </nav>
  `;
}

function renderMobilePrimaryNavigation(isHome) {
  return `
    <nav class="mobile-primary-nav" aria-label="${translate("elfLanding.primaryNavigation")}">
      <a href="#home" ${isHome ? 'aria-current="page"' : ""}>
        ${renderMobileNavigationIcon("skins")}
        ${translate("elfLanding.siteShortTitle")}
      </a>
      <a href="#market" ${!isHome ? 'aria-current="page"' : ""}>
        ${renderMobileNavigationIcon("market")}
        ${translate("elfLanding.analyzeMarket")}
      </a>
    </nav>
  `;
}

function renderMobileNavigationIcon(kind) {
  if (kind === "market") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.4 4.9L20 9l-4 3.9.9 5.6L12 16l-4.9 2.5.9-5.6L4 9l5.6-1.1L12 3Z" />
    </svg>
  `;
}

function renderRouteTabs(isHome) {
  if (isHome) {
    return `
      <a class="route-market-link" href="#market">
        ${translate("elfLanding.analyzeMarket")}
      </a>
    `;
  }

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

  return `
    <div class="home-header-details">
      <div class="home-header-summary">
        <p>${translate("elfLanding.summary")}</p>
      </div>
      <div class="home-header-metrics" aria-label="${translate("elfLanding.localStats")}">
        ${renderHomeHeaderMetric(translate("elfLanding.selectedWishes"), translate("elfLanding.wishlistCount", {
          selected: formatNumber(wishlist.selectedIds.length),
          limit: formatNumber(skinWishlistLimit)
        }))}
        ${renderHomeHeaderMetric(translate("elfLanding.localVisitors"), formatNumber(visitorCount))}
        <button class="home-header-edit-wishes" type="button" data-skin-home-tab="gallery">
          ${translate("elfLanding.editWishes")}
        </button>
        ${renderLanguageSwitch(appState.locale)}
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
      subtitle: translate("elfLanding.communityDisclaimer")
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

function setupDashboardSectionObserver() {
  dashboardSectionObserver?.disconnect();
  dashboardSectionObserver = null;

  const navigation = appRoot?.querySelector("[data-dashboard-nav]");
  if (!navigation || typeof IntersectionObserver === "undefined") {
    return;
  }

  const links = [...navigation.querySelectorAll("a")];
  dashboardSectionObserver = new IntersectionObserver((entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

    if (!visibleEntry) {
      return;
    }

    for (const link of links) {
      const isCurrent = link.getAttribute("href") === `#${visibleEntry.target.id}`;
      if (isCurrent) {
        link.setAttribute("aria-current", "location");
        link.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }, {
    rootMargin: "-18% 0px -68%",
    threshold: 0
  });

  for (const link of links) {
    const target = appRoot.querySelector(link.getAttribute("href"));
    if (target) {
      dashboardSectionObserver.observe(target);
    }
  }
}

async function loadDashboard() {
  try {
    setLoading(
      appState,
      translate("status.loadingLiveMarketTransactions"),
      translate("status.requestingCoverageItems", { count: ELF_MARKET_COVERAGE_ITEMS.length })
    );
    renderApp({ preserveUi: true });

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

  renderApp({ preserveUi: true });
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
      void loadSkinSupply();
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
        refreshHomeDataView();
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

function ensureSkinSupplyLoaded() {
  if (
    skinSupplySyncStarted
    || appState.skinSupply?.status === "remote"
    || appState.skinSupply?.status === "disabled"
    || appState.skinSupply?.status === "error"
    || appState.skinCatalog?.kind !== "api"
  ) {
    return;
  }

  void loadSkinSupply();
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
      refreshHomeDataView();
    }
  }
}

async function loadSkinSupply() {
  if (
    skinSupplySyncStarted
    || appState.skinSupply?.status === "disabled"
    || appState.skinCatalog?.kind !== "api"
  ) {
    return;
  }

  skinSupplySyncStarted = true;
  appState.skinSupply = markSkinSupplyLoading(appState.skinSupply);

  try {
    appState.skinSupply = await loadSkinSupplySnapshots();
  } catch (error) {
    appState.skinSupply = markSkinSupplyError(appState.skinSupply, error);
  } finally {
    skinSupplySyncStarted = false;
    if (getCurrentRoute().name === "home") {
      refreshHomeDataView();
    }
  }
}

renderApp();

window.addEventListener("hashchange", () => {
  renderApp();
});
