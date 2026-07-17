# ELF Project Documentation Governance Index

```text
Status: ACTIVE
Last verified: 2026-07-16
Baseline verified against: 93174cabe6deabe7c1aa84c622f901c45ebf8311
```

This is the single governance index for all 47 files under `docs/`.
The classification inventory records each document as it existed at the verified
baseline. The pre-governance version of this index was classified as
`SUPERSEDED`; this rewritten file is now the active governance entry point while
retaining that baseline classification record so the approved totals remain
auditable.

Classification totals:

| Status | Files |
| --- | ---: |
| ACTIVE | 7 |
| HISTORICAL | 30 |
| SUPERSEDED | 10 |
| UNCERTAIN | 0 |
| **Total** | **47** |

Authority levels:

| Level | Meaning |
| --- | --- |
| L1 | Current runtime, registered migration, or verified production state |
| L2 | Active specification, runbook, or maintenance guide |
| L3 | Historical audit, closeout, implementation record, or decision evidence |
| L4 | Superseded; must not be used as current operational instructions |
| Draft | Undeployed proposal requiring separate review and explicit authorization |

## 1. Current runtime and authority order

### Current baseline

- Architecture: no bundler; HTML, CSS, and native ES modules are served directly.
- Dependency state: unused Fontsource packages have been removed. The only
  project development dependency is Playwright, as recorded by
  [`package.json`](../package.json) and [`pnpm-lock.yaml`](../pnpm-lock.yaml).
- Market authority:
  [`src/features/market/README.md`](../src/features/market/README.md).
- Skins authority:
  [`src/features/skins/README.md`](../src/features/skins/README.md).
- Browser storage key authority:
  [`src/config/product-config.js`](../src/config/product-config.js).
- Current browser storage keys cover locale, local wishlist, the committed
  anonymous visitor ID/token pair, and a short-lived pending replacement
  credential used only after an exact machine-readable rejection.
- Test inventory: 87 Node test cases plus 23 Playwright test cases, for 110
  total.
- Active workflow: the skin supply snapshot workflow runs once per hour.
- Historical market collector: the existing collector remains a dry-run
  skeleton and performs zero historical database writes.

### Authority order

When sources disagree, use this order:

```text
verified production state
> latest registered migration
> migration tests
> supabase/schema.sql reference
> historical documents
> SQL drafts
```

Mandatory interpretation rules:

- [`supabase/schema.sql`](../supabase/schema.sql) is a reference schema. It must
  not override a newer registered migration or a verified production ACL.
- Do not reapply `schema.sql` to "fix" production permissions.
- `SUPERSEDED` documents must not be used as current operational instructions.
- `HISTORICAL` documents preserve evidence from a specific commit or completed
  phase; statements written as current or pending must be read in that context.
- Draft SQL requires a fresh review, isolated tests, explicit authorization,
  and promotion to a registered migration before deployment.
- A proposed path that was never created is not automatically a broken current
  reference. Check the document status and wording first.

## 2. ACTIVE maintenance guides

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`card-frame-layout-spec.md`](./card-frame-layout-spec.md) | ACTIVE | Fixed 1041×1511 card-frame geometry, plaques, layers, and export rules | L2 | Current frame asset, unified frame CSS, and Playwright frame tests | 2026-07-16 | Layout changes must remain synchronized with the runtime asset and CSS coordinates. |
| [`elf-skin-self-edit-guide.md`](./elf-skin-self-edit-guide.md) | ACTIVE | Skin gallery maintenance, data sources, local state, Supabase boundary, and visual checks | L2 | Current skins feature, product config, migrations, workflow, and tests | 2026-07-16 | Follow its production-state-first authority order; do not use `supabase/schema.sql` to override registered migrations or verified ACL. |
| [`local-static-preview-workflow.md`](./local-static-preview-workflow.md) | ACTIVE | GitHub Pages-compatible local static preview without a bundler | L2 | `package.json`, `scripts/serve-static.mjs`, current runtime, and current tests | 2026-07-16 | Clearing all localStorage is not a harmless first-line debugging step; preserve visitor credentials unless their recovery impact is understood. |

