# Local Static Preview Workflow

## Purpose

Use this workflow to preview the GitHub Pages-compatible dashboard locally without adding Vite, React, npm dependencies, a bundler, or a build step.

The server uses only Node built-in modules and serves files from the repository root.

## Command

From the repository root:

```txt
node scripts/serve-static.mjs .
```

Default URL:

```txt
http://127.0.0.1:4173/
```

Optional environment variables:

```txt
PORT=4174
HOST=127.0.0.1
```

## What To Check

- `index.html` loads.
- `src/styles.css` and the modular files under `src/styles/` load.
- `src/themes/elf-theme.css` loads.
- `src/app/main.js` loads.
- relative paths work under the local root.
- Home renders the wishlist, supply, and skins/gallery tabs.
- Market renders within the current market feature boundary or shows a safe data-source failure state.
- wishlist selection and supply information display without exposing credentials.
- `en`, `zh-Hant`, `ja`, `ko`, and `vi` can be selected without untranslated keys.
- no blank screen appears.

## Browser QA Notes

The current automated UI command from `package.json` is:

```txt
pnpm test:ui
```

The Playwright suite checks 375px, 390px, 430px, 768px, 1024px, 1440px, and 1920px widths. It also verifies the responsive boundary explicitly:

- 920px uses the mobile layout.
- 921px uses the desktop layout.

Local static preview verifies repository-relative behavior on `127.0.0.1`. GitHub Pages production smoke is a separate check of the deployed public URL, asset paths, and production-safe RPC behavior. Do not treat a local pass as proof that Pages deployment succeeded.

## Non-goals

This workflow does not add:

- npm dependencies
- Vite
- React
- Webpack
- a build step
- API/proxy changes
- Supabase schema, ACL, migration, or production changes
- scheduled collector behavior

Playwright already exists as a development dependency, but starting this preview does not install or run it. The preview also does not execute the hourly skin supply workflow or enable the historical market collector, which remains a dry-run skeleton.

## Security Boundary

Do not use this workflow to expose or print:

- tokens
- service role keys
- Vercel env values
- raw auth payloads
- cookies
- request headers

Local preview never requires a production secret. Do not paste service-role credentials, workflow secrets, visitor UUIDs, or visitor tokens into commands, URLs, screenshots, or documentation.

The current localStorage keys are defined by `src/config/product-config.js`:

```txt
marketDashboard.locale
elfSkinGallery.wishlist.v1
elfSkinGallery.visitorId.v1
elfSkinGallery.visitorToken.v1
elfSkinGallery.visitorPending.v1
```

They represent locale, local wishlist state, the committed visitor ID/token pair, and a short-lived pending replacement credential. The pending envelope exists only after the RPC returns the exact machine-readable credential rejection contract; it records whether the replacement request may have been attempted, expires after 24 hours with a five-minute clock-skew allowance, and is reused after an ambiguous network failure. A replacement that is explicitly rejected becomes terminal and is not retried on reload. `ready + attemptedAt` is also terminal for automatic initialization because it can represent a failed attempt to persist the rejected state; only an explicit wishlist action may replace it under the rotation lock. Pending credentials are never sent through the DOM, URL, logs, analytics, or cross-tab messages.

Privacy deletion enumerates the committed pair plus every pending pair whose attempt marker shows it may exist remotely. It clears browser credentials and wishlist state only after every candidate returns an explicit success or safe no-op response.

Clearing all localStorage may reset the language and wishlist, lose both committed and recoverable pending credentials, and create follow-up sync risk for legacy／NULL-hash visitors. Do not recommend clearing all localStorage as a harmless first-line debugging step; remove only the specific key whose state is being tested, after understanding the recovery impact.
