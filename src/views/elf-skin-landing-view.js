import { formatNumber } from "../core/utils/numbers.js";
import { defaultLocale, t } from "../i18n/i18n.js";

const wishlistLimit = 3;
const rankingLimit = 10;

export function renderElfSkinLandingView(
  skinCatalog,
  wishlistState,
  locale = defaultLocale,
  activeTab = "wishlist"
) {
  const catalog = normalizeCatalog(skinCatalog);
  const wishlist = normalizeWishlist(wishlistState);
  const currentTab = normalizeHomeTab(activeTab);
  const supplyLeaders = catalog.skins.slice(0, rankingLimit);
  const wishlistLeaders = getWishlistLeaders(catalog.skins, wishlist);
  const todayAddedLeaders = getTodayAddedLeaders(catalog.skins);
  const supplyChampion = supplyLeaders[0] ?? getEmptySkin();
  const wishlistChampion = wishlistLeaders[0] ?? null;
  const topSupply = supplyLeaders[0]?.quantity ?? 0;
  const topTodayAdded = todayAddedLeaders[0]?.todayAdded ?? 0;

  return `
    <section class="elf-home-workspace" aria-label="${t("elfLanding.rankingShowcase", locale)}">
      ${renderHomeTabs(currentTab, locale)}
      ${currentTab === "wishlist" ? renderWishlistTab(catalog.skins, wishlistLeaders, wishlist, locale) : ""}
      ${currentTab === "supply" ? renderSupplyTab(supplyLeaders, supplyChampion, topSupply, todayAddedLeaders, topTodayAdded, locale) : ""}
      ${currentTab === "gallery" ? renderOfficialSkinTab(catalog, wishlist, locale) : ""}
    </section>

    ${renderSkinFooter(catalog, wishlist, locale)}
  `;
}

function renderHomeTabs(activeTab, locale) {
  const tabs = [
    ["wishlist", skinLandingText("homeTabWishlist", locale)],
    ["supply", skinLandingText("homeTabSupply", locale)],
    ["gallery", skinLandingText("homeTabOfficial", locale)]
  ];

  return `
    <nav class="elf-home-tabs" aria-label="${t("elfLanding.skinGallery", locale)}">
      ${tabs.map(([tab, label]) => `
        <button
          class="elf-home-tab ${tab === activeTab ? "elf-home-tab-active" : ""}"
          type="button"
          data-skin-home-tab="${tab}"
          ${tab === activeTab ? "aria-current=\"page\"" : ""}
        >
          ${label}
        </button>
      `).join("")}
    </nav>
  `;
}

function renderWishlistTab(skins, wishlistLeaders, wishlist, locale) {
  const wishlistChampion = wishlistLeaders[0] ?? null;
  const wishlistSlots = getWishlistSlots(skins, wishlistLeaders, wishlist);

  return `
    <section class="elf-tab-panel elf-tab-panel-wishlist" aria-labelledby="elf-wishlist-title">
      <div class="section-heading">
        <h2 id="elf-wishlist-title">${t("elfLanding.wishlistTitle", locale)}</h2>
        <span>${t("elfLanding.wishlistScope", locale)}</span>
      </div>
      ${wishlist.notice === "limit" ? `
        <p class="elf-wishlist-notice" role="status">
          ${t("elfLanding.wishlistLimitReached", locale, { limit: formatNumber(wishlistLimit) })}
        </p>
      ` : ""}
      ${wishlistChampion ? renderChampionCard({
        skin: wishlistChampion,
        title: "TOP 1",
        eyebrow: skinLandingText("homeTabWishlist", locale),
        meta: t("elfLanding.wishlistScope", locale),
        statLabel: getWishCountLabel(locale, wishlistChampion.wishCount ?? 1, wishlist.community.status === "remote"),
        statValue: wishlistChampion.isLocalSelection
          ? t("elfLanding.cancelWish", locale)
          : formatNumber(wishlistChampion.wishCount ?? 1),
        rankLabel: "TOP 1",
        kind: "wishlist",
        action: wishlistChampion.isLocalSelection ? "cancel" : "",
        compact: true
      }) : ""}
      ${wishlistLeaders.length > 0 ? `
        <div class="elf-rank-actions">
          <button class="elf-clear-wishlist" type="button" data-wishlist-clear>
            ${t("elfLanding.clearWishes", locale)}
          </button>
        </div>
        <div class="elf-rank-list elf-wishlist-rank-list">
          ${wishlistSlots.map((skin, index) => skin
            ? renderWishlistLeader(skin, index, locale)
            : renderWishlistPlaceholder(index, locale)
          ).join("")}
        </div>
      ` : `
        <p class="empty-state">${t("elfLanding.emptyWishlist", locale)}</p>
      `}
    </section>
  `;
}

