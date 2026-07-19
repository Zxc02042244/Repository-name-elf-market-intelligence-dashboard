import { createAppState } from "./state.js";
import {
  clearSkinWishlistSelection,
  createSkinWishlistState,
  toggleSkinWishlistSelection
} from "../features/skins/state/skin-wishlist.js";
import {
  COMMUNITY_OPERATIONS,
  createSkinCommunityState,
  forgetSkinCommunityData,
  markSkinCommunityError,
  markSkinCommunityLoading,
  syncSkinCommunityWishlist
} from "../features/skins/state/skin-community-stats.js";
import {
  applySkinSupplyStatsToCatalog,
  createSkinSupplyState,
  loadSkinSupplySnapshots,
  markSkinSupplyError,
  markSkinSupplyLoading
} from "../features/skins/state/skin-supply-stats.js?v=20260713-skins-feature-1";
import { buildRouteHash, getCurrentRoute } from "./router.js";
import { formatNumber } from "../core/utils/numbers.js";
import { getFallbackElfSkins, loadElfSkinCatalog } from "../sources/elf/elf-skins.js";
import {
  createMarketFeatureState,
  renderMarketFeatureView
} from "../features/market/market-feature.js";
import {
  renderElfSkinHomeTabs,
  renderElfSkinLandingView
} from "../features/skins/views/skin-landing-view.js?v=20260713-galactic-cadet-1";
import { defaultLocale, normalizeLocale, supportedLocales, t } from "../i18n/i18n.js";
import { HOME_TABS, PRODUCT_RULES, STORAGE_KEYS } from "../config/product-config.js?v=20260713-mobile-top10-1";

const appState = createAppState();
const appRoot = document.querySelector("#app");
let skinCatalogLoadStarted = false;
let skinCommunitySyncStarted = false;
let skinCommunitySyncQueued = false;
let skinCommunityDeleteInFlight = false;
let skinCommunityForgetQueued = false;
let skinSupplySyncStarted = false;
let pendingUiSnapshot = null;

appState.locale = readStoredLocale();
appState.market = createMarketFeatureState();
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
  appRoot.addEventListener("keydown", handleAppKeydown);
  appRoot.addEventListener("wa-slide-change", handleCarouselSlideChange);
}

function renderApp({ preserveUi = false } = {}) {
  if (!appRoot) {
    return;
  }

  document.documentElement.lang = appState.locale;
  const uiSnapshot = preserveUi ? captureUiSnapshot() : null;
  const route = getCurrentRoute();
  const isHome = route.name === "home";
  appState.skinHomeTab = route.tab;
  const headerCopy = getHeaderCopy(isHome);
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
          ${isHome ? renderHomeHeaderDetails(appState.skinWishlist) : ""}
        </div>
        <div class="header-actions">
          ${!isHome ? renderLanguageSwitch(appState.locale) : ""}
          ${renderRouteTabs(isHome)}
        </div>
        ${isHome ? renderElfSkinHomeTabs(appState.skinHomeTab, appState.locale, "desktop") : ""}
      </section>

      ${isHome ? renderElfSkinLandingView(
        applySkinSupplyStatsToCatalog(appState.skinCatalog, appState.skinSupply),
        withCommunityWishlist(appState.skinWishlist, appState.skinCommunity),
        appState.locale,
        appState.skinHomeTab,
        appState.skinPreviewIds?.[appState.skinHomeTab] ?? "",
        true,
        appState.skinRankingPages?.[appState.skinHomeTab] ?? 0
      ) : `
        <div class="market-dashboard-workspace">
          ${renderMarketFeatureView(appState.market, appState.locale)}
        </div>
      `}
      ${renderMobilePrimaryNavigation(isHome)}
    </main>
  `;

  restoreUiSnapshot(uiSnapshot);

  if (isHome) {
    ensureSkinCatalogLoaded();
    ensureSkinCommunityLoaded();
    ensureSkinSupplyLoaded();
  }
}

function captureUiSnapshot() {
  const activeElement = document.activeElement;
  const carousel = [...appRoot.querySelectorAll(".elf-mobile-champion-carousel")]
    .find((element) => !element.closest('[data-skin-champion-view="mobile"]') || isElementVisible(element));

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
  findElementByIdentity(snapshot.focus)?.focus?.({ preventScroll: true });
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
    ${renderHomeHeaderDetails(appState.skinWishlist)}
    ${renderElfSkinLandingView(
      catalog,
      wishlist,
      appState.locale,
      appState.skinHomeTab,
      appState.skinPreviewIds?.[appState.skinHomeTab] ?? "",
      true,
      appState.skinRankingPages?.[appState.skinHomeTab] ?? 0
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
    void syncSkinCommunity({ userInitiated: true });
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

  const rankingPage = target.closest("[data-skin-ranking-page]");
  if (rankingPage) {
    selectSkinRankingPage(Number(rankingPage.dataset.skinRankingPage));
    return;
  }

  if (target.closest("[data-wishlist-clear]")) {
    appState.skinWishlist = clearSkinWishlistSelection(appState.skinWishlist);
    renderApp();
    void syncSkinCommunity({ userInitiated: true });
    return;
  }

  if (target.closest("[data-community-data-delete]")) {
    if (window.confirm(translate("elfLanding.skinPrivacyDeleteConfirm"))) {
      void forgetSkinCommunity();
    }
    return;
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

function handleAppKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const skinPreview = getEventElement(event);
  if (!(skinPreview instanceof HTMLButtonElement) || !skinPreview.matches("button[data-skin-preview]")) {
    return;
  }

  event.preventDefault();
  selectSkinPreview(skinPreview.dataset.skinPreview);
}

function handleCarouselSlideChange(event) {
  const carousel = getEventElement(event)?.closest(".elf-mobile-champion-carousel");
  const activeSlide = Number(carousel?.activeSlide);

  if (!carousel || !Number.isFinite(activeSlide)) {
    return;
  }

  const currentSlide = carousel
    .closest(".elf-mobile-carousel-shell")
    ?.querySelector("[data-carousel-current]");
  if (currentSlide) {
    currentSlide.textContent = String(activeSlide + 1);
  }

  if (!pendingUiSnapshot) {
    return;
  }

  pendingUiSnapshot = {
    ...pendingUiSnapshot,
    carouselSlide: activeSlide
  };
}

function selectSkinHomeTab(nextTab) {
  if (!HOME_TABS.includes(nextTab)) {
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
  renderApp({ preserveUi: true });
}

function selectSkinRankingPage(page) {
  if (!Number.isInteger(page) || page < 0 || !["wishlist", "supply"].includes(appState.skinHomeTab)) {
    return;
  }

  appState.skinRankingPages = {
    ...appState.skinRankingPages,
    [appState.skinHomeTab]: page
  };
  renderApp({ preserveUi: true });
}

function getEventElement(event) {
  return event.target instanceof Element ? event.target : null;
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

function renderHomeHeaderDetails(wishlistState) {
  const wishlist = normalizeHeaderWishlist(wishlistState);

  return `
    <div class="home-header-details">
      <div class="home-header-summary">
        <p>${translate("elfLanding.summary")}</p>
      </div>
      <div class="home-header-metrics" aria-label="${translate("elfLanding.localStats")}">
        ${renderHomeHeaderMetric(translate("elfLanding.selectedWishes"), translate("elfLanding.wishlistCount", {
          selected: formatNumber(wishlist.selectedIds.length, { locale: appState.locale }),
          limit: formatNumber(PRODUCT_RULES.wishlistLimit, { locale: appState.locale })
        }))}
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
    selectedIds: Array.isArray(wishlistState?.selectedIds)
      ? wishlistState.selectedIds
      : []
  };
}

