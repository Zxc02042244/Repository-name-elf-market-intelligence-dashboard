# Market feature boundary

The market feature is intentionally independent from the skin gallery runtime.

## Active files

- market-feature.js owns market feature state and the current planned/empty view.
- market-modules.js is the stable registry for overview, asset, actor, and indicator modules.
- market-module-runtime.js is the composition boundary that connects registered modules to renderers.
- data/market-data-source.js defines the contract for a future verified data adapter.
- styles/ contains only the active market shell and module styles.
- modules/overview/, modules/assets/, modules/actors/, and modules/indicators/ own their model, view, and explicit data states.
- The indicators module exposes documented TTS and MPS/MPI boundaries but deliberately calculates no scores until policies are approved.

## Removed legacy renderers

The former snapshot dashboard renderers were removed after they had no runtime imports. Rebuild future
asset, actor, transaction, or indicator experiences as independent modules with explicit data states
instead of reconnecting the old all-in-one dashboard.

## Adding a market module

1. Add a stable entry to MARKET_MODULES.
2. Add the module model and renderer under modules/{module-id}/.
3. Connect the renderer once in market-module-runtime.js.
4. Declare its required data-source capabilities.
5. Add model and unit tests before exposing navigation.
6. Add mobile and desktop route tests.

Do not add market-specific loading, API, filtering, or fallback logic back into src/app/main.js.

## Connecting a future API

Create an adapter under data/adapters/ with defineMarketDataSource(). The adapter must expose a stable
id, capabilities, and a load() function that returns normalized market transactions. Secrets and raw
access tokens must remain outside browser source.
