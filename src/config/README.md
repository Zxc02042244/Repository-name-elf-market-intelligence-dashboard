# Runtime configuration

This directory is the single source of truth for settings shared across the
application. Keep feature logic out of these files.

## Files

- `product-config.js`: product limits, valid tabs and sorts, and browser storage keys.
- `locale-config.js`: the default locale and the supported locale list.
- `public-runtime-config.js`: public deployment endpoints and publishable client values.
- `service-config.js`: reads and normalizes public service configuration for features.
- `webawesome-loader.js`: the single pinned Web Awesome component source.

`public-runtime-config.js` is shipped to the browser. Never put private API keys,
service-role keys, passwords, or other secrets in it.

## What remains intentionally local

- CSS breakpoints stay in CSS media queries so the browser can evaluate them natively.
  The desktop/mobile boundary is protected by responsive tests at 920/921 px.
- Fixed character-card artwork coordinates stay with the card-frame feature because
  they are layout geometry, not a product-wide rule.
- Demo and fallback records stay inside their data source instead of becoming global
  configuration.

## Change checklist

1. Change the owning config or feature file once; do not copy its value into a view.
2. Give new UI states explicit loading, empty, unavailable, and ready behavior.
3. Run `pnpm run test:market` for model and configuration changes.
4. Run `pnpm run test:ui` for responsive or interaction changes.
