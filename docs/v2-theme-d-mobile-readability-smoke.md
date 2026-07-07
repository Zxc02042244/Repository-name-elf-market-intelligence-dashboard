# V2-THEME-D Mobile Readability Smoke

## Summary

V2-THEME-D verifies the themed Snapshot Explorer after the Elf-inspired theme token work and language switch work.

This phase is smoke/audit only. No runtime code, layout structure, data flow, API behavior, Supabase integration, image asset, official artwork, or workflow behavior was changed.

## What Was Checked

Inspected files:

- `src/themes/elf-theme.css`
- `src/styles.css`
- `src/views/snapshot-explorer-view.js`
- `src/app/main.js`
- `docs/v2-theme-c-snapshot-explorer-theme-pass.md`
- `docs/v2-i18n-d-language-switch-persistence.md`

Checked areas:

- Snapshot Explorer search area
- language select visibility and sizing rules
- search input readability
- result card styling
- active selected card styling
- asset detail stat card styling
- actor detail stat card styling
- helper note styling
- empty state styling
- recent loaded transaction row styling
- mobile breakpoint rules
- horizontal overflow risk
- token/secret/API boundary

## Smoke Method

Browser viewport smoke was attempted but could not be completed in this environment:

- `file://` navigation was blocked by the browser URL policy.
- A temporary localhost server was reachable from PowerShell once, but the in-app browser reported connection failure.
- No browser screenshot or visual viewport assertion was completed.

Fallback checks performed:

- CSS/static mobile review for 390px and 430px risks.
- JavaScript syntax checks for `src/app/main.js` and `src/views/snapshot-explorer-view.js`.
- Snapshot Explorer render smoke with a selected asset/detail fixture.
- Snapshot Explorer render smoke for all supported locales:
  - `en`
  - `zh-Hant`
  - `ja`
  - `ko`
  - `vi`
- Source scan for token/API/Supabase boundary.

## Viewports Checked

Browser visual viewport checks:

- 390px: attempted, unavailable due browser/localhost limitation.
- 430px: attempted, unavailable due browser/localhost limitation.
- Desktop: attempted, unavailable due browser/localhost limitation.

Static responsive review:

- 390px covered by existing `@media (max-width: 620px)` rules.
- 430px covered by existing `@media (max-width: 620px)` rules.
- Desktop covered by default layout and `@media (max-width: 920px)` transition rules.

## Locales Checked

Render smoke completed for:

- `en`
- `zh-Hant`
- `ja`
- `ko`
- `vi`

The render smoke confirms the mounted Snapshot Explorer can render for each locale without a JavaScript syntax or ReferenceError failure.

## Readability Findings

Positive findings:

- Snapshot Explorer controls collapse to one column under 920px.
- Primary dashboard grids, result grids, detail grids, and transaction rows collapse to one column under 620px.
- The language switch clears its minimum width under 620px.
- Refresh button and utility links become full width on mobile.
- Detail metric values use `overflow-wrap: anywhere`.
- Detail transaction text uses `overflow-wrap: anywhere`.
- Theme pass keeps values on dark warm surfaces with strong parchment text.
- Helper notes use a low-opacity warm background and remain visually separated.
- Empty states use dashed muted borders and low-opacity background without adding layout width.

Risk notes:

- Non-English dictionary strings are draft quality and may need a translation quality audit before full UI rollout.
- Long translated labels should be visually checked in a real browser once browser smoke is available.
- The current theme is CSS-only and has not been screenshot-verified in this phase.

## Overflow Findings

Static review found no new fixed-width desktop-only layout added by V2-THEME-B or V2-THEME-C.

Existing mobile safeguards remain:

- `body` minimum width is `320px`.
- `.app-shell` uses `width: min(100% - 20px, 1180px)` under 620px.
- Snapshot result grid collapses to `1fr` under 620px.
- Snapshot identity/detail grids collapse to `1fr` under 620px.
- Transaction rows collapse to `1fr` under 620px.
- Language switch `min-width` becomes `0` under 620px.

No tiny CSS fix was required based on static review.

## Fixes Made

No CSS or runtime fixes were made in this phase.

## Security And Architecture Boundary

No changes were made to:

- `src/core/`
- `src/sources/`
- `src/app/main.js`
- `src/views/`
- `scripts/`
- `supabase/`
- `index.html`
- `.github/workflows/`

No `REFRESH_TOKEN`, hardcoded `accessToken`, `Bearer` token, service role key, raw auth payload, Vercel secret, API call, Supabase read/write, image asset, official artwork, external font, or generated image was added.

## Remaining Limitations

- Browser visual smoke could not be completed in this environment.
- 390px and 430px mobile conclusions are based on CSS/static review and render smoke, not screenshots.
- Active selected card behavior was covered by render smoke and CSS review, not by browser interaction.
- Refresh safe-failure behavior was not re-tested visually because browser smoke could not load the page.

## Recommended Next Phase

Recommended next phase:

`V2-I18N-E Translation Quality Audit`

This should review and clean up non-English dictionary values before more UI surfaces are wired to i18n.
