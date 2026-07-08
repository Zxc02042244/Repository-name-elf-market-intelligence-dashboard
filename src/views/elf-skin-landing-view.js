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
  const supplyLeaders = catalog.skins.slice(0, 5);
  const wishlistLeaders = getWishlistLeaders(catalog.skins, wishlist);
  const supplyChampion = supplyLeaders[0] ?? getEmptySkin();
  const wishlistChampion = wishlistLeaders[0] ?? null;
  const championCopy = getChampionCopy(locale);
  const topSupply = supplyLeaders[0]?.quantity ?? 0;

  return `
    <section class="elf-landing elf-landing-stage-${escapeHtml(supplyChampion.tone)}" aria-label="${t("elfLanding.rankingShowcase", locale)}">
      ${renderChampionCard({
        skin: supplyChampion,
        title: championCopy.supplyTitle,
        eyebrow: t("elfLanding.supplyRankingTitle", locale),
        meta: t("elfLanding.supplyRankingScope", locale),
        statLabel: t("elfLanding.supply", locale),
        statValue: supplyChampion.quantity === null
          ? t("elfLanding.supplyPending", locale)
          : formatNumber(supplyChampion.quantity),
        rankLabel: "01",
        kind: "supply",
        eager: true
      })}
      ${wishlistChampion
        ? renderChampionCard({
          skin: wishlistChampion,
          title: championCopy.wishlistTitle,
          eyebrow: t("elfLanding.selectedWishes", locale),
          meta: t("elfLanding.wishlistScope", locale),
          statLabel: getWishCountLabel(locale, wishlistChampion.wishCount ?? 1, wishlist.community.status === "remote"),
          statValue: wishlistChampion.isLocalSelection
            ? t("elfLanding.cancelWish", locale)
            : formatNumber(wishlistChampion.wishCount ?? 1),
          rankLabel: "01",
          kind: "wishlist",
          action: wishlistChampion.isLocalSelection ? "cancel" : ""
        })
        : renderEmptyWishlistChampion(locale)}
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

function renderChampionCard({
  skin,
  title,
  eyebrow,
  meta,
  statLabel,
  statValue,
  rankLabel,
  kind,
  eager = false,
  action = ""
}) {
  return `
    <article class="elf-champion-card elf-champion-${escapeHtml(kind)} elf-skin-card-${escapeHtml(skin.tone)}">
      <div class="elf-champion-heading">
        <div>
          <p class="eyebrow">${eyebrow}</p>
          <h2>${title}</h2>
        </div>
        <span class="elf-champion-rank">#${rankLabel}</span>
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
          <span>${statLabel}</span>
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
      supplyTitle: "供給量排名第一",
      wishlistTitle: "願望清單第一"
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
  const wishCount = skin.wishCount ?? 1;

  return `
    <div class="elf-rank-row elf-skin-card-${escapeHtml(skin.tone)}">
      <span class="elf-rank-index">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeHtml(skin.image)}" alt="${escapeHtml(skin.name)}" width="64" height="64" loading="lazy" decoding="async">
      <div class="elf-rank-body">
        <strong>${escapeHtml(skin.name)}</strong>
        <small>${getWishCountLabel(locale, wishCount, skin.isRemoteLeader === true)}</small>
      </div>
      ${skin.isLocalSelection ? `
        <button class="elf-rank-cancel" type="button" data-wishlist-toggle="${escapeHtml(skin.id)}">
          ${t("elfLanding.cancelWish", locale)}
        </button>
      ` : ""}
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
      .slice(0, 5);
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
    .slice(0, 5);
}

function getWishCountLabel(locale, count, isRemote) {
  const formattedCount = formatNumber(count);

  if (isRemote) {
    return locale === "zh-Hant"
      ? `${formattedCount} 個全站願望`
      : `${formattedCount} community wishes`;
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
  return {
    status: communityState?.status ?? "disabled",
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
