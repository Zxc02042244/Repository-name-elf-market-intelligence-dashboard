# Skins feature boundary

The skins feature owns the skin gallery, wishlist, community totals, supply snapshots, and skin-facing views.

## Responsibilities

- views/ renders the wishlist, supply, gallery, responsive champion cards, and source information.
- state/ owns local wishlist persistence plus community and supply synchronization state.
- src/sources/elf/ remains the external official skin catalog adapter.
- src/app/ remains responsible for global routing, top-level rendering, and cross-feature navigation.
- src/config/ remains the only source for product limits, locale defaults, storage keys, and public services.

Skin feature files must not import market feature views or market analytics. Market and skin features may only meet at the app routing boundary.
