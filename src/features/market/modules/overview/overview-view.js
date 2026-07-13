import { formatNumber, formatValue } from "../../../../core/utils/numbers.js";
import { t } from "../../../../i18n/i18n.js";
import { buildMarketOverview } from "./overview-model.js";

export function renderMarketOverviewView(marketState, locale) {
  const overview = buildMarketOverview(marketState?.model, marketState?.dataSource);
  const isReady = overview.status === "ready";

  return `
    <section class="market-overview-module" data-market-active-module="overview" data-market-overview-status="${overview.status}" aria-labelledby="market-overview-title">
      <div class="market-overview-heading">
        <div>
          <p class="eyebrow">${t("dashboard.overviewEyebrow", locale)}</p>
          <h3 id="market-overview-title">${t("dashboard.marketTotals", locale)}</h3>
        </div>
        <span class="market-module-status market-module-status-${overview.status}">
          ${t(`dashboard.overviewStatus.${overview.status}`, locale)}
        </span>
      </div>
      <p class="market-overview-summary">
        ${t(`dashboard.overviewDetail.${overview.status}`, locale)}
      </p>
      <div class="market-overview-metrics" aria-label="${t("dashboard.overviewMetrics", locale)}">
        ${renderMetric(t("dashboard.transactions", locale), isReady ? formatNumber(overview.metrics.totalTransactions, { locale }) : "—", "transactions")}
        ${renderMetric(t("dashboard.totalVolume", locale), isReady ? formatValue(overview.metrics.totalVolume, overview.currency, { locale }) : "—", "volume")}
        ${renderMetric(t("dashboard.activeBuyers", locale), isReady ? formatNumber(overview.metrics.activeBuyers, { locale }) : "—", "buyers")}
        ${renderMetric(t("dashboard.activeSellers", locale), isReady ? formatNumber(overview.metrics.activeSellers, { locale }) : "—", "sellers")}
      </div>
      <dl class="market-overview-meta">
        ${renderMeta(t("dashboard.overviewUpdatedAt", locale), isReady ? formatOverviewTime(overview.updatedAt, locale) : "—")}
        ${renderMeta(t("dashboard.overviewDataQuality", locale), isReady ? formatDataQuality(overview.dataQuality, locale) : "—")}
      </dl>
    </section>
  `;
}

function renderMetric(label, value, metricId) {
  return `
    <article class="market-overview-metric" data-market-overview-metric="${metricId}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderMeta(label, value) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function formatDataQuality(dataQuality, locale) {
  if (!Number.isFinite(dataQuality?.receivedCount) || !Number.isFinite(dataQuality?.acceptedCount)) {
    return t("dashboard.overviewQualityUnavailable", locale);
  }

  return t("dashboard.overviewQualitySummary", locale, {
    accepted: formatNumber(dataQuality.acceptedCount, { locale }),
    received: formatNumber(dataQuality.receivedCount, { locale })
  });
}

function formatOverviewTime(timestamp, locale) {
  if (!Number.isFinite(timestamp)) {
    return t("dashboard.overviewTimeUnavailable", locale);
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
