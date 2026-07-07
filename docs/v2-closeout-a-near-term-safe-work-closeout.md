# V2-CLOSEOUT-A Near-term Safe Work Closeout

## Current Baseline

Latest completed phase:

```txt
V2-ASSET-C Image Source Decision
```

Latest baseline commit:

```txt
112b6a3f27cc04d1c18fff0f51ca501fb7578ed3
```

This closeout summarizes the recent safe-work phases that stayed within documentation, i18n, theme, search wording, and asset image decision boundaries.

No runtime code is changed in this phase.

## Files Inspected

- `docs/v2-i18n-e-full-visible-ui-translation-wiring.md`
- `docs/v2-i18n-f-manual-translation-qa-checklist.md`
- `docs/v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md`
- `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`
- `docs/v2-search-a-search-scope-wording-audit.md`
- `docs/v2-asset-b-asset-image-source-follow-up-audit.md`
- `docs/v2-asset-c-image-source-decision.md`

Note: V2-I18N-G was completed as a targeted translation polish pass, but no standalone V2-I18N-G document is present in `docs/`. Its completion is reflected by V2-I18N-H and the project checkpoint.

## Completed Safe-work Phases

## V2-I18N-F Manual Translation QA Checklist

Status:

```txt
Complete.
```

Outcome:

- created a manual QA checklist for translation coverage
- defined locale checks for `en`, `zh-Hant`, `ja`, `ko`, and `vi`
- identified UI areas requiring manual verification
- documented terms that should remain untranslated
- documented mobile 390px checks
- documented acceptable live API failure state during UI/i18n QA

Remaining note:

- The checklist file contains some visibly corrupted non-English locale display names. This does not affect runtime UI, but a future docs cleanup pass can repair that checklist text if desired.

## V2-I18N-G Targeted Translation Polish

Status:

```txt
Complete.
```

Outcome:

- polished static dictionary wording
- kept work inside i18n/static dictionary scope
- preserved neutral market-structure language
- did not add external translation API or runtime translation service

Known documentation gap:

- no standalone V2-I18N-G document currently exists
- V2-I18N-H records that the phase was complete and pushed

## V2-I18N-H Manual Browser/Mobile Locale QA Closeout

Status:

```txt
Complete, with browser/mobile QA unavailable.
```

Outcome:

- confirmed static/render/helper checks passed for all supported locales
- confirmed source data remains intentionally untranslated
- confirmed no token/storage/API boundary change
- documented that browser/mobile QA was not available because the browser automation session timed out and reset

Still unverified:

- real browser locale switching
- real 390px mobile readability
- reload persistence behavior in a normal browser
- visual wrapping for long translated labels on device/browser

## V2-THEME-E Post-I18N 390px Readability CSS Pass

Status:

```txt
Complete.
```

Outcome:

- added targeted CSS readability safeguards after i18n work
- improved wrapping for headings, labels, buttons, links, values, and timestamps
- reduced horizontal overflow risk
- improved narrow viewport spacing and density
- kept CSS work in `src/styles.css`
- did not change data flow, views, API, DB, or i18n persistence behavior

Still unverified:

- real 390px browser/mobile visual QA
- long-label behavior in normal mobile browsers
- touch ergonomics on a phone

## V2-SEARCH-A Search Scope Wording Audit

Status:

```txt
Complete.
```

Outcome:

- confirmed current search is loaded snapshot search only
- confirmed asset search covers asset name, category, assetClass, and group
- confirmed actor search covers actor name
- confirmed transactions are not searched directly
- confirmed IDs and raw technical fields are not searched intentionally
- found no concrete overpromising label requiring a runtime wording change

Still unverified:

- whether normal users understand the distinction between loaded snapshot search and historical global search without manual QA

## V2-ASSET-B Asset Image Source Follow-up Audit

Status:

```txt
Complete.
```

Outcome:

- confirmed no current image metadata field exists
- confirmed no `<img>` rendering exists
- confirmed no local image files exist
- confirmed no CSS `url()` or `background-image` references exist
- confirmed no UI wording overpromises image coverage
- documented safe and unsafe future image source directions

