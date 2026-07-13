import { renderChampionCard } from "./champion-card-view.js?v=20260713-pumpkin-whisper-1";

export function renderMobileChampionView(slides) {
  if (slides.length === 0) {
    return "";
  }

  return `
    <div class="elf-mobile-carousel-shell" data-skin-champion-view="mobile">
      <wa-carousel
        class="elf-mobile-champion-carousel"
        pagination
        mouse-dragging
        slides-per-page="1"
        slides-per-move="1"
        aria-label="Top ranked ELF skins"
      >
        ${slides.map((options, index) => `
          <wa-carousel-item aria-label="${escapeHtml(`${options.rankLabel}, ${options.skin.name}`)}" data-rank="${index + 1}">
            ${renderChampionCard({ ...options, compact: true })}
          </wa-carousel-item>
        `).join("")}
      </wa-carousel>
      <p class="elf-mobile-carousel-progress" aria-live="polite">
        <span data-carousel-current>1</span>
        <span aria-hidden="true">/</span>
        <span>${slides.length}</span>
      </p>
    </div>
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
