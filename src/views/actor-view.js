import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderActorView(model) {
  const actorStats = model?.actorStats ?? [];

  return `
    <section class="content-panel" aria-labelledby="actor-stats-title">
      <div class="section-heading">
        <h2 id="actor-stats-title">Actor Stats</h2>
        <span>${formatNumber(actorStats.length)} actors</span>
      </div>
      <div class="compact-grid">
        ${actorStats.slice(0, 4).map(renderActorStat).join("") || renderEmptyState()}
      </div>
    </section>
  `;
}

function renderActorStat(stat) {
  const tradedAssets = stat.mainTradedAssets.map((asset) => asset.name).join(", ");
  const currency = stat.currency;

  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.actor.name)}</strong>
      <span>${escapeHtml(tradedAssets || "No assets")}</span>
      <dl>
        <div><dt>Sold</dt><dd>${formatNumber(stat.soldCount)}</dd></div>
        <div><dt>Bought</dt><dd>${formatNumber(stat.boughtCount)}</dd></div>
        <div><dt>Sold Value</dt><dd>${formatValue(stat.totalSoldValue, currency)}</dd></div>
        <div><dt>Bought Value</dt><dd>${formatValue(stat.totalBoughtValue, currency)}</dd></div>
        <div><dt>Counterparties</dt><dd>${formatNumber(stat.counterpartyCount)}</dd></div>
        <div><dt>Last Seen</dt><dd>${formatTime(stat.lastSeen)}</dd></div>
      </dl>
    </article>
  `;
}

function renderEmptyState() {
  return `<p class="empty-state">Actor stats will appear after the model is built.</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
