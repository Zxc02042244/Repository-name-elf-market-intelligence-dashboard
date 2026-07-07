# V2-QA-A Live Manual Browser/Mobile Smoke Checklist

## Purpose

This checklist is for manual live QA of the current GitHub Pages dashboard after recent i18n, theme, search wording, and asset image decision work.

Browser/mobile automation was unavailable in prior phases, so this checklist is intended for a human tester using a normal desktop browser and, if possible, a real phone browser.

This phase is documentation only. It does not add automation, dependencies, runtime code, API changes, DB reads or writes, or new UI behavior.

## Test URL

Use the live GitHub Pages dashboard:

```txt
https://zxc02042244.github.io/Repository-name-elf-market-intelligence-dashboard/
```

Important:

- Live API/proxy work is paused.
- The page may show `Token refresh failed. Live data is unavailable.`
- That API failure state is acceptable for this QA if the UI still loads and remains usable.
- The goal is browser/mobile UI verification, not live API repair.

## Tester Environment Record

Record these before testing:

```txt
Tester:
Date:
Device:
Browser:
Viewport:
Network:
Locale tested:
Result: pass / fail / blocked
Notes:
```

Recommended browsers:

- Desktop Chrome, Edge, Firefox, or Safari
- iPhone Safari or Chrome if available
- Android Chrome if available

Recommended viewport checks:

- desktop width
- tablet or medium width if available
- 430px width
- 390px width

## Locales To Check

Use the language selector to test:

- English (`en`)
- Traditional Chinese (`zh-Hant`)
- Japanese (`ja`)
- Korean (`ko`)
- Vietnamese (`vi`)

For each locale, verify:

- selected language changes visible UI labels
- selected language persists after page reload
- unsupported/source data remains unchanged where intended
- no obvious missing major labels
- no major area remains English in a non-English locale unless it is source data

## Desktop Smoke

For each supported locale, verify:

- page loads and is not a GitHub Pages 404
- no blank screen
- app header renders
- language selector renders
- refresh button renders
- status strip renders a safe state
- metric cards render or safe empty/error state renders
- Model Snapshot renders or safe empty/error state renders
- Asset Coverage renders
- Category Filters render
- Market Activity Summary renders or safe empty/error state renders
- Snapshot Explorer renders
- Search field renders
- Sort selector renders
- Assets / Actors mode switch renders
- Clear Search works when a query exists
- Clear Selection works when an asset or actor is selected
- active selected card styling is visible
- asset detail section renders when an asset is selected
- actor detail section renders when an actor is selected
- Recent Loaded Transactions section renders or safe empty state renders
- Transactions view labels render
- Signals placeholder labels render

## Mobile / Narrow Viewport Smoke

Check at:

- 390px width
- 430px width

For each supported locale, verify:

- no horizontal overflow
- no clipped page header text
- language selector fits
- refresh button fits
- status message wraps without overflow
- metric cards remain readable
- coverage cards remain readable
- category tabs fit or stack safely
- Snapshot Explorer search input is usable
- sort selector fits
- Clear Search and Clear Selection fit
- result count and capped-result note wrap safely
- result cards remain readable
- active selected card remains visible
- asset detail sections remain readable
- actor detail sections remain readable
- helper notes remain legible
- empty states remain legible
- transaction rows wrap safely
- no text overlaps nearby controls
- no card content spills outside its container

## Search / Selection Checks

Use a common asset or actor name if data is visible.

Verify:

- search is labeled as current loaded snapshot search
- search does not imply historical global search
- category/filter scope note is visible
- searching assets returns asset result cards
- switching to actors returns actor result cards
- result lists clearly show result count
- capped result note appears when applicable
- selected asset opens snapshot asset detail
- selected actor opens snapshot actor detail
- selected asset/actor can be cleared
- selected unavailable state is safe if category/filter changes

Expected search scope:

- asset search covers loaded asset name/category/assetClass/group
- actor search covers loaded actor name
- transaction rows are not directly searched
- item IDs and transaction IDs are not intentionally searched
- historical records are not searched

## Source-data Preservation Checks

Confirm these remain unchanged and are not translated:

