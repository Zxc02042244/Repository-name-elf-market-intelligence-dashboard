import { formatNumber } from "../../../core/utils/numbers.js";
import { defaultLocale, t } from "../../../i18n/i18n.js";
import { PRODUCT_RULES } from "../../../config/product-config.js?v=20260713-mobile-top10-1";
import { getSkinClassNames } from "./champion-card-view.js?v=20260713-galactic-cadet-1";
import { renderDesktopChampionView } from "./desktop-champion-view.js";
import { renderMobileChampionView } from "./mobile-champion-view.js";

export function renderElfSkinLandingView(
  skinCatalog,
  wishlistState,
  locale = defaultLocale,
  activeTab = "wishlist",
  selectedPreviewId = "",
  includeTabs = true,
  rankingPage = 0
) {
  const catalog = normalizeCatalog(skinCatalog);
  const wishlist = normalizeWishlist(wishlistState);
  const currentTab = normalizeHomeTab(activeTab);
  const supplyLeaders = catalog.skins;
  const wishlistLeaders = getWishlistLeaders(catalog.skins, wishlist);
  const todayAddedLeaders = getTodayAddedLeaders(catalog.skins);
  const topSupply = supplyLeaders[0]?.quantity ?? 0;
  const topTodayAdded = todayAddedLeaders[0]?.todayAdded ?? 0;

  return `
    <section class="elf-home-workspace" aria-label="${t("elfLanding.rankingShowcase", locale)}">
      ${includeTabs ? renderElfSkinHomeTabs(currentTab, locale) : ""}
      ${currentTab === "wishlist" ? renderWishlistTab(catalog.skins, wishlistLeaders, wishlist, locale, selectedPreviewId, rankingPage) : ""}
      ${currentTab === "supply" ? renderSupplyTab(supplyLeaders, topSupply, todayAddedLeaders, topTodayAdded, locale, selectedPreviewId, rankingPage) : ""}
      ${currentTab === "gallery" ? renderSupplyDataAndOfficialTab(catalog, wishlist, todayAddedLeaders, topTodayAdded, locale) : ""}
    </section>

    ${renderSkinFooter(catalog, wishlist, locale)}
  `;
}

export function renderElfSkinHomeTabs(activeTab, locale = defaultLocale, placement = "content") {
  const tabs = [
    ["wishlist", skinLandingText("homeTabWishlist", locale)],
    ["supply", skinLandingText("homeTabSupply", locale)],
    ["gallery", placement === "desktop"
      ? skinLandingText("homeTabSupplyData", locale)
      : skinLandingText("homeTabOfficial", locale)]
  ];

  return `
    <nav class="elf-home-tabs elf-home-tabs-${placement === "desktop" ? "desktop" : "content"}" aria-label="${t("elfLanding.skinGallery", locale)}">
      ${tabs.map(([tab, label]) => `
        <a
          class="elf-home-tab ${tab === activeTab ? "elf-home-tab-active" : ""}"
          href="${buildHomeTabHash(tab)}"
          data-skin-home-tab="${tab}"
          ${tab === activeTab ? "aria-current=\"page\"" : ""}
        >
          ${label}
        </a>
      `).join("")}
    </nav>
  `;
}

function buildHomeTabHash(tab) {
  return tab === "wishlist" ? "#home" : `#home&tab=${tab}`;
}

