import { defaultLocale, t } from "../i18n/i18n.js";

export function renderSignalsView(model, locale = defaultLocale) {
  const signalCount = model?.signals.length ?? 0;

  return `
    <section class="content-panel muted-panel" aria-labelledby="signals-title">
      <div class="section-heading">
        <h2 id="signals-title">${t("signals.marketSignals", locale)}</h2>
        <span>${signalCount} ${t("signals.enabled", locale)}</span>
      </div>
      <p class="muted-copy">
        ${t("empty.noMarketSignals", locale)}
      </p>
    </section>
  `;
}
