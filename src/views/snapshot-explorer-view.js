import { buildRouteHash } from "../app/router.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";

export function renderSnapshotExplorerView(model, route, explorer) {
  return `
    <section class="content-panel" aria-labelledby="snapshot-explorer-title">
      <div class="section-heading">
        <h2 id="snapshot-explorer-title">Snapshot Search</h2>
        <span>${formatNumber(model?.assetStats?.length ?? 0)} assets / ${formatNumber(model?.actorStats?.length ?? 0)} actors</span>
      </div>
      <p class="section-note">Search and detail views use the currently loaded MarketModel snapshot only. Not historical trend data.</p>
      ${renderExplorerControls(route, explorer)}
      ${renderExplorerResults(route, explorer)}
      ${renderSelectedDetails(explorer)}
    </section>
  `;
}

function renderExplorerControls(route, explorer) {
  const controls = explorer.controls;

  return `
    <form class="explorer-controls" data-explorer-search>
      <label class="search-field">
        <span>Search assets or actors</span>
        <input
          type="search"
          name="q"
          value="${escapeHtml(controls.search)}"
          placeholder="Name, category, or asset class"
        />
      </label>
      <label class="sort-field">
        <span>Sort</span>
        <select name="sort">
          ${renderSortOption("value", "Value", controls.sort)}
          ${renderSortOption("activity", "Activity", controls.sort)}
          ${renderSortOption("latest", "Latest", controls.sort)}
          ${renderSortOption("name", "Name", controls.sort)}
        </select>
      </label>
      <button class="refresh-button compact-action" type="submit">Search</button>
    </form>
    <div class="segmented-control" aria-label="Snapshot result type">
      ${renderModeLink("assets", "Assets", route, controls.mode)}
      ${renderModeLink("actors", "Actors", route, controls.mode)}
    </div>
  `;
}

function renderSortOption(value, label, currentSort) {
  return `<option value="${value}" ${value === currentSort ? "selected" : ""}>${label}</option>`;
}

function renderModeLink(mode, label, route, currentMode) {
  const hash = buildRouteHash(route, {
    mode,
    assetId: "",
    actorId: ""
  });

  return `
    <a class="segment-link ${mode === currentMode ? "segment-link-active" : ""}" href="${hash}">
      ${escapeHtml(label)}
    </a>
  `;
}

function renderExplorerResults(route, explorer) {
  if (explorer.controls.mode === "actors") {
    return renderActorResults(route, explorer.actorResults);
  }

  return renderAssetResults(route, explorer.assetResults);
}

function renderAssetResults(route, assetResults) {
  return `
    <div class="snapshot-result-grid" aria-label="Asset search results">
      ${assetResults.map((stat) => renderAssetResult(route, stat)).join("") || renderEmptyState("No matching assets.")}
    </div>
  `;
}

