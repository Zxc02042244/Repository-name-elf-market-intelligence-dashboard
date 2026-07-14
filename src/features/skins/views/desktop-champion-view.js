import { renderChampionCard } from "./champion-card-view.js?v=20260713-galactic-cadet-1";

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
