import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderAnalyticsView(model) {
  const analytics = model?.analytics;
  const currency = model?.transactions[0]?.value.currency ?? "units";
  const totals = analytics?.activitySummary?.totals;

  return `
    <section class="content-panel" aria-labelledby="activity-summary-title">
      <div class="section-heading">
        <h2 id="activity-summary-title">Market Activity Summary</h2>
        <span>${formatNumber(analytics?.activitySummary?.totals?.totalTransactions ?? 0)} transactions</span>
      </div>
      <div class="activity-metric-grid">
        ${renderActivityMetric("Transactions", formatNumber(totals?.totalTransactions ?? 0))}
        ${renderActivityMetric("Total Volume", formatValue(totals?.totalVolume ?? 0, currency))}
        ${renderActivityMetric("Active Sellers", formatNumber(totals?.activeSellers ?? 0))}
        ${renderActivityMetric("Active Buyers", formatNumber(totals?.activeBuyers ?? 0))}
        ${renderActivityMetric("Latest Transaction", formatTime(totals?.latestTransactionTime))}
      </div>
      <div class="analytics-summary-grid">
        ${renderBreakdownPanel("Asset Classes", analytics?.activitySummary?.assetClassBreakdown ?? [], currency)}
        ${renderBreakdownPanel("Categories", analytics?.activitySummary?.categoryBreakdown ?? [], currency)}
      </div>
    </section>

    <section class="content-panel" aria-labelledby="top-assets-title">
      <div class="section-heading">
        <h2 id="top-assets-title">Top Traded Assets</h2>
        <span>${formatNumber(analytics?.topAssets?.length ?? 0)} shown</span>
      </div>
      <div class="compact-grid">
        ${analytics?.topAssets?.map(renderTopAsset).join("") || renderEmptyState("No asset activity yet.")}
      </div>
    </section>

    <section class="content-panel" aria-labelledby="top-sellers-title">
      <div class="section-heading">
        <h2 id="top-sellers-title">Top Sellers</h2>
        <span>${formatNumber(analytics?.topSellers?.length ?? 0)} shown</span>
      </div>
      <div class="compact-grid">
        ${analytics?.topSellers?.map((stat) => renderActorCard(stat, "seller")).join("") || renderEmptyState("No seller activity yet.")}
      </div>
    </section>

    <section class="content-panel" aria-labelledby="top-buyers-title">
      <div class="section-heading">
        <h2 id="top-buyers-title">Top Buyers</h2>
        <span>${formatNumber(analytics?.topBuyers?.length ?? 0)} shown</span>
      </div>
      <div class="compact-grid">
        ${analytics?.topBuyers?.map((stat) => renderActorCard(stat, "buyer")).join("") || renderEmptyState("No buyer activity yet.")}
      </div>
    </section>
  `;
}

function renderActivityMetric(label, value) {
  return `
    <article class="activity-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderBreakdownPanel(title, entries, currency) {
  return `
    <article class="analytics-panel">
      <h3>${escapeHtml(title)}</h3>
      <div class="breakdown-list">
        ${entries.slice(0, 6).map((entry) => renderBreakdownRow(entry, currency)).join("") || renderEmptyState("No activity yet.")}
      </div>
    </article>
  `;
}

function renderBreakdownRow(entry, currency) {
  return `
    <div class="breakdown-row">
      <span>${escapeHtml(entry.name)}</span>
      <strong>${formatValue(entry.totalVolume, currency)}</strong>
      <small>${formatNumber(entry.tradeCount)} trades / ${formatNumber(entry.assetCount)} assets</small>
    </div>
  `;
}

function renderTopAsset(stat) {
  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.asset.name)}</strong>
      <span>${escapeHtml(stat.asset.assetClass ?? "Unclassified / Other")}</span>
      <span>${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>Trades</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>Volume</dt><dd>${formatValue(stat.totalVolume, stat.currency)}</dd></div>
        <div><dt>Quantity</dt><dd>${formatNumber(stat.totalQuantity)}</dd></div>
        <div><dt>Avg Unit</dt><dd>${formatValue(stat.averageUnitValue, stat.currency)}</dd></div>
        <div><dt>Last Unit</dt><dd>${formatValue(stat.lastUnitValue, stat.currency)}</dd></div>
        <div><dt>Latest</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
      </dl>
    </article>
  `;
}

function renderActorCard(stat, role) {
  const isSeller = role === "seller";
  const count = isSeller ? stat.soldCount : stat.boughtCount;
  const value = isSeller ? stat.totalSoldValue : stat.totalBoughtValue;
  const tradedAssets = stat.mainTradedAssets.map((asset) => asset.name).join(", ");

  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.actor.name)}</strong>
      <span>${escapeHtml(tradedAssets || "No assets")}</span>
      <dl>
        <div><dt>${isSeller ? "Sold" : "Bought"}</dt><dd>${formatNumber(count)}</dd></div>
        <div><dt>Total Value</dt><dd>${formatValue(value, stat.currency)}</dd></div>
        <div><dt>Main Assets</dt><dd>${formatNumber(stat.mainTradedAssets.length)}</dd></div>
        <div><dt>Last Seen</dt><dd>${formatTime(stat.lastSeen)}</dd></div>
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
