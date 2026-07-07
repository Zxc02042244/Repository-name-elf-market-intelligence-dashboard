# V2-I18N-B Translation Dictionary Skeleton

## Current Status

V2-I18N-B adds a local static translation dictionary skeleton and helper utilities for future UI localization work.

This phase does not wire the dictionary into the mounted UI yet. Existing dashboard labels, status rendering, routing, API flow, and MarketModel behavior remain unchanged.

## Files Created

- `src/i18n/translations.js`
- `src/i18n/i18n.js`
- `docs/v2-i18n-b-translation-dictionary-skeleton.md`

## Supported Locales

The initial supported locale set is:

- `en`
- `zh-Hant`
- `ja`
- `ko`
- `vi`

English is the default locale and fallback locale.

## Key Naming Approach

Translation keys use stable semantic namespaces instead of view-specific text positions.

Initial key groups include:

- `app`
- `action`
- `status`
- `dashboard`
- `coverage`
- `analytics`
- `search`
- `snapshot`
- `asset`
- `actor`
- `transactions`
- `empty`
- `signals`

Examples:

- `search.currentLoadedSnapshot`
- `search.assetsOrActorsInLoadedSnapshot`
- `asset.snapshotStats`
- `asset.loadedTrades`
- `actor.snapshotStats`
- `actor.loadedCounterparties`
- `status.tokenRefreshFailed`
- `status.partialDataLoaded`

## Helper Behavior

`src/i18n/i18n.js` exports:

- `supportedLocales`
- `defaultLocale`
- `normalizeLocale(locale)`
- `t(key, locale, params)`

Fallback behavior:

- Unsupported or empty locales fall back to `en`.
- Missing localized strings fall back to the English string.
- Missing keys return the key string as a safe fallback.
- Parameter interpolation uses `{name}` placeholders.

The helper has no DOM access, no network access, no storage access, and no dependency on the app runtime.

## Translation Boundaries

The static dictionary is intended for UI labels, helper notes, empty states, status messages, and category display labels.

The following values should remain untranslated:

- actor names
- transaction IDs
- item IDs
- currency codes
- raw technical fields
- hashes
- canonical source IDs
- route parameter keys
- raw status kinds

## Intentionally Not Wired Yet

This phase intentionally does not add:

- language switch UI
- localStorage or sessionStorage persistence
- automatic browser locale detection in app state
- full UI label replacement
- runtime network translation
- external translation API
- DB-backed translation
- legacy i18n migration

## Security And Architecture Boundary

This phase does not add Supabase reads or writes, database code, scheduled jobs, workflow changes, API calls, official Elf/Cidi direct calls, or proxy changes.

No token, secret, `REFRESH_TOKEN`, hardcoded `accessToken`, `Bearer` token, raw auth payload, Supabase service role key, or Vercel secret is added.

## Recommended Next Phase

Recommended next phase:

`V2-I18N-C Snapshot Explorer UI Translation Wiring`

That phase should wire the mounted Snapshot Explorer labels through the static dictionary, while keeping the current loaded MarketModel snapshot data flow unchanged.
