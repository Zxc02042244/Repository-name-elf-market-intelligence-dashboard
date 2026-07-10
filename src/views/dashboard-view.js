import { defaultLocale, t } from "../i18n/i18n.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderDashboardView(model, status, route, locale = defaultLocale) {
  const totals = model?.totals;
  const currency = model?.transactions[0]?.value.currency ?? t("transactions.units", locale);
  const hasTransactions = (totals?.totalTransactions ?? 0) > 0;
  const isUnavailable = status.kind === "error" && !hasTransactions;
  const metricOptions = { unavailable: isUnavailable, loading: status.kind === "loading" };
  const marketSignals = buildMarketSignals(model, totals);
  const statusAside = status.updatedAt && status.kind !== "error"
    ? t("status.updatedAt", locale, { time: formatTime(status.updatedAt) })
    : isUnavailable
      ? t("dashboard.pending", locale)
      : t("status.waitingForData", locale);

  return `
    <section class="status-strip status-${status.kind}" role="status" aria-live="polite" aria-busy="${status.kind === "loading" ? "true" : "false"}">
      <span>
        <strong>${escapeHtml(localizeStatusMessage(status.message, locale))}</strong>
        ${status.detail ? `<small>${escapeHtml(status.detail)}</small>` : ""}
      </span>
      <span>${statusAside}</span>
    </section>

    <section class="dashboard-grid" id="market-overview" aria-label="${t("dashboard.marketTotals", locale)}">
      ${renderMetricCard(t("dashboard.transactions", locale), totals?.totalTransactions ?? 0, {
        ...metricOptions,
        tone: "trade",
        chip: `${formatNumber(marketSignals.transactionsPerAsset)} ${t("dashboard.perAsset", locale)}`,
        detail: totals?.latestTransactionTime
          ? `${t("dashboard.latestTransaction", locale)}: ${formatTime(totals.latestTransactionTime)}`
          : t("dashboard.noTransactions", locale),
        meter: Math.min(marketSignals.transactionsPerAsset / 3, 1)
      })}
      ${renderMetricCard(t("dashboard.totalVolume", locale), formatValue(totals?.totalVolume ?? 0, currency), {
        ...metricOptions,
        tone: "value",
        chip: formatValue(marketSignals.averageTransactionValue, currency),
        detail: `${formatPercent(marketSignals.topAssetShare)} ${t("dashboard.ofLoadedVolume", locale)}`,
        meter: marketSignals.topAssetShare
      })}
      ${renderMetricCard(t("dashboard.activeSellers", locale), totals?.activeSellers ?? 0, {
        ...metricOptions,
        tone: "seller",
        chip: formatPercent(marketSignals.activeSellerShare),
        detail: t("dashboard.ofActiveParticipants", locale),
        meter: marketSignals.activeSellerShare
      })}
      ${renderMetricCard(t("dashboard.activeBuyers", locale), totals?.activeBuyers ?? 0, {
        ...metricOptions,
        tone: "buyer",
        chip: formatPercent(marketSignals.activeBuyerShare),
        detail: t("dashboard.ofActiveParticipants", locale),
        meter: marketSignals.activeBuyerShare
      })}
    </section>

    ${renderInsightStrip(model, totals, currency, metricOptions, locale, marketSignals)}

    ${renderMarketSourcePanel(model, status, locale)}

    <section class="summary-panel">
      <div>
        <h2>${t("dashboard.modelSnapshot", locale)}</h2>
        ${renderSourceLine(model, status, locale)}
      </div>
      <div class="snapshot-list">
        <span>${t("dashboard.latestTransaction", locale)}</span>
        <strong>${totals?.latestTransactionTime ? formatTime(totals.latestTransactionTime) : t("dashboard.noTransactions", locale)}</strong>
      </div>
      <div class="snapshot-list">
        <span>${t("dashboard.signalModules", locale)}</span>
        <strong>${formatNumber(model?.signals.length ?? 0)}</strong>
      </div>
    </section>
  `;
}

function renderMarketSourcePanel(model, status, locale) {
  const sourceLabel = status.kind === "fallback"
    ? t("status.elfDemoSnapshot", locale)
    : model?.meta.source ?? t("dashboard.pending", locale);
  const liveDetail = status.kind === "fallback"
    ? t("dashboard.marketSourceLiveFallbackDetail", locale)
    : t("dashboard.marketSourceLiveDetail", locale);

  return `
    <section class="data-source-panel data-source-panel-market" aria-label="${t("dashboard.marketSourceTitle", locale)}">
      <div class="section-heading">
        <h2>${t("dashboard.marketSourceTitle", locale)}</h2>
        <span>${escapeHtml(sourceLabel)}</span>
      </div>
      <div class="data-source-grid">
        ${renderDataSourceItem(
          t("dashboard.marketSourceLive", locale),
          liveDetail
        )}
        ${renderDataSourceItem(
          t("dashboard.marketSourceModel", locale),
          t("dashboard.marketSourceModelDetail", locale)
        )}
        ${renderDataSourceItem(
          t("dashboard.marketSourcePrivacy", locale),
          t("dashboard.marketSourcePrivacyDetail", locale)
        )}
      </div>
    </section>
  `;
}

function renderDataSourceItem(title, detail) {
  return `
    <article class="data-source-item">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </article>
  `;
}

