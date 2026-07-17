import { readFileSync } from "node:fs";
import { createHmac, randomBytes } from "node:crypto";

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

  if (typeof target.addInitScript === "function") {
    await target.addInitScript(() => {
      const traceState = {
        activeLockDepth: 0,
        lockEvents: [],
        rpcEvents: [],
        nextLockSequence: 1,
        nextRpcSequence: 1
      };
      Object.defineProperty(globalThis, "__elfIsolationTraceState", {
        value: traceState
      });

      const originalFetch = globalThis.fetch.bind(globalThis);
      globalThis.fetch = function tracedFetch(input, init) {
        try {
          const requestUrl = new URL(
            typeof input === "string" || input instanceof URL ? input : input.url,
            globalThis.location.href
          );
          const rpcPrefix = "/rest/v1/rpc/";
          if (requestUrl.pathname.startsWith(rpcPrefix)) {
            traceState.rpcEvents.push({
              sequence: traceState.nextRpcSequence,
              rpcName: decodeURIComponent(requestUrl.pathname.slice(rpcPrefix.length))
                .replace(/\/+$/, ""),
              lockAcquired: traceState.activeLockDepth > 0
            });
            traceState.nextRpcSequence += 1;
          }
        } catch {
          // Diagnostics are best effort and never alter the request.
        }
        return originalFetch(input, init);
      };

      const locks = globalThis.navigator?.locks;
      if (!locks || typeof locks.request !== "function" || locks.__elfIsolationTraced) {
        return;
      }

      const originalRequest = locks.request.bind(locks);

      Object.defineProperty(locks, "__elfIsolationTraced", {
        value: true
      });

      locks.request = function tracedLockRequest(name, optionsOrCallback, maybeCallback) {
        const hasOptions = typeof optionsOrCallback !== "function";
        const options = hasOptions ? optionsOrCallback : undefined;
        const callback = hasOptions ? maybeCallback : optionsOrCallback;

        const tracedCallback = async (lock) => {
          const lockSequence = traceState.nextLockSequence;
          traceState.nextLockSequence += 1;
          traceState.activeLockDepth += 1;
          traceState.lockEvents.push({
            sequence: lockSequence,
            event: "acquired",
            name: String(name)
          });
          try {
            return await callback(lock);
          } finally {
            traceState.lockEvents.push({
              sequence: lockSequence,
              event: "released",
              name: String(name)
            });
            traceState.activeLockDepth -= 1;
          }
        };

        return hasOptions
          ? originalRequest(name, options, tracedCallback)
          : originalRequest(name, tracedCallback);
      };
    });
  }

  await target.route(`${PRODUCTION_SUPABASE_ORIGIN}/**`, async (route) => {
    state.activeRouteHandlers += 1;
    try {
      const request = route.request();
      const requestUrl = new URL(request.url());
      const method = request.method().toUpperCase();
      const rpcName = readRpcName(requestUrl);
      const page = readRequestPage(request);
      const pageOrdinal = getPageOrdinal(state, page);
      const safeAttempt = Object.freeze({
        method,
        pathname: requestUrl.pathname,
        rpcName,
        pageOrdinal
      });

      state.interceptedAttempts.push(safeAttempt);

      if (!rpcName || !allowlistedRpcNames.has(rpcName)) {
        state.unexpectedRequests.push(safeAttempt);
        state.blockedUnexpectedRequests += 1;
        await fulfillRoute(route, {
          status: 418,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Blocked by Playwright Supabase isolation." })
        }, state);
        return;
      }

      if (method === "OPTIONS") {
        state.allowlistedPreflightRequests += 1;
        await fulfillRoute(route, {
          status: 204,
          headers: corsHeaders
        }, state);
        return;
      }

      if (method !== "POST") {
        state.unexpectedRequests.push(safeAttempt);
        state.blockedUnexpectedRequests += 1;
        await fulfillRoute(route, {
          status: 405,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Method blocked by Playwright Supabase isolation." })
        }, state);
        return;
      }

      state.allowlistedMockRequests += 1;
      state.rpcAttempts.set(rpcName, (state.rpcAttempts.get(rpcName) ?? 0) + 1);
      const attemptNumber = state.rpcAttempts.get(rpcName);
      const requestMetadata = readRpcRequestMetadata(request, state, rpcName);
      const operationSequence = state.nextOperationSequence;
      state.nextOperationSequence += 1;
      const operationEntry = {
        sequence: operationSequence,
        attemptNumber,
        method,
        rpcName,
        pageOrdinal,
        phase: state.pagePhases.get(page) ?? "unclassified",
        selectedSkinIds: Object.freeze([...requestMetadata.selectedSkinIds]),
        selectedSkinCount: requestMetadata.selectedSkinIds.length,
        visitorKey: requestMetadata.visitorKey,
        mockResponseType: "pending",
        routeFulfillmentsStarted: 0,
        routeFulfillmentsCompleted: 0,
        routeFulfillmentsFailed: 0
      };
      state.operationHistory.push(operationEntry);
      const defaultPayload = buildRpcPayload(rpcName, request, state);
      const override = state.rpcMocks.get(rpcName);
      const mockResult = override
        ? await override({
          attemptNumber,
          defaultPayload: structuredClone(defaultPayload),
          request: structuredClone(requestMetadata),
          rpcName
        })
        : defaultPayload;
      const response = normalizeMockResponse(mockResult, defaultPayload);
      operationEntry.mockResponseType = classifyMockResponse(response);

      if (response.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, response.delayMs));
      }

      if (response.networkError) {
        await route.abort("failed");
        return;
      }

      await fulfillRoute(route, {
        status: response.status,
        headers: corsHeaders,
        body: response.rawBody ?? JSON.stringify(response.json)
      }, state, operationEntry);
    } finally {
      state.activeRouteHandlers -= 1;
    }
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
    getRpcHistory(rpcName = "") {
      return state.operationHistory
        .filter((entry) => !rpcName || entry.rpcName === rpcName)
        .map((entry) => ({
          sequence: entry.sequence,
          attemptNumber: entry.attemptNumber,
          method: entry.method,
          rpcName: entry.rpcName,
          pageOrdinal: entry.pageOrdinal,
          phase: entry.phase,
          selectedSkinIds: [...entry.selectedSkinIds],
          selectedSkinCount: entry.selectedSkinCount,
          visitorKey: entry.visitorKey,
          mockResponseType: entry.mockResponseType,
          routeFulfillmentsStarted: entry.routeFulfillmentsStarted,
          routeFulfillmentsCompleted: entry.routeFulfillmentsCompleted,
          routeFulfillmentsFailed: entry.routeFulfillmentsFailed
        }));
    },
    getRouteHandlerSnapshot() {
      return createRouteHandlerSnapshot(state);
    },
    getRpcFulfillmentSnapshot(rpcName) {
      return createRpcFulfillmentSnapshot(state, rpcName);
    },
    waitForRpcHandler(rpcName, attemptNumber, waitOptions = {}) {
      return waitForRpcHandler(state, rpcName, attemptNumber, waitOptions);
    },
    waitForFulfillment(rpcName, attemptNumber, waitOptions = {}) {
      return waitForFulfillment(state, rpcName, attemptNumber, waitOptions);
    },
    setPagePhase(page, phase) {
      state.pagePhases.set(page, normalizePhase(phase));
    },
    async getLockHistory(page) {
      try {
        return await page.evaluate(() => (
          globalThis.__elfIsolationTraceState?.lockEvents?.map((entry) => ({ ...entry })) ?? []
        ));
      } catch {
        return [];
      }
    },
    async getPageRpcHistory(page) {
      try {
        return await page.evaluate(() => (
          globalThis.__elfIsolationTraceState?.rpcEvents?.map((entry) => ({ ...entry })) ?? []
        ));
      } catch {
        return [];
      }
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
    activeRouteHandlers: 0,
    routeFulfillmentsStarted: 0,
    routeFulfillmentsCompleted: 0,
    routeFulfillmentsFailed: 0,
    interceptedAttempts: [],
    unexpectedRequests: [],
    allowlistedMockRequests: 0,
    allowlistedPreflightRequests: 0,
    blockedUnexpectedRequests: 0,
    networkEgress: 0,
    operationHistory: [],
    nextOperationSequence: 1,
    rpcAttempts: new Map(),
    rpcMocks: new Map(),
    pageOrdinals: new WeakMap(),
    pagePhases: new WeakMap(),
    nextPageOrdinal: 1,
    visitorFingerprintKey: randomBytes(32),
    visitorOrdinalsByFingerprint: new Map(),
    nextVisitorKey: 1,
    visitorCount: normalizePositiveInteger(options.visitorCount, 1284),
    selectedSkinIds: [],
    baseWishlistCounts: new Map([
      ["genesis-pioneer", 6],
      ["flame-runner", 5],
      ["bubble-beast", 4]
    ])
  };
}

