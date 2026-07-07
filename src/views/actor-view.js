import { defaultLocale, t } from "../i18n/i18n.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderActorView(model, locale = defaultLocale) {
  const actorStats = model?.actorStats ?? [];

  return `
    <section class="content-panel" aria-labelledby="actor-stats-title">
      <div class="section-heading">
        <h2 id="actor-stats-title">${t("actor.snapshotStats", locale)}</h2>
        <span>${formatNumber(actorStats.length)} ${t("snapshot.actorsMode", locale).toLowerCase()}</span>
      </div>
      <p class="section-note">
        ${t("actor.snapshotNote", locale)}
      </p>
      <div class="compact-grid">
        ${actorStats.slice(0, 4).map((stat) => renderActorStat(stat, locale)).join("") || renderEmptyState(locale)}
      </div>
    </section>
  `;
}

function renderActorStat(stat, locale) {
  const tradedAssets = stat.mainTradedAssets.map((asset) => asset.name).join(", ");
  const currency = stat.currency;

  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.actor.name)}</strong>
      <span>${escapeHtml(tradedAssets || t("empty.noAssets", locale))}</span>
      <dl>
        <div><dt>${t("actor.loadedSoldCount", locale)}</dt><dd>${formatNumber(stat.soldCount)}</dd></div>
        <div><dt>${t("actor.loadedBoughtCount", locale)}</dt><dd>${formatNumber(stat.boughtCount)}</dd></div>
        <div><dt>${t("actor.loadedSoldVolume", locale)}</dt><dd>${formatValue(stat.totalSoldValue, currency)}</dd></div>
        <div><dt>${t("actor.loadedBoughtVolume", locale)}</dt><dd>${formatValue(stat.totalBoughtValue, currency)}</dd></div>
        <div><dt>${t("actor.loadedMainAssets", locale)}</dt><dd>${escapeHtml(tradedAssets || t("empty.noAssets", locale))}</dd></div>
        <div><dt>${t("actor.loadedCounterparties", locale)}</dt><dd>${formatNumber(stat.counterpartyCount)}</dd></div>
        <div><dt>${t("actor.latestLoadedActivity", locale)}</dt><dd>${formatTime(stat.lastSeen)}</dd></div>
      </dl>
    </article>
  `;
}

function renderEmptyState(locale) {
  return `<p class="empty-state">${t("empty.actorStatsPending", locale)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