function buildMarketSignals(model, totals) {
  const totalTransactions = totals?.totalTransactions ?? 0;
  const totalVolume = totals?.totalVolume ?? 0;
  const activeSellers = totals?.activeSellers ?? 0;
  const activeBuyers = totals?.activeBuyers ?? 0;
  const activeParticipantCount = activeSellers + activeBuyers;
  const assetCount = model?.assetStats.length ?? 0;
  const activeActors = new Set([
    ...(model?.actorStats ?? []).filter((stat) => stat.soldCount > 0).map((stat) => stat.actor.id),
    ...(model?.actorStats ?? []).filter((stat) => stat.boughtCount > 0).map((stat) => stat.actor.id)
  ]).size;
  const topAsset = [...(model?.assetStats ?? [])].sort((left, right) => right.totalVolume - left.totalVolume)[0];
  const topAssetShare = totalVolume > 0 && topAsset
    ? topAsset.totalVolume / totalVolume
    : 0;
  const averageTransactionValue = totalTransactions > 0
    ? totalVolume / totalTransactions
    : 0;
  const liquidityDensity = activeActors > 0
    ? totalTransactions / activeActors
    : 0;

  return {
    activeBuyerShare: activeParticipantCount > 0 ? activeBuyers / activeParticipantCount : 0,
    activeSellerShare: activeParticipantCount > 0 ? activeSellers / activeParticipantCount : 0,
    averageTransactionValue,
    liquidityDensity,
    topAsset,
    topAssetShare,
    transactionsPerAsset: assetCount > 0 ? totalTransactions / assetCount : 0
  };
}

function renderInsightStrip(model, totals, currency, options, locale, signals = buildMarketSignals(model, totals)) {
  const insightOptions = { unavailable: options.unavailable, loading: options.loading };

  return `
    <section class="insight-grid" aria-label="${t("dashboard.snapshotSignals", locale)}">
      ${renderInsightCard(t("dashboard.avgTransactionValue", locale), formatValue(signals.averageTransactionValue, currency), t("analytics.tradeDensity", locale), insightOptions)}
      ${renderInsightCard(t("dashboard.assetsObserved", locale), formatNumber(model?.assetStats.length ?? 0), t("insight.assetCount", locale, { count: formatNumber(model?.assetStats.length ?? 0) }), insightOptions)}
      ${renderInsightCard(t("dashboard.topAssetShare", locale), formatPercent(signals.topAssetShare), signals.topAsset?.asset.name ?? t("insight.noConcentration", locale), insightOptions)}
      ${renderInsightCard(t("dashboard.liquidityDensity", locale), formatNumber(signals.liquidityDensity), t("dashboard.perActiveActor", locale), insightOptions)}
    </section>
  `;
}

function renderInsightCard(label, value, detail, options = {}) {
  const displayValue = options.unavailable ? "--" : value;

  return `
    <article class="insight-card ${options.unavailable ? "metric-card-unavailable" : ""} ${options.loading ? "metric-card-loading" : ""}" ${options.loading ? 'aria-busy="true"' : ""}>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(displayValue))}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function renderSourceLine(model, status, locale) {
  const sourceLabel = status.kind === "fallback"
    ? t("status.elfDemoSnapshot", locale)
    : model?.meta.source ?? t("dashboard.pending", locale);
  const fallbackBadge = status.kind === "fallback"
    ? `<span class="source-badge source-badge-fallback">${t("status.fallbackSnapshot", locale)}</span>`
    : "";

  return `
    <p class="source-line">
      <span>${t("dashboard.source", locale)}: <strong>${escapeHtml(sourceLabel)}</strong></span>
      ${fallbackBadge}
    </p>
  `;
}

function renderMetricCard(label, value, options = {}) {
  const displayValue = options.unavailable ? "--" : value;
  const displayChip = options.unavailable ? "--" : options.chip;
  const displayDetail = options.unavailable ? "" : options.detail;
  const meterValue = options.unavailable ? 0 : clampRatio(options.meter ?? 0);
  const toneClass = options.tone ? `metric-card-${options.tone}` : "";

  return `
    <article class="metric-card ${toneClass} ${options.unavailable ? "metric-card-unavailable" : ""} ${options.loading ? "metric-card-loading" : ""}" ${options.loading ? 'aria-busy="true"' : ""}>
      <div class="metric-card-top">
        <span>${escapeHtml(label)}</span>
        ${displayChip ? `<small class="metric-chip">${escapeHtml(displayChip)}</small>` : ""}
      </div>
      <strong>${escapeHtml(String(displayValue))}</strong>
      <span class="metric-card-meter" aria-hidden="true">
        <span style="width: ${Math.round(meterValue * 100)}%"></span>
      </span>
      ${displayDetail ? `<small class="metric-detail">${escapeHtml(displayDetail)}</small>` : ""}
    </article>
  `;
}

function clampRatio(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(value, 1);
}

function formatPercent(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  return `${Math.round(value * 100)}%`;
}

function localizeStatusMessage(message, locale) {
  const statusKeys = {
    "Loading live market transactions...": "status.loadingLiveMarketTransactions",
    "Partial data loaded. Some items failed.": "status.partialDataLoaded",
    "Updated from Elf live adapter.": "status.updatedFromLiveAdapter",
    "Live unavailable, showing demo snapshot.": "status.liveUnavailableShowingDemoSnapshot",
    "No transactions returned.": "status.noTransactionsReturned",
    "Token refresh failed. Live data is unavailable.": "status.tokenRefreshFailedLiveUnavailable",
    "Item request failed. Live data is unavailable.": "status.itemRequestFailedLiveUnavailable",
    "Unexpected API response format.": "status.unexpectedApiResponseFormat"
  };

  return statusKeys[message] ? t(statusKeys[message], locale) : message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
