# V2-I18N-D Language Switch / Persistence

## Summary

V2-I18N-D adds a compact language switch and safe locale preference persistence for the dashboard UI.

The mounted Snapshot Explorer now receives the selected locale and renders its previously wired labels through the local static i18n helper.

## Files Modified

- `src/app/state.js`
- `src/app/main.js`
- `src/views/snapshot-explorer-view.js`
- `src/styles.css`

## Files Created

- `docs/v2-i18n-d-language-switch-persistence.md`

## Locale State Behavior

App state now includes a `locale` field initialized from `defaultLocale`.

At startup, `src/app/main.js` attempts to read the saved locale preference. Unsupported values are normalized through `normalizeLocale(locale)` and fall back to `en`.

If browser storage is unavailable, the app continues with `en`.

## Persistence Key

The locale preference uses:

```txt
marketDashboard.locale
```

Only the locale code is stored. No token, API response, market data, actor data, asset data, or Supabase value is stored.

## Supported Locales

The language switch uses `supportedLocales` from the i18n helper:

- `en` - English
- `zh-Hant` - 繁體中文
- `ja` - 日本語
- `ko` - 한국어
- `vi` - Tiếng Việt

## What Remains Untranslated

The language switch currently affects the mounted Snapshot Explorer labels wired in V2-I18N-C.

The following remain untranslated:

- dashboard header copy
- dashboard metric cards outside Snapshot Explorer
- category filter view
- analytics view
- recent transactions view outside detail rows
- signals view
- sort labels and sort option names
- actor names
- asset names
- item IDs
- transaction IDs
- currency codes
- raw status kinds
- route parameter keys
- canonical source IDs

## What Was Intentionally Not Added

This phase intentionally does not add:

- external translation API
- runtime network translation
- automatic machine translation
- DB-backed translation
- user-generated translations
- Supabase reads or writes
- scheduled collector
- workflow changes
- API calls in views
- official Elf/Cidi direct calls
- token persistence

## Security Boundary

No `REFRESH_TOKEN`, hardcoded `accessToken`, `Bearer` token, service role key, raw auth payload, or Vercel secret is added.

The only browser storage key introduced is `marketDashboard.locale`.

## Recommended Next Phase

Recommended next phase:

`V2-I18N-E Translation Quality Audit`

That phase should review the draft non-English strings and decide whether to polish dictionary values before wiring more dashboard views.
