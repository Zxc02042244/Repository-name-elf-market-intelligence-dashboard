# V2-THEME-B Theme Tokens Prototype

## Summary

V2-THEME-B introduces an Elf-inspired CSS token prototype and applies low-risk color refinements through the existing theme layer.

This phase does not change layout structure, data sources, routing, API behavior, analytics, i18n behavior, historical storage, or collector code.

## Files Modified

- `src/themes/elf-theme.css`

## Files Created

- `docs/v2-theme-b-theme-tokens-prototype.md`

## Token Groups Added Or Changed

The theme now defines CSS variables for:

- page background
- deep page background
- surface / card background
- elevated surface
- muted surface
- border
- muted border
- primary text
- strong text
- muted text
- warm orange accent
- harvest gold accent
- grass / leaf green accents
- success / warning / danger status colors
- button background
- button hover
- input background
- active card outline
- helper note background
- shared shadow

## Visual Direction Applied

The prototype shifts the dashboard from a cool technical dark theme toward a warm fantasy-market direction:

- deeper warm page background
- subtle sunset glow
- wood-brown panel surfaces
- parchment-toned text
- harvest gold highlights
- leaf-green active states
- warm button and input surfaces
- soft helper note background
- status colors aligned with green, gold, and danger tones

The treatment remains restrained so market numbers, filters, search results, and detail sections stay readable.

## What Remained Unchanged

This phase intentionally preserves:

- existing layout structure
- grid behavior
- Snapshot Explorer search UX
- language switch behavior
- category filter behavior
- refresh behavior
- MarketModel data flow
- source adapter behavior
- routing behavior
- snapshot-safe wording
- mobile responsive rules

## Readability Checks

The token pass keeps:

- dark surfaces behind data-heavy content
- strong parchment text for values
- muted parchment text for helper labels
- clear green active outlines
- visible button and select controls
- readable status strips
- helper notes on subtle backgrounds instead of busy decoration

No image background, external font, logo, screenshot, official artwork, or decorative asset is introduced.

## Security And Architecture Boundary

This phase does not add:

- Supabase reads or writes
- DB write path
- scheduled collector
- workflow changes
- API calls
- official Elf/Cidi direct calls
- token handling
- new analytics
- historical UI
- external image API
- image assets

No `REFRESH_TOKEN`, hardcoded `accessToken`, `Bearer` token, service role key, raw auth payload, or Vercel secret is added.

## Recommended Next Phase

Recommended next phase:

`V2-THEME-C Snapshot Explorer Theme Pass`

That phase can refine the mounted Snapshot Explorer component hierarchy using the token set created here, while still avoiding layout rewrites, data changes, image assets, and historical UI.