function renderWishlistTab(skins, wishlistLeaders, wishlist, locale, selectedPreviewId, rankingPage) {
  const wishlistCatalog = getWishlistCatalog(skins, wishlistLeaders, wishlist);
  const wishlistSlots = wishlistCatalog.slice(0, PRODUCT_RULES.mobileChampionLimit);
  const desktopPage = getDesktopRankingPage(wishlistCatalog, rankingPage);
  const topWishCount = Math.max(1, ...wishlistCatalog.map((skin) => skin?.wishCount ?? 0));
  const wishlistChampion = wishlistCatalog.find((skin) => skin?.id === selectedPreviewId)
    ?? wishlistLeaders[0]
    ?? wishlistCatalog[0]
    ?? null;
  const championIndex = Math.max(0, wishlistCatalog.findIndex((skin) => skin?.id === wishlistChampion?.id));
  const championRank = `TOP ${championIndex + 1}`;

  return `
    <section class="elf-tab-panel elf-tab-panel-wishlist" aria-labelledby="elf-wishlist-title">
      <div class="section-heading">
        <h2 id="elf-wishlist-title">${skinLandingText("wishlistOverviewTitle", locale)}</h2>
        <span>${t("elfLanding.wishlistScope", locale)}</span>
      </div>
      ${wishlist.notice === "limit" ? `
        <p class="elf-wishlist-notice" role="status">
          ${t("elfLanding.wishlistLimitReached", locale, { limit: formatLocalizedNumber(PRODUCT_RULES.wishlistLimit, locale) })}
        </p>
      ` : ""}
      ${renderWishlistChampionCarousel(wishlistSlots, wishlist, locale)}
      ${renderDesktopChampionView(wishlistChampion ? {
        skin: wishlistChampion,
        title: championRank,
        eyebrow: skinLandingText("homeTabWishlist", locale),
        meta: t("elfLanding.wishlistScope", locale),
        statLabel: getWishCountLabel(locale, wishlistChampion.wishCount ?? 0, wishlist.community.status === "remote"),
        statValue: wishlistChampion.isLocalSelection
          ? t("elfLanding.cancelWish", locale)
          : formatLocalizedNumber(wishlistChampion.wishCount ?? 0, locale),
        rankLabel: championRank,
        kind: "wishlist",
        action: wishlistChampion.isLocalSelection ? "cancel" : "",
      } : null)}
      ${wishlistCatalog.length > 0 ? `
        <div class="elf-rank-actions">
          <button class="elf-clear-wishlist" type="button" data-wishlist-clear>
            ${t("elfLanding.clearWishes", locale)}
          </button>
        </div>
        <div class="elf-rank-list elf-rank-list-mobile elf-wishlist-rank-list">
          ${wishlistSlots.map((skin, index) => renderWishlistLeader(
            skin,
            index,
            topWishCount,
            locale,
            wishlistChampion?.id,
            wishlist
          )).join("")}
        </div>
        <div class="elf-rank-list elf-rank-list-desktop elf-wishlist-rank-list ${desktopPage.columns === 2 ? "is-two-columns" : ""}" data-ranking-columns="${desktopPage.columns}">
          ${desktopPage.items.map((skin, index) => renderWishlistLeader(
            skin,
            desktopPage.start + index,
            topWishCount,
            locale,
            wishlistChampion?.id,
            wishlist
          )).join("")}
        </div>
        ${renderDesktopRankingPagination(desktopPage, locale)}
      ` : `
        <p class="empty-state">${t("elfLanding.emptyWishlist", locale)}</p>
      `}
    </section>
  `;
}

function renderSupplyTab(supplyLeaders, topSupply, todayAddedLeaders, topTodayAdded, locale, selectedPreviewId, rankingPage) {
  const desktopPage = getDesktopRankingPage(supplyLeaders, rankingPage);
  const supplyChampion = supplyLeaders.find((skin) => skin.id === selectedPreviewId)
    ?? supplyLeaders[0]
    ?? getEmptySkin();
  const championIndex = Math.max(0, supplyLeaders.findIndex((skin) => skin.id === supplyChampion.id));
  const championRank = `TOP ${championIndex + 1}`;

  return `
    <section class="elf-tab-panel elf-tab-panel-supply" aria-labelledby="elf-supply-title">
      <div class="section-heading">
        <h2 id="elf-supply-title">${skinLandingText("supplyOverviewTitle", locale)}</h2>
        <span>${t("elfLanding.supplyRankingScope", locale)}</span>
      </div>
      ${renderSupplyChampionCarousel(supplyLeaders, locale)}
      ${renderDesktopChampionView(supplyLeaders.length > 0 ? {
        skin: supplyChampion,
        title: championRank,
        eyebrow: skinLandingText("homeTabSupply", locale),
        meta: t("elfLanding.supplyRankingScope", locale),
        statLabel: t("elfLanding.supply", locale),
        statValue: supplyChampion.quantity === null
          ? t("elfLanding.supplyPending", locale)
          : formatLocalizedNumber(supplyChampion.quantity, locale),
        rankLabel: championRank,
        kind: "supply",
        eager: true
      } : null)}
      <div class="elf-rank-list elf-rank-list-mobile">
        ${supplyLeaders.slice(0, PRODUCT_RULES.rankingLimit).map((skin, index) => renderSupplyLeader(
          skin,
          index,
          topSupply,
          locale,
          supplyChampion.id
        )).join("")}
      </div>
      <div class="elf-rank-list elf-rank-list-desktop ${desktopPage.columns === 2 ? "is-two-columns" : ""}" data-ranking-columns="${desktopPage.columns}">
        ${desktopPage.items.map((skin, index) => renderSupplyLeader(
          skin,
          desktopPage.start + index,
          topSupply,
          locale,
          supplyChampion.id
        )).join("")}
      </div>
      ${renderDesktopRankingPagination(desktopPage, locale)}
      ${renderTodayAddedRanking(todayAddedLeaders, topTodayAdded, locale)}
    </section>
  `;
}