async function fulfillRoute(route, response, state, operationEntry = null) {
  state.routeFulfillmentsStarted += 1;
  if (operationEntry) {
    operationEntry.routeFulfillmentsStarted += 1;
  }

  try {
    await route.fulfill(response);
    state.routeFulfillmentsCompleted += 1;
    if (operationEntry) {
      operationEntry.routeFulfillmentsCompleted += 1;
    }
  } catch (error) {
    state.routeFulfillmentsFailed += 1;
    if (operationEntry) {
      operationEntry.routeFulfillmentsFailed += 1;
    }
    throw error;
  }
}

function createRouteHandlerSnapshot(state) {
  return Object.freeze({
    activeRouteHandlers: state.activeRouteHandlers,
    routeFulfillmentsStarted: state.routeFulfillmentsStarted,
    routeFulfillmentsCompleted: state.routeFulfillmentsCompleted,
    routeFulfillmentsFailed: state.routeFulfillmentsFailed
  });
}

function createRpcFulfillmentSnapshot(state, rpcName) {
  const entries = state.operationHistory.filter((entry) => entry.rpcName === rpcName);
  return Object.freeze({
    rpcPostHandlersEntered: entries.length,
    routeFulfillmentsStarted: entries.reduce(
      (total, entry) => total + entry.routeFulfillmentsStarted,
      0
    ),
    routeFulfillmentsCompleted: entries.reduce(
      (total, entry) => total + entry.routeFulfillmentsCompleted,
      0
    ),
    routeFulfillmentsFailed: entries.reduce(
      (total, entry) => total + entry.routeFulfillmentsFailed,
      0
    ),
    activeRouteHandlers: state.activeRouteHandlers
  });
}

