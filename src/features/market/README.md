# Market feature boundary

The market feature is intentionally independent from the skin gallery runtime.

## Active files

- market-feature.js owns market feature state and the current planned/empty view.
- market-lifecycle.js defines the only valid top-level lifecycle states and the stable safe-error contract.
- market-load-controller.js owns source coordination, request generations, validation, model creation, and state transitions.
- market-modules.js is the stable registry for overview, asset, actor, and indicator modules.
- market-module-runtime.js is the composition boundary that connects registered modules to renderers.
- data/market-data-source.js defines the contract for a future verified data adapter.
- styles/ contains only the active market shell and module styles.
- modules/overview/, modules/assets/, modules/actors/, and modules/indicators/ own their model, view, and explicit data states.
- The indicators module exposes documented TTS and MPS/MPI boundaries but deliberately calculates no scores until policies are approved.

## Core data lifecycle

The top-level Market lifecycle is limited to `planned`, `loading`, `empty`, `ready`, and
`unavailable`. `policyPending` is an Indicators module state only and must never replace the
top-level lifecycle.

- A reserved source remains `planned`; its `load()` capability is never invoked.
- Every configured-source load receives a monotonically increasing generation.
- Starting a newer load makes that generation active. Older requests may finish naturally, but
  cannot replace lifecycle, model, safe error, or active generation.
- The controller validates the source capability and the `{ transactions: [] }` payload boundary,
  runs transaction inspection, and is the only feature component that calls `buildMarketModel()`.
- A valid result with zero accepted transactions is `empty`; a valid result with accepted
  transactions and a valid model is `ready`.
- Request, capability, payload, validation, and model failures are `unavailable`, never `empty`.

Public feature state contains only a sanitized source descriptor and a stable `{ kind, message }`
safe error. Raw errors, responses, endpoints, credentials, headers, cookies, stack traces, and
adapter configuration must not enter feature state.

## State and model ownership

Only the Market Feature Core may transition the top-level lifecycle, update the active generation,
replace the safe error, or install a complete `MarketModel`. Modules are read-only consumers: they
must create independent derived arrays and objects for sorting, filtering, aggregation, or display.
They must not mutate or retain mutable references into `transactions`, `totals`, `meta`,
`assetStats`, or `actorStats`. This is a behavioral contract and does not require freezing the
model.

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