function renderWishlistChampionCarousel(wishlistSlots, wishlist, locale) {
  const slides = wishlistSlots.filter(Boolean).slice(0, PRODUCT_RULES.mobileChampionLimit);

  if (slides.length === 0) {
    return "";
  }

  return renderMobileChampionView(slides.map((skin, index) => ({
    skin,
    title: `TOP ${index + 1}`,
    eyebrow: skinLandingText("homeTabWishlist", locale),
    meta: t("elfLanding.wishlistScope", locale),
    statLabel: getWishCountLabel(locale, skin.wishCount ?? 0, wishlist.community.status === "remote"),
    statValue: skin.isLocalSelection
      ? t("elfLanding.cancelWish", locale)
      : formatLocalizedNumber(skin.wishCount ?? 0, locale),
    rankLabel: `TOP ${index + 1}`,
    kind: "wishlist",
    action: skin.isLocalSelection ? "cancel" : ""
  })));
}

function renderSupplyChampionCarousel(supplyLeaders, locale) {
  const slides = supplyLeaders.slice(0, PRODUCT_RULES.mobileChampionLimit);

  if (slides.length === 0) {
    return "";
  }

  return renderMobileChampionView(slides.map((skin, index) => ({
    skin,
    title: `TOP ${index + 1}`,
    eyebrow: skinLandingText("homeTabSupply", locale),
    meta: t("elfLanding.supplyRankingScope", locale),
    statLabel: t("elfLanding.supply", locale),
    statValue: skin.quantity === null
      ? t("elfLanding.supplyPending", locale)
      : formatLocalizedNumber(skin.quantity, locale),
    rankLabel: `TOP ${index + 1}`,
    kind: "supply",
    eager: index === 0
  })));
}

function renderSupplyDataAndOfficialTab(catalog, wishlist, todayAddedLeaders, topTodayAdded, locale) {
  const hasOfficialCatalog = catalog.kind === "api" && catalog.skins.length > 0;

  return `
    <section class="elf-tab-panel elf-tab-panel-gallery" aria-labelledby="elf-skin-grid-title">
      <div class="elf-desktop-supply-data">
        <div class="section-heading">
          <h2>${skinLandingText("homeTabSupplyData", locale)}</h2>
          <span>${t("elfLanding.todayAddedRankingScope", locale)}</span>
        </div>
        ${renderTodayAddedRanking(todayAddedLeaders, topTodayAdded, locale)}
      </div>
      <div class="elf-mobile-official-gallery">
      <div class="section-heading">
        <h2 id="elf-skin-grid-title">${t("elfLanding.skinGallery", locale)}</h2>
        <span>${renderCatalogStatus(catalog, locale)}</span>
      </div>
      ${hasOfficialCatalog ? `
        <div class="elf-skin-grid">
          ${catalog.skins.map((skin, index) => renderSkinCard(skin, index, wishlist, locale)).join("")}
        </div>
      ` : `
        <p class="empty-state elf-official-empty">
          <strong>${skinLandingText("officialSkinEmptyTitle", locale)}</strong>
          <span>${skinLandingText("officialSkinEmptyBody", locale)}</span>
        </p>
      `}
      </div>
    </section>
  `;
}