- actor names
- asset names unless a future dictionary-backed display label is explicitly added
- item IDs
- transaction IDs
- currency codes such as `SIGIL`
- route keys
- raw technical status kinds
- source IDs
- API strings
- environment variable names

If live/mock data is visible, spot-check:

```txt
Asset name:
Actor name:
Currency code:
Transaction ID, if visible:
Item ID, if visible:
```

## Console / Browser Error Checks

Open browser developer tools if available.

Pass:

- no `ReferenceError`
- no uncaught JavaScript error that causes a blank screen
- no token or secret printed in console
- no access token string printed in console
- no raw auth payload printed in console

Acceptable for this QA:

- network errors from paused live API/proxy
- token refresh failed status shown safely in UI

Fail:

- console shows a runtime error that breaks rendering
- token-like value appears in console
- UI becomes blank after refresh or locale switch

## Status / API Failure Checks

Because live API/proxy work is paused, test the failure state safely.

Pass:

- failed refresh shows a visible safe status
- status does not expose token, request headers, response body, or raw auth payload
- dashboard remains usable after failure
- language switch still works after failure
- search and selection UI still work with available loaded/mock state or safe empty state

Fail:

- blank screen after refresh failure
- raw response body or token-like value shown to user
- frontend attempts to tell the user to expose credentials

## Pass Criteria

Mark the QA pass if:

- live page loads
- no blank screen
- language selector works for all five supported locales
- selected locale persists after reload
- desktop layout is readable
- 390px and 430px layouts have no horizontal overflow
- major labels are translated for non-English locales
- source data remains intentionally untranslated
- search / clear search / clear selection work
- asset and actor details remain readable
- safe API failure state is visible and non-sensitive
- no console `ReferenceError`

## Fail Criteria

Mark the QA fail if any of these occur:

- page is GitHub Pages 404
- page fails to render
- major runtime JavaScript error appears
- language selector does not change labels
- locale does not persist after reload
- major UI area remains English in non-English locale without reason
- mobile horizontal overflow appears
- translated labels overlap or clip important controls
- search, Clear Search, or Clear Selection breaks
- asset or actor detail cannot be cleared on mobile
- token, secret, access token, Bearer token, raw auth payload, or response body appears in UI or console

## Blocked Criteria

Mark the QA blocked if:

- live URL cannot be reached from the tester environment
- browser dev tools are unavailable for console checks
- device viewport cannot be set to 390px or 430px
- network blocks GitHub Pages entirely

When blocked, record the reason and do not treat the result as pass.

## Result Recording Template

Use this template for each locale and viewport:

```txt
Locale:
Viewport:
Browser:
Page load: pass / fail / blocked
Language switch: pass / fail / blocked
Locale persistence: pass / fail / blocked
Main UI labels: pass / fail / blocked
Snapshot Explorer: pass / fail / blocked
Asset detail: pass / fail / blocked
Actor detail: pass / fail / blocked
Transactions: pass / fail / blocked
Source-data preservation: pass / fail / blocked
Console: pass / fail / blocked
Horizontal overflow: pass / fail / blocked
Notes:
```

## Follow-up Rules

If issues are found:

- create a targeted follow-up phase
- keep fixes small and scoped
- use dictionary wording changes for translation issues
- use CSS-only fixes for wrapping/readability issues
- do not add external translation API
- do not add browser automation dependencies
- do not add npm packages
- do not change data flow
- do not change MarketModel shape
- do not add API calls in views
- do not resume live API/proxy work unless explicitly approved
- do not resume historical DB work unless explicitly approved

Suggested follow-up phase names:

- `V2-QA-B Manual Smoke Result Closeout`
- `V2-I18N-I Targeted Locale QA Fixes`
- `V2-THEME-F Mobile Readability Fixes`
- `V2-COPY-A Product Wording Polish Audit`

## Security and Architecture Boundary

This checklist must not lead testers to expose:

- `REFRESH_TOKEN`
- access tokens
- Bearer tokens
- Supabase service role keys
- Vercel env values
- raw auth payloads
- request headers
- cookies
- screenshots containing secrets

The dashboard should remain:

- GitHub Pages-compatible
- text-first for asset visuals
- loaded snapshot oriented
- source data preserving
- free of external translation/image APIs
- free of runtime DB reads/writes