function normalizeCommunityState(communityState) {
  return {
    status: communityState?.status ?? "disabled",
    syncStatus: communityState?.syncStatus ?? "disabled",
    wishlistLeaders: Array.isArray(communityState?.wishlistLeaders)
      ? communityState.wishlistLeaders
      : []
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

function readStoredLocale() {
  try {
    return normalizeLocale(window.localStorage?.getItem(STORAGE_KEYS.locale) ?? defaultLocale);
  } catch {
    return defaultLocale;
  }
}

function writeStoredLocale(locale) {
  try {
    window.localStorage?.setItem(STORAGE_KEYS.locale, normalizeLocale(locale));
  } catch {
    // Locale persistence is optional; rendering should continue with in-memory state.
  }
}

function translate(key, params) {
  return t(key, appState.locale, params);
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
    || appState.skinCommunity?.status === "forgotten"
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

async function syncSkinCommunity(options = {}) {
  const userInitiated = options.userInitiated === true;
  if (skinCommunitySyncStarted) {
    if (userInitiated) {
      skinCommunitySyncQueued = true;
    }
    return;
  }

  if (appState.skinCommunity?.status === "disabled") {
    return;
  }

  skinCommunitySyncStarted = true;
  appState.skinCommunity = markSkinCommunityLoading(appState.skinCommunity);

  try {
    appState.skinCommunity = await syncSkinCommunityWishlist(
      () => appState.skinWishlist?.selectedIds,
      { allowTerminalRotation: userInitiated }
    );
  } catch (error) {
    appState.skinCommunity = markSkinCommunityError(
      appState.skinCommunity,
      error,
      COMMUNITY_OPERATIONS.sync
    );
  } finally {
    skinCommunitySyncStarted = false;
    if (skinCommunityForgetQueued) {
      skinCommunityForgetQueued = false;
      skinCommunitySyncQueued = false;
      void forgetSkinCommunity();
      return;
    }
    if (skinCommunitySyncQueued) {
      skinCommunitySyncQueued = false;
      void syncSkinCommunity({ userInitiated: true });
      return;
    }
    if (getCurrentRoute().name === "home") {
      refreshHomeDataView();
    }
  }
}

async function forgetSkinCommunity() {
  if (skinCommunitySyncStarted) {
    if (skinCommunityDeleteInFlight) {
      return;
    }
    skinCommunityForgetQueued = true;
    skinCommunitySyncQueued = false;
    return;
  }

  skinCommunitySyncStarted = true;
  skinCommunityDeleteInFlight = true;
  skinCommunitySyncQueued = false;
  skinCommunityForgetQueued = false;
  appState.skinCommunity = markSkinCommunityLoading(appState.skinCommunity);
  let deleteSucceeded = false;

  try {
    appState.skinCommunity = await forgetSkinCommunityData();
    appState.skinWishlist = clearSkinWishlistSelection(appState.skinWishlist);
    deleteSucceeded = true;
  } catch (error) {
    appState.skinCommunity = markSkinCommunityError(
      appState.skinCommunity,
      error,
      COMMUNITY_OPERATIONS.delete
    );
  } finally {
    const shouldSyncLatestWishlist = !deleteSucceeded && skinCommunitySyncQueued;
    skinCommunitySyncQueued = false;
    skinCommunityForgetQueued = false;
    skinCommunityDeleteInFlight = false;
    skinCommunitySyncStarted = false;
    if (shouldSyncLatestWishlist) {
      void syncSkinCommunity({ userInitiated: true });
      return;
    }
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