async function waitForRpcHandler(state, rpcName, attemptNumber, options) {
  const timeoutMs = normalizeWaitTimeout(options.timeoutMs);
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const entry = findRpcOperation(state, rpcName, attemptNumber);
    if (entry && state.activeRouteHandlers > 0) {
      return createRpcOperationSnapshot(entry, state);
    }
    await waitForNextProbe();
  }

  throw createFulfillmentWaitError(state, rpcName, attemptNumber, "handler");
}

async function waitForFulfillment(state, rpcName, attemptNumber, options) {
  const timeoutMs = normalizeWaitTimeout(options.timeoutMs);
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const entry = findRpcOperation(state, rpcName, attemptNumber);
    if (entry?.routeFulfillmentsFailed > 0) {
      throw createFulfillmentWaitError(state, rpcName, attemptNumber, "failed");
    }
    if (
      entry?.routeFulfillmentsCompleted === 1
      && state.activeRouteHandlers === 0
    ) {
      return createRpcOperationSnapshot(entry, state);
    }
    await waitForNextProbe();
  }

  throw createFulfillmentWaitError(state, rpcName, attemptNumber, "completion");
}

function findRpcOperation(state, rpcName, attemptNumber) {
  return state.operationHistory.find((entry) => (
    entry.rpcName === rpcName
    && entry.attemptNumber === attemptNumber
  ));
}

function createRpcOperationSnapshot(entry, state) {
  return Object.freeze({
    method: entry.method,
    rpcName: entry.rpcName,
    attemptNumber: entry.attemptNumber,
    routeFulfillmentsStarted: entry.routeFulfillmentsStarted,
    routeFulfillmentsCompleted: entry.routeFulfillmentsCompleted,
    routeFulfillmentsFailed: entry.routeFulfillmentsFailed,
    activeRouteHandlers: state.activeRouteHandlers
  });
}

function createFulfillmentWaitError(state, rpcName, attemptNumber, phase) {
  const entry = findRpcOperation(state, rpcName, attemptNumber);
  return new Error(
    `Playwright route ${phase} wait failed: entries=${entry ? 1 : 0}, `
    + `started=${entry?.routeFulfillmentsStarted ?? 0}, `
    + `completed=${entry?.routeFulfillmentsCompleted ?? 0}, `
    + `failed=${entry?.routeFulfillmentsFailed ?? 0}, `
    + `active=${state.activeRouteHandlers}.`
  );
}

