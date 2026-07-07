# V2-THEME-A Elf Inspired Theme Audit

This document defines a future visual direction for an Elf Continent inspired dashboard theme. It is planning
only and does not change runtime UI, source adapters, analytics, historical storage, collector code, schedules,
or secrets.

The official Elf Continent login screen is treated only as visual inspiration for mood, color, spacing, and a
fantasy-market atmosphere. This document does not copy official artwork, use the official logo as a site asset,
commit screenshots, extract official artwork, or reuse official game images.

## 1. Current Visual State

Inspected files:

- `src/styles.css`
- `src/themes/elf-theme.css`
- `src/views/snapshot-explorer-view.js`
- `src/app/main.js`
- `docs/v2-4f-snapshot-explorer-closeout-audit.md`
- `docs/v2-3d-actor-snapshot-closeout-audit.md`
- `docs/v2-near-term-priority-note.md`
- `docs/v2-6b-historical-db-pause-handoff.md`

Current layout style:

- The dashboard is a plain HTML/CSS/JavaScript ES module app with a single centered app shell.
- Layout is dense and data-first, using panels, metric cards, compact cards, result grids, category tabs, and
  transaction rows.
- The visual hierarchy is functional: header, status strip, dashboard summary, category filters, analytics,
  Snapshot Search, selected detail, and recent transactions.

Current card system:

- Panels and cards use 8px radius, dark surfaces, muted borders, and soft shadows.
- `content-panel`, `table-panel`, `metric-card`, `compact-card`, `snapshot-detail-section`,
  `detail-metric`, and transaction rows share a consistent framed-card pattern.
- Active selected cards use a green outline and subtle inset highlight.

Current dark theme behavior:

- `src/styles.css` currently defines a cool dark base with `#0c1117`, `#111923`, `#0d141d`, and blue-gray
  borders.
- `src/themes/elf-theme.css` currently adds a small Elf accent layer:
  - green accent token
  - gold token
  - subtle body gradient
  - header border
  - green and gold text accents
  - status backgrounds
- The current theme is readable and restrained, but it still feels closer to a technical dark dashboard than a
  warm fantasy-market companion.

Current mobile behavior:

- At 920px, major grids collapse from wider desktop layouts into two columns.
- At 620px, dashboard grids, result grids, detail grids, transaction rows, and category filters collapse further.
- The latest V2-3C and V2-4 smoke notes confirmed 390px mobile usability with no horizontal overflow.
- Clear actions and utility links become full-width controls on small screens.

Current Snapshot Explorer sections:

- Snapshot Search header and helper note.
- Search input and sort select.
- Clear Search and Clear Selection utility actions.
- Assets / Actors segmented mode control.
- Result count and capped result grids.
- Selected asset or actor detail.
- Safe empty state when a selected asset or actor is unavailable in the current category/filter scope.

Current Asset / Actor detail sections:

- Asset detail includes:
  - Asset Identity / Taxonomy
  - Snapshot Asset Stats
  - Recent Loaded Transactions
  - helper note explaining that true 7D/30D history requires the paused historical database phase
- Actor detail includes:
  - Actor Identity
  - Snapshot Actor Stats
  - Loaded Main Assets
  - Loaded Counterparties
  - Recent Loaded Actor Transactions
  - helper note explaining that true 7D/30D actor history requires the paused historical database phase

## 2. Visual Inspiration Direction

Intended mood:

- Warm sunset fantasy market.
- Calm pixel-storybook dashboard.
- Readable game companion tool.
- Market intelligence interface with a soft fantasy atmosphere.
- Not a clone of the official game screen.

The future theme should feel like a practical market ledger inside a fantasy countryside setting. The interface
should remain useful for scanning values, actors, assets, filters, and recent transactions. Decorative choices
should support the mood without competing with market data.

The mood should suggest grassland, wood, parchment, leaf accents, and a warm sunset market atmosphere without
depending on official artwork or a large background image.

Suggested color direction:

- Deep warm background.
- Sunset orange accent.
- Harvest gold highlight.
- Grass green / leaf green accent.
- Wood brown panel tone.
- Parchment beige text surface.
- Muted border and divider colors.

