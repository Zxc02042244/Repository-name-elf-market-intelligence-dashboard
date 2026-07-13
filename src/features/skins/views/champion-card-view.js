const unifiedChampionFrames = new Set([
  "elf-champion-frame-flame-runner",
  "elf-champion-frame-flame-brawler",
  "elf-champion-frame-alien-hunter",
  "elf-champion-frame-bio-warrior",
  "elf-champion-frame-frost-enchantress",
  "elf-champion-frame-bubble-beast",
  "elf-champion-frame-starborn-warrior",
  "elf-champion-frame-spinning-kicker",
  "elf-champion-frame-zombie-walker",
  "elf-champion-frame-cosmic-sovereign",
  "elf-champion-frame-toy-sheriff",
  "elf-champion-frame-arale",
  "elf-champion-frame-shark-hoodie",
  "elf-champion-frame-genesis-pioneer",
  "elf-champion-frame-trailblazer"
]);

const layeredChampionFrames = new Set(unifiedChampionFrames);

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
  const frameClass = getChampionFrameClass(skin);

  return `
    <article class="elf-champion-card ${compact ? "elf-champion-card-compact" : ""} elf-champion-${escapeHtml(kind)} ${getSkinClassNames(skin)} ${unifiedChampionFrames.has(frameClass) ? "elf-champion-has-custom-frame" : ""} ${layeredChampionFrames.has(frameClass) ? "elf-champion-layered-frame" : ""} ${frameClass}">
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

function getChampionFrameClass(skin) {
  const normalizedName = normalizeSkinName(skin?.name);
  const supportedFrames = new Set([
    "flame-runner",
    "flame-brawler",
    "alien-hunter",
    "bio-warrior",
    "frost-enchantress",
    "bubble-beast",
    "starborn-warrior",
    "spinning-kicker",
    "zombie-walker",
    "cosmic-sovereign",
    "toy-sheriff",
    "arale",
    "shark-hoodie",
    "genesis-pioneer",
    "trailblazer"
  ]);

  return supportedFrames.has(normalizedName)
    ? `elf-champion-frame-${normalizedName}`
    : "";
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
