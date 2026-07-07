import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderActorView(model) {
  const actorStats = model?.actorStats ?? [];

  return `
    <section class="content-panel" aria-labelledby="actor-stats-title">
      <div class="section-heading">
        <h2 id="actor-stats-title">Snapshot Actor Stats</h2>
        <span>${formatNumber(actorStats.length)} actors</span>
      </div>
      <p class="section-note">
        This section uses the currently loaded marketplace data only. True 7D/30D actor history requires the paused historical database phase.
      </p>
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
        <div><dt>Loaded Sold Count</dt><dd>${formatNumber(stat.soldCount)}</dd></div>
        <div><dt>Loaded Bought Count</dt><dd>${formatNumber(stat.boughtCount)}</dd></div>
        <div><dt>Loaded Sold Volume</dt><dd>${formatValue(stat.totalSoldValue, currency)}</dd></div>
        <div><dt>Loaded Bought Volume</dt><dd>${formatValue(stat.totalBoughtValue, currency)}</dd></div>
        <div><dt>Loaded Main Assets</dt><dd>${escapeHtml(tradedAssets || "No assets")}</dd></div>
        <div><dt>Loaded Counterparties</dt><dd>${formatNumber(stat.counterpartyCount)}</dd></div>
        <div><dt>Latest Loaded Activity</dt><dd>${formatTime(stat.lastSeen)}</dd></div>
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