function renderSkinSourcePanel(catalog, wishlist, locale) {
  const catalogDetail = catalog.kind === "api"
    ? t("elfLanding.skinSourceOfficialDetail", locale)
    : t("elfLanding.skinSourceFallbackDetail", locale);
  const wishlistDetail = wishlist.community.status === "remote"
    ? t("elfLanding.skinSourceWishlistRemoteDetail", locale)
    : t("elfLanding.skinSourceWishlistLocalDetail", locale);

  return `
    <section class="data-source-panel data-source-panel-skins" aria-label="${t("elfLanding.skinSourceTitle", locale)}">
      <div class="section-heading">
        <h2>${t("elfLanding.skinSourceTitle", locale)}</h2>
        <span>${t("elfLanding.skinSourceSummary", locale)}</span>
      </div>
      <div class="data-source-grid">
        ${renderDataSourceItem(
          t("elfLanding.skinSourceOfficial", locale),
          catalogDetail
        )}
        ${renderDataSourceItem(
          t("elfLanding.skinSourceWishlist", locale),
          wishlistDetail
        )}
        ${renderDataSourceItem(
          t("elfLanding.skinSourceSupplySnapshot", locale),
          t("elfLanding.skinSourceSupplySnapshotDetail", locale)
        )}
        ${renderDataSourceItem(
          t("elfLanding.skinPrivacyTitle", locale),
          t("elfLanding.skinPrivacyDetail", locale)
        )}
      </div>
      <button class="elf-community-data-delete" type="button" data-community-data-delete>
        ${t("elfLanding.skinPrivacyDelete", locale)}
      </button>
    </section>
  `;
}

function renderSkinFooter(catalog, wishlist, locale) {
  return `
    <footer class="elf-home-footer" aria-label="${t("elfLanding.skinSourceTitle", locale)}">
      ${renderSkinSourcePanel(catalog, wishlist, locale)}
    </footer>
  `;
}

function renderDataSourceItem(title, detail) {
  return `
    <article class="data-source-item">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </article>
  `;
}

function renderTodayAddedRanking(leaders, topTodayAdded, locale) {
  const slots = Array.from({ length: PRODUCT_RULES.rankingLimit }, (_, index) => leaders[index] ?? null);

  return `
    <section class="elf-delta-panel" aria-label="${t("elfLanding.todayAddedRankingTitle", locale)}">
      <div class="section-heading">
        <h2>${t("elfLanding.todayAddedRankingTitle", locale)}</h2>
        <span>${t("elfLanding.todayAddedRankingScope", locale)}</span>
      </div>
      <div class="elf-delta-track">
        ${slots.map((skin, index) => skin
          ? renderTodayAddedLeader(skin, index, topTodayAdded, locale)
          : renderTodayAddedPlaceholder(index, locale)
        ).join("")}
      </div>
    </section>
  `;
}

function renderSupplyLeader(skin, index, topSupply, locale, selectedPreviewId) {
  const supply = skin.quantity ?? 0;
  const share = topSupply > 0 ? Math.max(6, Math.min(100, (supply / topSupply) * 100)) : 0;

  return `
    <div
      class="elf-rank-row elf-rank-row-selectable ${skin.id === selectedPreviewId ? "is-preview-selected" : ""} ${getSkinClassNames(skin)}"
      data-skin-preview="${escapeHtml(skin.id)}"
    >
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeHtml(skin.image)}" alt="${escapeHtml(skin.name)}" width="64" height="64" loading="lazy" decoding="async">
      <div class="elf-rank-body">
        <strong>${escapeHtml(skin.name)}</strong>
        <small>${t("elfLanding.supply", locale)} ${formatLocalizedNumber(supply, locale)}</small>
        <div class="elf-rank-meter" aria-hidden="true"><span style="width: ${share}%"></span></div>
      </div>
    </div>
  `;
}

function renderSupplyPlaceholder(index, locale) {
  return `
    <div class="elf-rank-row elf-rank-row-empty">
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="elf-rank-empty-mark" aria-hidden="true">--</div>
      <div class="elf-rank-body">
        <strong>${t("dashboard.pending", locale)}</strong>
        <small>${t("elfLanding.supply", locale)} ${t("elfLanding.supplyPending", locale)}</small>
        <div class="elf-rank-meter" aria-hidden="true"><span style="width: 0%"></span></div>
      </div>
    </div>
  `;
}

