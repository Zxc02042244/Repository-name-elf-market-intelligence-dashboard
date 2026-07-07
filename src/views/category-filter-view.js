import { defaultLocale, t } from "../i18n/i18n.js";
import { formatNumber } from "../core/utils/numbers.js";

export function renderCategoryFilterView(model, selectedCategory, locale = defaultLocale) {
  const assetClasses = getAssetClassOptions(model, locale);
  const categories = getCategoryOptions(model, locale);

  return `
    <section class="filter-panel" aria-label="${t("coverage.assetCategoryFilter", locale)}">
      <div class="section-heading">
        <h2>${t("coverage.assetCoverage", locale)}</h2>
        <span>${formatNumber(categories.length - 1)} ${t("coverage.categories", locale)}</span>
      </div>
      <div class="asset-class-grid" aria-label="${t("coverage.topLevelAssetClasses", locale)}">
        ${assetClasses.map(renderAssetClassCard).join("")}
      </div>
      <div class="section-heading section-heading-compact">
        <h2>${t("coverage.categoryFilters", locale)}</h2>
        <span>${formatNumber(model?.assetStats.length ?? 0)} ${t("coverage.assets", locale)}</span>
      </div>
      <div class="category-tabs" role="tablist" aria-label="${t("coverage.assetCategories", locale)}">
        ${categories.map((category) => renderCategoryButton(category, selectedCategory)).join("")}
      </div>
    </section>
  `;
}

function getAssetClassOptions(model, locale) {
  const counts = new Map();

  for (const stat of model?.assetStats ?? []) {
    const assetClass = stat.asset.assetClass ?? "Unclassified / Other";
    counts.set(assetClass, (counts.get(assetClass) ?? 0) + 1);
  }

  return [
    ["Resources / Materials", t("coverage.assetClass.resourcesMaterials", locale)],
    ["Blueprints / Progression", t("coverage.assetClass.blueprintsProgression", locale)],
    ["Cosmetics / Collectibles", t("coverage.assetClass.cosmeticsCollectibles", locale)],
    ["Unclassified / Other", t("coverage.assetClass.unclassifiedOther", locale)]
  ].map(([sourceName, displayName]) => ({
    name: displayName,
    count: counts.get(sourceName) ?? 0
  }));
}

function getCategoryOptions(model, locale) {
  const counts = new Map();

  for (const stat of model?.assetStats ?? []) {
    const category = stat.asset.category;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const options = [...counts.entries()]
    .map(([name, count]) => ({ name, value: name, count }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return [{ name: t("coverage.all", locale), value: "all", count: model?.assetStats.length ?? 0 }, ...options];
}

function renderAssetClassCard(assetClass) {
  return `
    <article class="asset-class-card">
      <span>${escapeHtml(assetClass.name)}</span>
      <strong>${formatNumber(assetClass.count)}</strong>
    </article>
  `;
}

function renderCategoryButton(category, selectedCategory) {
  const isSelected = category.value === selectedCategory;

  return `
    <button
      class="category-tab ${isSelected ? "category-tab-active" : ""}"
      type="button"
      role="tab"
      aria-selected="${isSelected ? "true" : "false"}"
      data-category="${escapeHtml(category.value)}"
    >
      <span>${escapeHtml(category.name)}</span>
      <strong>${formatNumber(category.count)}</strong>
    </button>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
