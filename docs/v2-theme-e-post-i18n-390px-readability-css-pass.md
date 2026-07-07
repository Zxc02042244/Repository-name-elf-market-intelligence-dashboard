# V2-THEME-E Post-I18N 390px Readability CSS Pass

## Current Status

V2-I18N-H is complete and pushed at:

```txt
24aebf6c34ca0338aba7f735f27dc8d80df85006
```

V2-THEME-E applies a targeted CSS readability pass after the full visible UI i18n wiring and translation polish.

## Scope

This phase is CSS/readability polish only.

Reviewed locale-sensitive UI areas:

- locale switcher
- status messages
- coverage cards
- analytics cards
- Snapshot Explorer
- asset detail sections
- actor detail sections
- transactions list
- empty states

## Files Modified

- `src/styles.css`

## CSS Changes

Added targeted mobile/readability safeguards:

- global text wrapping for headings, labels, buttons, links, values, and timestamps
- horizontal overflow prevention on `body`
- safer `min-width: 0` behavior for grid/flex-heavy dashboard components
- full-width language select behavior on mobile
- normal wrapping for category tabs, utility links, detail links, and action buttons
- tighter 430px spacing and padding for dense cards and panels
- single-column category tabs at 430px
- single-column detail headings, compact card rows, and breakdown rows at 430px
- left-aligned compact metric values on narrow screens
- slightly smaller hero title and metric value sizing at 430px

## Browser / Mobile QA Result

Browser/mobile smoke remains unavailable in this environment.

Reason:

- Previous V2-I18N-H live GitHub Pages browser attempts timed out and reset the browser automation session.
- Local static server / `file://` browser checks were previously unavailable or blocked.

No workaround tooling was added.

## Fallback Checks

Completed:

- CSS diff review
- JavaScript syntax check for `src/i18n/translations.js`
- i18n helper/render smoke for:
  - `en`
  - `zh-Hant`
  - `ja`
  - `ko`
  - `vi`
- source data preservation check for:
  - asset names
  - actor names
  - currency codes
- security scan for token / secret / storage misuse

## What Remained Unchanged

No changes were made to:

- `src/core/`
- `src/sources/`
- `src/app/`
- `src/views/`
- `index.html`
- API/proxy behavior
- Supabase or database code
- workflow files
- MarketModel shape
- locale persistence behavior

## Security / Architecture Boundary

This phase did not add:

- API calls
- external translation API
- runtime translation service
- browser automation dependency
- npm package
- build system
- DB reads or writes
- Supabase integration
- tokens or secrets
- new localStorage keys

The only allowed localStorage key remains:

```txt
marketDashboard.locale
```

## Known Limitations

390px visual readability still requires a real browser/manual check on GitHub Pages or a local preview.

If manual QA finds a visible overflow or awkward wrapping issue, use a narrow follow-up phase with only dictionary wording or CSS readability changes.

## Recommended Follow-up

Recommended next phase:

```txt
V2-THEME-F Live Manual Mobile Readability QA
```

That phase should be performed by the user in a normal browser or phone browser against the live GitHub Pages URL.
