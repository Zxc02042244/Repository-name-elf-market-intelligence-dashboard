import { defaultLocale, t } from "../i18n/i18n.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderTransactionsView(model, locale = defaultLocale) {
  const transactions = model?.transactions ?? [];
  const visibleTransactions = transactions.slice(0, 120);

  return `
    <section class="table-panel" aria-labelledby="recent-transactions-title">
      <div class="section-heading">
        <h2 id="recent-transactions-title">${t("transactions.recentTransactions", locale)}</h2>
        <span>${formatRecordCount(visibleTransactions.length, transactions.length, locale)}</span>
      </div>
      <div class="transaction-list">
        ${
          visibleTransactions.length > 0
            ? visibleTransactions.map((transaction) => renderTransaction(transaction, locale)).join("")
            : renderEmptyState(locale)
        }
      </div>
    </section>
  `;
}

function formatRecordCount(visibleCount, totalCount, locale) {
  if (visibleCount === totalCount) {
    return t("transactions.records", locale, { count: formatNumber(totalCount) });
  }

  return t("transactions.recordsVisible", locale, {
    visible: formatNumber(visibleCount),
    total: formatNumber(totalCount)
  });
}

function renderTransaction(transaction, locale) {
  return `
    <article class="transaction-row">
      <div>
        <strong>${escapeHtml(transaction.asset.name)}</strong>
        <span>${escapeHtml(transaction.asset.group)} / ${escapeHtml(transaction.asset.category)}</span>
      </div>
      <div>
        <span>${t("transactions.quantity", locale)}</span>
        <strong>${formatNumber(transaction.quantity)}</strong>
      </div>
      <div>
        <span>${t("transactions.total", locale)}</span>
        <strong>${formatValue(transaction.value.total, transaction.value.currency)}</strong>
      </div>
      <div>
        <span>${t("transactions.unit", locale)}</span>
        <strong>${formatValue(transaction.value.unit, transaction.value.currency)}</strong>
      </div>
      <div>
        <span>${t("transactions.seller", locale)}</span>
        <strong>${escapeHtml(transaction.actors.seller.name)}</strong>
      </div>
      <div>
        <span>${t("transactions.buyer", locale)}</span>
        <strong>${escapeHtml(transaction.actors.buyer.name)}</strong>
      </div>
      <time datetime="${new Date(transaction.time).toISOString()}">${formatTime(transaction.time)}</time>
    </article>
  `;
}

function renderEmptyState(locale) {
  return `<p class="empty-state">${t("empty.noTransactionsReturned", locale)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