## 3. Security / Supabase / ACL

Registered migrations:

1. [`20260714141341_skin_gallery_security_hardening.sql`](../supabase/migrations/20260714141341_skin_gallery_security_hardening.sql)
   - Hardens gallery tables and RPC function bodies.
   - Adds paired visitor-token hashing and protects the supply write boundary.
2. [`20260715165129_harden_public_rpc_privileges.sql`](../supabase/migrations/20260715165129_harden_public_rpc_privileges.sql)
   - Repairs effective function ACLs and future default function privileges.
   - Is permission-only and does not replace application function bodies.

Verified production ACL baseline:

- Browser RPC execution is granted only to `anon`.
- `authenticated` has no ELF RPC `EXECUTE`.
- `sync_skin_supply_snapshot(jsonb)` is executable only by `service_role`
  besides the function owner.
- `rls_auto_enable()` has no `PUBLIC`, `anon`, or `authenticated` `EXECUTE`.
- Browser code uses a publishable key and must never receive a service-role or
  secret key.

Verification authorities:

- [`harden_public_rpc_privileges_test.sql`](../supabase/tests/harden_public_rpc_privileges_test.sql)
- [`skin-community-security.test.js`](../tests/skin-community-security.test.js)
- [`supabase/README.md`](../supabase/README.md)

Security warning:

`supabase/schema.sql` still serves as a rebuild/reference document and can
contain definitions that reflect an earlier stage of ACL evolution. Production
ACL conclusions must follow the registered privilege migration and verified
production result, not a blind schema replay.

## 4. DRAFT ONLY SQL

These two files are part of the approved `ACTIVE` inventory because they remain
maintained security references. Their authority level is nevertheless `Draft`,
and neither file is a migration.

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`sql-drafts/enforce-strict-gallery-visitor-tokens.sql`](./sql-drafts/enforce-strict-gallery-visitor-tokens.sql) | ACTIVE — DRAFT ONLY | Proposed strict visitor-token function replacement that refuses null-hash visitor adoption | Draft | Current production function bodies, registered migrations, and the isolated draft test | 2026-07-16 | Not a migration. Do not apply until legacy-client behavior and null-hash handling receive a new review and explicit approval. |
| [`sql-drafts/rollback-harden-public-rpc-privileges.sql`](./sql-drafts/rollback-harden-public-rpc-privileges.sql) | ACTIVE — DRAFT ONLY | Full rollback reference for the public RPC privilege migration | Draft | Current verified ACL and the registered privilege migration | 2026-07-16 | Not a migration and must not be applied automatically. It restores known-risk `PUBLIC EXECUTE` behavior. |

Related isolated draft tests:

- [`draft_enforce_strict_gallery_visitor_tokens_test.sql`](../supabase/tests/draft_enforce_strict_gallery_visitor_tokens_test.sql)
- [`draft_rollback_harden_public_rpc_privileges_test.sql`](../supabase/tests/draft_rollback_harden_public_rpc_privileges_test.sql)

## 5. Market indicator specifications

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`mps-market-pattern-score-spec.md`](./mps-market-pattern-score-spec.md) | ACTIVE — DRAFT ONLY | MPS/MPI concepts, component boundaries, interpretability, and safe display language | L2 / Draft | Current market indicator catalog and market feature boundary | 2026-07-16 | No score or policy is deployed. Current runtime status is documented / policy pending only. |
| [`tts-two-step-transfer-spec.md`](./tts-two-step-transfer-spec.md) | ACTIVE — DRAFT ONLY | Two-Step Transfer confidence concept, candidate factors, and non-accusatory wording | L2 / Draft | Current market indicator catalog and market feature boundary | 2026-07-16 | No TTS score, candidate engine, or enforcement behavior is deployed. |

## 6. HISTORICAL documents

All documents in this section are retained as evidence. They are not current
implementation instructions.