function renderAssetResult(route, stat) {
  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.asset.name)}</strong>
      <span>${escapeHtml(stat.asset.assetClass ?? "Unclassified / Other")}</span>
      <span>${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>Trades</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>Volume</dt><dd>${formatValue(stat.totalVolume, stat.currency)}</dd></div>
        <div><dt>Latest</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
      </dl>
      <a class="detail-link" href="${buildRouteHash(route, { mode: "assets", assetId: String(stat.asset.id), actorId: "" })}">View Asset Snapshot</a>
    </article>
  `;
}

function renderActorResults(route, actorResults) {
  return `
    <div class="snapshot-result-grid" aria-label="Actor search results">
      ${actorResults.map((stat) => renderActorResult(route, stat)).join("") || renderEmptyState("No matching actors.")}
    </div>
  `;
}

function renderActorResult(route, stat) {
  const totalValue = stat.totalSoldValue + stat.totalBoughtValue;

  return `
    <article class="compact-card">
      <strong>${escapeHtml(stat.actor.name)}</strong>
      <span>${escapeHtml(getAssetNames(stat.mainTradedAssets) || "No assets")}</span>
      <dl>
        <div><dt>Sold</dt><dd>${formatNumber(stat.soldCount)}</dd></div>
        <div><dt>Bought</dt><dd>${formatNumber(stat.boughtCount)}</dd></div>
        <div><dt>Total Value</dt><dd>${formatValue(totalValue, stat.currency)}</dd></div>
      </dl>
      <a class="detail-link" href="${buildRouteHash(route, { mode: "actors", actorId: String(stat.actor.id), assetId: "" })}">View Actor Snapshot</a>
    </article>
  `;
}

function renderSelectedDetails(explorer) {
  if (explorer.selectedAsset) {
    return renderAssetDetail(explorer.selectedAsset);
  }

  if (explorer.selectedActor) {
    return renderActorDetail(explorer.selectedActor);
  }

  return "";
}

function renderAssetDetail(detail) {
  const stat = detail.stat;

  return `
    <article class="snapshot-detail" aria-labelledby="asset-detail-title">
      <div class="section-heading">
        <h2 id="asset-detail-title">${escapeHtml(stat.asset.name)}</h2>
        <span>Asset snapshot</span>
      </div>
      <div class="snapshot-detail-grid">
        ${renderDetailMetric("Asset Class", stat.asset.assetClass ?? "Unclassified / Other")}
        ${renderDetailMetric("Category", stat.asset.category)}
        ${renderDetailMetric("Group", stat.asset.group)}
        ${renderDetailMetric("Trade Count", formatNumber(stat.tradeCount))}
        ${renderDetailMetric("Total Volume", formatValue(stat.totalVolume, stat.currency))}
        ${renderDetailMetric("Total Quantity", formatNumber(stat.totalQuantity))}
        ${renderDetailMetric("Avg Unit", formatValue(stat.averageUnitValue, stat.currency))}
        ${renderDetailMetric("Last Unit", formatValue(stat.lastUnitValue, stat.currency))}
        ${renderDetailMetric("Latest", formatTime(stat.latestTransactionTime))}
      </div>
      ${renderDetailTransactions("Recent Asset Transactions", detail.transactions)}
    </article>
  `;
}

function renderActorDetail(detail) {
  const stat = detail.stat;

  return `
    <article class="snapshot-detail" aria-labelledby="actor-detail-title">
      <div class="section-heading">
        <h2 id="actor-detail-title">${escapeHtml(stat.actor.name)}</h2>
        <span>Actor snapshot</span>
      </div>
      <div class="snapshot-detail-grid">
        ${renderDetailMetric("Sold Count", formatNumber(stat.soldCount))}
        ${renderDetailMetric("Bought Count", formatNumber(stat.boughtCount))}
        ${renderDetailMetric("Total Sold", formatValue(stat.totalSoldValue, stat.currency))}
        ${renderDetailMetric("Total Bought", formatValue(stat.totalBoughtValue, stat.currency))}
        ${renderDetailMetric("Main Assets", getAssetNames(stat.mainTradedAssets) || "No assets")}
        ${renderDetailMetric("Counterparties", formatNumber(stat.counterpartyCount))}
        ${renderDetailMetric("Last Seen", formatTime(stat.lastSeen))}
      </div>
      ${renderDetailTransactions("Recent Actor Transactions", detail.transactions)}
    </article>
  `;
}

function renderDetailMetric(label, value) {
  return `
    <div class="detail-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderDetailTransactions(title, transactions) {
  return `
    <div class="detail-transactions">
      <h3>${escapeHtml(title)}</h3>
      <div class="detail-transaction-list">
        ${transactions.map(renderDetailTransaction).join("") || renderEmptyState("No recent transactions.")}
      </div>
    </div>
  `;
}

function renderDetailTransaction(transaction) {
  return `
    <div class="detail-transaction-row">
      <strong>${escapeHtml(transaction.asset.name)}</strong>
      <span>${formatNumber(transaction.quantity)} units</span>
      <span>${formatValue(transaction.value.total, transaction.value.currency)}</span>
      <span>${escapeHtml(transaction.actors.seller.name)} -> ${escapeHtml(transaction.actors.buyer.name)}</span>
      <time datetime="${new Date(transaction.time).toISOString()}">${formatTime(transaction.time)}</time>
    </div>
  `;
}

function getAssetNames(assets) {
  return assets.map((asset) => asset.name).join(", ");
}

function renderEmptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
