import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderDashboardView(model, status) {
  const totals = model?.totals;
  const currency = model?.transactions[0]?.value.currency ?? "units";

  return `
    <section class="status-strip status-${status.kind}" role="status" aria-live="polite">
      <span>${escapeHtml(status.message)}</span>
      <span>${status.updatedAt ? `Updated ${formatTime(status.updatedAt)}` : "Waiting for data"}</span>
    </section>

    <section class="dashboard-grid" aria-label="Market totals">
      ${renderMetricCard("Transactions", totals?.totalTransactions ?? 0)}
      ${renderMetricCard("Total Volume", formatValue(totals?.totalVolume ?? 0, currency))}
      ${renderMetricCard("Active Sellers", totals?.activeSellers ?? 0)}
      ${renderMetricCard("Active Buyers", totals?.activeBuyers ?? 0)}
    </section>

    <section class="summary-panel">
      <div>
        <h2>Model Snapshot</h2>
        <p>Source: ${escapeHtml(model?.meta.source ?? "Pending")}</p>
      </div>
      <div class="snapshot-list">
        <span>Latest Transaction</span>
        <strong>${formatTime(totals?.latestTransactionTime)}</strong>
      </div>
      <div class="snapshot-list">
        <span>Signal Modules</span>
        <strong>${formatNumber(model?.signals.length ?? 0)}</strong>
      </div>
    </section>
  `;
}

function renderMetricCard(label, value) {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
