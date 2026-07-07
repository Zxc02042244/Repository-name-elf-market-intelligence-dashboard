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
- `src/styles.css` loads.
- `src/themes/elf-theme.css` loads.
- `src/app/main.js` loads.
- relative paths work under the local root.
- dashboard renders or shows a safe live API failure state.
- no blank screen appears.

## Browser QA Notes

Use this local preview together with:

```txt
docs/v2-qa-a-live-manual-browser-mobile-smoke-checklist.md
```

Recommended viewport checks:

- desktop width
- 430px width
- 390px width

## Non-goals

This workflow does not add:

- npm dependencies
- Vite
- React
- Webpack
- a build step
- browser automation tooling
- API/proxy changes
- Supabase reads or writes
- scheduled collector behavior

## Security Boundary

Do not use this workflow to expose or print:

- tokens
- service role keys
- Vercel env values
- raw auth payloads
- cookies
- request headers

The only allowed localStorage key remains:

```txt
marketDashboard.locale
```
