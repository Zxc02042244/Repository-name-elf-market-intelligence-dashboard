# V2-ASSET-B Asset Image Source Follow-up Audit

## Current Status

V2-ASSET-B audits the current asset image source and rendering boundary after:

- V2-I18N A-H
- V2-THEME-E Post-I18N 390px Readability CSS Pass
- V2-SEARCH-A Search Scope Wording Audit

This phase is documentation only. No runtime image handling, source adapter logic, CSS image layout, image assets, or external image source was added.

## Files Inspected

- `src/sources/elf/elf-items.js`
- `src/sources/elf/normalize-elf-transaction.js`
- `src/core/data/market-model.js`
- `src/views/snapshot-explorer-view.js`
- `src/views/asset-view.js`
- `src/views/dashboard-view.js`
- `src/views/category-filter-view.js`
- `src/views/transactions-view.js`
- `src/i18n/translations.js`
- `src/styles.css`
- `src/themes/elf-theme.css`
- `index.html`
- `README.md`
- `docs/v2-2d1-asset-image-source-audit.md`
- `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`
- `docs/v2-search-a-search-scope-wording-audit.md`

## Current Asset Metadata

Current Elf item metadata remains text-first and source-layer controlled.

Current item fields in `src/sources/elf/elf-items.js`:

- `itemId`
- `name`
- `group`
- `category`
- derived `assetClass`

Current normalized transaction asset fields in `src/sources/elf/normalize-elf-transaction.js`:

- `asset.id`
- `asset.name`
- `asset.assetClass`
- `asset.group`
- `asset.category`

`src/core/data/market-model.js` passes normalized asset metadata into `MarketModel` and does not add image-specific fields.

## Current Image Field Handling

No current asset image field was found.

No active field was found for:

- `image`
- `imageUrl`
- `thumbnail`
- `thumbnailUrl`
- `icon`
- `iconUrl`
- `artwork`
- `sprite`

No `<img>` rendering was found in the inspected runtime views.

No local image files were found in the repository for these common extensions:

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`
- `.gif`
- `.svg`
- `.ico`
- `.avif`

No CSS `url()` or `background-image` reference was found in the inspected CSS files.

## Current Rendering Boundary

The mounted Snapshot Explorer renders asset identity through text values only:

- asset name
- asset class
- category
- group
- current loaded snapshot stats
- recent loaded transactions

The backup `asset-view.js` also renders text-only asset cards and does not render image fields.

Views currently do not build image paths, external image URLs, official endpoint URLs, CDN paths, or fallback image paths.

This is safe for the current architecture because:

- `src/views/` does not infer source-specific image URLs.
- `src/core/` does not contain Elf-specific image logic.
- `src/sources/elf/` does not expose image URL construction.
- Missing images cannot break layout because no image rendering is active.

## Relative Path and Broken-reference Risk

Current broken-reference risk is low because no image assets are referenced.

If image support is added later, the first implementation should use GitHub Pages-compatible relative paths and should avoid absolute root paths such as:

```txt
/assets/item.png
```

Safer future path shape:

```txt
./assets/items/example.png
```

or a normalized value emitted from the Elf source/config layer after source approval.

Future image rendering must include a graceful fallback when image metadata is missing or an image fails to load. The fallback must preserve asset names and should not collapse cards or detail sections.

## UI Wording Check

No visible UI wording currently overpromises image coverage.

No inspected label claims:

- item thumbnails exist
- official images are loaded
- full artwork coverage exists
- image search is available
- visual catalog coverage is complete

Current UI remains text-first and snapshot-based. No wording change is required in `src/i18n/translations.js` for this phase.

## Safe Future Options

Safe future image directions remain:

1. Local static image mapping after source/provenance approval.
2. Static controlled URL mapping only if the URLs are public, stable, non-authenticated, and safe to expose.
3. Category or assetClass placeholders that do not use official artwork.
4. Continue with no images until image source ownership is clear.

Recommended future implementation location:

```txt
src/sources/elf/elf-item-images.js
```

or, for a very small mapping:

```txt
src/sources/elf/elf-items.js
```

Views should render only optional normalized image metadata. They should not construct Elf-specific paths.

## Unsafe Options To Avoid

Avoid:

- direct official Elf/Cidi image or API endpoint calls from GitHub Pages
- external image API calls
- runtime scraping for images
- copying legacy image helper code as a large block
- committing official artwork, screenshots, or logo assets
- committing generated images without explicit approval
- building image URLs directly inside views
- adding Elf-specific image source logic to `src/core/`
- depending on raw API image fields in views
- adding a large asset dump without source and license review

## Issues Found

No concrete runtime issue was found.

No safe source code fix is needed in this phase.

The main remaining limitation is product readiness: asset thumbnails should not be implemented until the image source and provenance decision is explicit.

## Recommended Next Phase

Recommended next phase:

```txt
V2-ASSET-C Image Source Decision
```

That phase should choose one path before implementation:

1. local static vetted assets
2. curated safe public static URL mapping
3. category/assetClass placeholders
4. defer images and keep text-first UI

Only after that decision should a scoped thumbnail implementation begin.

## Non-goals

This phase did not add:

- image files
- image URLs
- thumbnail UI
- fallback image components
- official artwork
- official logo assets
- screenshots
- generated images
- external image APIs
- official direct frontend API calls
- Supabase reads or writes
- DB writes
- workflow changes
- new dependencies
- new analytics
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health

## Security and Architecture Boundary

No changes were made to:

- `src/core/`
- `src/sources/`
- `src/views/`
- `src/app/`
- API/proxy behavior
- Supabase or database code
- workflow files
- `index.html`
- MarketModel shape
- localStorage behavior

The only allowed localStorage key remains:

```txt
marketDashboard.locale
```

No secrets, tokens, official endpoint values, raw auth payloads, or service role keys were added.
