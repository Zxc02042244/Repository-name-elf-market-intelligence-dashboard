import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderTransactionsView(model) {
  const transactions = model?.transactions ?? [];

  return `
    <section class="table-panel" aria-labelledby="recent-transactions-title">
      <div class="section-heading">
        <h2 id="recent-transactions-title">Recent Transactions</h2>
        <span>${formatNumber(transactions.length)} records</span>
      </div>
      <div class="transaction-list">
        ${transactions.length > 0 ? transactions.map(renderTransaction).join("") : renderEmptyState()}
      </div>
    </section>
  `;
}

function renderTransaction(transaction) {
  return `
    <article class="transaction-row">
      <div>
        <strong>${escapeHtml(transaction.asset.name)}</strong>
        <span>${escapeHtml(transaction.asset.group)} / ${escapeHtml(transaction.asset.category)}</span>
      </div>
      <div>
        <span>Quantity</span>
        <strong>${formatNumber(transaction.quantity)}</strong>
      </div>
      <div>
        <span>Total</span>
        <strong>${formatValue(transaction.value.total, transaction.value.currency)}</strong>
      </div>
      <div>
        <span>Unit</span>
        <strong>${formatValue(transaction.value.unit, transaction.value.currency)}</strong>
      </div>
      <div>
        <span>Seller</span>
        <strong>${escapeHtml(transaction.actors.seller.name)}</strong>
      </div>
      <div>
        <span>Buyer</span>
        <strong>${escapeHtml(transaction.actors.buyer.name)}</strong>
      </div>
      <time datetime="${new Date(transaction.time).toISOString()}">${formatTime(transaction.time)}</time>
    </article>
  `;
}

function renderEmptyState() {
  return `<p class="empty-state">No transactions returned.</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
