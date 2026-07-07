# Live Refresh 403 Handoff

This document records the live token refresh failure triage result. It is documentation only and does not
change frontend runtime behavior, proxy code, database code, or deployment settings.

## 1. Failure Summary

- GitHub Pages frontend loads successfully.
- The dashboard renders a visible safe error state:
  - `Token refresh failed. Live data is unavailable.`
- A safe direct check of the Vercel refresh proxy showed:
  - `POST https://elf-market-api.vercel.app/api/refresh`
  - HTTP status: `403`
- No response body, token, refresh token, bearer token, or raw auth payload was printed or stored.

## 2. Confirmed Frontend-safe Findings

- The frontend still calls the Vercel proxy boundary only.
- The refresh endpoint configured in frontend source is:
  - `https://elf-market-api.vercel.app/api/refresh`
- The price endpoint configured in frontend source is:
  - `https://elf-market-api.vercel.app/api/price`
- `fetch()` remains isolated to `src/sources/elf/elf-api.js`.
- Views do not call APIs.
- The UI did not expose `accessToken`, `Bearer`, or `REFRESH_TOKEN`.
- Console logs were empty during the live smoke check.
- The page did not blank on refresh failure.

## 3. Failure Class

- App status kind: `token_refresh_failed`
- Network class: refresh proxy HTTP `403`
- Frontend behavior: expected safe failure handling

The frontend maps a non-2xx refresh response to `token_refresh_failed`, which is the correct current behavior.

## 4. Why This Is Likely Proxy or Upstream-side

The GitHub Pages frontend reached the configured Vercel proxy URL, and the proxy returned HTTP `403`.
That means the immediate failure is not a missing frontend file, broken relative path, JSON parser error,
view rendering issue, or MarketModel issue.

The remaining likely causes are outside the GitHub Pages frontend:

- Vercel deployment protection or access rules rejected the request before function execution.
- The `/api/refresh` function executed and returned `403`.
- A required production environment variable or secret is missing.
- The refresh secret exists only in Preview or Development, not Production.
- The refresh secret is expired, revoked, or rejected by upstream.
- The proxy code is passing an upstream `403` through to the frontend.

## 5. Manual Vercel Checks

In Vercel, inspect the project manually:

1. Open project logs and search for `/api/refresh`.
2. Determine whether the function was invoked for the failed request.
3. If no function invocation appears, inspect:
   - deployment protection
   - project access rules
   - domain or origin restrictions
   - function access settings
4. If the function was invoked, inspect safe server-side logs for:
   - missing production environment variables
   - upstream `403` or auth rejection
   - refresh route errors
5. Open project environment variables.
6. Verify required refresh secrets exist in `Production`.
7. Confirm the secret name matches the proxy code expectation.
8. If any Production env value changed, redeploy the latest Production deployment.

## 6. Do-not-expose List

Do not paste, print, commit, screenshot, or log these values:

- `REFRESH_TOKEN`
- `accessToken`
- `Bearer` token
- Vercel environment variable values
- raw auth payload
- request headers or cookies
- response body if it may include sensitive data

## 7. Recommended Next Action

Inspect Vercel logs before modifying frontend code.

The next decision should be based on whether the `403` happens before the function runs or inside the
function/upstream refresh path.

Frontend code changes are not currently required.

