import { formatNumber } from "../../../../core/utils/numbers.js";
import { t } from "../../../../i18n/i18n.js";
import { buildMarketActors } from "./actors-model.js";

export function renderMarketActorsView(marketState, locale) {
  const actors = buildMarketActors(marketState?.model, marketState?.dataSource);
  const isReady = actors.status === "ready";

  return `
    <section class="market-actors-module" data-market-active-module="actors" data-market-actors-status="${actors.status}" aria-labelledby="market-actors-title">
      <div class="market-actors-heading">
        <div>
          <p class="eyebrow">${t("dashboard.actorModule.eyebrow", locale)}</p>
          <h3 id="market-actors-title">${t("dashboard.actorModule.title", locale)}</h3>
        </div>
        <span class="market-module-status market-module-status-${actors.status}">
          ${t(`dashboard.actorModule.status.${actors.status}`, locale)}
        </span>
      </div>
      <p class="market-actors-summary">
        ${t(`dashboard.actorModule.detail.${actors.status}`, locale)}
      </p>
      ${isReady ? renderReadyActors(actors, locale) : renderActorScope(locale)}
      <p class="market-actors-boundary">${t("dashboard.actorModule.identityBoundary", locale)}</p>
    </section>
  `;
}

function renderReadyActors(actors, locale) {
  return `
    <dl class="market-actors-metrics" aria-label="${t("dashboard.actorModule.metricsLabel", locale)}">
      ${renderMetric(t("dashboard.actorModule.actorCount", locale), formatNumber(actors.metrics.actorCount, { locale }))}
      ${renderMetric(t("dashboard.actorModule.sellerCount", locale), formatNumber(actors.metrics.sellerCount, { locale }))}
      ${renderMetric(t("dashboard.actorModule.buyerCount", locale), formatNumber(actors.metrics.buyerCount, { locale }))}
      ${renderMetric(t("dashboard.actorModule.activityLeader", locale), actors.metrics.activityLeaderName ?? "—")}
    </dl>
    <div class="market-actors-list" aria-label="${t("dashboard.actorModule.activityLeaders", locale)}">
      ${actors.actors.map((actor) => renderActorSummary(actor, locale)).join("")}
    </div>
  `;
}

function renderActorScope(locale) {
  return `
    <div class="market-actors-empty" role="note">
      <strong>${t("dashboard.actorModule.scopeTitle", locale)}</strong>
      <ul>
        <li>${t("dashboard.actorModule.scopeParticipation", locale)}</li>
        <li>${t("dashboard.actorModule.scopeCounterparties", locale)}</li>
        <li>${t("dashboard.actorModule.scopeEvidence", locale)}</li>
      </ul>
    </div>
  `;
}

function renderMetric(label, value) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function renderActorSummary(actor, locale) {
  const actorName = actor.name ?? t("dashboard.actorModule.unknownActor", locale);
  const assetNames = actor.mainAssets.length > 0
    ? actor.mainAssets.join(", ")
    : t("dashboard.actorModule.noObservedAssets", locale);

  return `
    <article class="market-actor-summary">
      <div>
        <strong>${escapeHtml(actorName)}</strong>
        <span>${escapeHtml(assetNames)}</span>
      </div>
      <dl>
        ${renderActorValue(t("dashboard.actorModule.sold", locale), actor.soldCount, locale)}
        ${renderActorValue(t("dashboard.actorModule.bought", locale), actor.boughtCount, locale)}
        ${renderActorValue(t("dashboard.actorModule.counterparties", locale), actor.counterpartyCount, locale)}
      </dl>
    </article>
  `;
}

function renderActorValue(label, value, locale) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${Number.isFinite(value) ? formatNumber(value, { locale }) : "—"}</dd>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
