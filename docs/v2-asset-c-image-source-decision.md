# V2-ASSET-C Image Source Decision

## Current Decision

The current decision is:

```txt
Keep the asset UI text-only for now.
```

No asset image rendering should be implemented until a safe image source and provenance path is explicitly approved.

If visual recognition becomes a near-term priority, the safest next step is a generic CSS-only fallback badge, not item-specific artwork.

## Context

V2-ASSET-B confirmed:

- no current asset image metadata exists
- no `<img>` rendering exists
- no local image assets exist
- no CSS `url()` or `background-image` references exist
- no UI wording currently promises image coverage
- no image source has been approved

The current UI is therefore safe, text-first, GitHub Pages-compatible, and not exposed to broken image references.

## Options Compared

## 1. Keep Text-only Asset UI For Now

Decision status:

```txt
Recommended now.
```

Benefits:

- lowest security and provenance risk
- no broken image references
- no official artwork concern
- no external network dependency
- no layout risk from missing thumbnails
- preserves current mobile readability work
- keeps source and view boundaries simple

Risks:

- less visual recognition for item-heavy browsing
- mobile users rely on names and taxonomy only
- future thumbnail work still requires a separate design and source decision

Required approvals:

- none

Implementation boundary:

- no implementation needed
- continue using asset name, assetClass, category, group, and snapshot stats

## 2. Add Generic CSS-only Fallback Badge Later

Decision status:

```txt
Recommended first visual step if image-like UI is desired.
```

This would add a small visual badge using CSS and existing metadata such as:

- assetClass
- category
- first letter of asset name

Benefits:

- no external image source
- no official artwork reuse
- no image file provenance issue
- no broken network image risk
- can improve scanning without adding thumbnails
- can be localized through existing text labels if needed

Risks:

- not item-specific artwork
- may be mistaken for an icon system if overdesigned
- needs careful mobile sizing and contrast checks

Required approvals:

- approval to modify view/CSS in a future scoped phase

Future implementation boundary:

- keep badge rendering generic
- use only normalized asset metadata from `MarketModel`
- do not build source-specific URLs in views
- keep CSS in `src/styles.css` or `src/themes/elf-theme.css`
- do not add image files

Suggested future phase:

```txt
V2-ASSET-D CSS-only Asset Badge Prototype
```

## 3. Add Future Elf-specific Image Mapping Inside `src/sources/elf/`

Decision status:

```txt
Allowed later only after source/provenance approval.
```

This path would add a controlled mapping such as:

```txt
src/sources/elf/elf-item-images.js
```

The source adapter would attach optional generic metadata before data reaches views:

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

Benefits:

- supports true item thumbnails
- keeps Elf-specific mapping out of views and core
- can use GitHub Pages-compatible relative paths if local assets are approved
- missing images can degrade gracefully

Risks:

- source/provenance must be audited
- local image assets can increase repository size
- public URL mappings can break or leak dependency on another source
- mobile layout can regress if thumbnails are not carefully constrained
- improper implementation could move Elf-specific logic into views or core

Required approvals:

- image source/provenance approval
- approval to add image metadata mapping
- approval to add local image files or curated public URLs, depending on chosen path
- approval to modify views and CSS for rendering

Future implementation boundary:

- Elf-specific mapping stays in `src/sources/elf/`
- `src/core/` remains generic
- views render only optional normalized `asset.image`
- missing images must show a safe fallback
- use GitHub Pages-compatible relative paths for local assets
- no official endpoint image fetch from frontend
- no external image API

Suggested future phases:

```txt
V2-ASSET-E Image Mapping Source Approval
V2-ASSET-F Asset Thumbnail UI Prototype
```

## 4. Use Official or External Artwork Only If Explicitly Approved Later

Decision status:

```txt
Not approved now.
```

Benefits:

- potentially most recognizable item visuals
- may align with official game identity if permissions are clear

Risks:

- copyright or permission risk
- official asset reuse may be disallowed
- external URLs can break
- external requests can weaken privacy and reliability
- official endpoint use could violate frontend API boundary
- artwork extraction can accidentally copy legacy or official runtime logic

Required approvals:

- explicit user approval
- source/license/provenance review
- confirmation that files or URLs are safe to expose publicly
- confirmation that no official auth, cookies, headers, or raw payloads are used

Future implementation boundary:

- no direct official Elf/Cidi frontend API calls
- no auth-required image endpoints
- no scraping
- no official logo assets unless explicitly approved
- no screenshots committed
- no legacy helper copied as a large block

## Recommended Path

Recommended order:

1. Keep text-only asset UI now.
2. If visual scanning becomes important, add generic CSS-only fallback badges.
3. Only after source/provenance approval, add Elf-specific image mapping in `src/sources/elf/`.
4. Use official or external artwork only after explicit approval and source review.

This preserves the existing architecture and avoids weakening the frontend security boundary.

## Required Future Approvals

Before any real image implementation, confirm:

- source of images or badges
- whether image files will be committed
- whether public URLs will be used
- whether official artwork is allowed
- whether fallback behavior is acceptable
- whether mobile 390px layout must be re-smoked

Do not proceed with item-specific thumbnails until these are answered.

## Future Implementation Boundary

Any future thumbnail implementation must preserve:

- `src/core/` remains generic
- Elf-specific image mapping stays in `src/sources/elf/`
- views do not construct official image URLs
- views render only optional normalized metadata
- missing image metadata degrades gracefully
- GitHub Pages-compatible relative paths
- no external image API
- no official direct frontend API calls
- no token or secret exposure
- no large legacy helper migration

## What Remains Out Of Scope

This decision does not add:

- image files
- thumbnail UI
- CSS badge UI
- official artwork
- official logo assets
- screenshots
- generated images
- external image URLs
- external image APIs
- runtime image fetching
- source adapter image mapping
- MarketModel image field
- Supabase reads or writes
- DB writes
- workflow changes
- new dependencies
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health

## Final Decision Summary

The project should remain text-only for asset visuals until there is an explicit source decision.

The first safe visual enhancement, if approved later, should be a generic CSS-only asset badge. Item-specific image mapping should wait for source/provenance approval and must stay inside the Elf source adapter boundary.
