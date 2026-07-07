# V2-DOCS-B Encoding / Legacy Doc Cleanup Audit

## Purpose

Audit early project documents for encoding issues, stale baseline descriptions, legacy references, and status text that no longer matches the current safe-work baseline.

This is an audit-only phase. No runtime code, source adapter, API, database, workflow, or UI behavior was changed.

## Current Baseline

- Starting HEAD: `c2eb33fe6326f01bd305a56ddb0e420e62e9a736`
- Latest completed QA closeout: `V2-QA-C Manual Browser/Mobile Interactive Smoke Result Backfill`
- Current product mode:
  - GitHub Pages frontend
  - plain HTML, CSS, and JavaScript ES modules
  - loaded MarketModel snapshot UI
  - local static i18n dictionaries
  - Elf-inspired CSS theme
  - generic CSS-only asset badges
  - live API/proxy work paused
  - historical DB write work paused

## Files Inspected

- `README.md`
- `CHECKLIST.md`
- `docs/index.md`
- `docs/v2-closeout-a-near-term-safe-work-closeout.md`
- `docs/v2-i18n-f-manual-translation-qa-checklist.md`
- `docs/v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md`
- `docs/v2-theme-d-mobile-readability-smoke.md`
- `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`
- `docs/v2-qa-a-live-manual-browser-mobile-smoke-checklist.md`
- `docs/v2-qa-b-live-pages-deployment-smoke-closeout.md`
- `docs/v2-qa-c-manual-browser-mobile-interactive-smoke-result-backfill.md`
- `docs/local-static-preview-workflow.md`
- `docs/legacy-reference-checklist.md`
- `docs/live-refresh-403-handoff.md`

Repo-wide scans also covered:

- `docs/`
- `README.md`
- `CHECKLIST.md`
- `AGENTS.md`
- `CODEX_MARKET_INTELLIGENCE_DASHBOARD_BRIEF.md`

## Encoding Findings

### Confirmed Issue: V2-I18N-F Locale Display Text

`docs/v2-i18n-f-manual-translation-qa-checklist.md` contains corrupted locale display names in the "Locales To Check" section.

Observed corrupted text includes a damaged combined line where these locale names should appear:

- `繁體中文`
- `日本語`
- `한국어`
- `Tiếng Việt`

This is documentation-only corruption. Runtime i18n dictionaries were already confirmed healthy in V2-QA-B and V2-QA-C.

Recommended cleanup:

- Replace the corrupted locale list with:
  - `English`
  - `繁體中文`
  - `日本語`
  - `한국어`
  - `Tiếng Việt`

Risk:

- Low. This is a targeted documentation text repair.

### Runtime Dictionary Status

No runtime dictionary corruption was found during the latest QA closeouts.

Current confirmed runtime locales:

- `en`
- `zh-Hant`
- `ja`
- `ko`
- `vi`

## Stale Baseline Findings

### `docs/index.md`

The documentation index is useful but now stale.

Stale points:

- Latest closeout still points to `V2-QA-A Live Manual Browser/Mobile Smoke Checklist`.
- Latest baseline commit still points to an older pre-index baseline.
- Theme/mobile track still says real browser/mobile QA needs manual or stable browser verification.
- Recommended next safe option still starts with running the manual QA checklist, even though V2-QA-C has now backfilled an interactive browser/mobile smoke result.

Recommended cleanup:

- Update latest closeout to `V2-QA-C Manual Browser/Mobile Interactive Smoke Result Backfill`.
- Update latest baseline commit to the current post-QA-C commit.
- Add `docs/v2-qa-b-live-pages-deployment-smoke-closeout.md`.
- Add `docs/v2-qa-c-manual-browser-mobile-interactive-smoke-result-backfill.md`.
- Change browser/mobile status from "unverified" to "basic interactive smoke passed, with asset/actor detail limited by live API failure state."
- Keep live API/proxy and historical DB as paused.

Risk:

- Low. This is a docs index refresh only.

### `README.md`

`README.md` still describes the project as BETA 1.0.0 architecture and mock data only.

Stale points:

- Says live API calls are not included yet.
- Says full item list is not included yet.
- Says detail pages are not included yet.
- Says Elf source adapter is a placeholder.
- Does not mention the current loaded snapshot UI, i18n, theme, asset badges, live API paused state, or historical DB pause.

Recommended cleanup:

- Add a short "Current Status" section.
- Link to `docs/index.md` as the current phase map.
- Keep the BETA 1.0.0 foundation history, but avoid presenting it as the current full state.
- Do not rewrite README as a long phase history.

Risk:

- Medium-low. README is user-facing and should be accurate, but the update should stay concise to avoid churn.

### `docs/v2-closeout-a-near-term-safe-work-closeout.md`

This closeout correctly records the state at that historical phase, but it now contains statements that are superseded by V2-QA-C.

Superseded points:

- Browser/mobile QA was unavailable.
- Real 390px QA remained unresolved.
- Recommended next step was V2-QA-A.

Recommended cleanup:

- Do not rewrite the historical phase content.
- If desired, add a small superseded-by note pointing to V2-QA-C.
- Prefer updating `docs/index.md` rather than editing old closeout records heavily.

Risk:

- Low if only a short superseded note is added.

### `docs/v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md`

This file accurately records that browser/mobile QA was unavailable during V2-I18N-H.

Recommended cleanup:

- Do not rewrite it as if that phase passed.
- Optionally add a short note that V2-QA-C later backfilled browser/mobile smoke.

Risk:

- Low if only a superseded-by note is added.

### `docs/v2-theme-d-mobile-readability-smoke.md` and `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`

These files contain historical statements that browser/mobile checks were unavailable at the time.

Recommended cleanup:

- Preserve them as phase records.
- Use `docs/index.md` to point readers to V2-QA-C for the newer interactive smoke result.

Risk:

- Low.

## Legacy Reference Findings

`docs/legacy-reference-checklist.md` remains aligned with the current boundary:

- documentation-only reference
- no direct migration
- no old API/auth/token flow
- no full legacy HTML copy

No legacy source migration was found in this audit.

Recommended cleanup:

- No immediate edit required.
- Keep legacy material out of active runtime docs except as sanitized reference.

## Security Scan Findings

No committed secret values were found by the targeted documentation scan.

The docs contain expected references to sensitive names as boundary guidance, such as:

- `REFRESH_TOKEN`
- `accessToken`
- `SUPABASE_SERVICE_ROLE_KEY`
- `Bearer`

These appear as names or warnings, not committed values.

No actual token-like value, service-role key value, raw auth payload, or Vercel env value was identified in the scanned docs.

## Cleanup Priority

Recommended next cleanup phase:

```txt
V2-DOCS-C Targeted Documentation Cleanup
```

Suggested scope:

1. Repair the corrupted locale list in `docs/v2-i18n-f-manual-translation-qa-checklist.md`.
2. Refresh `docs/index.md` to point to V2-QA-C as the latest QA closeout.
3. Add a concise current-status note to `README.md` linking to `docs/index.md`.
4. Optionally add short "superseded by V2-QA-C" notes to historical QA closeout docs, without rewriting their original phase facts.

Recommended changed files if approved:

- `docs/v2-i18n-f-manual-translation-qa-checklist.md`
- `docs/index.md`
- `README.md`
- optionally `docs/v2-closeout-a-near-term-safe-work-closeout.md`
- optionally `docs/v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md`

## What Should Not Be Changed During Cleanup

Do not use docs cleanup to change:

- `src/`
- `index.html`
- `scripts/`
- `supabase/`
- `.github/workflows/`
- API/proxy behavior
- MarketModel shape
- i18n runtime dictionaries unless a real runtime issue is found
- source adapter behavior
- localStorage behavior

Do not add:

- secrets
- token values
- official direct frontend API calls
- external translation API
- external image API
- browser automation dependency
- npm package
- build system
- Supabase reads or writes
- scheduled collector
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health implementation

## Verdict

V2-DOCS-B found one confirmed documentation encoding issue and several stale baseline descriptions.

The main cleanup need is targeted documentation maintenance, not runtime work:

- repair V2-I18N-F locale display text
- update the docs index to the current V2-QA-C baseline
- add a concise README current-status pointer
- preserve older phase docs as historical records unless adding short superseded notes