### Market / Snapshot Explorer track

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`v2-3a-actor-analysis-information-audit.md`](./v2-3a-actor-analysis-information-audit.md) | HISTORICAL | Actor information architecture audit for the former loaded-snapshot UI | L3 | Current market modules and market tests | 2026-07-16 | References former `src/views` and Snapshot Explorer paths. |
| [`v2-3d-actor-snapshot-closeout-audit.md`](./v2-3d-actor-snapshot-closeout-audit.md) | HISTORICAL | Actor snapshot refinement closeout | L3 | Current market modules and market tests | 2026-07-16 | Records a completed phase whose renderer was later removed. |
| [`v2-4a-asset-analysis-information-audit.md`](./v2-4a-asset-analysis-information-audit.md) | HISTORICAL | Asset analysis snapshot-versus-history boundary | L3 | Current market asset module and market tests | 2026-07-16 | Old paths and recommendations do not describe the active module structure. |
| [`v2-4d-snapshot-explorer-search-selection-audit.md`](./v2-4d-snapshot-explorer-search-selection-audit.md) | HISTORICAL | Snapshot Explorer search and selection audit | L3 | Current market feature boundary | 2026-07-16 | `snapshot-details.js` and the former explorer renderer no longer exist. |
| [`v2-4f-snapshot-explorer-closeout-audit.md`](./v2-4f-snapshot-explorer-closeout-audit.md) | HISTORICAL | Snapshot Explorer closeout evidence | L3 | Current market modules and lifecycle tests | 2026-07-16 | Do not reconnect the removed all-in-one renderer. |
| [`v2-search-a-search-scope-wording-audit.md`](./v2-search-a-search-scope-wording-audit.md) | HISTORICAL | Loaded-snapshot search wording audit | L3 | Current market feature and translations | 2026-07-16 | Search behavior described here belongs to the removed Snapshot Explorer. |

### Historical storage track

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`legacy-reference-checklist.md`](./legacy-reference-checklist.md) | HISTORICAL | Sanitized lessons from the legacy marketplace project | L3 | Current market/skin boundaries and the private archive | 2026-07-16 | `marketplace-resources-site` has moved outside the repository to a private archive. Do not restore its old auth/token flow. |
| [`v2-6a-historical-storage-design.md`](./v2-6a-historical-storage-design.md) | HISTORICAL | Original historical storage schema, dedupe, cadence, and read-API design | L3 | Current schema, migrations, scripts, and Supabase README | 2026-07-16 | Proposed SQL and env lists do not override current schema or production state. |
| [`v2-6b-historical-readiness-audit.md`](./v2-6b-historical-readiness-audit.md) | HISTORICAL | Historical implementation readiness checkpoint | L3 | Current schema, migrations, scripts, and workflow inventory | 2026-07-16 | Its statement that no workflow directory exists is no longer true. |
| [`v2-6b-manual-collector-prototype-design.md`](./v2-6b-manual-collector-prototype-design.md) | HISTORICAL | Manual historical collector prototype design | L3 | Current dry-run collector scripts and Supabase boundary | 2026-07-16 | Some proposed paths were later created under different names; the collector remains dry-run only. |

