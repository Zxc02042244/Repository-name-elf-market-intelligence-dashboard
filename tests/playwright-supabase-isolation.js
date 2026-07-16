import { readFileSync } from "node:fs";

const publicRuntimeConfigSource = readFileSync(
  new URL("../src/config/public-runtime-config.js", import.meta.url),
  "utf8"
);
const supabaseUrlMatch = publicRuntimeConfigSource.match(
  /\bsupabaseUrl\s*:\s*["'`]([^"'`]+)["'`]/
);

if (!supabaseUrlMatch) {
  throw new Error("Playwright Supabase isolation could not read supabaseUrl from public runtime config.");
}

export const PRODUCTION_SUPABASE_ORIGIN = new URL(supabaseUrlMatch[1]).origin;
export const SUPABASE_RPC_ALLOWLIST = Object.freeze([
  "sync_skin_gallery_state",
  "delete_skin_gallery_state",
  "get_skin_gallery_stats",
  "get_skin_supply_stats"
]);

const allowlistedRpcNames = new Set(SUPABASE_RPC_ALLOWLIST);
const corsHeaders = Object.freeze({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "apikey, authorization, content-type, x-client-info",
  "content-type": "application/json"
});

export async function installPlaywrightSupabaseIsolation(target, options = {}) {
  const state = createMockState(options);

  await target.route(`${PRODUCTION_SUPABASE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const method = request.method().toUpperCase();
    const rpcName = readRpcName(requestUrl);
    const safeAttempt = Object.freeze({
      method,
      pathname: requestUrl.pathname,
      rpcName
    });

    state.interceptedAttempts.push(safeAttempt);

    if (!rpcName || !allowlistedRpcNames.has(rpcName)) {
      state.unexpectedRequests.push(safeAttempt);
      await route.fulfill({
        status: 418,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Blocked by Playwright Supabase isolation." })
      });
      return;
    }

    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders
      });
      return;
    }

    if (method !== "POST") {
      state.unexpectedRequests.push(safeAttempt);
      await route.fulfill({
        status: 405,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Method blocked by Playwright Supabase isolation." })
      });
      return;
    }

    state.rpcAttempts.set(rpcName, (state.rpcAttempts.get(rpcName) ?? 0) + 1);
    const defaultPayload = buildRpcPayload(rpcName, request, state);
    const override = state.rpcMocks.get(rpcName);
    const payload = override
      ? await override({
        attemptNumber: state.rpcAttempts.get(rpcName),
        defaultPayload: structuredClone(defaultPayload),
        rpcName
      })
      : defaultPayload;

    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(payload ?? defaultPayload)
    });
  });

  return Object.freeze({
    productionOrigin: PRODUCTION_SUPABASE_ORIGIN,
    setRpcMock(rpcName, mockFactory) {
      if (!allowlistedRpcNames.has(rpcName)) {
        throw new Error(`Cannot configure a mock for non-allowlisted Supabase RPC: ${rpcName}`);
      }
      if (typeof mockFactory !== "function") {
        throw new TypeError(`Supabase RPC mock for ${rpcName} must be a function.`);
      }
      state.rpcMocks.set(rpcName, mockFactory);
    },
    getRpcAttemptCount(rpcName) {
      return state.rpcAttempts.get(rpcName) ?? 0;
    },
    getSummary() {
      return createSafeSummary(state);
    },
    assertSafe(assertionOptions = {}) {
      return assertIsolationSafe(state, assertionOptions);
    }
  });
}

function createMockState(options) {
  return {
    interceptedAttempts: [],
    unexpectedRequests: [],
    networkEgress: 0,
    rpcAttempts: new Map(),
    rpcMocks: new Map(),
    visitorCount: normalizePositiveInteger(options.visitorCount, 1284),
    selectedSkinIds: [],
    baseWishlistCounts: new Map([
      ["genesis-pioneer", 6],
      ["flame-runner", 5],
      ["bubble-beast", 4]
    ])
  };
}

function readRpcName(requestUrl) {
  const prefix = "/rest/v1/rpc/";
  if (!requestUrl.pathname.startsWith(prefix)) {
    return "";
  }

  return decodeURIComponent(requestUrl.pathname.slice(prefix.length)).replace(/\/+$/, "");
}

function buildRpcPayload(rpcName, request, state) {
  if (rpcName === "sync_skin_gallery_state") {
    state.selectedSkinIds = readSelectedSkinIds(request);
    return buildCommunityPayload(state);
  }

  if (rpcName === "delete_skin_gallery_state") {
    state.selectedSkinIds = [];
    return buildCommunityPayload(state);
  }

  if (rpcName === "get_skin_gallery_stats") {
    return buildCommunityPayload(state);
  }

  return {
    status: "remote",
    snapshotDate: "2026-07-16",
    skinTrends: []
  };
}

function readSelectedSkinIds(request) {
  try {
    const body = request.postDataJSON();
    return Array.isArray(body?.p_skin_ids)
      ? [...new Set(body.p_skin_ids.map((skinId) => String(skinId ?? "").trim()).filter(Boolean))].slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

function buildCommunityPayload(state) {
  const wishlistCounts = new Map(state.baseWishlistCounts);

  for (const skinId of state.selectedSkinIds) {
    wishlistCounts.set(skinId, (wishlistCounts.get(skinId) ?? 0) + 1);
  }

  return {
    visitorCount: state.visitorCount,
    wishlistLeaders: [...wishlistCounts]
      .map(([skinId, wishCount]) => ({ skinId, wishCount }))
      .sort((left, right) => right.wishCount - left.wishCount || left.skinId.localeCompare(right.skinId))
      .slice(0, 10)
  };
}

function assertIsolationSafe(state, options) {
  const requiredRpcAttempts = options.requiredRpcAttempts ?? {};
  const failures = [];

  if (state.unexpectedRequests.length > 0) {
    failures.push(`unexpected production Supabase requests: ${formatUnexpectedRequests(state.unexpectedRequests)}`);
  }

  if (state.networkEgress !== 0) {
    failures.push(`production Supabase network egress was ${state.networkEgress}, expected 0`);
  }

  for (const [rpcName, minimumAttempts] of Object.entries(requiredRpcAttempts)) {
    const actualAttempts = state.rpcAttempts.get(rpcName) ?? 0;
    if (actualAttempts < minimumAttempts) {
      failures.push(`${rpcName} mock attempts were ${actualAttempts}, expected at least ${minimumAttempts}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Playwright Supabase isolation failed: ${failures.join("; ")}`);
  }

  return createSafeSummary(state);
}

function createSafeSummary(state) {
  return Object.freeze({
    interceptedAttempts: state.interceptedAttempts.length,
    networkEgress: state.networkEgress,
    unexpectedRequests: state.unexpectedRequests.length,
    rpcAttempts: Object.fromEntries(
      SUPABASE_RPC_ALLOWLIST.map((rpcName) => [rpcName, state.rpcAttempts.get(rpcName) ?? 0])
    )
  });
}

function formatUnexpectedRequests(requests) {
  return requests
    .map(({ method, pathname }) => `${method} ${pathname}`)
    .join(", ");
}

function normalizePositiveInteger(value, fallback) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0
    ? Math.floor(normalized)
    : fallback;
}
