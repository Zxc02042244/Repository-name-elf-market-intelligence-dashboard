import { defaultLocale, t } from "../i18n/i18n.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderAssetView(model, locale = defaultLocale) {
  const assetStats = model?.assetStats ?? [];

  return `
    <section class="content-panel" aria-labelledby="asset-stats-title">
      <div class="section-heading">
        <h2 id="asset-stats-title">${t("asset.snapshotStats", locale)}</h2>
        <span>${formatNumber(assetStats.length)} ${t("coverage.assets", locale)}</span>
      </div>
      <p class="section-note">
        ${t("asset.snapshotNote", locale)}
      </p>
      <div class="compact-grid">
        ${assetStats.slice(0, 4).map((stat) => renderAssetStat(stat, locale)).join("") || renderEmptyState(locale)}
      </div>
    </section>
  `;
}

function renderAssetStat(stat, locale) {
  const currency = stat.currency;

  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.asset.name)}</strong>
      <span>${escapeHtml(stat.asset.assetClass ?? t("coverage.assetClass.unclassifiedOther", locale))}</span>
      <span>${escapeHtml(stat.asset.group)} / ${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>${t("asset.loadedTrades", locale)}</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>${t("asset.loadedVolume", locale)}</dt><dd>${formatValue(stat.totalVolume, currency)}</dd></div>
        <div><dt>${t("asset.loadedQuantity", locale)}</dt><dd>${formatNumber(stat.totalQuantity)}</dd></div>
        <div><dt>${t("asset.snapshotAvgUnit", locale)}</dt><dd>${formatValue(stat.averageUnitValue, currency)}</dd></div>
        <div><dt>${t("asset.latestLoadedUnit", locale)}</dt><dd>${formatValue(stat.lastUnitValue, currency)}</dd></div>
        <div><dt>${t("asset.latestLoadedTrade", locale)}</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
        <div><dt>${t("asset.loadedSellers", locale)}</dt><dd>${formatNumber(stat.activeSellers)}</dd></div>
        <div><dt>${t("asset.loadedBuyers", locale)}</dt><dd>${formatNumber(stat.activeBuyers)}</dd></div>
      </dl>
    </article>
  `;
}

function renderEmptyState(locale) {
  return `<p class="empty-state">${t("empty.assetStatsPending", locale)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
