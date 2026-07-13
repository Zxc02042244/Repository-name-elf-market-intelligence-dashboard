import { formatNumber, formatValue } from "../../../../core/utils/numbers.js";
import { t } from "../../../../i18n/i18n.js";
import { buildMarketAssets } from "./assets-model.js";

export function renderMarketAssetsView(marketState, locale) {
  const assets = buildMarketAssets(marketState?.model, marketState?.dataSource);
  const isReady = assets.status === "ready";

  return `
    <section class="market-assets-module" data-market-active-module="assets" data-market-assets-status="${assets.status}" aria-labelledby="market-assets-title">
      <div class="market-assets-heading">
        <div>
          <p class="eyebrow">${t("dashboard.assetModule.eyebrow", locale)}</p>
          <h3 id="market-assets-title">${t("dashboard.assetModule.title", locale)}</h3>
        </div>
        <span class="market-module-status market-module-status-${assets.status}">
          ${t(`dashboard.assetModule.status.${assets.status}`, locale)}
        </span>
      </div>
      <p class="market-assets-summary">
        ${t(`dashboard.assetModule.detail.${assets.status}`, locale)}
      </p>
      ${isReady ? renderReadyAssets(assets, locale) : renderAssetScope(locale)}
    </section>
  `;
}

function renderReadyAssets(assets, locale) {
  return `
    <dl class="market-assets-metrics" aria-label="${t("dashboard.assetModule.metricsLabel", locale)}">
      ${renderMetric(t("dashboard.assetModule.assetCount", locale), formatNumber(assets.metrics.assetCount, { locale }))}
      ${renderMetric(t("dashboard.assetModule.categoryCount", locale), formatNumber(assets.metrics.categoryCount, { locale }))}
      ${renderMetric(t("dashboard.assetModule.leadingAsset", locale), assets.metrics.leadingAssetName ?? "—")}
      ${renderMetric(t("dashboard.assetModule.leadingShare", locale), formatPercent(assets.metrics.leadingVolumeShare, locale))}
    </dl>
    <div class="market-assets-list" aria-label="${t("dashboard.assetModule.leadingAssets", locale)}">
      ${assets.assets.map((asset) => renderAssetSummary(asset, locale)).join("")}
    </div>
  `;
}

function renderAssetScope(locale) {
  return `
    <div class="market-assets-empty" role="note">
      <strong>${t("dashboard.assetModule.scopeTitle", locale)}</strong>
      <ul>
        <li>${t("dashboard.assetModule.scopeCoverage", locale)}</li>
        <li>${t("dashboard.assetModule.scopeLeaders", locale)}</li>
        <li>${t("dashboard.assetModule.scopeQuality", locale)}</li>
      </ul>
    </div>
  `;
}

function renderMetric(label, value) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function renderAssetSummary(asset, locale) {
  return `
    <article class="market-asset-summary">
      <div>
        <strong>${escapeHtml(asset.name ?? t("dashboard.assetModule.unknownAsset", locale))}</strong>
        <span>${escapeHtml(asset.category ?? t("dashboard.assetModule.uncategorized", locale))}</span>
      </div>
      <dl>
        <div>
          <dt>${t("dashboard.transactions", locale)}</dt>
          <dd>${Number.isFinite(asset.tradeCount) ? formatNumber(asset.tradeCount, { locale }) : "—"}</dd>
        </div>
        <div>
          <dt>${t("dashboard.totalVolume", locale)}</dt>
          <dd>${Number.isFinite(asset.totalVolume) ? formatValue(asset.totalVolume, asset.currency ?? "", { locale }) : "—"}</dd>
        </div>
      </dl>
    </article>
  `;
}

function formatPercent(value, locale) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
