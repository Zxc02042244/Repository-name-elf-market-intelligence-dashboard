import { defaultLocale, t } from "../i18n/i18n.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderDashboardView(model, status, route, locale = defaultLocale) {
  const totals = model?.totals;
  const currency = model?.transactions[0]?.value.currency ?? t("transactions.units", locale);
  const hasTransactions = (totals?.totalTransactions ?? 0) > 0;
  const isUnavailable = status.kind === "error" && !hasTransactions;
  const metricOptions = { unavailable: isUnavailable };

  return `
    <section class="status-strip status-${status.kind}" role="status" aria-live="polite">
      <span>
        <strong>${escapeHtml(localizeStatusMessage(status.message, locale))}</strong>
        ${status.detail ? `<small>${escapeHtml(status.detail)}</small>` : ""}
      </span>
      <span>${status.updatedAt && status.kind !== "error" ? t("status.updatedAt", locale, { time: formatTime(status.updatedAt) }) : t("status.waitingForData", locale)}</span>
    </section>

    ${isUnavailable ? renderUnavailableNotice(status, locale) : ""}

    <section class="dashboard-grid" aria-label="${t("dashboard.marketTotals", locale)}">
      ${renderMetricCard(t("dashboard.transactions", locale), totals?.totalTransactions ?? 0, metricOptions)}
      ${renderMetricCard(t("dashboard.totalVolume", locale), formatValue(totals?.totalVolume ?? 0, currency), metricOptions)}
      ${renderMetricCard(t("dashboard.activeSellers", locale), totals?.activeSellers ?? 0, metricOptions)}
      ${renderMetricCard(t("dashboard.activeBuyers", locale), totals?.activeBuyers ?? 0, metricOptions)}
    </section>

    <section class="summary-panel">
      <div>
        <h2>${t("dashboard.modelSnapshot", locale)}</h2>
        <p>${t("dashboard.source", locale)}: ${escapeHtml(model?.meta.source ?? t("dashboard.pending", locale))}</p>
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

function renderUnavailableNotice(status, locale) {
  return `
    <section class="empty-state empty-state-prominent" aria-label="${t("status.liveDataUnavailable", locale)}">
      <strong>${escapeHtml(localizeStatusMessage(status.message, locale))}</strong>
      <span>${t("status.waitingForData", locale)}</span>
    </section>
  `;
}

function renderMetricCard(label, value, options = {}) {
  const displayValue = options.unavailable ? "—" : value;

  return `
    <article class="metric-card ${options.unavailable ? "metric-card-unavailable" : ""}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(displayValue))}</strong>
    </article>
  `;
}

function localizeStatusMessage(message, locale) {
  const statusKeys = {
    "Loading live market transactions...": "status.loadingLiveMarketTransactions",
    "Partial data loaded. Some items failed.": "status.partialDataLoaded",
    "Updated from Elf live adapter.": "status.updatedFromLiveAdapter",
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
