# V2-QA-E Product Polish Manual Evidence Capture

## Purpose

This document records a manual visual evidence capture from the live GitHub Pages dashboard and turns it into product polish observations.

It is documentation only. It does not change runtime UI, CSS, data flow, API behavior, database behavior, collector behavior, or build tooling.

## Evidence Source

Manual screenshot evidence was provided by the user from the live GitHub Pages dashboard.

The screenshot itself is not committed to the repository.

Observed environment from the screenshot:

- live GitHub Pages URL loaded in Chrome
- desktop Windows viewport
- `zh-Hant` UI selected
- page was scrolled near the top of the dashboard
- live API/proxy state showed token refresh failure
- dashboard remained rendered and usable

## Files Inspected

- `docs/v2-product-a-product-polish-priority-triage.md`
- `docs/v2-qa-d-current-baseline-regression-checklist.md`
- `docs/v2-theme-e-post-i18n-390px-readability-css-pass.md`

## Current Visual Pass Findings

The screenshot confirms these visible baseline behaviors:

- GitHub Pages dashboard loads and is not a 404.
- The Elf-inspired warm dark theme is visible.
- `zh-Hant` labels render in the main dashboard shell.
- Language selector is visible.
- Refresh action is visible.
- Token refresh failure is displayed as a safe non-secret status.
- Metric cards render.
- Model Snapshot renders.
- Asset Coverage renders.
- Category Filters render.
- Market Activity Summary renders.
- Page does not appear blank.
- No token, access token, Bearer value, raw auth payload, or secret is visible in the screenshot.

## Current Visual Limitations

The screenshot also shows product polish opportunities.

## 1. Failure State Hierarchy Could Be Clearer

Current visual behavior:

- The page shows `Token refresh failed. Live data is unavailable.`
- The dashboard still displays many zero-value metric and coverage cards.
- The UI may visually read as a real zero-activity market rather than unavailable live data.

Risk:

- Users may misunderstand `0` values as actual market results.
- The failure status is visible, but the rest of the page still has normal dashboard weight.

Recommended future direction:

- In token refresh failed mode, visually prioritize the unavailable state.
- De-emphasize or annotate zero-value cards as unavailable / not loaded.
- Consider a compact "live data unavailable" state near the metrics before showing normal zero cards.

Suggested future phase:

```txt
V2-UI-A Snapshot Failure State Hierarchy Audit
```

## 2. Updated Timestamp Can Conflict With Failure State

Current visual behavior:

- The status strip shows token refresh failure.
- The same status area also shows an updated timestamp.

Risk:

- The timestamp may imply successful fresh data even when live data is unavailable.

Recommended future direction:

- Clarify whether the timestamp means last UI update, last attempted refresh, or last successful data update.
- Consider label wording such as "Last attempt" for failed refresh states.
- Avoid implying that failed live data is freshly updated.

Suggested future phase:

```txt
V2-COPY-B Refresh Status Timestamp Wording Audit
```

## 3. Header Controls Feel Visually Detached

Current visual behavior:

- Title and subtitle sit on the left.
- Language and refresh controls sit to the right with a large open gap.
- On a wide desktop viewport, the controls feel somewhat separated from the main title group.

Risk:

- The header may feel less cohesive.
- Users may scan the title first and miss the refresh/status controls.

Recommended future direction:

- Consider a more deliberate header action grouping.
- Keep the existing responsive behavior, but tighten the relationship between the title area and controls.
- Do not introduce a complex app bar or new navigation system without a separate design pass.

Suggested future phase:

```txt
V2-UI-B Header Controls Layout Polish
```

## 4. Top Viewport Shows Repeated Empty Summary Blocks

Current visual behavior:

- Top metric cards show zero values.
- Model Snapshot shows no transactions.
- Asset Coverage shows zero categories/assets.
- Market Activity Summary repeats another set of zero cards.

Risk:

- The top viewport spends significant space repeating empty values.
- The useful explanation for why data is empty is only one status strip.

Recommended future direction:

- In failed or no-data states, reduce repeated empty dashboard sections.
- Consider grouping empty-state explanation before duplicated metrics.
- Preserve existing layout for successful loaded data.

Suggested future phase:

```txt
V2-UI-C Empty Snapshot Density Audit
```

## 5. Product Context Is Clear, But Operational State Could Be Stronger

Current visual behavior:

- The page communicates "Market Intelligence Dashboard" clearly.
- The current operational state is less dominant than the normal dashboard structure.

Risk:

- A user could focus on the zero metrics instead of the paused/unavailable live data condition.

Recommended future direction:

- Make the operational state a stronger first-viewport signal when live data is unavailable.
- Keep wording neutral and non-technical.
- Do not expose endpoint, proxy, token, headers, cookies, raw auth payload, or response body.

## What Should Remain Unchanged

Do not change these as part of this evidence phase:

- data flow
- `MarketModel`
- `src/core/`
- `src/sources/elf/`
- API/proxy behavior
- Supabase or DB behavior
- scheduled collector behavior
- i18n architecture
- locale persistence key
- live API/proxy paused state

The only allowed localStorage key remains:

```txt
marketDashboard.locale
```

## Recommended Next Options

## Option 1: V2-UI-A Snapshot Failure State Hierarchy Audit

Recommended priority:

```txt
Highest.
```

Why:

- The most visible polish issue is not spacing alone.
- It is the mismatch between failed live data and normal zero-value dashboard presentation.
- This should be audited before applying CSS changes.

Scope:

- documentation or small UI wording audit first
- define how failed, empty, partial, and loaded states should differ visually
- no API work
- no DB work

## Option 2: V2-COPY-B Refresh Status Timestamp Wording Audit

Recommended priority:

```txt
Medium.
```

Why:

- Timestamp wording can confuse users during failure states.
- This can likely be fixed with small wording changes after audit.

Scope:

- inspect status labels and i18n keys
- clarify "updated" versus "last attempt"
- no layout rewrite

## Option 3: V2-UI-B Header Controls Layout Polish

Recommended priority:

```txt
Medium.
```

Why:

- Header controls are visible but feel detached on wide desktop.
- This is a focused CSS/layout polish candidate.

Scope:

- small header layout refinement only
- preserve mobile behavior
- no new navigation
- no new feature controls

## Explicit Non-goals

Do not use this evidence capture to add:

- live API/proxy implementation
- direct official Elf/Cidi frontend API calls
- frontend `REFRESH_TOKEN`
- hardcoded `accessToken`
- Supabase reads or writes
- service role key usage
- scheduled collector
- GitHub Actions workflow
- Vercel Cron
- historical 7D/30D UI
- external translation API
- runtime translation service
- external image API
- official artwork or logo assets
- screenshot files in the repository
- React, Vite, npm dependencies, Webpack, or a build system
- MPS, TTS/TTP, Alerts, Watchlist, or Market Health implementation

## Security and Architecture Boundary

This phase does not modify:

- `src/`
- `index.html`
- `scripts/`
- `supabase/`
- `.github/workflows/`
- API/proxy behavior
- DB or Supabase code
- MarketModel shape
- source adapter behavior
- runtime UI behavior

No secrets, tokens, raw auth payloads, screenshots, new dependencies, or new localStorage keys were added.

## Verdict

The screenshot is a useful product polish signal.

The page is functional and safe in a failed live-data state, but the first viewport could communicate unavailable data more clearly and reduce the visual weight of repeated zero-value dashboard sections.

Recommended next phase:

```txt
V2-UI-A Snapshot Failure State Hierarchy Audit
```

Do not jump directly into a broad layout rewrite. Start by defining the desired failed / empty / partial / loaded state hierarchy.
