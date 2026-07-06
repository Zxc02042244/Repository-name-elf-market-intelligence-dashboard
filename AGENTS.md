# AGENTS.md

## Project Identity
This repository is **Market Intelligence Dashboard BETA 1.0.0**.

The first source is **Elf Continent marketplace data**, but the core must remain reusable for future market sources.

Read the full brief before implementation:

```txt
CODEX_MARKET_INTELLIGENCE_DASHBOARD_BRIEF.md
```

## Current Milestone
BETA 1.0.0 means **clean reusable architecture foundation**.

Build the foundation first. Do not overbuild.

Required data flow:

```txt
source adapter -> raw source data -> normalize -> generic market transaction -> MarketModel -> analytics -> views
```

## Repository Root Rule
Treat the current repository root as the project root.

Do not create an extra nested `market-intelligence-dashboard/` folder unless the current directory is not already the intended project root.

Expected root files:

```txt
index.html
README.md
.nojekyll
AGENTS.md
CODEX_MARKET_INTELLIGENCE_DASHBOARD_BRIEF.md
src/
```

## Legacy ZIP Rule
The uploaded legacy website ZIP is reference material only.

Use it to understand old behavior, item names, UI ideas, and previous analytics concepts.

Do not copy the old website as one large file.

Do not migrate the old `index.html` directly.

When reusing legacy logic, extract only the useful idea and place it into the correct new module.

## Hard Architecture Rules
1. Frontend must not contain `REFRESH_TOKEN`.
2. Frontend must not hardcode `accessToken`.
3. Frontend must not call the official Elf API directly.
4. Frontend must call the existing Vercel proxy only.
5. Raw API data must be normalized before use.
6. Views must render from `MarketModel`.
7. Views must not call APIs.
8. Views must not perform major analytics calculations.
9. Elf-specific logic must stay inside `src/sources/elf/`.
10. Generic core and analytics must stay inside `src/core/`.
11. `index.html` must remain thin.
12. Do not build the full legacy UI in BETA 1.0.0.

## BETA 1.0.0 Scope
Must include:

```txt
thin index.html
src/app entry
generic core structure
Elf source adapter placeholder
mock generic market transactions
MarketModel
basic totals
basic asset stats
basic actor stats
dashboard rendering
recent transactions rendering
responsive dark UI
visible loading/error/status states
GitHub Pages-compatible relative paths
```

Must not include yet:

```txt
live API full rollout
full item list
MPS
TTS/TTP
Alerts
Watchlist
Market Health
Player Profile
Item Profile
Bubble Map
Network Graph
Price History
scheduled collector
cloud database
```

## Live API Rule
Live API work should only happen after the architecture foundation is stable and the user explicitly asks for it.

When live API is implemented, keep all Elf API logic inside `src/sources/elf/elf-api.js`.

Use only the Vercel proxy endpoints from the project brief.

Do not place tokens in source files.

## Core / Source Boundary
Generic core should use neutral market terms:

```txt
asset
actor
transaction
value
currency
market model
market signal
```

Do not put Elf-only concepts in `src/core/`.

Elf-only concepts belong in `src/sources/elf/`.

## UI Rule
Use `src/styles.css` for generic layout and `src/themes/elf-theme.css` for Elf theme styling.

Keep the UI readable before decorative.

Prefer a dark, card-based, mobile-friendly market dashboard.

Do not put large styles or templates inside `index.html`.

## Runtime / Node Rule
Node may be used for local checks, JavaScript syntax validation, helper scripts, or smoke tests.

Do not add Vite, React, npm dependencies, bundlers, or build steps unless the user explicitly asks.

BETA 1.0.0 should remain GitHub Pages-compatible with plain HTML, CSS, and JavaScript ES modules.

## Plugin Rule
Do not install or rely on extra Codex plugins for BETA 1.0.0 unless the user explicitly asks.

Future possible use:

```txt
Security plugin: before live API, token-sensitive work, or public release
MotherDuck / Metabase / Hex: future historical data, cloud database, scheduled collector, 7d / 30d trends
Figma: only when a real design file is provided
Canva / HeyGen / Remotion: future marketing images or videos
```

Finance, Education & Research, Business & Operations, and most Creativity plugins are not needed for the current build.

## Neutral Language Rule
Use neutral market-structure language.

Avoid accusation terms such as `cheater`, `scammer`, `violation`, or `alt account`.

Prefer terms such as `Market Pattern`, `High Concentration`, `Structured Trading Pattern`, `Related Accounts`, `Low-price Transfer`, `Transfer Pattern`, `Counterparty Concentration`, and `Trading Density`.

The dashboard observes market structure. It does not judge player intent or enforce rules.

## Smoke Test
Before reporting completion, verify:

```txt
Page loads
No console ReferenceError
Mock data renders
Recent transactions render
No unexpected blank screen
No live API calls in BETA 1.0.0 unless explicitly requested
Views render from MarketModel
Core does not contain Elf API details
GitHub Pages relative paths work
```

## Stop Conditions
Stop and simplify if implementation starts doing any of these:

```txt
copying the legacy site as one huge file
putting API calls in views
putting analytics in views
putting Elf API details in core
hardcoding tokens
adding MPS/TTS too early
turning main.js into a large all-in-one file
building complex UI before data flow is proven
creating a nested project folder unnecessarily
adding a build system without explicit user approval
```

## Required Report
After completing the milestone, report:

```txt
Created files
Modified files
What is generic core
What is Elf-specific adapter
What was intentionally not added
Smoke test result
Known limitations
Commit SHA after push
```
