# V2 Product Polish Discussion Note

This document captures low-risk product polish directions for the current live snapshot dashboard. It is a
planning and discussion note only. It does not change runtime UI, data sources, historical storage, collector
code, schedules, or secrets.

## 1. Current Project State

- V2-4 Snapshot Explorer and asset detail work is stable for the live snapshot scope.
- V2-3 actor/player snapshot labels and layout are complete through the mounted Snapshot Explorer flow.
- Historical database work is paused safely after V2-6B.4A.
- The Supabase schema exists and the expected tables were verified manually.
- No Supabase service role key is connected in this repository.
- No database write test has run.
- The current UI uses the currently loaded `MarketModel` snapshot only.
- No true 7D / 30D history is available yet.
- Search, detail pages, metric cards, and recent transactions should continue to be described as loaded
  snapshot features until historical read support exists.

## 2. Search Scope Discussion

Current search is not true global historical search.

Current search should be understood as loaded snapshot search:

- It searches the currently loaded `MarketModel` snapshot.
- It may be affected by the selected category or filter scope.
- It does not search Supabase history.
- It does not search 7D / 30D records.
- It does not search all past transactions.

Recommended wording:

- Search current loaded snapshot
- Current category results
- All loaded snapshot results, only if that broader loaded-snapshot scope is implemented later

Future search levels:

1. Current category snapshot search
   - Search only the currently selected category/filter model.
   - This matches the current safest behavior.

2. All loaded snapshot search
   - Search all items and actors already loaded into the current snapshot, independent of selected category.
   - This should still be snapshot-only and should not imply historical coverage.

3. Historical global search
   - Search historical records only after V2-6 historical database read support exists.
   - This should use a read-only summary/search API, not direct privileged database access from GitHub Pages.

Recommended next phase option:

- V2-4G Snapshot Search Scope Label Refinement

Non-goals:

- No Supabase search.
- No historical search.
- No global command palette.
- No new API call in views.

## 3. Asset Item Image Discussion

Asset images would improve item recognition, especially on mobile. They should be treated as product polish,
not as a data-source or analytics expansion.

Safe direction:

- Do not add images by directly calling official Elf/Cidi endpoints from the frontend.
- Do not copy a legacy image helper as one large migrated block.
- Prefer a static, controlled asset image mapping.
- Views should not build Elf-specific image URLs themselves.
- If needed, image metadata should be handled through an Elf source/config layer, then rendered safely by
  views as ordinary display metadata.

Possible future UI locations:

- Asset result card thumbnail.
- Asset detail header image.
- Optional small image in the asset identity section.

Recommended next phases:

1. V2-2D.1 Asset Image Source Audit
   - Identify safe image sources.
   - Confirm licensing and source stability.
   - Decide whether images should be local static assets or a controlled mapping to known public asset URLs.

2. V2-2D.2 Asset Thumbnail UI
   - Add small thumbnails only after the image source audit.
   - Keep image display optional and resilient when an image is missing.

Non-goals:

- No official endpoint image fetch.
- No legacy image helper migration.
- No raw API image dependency.
- No large asset dump without audit.

## 4. Translation / i18n Discussion

Recent snapshot-safe labels are mostly English. Translation should be handled as UI/product polish, not as
database, history, or analytics work.

Preferred direction:

- Use a static dictionary.
- Keep translation keys stable and explicit.
- Avoid external translation APIs.
- Avoid runtime translation services.
- Keep canonical IDs, transaction values, and source identifiers unchanged.

Languages to consider:

- `zh-Hant`
- `en`
- `ja`
- `ko`
- `vi`

Translate:

- UI labels.
- Buttons.
- Helper notes.
- Empty states.
- Status messages.
- Category display labels if safe.

Do not translate:

- Actor names.
- Transaction IDs.
- Item IDs.
- Currency codes.
- Raw technical fields.
- Hashes.
- Canonical source IDs.

Key terms needing i18n:

- Snapshot Asset Stats
- Loaded Trades
- Loaded Volume
- Loaded Quantity
- Snapshot Avg Unit
- Latest Loaded Unit
- Latest Loaded Trade
- Recent Loaded Transactions
- Snapshot Actor Stats
- Loaded Sold Count
- Loaded Bought Count
- Loaded Sold Volume
- Loaded Bought Volume
- Loaded Participation Value
- Loaded Main Assets
- Loaded Counterparties
- Latest Loaded Activity
- Recent Loaded Actor Transactions
- Clear Search
- Clear Selection
- Search current loaded snapshot

Recommended next phases:

1. V2-I18N-A Translation Coverage Audit
   - Audit current labels, buttons, helper notes, empty states, and status messages.
   - Produce a key list before changing runtime UI.

2. V2-I18N-B Translation Dictionary Skeleton
   - Add a static dictionary structure only after the coverage audit.
   - Avoid external dependencies and build tooling.

3. V2-I18N-C Snapshot Explorer UI Translation
   - Apply dictionary usage to the mounted Snapshot Explorer first.
   - Keep MarketModel and analytics unchanged.

4. V2-I18N-D Language Switch Smoke / Persistence
   - Add a small language switch only after dictionary coverage is stable.
   - Keep persistence local and non-sensitive if approved.

Non-goals:

- No external translation API.
- No automatic machine translation.
- No DB-backed translation.
- No user-generated translation system.

## 5. Recommended Priority

Safest order:

1. V2-3D Actor / Player Snapshot Closeout Audit
2. V2-4G Snapshot Search Scope Label Refinement
3. V2-2D.1 Asset Image Source Audit
4. V2-I18N-A Translation Coverage Audit
5. V2-2D.2 Asset Thumbnail UI only after image source audit
6. V2-I18N-B Translation Dictionary Skeleton
7. V2-6B.5 One-item DB Write Test only when secrets are ready

Why this order is safer:

- These phases do not require a service role key.
- They do not add database writes.
- They do not add a scheduled collector.
- They keep the current snapshot UI honest.
- They improve product clarity without weakening architecture boundaries.
- They avoid presenting snapshot-only data as historical analytics.
- They allow product polish to move forward while historical storage remains paused.

## 6. Security and Architecture Boundaries

Confirmations:

- No frontend secrets.
- No `REFRESH_TOKEN`.
- No hardcoded `accessToken`.
- No Supabase service role key.
- No official Elf/Cidi direct frontend API calls.
- No API calls in views.
- No major analytics in views.
- No historical UI before historical data exists.
- No accusation wording.
- Keep neutral market-structure language.

Implementation boundaries for any future polish phase:

- Views should continue to render from `MarketModel`.
- Source-specific display metadata should stay in `src/sources/elf/` or a clearly bounded source adapter layer.
- Generic analytics should stay in `src/core/`.
- Search wording should identify whether it covers the current category snapshot or the whole loaded snapshot.
- Images should be optional display metadata and should not become a live API dependency.
- Translation should use static dictionaries unless a later phase explicitly approves a different approach.

