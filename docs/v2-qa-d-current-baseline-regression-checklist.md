> **Status:** SUPERSEDED — DO NOT USE AS CURRENT QA BASELINE
> **Current authority:** [`package.json`](../package.json), [current Node and Playwright tests](../tests/), [`src/features/market/README.md`](../src/features/market/README.md), and [`src/features/skins/README.md`](../src/features/skins/README.md)
> **Superseded reason:** The UI, browser storage, API boundary, and automated test baseline have changed since this checklist was written.
> **Last verified:** 2026-07-16
> **Warning:** Do not treat the UI, storage, or API expectations below as the current QA baseline.

# V2-QA-D Current Baseline Regression Checklist

## Purpose

Use this checklist after small documentation, i18n, CSS, theme, search wording, or snapshot UI changes to confirm the current stable baseline has not regressed.

This checklist does not authorize new features, API work, DB writes, scheduled jobs, external dependencies, or architecture changes.

## Current Baseline

- GitHub Pages frontend
- plain HTML, CSS, and JavaScript ES modules
- loaded MarketModel snapshot UI
- local static i18n dictionaries
- supported locales: `en`, `zh-Hant`, `ja`, `ko`, `vi`
- locale persistence key: `marketDashboard.locale`
- Elf-inspired CSS theme
- generic CSS-only asset badges
- text-first asset UI
- live API/proxy work paused
- historical DB write work paused

## Test Targets

Live GitHub Pages URL:

```txt
https://zxc02042244.github.io/Repository-name-elf-market-intelligence-dashboard/
```

Local static preview, when needed:

```txt
node scripts/serve-static.mjs .
http://127.0.0.1:4173/
```

## 1. GitHub Pages Load

Pass criteria:

- live URL returns `200`
- page title is `Market Intelligence Dashboard`
- page is not GitHub Pages 404
- no blank screen
- `index.html`, CSS, and JS assets load

Fail criteria:

- GitHub Pages 404
- blank screen
- missing CSS or JS asset
- uncaught runtime error prevents rendering

## 2. Console Safety

Pass criteria:

- console errors: `0`
- console warnings: expected warning-only items only
- no `ReferenceError`
- no token-like value printed
- no raw auth payload printed
- no response body containing sensitive data printed

Fail criteria:

- uncaught JavaScript error
- `ReferenceError`
- token, Bearer value, access token, refresh token, raw auth payload, cookie, request header, or service role key appears

## 3. Locale Switch

Check all supported locales:

- `en`
- `zh-Hant`
- `ja`
- `ko`
- `vi`

Pass criteria:

- language selector is visible
- switching locale updates visible UI labels
- selected locale persists after reload
- unsupported/source data remains unchanged
- no major area remains English in a non-English locale unless it is source data or intentionally untranslated

Do not translate:

- actor names
- asset names unless dictionary-backed later
- item IDs
- transaction IDs
- currency codes such as `SIGIL`
- route keys
- raw status kinds
- source IDs
- API strings
- env var names

## 4. Mobile / Narrow Viewport

Check:

- `390px`
- `430px`

Pass criteria:

- no horizontal overflow
- page scroll width stays within client width
- language selector fits
- refresh button fits
- status message wraps safely
- search input is usable
- result cards remain readable
- buttons and utility links remain tappable
- transaction rows wrap safely when visible
- no text overlaps controls

Known testing note:

- Some browser tooling may report document client width slightly below the requested viewport width. Record both requested and observed widths.

## 5. Search / Clear Search

Pass criteria:

- search input is visible
- placeholder communicates loaded snapshot scope
- search accepts input
- Search action works
- Clear Search appears after a submitted search
- Clear Search clears the input
- no horizontal overflow after search
- search does not imply historical global search

Implementation note:

- Clear Search may be rendered as a link-style utility action rather than a `<button>`.

## 6. Refresh Failure State

Because live API/proxy work is paused, a safe failure state is acceptable.

Pass criteria:

- Refresh action is visible
- clicking refresh does not blank the page
- safe status appears, such as `Token refresh failed. Live data is unavailable.`
- status does not expose endpoint secrets, tokens, headers, cookies, raw auth payloads, or raw response bodies
- language switch and search remain usable after refresh failure

Fail criteria:

- blank screen after refresh
- sensitive data appears in UI or console
- frontend calls official Elf/Cidi API directly

## 7. Asset Badge / Text-first Boundary

Pass criteria:

- generic CSS-only asset badges render when asset result/detail data is available
- badges are derived from existing loaded asset names or generic source data
- missing live data degrades safely
- no image files are required
- no official artwork or logo asset is used
- no external image API is called
- views do not build Elf-specific official image URLs

Acceptable limitation:

- if live API is unavailable and no asset rows are loaded, badge rendering may be untestable in live smoke. Record this as limited by current data state, not as a failure.

## 8. Source / Storage Safety

Pass criteria:

- only allowed localStorage key is `marketDashboard.locale`
- no token is stored in localStorage
- no token is stored in sessionStorage
- no API response body is stored in browser storage
- source data remains untranslated where required

Fail criteria:

- any new localStorage or sessionStorage key stores token, API data, raw transactions, or secrets
- source IDs, route keys, item IDs, transaction IDs, or currency codes are translated

## 9. Architecture Boundary

Pass criteria:

- `src/core/` remains generic
- Elf-specific logic remains inside `src/sources/elf/`
- views render from MarketModel or generic derived data
- views do not call APIs
- views do not read raw API data
- views do not perform major analytics calculations
- `index.html` remains thin
- no React, Vite, npm dependency, Webpack, or build system is introduced

## 10. Token / Secret Scan

Run a targeted scan if any docs, API-related code, source adapter, scripts, or config files changed.

Pass criteria:

- no committed `REFRESH_TOKEN` value
- no hardcoded `accessToken` value
- no Bearer token value
- no Supabase service role key value
- no Vercel env value
- no raw auth payload
- no endpoint secret

Expected allowed references:

- token/env names may appear in docs as safety boundary text
- endpoint templates may appear in historical docs or brief when they do not include secret values

## 11. Result Template

Use this template for each regression run:

```txt
Date:
Tester:
Commit / HEAD:
Environment:
Live URL:

GitHub Pages load: pass / fail / blocked
Console safety: pass / fail / blocked
Locales checked: pass / fail / blocked
390px viewport: pass / fail / blocked
430px viewport: pass / fail / blocked
Search / Clear Search: pass / fail / blocked
Refresh failure state: pass / fail / blocked
Asset badge / text-first boundary: pass / fail / limited / blocked
Storage safety: pass / fail / blocked
Architecture boundary: pass / fail / blocked
Token / secret scan: pass / fail / blocked

Issues found:
Known limitations:
Follow-up needed:
```

## Current Known Limitations

- Live API/proxy work is paused.
- Refresh may show `Token refresh failed. Live data is unavailable.`
- Asset/actor detail selection with live data may be limited when no transactions are loaded.
- Source-data preservation on transaction rows may be limited when transaction rows are unavailable.
- Historical 7D/30D data is not available.

## Non-goals

Do not use this checklist to add:

- live API/proxy implementation
- personal proxy implementation
- Supabase reads or writes
- scheduled collector
- GitHub Actions workflow
- Vercel Cron
- external translation API
- external image API
- official artwork or logo files
- React, Vite, npm dependencies, Webpack, or a build system
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health implementation