function waitForNextProbe() {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

function normalizeWaitTimeout(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0
    ? Math.min(Math.floor(normalized), 2_000)
    : 1_000;
}

function classifyMockResponse(response) {
  if (response.networkError) {
    return "network-error";
  }
  if (
    response.status === 409
    && response.json?.code === "ELF_VISITOR_CREDENTIAL_REJECTED"
  ) {
    return "credential-rejection";
  }
  if (response.status >= 400) {
    return `http-${response.status}`;
  }
  if (response.rawBody !== null) {
    return "raw-body";
  }
  return "success";
}

function readRequestPage(request) {
  try {
    return request.frame().page();
  } catch {
    return null;
  }
}

function getPageOrdinal(state, page) {
  if (!page) {
    return 0;
  }
  if (!state.pageOrdinals.has(page)) {
    state.pageOrdinals.set(page, state.nextPageOrdinal);
    state.nextPageOrdinal += 1;
  }
  return state.pageOrdinals.get(page);
}

function normalizePhase(value) {
  const phase = String(value ?? "").trim();
  return /^[a-z0-9-]{1,60}$/.test(phase) ? phase : "unclassified";
}

function normalizeMockResponse(value, defaultPayload) {
  const isDescriptor = value
    && typeof value === "object"
    && ["status", "json", "rawBody", "networkError", "delayMs"]
      .some((key) => Object.prototype.hasOwnProperty.call(value, key));

  if (!isDescriptor) {
    return {
      status: 200,
      json: value ?? defaultPayload,
      rawBody: null,
      networkError: false,
      delayMs: 0
    };
  }

  return {
    status: normalizeHttpStatus(value.status, 200),
    json: Object.prototype.hasOwnProperty.call(value, "json")
      ? value.json
      : defaultPayload,
    rawBody: Object.prototype.hasOwnProperty.call(value, "rawBody")
      ? String(value.rawBody)
      : null,
    networkError: value.networkError === true,
    delayMs: normalizeDelay(value.delayMs)
  };
}

function readRpcRequestMetadata(request, state, rpcName) {
  try {
    const body = request.postDataJSON();
    const visitorId = String(body?.p_visitor_id ?? "");
    const hasVisitorCredential = (
      rpcName === "sync_skin_gallery_state"
      || rpcName === "delete_skin_gallery_state"
    ) && visitorId.length > 0;

    const visitorFingerprint = hasVisitorCredential
      ? createVisitorFingerprint(visitorId, state.visitorFingerprintKey)
      : "";

    if (
      visitorFingerprint
      && !state.visitorOrdinalsByFingerprint.has(visitorFingerprint)
    ) {
      state.visitorOrdinalsByFingerprint.set(visitorFingerprint, state.nextVisitorKey);
      state.nextVisitorKey += 1;
    }

    return {
      selectedSkinIds: Array.isArray(body?.p_skin_ids)
        ? body.p_skin_ids
          .map((skinId) => String(skinId ?? "").trim())
          .filter(Boolean)
        : [],
      visitorKey: hasVisitorCredential
        ? state.visitorOrdinalsByFingerprint.get(visitorFingerprint)
        : 0
    };
  } catch {
    return {
      selectedSkinIds: [],
      visitorKey: 0
    };
  }
}

function createVisitorFingerprint(visitorId, key) {
  return createHmac("sha256", key)
    .update(visitorId, "utf8")
    .digest("hex");
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
  const classifiedProductionRequests = (
    state.allowlistedMockRequests
    + state.allowlistedPreflightRequests
    + state.blockedUnexpectedRequests
  );

  if (state.interceptedAttempts.length !== classifiedProductionRequests) {
    failures.push(
      `production Supabase request classification mismatch: intercepted ${state.interceptedAttempts.length}, classified ${classifiedProductionRequests}`
    );
  }

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
    productionOriginIntercepts: state.interceptedAttempts.length,
    allowlistedMockRequests: state.allowlistedMockRequests,
    allowlistedPreflightRequests: state.allowlistedPreflightRequests,
    blockedUnexpectedRequests: state.blockedUnexpectedRequests,
    networkEgress: state.networkEgress,
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

function normalizeHttpStatus(value, fallback) {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized >= 100 && normalized <= 599
    ? normalized
    : fallback;
}

function normalizeDelay(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0
    ? Math.min(Math.floor(normalized), 10_000)
    : 0;
}
