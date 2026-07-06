# Market Intelligence Dashboard BETA 1.0.0

Reusable market intelligence dashboard foundation built with plain HTML, CSS, and JavaScript ES modules.

The first source adapter is for Elf Continent marketplace-shaped data, but the core uses neutral market terms:

- asset
- actor
- transaction
- value
- currency
- market model
- market signal

## Current Scope

BETA 1.0.0 is architecture and mock data only.

Included:

- thin `index.html`
- GitHub Pages-compatible relative paths
- reusable `src/core/` model and analytics modules
- Elf source adapter placeholder under `src/sources/elf/`
- mock normalized market transactions
- dashboard and recent transaction views rendered from `MarketModel`
- loading, updated, and error status states

Not included yet:

- live API calls
- tokens
- full item list
- MPS
- TTS/TTP
- alerts
- watchlist
- market health
- detail pages
- charts or network maps
- cloud database
- scheduled collector

## Local Use

Open `index.html` directly in a browser or serve this folder with any static server. No build step is required.
