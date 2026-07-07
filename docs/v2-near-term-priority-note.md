# V2 Near-term Priority Note

This note records the agreed near-term order for future Codex tasks. It is documentation only and does not
change runtime UI, source adapters, historical storage, collector code, schedules, or secrets.

## Priority Order

1. V2-3D Actor / Player Snapshot Closeout Audit
2. V2-THEME-A Elf Inspired Theme Audit
3. V2-4G Snapshot Search Scope Label Refinement
4. V2-2D.1 Asset Image Source Audit
5. V2-I18N-A Translation Coverage Audit
6. V2-THEME-B Theme Tokens Prototype
7. V2-2D.2 Asset Thumbnail UI
8. V2-6B.5 One-item DB Write Test only when secrets are ready

## Why This Order

- V2-3D should close out the actor/player snapshot line before opening more UI polish work.
- V2-THEME-A is documentation only and can safely define the Elf-inspired visual direction without touching
  runtime behavior.
- V2-4G should clarify that search is current loaded snapshot search, not historical global search.
- V2-2D.1 must audit image sources before thumbnails are added.
- V2-I18N-A should audit hardcoded UI text before translation implementation.
- V2-THEME-B should prototype theme tokens only after the visual direction is documented.
- V2-2D.2 should add thumbnails only after image source safety, ownership, and mapping boundaries are clear.
- V2-6B.5 should wait until `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are safely configured in
  local/Codex secret env.

## Current Boundaries

- Historical database work remains paused at V2-6B.4A.
- No Supabase secrets should be used until V2-6B.5 is explicitly resumed.
- Current live UI remains based on the loaded `MarketModel` snapshot only.
- Search, detail views, metrics, and recent transactions should continue to avoid historical claims.
- Product polish should improve clarity without weakening architecture boundaries.

## Explicit Non-goals

- No database reads or writes.
- No scheduled collector.
- No GitHub Actions workflow.
- No Vercel Cron.
- No official direct API calls.
- No external image API.
- No translation API.
- No Pi SDK.
- No login.
- No payment.
- No identity features.
- No MPS implementation.
- No TTS/TTP implementation.
- No Alerts implementation.
- No Watchlist implementation.
- No Market Health implementation.

## Security Boundary

- Do not commit Supabase URL values.
- Do not commit service role keys.
- Do not commit secret keys.
- Do not commit screenshots containing credentials.
- Do not commit raw credentials.
- Keep frontend source free of `REFRESH_TOKEN`.
- Keep frontend source free of hardcoded `accessToken`.
- Keep privileged database credentials server-side only.
- Keep views free of API calls and major analytics calculations.

