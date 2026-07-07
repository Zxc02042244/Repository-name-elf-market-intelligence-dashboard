# V2-2D.1 Asset Image Source Audit

This document audits safe options for future asset image support before any thumbnail UI is added. It is
documentation only and does not change runtime UI, source adapters, model shape, image assets, API calls,
historical storage, collector code, schedules, or secrets.

## 1. Current Item / Asset Metadata Structure

Inspected files:

- `src/sources/elf/elf-items.js`
- `src/sources/elf/elf-config.js`
- `src/sources/elf/normalize-elf-transaction.js`
- `src/views/snapshot-explorer-view.js`
- `src/views/asset-view.js`
- `src/core/data/market-model.js`
- `src/styles.css`
- `src/themes/elf-theme.css`
- `docs/legacy-reference-checklist.md`
- `docs/v2-product-polish-discussion-note.md`
- `docs/v2-theme-a-elf-inspired-theme-audit.md`
- `docs/v2-near-term-priority-note.md`

Current Elf item metadata is defined in `src/sources/elf/elf-items.js`.

Current item fields include:

- `itemId`
- `name`
- `group`
- `category`
- derived `assetClass`

`applyElfAssetTaxonomy()` maps source category labels into the current dashboard taxonomy:

- Resources / Materials
- Blueprints / Progression
- Cosmetics / Collectibles
- Unclassified / Other

`src/sources/elf/normalize-elf-transaction.js` maps an Elf item into generic transaction asset metadata:

- `transaction.asset.id`
- `transaction.asset.name`
- `transaction.asset.assetClass`
- `transaction.asset.group`
- `transaction.asset.category`

`src/core/data/market-model.js` builds the `MarketModel` from normalized transactions and does not add or
rewrite asset display metadata.

Views currently read asset metadata from `MarketModel`:

- `src/views/snapshot-explorer-view.js` reads asset name, asset class, category, group, and id.
- `src/views/asset-view.js` reads asset name, asset class, group, and category.

## 2. Existing Image Field Check

No image field currently exists in the inspected source files.

No current field was found for:

- `image`
- `imageUrl`
- `thumbnail`
- `thumbnailUrl`
- `icon`
- `iconUrl`
- `artwork`
- `sprite`

Current views do not render `<img>` elements for assets. Current styles do not define thumbnail-specific
classes.

## 3. Can MarketModel Carry Image Metadata Safely?

Yes, with constraints.

The current `MarketModel` can carry safe image metadata if it arrives as part of normalized generic asset
metadata. The safest future shape would be an optional generic field such as:

```js
asset: {
  id,
  name,
  assetClass,
  group,
  category,
  image: {
    src,
    alt
  }
}
```

Safety constraints:

- Image metadata must be normalized before entering `MarketModel`.
- The frontend must not build official Elf/Cidi image URLs in views.
- Views should render only already-normalized, already-approved image metadata.
- Missing image metadata must degrade gracefully.
- Image metadata should be optional and must not be required for analytics.
- `src/core/` should not contain Elf-specific image URL construction.

If a future implementation decides that `MarketModel` should carry `asset.image`, the field should remain
generic. Elf-specific source paths, CDN mappings, item IDs, official-source assumptions, and source audit notes
must remain in `src/sources/elf/`.

## 4. Safe Options For Future Image Mapping

Option A: Local static image mapping after source audit

- Store vetted image assets inside a local static asset folder only after approval.
- Map `itemId` to local relative paths in an Elf source/config module.
- Use GitHub Pages-compatible relative paths.
- Good for stability and avoiding external runtime dependency.
- Requires a separate source/license audit before files are committed.

Option B: Static controlled URL mapping after source audit

- Keep a curated mapping of `itemId` to known public image URLs.
- Use only URLs that are approved, stable, and safe to expose.
- Keep mapping inside `src/sources/elf/`, not in views.
- Avoid official endpoints unless they are explicitly approved as public static assets and do not require auth.
- Requires graceful fallback for broken images.

