import { buildRouteHash } from "../app/router.js";
import { formatNumber, formatValue } from "../core/utils/numbers.js";
import { formatTime } from "../core/utils/time.js";
import { defaultLocale, normalizeLocale, t } from "../i18n/i18n.js";

let snapshotLocale = defaultLocale;

export function renderSnapshotExplorerView(model, route, explorer, locale = defaultLocale) {
  snapshotLocale = normalizeLocale(locale);

  return `
    <section class="content-panel" aria-labelledby="snapshot-explorer-title">
      <div class="section-heading">
        <h2 id="snapshot-explorer-title">${translate("snapshot.searchTitle")}</h2>
        <span>${formatNumber(model?.assetStats?.length ?? 0)} ${translate("coverage.assets")} / ${formatNumber(model?.actorStats?.length ?? 0)} ${translate("snapshot.actorsMode").toLowerCase()}</span>
      </div>
      <p class="section-note">${translate("snapshot.scopeNote")}</p>
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
        <span>${translate("search.currentLoadedSnapshot")}</span>
        <input
          type="search"
          name="q"
          value="${escapeHtml(controls.search)}"
          placeholder="${translate("search.assetsOrActorsInLoadedSnapshot")}"
        />
      </label>
      <label class="sort-field">
        <span>${translate("sort.label")}</span>
        <select name="sort">
          ${renderSortOption("value", translate("sort.value"), controls.sort)}
          ${renderSortOption("activity", translate("sort.activity"), controls.sort)}
          ${renderSortOption("latest", translate("sort.latest"), controls.sort)}
          ${renderSortOption("name", translate("sort.name"), controls.sort)}
        </select>
      </label>
      <button class="refresh-button compact-action" type="submit">${translate("action.search")}</button>
    </form>
    ${renderExplorerActions(route, controls)}
    <div class="segmented-control" aria-label="${translate("snapshot.resultType")}">
      ${renderModeLink("assets", translate("snapshot.assetsMode"), route, controls.mode)}
      ${renderModeLink("actors", translate("snapshot.actorsMode"), route, controls.mode)}
    </div>
  `;
}

