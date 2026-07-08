import { defaultLocale, t } from "../i18n/i18n.js";
import { buildRouteHash } from "../app/router.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderTransactionsView(model, route = {}, locale = defaultLocale) {
  const transactions = model?.transactions ?? [];
  const visibleTransactions = transactions.slice(0, 120);
  const maxTransactionValue = Math.max(...visibleTransactions.map((transaction) => transaction.value.total), 0);

  return `
    <section class="table-panel" aria-labelledby="recent-transactions-title">
      <div class="section-heading">
        <h2 id="recent-transactions-title">${t("transactions.recentTransactions", locale)}</h2>
        <span>${formatRecordCount(visibleTransactions.length, transactions.length, locale)}</span>
      </div>
      <div class="transaction-list">
        ${
          visibleTransactions.length > 0
            ? visibleTransactions.map((transaction) => renderTransaction(transaction, route, locale, maxTransactionValue)).join("")
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

function renderTransaction(transaction, route, locale, maxTransactionValue) {
  const percentage = maxTransactionValue > 0
    ? Math.round((transaction.value.total / maxTransactionValue) * 100)
    : 0;
  const meterWidth = transaction.value.total > 0 ? Math.max(6, percentage) : 0;

  return `
    <article class="transaction-row">
      <div>
        ${renderAssetFieldLink(transaction.asset, route)}
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
        ${renderActorFieldLink(transaction.actors.seller, route)}
      </div>
      <div>
        <span>${t("transactions.buyer", locale)}</span>
        ${renderActorFieldLink(transaction.actors.buyer, route)}
      </div>
      <time datetime="${new Date(transaction.time).toISOString()}">${formatTime(transaction.time)}</time>
      <span class="transaction-value-meter" aria-hidden="true">
        <span style="width: ${meterWidth}%"></span>
      </span>
    </article>
  `;
}

function renderAssetFieldLink(asset, route) {
  return `
    <a class="field-drilldown-link" href="${buildRouteHash(route, {
      mode: "assets",
      assetId: String(asset.id),
      actorId: ""
    })}">
      ${escapeHtml(asset.name)}
    </a>
  `;
}

function renderActorFieldLink(actor, route) {
  return `
    <a class="field-drilldown-link" href="${buildRouteHash(route, {
      mode: "actors",
      actorId: String(actor.id),
      assetId: ""
    })}">
      ${escapeHtml(actor.name)}
    </a>
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