function renderWishlistLeader(skin, index, topWishCount, locale, selectedPreviewId, wishlist) {
  const wishCount = skin.wishCount ?? 0;
  const share = wishCount > 0
    ? Math.max(6, Math.min(100, (wishCount / topWishCount) * 100))
    : 0;
  const supply = skin.quantity === null
    ? t("elfLanding.supplyPending", locale)
    : formatLocalizedNumber(skin.quantity, locale);

  return `
    <div
      class="elf-rank-row elf-rank-row-selectable ${skin.id === selectedPreviewId ? "is-preview-selected" : ""} ${getSkinClassNames(skin)}"
      role="button"
      tabindex="0"
      aria-pressed="${skin.id === selectedPreviewId ? "true" : "false"}"
      data-skin-preview="${escapeHtml(skin.id)}"
    >
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeHtml(skin.image)}" alt="${escapeHtml(skin.name)}" width="64" height="64" loading="lazy" decoding="async">
      <div class="elf-rank-body">
        <strong>${escapeHtml(skin.name)}</strong>
        <small>
          <strong>${getWishCountLabel(locale, wishCount, skin.isRemoteLeader === true)}</strong>
          <span>${t("elfLanding.supply", locale)} ${supply}</span>
        </small>
        <div class="elf-rank-meter" aria-hidden="true"><span style="width: ${share}%"></span></div>
      </div>
      <button
        class="elf-rank-wish-toggle ${skin.isLocalSelection ? "is-selected" : ""}"
        type="button"
        data-wishlist-toggle="${escapeHtml(skin.id)}"
        aria-pressed="${skin.isLocalSelection ? "true" : "false"}"
        aria-label="${skin.isLocalSelection ? t("elfLanding.removeWish", locale) : t("elfLanding.addWish", locale)}"
        title="${skin.isLocalSelection ? t("elfLanding.removeWish", locale) : t("elfLanding.addWish", locale)}"
        ${!skin.isLocalSelection && wishlist.selectedIds.length >= PRODUCT_RULES.wishlistLimit ? "disabled" : ""}
      >
        <span aria-hidden="true">☆</span>
      </button>
    </div>
  `;
}

function getWishlistCatalog(skins, wishlistLeaders, wishlist) {
  const usedIds = new Set(wishlistLeaders.map((skin) => skin.id));
  const fillerSkins = skins
    .filter((skin) => !usedIds.has(skin.id))
    .map((skin) => ({
      ...skin,
      wishCount: 0,
      isRemoteLeader: wishlist.community.status === "remote",
      isLocalSelection: wishlist.selectedIds.includes(skin.id),
      isWishlistFiller: true
    }));

  return [...wishlistLeaders, ...fillerSkins];
}

function getDesktopRankingPage(items, requestedPage) {
  const pageSize = PRODUCT_RULES.desktopRankingPageSize;
  const columnSize = PRODUCT_RULES.desktopRankingColumnSize;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(0, Number(requestedPage) || 0), pageCount - 1);
  const start = page * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page,
    pageCount,
    start,
    items: pageItems,
    columns: Math.max(1, Math.min(3, Math.ceil(pageItems.length / columnSize)))
  };
}

function renderDesktopRankingPagination(pageState, locale) {
  if (pageState.pageCount <= 1) {
    return "";
  }

  return `
    <nav class="elf-ranking-pagination" aria-label="${skinLandingText("rankingPages", locale)}">
      <button
        type="button"
        data-skin-ranking-page="${pageState.page - 1}"
        aria-label="${skinLandingText("previousPage", locale)}"
        ${pageState.page === 0 ? "disabled" : ""}
      >←</button>
      <span>${pageState.page + 1} / ${pageState.pageCount}</span>
      <button
        type="button"
        data-skin-ranking-page="${pageState.page + 1}"
        aria-label="${skinLandingText("nextPage", locale)}"
        ${pageState.page >= pageState.pageCount - 1 ? "disabled" : ""}
      >→</button>
    </nav>
  `;
}

