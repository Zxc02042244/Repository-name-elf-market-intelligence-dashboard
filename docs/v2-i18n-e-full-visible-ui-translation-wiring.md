# V2-I18N-E Full Visible UI Translation Wiring

## Current Status

V2-I18N-E wires the major visible dashboard UI labels to the existing local static i18n helper while preserving the current loaded snapshot data flow.

The default locale remains `en`. The existing language switch continues to persist only the locale preference through `marketDashboard.locale`.

## Files Modified

- `src/i18n/translations.js`
- `src/app/main.js`
- `src/views/dashboard-view.js`
- `src/views/category-filter-view.js`
- `src/views/analytics-view.js`
- `src/views/snapshot-explorer-view.js`
- `src/views/transactions-view.js`
- `src/views/signals-view.js`
- `src/views/asset-view.js`
- `src/views/actor-view.js`

## UI Areas Wired

- App header and shell labels
- Language switch label and locale names
- Refresh action labels
- Live status and error messages
- Metric cards
- Model snapshot labels
- Asset coverage and category filter labels
- Market activity summary and basic analytics labels
- Snapshot Explorer search, sort, result count, detail, and empty-state labels
- Asset detail snapshot-safe labels
- Actor detail snapshot-safe labels
- Recent transaction labels
- Signals placeholder labels

## Locale Coverage

Static dictionaries remain local-only for:

- `en`
- `zh-Hant`
- `ja`
- `ko`
- `vi`

English remains the complete fallback dictionary. `zh-Hant` covers the full main dashboard shell and mounted views. `ja`, `ko`, and `vi` cover major visible labels and fall back to English for any lower-priority missing string.

Unsupported locales normalize back to `en`.

## Intentionally Untranslated

The following values remain source data or technical identifiers and are not translated:

- actor names
- asset names
- item IDs
- transaction IDs
- currency codes such as `SIGIL`
- route mode values
- route parameter keys
- raw status kinds
- raw source fields
- hashes
- canonical source IDs
- API endpoint strings
- environment variable names

## Remaining Hardcoded Text

Some source-provided category, group, asset class, and item labels remain canonical data values. They should only be translated later if a controlled display-label mapping is added in the source/config layer.

No DB-backed translation, automatic translation, or external translation service is introduced.

## Persistence Behavior

Locale persistence is unchanged:

- key: `marketDashboard.locale`
- value: normalized supported locale only
- fallback: `en`

No token, API data, transaction data, or source data is stored in localStorage or sessionStorage.

## Smoke Coverage

Completed checks:

- JavaScript syntax checks for modified modules
- i18n helper import check
- fallback locale check
- missing key fallback check
- render smoke for `en`, `zh-Hant`, `ja`, `ko`, and `vi`
- security scan for token, secret, fetch, and storage misuse

Browser smoke could not be completed in this environment because the local static server did not stay reachable and direct `file://` navigation was blocked by the browser security policy. No code workaround was added for this limitation.

## Intentionally Not Added

- external translation API
- runtime network translation
- automatic machine translation
- language auto-detection
- DB-backed translation
- Supabase reads or writes
- API/proxy changes
- new analytics
- image assets
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health

## Recommended Next Phase

Recommended next phase: `V2-I18N-F Translation Quality Polish`.

That phase should review translated wording quality and line-length behavior in the browser, especially for mobile 390px layouts and longer labels in `ja`, `ko`, and `vi`.
