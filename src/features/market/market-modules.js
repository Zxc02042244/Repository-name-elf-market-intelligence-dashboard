export const MARKET_MODULES = Object.freeze([
  Object.freeze({
    id: "overview",
    labelKey: "dashboard.marketTotals",
    requiredCapabilities: ["transactions"],
    status: "building"
  }),
  Object.freeze({
    id: "assets",
    labelKey: "coverage.assetCoverage",
    requiredCapabilities: ["transactions"],
    status: "building"
  }),
  Object.freeze({
    id: "actors",
    labelKey: "analytics.marketActivitySummary",
    requiredCapabilities: ["transactions"],
    status: "building"
  }),
  Object.freeze({
    id: "indicators",
    labelKey: "dashboard.indicatorModule",
    requiredCapabilities: ["transactions"],
    status: "building"
  })
]);

export function getMarketModule(moduleId) {
  return MARKET_MODULES.find((moduleDefinition) => moduleDefinition.id === moduleId) ?? null;
}