function renderWishlistPlaceholder(index, locale) {
  return `
    <div class="elf-rank-row elf-rank-row-empty">
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="elf-rank-empty-mark" aria-hidden="true">--</div>
      <div class="elf-rank-body">
        <strong>${t("dashboard.pending", locale)}</strong>
        <small>
          <strong>${skinLandingText("communityWishVotes", locale, { count: formatLocalizedNumber(0, locale) })}</strong>
          <span>${t("elfLanding.supply", locale)} ${t("elfLanding.supplyPending", locale)}</span>
        </small>
      </div>
    </div>
  `;
}

function renderTodayAddedLeader(skin, index, topTodayAdded, locale) {
  const todayAdded = Math.max(0, Number(skin.todayAdded ?? 0));
  const share = topTodayAdded > 0 ? Math.max(8, Math.min(100, (todayAdded / topTodayAdded) * 100)) : 0;

  return `
    <article class="elf-delta-card ${getSkinClassNames(skin)}">
      <span class="elf-delta-rank">TOP ${index + 1}</span>
      <img src="${escapeHtml(skin.image)}" alt="${escapeHtml(skin.name)}" width="72" height="72" loading="lazy" decoding="async">
      <div class="elf-delta-body">
        <strong>${escapeHtml(skin.name)}</strong>
        <small>${t("elfLanding.todayAddedMetricLabel", locale)}</small>
        <p>+${formatLocalizedNumber(todayAdded, locale)}</p>
        <div class="elf-delta-meter" aria-hidden="true"><span style="width: ${share}%"></span></div>
      </div>
    </article>
  `;
}

function renderTodayAddedPlaceholder(index, locale) {
  return `
    <article class="elf-delta-card elf-delta-card-empty">
      <span class="elf-delta-rank">TOP ${index + 1}</span>
      <div class="elf-delta-empty-mark" aria-hidden="true">--</div>
      <div class="elf-delta-body">
        <strong>${t("dashboard.pending", locale)}</strong>
        <small>${t("elfLanding.todayAddedMetricLabel", locale)}</small>
        <p>+0</p>
        <div class="elf-delta-meter" aria-hidden="true"><span style="width: 0%"></span></div>
      </div>
    </article>
  `;
}

function renderSkinCard(skin, index, wishlist, locale) {
  const selected = wishlist.selectedIds.includes(skin.id);
  const disabled = !selected && wishlist.selectedIds.length >= PRODUCT_RULES.wishlistLimit;

  return `
    <article class="elf-skin-card ${getSkinClassNames(skin)} ${selected ? "is-wishlisted" : ""}">
      <div class="elf-skin-image-frame">
        <img
          src="${escapeHtml(skin.image)}"
          alt="${escapeHtml(skin.name)}"
          width="128"
          height="128"
          loading="${index === 0 ? "eager" : "lazy"}"
          decoding="async"
        >
      </div>
      <div class="elf-skin-card-body">
        <span>${t("elfLanding.rank", locale)} ${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(skin.name)}</strong>
        <small>${t("elfLanding.officialSkin", locale)}</small>
        ${renderSkinSupply(skin, locale)}
        <button
          class="elf-wishlist-button"
          type="button"
          data-wishlist-toggle="${escapeHtml(skin.id)}"
          aria-pressed="${selected ? "true" : "false"}"
          ${disabled ? "disabled" : ""}
        >
          ${selected
            ? t("elfLanding.removeWish", locale)
            : disabled
              ? t("elfLanding.wishlistFull", locale)
              : t("elfLanding.addWish", locale)}
        </button>
      </div>
    </article>
  `;
}

function renderCatalogStatus(catalog, locale) {
  if (catalog.kind === "loading") {
    return t("elfLanding.loadingSkins", locale);
  }

  if (catalog.kind === "api") {
    return t("elfLanding.apiSkinCatalog", locale, {
      count: formatLocalizedNumber(catalog.skins.length, locale)
    });
  }

  return t("elfLanding.fallbackSkinCatalog", locale, {
    count: formatLocalizedNumber(catalog.skins.length, locale)
  });
}

