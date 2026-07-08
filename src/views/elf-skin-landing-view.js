import { formatNumber } from "../core/utils/numbers.js";
import { defaultLocale, t } from "../i18n/i18n.js";

const wishlistLimit = 3;

export function renderElfSkinLandingView(
  skinCatalog,
  wishlistState,
  locale = defaultLocale
) {
  const catalog = normalizeCatalog(skinCatalog);
  const wishlist = normalizeWishlist(wishlistState);
  const featuredSkin = catalog.skins[0] ?? getEmptySkin();
  const supplyLeaders = catalog.skins.slice(0, 5);
  const wishlistLeaders = getWishlistLeaders(catalog.skins, wishlist);
  const topSupply = supplyLeaders[0]?.quantity ?? 0;

  return `
    <section class="elf-landing elf-landing-stage-${escapeHtml(featuredSkin.tone)}" aria-labelledby="elf-landing-title">
      <div class="elf-landing-copy">
        <p class="eyebrow">${t("elfLanding.eyebrow", locale)}</p>
        <h2 id="elf-landing-title">${t("elfLanding.heroKicker", locale)}</h2>
        <p class="page-summary">${t("elfLanding.summary", locale)}</p>
        <div class="elf-landing-actions">
          <a class="utility-link" href="https://www.cidi.games/#/elf" target="_blank" rel="noreferrer">
            ${t("elfLanding.officialPage", locale)}
          </a>
        </div>
        <div class="elf-landing-metrics" aria-label="${t("elfLanding.localStats", locale)}">
          ${renderLandingMetric(
            t("elfLanding.localVisitors", locale),
            formatNumber(wishlist.visitorCount),
            t("elfLanding.localVisitorsHint", locale)
          )}
          ${renderLandingMetric(t("elfLanding.selectedWishes", locale), t("elfLanding.wishlistCount", locale, {
            selected: formatNumber(wishlist.selectedIds.length),
            limit: formatNumber(wishlistLimit)
          }))}
          ${renderLandingMetric(t("elfLanding.skinRanking", locale), t("elfLanding.rankedBySupply", locale))}
        </div>
      </div>

      <div class="elf-feature-card">
        <img
          src="${escapeHtml(featuredSkin.image)}"
          alt="${escapeHtml(featuredSkin.name)}"
          width="192"
          height="192"
          loading="eager"
          decoding="async"
        >
        <span>${t("elfLanding.featuredSkin", locale)}</span>
        <strong>${escapeHtml(featuredSkin.name)}</strong>
        ${renderSkinSupply(featuredSkin, locale)}
      </div>
    </section>

    <section class="elf-rank-showcase" aria-label="${t("elfLanding.rankingShowcase", locale)}">
      <article class="elf-rank-panel elf-rank-panel-supply">
        <div class="section-heading">
          <h2>${t("elfLanding.supplyRankingTitle", locale)}</h2>
          <span>${t("elfLanding.supplyRankingScope", locale)}</span>
        </div>
        <div class="elf-rank-list">
          ${supplyLeaders.map((skin, index) => renderSupplyLeader(skin, index, topSupply, locale)).join("")}
        </div>
      </article>

      <article class="elf-rank-panel elf-rank-panel-wishlist">
        <div class="section-heading">
          <h2>${t("elfLanding.wishlistTitle", locale)}</h2>
          <span>${t("elfLanding.wishlistScope", locale)}</span>
        </div>
        ${wishlist.notice === "limit" ? `
          <p class="elf-wishlist-notice" role="status">
            ${t("elfLanding.wishlistLimitReached", locale, { limit: formatNumber(wishlistLimit) })}
          </p>
        ` : ""}
        ${wishlistLeaders.length > 0 ? `
          <div class="elf-rank-actions">
            <button class="elf-clear-wishlist" type="button" data-wishlist-clear>
              ${t("elfLanding.clearWishes", locale)}
            </button>
          </div>
          <div class="elf-rank-list">
            ${wishlistLeaders.map((skin, index) => renderWishlistLeader(skin, index, locale)).join("")}
          </div>
        ` : `
          <p class="empty-state">${t("elfLanding.emptyWishlist", locale)}</p>
        `}
      </article>
    </section>

    <section class="elf-skin-panel" aria-labelledby="elf-skin-grid-title">
      <div class="section-heading">
        <h2 id="elf-skin-grid-title">${t("elfLanding.skinGallery", locale)}</h2>
        <span>${renderCatalogStatus(catalog, locale)}</span>
      </div>
      <div class="elf-skin-grid">
        ${catalog.skins.map((skin, index) => renderSkinCard(skin, index, wishlist, locale)).join("")}
      </div>
    </section>
  `;
}

function renderLandingMetric(label, value, detail = "") {
  return `
    <div>
      <span>${label}</span>
      <strong>${value}</strong>
      ${detail ? `<small>${detail}</small>` : ""}
    </div>
  `;
}

function renderSupplyLeader(skin, index, topSupply, locale) {
  const supply = skin.quantity ?? 0;
  const share = topSupply > 0 ? Math.max(6, Math.min(100, (supply / topSupply) * 100)) : 0;

  return `
    <div class="elf-rank-row elf-skin-card-${escapeHtml(skin.tone)}">
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

function renderWishlistLeader(skin, index, locale) {
  return `
    <div class="elf-rank-row elf-skin-card-${escapeHtml(skin.tone)}">
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeHtml(skin.image)}" alt="${escapeHtml(skin.name)}" width="64" height="64" loading="lazy" decoding="async">
      <div class="elf-rank-body">
        <strong>${escapeHtml(skin.name)}</strong>
        <small>${t("elfLanding.localWishVotes", locale, { count: formatNumber(1) })}</small>
      </div>
      <button class="elf-rank-cancel" type="button" data-wishlist-toggle="${escapeHtml(skin.id)}">
        ${t("elfLanding.cancelWish", locale)}
      </button>
    </div>
  `;
}

function renderSkinCard(skin, index, wishlist, locale) {
  const selected = wishlist.selectedIds.includes(skin.id);
  const disabled = !selected && wishlist.selectedIds.length >= wishlistLimit;

  return `
    <article class="elf-skin-card elf-skin-card-${escapeHtml(skin.tone)} ${selected ? "is-wishlisted" : ""}">
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

  return `
    <p class="elf-skin-stat">
      <span>${t("elfLanding.supply", locale)}</span>
      <strong>${supply}</strong>
    </p>
  `;
}

function getWishlistLeaders(skins, wishlist) {
  return wishlist.selectedIds
    .map((skinId) => skins.find((skin) => skin.id === skinId))
    .filter(Boolean)
    .slice(0, 5);
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

function normalizeWishlist(wishlistState) {
  return {
    visitorCount: Number.isFinite(Number(wishlistState?.visitorCount))
      ? Number(wishlistState.visitorCount)
      : 0,
    selectedIds: Array.isArray(wishlistState?.selectedIds)
      ? wishlistState.selectedIds
      : [],
    notice: wishlistState?.notice ?? ""
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