Approximate palette candidates:

| Role | Candidate |
| --- | --- |
| Deep background | `#1f1a17` |
| Panel background | `#2a211b` |
| Warm orange | `#d88a4b` |
| Harvest gold | `#e3c06b` |
| Grass green | `#6f8b4a` |
| Leaf green | `#8cad5b` |
| Parchment beige | `#f1dfb0` |
| Wood brown | `#6b4a2f` |
| Muted text | `#c8b99a` |

These are candidates only. Future implementation should adjust values if contrast, readability, or mobile
legibility requires changes.

## 3. Theme Token Plan

Recommended approach:

- Introduce CSS variables before changing component styles.
- Keep generic layout, spacing, grid behavior, and responsive rules in `src/styles.css`.
- Keep Elf-specific fantasy-market color, mood, and visual treatment in `src/themes/elf-theme.css`.
- Avoid hardcoding repeated theme values into component selectors.
- Preserve the current 8px radius convention unless a later design pass explicitly changes it.

Suggested token groups:

- Page background
- Surface / card background
- Elevated surface
- Border
- Muted border
- Primary text
- Muted text
- Accent warm
- Accent gold
- Accent green
- Danger / warning / success
- Button background
- Button hover
- Input background
- Active card outline
- Helper note background

Possible token names:

```css
:root {
  --theme-page-bg: #1f1a17;
  --theme-surface: #2a211b;
  --theme-surface-elevated: #33271f;
  --theme-border: #6b4a2f;
  --theme-border-muted: rgb(241 223 176 / 18%);
  --theme-text: #f1dfb0;
  --theme-text-muted: #c8b99a;
  --theme-accent-warm: #d88a4b;
  --theme-accent-gold: #e3c06b;
  --theme-accent-green: #8cad5b;
  --theme-status-success: #6f8b4a;
  --theme-status-warning: #d88a4b;
  --theme-status-danger: #b85f4d;
  --theme-button-bg: #3b2b20;
  --theme-button-hover: #4a3628;
  --theme-input-bg: #241b16;
  --theme-active-outline: #8cad5b;
  --theme-helper-bg: rgb(227 192 107 / 10%);
}
```

This is a sketch for a later prototype. It should not be treated as final production CSS until contrast and
mobile smoke tests pass.

## 4. Component Theme Candidates

| Component | Low-risk visual improvement | Readability concern | Mobile concern | Boundary |
| --- | --- | --- | --- | --- |
| App shell / page background | Warm deep background with subtle sunset-to-earth gradient | Avoid low contrast around panels | No background image dependency | Elf theme-specific |
| Dashboard header | Warmer eyebrow, gold title accent, soft divider | Title must remain scannable | H1 already shrinks at mobile | Elf theme-specific |
| Refresh/status area | Use warm button tone and green/gold status surfaces | Status text must remain clear | Button remains full-width on mobile | Elf theme-specific |
| Category tabs / filters | Leaf-green active state with parchment/gold count text | Active tab must be obvious | Two-column mobile tabs must not overflow | Mostly Elf theme-specific |
| Search input | Wood-brown input surface with parchment text | Placeholder and input text need strong contrast | Keep 42px minimum height | Elf theme-specific |
| Result cards | Warmer surface and selected-card outline | Avoid decorative noise around numbers | Cards already collapse responsively | Surface in theme, grid generic |
| Active selected cards | Leaf-green outline plus subtle gold marker | Selected state must not rely only on color | Marker text must wrap safely | Elf theme-specific |
| Stat cards | Parchment-like label/value contrast on dark wood panel | Values must remain more prominent than labels | Keep value wrapping with `overflow-wrap` | Surface in theme, spacing generic |
| Asset detail sections | Slightly elevated identity section and warm helper note | Taxonomy text must stay readable | Detail grids already collapse | Theme-specific colors |
| Actor detail sections | Same section hierarchy as asset detail | Main assets can be long and must wrap | Relationship grid collapses to one column | Theme-specific colors |
| Helper notes | Soft parchment/gold note background | Do not over-highlight helper copy | Avoid wide text blocks | Elf theme-specific |
| Empty states | Muted parchment text and simple border | Empty state must not look disabled if action exists | Utility links full-width on mobile | Theme-specific colors |
| Buttons | Warm wood background, orange/gold hover, clear focus state | Focus ring must remain visible | Full-width refresh on mobile preserved | Elf theme-specific |
| Recent transaction rows | Wood-brown row surface with muted dividers | Dense rows must not become ornamental | Existing mobile row collapse preserved | Surface in theme, grid generic |