### I18N track

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`v2-i18n-a-translation-coverage-audit.md`](./v2-i18n-a-translation-coverage-audit.md) | HISTORICAL | Pre-i18n visible-text inventory and key proposal | L3 | Current translations, locale config, views, and tests | 2026-07-16 | It predates the active five-locale implementation and private legacy archive. |
| [`v2-i18n-b-translation-dictionary-skeleton.md`](./v2-i18n-b-translation-dictionary-skeleton.md) | HISTORICAL | Static dictionary/helper skeleton implementation record | L3 | Current `src/i18n` modules and tests | 2026-07-16 | Later phases expanded and rewired the dictionary. |
| [`v2-i18n-c-snapshot-explorer-wiring.md`](./v2-i18n-c-snapshot-explorer-wiring.md) | HISTORICAL | Initial Snapshot Explorer translation wiring | L3 | Current feature views and translations | 2026-07-16 | The referenced Snapshot Explorer renderer was removed. |
| [`v2-i18n-d-language-switch-persistence.md`](./v2-i18n-d-language-switch-persistence.md) | HISTORICAL | Locale switch and persistence implementation record | L3 | Current product config, app runtime, and tests | 2026-07-16 | Locale persistence remains, but it is not the only current localStorage key. |
| [`v2-i18n-e-full-visible-ui-translation-wiring.md`](./v2-i18n-e-full-visible-ui-translation-wiring.md) | HISTORICAL | Former dashboard-wide i18n wiring record | L3 | Current translations and feature views | 2026-07-16 | File lists and UI areas describe an earlier architecture. |
| [`v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md`](./v2-i18n-h-manual-browser-mobile-locale-qa-closeout.md) | HISTORICAL | Locale QA closeout that recorded unavailable browser automation | L3 | Current Node and Playwright tests | 2026-07-16 | Preserve the original blocked result; do not reinterpret it as current QA status. |

### Theme / mobile track

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`v2-theme-a-elf-inspired-theme-audit.md`](./v2-theme-a-elf-inspired-theme-audit.md) | HISTORICAL | Initial warm fantasy-market visual direction | L3 | Current theme, modular CSS, assets, and Playwright | 2026-07-16 | Predates forest backgrounds, the unified card frame, and current skin UI. |
| [`v2-theme-b-theme-tokens-prototype.md`](./v2-theme-b-theme-tokens-prototype.md) | HISTORICAL | Theme token prototype implementation record | L3 | Current tokens and theme CSS | 2026-07-16 | Later CSS work may have changed individual values and component ownership. |
| [`v2-theme-c-snapshot-explorer-theme-pass.md`](./v2-theme-c-snapshot-explorer-theme-pass.md) | HISTORICAL | Snapshot Explorer theme pass | L3 | Current feature styles and theme | 2026-07-16 | Applies to a renderer that is no longer active. |
| [`v2-theme-d-mobile-readability-smoke.md`](./v2-theme-d-mobile-readability-smoke.md) | HISTORICAL | Static/render mobile readability smoke record | L3 | Current responsive Playwright tests | 2026-07-16 | Browser visual verification was unavailable in that phase. |
| [`v2-theme-e-post-i18n-390px-readability-css-pass.md`](./v2-theme-e-post-i18n-390px-readability-css-pass.md) | HISTORICAL | Post-i18n narrow-screen CSS pass | L3 | Current modular CSS and responsive Playwright tests | 2026-07-16 | Describes an earlier single-file CSS ownership model. |

### Asset image / provenance track

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`v2-2d1-asset-image-source-audit.md`](./v2-2d1-asset-image-source-audit.md) | HISTORICAL | Initial market-item image source and provenance audit | L3 | Current market/skin boundaries, assets, and retained exports | 2026-07-16 | Its no-image inventory is no longer globally true. |
| [`v2-asset-b-asset-image-source-follow-up-audit.md`](./v2-asset-b-asset-image-source-follow-up-audit.md) | HISTORICAL | Follow-up review of image fields, paths, and rendering boundaries | L3 | Current market/skin code and assets | 2026-07-16 | The former text-only baseline and single-storage-key statement are historical. |
| [`v2-asset-c-image-source-decision.md`](./v2-asset-c-image-source-decision.md) | HISTORICAL | Decision to keep former market-item UI text-first pending provenance | L3 | Current market/skin feature boundaries and current assets | 2026-07-16 | Do not reinterpret this as a ban on current skin images, backgrounds, frame assets, or retained exports. |

### QA / deployment track

