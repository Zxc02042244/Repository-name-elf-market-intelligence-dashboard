import { formatNumber } from "../core/utils/numbers.js";

export function renderCategoryFilterView(model, selectedCategory) {
  const categories = getCategoryOptions(model);

  return `
    <section class="filter-panel" aria-label="Asset category filter">
      <div class="section-heading">
        <h2>Asset Coverage</h2>
        <span>${formatNumber(categories.length - 1)} categories</span>
      </div>
      <div class="category-tabs" role="tablist" aria-label="Asset categories">
        ${categories.map((category) => renderCategoryButton(category, selectedCategory)).join("")}
      </div>
    </section>
  `;
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
