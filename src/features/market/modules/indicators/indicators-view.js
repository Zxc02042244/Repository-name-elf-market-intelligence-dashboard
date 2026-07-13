import { t } from "../../../../i18n/i18n.js";
import { buildMarketIndicatorsModule } from "./indicators-model.js";

export function renderMarketIndicatorsView(marketState, locale) {
  const indicatorModule = buildMarketIndicatorsModule(marketState?.model, marketState?.dataSource);

  return `
    <section class="market-indicators-module" data-market-active-module="indicators" data-market-indicators-status="${indicatorModule.status}" aria-labelledby="market-indicators-title">
      <div class="market-indicators-heading">
        <div>
          <p class="eyebrow">${t("dashboard.indicatorModuleDetail.eyebrow", locale)}</p>
          <h3 id="market-indicators-title">${t("dashboard.indicatorModule", locale)}</h3>
        </div>
        <span class="market-module-status market-module-status-${indicatorModule.status}">
          ${t(`dashboard.indicatorModuleDetail.status.${indicatorModule.status}`, locale)}
        </span>
      </div>
      <p class="market-indicators-summary">
        ${t(`dashboard.indicatorModuleDetail.detail.${indicatorModule.status}`, locale)}
      </p>
      <div class="market-indicator-catalog" aria-label="${t("dashboard.indicatorModuleDetail.catalogLabel", locale)}">
        ${indicatorModule.indicators.map((indicator) => renderIndicatorDefinition(indicator, locale)).join("")}
      </div>
      <p class="market-indicators-boundary" role="note">
        ${t("dashboard.indicatorModuleDetail.boundary", locale)}
      </p>
    </section>
  `;
}

function renderIndicatorDefinition(indicator, locale) {
  return `
    <article class="market-indicator-definition" data-market-indicator="${escapeHtml(indicator.id)}">
      <div>
        <strong>${t(indicator.nameKey, locale)}</strong>
        <span>${t("dashboard.indicatorModuleDetail.documented", locale)}</span>
      </div>
      <p>${t(indicator.detailKey, locale)}</p>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
