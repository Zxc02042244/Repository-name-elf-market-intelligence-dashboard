# V2-SEARCH-A Search Scope Wording Audit

## Current Status

V2-SEARCH-A audits the current search wording and behavior after the i18n A-H phases and the V2-THEME-E mobile readability CSS pass.

The current search is a loaded snapshot search. It uses the currently rendered `MarketModel` and does not search historical records, Supabase data, all past transactions, or any remote index.

No runtime code changes were made in this phase.

## Files Inspected

- `src/views/snapshot-explorer-view.js`
- `src/core/analytics/snapshot-details.js`
- `src/app/router.js`
- `src/app/main.js`
- `src/i18n/translations.js`
- `docs/v2-i18n-e-full-visible-ui-translation-wiring.md`
- `docs/v2-i18n-f-manual-translation-qa-checklist.md`
- `docs/v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md`
- `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`

## Current Search Behavior

### Asset Search

Asset search uses the current loaded `model.assetStats` collection.

Matched fields:

- asset name
- category
- assetClass
- group

The result list is sorted by the selected sort mode and capped at 12 visible result cards.

### Actor Search

Actor search uses the current loaded `model.actorStats` collection.

Matched fields:

- actor name

The result list is sorted by the selected sort mode and capped at 12 visible result cards.

### Transactions

The current Snapshot Explorer search does not search transaction rows directly.

Transaction data appears in selected asset or actor detail views only, where recent loaded transactions are derived from the selected asset or actor inside the current loaded `MarketModel`.

### IDs

The current search does not intentionally expose or search by:

- transaction IDs
- item IDs
- route parameter keys
- raw status kinds
- raw source fields
- hashes
- API strings
- environment variable names

Asset and actor selection still uses URL hash parameters internally:

- `asset`
- `actor`
- `mode`
- `q`
- `sort`

Those route keys are technical state and should remain untranslated.

## Current Route and Detail Behavior

The router stores Snapshot Explorer state in the URL hash.

Supported route state:

- `mode`: `assets` or `actors`
- `q`: search query
- `sort`: `value`, `activity`, `latest`, or `name`
- `asset`: selected asset id
- `actor`: selected actor id

Selecting an asset or actor updates the hash and renders a snapshot detail view from the current loaded `MarketModel`.

If the selected asset or actor is no longer available because the category filter or loaded snapshot changed, the UI renders an unavailable selection state with a clear selection action.

## Current Search Scope Wording

Current English wording is accurate for the implemented behavior:

- `Search current loaded snapshot`
- `Search assets or actors in loaded snapshot`
- `Not historical global search`
- `Search results use the currently loaded marketplace snapshot. Category filters may limit visible results.`
- `Historical global search requires future historical database read support.`

The visible copy correctly avoids implying:

- historical search
- global search across all records
- Supabase-backed search
- transaction ID search
- full database search
- all past transaction search

## Labels or Descriptions That Could Overpromise

No concrete overpromising label was found.

The title `Snapshot Search` is broad, but it is immediately constrained by the search label, placeholder, scope note, and historical database note. No immediate translation or runtime wording change is required.

If future manual browser QA finds the title ambiguous, a later targeted polish pass could consider `Snapshot Explorer` or `Loaded Snapshot Search`, but that change is not necessary in this audit.

## Sort and Filter Expectations

Sort modes apply only to the visible Snapshot Explorer result lists:

- value
- activity
- latest
- name

Category filters can limit the loaded model shown to Snapshot Explorer. The existing scope note already communicates that category filters may limit visible results.

The current UI should not imply that sorting applies to all historical records or to a remote database.

## Neutral Wording Check

The search and detail wording remains neutral.

Current wording uses neutral market-structure terms such as:

- asset
- actor
- participant
- loaded snapshot
- loaded activity
- current category/filter

No accusation wording was found in the inspected search-scope UI.

## Recommended Follow-up

No code change is required for V2-SEARCH-A.

Recommended future phase:

```txt
V2-SEARCH-B Manual Search Scope QA
```

That phase should manually verify in a browser that users can understand:

- search is limited to current loaded snapshot data
- category filters may limit results
- transaction rows are not directly searched
- historical global search is not available yet

If a real wording issue is found during manual QA, the fix should be limited to `src/i18n/translations.js`.

## Non-goals

This audit did not add:

- new search behavior
- transaction search
- item ID search
- historical search
- Supabase search
- global command palette
- new filters
- new sort modes
- routing changes
- API calls
- DB reads or writes
- external dependencies
- browser automation tooling
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health

## Security and Architecture Boundary

No changes were made to:

- `src/core/`
- `src/sources/`
- API/proxy behavior
- Supabase or database code
- workflow files
- `index.html`
- MarketModel shape
- source adapter behavior
- localStorage behavior

The only allowed localStorage key remains:

```txt
marketDashboard.locale
```

No secrets, tokens, API endpoints, raw auth payloads, or service role keys were added.