function renderSkinSupply(skin, locale) {
  const supply = skin.quantity === null
    ? t("elfLanding.supplyPending", locale)
    : formatLocalizedNumber(skin.quantity, locale);
  const supplyDelta = getSupplyDeltaLabel(skin, locale);

  return `
    <p class="elf-skin-stat">
      <span>${t("elfLanding.supply", locale)}</span>
      <strong>${supply}</strong>
      ${supplyDelta ? `<small>${supplyDelta}</small>` : ""}
    </p>
  `;
}

function renderInlineSupplyDelta(skin, locale) {
  const label = getSupplyDeltaLabel(skin, locale);
  return label ? ` / ${label}` : "";
}

function getSupplyDeltaLabel(skin, locale) {
  if (!skin?.supplyTrend) {
    return "";
  }

  const todayAdded = skin.supplyTrend.todayAdded;

  if (typeof todayAdded !== "number") {
    return t("elfLanding.todayAddedUnknown", locale);
  }

  return t("elfLanding.todayAdded", locale, {
    count: formatLocalizedNumber(Math.max(0, todayAdded), locale)
  });
}

function getWishlistLeaders(skins, wishlist) {
  if (wishlist.community.status === "remote" && wishlist.community.wishlistLeaders.length > 0) {
    return wishlist.community.wishlistLeaders
      .map((leader) => {
        const skin = skins.find((candidate) => candidate.id === leader.skinId);

        if (!skin) {
          return null;
        }

        return {
          ...skin,
          wishCount: leader.wishCount,
          isRemoteLeader: true,
          isLocalSelection: wishlist.selectedIds.includes(skin.id)
        };
      })
      .filter(Boolean)
      .slice(0, PRODUCT_RULES.rankingLimit);
  }

  return wishlist.selectedIds
    .map((skinId) => {
      const skin = skins.find((candidate) => candidate.id === skinId);

      return skin
        ? {
          ...skin,
          wishCount: 1,
          isRemoteLeader: false,
          isLocalSelection: true
        }
        : null;
    })
    .filter(Boolean)
    .slice(0, PRODUCT_RULES.rankingLimit);
}