## 5. Readability Rules

Guardrails:

- Data must remain easier to read than decoration.
- Do not reduce contrast below acceptable readability.
- Do not make cards too ornamental.
- Do not use busy image backgrounds behind tables, stat cards, or transaction rows.
- Do not obscure numbers.
- Preserve mobile usability at 390px width.
- Preserve no-horizontal-overflow behavior.
- Do not introduce a large background image dependency.
- Do not load external fonts unless explicitly approved later.
- Fantasy styling should be subtle and functional.
- Keep labels concise and snapshot-safe.
- Avoid styling that implies historical data before historical data exists.
- Preserve clear focus and hover states for keyboard and pointer use.

## 6. Architecture Boundary

Theme work must not affect:

- `MarketModel`
- source adapter
- normalizers
- analytics
- collector scripts
- Supabase
- Vercel proxy
- historical database
- API calls
- routing behavior unless explicitly approved
- snapshot-safe labels

Theme work must stay visual and should not change the data source.

Implementation boundaries:

- Keep generic layout in `src/styles.css`.
- Keep Elf-specific fantasy-market theme values in `src/themes/elf-theme.css`.
- Do not add API calls in views.
- Do not move calculations into views.
- Do not alter source adapter behavior.
- Do not add historical UI before historical data exists.

## 7. Recommended Implementation Phases

1. V2-THEME-B Theme Tokens Prototype
   - Add CSS variables only.
   - No layout rewrite.
   - No data changes.
   - No image assets.

2. V2-THEME-C Snapshot Explorer Theme Pass
   - Apply warm fantasy theme to the mounted Snapshot Explorer.
   - Keep existing layout and labels.
   - No new features.
   - Keep search and detail views snapshot-only.

3. V2-THEME-D Mobile Readability Smoke
   - Verify 390px viewport.
   - Verify no horizontal overflow.
   - Verify stat cards remain readable.
   - Verify transaction rows and detail rows still wrap safely.

4. V2-THEME-E Optional Asset Thumbnail Visual Integration
   - Only after V2-2D.1 Asset Image Source Audit.
   - No official endpoint image fetch.
   - No official artwork reuse.
   - Keep missing-image behavior safe.

## 8. Non-goals

- No official artwork reuse.
- No screenshot committed.
- No official logo asset.
- No image generation committed.
- No generated image files committed.
- No external image API.
- No official Elf/Cidi direct frontend API calls.
- No Supabase reads or writes.
- No DB write test.
- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No 7D / 30D UI.
- No charts.
- No new analytics.
- No MPS implementation.
- No TTS/TTP implementation.
- No Alerts implementation.
- No Watchlist implementation.
- No Market Health implementation.
- No Pi SDK.
- No login.
- No payment.
- No identity features.

## 9. Recommended Priority

Recommendation:

- V2-THEME-A can proceed now because it is documentation only.
- V2-4G Snapshot Search Scope Label Refinement can proceed after this to clarify search scope.
- V2-2D.1 Asset Image Source Audit should happen before any image UI or thumbnail work.
- V2-I18N-A Translation Coverage Audit can proceed independently because it is also documentation-first.
- V2-6B.5 One-item DB Write Test should wait until `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are safely
  configured in local/Codex secret env.

Suggested near-term order:

1. V2-THEME-A Elf Inspired Theme Audit
2. V2-4G Snapshot Search Scope Label Refinement
3. V2-2D.1 Asset Image Source Audit
4. V2-I18N-A Translation Coverage Audit
5. V2-THEME-B Theme Tokens Prototype
6. V2-2D.2 Asset Thumbnail UI only after image source audit
7. V2-6B.5 One-item DB Write Test only when secrets are ready