function renderExplorerActions(route, controls) {
  const actions = [];

  if (controls.search) {
    actions.push(renderUtilityLink(translate("action.clearSearch"), buildRouteHash(route, {
      search: "",
      assetId: "",
      actorId: ""
    })));
  }

  if (route.assetId || route.actorId) {
    actions.push(renderUtilityLink(translate("action.clearSelection"), buildRouteHash(route, {
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
      ${translate("snapshot.resultScopeNote")}
      ${translate("snapshot.historicalGlobalRequiresDatabase")}
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
    <div class="snapshot-result-grid" aria-label="${translate("snapshot.assetSearchResults")}">
      ${assetResults.map((stat) => renderAssetResult(route, stat)).join("") || renderSearchEmptyState("asset", controls.search)}
    </div>
  `;
}

function renderAssetResult(route, stat) {
  const isSelected = String(route.assetId) === String(stat.asset.id);

  return `
    <article class="compact-card snapshot-result-card ${isSelected ? "snapshot-result-card-selected" : ""}" ${isSelected ? 'aria-current="true"' : ""}>
      <div class="asset-card-heading">
        ${renderAssetBadge(stat.asset)}
        <strong>${escapeHtml(stat.asset.name)}</strong>
      </div>
      ${isSelected ? `<span class="selected-marker">${translate("snapshot.selected")}</span>` : ""}
      <span>${escapeHtml(stat.asset.assetClass ?? translate("coverage.assetClass.unclassifiedOther"))}</span>
      <span>${escapeHtml(stat.asset.category)}</span>
      <dl>
        <div><dt>${translate("asset.loadedTrades")}</dt><dd>${formatNumber(stat.tradeCount)}</dd></div>
        <div><dt>${translate("asset.loadedVolume")}</dt><dd>${formatValue(stat.totalVolume, stat.currency)}</dd></div>
        <div><dt>${translate("asset.latestLoadedTrade")}</dt><dd>${formatTime(stat.latestTransactionTime)}</dd></div>
      </dl>
      <a class="detail-link" href="${buildRouteHash(route, { mode: "assets", assetId: String(stat.asset.id), actorId: "" })}">${translate("action.viewAssetSnapshot")}</a>
    </article>
  `;
}

function renderActorResults(model, route, explorer) {
  const controls = explorer.controls;
  const actorResults = explorer.actorResults;
  const totalMatched = countMatchingActors(model, controls.search);

  return `
    ${renderResultSummary("actor", actorResults.length, totalMatched)}
    <div class="snapshot-result-grid" aria-label="${translate("snapshot.actorSearchResults")}">
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
      ${isSelected ? `<span class="selected-marker">${translate("snapshot.selected")}</span>` : ""}
      <span>${escapeHtml(getAssetNames(stat.mainTradedAssets) || translate("empty.noAssets"))}</span>
      <dl>
        <div><dt>${translate("actor.loadedSoldCount")}</dt><dd>${formatNumber(stat.soldCount)}</dd></div>
        <div><dt>${translate("actor.loadedBoughtCount")}</dt><dd>${formatNumber(stat.boughtCount)}</dd></div>
        <div><dt>${translate("actor.loadedParticipationValue")}</dt><dd>${formatValue(totalValue, stat.currency)}</dd></div>
      </dl>
      <a class="detail-link" href="${buildRouteHash(route, { mode: "actors", actorId: String(stat.actor.id), assetId: "" })}">${translate("action.viewActorSnapshot")}</a>
    </article>
  `;
}

function renderResultSummary(kind, shownCount, totalMatched) {
  const plural = getResultKindLabel(kind, totalMatched);
  const capNote = totalMatched > shownCount ? ` ${translate("snapshot.resultsCapped", {
    count: formatNumber(shownCount)
  })}` : "";

  return `
    <p class="result-summary">
      ${translate("snapshot.showingResults", {
        shown: formatNumber(shownCount),
        total: formatNumber(totalMatched),
        kind: plural
      })}${capNote}
    </p>
  `;
}

function renderSearchEmptyState(kind, search) {
  const plural = getResultKindLabel(kind, 2);
  const query = String(search ?? "").trim();

  if (query) {
    return renderEmptyState(translate("empty.noQuerySnapshotResults", {
      plural,
      query
    }));
  }

  return renderEmptyState(translate("empty.noMatchingSnapshotResults", { plural }));
}

function getResultKindLabel(kind, count) {
  if (kind === "asset") {
    return count === 1 ? "asset" : translate("snapshot.assetsMode").toLowerCase();
  }

  return count === 1 ? "actor" : translate("snapshot.actorsMode").toLowerCase();
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
      <h3>${translate("snapshot.selectedUnavailableTitle", { kind })}</h3>
      <p class="empty-state">
        ${translate("snapshot.selectedUnavailableBody", { kind })}
      </p>
      ${renderUtilityLink(translate("action.clearSelection"), buildRouteHash(route, { assetId: "", actorId: "" }))}
    </article>
  `;
}

function renderAssetDetail(route, detail) {
  const stat = detail.stat;

  return `
    <article class="snapshot-detail" aria-labelledby="asset-detail-title">
      <div class="section-heading">
        <div class="asset-detail-title">
          ${renderAssetBadge(stat.asset, "asset-badge-large")}
          <h2 id="asset-detail-title">${escapeHtml(stat.asset.name)}</h2>
        </div>
        <span>${translate("asset.snapshotStats")}</span>
      </div>
      <div class="detail-action-row">
        ${renderUtilityLink(translate("action.clearSelection"), buildRouteHash(route, { assetId: "", actorId: "" }))}
      </div>
      <div class="snapshot-detail-layout">
        <section class="snapshot-detail-section snapshot-identity-section" aria-label="${translate("asset.identityAndTaxonomy")}">
          <div class="detail-section-heading">
            <h3>${translate("asset.identityTaxonomy")}</h3>
          </div>
          <div class="snapshot-identity-grid">
            ${renderDetailMetric(translate("asset.assetClass"), stat.asset.assetClass ?? translate("coverage.assetClass.unclassifiedOther"))}
            ${renderDetailMetric(translate("asset.category"), stat.asset.category)}
            ${renderDetailMetric(translate("asset.group"), stat.asset.group)}
          </div>
          <p class="section-note snapshot-detail-note">
            ${translate("asset.snapshotNote")}
          </p>
        </section>
        <section class="snapshot-detail-section" aria-label="${translate("asset.snapshotStats")}">
          <div class="detail-section-heading">
            <h3>${translate("asset.snapshotStats")}</h3>
          </div>
          <div class="snapshot-detail-grid">
            ${renderDetailMetric(translate("asset.loadedTrades"), formatNumber(stat.tradeCount))}
            ${renderDetailMetric(translate("asset.loadedVolume"), formatValue(stat.totalVolume, stat.currency))}
            ${renderDetailMetric(translate("asset.loadedQuantity"), formatNumber(stat.totalQuantity))}
            ${renderDetailMetric(translate("asset.snapshotAvgUnit"), formatValue(stat.averageUnitValue, stat.currency))}
            ${renderDetailMetric(translate("asset.latestLoadedUnit"), formatValue(stat.lastUnitValue, stat.currency))}
            ${renderDetailMetric(translate("asset.latestLoadedTrade"), formatTime(stat.latestTransactionTime))}
            ${renderDetailMetric(translate("asset.loadedSellers"), formatNumber(stat.activeSellers))}
            ${renderDetailMetric(translate("asset.loadedBuyers"), formatNumber(stat.activeBuyers))}
          </div>
        </section>
      </div>
      ${renderDetailTransactions(translate("asset.recentLoadedTransactions"), detail.transactions)}
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
        <span>${translate("actor.snapshotStats")}</span>
      </div>
      <div class="detail-action-row">
        ${renderUtilityLink(translate("action.clearSelection"), buildRouteHash(route, { assetId: "", actorId: "" }))}
      </div>
      <div class="snapshot-detail-layout">
        <section class="snapshot-detail-section snapshot-identity-section" aria-label="${translate("actor.identity")}">
          <div class="detail-section-heading">
            <h3>${translate("actor.identity")}</h3>
          </div>
          <div class="snapshot-identity-grid actor-identity-grid">
            ${renderDetailMetric(translate("actor.actor"), stat.actor.name)}
            ${renderDetailMetric(translate("actor.latestLoadedActivity"), formatTime(stat.lastSeen))}
          </div>
          <p class="section-note snapshot-detail-note">
            ${translate("actor.snapshotNote")}
          </p>
        </section>
        <section class="snapshot-detail-section" aria-label="${translate("actor.participationStats")}">
          <div class="detail-section-heading">
            <h3>${translate("actor.snapshotStats")}</h3>
          </div>
          <div class="snapshot-detail-grid actor-stat-grid">
            ${renderDetailMetric(translate("actor.loadedSoldCount"), formatNumber(stat.soldCount))}
            ${renderDetailMetric(translate("actor.loadedBoughtCount"), formatNumber(stat.boughtCount))}
            ${renderDetailMetric(translate("actor.loadedSoldVolume"), formatValue(stat.totalSoldValue, stat.currency))}
            ${renderDetailMetric(translate("actor.loadedBoughtVolume"), formatValue(stat.totalBoughtValue, stat.currency))}
            ${renderDetailMetric(translate("actor.loadedParticipationValue"), formatValue(totalValue, stat.currency))}
            ${renderDetailMetric(translate("actor.latestLoadedActivity"), formatTime(stat.lastSeen))}
          </div>
        </section>
        <div class="actor-relationship-grid">
          <section class="snapshot-detail-section" aria-label="${translate("actor.loadedMainAssets")}">
            <div class="detail-section-heading">
              <h3>${translate("actor.loadedMainAssets")}</h3>
            </div>
            <div class="snapshot-detail-grid actor-single-metric-grid">
              ${renderDetailMetric(translate("actor.loadedMainAssets"), getAssetNames(stat.mainTradedAssets) || translate("empty.noAssets"))}
            </div>
          </section>
          <section class="snapshot-detail-section" aria-label="${translate("actor.loadedCounterparties")}">
            <div class="detail-section-heading">
              <h3>${translate("actor.loadedCounterparties")}</h3>
            </div>
            <div class="snapshot-detail-grid actor-single-metric-grid">
              ${renderDetailMetric(translate("actor.loadedCounterparties"), formatNumber(stat.counterpartyCount))}
            </div>
          </section>
        </div>
      </div>
      ${renderDetailTransactions(translate("actor.recentLoadedActorTransactions"), detail.transactions)}
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

function renderAssetBadge(asset, className = "") {
  const label = String(asset?.name ?? "?").trim();
  const initial = label ? Array.from(label)[0].toUpperCase() : "?";
  const title = [asset?.assetClass, asset?.category].filter(Boolean).join(" / ");

  return `
    <span class="asset-badge ${className}" title="${escapeHtml(title || label)}" aria-hidden="true">
      ${escapeHtml(initial)}
    </span>
  `;
}

function renderDetailTransactions(title, transactions) {
  return `
    <div class="detail-transactions">
      <h3>${escapeHtml(title)}</h3>
      <div class="detail-transaction-list">
        ${transactions.map(renderDetailTransaction).join("") || renderEmptyState(translate("empty.noRecentTransactions"))}
      </div>
    </div>
  `;
}

function renderDetailTransaction(transaction) {
  return `
    <div class="detail-transaction-row">
      <strong>${escapeHtml(transaction.asset.name)}</strong>
      <span>${formatNumber(transaction.quantity)} ${translate("transactions.units")}</span>
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

function translate(key, params) {
  return t(key, snapshotLocale, params);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
