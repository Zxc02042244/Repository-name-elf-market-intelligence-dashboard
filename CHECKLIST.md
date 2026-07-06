# BETA 1.0.1 Foundation Checklist

Use this checklist for architecture audits and GitHub Pages smoke checks.

Do not include `marketplace-resources-site/` in audits. It is a local legacy reference risk only and must not be edited, copied, migrated, imported, or reused for this foundation.

## Architecture Audit

- [ ] `index.html` remains thin and only defines the app root, CSS links, and module script.
- [ ] CSS and JavaScript paths are GitHub Pages-compatible relative paths.
- [ ] `.nojekyll` exists at the repository root.
- [ ] No `package.json` exists for this plain HTML, CSS, and JavaScript foundation.
- [ ] Frontend source does not contain `REFRESH_TOKEN`.
- [ ] Frontend source does not hardcode `accessToken`.
- [ ] Frontend source does not contain live API calls.
- [ ] Frontend source does not call the official Elf API directly.
- [ ] `src/core/` remains generic and does not contain Elf-specific terms, item IDs, proxy endpoints, or API details.
- [ ] `src/sources/elf/` contains Elf-specific source adapter logic only.
- [ ] Views render from `MarketModel`.
- [ ] Views do not call APIs.
- [ ] Views do not normalize raw source data.
- [ ] Views do not perform major analytics calculations.

## GitHub Pages Smoke Check

- [ ] Live GitHub Pages URL loads the dashboard instead of a GitHub Pages 404.
- [ ] CSS assets load.
- [ ] JavaScript module assets load.
- [ ] Console errors are zero.
- [ ] Metric cards render.
- [ ] Recent transactions render.
- [ ] Mock data renders through the current source adapter.
- [ ] Layout remains readable on desktop and mobile widths.

## Out Of Scope

- [ ] `marketplace-resources-site/` remains excluded from audits and must not be migrated.
- [ ] No live API work is added.
- [ ] No MPS is added.
- [ ] No TTS/TTP is added.
- [ ] No Alerts are added.
- [ ] No Watchlist is added.
- [ ] No Market Health is added.
- [ ] No Player Profile is added.
- [ ] No Item Profile is added.
- [ ] No Bubble Map is added.
- [ ] No Network Graph is added.
- [ ] No Price History is added.
- [ ] No cloud database is added.
- [ ] No scheduled collector is added.
- [ ] No full legacy UI is added.
- [ ] No npm, React, Vite, bundler, or build step is added.