function renderSupplyTab(supplyLeaders, supplyChampion, topSupply, todayAddedLeaders, topTodayAdded, locale) {
  const supplySlots = Array.from({ length: rankingLimit }, (_, index) => supplyLeaders[index] ?? null);

  return `
    <section class="elf-tab-panel elf-tab-panel-supply" aria-labelledby="elf-supply-title">
      <div class="section-heading">
        <h2 id="elf-supply-title">${t("elfLanding.supplyRankingTitle", locale)}</h2>
        <span>${t("elfLanding.supplyRankingScope", locale)}</span>
      </div>
      ${supplyLeaders.length > 0 ? renderChampionCard({
        skin: supplyChampion,
        title: "TOP 1",
        eyebrow: skinLandingText("homeTabSupply", locale),
        meta: t("elfLanding.supplyRankingScope", locale),
        statLabel: t("elfLanding.supply", locale),
        statValue: supplyChampion.quantity === null
          ? t("elfLanding.supplyPending", locale)
          : formatNumber(supplyChampion.quantity),
        rankLabel: "TOP 1",
        kind: "supply",
        eager: true,
        compact: true
      }) : ""}
      <div class="elf-rank-list">
        ${supplySlots.map((skin, index) => skin
          ? renderSupplyLeader(skin, index, topSupply, locale)
          : renderSupplyPlaceholder(index, locale)
        ).join("")}
      </div>
      ${renderTodayAddedRanking(todayAddedLeaders, topTodayAdded, locale)}
    </section>
  `;
}

function renderOfficialSkinTab(catalog, wishlist, locale) {
  const hasOfficialCatalog = catalog.kind === "api" && catalog.skins.length > 0;

  return `
    <section class="elf-tab-panel elf-tab-panel-gallery" aria-labelledby="elf-skin-grid-title">
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
      </div>
    </section>
  `;
}

function renderSkinFooter(catalog, wishlist, locale) {
  const visitorCount = wishlist.community.visitorCount ?? wishlist.visitorCount;
  const updatedAt = catalog.fetchedAt || catalog.serverTime || "";

  return `
    <footer class="elf-home-footer" aria-label="${skinLandingText("footerInfoTitle", locale)}">
      <div class="elf-footer-metrics">
        ${renderFooterMetric(t("elfLanding.localVisitors", locale), formatNumber(visitorCount))}
        ${renderFooterMetric(t("elfLanding.skinRanking", locale), t("elfLanding.rankedBySupply", locale))}
        ${renderFooterMetric(
          skinLandingText("updateTime", locale),
          updatedAt ? escapeHtml(updatedAt) : t("dashboard.pending", locale)
        )}
        ${renderFooterMetric(skinLandingText("version", locale), t("app.versionEyebrow", locale))}
      </div>
      ${renderSkinSourcePanel(catalog, wishlist, locale)}
      <p class="elf-footer-disclaimer">${t("elfLanding.communityDisclaimer", locale)}</p>
    </footer>
  `;
}

function renderFooterMetric(label, value) {
  return `
    <div class="elf-footer-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
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
  const slots = Array.from({ length: rankingLimit }, (_, index) => leaders[index] ?? null);

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

function renderChampionCard({
  skin,
  title,
  eyebrow,
  meta,
  statLabel,
  statValue,
  statDetail = "",
  rankLabel,
  kind,
  eager = false,
  action = "",
  compact = false
}) {
  const frameClass = getChampionFrameClass(skin, kind);

  return `
    <article class="elf-champion-card ${compact ? "elf-champion-card-compact" : ""} elf-champion-${escapeHtml(kind)} elf-skin-card-${escapeHtml(skin.tone)} ${frameClass}">
      <div class="elf-champion-heading">
        <div>
          <p class="eyebrow">${eyebrow}</p>
          <h2>${title}</h2>
        </div>
        <span class="elf-champion-rank">${escapeHtml(rankLabel)}</span>
      </div>
      <div class="elf-champion-art" aria-hidden="true">
        <img
          src="${escapeHtml(skin.image)}"
          alt=""
          width="240"
          height="240"
          loading="${eager ? "eager" : "lazy"}"
          decoding="async"
        >
      </div>
      <div class="elf-champion-body">
        <span>${meta}</span>
        <strong>${escapeHtml(skin.name)}</strong>
        <div class="elf-champion-stat">
          <span>${statLabel}${statDetail ? `<small>${statDetail}</small>` : ""}</span>
          ${action === "cancel" ? `
            <button class="elf-rank-cancel" type="button" data-wishlist-toggle="${escapeHtml(skin.id)}">
              ${statValue}
            </button>
          ` : `<strong>${statValue}</strong>`}
        </div>
      </div>
    </article>
  `;
}

function getChampionFrameClass(skin, kind) {
  const normalizedName = String(skin?.name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (kind === "supply" && normalizedName === "spinning-kicker") {
    return "elf-champion-frame-spinning-kicker";
  }

  if (kind === "wishlist" && normalizedName === "flame-runner") {
    return "elf-champion-frame-flame-runner";
  }

  return "";
}

function renderEmptyWishlistChampion(locale) {
  const championCopy = getChampionCopy(locale);

  return `
    <article class="elf-champion-card elf-champion-wishlist elf-champion-empty">
      <div class="elf-champion-heading">
        <div>
          <p class="eyebrow">${t("elfLanding.selectedWishes", locale)}</p>
          <h2>${championCopy.wishlistTitle}</h2>
        </div>
        <span class="elf-champion-rank">#01</span>
      </div>
      <div class="elf-champion-art elf-champion-empty-art" aria-hidden="true">
        <span>?</span>
      </div>
      <div class="elf-champion-body">
        <span>${t("elfLanding.wishlistScope", locale)}</span>
        <strong>${t("elfLanding.emptyWishlist", locale)}</strong>
        <div class="elf-champion-stat">
          <span>${t("elfLanding.wishlistCount", locale, {
            selected: formatNumber(0),
            limit: formatNumber(wishlistLimit)
          })}</span>
          <strong>${t("elfLanding.addWish", locale)}</strong>
        </div>
      </div>
    </article>
  `;
}

function getChampionCopy(locale) {
  if (locale === "zh-Hant") {
    return {
      supplyTitle: "靘策???洵銝",
      wishlistTitle: "憿?皜蝚砌?"
    };
  }

  return {
    supplyTitle: "Supply Rank #1",
    wishlistTitle: "Wish List #1"
  };
}

function renderSupplyLeader(skin, index, topSupply, locale) {
  const supply = skin.quantity ?? 0;
  const share = topSupply > 0 ? Math.max(6, Math.min(100, (supply / topSupply) * 100)) : 0;

  return `
    <div class="elf-rank-row ${getSkinClassNames(skin)}">
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeHtml(skin.image)}" alt="${escapeHtml(skin.name)}" width="64" height="64" loading="lazy" decoding="async">
      <div class="elf-rank-body">
        <strong>${escapeHtml(skin.name)}</strong>
        <small>${t("elfLanding.supply", locale)} ${formatNumber(supply)}</small>
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

