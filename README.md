# Market Intelligence Dashboard BETA 1.0.0

Reusable market intelligence dashboard foundation built with plain HTML, CSS, and JavaScript ES modules.

This repository is a reusable market intelligence dashboard for Elf Continent marketplace data.
The first source adapter is for Elf Continent marketplace-shaped data, but the core uses neutral market terms:

- asset
- actor
- transaction
- value
- currency
- market model
- market signal

## Current Status

The BETA 1.0.0 foundation has evolved into a GitHub Pages-compatible loaded snapshot dashboard with:

- generic `src/core/` market model and analytics boundaries
- Elf-specific source adapter code under `src/sources/elf/`
- snapshot explorer, asset/actor snapshot details, and recent transaction views
- static local i18n dictionaries for `en`, `zh-Hant`, `ja`, `ko`, and `vi`
- Elf-inspired CSS theme tokens and generic CSS-only asset badges
- local static preview support through `scripts/serve-static.mjs`

Current phase map and handoff notes live in:

```txt
docs/index.md
```

Live API/proxy work and historical DB writes remain paused until explicitly resumed.

## Current Scope

BETA 1.0.0 was the original architecture foundation.

Foundation included:

- thin `index.html`
- GitHub Pages-compatible relative paths
- reusable `src/core/` model and analytics modules
- Elf source adapter placeholder under `src/sources/elf/`
- mock normalized market transactions
- dashboard and recent transaction views rendered from `MarketModel`
- loading, updated, and error status states

Still intentionally out of active scope unless explicitly approved:

- frontend tokens or secrets
- direct official Elf/Cidi frontend API calls
- MPS
- TTS/TTP
- alerts
- watchlist
- market health
- historical 7D/30D charts
- network maps
- cloud database
- scheduled collector

## Local Use

Serve this folder with the local static preview workflow:

```txt
node scripts/serve-static.mjs .
```

Default preview URL:

```txt
http://127.0.0.1:4173/
```

No build step is required.

## Audit Checklist

Use `CHECKLIST.md` for BETA 1.0.1 architecture audits and GitHub Pages smoke checks.
