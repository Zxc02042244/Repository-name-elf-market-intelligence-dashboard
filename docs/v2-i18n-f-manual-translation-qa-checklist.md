# V2-I18N-F Manual Translation QA Checklist

## 1. Purpose

V2-I18N-E wired major visible dashboard UI labels to the local static i18n helper.

Automated browser and mobile smoke was not completed because the local static server was not reachable in the current environment and direct `file://` navigation was blocked by browser policy.

This checklist is for manual verification only. It should be used on the live GitHub Pages site or a local preview.

## 2. Test URL

Use the current GitHub Pages dashboard URL:

```txt
https://zxc02042244.github.io/Repository-name-elf-market-intelligence-dashboard/
```

Live API may show `token_refresh_failed` because proxy origin work is paused or unavailable. That is acceptable for this QA pass.

The goal of this checklist is UI and i18n verification, not live API verification.

## 3. Locales To Check

Check these locales from the language selector:

- English
- 繁體中文
- 日本語
- 한국어
- Tiếng Việt

For each locale, verify:

- language select changes visible UI labels
- selected language persists after reload
- unsupported or source-provided data remains unchanged where intended

## 4. Main UI Areas To Check

Verify each area renders readable translated labels:

- App header / title
- subtitle / description
- Refresh button
- status strip
- metric cards
- Model Snapshot
- Asset Coverage
- Category Filters
- Market Activity Summary
- Snapshot Explorer search area
- result counts
- capped result note
- Clear Search
- Clear Selection
- asset detail labels
- actor detail labels
- Recent Loaded Transactions
- Transactions view labels
- Signals placeholder labels

## 5. Terms That Should Not Translate

Confirm these remain unchanged:

- actor names
- asset names
- item IDs
- transaction IDs
- currency codes like `SIGIL`
- route keys
- raw technical status kinds
- source IDs
- API strings
- environment variable names

## 6. Mobile Checks

Check on:

- 390px width if possible
- iPhone Safari or Chrome if possible
- desktop responsive mode if possible

Verify:

- no horizontal overflow
- language select fits
- translated labels do not break cards
- metric cards remain readable
- search input remains usable
- result cards remain readable
- asset detail sections remain readable
- actor detail sections remain readable
- transaction rows wrap safely

## 7. Known Acceptable Issues

These are acceptable during this QA phase:

- live API may show `token_refresh_failed` due to proxy origin allowlist or paused proxy work
- source data names are intentionally not translated
- historical 7D/30D search is intentionally unavailable
- some very long labels may wrap, but they should not overflow

## 8. Failure Criteria

Mark as an issue if any of these occur:

- page fails to load
- language select does not change labels
- selected locale does not persist
- major UI area remains English in a non-English locale
- horizontal overflow appears on mobile
- console shows `ReferenceError`
- buttons stop working
- search, Clear Search, or Clear Selection breaks

## 9. Recommended Follow-up

If issues are found, create `V2-I18N-G Targeted Translation Polish`.

Follow-up fixes should stay small and scoped:

- do not add external translation API
- do not add runtime translation service
- do not add DB-backed translation
- do not change data flow
- do not change MarketModel shape
- do not add API calls in views
