import { defaultLocale, t } from "../i18n/i18n.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderAnalyticsView(model, locale = defaultLocale) {
  const analytics = model?.analytics;
  const currency = model?.transactions[0]?.value.currency ?? t("transactions.units", locale);
  const totals = analytics?.activitySummary?.totals;

  return `
    <section class="content-panel" aria-labelledby="activity-summary-title">
      <div class="section-heading">
        <h2 id="activity-summary-title">${t("analytics.marketActivitySummary", locale)}</h2>
        <span>${formatNumber(analytics?.activitySummary?.totals?.totalTransactions ?? 0)} ${t("dashboard.transactions", locale).toLowerCase()}</span>
      </div>
      ${renderSectionNote(t("analytics.loadedTransactionsNote", locale))}
      <div class="activity-metric-grid">
        ${renderActivityMetric(t("dashboard.transactions", locale), formatNumber(totals?.totalTransactions ?? 0))}
        ${renderActivityMetric(t("dashboard.totalVolume", locale), formatValue(totals?.totalVolume ?? 0, currency))}
        ${renderActivityMetric(t("dashboard.activeSellers", locale), formatNumber(totals?.activeSellers ?? 0))}
        ${renderActivityMetric(t("dashboard.activeBuyers", locale), formatNumber(totals?.activeBuyers ?? 0))}
        ${renderActivityMetric(t("dashboard.latestTransaction", locale), formatTime(totals?.latestTransactionTime))}
      </div>
      <div class="analytics-summary-grid">
        ${renderBreakdownPanel(t("analytics.assetClassBreakdown", locale), analytics?.activitySummary?.assetClassBreakdown ?? [], currency, locale)}
        ${renderBreakdownPanel(t("analytics.categoryBreakdown", locale), analytics?.activitySummary?.categoryBreakdown ?? [], currency, locale)}
      </div>
    </section>

    <section class="content-panel" aria-labelledby="top-assets-title">
      <div class="section-heading">
        <h2 id="top-assets-title">${t("analytics.topTradedAssetsSnapshot", locale)}</h2>
        <span>${formatNumber(analytics?.topAssets?.length ?? 0)} ${t("analytics.shown", locale)}</span>
      </div>
      ${renderSectionNote(t("analytics.currentLoadedDatasetVolumeNote", locale))}
      <div class="compact-grid">
        ${analytics?.topAssets?.map((stat) => renderTopAsset(stat, locale)).join("") || renderEmptyState(t("empty.noAssetActivity", locale))}
      </div>
    </section>

    <section class="content-panel" aria-labelledby="top-sellers-title">
      <div class="section-heading">
        <h2 id="top-sellers-title">${t("analytics.topLoadedSellers", locale)}</h2>
        <span>${formatNumber(analytics?.topSellers?.length ?? 0)} ${t("analytics.shown", locale)}</span>
      </div>
      ${renderSectionNote(t("analytics.currentLoadedDatasetSoldNote", locale))}
      <div class="compact-grid">
        ${analytics?.topSellers?.map((stat) => renderActorCard(stat, "seller", locale)).join("") || renderEmptyState(t("empty.noSellerActivity", locale))}
      </div>
    </section>

    <section class="content-panel" aria-labelledby="top-buyers-title">
      <div class="section-heading">
        <h2 id="top-buyers-title">${t("analytics.topLoadedBuyers", locale)}</h2>
        <span>${formatNumber(analytics?.topBuyers?.length ?? 0)} ${t("analytics.shown", locale)}</span>
      </div>
      ${renderSectionNote(t("analytics.currentLoadedDatasetBoughtNote", locale))}
      <div class="compact-grid">
        ${analytics?.topBuyers?.map((stat) => renderActorCard(stat, "buyer", locale)).join("") || renderEmptyState(t("empty.noBuyerActivity", locale))}
      </div>
    </section>
  `;
}

function renderSectionNote(message) {
  return `<p class="section-note">${escapeHtml(message)}</p>`;
}

function renderActivityMetric(label, value) {
  return `
    <article class="activity-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderBreakdownPanel(title, entries, currency, locale) {
  const maxVolume = Math.max(...entries.map((entry) => entry.totalVolume), 0);

  return `
    <article class="analytics-panel">
      <h3>${escapeHtml(title)}</h3>
      <p class="panel-note">${t("analytics.sortedByCurrentLoadedVolume", locale)}</p>
      <div class="breakdown-list">
        ${entries.slice(0, 6).map((entry) => renderBreakdownRow(entry, currency, locale, maxVolume)).join("") || renderEmptyState(t("empty.noActivity", locale))}
      </div>
    </article>
  `;
}

function renderBreakdownRow(entry, currency, locale, maxVolume) {
  const percentage = maxVolume > 0
    ? Math.max(6, Math.round((entry.totalVolume / maxVolume) * 100))
    : 0;

  return `
    <div class="breakdown-row">
      <span>${escapeHtml(entry.name)}</span>
      <strong>${formatValue(entry.totalVolume, currency)}</strong>
      <small>${formatNumber(entry.tradeCount)} ${t("analytics.trades", locale).toLowerCase()} / ${formatNumber(entry.assetCount)} ${t("coverage.assets", locale)}</small>
      <span class="breakdown-meter" aria-hidden="true">
        <span style="width: ${percentage}%"></span>
      </span>
    </div>
  `;
}

function renderTopAsset(stat, locale) {
  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.asset.name)}</strong>
      <span>${escapeHtml(stat.asset.assetClass ?? t("coverage.assetClass.unclassifiedOther", locale))}</span>
      <span>${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>${t("analytics.trades", locale)}</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>${t("analytics.volume", locale)}</dt><dd>${formatValue(stat.totalVolume, stat.currency)}</dd></div>
        <div><dt>${t("analytics.quantity", locale)}</dt><dd>${formatNumber(stat.totalQuantity)}</dd></div>
        <div><dt>${t("analytics.avgUnit", locale)}</dt><dd>${formatValue(stat.averageUnitValue, stat.currency)}</dd></div>
        <div><dt>${t("analytics.lastUnit", locale)}</dt><dd>${formatValue(stat.lastUnitValue, stat.currency)}</dd></div>
        <div><dt>${t("analytics.latest", locale)}</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
      </dl>
    </article>
  `;
}

function renderActorCard(stat, role, locale) {
  const isSeller = role === "seller";
  const count = isSeller ? stat.soldCount : stat.boughtCount;
  const value = isSeller ? stat.totalSoldValue : stat.totalBoughtValue;
  const tradedAssets = stat.mainTradedAssets.map((asset) => asset.name).join(", ");

  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.actor.name)}</strong>
      <span>${escapeHtml(tradedAssets || t("empty.noAssets", locale))}</span>
      <dl>
        <div><dt>${isSeller ? t("analytics.sold", locale) : t("analytics.bought", locale)}</dt><dd>${formatNumber(count)}</dd></div>
        <div><dt>${t("analytics.totalValue", locale)}</dt><dd>${formatValue(value, stat.currency)}</dd></div>
        <div><dt>${t("analytics.mainAssets", locale)}</dt><dd>${escapeHtml(tradedAssets || t("empty.noAssets", locale))}</dd></div>
        <div><dt>${t("analytics.lastSeen", locale)}</dt><dd>${formatTime(stat.lastSeen)}</dd></div>
      </dl>
    </article>
  `;
}

function renderEmptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
