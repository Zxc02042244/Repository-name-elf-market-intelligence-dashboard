import { renderMarketAssetsView } from "./modules/assets/assets-view.js";
import { renderMarketActorsView } from "./modules/actors/actors-view.js";
import { renderMarketIndicatorsView } from "./modules/indicators/indicators-view.js";
import { renderMarketOverviewView } from "./modules/overview/overview-view.js";
import { MARKET_MODULES } from "./market-modules.js";

const MARKET_MODULE_RENDERERS = Object.freeze({
  overview: renderMarketOverviewView,
  assets: renderMarketAssetsView,
  actors: renderMarketActorsView,
  indicators: renderMarketIndicatorsView
});

export function getActiveMarketModules() {
  return MARKET_MODULES.filter((moduleDefinition) => (
    typeof MARKET_MODULE_RENDERERS[moduleDefinition.id] === "function"
  ));
}

export function renderActiveMarketModules(marketState, locale) {
  return getActiveMarketModules().map((moduleDefinition) => {
    const renderModule = MARKET_MODULE_RENDERERS[moduleDefinition.id];

    return renderModule(marketState, locale);
  }).join("");
}
