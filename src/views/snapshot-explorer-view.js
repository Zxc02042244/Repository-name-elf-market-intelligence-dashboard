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
      ${renderExplorerScopeNote()}
      ${renderExplorerResults(model, route, explorer)}
      ${renderSelectedDetails(route, explorer)}
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
    ${renderExplorerActions(route, controls)}
    <div class="segmented-control" aria-label="Snapshot result type">
      ${renderModeLink("assets", "Assets", route, controls.mode)}
      ${renderModeLink("actors", "Actors", route, controls.mode)}
    </div>
  `;
}

function renderExplorerActions(route, controls) {
  const actions = [];

  if (controls.search) {
    actions.push(renderUtilityLink("Clear Search", buildRouteHash(route, {
      search: "",
      assetId: "",
      actorId: ""
    })));
  }

  if (route.assetId || route.actorId) {
    actions.push(renderUtilityLink("Clear Selection", buildRouteHash(route, {
      assetId: "",
      actorId: ""
    })));
  }

  if (actions.length === 0) {
    return "";
  }

  return `<div class="explorer-actions">${actions.join("")}</div>`;
}

function renderUtilityLink(label, href) {
  return `<a class="utility-link" href="${href}">${escapeHtml(label)}</a>`;
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

function renderExplorerScopeNote() {
  return `
    <p class="explorer-scope-note">
      Results reflect the current category filter and currently loaded snapshot.
    </p>
  `;
}

function renderExplorerResults(model, route, explorer) {
  if (explorer.controls.mode === "actors") {
    return renderActorResults(model, route, explorer);
  }

  return renderAssetResults(model, route, explorer);
}

function renderAssetResults(model, route, explorer) {
  const controls = explorer.controls;
  const assetResults = explorer.assetResults;
  const totalMatched = countMatchingAssets(model, controls.search);

  return `
    ${renderResultSummary("asset", assetResults.length, totalMatched)}
    <div class="snapshot-result-grid" aria-label="Asset search results">
      ${assetResults.map((stat) => renderAssetResult(route, stat)).join("") || renderSearchEmptyState("asset", controls.search)}
    </div>
  `;
}

function renderAssetResult(route, stat) {
  const isSelected = String(route.assetId) === String(stat.asset.id);

  return `
    <article class="compact-card snapshot-result-card ${isSelected ? "snapshot-result-card-selected" : ""}" ${isSelected ? 'aria-current="true"' : ""}>
      <strong>${escapeHtml(stat.asset.name)}</strong>
      ${isSelected ? '<span class="selected-marker">Selected</span>' : ""}
      <span>${escapeHtml(stat.asset.assetClass ?? "Unclassified / Other")}</span>
      <span>${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>Loaded Trades</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>Loaded Volume</dt><dd>${formatValue(stat.totalVolume, stat.currency)}</dd></div>
        <div><dt>Latest Loaded Trade</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
      </dl>
      <a class="detail-link" href="${buildRouteHash(route, { mode: "assets", assetId: String(stat.asset.id), actorId: "" })}">View Asset Snapshot</a>
    </article>
  `;
}

function renderActorResults(model, route, explorer) {
  const controls = explorer.controls;
  const actorResults = explorer.actorResults;
  const totalMatched = countMatchingActors(model, controls.search);

  return `
    ${renderResultSummary("actor", actorResults.length, totalMatched)}
    <div class="snapshot-result-grid" aria-label="Actor search results">
      ${actorResults.map((stat) => renderActorResult(route, stat)).join("") || renderSearchEmptyState("actor", controls.search)}
    </div>
  `;
}

function renderActorResult(route, stat) {
  const totalValue = stat.totalSoldValue + stat.totalBoughtValue;
  const isSelected = String(route.actorId) === String(stat.actor.id);

  return `
    <article class="compact-card snapshot-result-card ${isSelected ? "snapshot-result-card-selected" : ""}" ${isSelected ? 'aria-current="true"' : ""}>
      <strong>${escapeHtml(stat.actor.name)}</strong>
      ${isSelected ? '<span class="selected-marker">Selected</span>' : ""}
      <span>${escapeHtml(getAssetNames(stat.mainTradedAssets) || "No assets")}</span>
      <dl>
        <div><dt>Loaded Sold Count</dt><dd>${formatNumber(stat.soldCount)}</dd></div>
        <div><dt>Loaded Bought Count</dt><dd>${formatNumber(stat.boughtCount)}</dd></div>
        <div><dt>Loaded Participation Value</dt><dd>${formatValue(totalValue, stat.currency)}</dd></div>
      </dl>
      <a class="detail-link" href="${buildRouteHash(route, { mode: "actors", actorId: String(stat.actor.id), assetId: "" })}">View Actor Snapshot</a>
    </article>
  `;
}

function renderResultSummary(kind, shownCount, totalMatched) {
  const plural = totalMatched === 1 ? kind : `${kind}s`;
  const capNote = totalMatched > shownCount ? ` Result list is capped at ${formatNumber(shownCount)}.` : "";

  return `
    <p class="result-summary">
      Showing ${formatNumber(shownCount)} of ${formatNumber(totalMatched)} matching ${plural}.${capNote}
    </p>
  `;
}

function renderSearchEmptyState(kind, search) {
  const plural = kind === "asset" ? "assets" : "actors";
  const query = String(search ?? "").trim();

  if (query) {
    return renderEmptyState(`No ${plural} match "${query}" in the current loaded snapshot.`);
  }

  return renderEmptyState(`No matching ${plural} in the current loaded snapshot.`);
}

function renderSelectedDetails(route, explorer) {
  if (explorer.selectedAsset) {
    return renderAssetDetail(route, explorer.selectedAsset);
  }

  if (explorer.selectedActor) {
    return renderActorDetail(route, explorer.selectedActor);
  }

  if (route.assetId) {
    return renderUnavailableSelection("asset", route);
  }

  if (route.actorId) {
    return renderUnavailableSelection("actor", route);
  }

  return "";
}

function renderUnavailableSelection(kind, route) {
  return `
    <article class="snapshot-detail snapshot-detail-empty">
      <h3>Selected ${escapeHtml(kind)} is not available</h3>
      <p class="empty-state">
        The selected ${escapeHtml(kind)} is not available in the current category filter or loaded snapshot.
      </p>
      ${renderUtilityLink("Clear Selection", buildRouteHash(route, { assetId: "", actorId: "" }))}
    </article>
  `;
}

function renderAssetDetail(route, detail) {
  const stat = detail.stat;

  return `
    <article class="snapshot-detail" aria-labelledby="asset-detail-title">
      <div class="section-heading">
        <h2 id="asset-detail-title">${escapeHtml(stat.asset.name)}</h2>
        <span>Snapshot Asset Stats</span>
      </div>
      <div class="detail-action-row">
        ${renderUtilityLink("Clear Selection", buildRouteHash(route, { assetId: "", actorId: "" }))}
      </div>
      <div class="snapshot-detail-layout">
        <section class="snapshot-detail-section snapshot-identity-section" aria-label="Asset identity and taxonomy">
          <div class="detail-section-heading">
            <h3>Asset Identity / Taxonomy</h3>
          </div>
          <div class="snapshot-identity-grid">
            ${renderDetailMetric("Asset Class", stat.asset.assetClass ?? "Unclassified / Other")}
            ${renderDetailMetric("Category", stat.asset.category)}
            ${renderDetailMetric("Group", stat.asset.group)}
          </div>
          <p class="section-note snapshot-detail-note">
            This section uses the currently loaded marketplace data only. True 7D/30D history requires the paused historical database phase.
          </p>
        </section>
        <section class="snapshot-detail-section" aria-label="Snapshot asset statistics">
          <div class="detail-section-heading">
            <h3>Snapshot Asset Stats</h3>
          </div>
          <div class="snapshot-detail-grid">
            ${renderDetailMetric("Loaded Trades", formatNumber(stat.tradeCount))}
            ${renderDetailMetric("Loaded Volume", formatValue(stat.totalVolume, stat.currency))}
            ${renderDetailMetric("Loaded Quantity", formatNumber(stat.totalQuantity))}
            ${renderDetailMetric("Snapshot Avg Unit", formatValue(stat.averageUnitValue, stat.currency))}
            ${renderDetailMetric("Latest Loaded Unit", formatValue(stat.lastUnitValue, stat.currency))}
            ${renderDetailMetric("Latest Loaded Trade", formatTime(stat.latestTransactionTime))}
            ${renderDetailMetric("Loaded Sellers", formatNumber(stat.activeSellers))}
            ${renderDetailMetric("Loaded Buyers", formatNumber(stat.activeBuyers))}
          </div>
        </section>
      </div>
      ${renderDetailTransactions("Recent Loaded Transactions", detail.transactions)}
    </article>
  `;
}

function renderActorDetail(route, detail) {
  const stat = detail.stat;
  const totalValue = stat.totalSoldValue + stat.totalBoughtValue;

  return `
    <article class="snapshot-detail" aria-labelledby="actor-detail-title">
      <div class="section-heading">
        <h2 id="actor-detail-title">${escapeHtml(stat.actor.name)}</h2>
        <span>Snapshot Actor Stats</span>
      </div>
      <div class="detail-action-row">
        ${renderUtilityLink("Clear Selection", buildRouteHash(route, { assetId: "", actorId: "" }))}
      </div>
      <div class="snapshot-detail-layout">
        <section class="snapshot-detail-section snapshot-identity-section" aria-label="Actor identity">
          <div class="detail-section-heading">
            <h3>Actor Identity</h3>
          </div>
          <div class="snapshot-identity-grid">
            ${renderDetailMetric("Actor", stat.actor.name)}
            ${renderDetailMetric("Latest Loaded Activity", formatTime(stat.lastSeen))}
          </div>
          <p class="section-note snapshot-detail-note">
            This section uses the currently loaded marketplace data only. True 7D/30D actor history requires the paused historical database phase.
          </p>
        </section>
        <section class="snapshot-detail-section" aria-label="Loaded actor participation statistics">
          <div class="detail-section-heading">
            <h3>Loaded Participation Stats</h3>
          </div>
          <div class="snapshot-detail-grid">
            ${renderDetailMetric("Loaded Sold Count", formatNumber(stat.soldCount))}
            ${renderDetailMetric("Loaded Bought Count", formatNumber(stat.boughtCount))}
            ${renderDetailMetric("Loaded Sold Volume", formatValue(stat.totalSoldValue, stat.currency))}
            ${renderDetailMetric("Loaded Bought Volume", formatValue(stat.totalBoughtValue, stat.currency))}
            ${renderDetailMetric("Loaded Participation Value", formatValue(totalValue, stat.currency))}
            ${renderDetailMetric("Latest Loaded Activity", formatTime(stat.lastSeen))}
          </div>
        </section>
        <section class="snapshot-detail-section" aria-label="Loaded actor market relationships">
          <div class="detail-section-heading">
            <h3>Loaded Market Relationships</h3>
          </div>
          <div class="snapshot-detail-grid">
            ${renderDetailMetric("Loaded Main Assets", getAssetNames(stat.mainTradedAssets) || "No assets")}
            ${renderDetailMetric("Loaded Counterparties", formatNumber(stat.counterpartyCount))}
          </div>
        </section>
      </div>
      ${renderDetailTransactions("Recent Loaded Actor Transactions", detail.transactions)}
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

function countMatchingAssets(model, search) {
  const normalizedSearch = normalizeSearch(search);

  return (model?.assetStats ?? []).filter((stat) => matchesSearch(normalizedSearch, [
    stat.asset.name,
    stat.asset.category,
    stat.asset.assetClass,
    stat.asset.group
  ])).length;
}

function countMatchingActors(model, search) {
  const normalizedSearch = normalizeSearch(search);

  return (model?.actorStats ?? []).filter((stat) => matchesSearch(normalizedSearch, [
    stat.actor.name
  ])).length;
}

function matchesSearch(search, fields) {
  if (!search) {
    return true;
  }

  return fields.some((field) => String(field ?? "").toLowerCase().includes(search));
}

function normalizeSearch(value) {
  return String(value ?? "").trim().toLowerCase();
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
