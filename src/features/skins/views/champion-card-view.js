export function renderChampionCard({
  skin,
  title,
  eyebrow,
  meta,
  statLabel,
  statValue,
  statDetail = "",
  rankLabel,
  kind,
  eager = false,
  action = "",
  compact = false
}) {
  return `
    <article class="elf-champion-card elf-champion-unified-frame ${compact ? "elf-champion-card-compact" : ""} elf-champion-${escapeHtml(kind)} ${getSkinClassNames(skin)}">
      <div class="elf-champion-heading">
        <div>
          <p class="eyebrow">${eyebrow}</p>
          <h2>${title}</h2>
        </div>
        <span class="elf-champion-rank">${escapeHtml(rankLabel)}</span>
      </div>
      <div class="elf-champion-art" aria-hidden="true">
        <img
          src="${escapeHtml(skin.image)}"
          alt=""
          width="240"
          height="240"
          loading="${eager ? "eager" : "lazy"}"
          decoding="async"
        >
      </div>
      <div class="elf-champion-body">
        <span>${meta}</span>
        <strong>${escapeHtml(skin.name)}</strong>
        <div class="elf-champion-stat">
          <span>${statLabel}${statDetail ? `<small>${statDetail}</small>` : ""}</span>
          ${action === "cancel" ? `
            <button class="elf-rank-cancel" type="button" data-wishlist-toggle="${escapeHtml(skin.id)}">
              ${statValue}
            </button>
          ` : `<strong>${statValue}</strong>`}
        </div>
      </div>
    </article>
  `;
}

export function getSkinClassNames(skin) {
  const normalizedName = normalizeSkinName(skin?.name);

  return [
    `elf-skin-card-${escapeHtml(skin.tone)}`,
    `elf-skin-id-${escapeHtml(skin.id)}`,
    normalizedName ? `elf-skin-name-${escapeHtml(normalizedName)}` : ""
  ].filter(Boolean).join(" ");
}

function normalizeSkinName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
