import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderAssetView(model) {
  const assetStats = model?.assetStats ?? [];

  return `
    <section class="content-panel" aria-labelledby="asset-stats-title">
      <div class="section-heading">
        <h2 id="asset-stats-title">Snapshot Asset Stats</h2>
        <span>${formatNumber(assetStats.length)} assets</span>
      </div>
      <p class="section-note">
        This section uses the currently loaded marketplace data only. True 7D/30D history requires the paused historical database phase.
      </p>
      <div class="compact-grid">
        ${assetStats.slice(0, 4).map(renderAssetStat).join("") || renderEmptyState()}
      </div>
    </section>
  `;
}

function renderAssetStat(stat) {
  const currency = stat.currency;

  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.asset.name)}</strong>
      <span>${escapeHtml(stat.asset.assetClass ?? "Unclassified / Other")}</span>
      <span>${escapeHtml(stat.asset.group)} / ${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>Loaded Trades</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>Loaded Volume</dt><dd>${formatValue(stat.totalVolume, currency)}</dd></div>
        <div><dt>Loaded Quantity</dt><dd>${formatNumber(stat.totalQuantity)}</dd></div>
        <div><dt>Snapshot Avg Unit</dt><dd>${formatValue(stat.averageUnitValue, currency)}</dd></div>
        <div><dt>Latest Loaded Unit</dt><dd>${formatValue(stat.lastUnitValue, currency)}</dd></div>
        <div><dt>Latest Loaded Trade</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
        <div><dt>Loaded Sellers</dt><dd>${formatNumber(stat.activeSellers)}</dd></div>
        <div><dt>Loaded Buyers</dt><dd>${formatNumber(stat.activeBuyers)}</dd></div>
      </dl>
    </article>
  `;
}

function renderEmptyState() {
  return `<p class="empty-state">Snapshot asset stats will appear after the model is built.</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
