import { renderChampionCard } from "./champion-card-view.js";

export function renderDesktopChampionView(options) {
  if (!options?.skin) {
    return "";
  }

  return `
    <div class="elf-desktop-champion" data-skin-champion-view="desktop">
      ${renderChampionCard({ ...options, compact: true })}
    </div>
  `;
}
