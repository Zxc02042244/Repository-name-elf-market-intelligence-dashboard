export function renderSignalsView(model) {
  const signalCount = model?.signals.length ?? 0;

  return `
    <section class="content-panel muted-panel" aria-labelledby="signals-title">
      <div class="section-heading">
        <h2 id="signals-title">Market Signals</h2>
        <span>${signalCount} enabled</span>
      </div>
      <p class="muted-copy">
        No market signal modules are enabled in this phase.
      </p>
    </section>
  `;
}