| Document | Status | Topic / responsibility | Authority | Current authority | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`v2-closeout-a-near-term-safe-work-closeout.md`](./v2-closeout-a-near-term-safe-work-closeout.md) | HISTORICAL | Safe-work phase closeout and then-pending QA summary | L3 | Verified repository baseline, feature boundaries, and tests | 2026-07-16 | Recommended next phases and the only-storage-key statement are no longer current. |
| [`v2-docs-b-encoding-legacy-doc-cleanup-audit.md`](./v2-docs-b-encoding-legacy-doc-cleanup-audit.md) | HISTORICAL | Documentation encoding and stale-baseline audit | L3 | Current repository state and this governance index | 2026-07-16 | Several root documents discussed here were later deliberately deleted. |
| [`v2-docs-c-targeted-documentation-cleanup.md`](./v2-docs-c-targeted-documentation-cleanup.md) | HISTORICAL | Prior index/README cleanup record | L3 | Current repository state and this governance index | 2026-07-16 | The README updated in that phase was later deleted. |
| [`v2-qa-b-live-pages-deployment-smoke-closeout.md`](./v2-qa-b-live-pages-deployment-smoke-closeout.md) | HISTORICAL | Pages deployment smoke at a specific baseline | L3 | Current Pages deployment and current tests | 2026-07-16 | Successful results apply to the recorded commit, not automatically to current production. |
| [`v2-qa-c-manual-browser-mobile-interactive-smoke-result-backfill.md`](./v2-qa-c-manual-browser-mobile-interactive-smoke-result-backfill.md) | HISTORICAL | Browser/mobile smoke backfill for the former dashboard | L3 | Current responsive Playwright tests and current Pages smoke | 2026-07-16 | UI elements and API failure expectations describe the former dashboard. |
| [`v2-qa-e-product-polish-manual-evidence-capture.md`](./v2-qa-e-product-polish-manual-evidence-capture.md) | HISTORICAL | Manual screenshot observations and product-polish recommendations | L3 | Current skin/market UI and responsive tests | 2026-07-16 | The evidence screenshot represented an earlier UI and was not committed. |

## 7. SUPERSEDED — DO NOT USE AS CURRENT INSTRUCTIONS

The following inventory records the approved baseline classification. The
`index.md` row describes the pre-governance version replaced by this active
rewrite.

| Document | Status | Topic / responsibility | Authority | Superseded by | Last verified | Reading warning |
| --- | --- | --- | --- | --- | --- | --- |
| [`codex-operation-dm.md`](./codex-operation-dm.md) | SUPERSEDED | Old live-first market/API operating instructions | L4 | Current market feature README, market lifecycle Core, and tests | 2026-07-16 | DO NOT USE. It references removed proxy adapters and could reintroduce obsolete token/API behavior. |
| [`index.md`](./index.md) | SUPERSEDED — baseline version | Previous documentation phase map | L4 | This ACTIVE governance rewrite | 2026-07-16 | This row preserves the baseline classification only; the current file content is the active index. |
| [`live-refresh-403-handoff.md`](./live-refresh-403-handoff.md) | SUPERSEDED | Vercel refresh-proxy 403 incident handoff | L4 | Reserved market source boundary and current market Core | 2026-07-16 | DO NOT USE as a current repair runbook. Preserve only as incident evidence. |
| [`v2-6b-historical-db-pause-handoff.md`](./v2-6b-historical-db-pause-handoff.md) | SUPERSEDED | Former exact resume point for historical DB work | L4 | Current schema, registered migrations, dry-run collector scripts, and current workflow inventory | 2026-07-16 | DO NOT follow its resume sequence without a new audit and explicit authorization. |
| [`v2-i18n-f-manual-translation-qa-checklist.md`](./v2-i18n-f-manual-translation-qa-checklist.md) | SUPERSEDED | Manual translation QA for the former Snapshot Explorer dashboard | L4 | Current skin/market views, translations, and Playwright tests | 2026-07-16 | Checklist labels and failure expectations do not cover the current UI. |
| [`v2-near-term-priority-note.md`](./v2-near-term-priority-note.md) | SUPERSEDED | Former ordered task plan | L4 | Verified repository baseline and current governance index | 2026-07-16 | Most listed phases are complete or no longer apply. |
| [`v2-product-a-product-polish-priority-triage.md`](./v2-product-a-product-polish-priority-triage.md) | SUPERSEDED | Former product-polish priorities | L4 | Current skin/market UI and tests | 2026-07-16 | Based on the removed Snapshot Explorer and older storage assumptions. |
| [`v2-product-polish-discussion-note.md`](./v2-product-polish-discussion-note.md) | SUPERSEDED | Former search/image/i18n product discussion | L4 | Completed later phases and current feature boundaries | 2026-07-16 | Do not restart its proposed phases without checking current implementation. |
| [`v2-qa-a-live-manual-browser-mobile-smoke-checklist.md`](./v2-qa-a-live-manual-browser-mobile-smoke-checklist.md) | SUPERSEDED | Former dashboard manual smoke checklist | L4 | Current `package.json` scripts, Node tests, Playwright tests, and active maintenance guides | 2026-07-16 | Does not cover the current skin gallery and modular market runtime. |
| [`v2-qa-d-current-baseline-regression-checklist.md`](./v2-qa-d-current-baseline-regression-checklist.md) | SUPERSEDED | Former reusable regression checklist | L4 | Current Node/Playwright suites and current feature boundaries | 2026-07-16 | Its API, UI, storage, and asset baseline is obsolete. |