Option C: Category or assetClass placeholder icons

- Use generic local placeholders by category or asset class.
- Avoid item-specific official artwork.
- Good first step if item-specific image provenance is uncertain.
- Could use simple CSS or local generic assets in a later approved phase.
- Must still avoid generated image files in this audit phase.

Option D: No images until image source is proven

- Keep current text-first UI.
- Lowest risk if image ownership, stability, or source safety is unclear.

## 5. Unsafe Options To Avoid

Avoid these paths:

- Direct official Elf/Cidi image or API endpoint calls from the GitHub Pages frontend.
- External image API calls.
- Runtime scraping for images.
- Copying a legacy image helper as one large block.
- Reusing official artwork without explicit approval.
- Committing official logo assets.
- Committing screenshots.
- Committing generated images during this audit phase.
- Building image URLs directly inside views.
- Letting views infer official source paths from item IDs.
- Adding image data to `src/core/` with Elf-specific naming.
- Depending on raw API image fields in views.
- Adding a large asset dump without an image source audit.

## 6. Recommended Location For Image Mapping

Recommended future location:

- `src/sources/elf/elf-item-images.js`

Alternative if the mapping stays small:

- `src/sources/elf/elf-items.js`

Recommended future boundaries:

- Elf-specific image mapping belongs in `src/sources/elf/`.
- Generic normalized image metadata can be attached to `transaction.asset.image`.
- Views can render `asset.image` only after it is normalized and optional.
- `src/core/` should remain generic and should not know official image sources.
- `src/views/` should not build source-specific URLs.

Possible future helper names:

- `getElfItemImage(itemId)`
- `applyElfItemImageMetadata(item)`

These are future implementation ideas only. They are not implemented in this phase.

## 7. Recommended Future UI Locations

Future thumbnail UI should be added only after image source safety is decided.

Low-risk UI locations:

- Asset result card thumbnail.
- Asset detail header image.
- Small optional image in the asset identity section.

Display rules:

- Do not require an image for layout stability.
- Use an explicit missing-image fallback.
- Keep text labels primary.
- Do not hide asset names behind images.
- Avoid large image backgrounds behind stats or transaction rows.
- Preserve mobile readability at 390px.
- Preserve no-horizontal-overflow behavior.

## 8. Non-goals

- No image files.
- No image URLs from official endpoints.
- No external image API.
- No asset thumbnail UI.
- No runtime UI modification.
- No official artwork reuse.
- No official logo asset.
- No screenshots.
- No generated images.
- No direct official Elf/Cidi frontend API calls.
- No Supabase reads or writes.
- No service role key.
- No database write path.
- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No API calls in views.
- No new analytics.
- No MPS implementation.
- No TTS/TTP implementation.
- No Alerts implementation.
- No Watchlist implementation.
- No Market Health implementation.

## 9. Recommended Next Phase

Recommended next phase:

- V2-2D.2 Asset Thumbnail UI only after an approved image source decision.

Before V2-2D.2 starts, decide one of:

1. Use local static images with approved provenance.
2. Use a curated non-authenticated static URL mapping.
3. Use category/assetClass placeholders first.
4. Defer images and keep the text-first UI.

If implementation is approved later, start with a small subset:

- one crop/resource item
- one blueprint/progression item
- one outfit/collectible item
- one missing-image fallback case

The first implementation should verify:

- image metadata remains in the Elf source/config layer
- views render only normalized optional image metadata
- missing images do not break cards or detail views
- no official endpoint image fetch occurs
- no external image API is added
- mobile 390px remains usable

## 10. Closeout Finding

The repository is not ready to add item thumbnails until a safe image source is chosen. The current asset
metadata structure can support future optional image metadata, but image source ownership, URL stability, and
frontend boundary rules must be settled first. The safest direction is a static controlled image mapping in the
Elf source layer, with views rendering only optional normalized image metadata and degrading gracefully when no
image exists.

