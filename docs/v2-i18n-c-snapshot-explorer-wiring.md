# V2-I18N-C Snapshot Explorer UI Translation Wiring

## Summary

V2-I18N-C wires selected mounted Snapshot Explorer UI labels to the local static i18n helper while preserving the current default English UI behavior.

The mounted view continues to use the loaded `MarketModel` snapshot only. This phase does not change routing, data shape, analytics, API behavior, or historical database behavior.

## Files Modified

- `src/views/snapshot-explorer-view.js`

## Files Created

- `docs/v2-i18n-c-snapshot-explorer-wiring.md`

## Labels Wired

Snapshot Explorer labels now use local i18n keys for:

- Snapshot Search
- Search current loaded snapshot
- Search assets or actors in loaded snapshot
- Not historical global search messaging
- Clear Search
- Clear Selection
- Search action
- Snapshot result type tabs
- result count and capped result notes
- selected card marker
- selected unavailable empty state
- Snapshot Asset Stats
- Asset Identity / Taxonomy
- Loaded Trades
- Loaded Volume
- Loaded Quantity
- Snapshot Avg Unit
- Latest Loaded Unit
- Latest Loaded Trade
- Loaded Sellers
- Loaded Buyers
- Recent Loaded Transactions
- Snapshot Actor Stats
- Actor Identity
- Loaded Sold Count
- Loaded Bought Count
- Loaded Sold Volume
- Loaded Bought Volume
- Loaded Participation Value
- Loaded Main Assets
- Loaded Counterparties
- Latest Loaded Activity
- Recent Loaded Actor Transactions
- common no-result and no-recent-transaction empty states

## Default Locale Behavior

The mounted Snapshot Explorer uses `defaultLocale` from `src/i18n/i18n.js`, currently `en`.

This keeps rendered output equivalent to the existing English UI while allowing future phases to pass a selected locale through app state.

## What Remains Hardcoded

Some low-risk structural labels remain hardcoded for now:

- sort label and sort option names
- asset and actor route mode values
- raw route parameter names
- transaction arrow display between seller and buyer
- actor names, asset names, item IDs, transaction IDs, currency codes, and other source data

These should remain untranslated or be handled in a later focused pass.

## Why Language Switch Is Not Added Yet

This phase intentionally avoids adding a language switch because the current goal is wiring validation only.

Adding locale selection should be handled separately so the project can decide:

- app state shape for locale
- persistence behavior
- default browser locale behavior
- mobile placement of the language control
- smoke test coverage for every supported locale

## Security And Architecture Boundary

This phase does not add:

- external translation API
- runtime network translation
- Supabase reads or writes
- DB write path
- scheduled collector
- workflow changes
- API calls in views
- official Elf/Cidi direct calls
- secrets or token handling

No `REFRESH_TOKEN`, hardcoded `accessToken`, `Bearer` token, service role key, raw auth payload, or Vercel secret is added.

## Recommended Next Phase

Recommended next phase:

`V2-I18N-D Language Switch / Persistence`

That phase should decide how locale state is selected and persisted, then smoke test the mounted Snapshot Explorer in all supported locales.
