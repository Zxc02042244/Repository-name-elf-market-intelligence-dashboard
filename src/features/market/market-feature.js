import { t } from "../../i18n/i18n.js";
import { createReservedMarketDataSource } from "./data/market-data-source.js";
import { renderActiveMarketModules } from "./market-module-runtime.js";
import { MARKET_MODULES } from "./market-modules.js";

export function createMarketFeatureState() {
  return {
    dataSource: createReservedMarketDataSource(),
    model: null,
    status: "planned"
  };
}

export function renderMarketFeatureView(marketState, locale) {
  const dataSource = marketState?.dataSource ?? createReservedMarketDataSource();

  return `
    <section class="content-panel unavailable-workspace market-planned-workspace" aria-labelledby="market-planned-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("dashboard.workspaceEyebrow", locale)}</p>
          <h2 id="market-planned-title">${t("dashboard.workspacePlannedTitle", locale)}</h2>
        </div>
        <span>${t("dashboard.apiSlotReserved", locale)}</span>
      </div>
      <div class="unavailable-workspace-body">
        <p class="empty-state unavailable-primary">
          ${t("dashboard.workspacePlannedDetail", locale)}
        </p>
        ${renderActiveMarketModules(marketState, locale)}
        <div class="unavailable-checklist" aria-label="${t("dashboard.plannedModules", locale)}">
          ${MARKET_MODULES.map((moduleDefinition) => renderPlannedModule(
            t(moduleDefinition.labelKey, locale),
            t(moduleDefinition.status === "building"
              ? "dashboard.moduleBuilding"
              : "dashboard.modulePlanned", locale),
            moduleDefinition.id
          )).join("")}
        </div>
        <p class="market-source-reservation" data-market-source-kind="${dataSource.kind}">
          ${t("dashboard.apiSlotReservedDetail", locale)}
        </p>
      </div>
    </section>
  `;
}

function renderPlannedModule(label, statusLabel, moduleId) {
  return [
    '<div class="unavailable-check" data-market-module="', moduleId, '">',
    "<span>", label, "</span>",
    "<strong>", statusLabel, "</strong>",
    "</div>"
  ].join("");
}
