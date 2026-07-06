import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderAssetView(model) {
  const assetStats = model?.assetStats ?? [];

  return `
    <section class="content-panel" aria-labelledby="asset-stats-title">
      <div class="section-heading">
        <h2 id="asset-stats-title">Asset Stats</h2>
        <span>${formatNumber(assetStats.length)} assets</span>
      </div>
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
      <span>${escapeHtml(stat.asset.group)} / ${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>Trades</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>Volume</dt><dd>${formatValue(stat.totalVolume, currency)}</dd></div>
        <div><dt>Avg Unit</dt><dd>${formatValue(stat.averageUnitValue, currency)}</dd></div>
        <div><dt>Latest</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
      </dl>
    </article>
  `;
}

function renderEmptyState() {
  return `<p class="empty-state">Asset stats will appear after the model is built.</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
