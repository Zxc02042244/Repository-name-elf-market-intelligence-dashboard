# V2-DOCS-C Targeted Documentation Cleanup

## Purpose

Apply the targeted documentation cleanup recommended by V2-DOCS-B without changing runtime code.

## Files Checked or Updated

Updated:

- `README.md`
- `docs/index.md`

Verified without runtime change:

- `docs/v2-i18n-f-manual-translation-qa-checklist.md`

## Cleanup Applied

- Added a concise current-status section to `README.md`.
- Pointed `README.md` readers to `docs/index.md` for the current phase map.
- Updated `docs/index.md` to reflect the V2-QA-C browser/mobile interactive smoke backfill.
- Updated `docs/index.md` to mention generic CSS-only asset badges as currently implemented.
- Verified `docs/v2-i18n-f-manual-translation-qa-checklist.md` locale display names as valid UTF-8.
- Clarified in `docs/index.md` that earlier corrupted locale output was a terminal display issue.

## What Remained Historical

Older phase documents were not rewritten in bulk. They remain historical records of what was true at the time each phase completed.

Examples:

- earlier browser/mobile unavailable notes remain valid historical records
- V2-I18N-H still records that browser inspection was unavailable during that phase
- V2-QA-C now records the later browser/mobile interactive smoke result

## Security and Architecture Boundary

No changes were made to:

- `src/`
- `index.html`
- `scripts/`
- `supabase/`
- `.github/workflows/`
- API/proxy behavior
- MarketModel shape
- source adapter behavior
- runtime UI behavior

No secrets, tokens, Vercel env values, Supabase keys, raw auth payloads, external dependencies, or build steps were added.

## Result

The repository now has a clearer documentation entry point while preserving historical phase records.
