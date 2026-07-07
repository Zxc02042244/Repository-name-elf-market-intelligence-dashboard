# Legacy Reference Checklist

This note preserves safe reference ideas from the legacy `marketplace-resources-site/` material before it is archived or made private.
It is documentation only and must not be treated as implementation guidance for API, auth, token, or collector code.

## Legacy Item / Category Structure

The legacy site organized marketplace coverage around three broad item groups:

- Resources
  - Crops, fruits, grains, grass, spices, vegetables, wood, minerals, and animal products.
  - Useful as a reference for broad material-market grouping.
- General
  - Utility items, maps, tools, equipment-like items, and miscellaneous market goods.
  - Useful only as a historical grouping reference; ambiguous items should be reviewed before reclassification.
- Pi Elf Outfit
  - Outfit and collectible-style visual identity items.
  - Useful as a reference for cosmetics and collectibles grouping.

## UI Ideas Worth Preserving

- Dashboard layout ideas
  - Market totals, recent activity, top assets, and compact summary panels.
  - Keep future versions readable and dense, not decorative-first.
- Item search / player search ideas
  - Single search entry for item and actor exploration.
  - Search results should stay snapshot-based unless historical data is explicitly connected.
- Market transaction display ideas
  - Recent transaction rows with item name, quantity, total value, unit value, seller, buyer, and time.
  - Keep transaction lists capped for performance.
- Mobile layout ideas
  - Compact cards, scroll-safe controls, and readable transaction rows at narrow widths.
  - Avoid horizontal overflow on small mobile screens.

## Snapshot / History Ideas

- Old local snapshot concept
  - The legacy project explored browser-side and generated JSON snapshots.
  - This is useful as product context, not as the target architecture.
- Item-history export shape
  - Historical item snapshots included generated time, interval, retention window, item counts, and snapshot rows.
  - Future storage should map this idea into database-backed `price_snapshots` and summary APIs.
- Transaction-history export shape
  - Transaction history exports included generated time, interval, retention window, capped transaction count, and transaction rows.
  - Future storage should map this idea into `market_transactions`, collector runs, and aggregated summaries.
- Collector workflow idea
  - The legacy workflow idea is useful as historical context for scheduled collection.
  - Future collector work must be redesigned around server-side secrets, controlled concurrency, safe dedupe, and database writes.

## Migration Notes

- These references are documentation only.
- Do not directly migrate old API, auth, or token flow.
- Do not copy the legacy site as a large file.
- Do not expose `REFRESH_TOKEN` or `accessToken`.
- Do not call official Elf/Cidi endpoints directly from the frontend.
- The current dashboard must continue to use the Vercel proxy boundary only.
- Keep Elf-specific item metadata and adapter logic inside `src/sources/elf/`.
- Keep generic model and analytics logic inside `src/core/`.
- Views must continue to render from `MarketModel` and must not call APIs.

## Intentionally Excluded

- Official endpoint URLs from legacy code.
- Refresh token values.
- Access token values.
- Raw auth payloads.
- Request headers or cookies.
- Old runtime token flow implementation.
- Direct official API fetch implementation.
- Full legacy HTML or large copied code blocks.