## 8. External retained artifacts

### Private legacy archive

- `marketplace-resources-site` has been moved outside the repository and
  OneDrive project working tree to a private archive.
- It no longer exists in the working tree.
- Historical documents may still mention the former path; those references are
  evidence, not instructions to restore it.
- Do not execute archived workflows or collectors.

### Retained exports

`exports/` contains two reviewed images. Both are `KEEP`:

- [`elf-skin-mobile-home-mockup.png`](../exports/elf-skin-mobile-home-mockup.png)
- [`elf-skins-iphone.png`](../exports/elf-skins-iphone.png)

Their current GitHub Pages fixed URLs must remain available:

- [Mobile home mockup](https://zxc02042244.github.io/Repository-name-elf-market-intelligence-dashboard/exports/elf-skin-mobile-home-mockup.png)
- [iPhone skin group photo](https://zxc02042244.github.io/Repository-name-elf-market-intelligence-dashboard/exports/elf-skins-iphone.png)

Do not modify, move, recompress, rename, or delete these files as part of
documentation governance.

## 9. Current test commands and workflow

Current package commands:

```text
pnpm preview
pnpm test:market
pnpm test:skins
pnpm test:ui
```

Test inventory:

| Suite | Declarations | Scope |
| --- | ---: | --- |
| Node tests | 42 | Config/formatters, MarketModel, market lifecycle/modules, skin source, and community security |
| Playwright tests | 12 | Responsive UI, navigation, storage safety, and unified card-frame behavior |
| **Total** | **54** | Current automated declaration count |

Workflow:

- [`sync-skin-supply-snapshot.yml`](../.github/workflows/sync-skin-supply-snapshot.yml)
- Schedule: `7 * * * *` — once per hour.
- Worker uses server-side `ELF_SUPABASE_SECRET_KEY`; it must not use the public
  browser key for writes.
- Historical market collection is separate from this workflow and remains
  dry-run only:
  [`scripts/collect-elf-history.mjs`](../scripts/collect-elf-history.mjs).

## 10. Retention and deletion rules

- No document is approved for deletion by this governance phase.
- `SUPERSEDED` means "do not use as current instructions", not "safe to
  delete".
- `HISTORICAL` records may contain obsolete current-state language but remain
  evidence of audits, decisions, deployments, migrations, or QA limitations.
- Security, Supabase, migration, rollback, deployment, provenance, legacy, and
  decision records require an explicit retention review before any removal.
- Do not batch merge or rewrite historical documents merely to make their old
  statements look current.
- Do not invent missing phase documents retroactively.
- Do not restore deliberately deleted root documents solely because an old
  historical record mentions them.
- Do not treat an uncreated proposal path as a broken active link.
- Do not alter `marketplace-resources-site` archive or `exports/` during docs
  governance.
- Any future move, archive, or deletion requires a separate read-only audit,
  verified inbound-reference search, explicit approval, and a dedicated commit.