function getTodayAddedLeaders(skins) {
  return skins
    .map((skin) => {
      const todayAdded = skin?.supplyTrend?.todayAdded;

      return typeof todayAdded === "number"
        ? {
          ...skin,
          todayAdded: Math.max(0, todayAdded)
        }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => {
      const rightQuantity = right.quantity ?? -1;
      const leftQuantity = left.quantity ?? -1;
      return right.todayAdded - left.todayAdded
        || rightQuantity - leftQuantity
        || left.name.localeCompare(right.name);
    })
    .slice(0, PRODUCT_RULES.rankingLimit);
}

function getWishCountLabel(locale, count, isRemote) {
  const formattedCount = formatLocalizedNumber(count, locale);

  if (isRemote) {
    return skinLandingText("communityWishVotes", locale, { count: formattedCount });
  }

  return t("elfLanding.localWishVotes", locale, { count: formattedCount });
}

function formatLocalizedNumber(value, locale, options = {}) {
  return formatNumber(value, { ...options, locale });
}

function normalizeCatalog(skinCatalog) {
  const skins = Array.isArray(skinCatalog?.skins) && skinCatalog.skins.length > 0
    ? skinCatalog.skins
    : [];

  return {
    kind: skinCatalog?.kind ?? "fallback",
    skins
  };
}

function normalizeHomeTab(tab) {
  return ["wishlist", "supply", "gallery"].includes(tab) ? tab : "wishlist";
}

function normalizeWishlist(wishlistState) {
  return {
    visitorCount: Number.isFinite(Number(wishlistState?.visitorCount))
      ? Number(wishlistState.visitorCount)
      : 0,
    selectedIds: Array.isArray(wishlistState?.selectedIds)
      ? wishlistState.selectedIds
      : [],
    notice: wishlistState?.notice ?? "",
    community: normalizeCommunity(wishlistState?.community)
  };
}

function normalizeCommunity(communityState) {
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

function getEmptySkin() {
  return {
    id: "pending",
    name: "ELF",
    image: "",
    quantity: null,
    tone: "amber"
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function skinLandingText(key, locale, params = {}) {
  const copy = {
    en: {
      homeTabWishlist: "Wishes",
      homeTabSupply: "Supply",
      homeTabOfficial: "Skins",
      homeTabSupplyData: "Supply data",
      wishlistOverviewTitle: "Skin wish overview",
      supplyOverviewTitle: "Skin supply overview",
      rankingPages: "Skin ranking pages",
      previousPage: "Previous ranking page",
      nextPage: "Next ranking page",
      footerInfoTitle: "Skin page details",
      updateTime: "Updated",
      version: "Version",
      communityWishVotes: "{count} community wishes",
      officialSkinEmptyTitle: "No official skins announced yet.",
      officialSkinEmptyBody: "After official skins are released, they will appear here based on official data."
    },
    "zh-Hant": {
      homeTabWishlist: "願望清單",
      homeTabSupply: "供給量排行",
      homeTabOfficial: "官方皮膚",
      homeTabSupplyData: "供給數據",
      wishlistOverviewTitle: "皮膚願望總覽",
      supplyOverviewTitle: "皮膚供給總覽",
      rankingPages: "皮膚排行分頁",
      previousPage: "上一頁排行",
      nextPage: "下一頁排行",
      footerInfoTitle: "皮膚頁面資訊",
      updateTime: "更新時間",
      version: "版本",
      communityWishVotes: "{count} 個全站願望",
      officialSkinEmptyTitle: "目前尚未公布官方皮膚。",
      officialSkinEmptyBody: "官方皮膚推出後，將依官方資料顯示於此。"
    },
    ja: {
      homeTabWishlist: "願いリスト",
      homeTabSupply: "供給ランキング",
      homeTabOfficial: "公式スキン",
      homeTabSupplyData: "供給データ",
      wishlistOverviewTitle: "スキン願い一覧",
      supplyOverviewTitle: "スキン供給一覧",
      rankingPages: "スキンランキングページ",
      previousPage: "前のランキングページ",
      nextPage: "次のランキングページ",
      footerInfoTitle: "スキンページ情報",
      updateTime: "更新時刻",
      version: "バージョン",
      communityWishVotes: "{count} 件のコミュニティ願い",
      officialSkinEmptyTitle: "公式スキンはまだ公開されていません。",
      officialSkinEmptyBody: "公式スキンが公開された後、公式データに基づいてここに表示されます。"
    },
    ko: {
      homeTabWishlist: "위시 목록",
      homeTabSupply: "공급량 순위",
      homeTabOfficial: "공식 스킨",
      homeTabSupplyData: "공급 데이터",
      wishlistOverviewTitle: "스킨 위시 개요",
      supplyOverviewTitle: "스킨 공급 개요",
      rankingPages: "스킨 순위 페이지",
      previousPage: "이전 순위 페이지",
      nextPage: "다음 순위 페이지",
      footerInfoTitle: "스킨 페이지 정보",
      updateTime: "업데이트 시간",
      version: "버전",
      communityWishVotes: "커뮤니티 위시 {count}개",
      officialSkinEmptyTitle: "아직 공식 스킨이 공개되지 않았습니다.",
      officialSkinEmptyBody: "공식 스킨이 출시되면 공식 데이터에 따라 여기에 표시됩니다."
    },
    vi: {
      homeTabWishlist: "Danh sách ước",
      homeTabSupply: "Xếp hạng cung",
      homeTabOfficial: "Skin chính thức",
      homeTabSupplyData: "Dữ liệu cung",
      wishlistOverviewTitle: "Tổng quan ước chọn skin",
      supplyOverviewTitle: "Tổng quan cung skin",
      rankingPages: "Trang xếp hạng skin",
      previousPage: "Trang xếp hạng trước",
      nextPage: "Trang xếp hạng tiếp theo",
      footerInfoTitle: "Thông tin trang skin",
      updateTime: "Cập nhật",
      version: "Phiên bản",
      communityWishVotes: "{count} ước chọn cộng đồng",
      officialSkinEmptyTitle: "Hiện chưa công bố skin chính thức.",
      officialSkinEmptyBody: "Sau khi skin chính thức được phát hành, trang sẽ hiển thị tại đây theo dữ liệu chính thức."
    }
  };
  const value = copy[locale]?.[key] ?? copy.en[key] ?? key;

  return Object.entries(params).reduce(
    (text, [name, entry]) => text.replaceAll(`{${name}}`, String(entry)),
    value
  );
}

