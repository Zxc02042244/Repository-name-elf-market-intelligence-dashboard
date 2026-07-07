import { formatNumber } from "../core/utils/numbers.js";

export function renderCategoryFilterView(model, selectedCategory) {
  const assetClasses = getAssetClassOptions(model);
  const categories = getCategoryOptions(model);

  return `
    <section class="filter-panel" aria-label="Asset category filter">
      <div class="section-heading">
        <h2>Asset Coverage</h2>
        <span>${formatNumber(categories.length - 1)} categories</span>
      </div>
      <div class="asset-class-grid" aria-label="Top-level asset classes">
        ${assetClasses.map(renderAssetClassCard).join("")}
      </div>
      <div class="section-heading section-heading-compact">
        <h2>Category Filters</h2>
        <span>${formatNumber(model?.assetStats.length ?? 0)} assets</span>
      </div>
      <div class="category-tabs" role="tablist" aria-label="Asset categories">
        ${categories.map((category) => renderCategoryButton(category, selectedCategory)).join("")}
      </div>
    </section>
  `;
}

function getAssetClassOptions(model) {
  const counts = new Map();

  for (const stat of model?.assetStats ?? []) {
    const assetClass = stat.asset.assetClass ?? "Unclassified / Other";
    counts.set(assetClass, (counts.get(assetClass) ?? 0) + 1);
  }

  return [
    "Resources / Materials",
    "Blueprints / Progression",
    "Cosmetics / Collectibles",
    "Unclassified / Other"
  ].map((name) => ({ name, count: counts.get(name) ?? 0 }));
}

function getCategoryOptions(model) {
  const counts = new Map();

  for (const stat of model?.assetStats ?? []) {
    const category = stat.asset.category;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const options = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return [{ name: "All", count: model?.assetStats.length ?? 0 }, ...options];
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
  const value = category.name === "All" ? "all" : category.name;
  const isSelected = value === selectedCategory;

  return `
    <button
      class="category-tab ${isSelected ? "category-tab-active" : ""}"
      type="button"
      role="tab"
      aria-selected="${isSelected ? "true" : "false"}"
      data-category="${escapeHtml(value)}"
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
