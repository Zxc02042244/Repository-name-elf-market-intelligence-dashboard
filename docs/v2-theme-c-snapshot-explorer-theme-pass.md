# V2-THEME-C Snapshot Explorer Theme Pass

## Summary

V2-THEME-C applies the existing Elf-inspired theme tokens to mounted Snapshot Explorer visual components.

This phase is CSS-only. It does not change layout structure, JavaScript behavior, data sources, routing, analytics, i18n state, API behavior, or historical database behavior.

## Files Modified

- `src/themes/elf-theme.css`

## Files Created

- `docs/v2-theme-c-snapshot-explorer-theme-pass.md`

## Visual Components Refined

The theme pass refines:

- Snapshot Explorer search area
- search input and select focus states
- language select focus state
- Clear Search / Clear Selection utility links through shared button tokens
- result cards
- active selected cards
- asset detail sections
- actor detail sections
- snapshot stat cards
- helper notes
- empty states
- recent loaded transaction rows inside detail views
- refresh and status area through existing tokenized classes

## Tokens Used

The pass uses existing V2-THEME-B tokens:

- `--theme-surface`
- `--theme-surface-elevated`
- `--theme-surface-muted`
- `--theme-border`
- `--theme-border-muted`
- `--theme-text`
- `--theme-text-strong`
- `--theme-text-muted`
- `--theme-accent-warm`
- `--theme-accent-gold`
- `--theme-accent-green`
- `--theme-button-bg`
- `--theme-button-hover`
- `--theme-input-bg`
- `--theme-active-outline`
- `--theme-helper-bg`
- `--theme-shadow`

## What Remained Unchanged

This phase preserves:

- existing Snapshot Explorer layout structure
- result counts
- capped result notes
- Clear Search behavior
- Clear Selection behavior
- active selected card behavior
- language switch behavior
- locale persistence key
- route behavior
- MarketModel data flow
- source adapter behavior
- snapshot-safe labels
- mobile responsive rules

## Readability Checks

The theme pass keeps:

- strong parchment text for stat values
- muted parchment text for labels
- visible leaf-green focus outlines
- clear active selected card contrast
- legible helper notes with low-opacity warm backgrounds
- dashed empty-state framing without adding visual noise
- transaction rows with muted dividers and wrapping-safe text

No busy background image, external font, official artwork, logo, screenshot, or generated image is added.

## Security And Architecture Boundary

This phase does not add:

- API calls
- official Elf/Cidi direct calls
- Supabase reads or writes
- DB write path
- scheduled collector
- workflow changes
- secrets or token handling
- new analytics
- 7D / 30D UI
- image assets
- external image API

No `REFRESH_TOKEN`, hardcoded `accessToken`, `Bearer` token, service role key, raw auth payload, or Vercel secret is added.

## Recommended Next Phase

Recommended next phase:

`V2-THEME-D Mobile Readability Smoke`

That phase should verify the warm theme on mobile 390px width, focusing on no horizontal overflow, readable stat cards, clear buttons/selects, and legible Snapshot Explorer detail sections.
