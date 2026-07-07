# V2-QA-C Manual Browser/Mobile Interactive Smoke Result Backfill

## Purpose

This backfill records an interactive browser/mobile smoke run for the current GitHub Pages dashboard after the recent i18n, theme, search wording, and generic CSS-only asset badge work.

This phase does not change runtime behavior. It only records the browser QA result.

## Baseline

- Starting HEAD: `6205fe941ca404f2f2bda038c4ee6041b9db3628`
- Live URL: `https://zxc02042244.github.io/Repository-name-elf-market-intelligence-dashboard/`
- Live API/proxy work remains paused.
- Historical DB write work remains paused.
- Current UI remains loaded MarketModel snapshot oriented.

## Browser Smoke Method

The in-app browser was used against the live GitHub Pages URL.

Checks included:

- page load
- console error/warning scan
- language switching
- mobile/narrow viewport readability
- horizontal overflow check
- search input interaction
- Clear Search interaction
- refresh failure-state behavior
- locale persistence after reload

No browser automation dependency, npm package, Playwright package install, Vite, React, or build system was added.

## Page Load Result

Result: pass

- Page title: `Market Intelligence Dashboard`
- Live URL loaded without GitHub Pages 404.
- No blank screen was observed.
- Console errors/warnings: `0`

## Mobile / Narrow Viewport Result

Result: pass

Requested viewport checks:

- `390px`
- `430px`

Observed browser client widths:

- requested `390px` produced `375px` document client width in the test browser
- requested `430px` produced `415px` document client width in the test browser

For all checked locales and both viewport sizes:

- no horizontal overflow was detected
- page scroll width stayed within document client width
- primary controls remained visible
- search input remained usable
- refresh button remained visible
- language selector remained visible

## Locales Checked

Result: pass

Locales checked:

- `en`
- `zh-Hant`
- `ja`
- `ko`
- `vi`

Observed behavior:

- language selector changed visible UI labels
- translated refresh labels rendered
- translated search placeholders rendered
- dashboard title rendered for each locale
- console errors/warnings remained `0`
- no horizontal overflow was detected at the checked narrow widths

Note: Some automated text-fragment checks were intentionally treated as non-blocking because the expected string fragments were stricter than the actual polished translations. The visible UI rendered translated labels and controls correctly.

## Locale Persistence Result

Result: pass

The locale was switched to `vi`, the page was reloaded, and the UI remained in Vietnamese after reload.

Observed after reload:

- selected locale: `vi`
- Vietnamese dashboard title rendered
- Vietnamese refresh label rendered
- Vietnamese search placeholder rendered
- console errors/warnings: `0`
- no horizontal overflow

This confirms the existing `marketDashboard.locale` persistence behavior remains functional.

## Search Interaction Result

Result: pass

Checked at a narrow viewport:

- search input accepted `carrot`
- Search action was available
- after Search action, `Clear Search` appeared as a utility link
- clicking `Clear Search` cleared the search input
- no horizontal overflow occurred

Implementation note:

- `Clear Search` is rendered as a link-style utility action, not a `<button>`.
- This is acceptable for the current UI; tests should target it as a link/action rather than a button.

## Refresh Failure-state Result

Result: pass

Because live API/proxy work is paused, refresh currently renders a safe failure state.

Observed after clicking refresh:

- visible status included `Token refresh failed`
- visible status included `Live data is unavailable`
- page did not go blank
- console errors/warnings remained `0`
- no token, secret, raw auth payload, or response body was observed in the UI checks
- no horizontal overflow occurred

## Asset / Actor Detail Result

Result: limited by current live data state

The live page was in a token refresh failed state with no loaded transactions. Because no asset or actor result cards were available, the following could not be fully exercised in this run:

- selected asset detail with live data
- selected actor detail with live data
- Clear Selection after selecting a populated asset or actor
- source-data preservation on live transaction rows

This is not considered a V2-QA-C failure because the live proxy/API failure state is already documented as paused and acceptable for UI smoke. These checks should be repeated when live data or a safe mock preview path is available.

## Source-data Preservation Result

Result: limited by current live data state

No live transaction rows were available during this smoke run, so source-data preservation could not be fully spot-checked against visible transaction data.

The rule remains unchanged:

- actor names should not be translated
- asset names should not be translated unless dictionary-backed later
- item IDs should not be translated
- transaction IDs should not be translated
- currency codes such as `SIGIL` should not be translated
- route keys, raw status kinds, source IDs, API strings, and env var names should not be translated

## Security and Architecture Boundary

Confirmed:

- no runtime files were changed in this phase
- no API, DB, Supabase, collector, or workflow changes were made
- no new dependencies were added
- no external translation API was added
- no external image API was added
- no token or secret was added
- no `REFRESH_TOKEN`, `accessToken`, Bearer token, Supabase key, Vercel env value, or raw auth payload was recorded
- no new `localStorage` key was introduced

## Remaining Follow-up

Recommended future checks:

1. Repeat asset and actor selection smoke when live data is available or when a safe local mock preview path is explicitly approved.
2. Repeat source-data preservation checks when transaction rows are visible.
3. Keep browser/mobile smoke as a recurring QA step after future CSS or i18n changes.

## Verdict

V2-QA-C browser/mobile interactive smoke is considered passed for:

- page load
- console cleanliness
- five-locale switching
- locale persistence
- 390px / 430px narrow viewport overflow checks
- search input
- Clear Search
- safe refresh failure-state behavior

The asset/actor detail selection and live transaction source-data checks remain limited by the current paused live proxy/API state.