Still unverified:

- approved image source/provenance path
- future visual need for thumbnails or badges

## V2-ASSET-C Image Source Decision

Status:

```txt
Complete.
```

Decision:

```txt
Keep text-only asset UI for now.
```

Outcome:

- decided not to add asset image rendering yet
- recommended generic CSS-only fallback badge as the first safe visual step if needed
- deferred item-specific image mapping until source/provenance approval
- confirmed future Elf-specific image mapping must stay in `src/sources/elf/`
- confirmed official or external artwork requires explicit future approval

## What Remains Unverified

The main unresolved area is real browser/mobile verification.

Still needs manual or reliable browser QA:

- live GitHub Pages loads after recent CSS/i18n changes
- language switch works visually in a normal browser
- locale persists through reload with `marketDashboard.locale`
- 390px mobile layout has no horizontal overflow
- long translated labels wrap acceptably
- Snapshot Explorer search, Clear Search, and Clear Selection remain usable
- asset and actor detail sections remain readable
- transaction rows wrap safely

Browser/mobile smoke remains recorded as unavailable in the current Codex environment, not passed.

## What Should Not Resume Yet

Do not resume:

- live API/proxy work
- historical DB write work
- Supabase service role integration
- scheduled collector work
- GitHub Actions collector workflow
- Vercel Cron
- official Elf/Cidi direct API work
- asset thumbnail implementation
- official artwork or external image URL usage
- DB-backed translation
- external translation API
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health implementation

These should wait for explicit approval and the relevant prerequisite decisions.

## Recommended Next Safe Options

## Option 1: V2-QA-A Live Manual Browser/Mobile Smoke Checklist

Recommended priority:

```txt
Highest.
```

Why:

- browser/mobile QA is the largest unresolved risk
- recent i18n and CSS changes need real visual confirmation
- no secrets, APIs, DB writes, or dependencies are required

Scope:

- documentation/checklist only, or user-performed manual QA
- verify live GitHub Pages in a normal browser
- check all supported locales
- check 390px mobile behavior

## Option 2: V2-DOCS-A Baseline Index / Phase Map

Recommended priority:

```txt
Medium.
```

Why:

- many phase documents now exist
- a short index would help future Codex tasks locate the right baseline quickly
- this does not require runtime changes

Scope:

- docs-only
- summarize current active/paused/completed phase documents
- point to current safe next steps

## Option 3: V2-COPY-A Product Wording Polish Audit

Recommended priority:

```txt
Medium.
```

Why:

- search and snapshot wording is now clear, but product copy could still be reviewed as a whole
- can stay neutral and snapshot-safe
- can identify wording cleanup without implementing new behavior

Scope:

- audit first
- only propose wording changes if concrete issues are found
- no feature work

## Recommended Immediate Next Step

Recommended next phase:

```txt
V2-QA-A Live Manual Browser/Mobile Smoke Checklist
```

Reason:

- The codebase has accumulated safe i18n/theme/search/asset-image decisions.
- Static and render checks have passed, but real browser/mobile verification remains unresolved.
- This is the highest-signal next step before adding more UI polish.

## Security and Architecture Boundary

This closeout does not modify:

- `src/`
- `index.html`
- `scripts/`
- `supabase/`
- `.github/workflows/`
- API/proxy behavior
- DB or Supabase code
- MarketModel shape
- source adapter behavior
- runtime UI behavior

No secrets, tokens, official endpoint values, raw auth payloads, service role keys, image assets, or external dependencies were added.

The only allowed localStorage key remains:

```txt
marketDashboard.locale
```

## Closeout Summary

Near-term safe work is in a stable documentation baseline:

- i18n checklist, polish, and closeout are complete
- post-i18n mobile CSS readability pass is complete
- search scope wording audit is complete
- asset image source audit and decision are complete

The next safest priority is not another implementation phase. It is real browser/mobile QA, preferably against the live GitHub Pages site, before expanding UI polish further.