function renderWishlistLeader(skin, index, locale) {
  const wishCount = skin.wishCount ?? 1;
  const supply = skin.quantity === null
    ? t("elfLanding.supplyPending", locale)
    : formatNumber(skin.quantity);

  return `
    <div class="elf-rank-row ${getSkinClassNames(skin)}">
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeHtml(skin.image)}" alt="${escapeHtml(skin.name)}" width="64" height="64" loading="lazy" decoding="async">
      <div class="elf-rank-body">
        <strong>${escapeHtml(skin.name)}</strong>
        <small>
          <strong>${getWishCountLabel(locale, wishCount, skin.isRemoteLeader === true)}</strong>
          <span>${t("elfLanding.supply", locale)} ${supply}</span>
        </small>
      </div>
      ${skin.isLocalSelection ? `
        <button class="elf-rank-cancel" type="button" data-wishlist-toggle="${escapeHtml(skin.id)}">
          ${t("elfLanding.cancelWish", locale)}
        </button>
      ` : ""}
    </div>
  `;
}

function getWishlistSlots(skins, wishlistLeaders, wishlist) {
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

  const slots = [...wishlistLeaders, ...fillerSkins].slice(0, rankingLimit);

  return Array.from({ length: rankingLimit }, (_, index) => slots[index] ?? null);
}

function renderWishlistPlaceholder(index, locale) {
  return `
    <div class="elf-rank-row elf-rank-row-empty">
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="elf-rank-empty-mark" aria-hidden="true">--</div>
      <div class="elf-rank-body">
        <strong>${t("dashboard.pending", locale)}</strong>
        <small>
          <strong>${skinLandingText("communityWishVotes", locale, { count: formatNumber(0) })}</strong>
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
        <p>+${formatNumber(todayAdded)}</p>
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
  const disabled = !selected && wishlist.selectedIds.length >= wishlistLimit;

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
      count: formatNumber(catalog.skins.length)
    });
  }

  return t("elfLanding.fallbackSkinCatalog", locale, {
    count: formatNumber(catalog.skins.length)
  });
}

function renderSkinSupply(skin, locale) {
  const supply = skin.quantity === null
    ? t("elfLanding.supplyPending", locale)
    : formatNumber(skin.quantity);
  const supplyDelta = getSupplyDeltaLabel(skin, locale);

  return `
    <p class="elf-skin-stat">
      <span>${t("elfLanding.supply", locale)}</span>
      <strong>${supply}</strong>
      ${supplyDelta ? `<small>${supplyDelta}</small>` : ""}
    </p>
  `;
}

function getSkinClassNames(skin) {
  const normalizedName = String(skin?.name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return [
    `elf-skin-card-${escapeHtml(skin.tone)}`,
    `elf-skin-id-${escapeHtml(skin.id)}`,
    normalizedName ? `elf-skin-name-${escapeHtml(normalizedName)}` : ""
  ].filter(Boolean).join(" ");
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
    count: formatNumber(Math.max(0, todayAdded))
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
      .slice(0, rankingLimit);
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
    .slice(0, rankingLimit);
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
    .slice(0, rankingLimit);
}

function getWishCountLabel(locale, count, isRemote) {
  const formattedCount = formatNumber(count);

  if (isRemote) {
    return skinLandingText("communityWishVotes", locale, { count: formattedCount });
  }

  return t("elfLanding.localWishVotes", locale, { count: formattedCount });
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

