import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  COMMUNITY_OPERATIONS,
  SkinCommunityRpcError,
  forgetSkinCommunityData,
  isCredentialRejection,
  syncSkinCommunityWishlist
} from "../src/features/skins/state/skin-community-stats.js";
import {
  COMMUNITY_CREDENTIAL_REJECTION_CODE,
  COMMUNITY_PENDING_CLOCK_SKEW_MS,
  COMMUNITY_PENDING_CREDENTIAL_TTL_MS,
  COMMUNITY_PENDING_CREDENTIAL_VERSION,
  createCommunityCredentialLifecycle,
  generateCredentialPair,
  isUuidV4
} from "../src/features/skins/state/skin-community-credentials.js";
import {
  createSkinWishlistState,
  toggleSkinWishlistSelection
} from "../src/features/skins/state/skin-wishlist.js";
import { STORAGE_KEYS } from "../src/config/product-config.js";
import { translations } from "../src/i18n/translations.js";

const OLD_VISITOR_ID = "11111111-1111-4111-8111-111111111111";
const OLD_VISITOR_TOKEN = "22222222-2222-4222-8222-222222222222";

function installBrowserHarness(options = {}) {
  const values = new Map(Object.entries(options.initialValues ?? {}));
  const requests = [];
  const responseQueue = [...(options.responses ?? [])];
  const setCounts = new Map();
  const lockState = createLockManager();

  const localStorage = {
    getItem(key) {
      options.onStorageGet?.({ key, values });
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      const nextValue = String(value);
      const count = (setCounts.get(key) ?? 0) + 1;
      setCounts.set(key, count);
      options.onStorageSet?.({ key, value: nextValue, count, values });
      values.set(key, nextValue);
    },
    removeItem(key) {
      options.onStorageRemove?.({ key, values });
      values.delete(key);
    }
  };

  globalThis.window = {
    ELF_PUBLIC_CONFIG: {
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "sb_publishable_test"
    },
    crypto: Object.prototype.hasOwnProperty.call(options, "crypto")
      ? options.crypto
      : webcrypto,
    navigator: {
      locks: options.locks === false ? undefined : lockState.manager
    },
    localStorage
  };

  globalThis.fetch = async (url, requestOptions) => {
    const body = JSON.parse(requestOptions.body);
    const request = {
      url: String(url),
      method: requestOptions.method,
      headers: requestOptions.headers,
      body
    };
    requests.push(request);
    let responseSpec = responseQueue.length > 0
      ? responseQueue.shift()
      : {
        status: 200,
        json: { visitorCount: 1, wishlistLeaders: [] }
      };

    if (typeof responseSpec === "function") {
      responseSpec = await responseSpec({
        attemptNumber: requests.length,
        body: structuredClone(body),
        url: String(url)
      });
    }

    if (responseSpec?.networkError) {
      throw new TypeError("network unavailable");
    }

    const status = Number(responseSpec?.status ?? 200);
    const rawBody = Object.prototype.hasOwnProperty.call(responseSpec ?? {}, "raw")
      ? String(responseSpec.raw)
      : JSON.stringify(responseSpec?.json ?? { visitorCount: 1, wishlistLeaders: [] });

    return {
      ok: status >= 200 && status < 300,
      status,
      async text() {
        if (responseSpec?.textError) {
          throw new TypeError(String(responseSpec.textError));
        }
        return rawBody;
      }
    };
  };

  return {
    localStorage,
    lockState,
    requests,
    setCounts,
    values
  };
}

async function withBrowserHarness(options, callback) {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const harness = installBrowserHarness(options);

  try {
    return await callback(harness);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
}

function createLockManager() {
  let tail = Promise.resolve();
  let requestCount = 0;

  return {
    get requestCount() {
      return requestCount;
    },
    manager: {
      request(_name, _options, callback) {
        requestCount += 1;
        const run = tail.then(callback, callback);
        tail = run.catch(() => {});
        return run;
      }
    }
  };
}

function committedValues(extra = {}) {
  return {
    [STORAGE_KEYS.skinVisitor]: OLD_VISITOR_ID,
    [STORAGE_KEYS.skinVisitorToken]: OLD_VISITOR_TOKEN,
    ...extra
  };
}

function credentialRejection(status = 409, code = COMMUNITY_CREDENTIAL_REJECTION_CODE) {
  return {
    status,
    json: {
      code,
      message: "The visitor credential was not accepted.",
      details: null,
      hint: null
    }
  };
}

function pendingEnvelope(options = {}) {
  return {
    version: COMMUNITY_PENDING_CREDENTIAL_VERSION,
    operationId: options.operationId ?? "33333333-3333-4333-8333-333333333333",
    baseVisitorId: options.baseVisitorId ?? OLD_VISITOR_ID,
    baseVisitorToken: options.baseVisitorToken ?? OLD_VISITOR_TOKEN,
    pendingVisitorId: options.pendingVisitorId ?? "44444444-4444-4444-8444-444444444444",
    pendingVisitorToken: options.pendingVisitorToken ?? "55555555-5555-4555-8555-555555555555",
    createdAt: options.createdAt ?? Date.now(),
    attemptedAt: Object.prototype.hasOwnProperty.call(options, "attemptedAt")
      ? options.attemptedAt
      : Date.now(),
    retryState: options.retryState ?? "ambiguous"
  };
}

test("wishlist sync uses stable paired visitor credentials and caps client input", async () => {
  await withBrowserHarness({}, async (harness) => {
    await syncSkinCommunityWishlist(["toy-sheriff", "toy-sheriff", "forest-oracle", "ignored-fourth"]);
    await syncSkinCommunityWishlist(["forest-oracle"]);

    const first = harness.requests[0].body;
    const second = harness.requests[1].body;
    assert.ok(isUuidV4(first.p_visitor_id));
    assert.ok(isUuidV4(first.p_visitor_token));
    assert.notEqual(first.p_visitor_id, first.p_visitor_token);
    assert.equal(second.p_visitor_id, first.p_visitor_id);
    assert.equal(second.p_visitor_token, first.p_visitor_token);
    assert.deepEqual(first.p_skin_ids, ["toy-sheriff", "forest-oracle", "ignored-fourth"]);
    assert.equal(harness.requests[0].headers.Authorization, undefined);
    assert.equal(harness.requests[0].headers.apikey, "sb_publishable_test");
  });
});

test("valid committed credentials update without rotation", async () => {
  await withBrowserHarness({ initialValues: committedValues() }, async (harness) => {
    const state = await syncSkinCommunityWishlist(["arale"]);

    assert.equal(state.syncStatus, "synced");
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.lockState.requestCount, 0);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
  });
});

test("legacy wishlist visitor fields are inert and the next wishlist write keeps only selected IDs", async () => {
  await withBrowserHarness({
    initialValues: {
      [STORAGE_KEYS.skinWishlist]: JSON.stringify({
        visitorCount: 42,
        hasCountedLocalVisit: true,
        selectedIds: ["arale"]
      })
    }
  }, async (harness) => {
    const initialState = createSkinWishlistState();

    assert.deepEqual(initialState, {
      selectedIds: ["arale"],
      notice: ""
    });
    assert.equal(harness.setCounts.get(STORAGE_KEYS.skinWishlist) ?? 0, 0);

    const nextState = toggleSkinWishlistSelection(initialState, "toy-sheriff");
    const storedWishlist = JSON.parse(harness.values.get(STORAGE_KEYS.skinWishlist));

    assert.deepEqual(nextState, {
      selectedIds: ["arale", "toy-sheriff"],
      notice: ""
    });
    assert.deepEqual(storedWishlist, {
      selectedIds: ["arale", "toy-sheriff"]
    });
  });
});

for (const response of [
  { name: "zero visitor count", json: { visitorCount: 0, wishlistLeaders: [] } },
  { name: "missing visitor count", json: { wishlistLeaders: [] } }
]) {
  test(`community sync accepts ${response.name} without retaining visitor state`, async () => {
    await withBrowserHarness({
      initialValues: committedValues(),
      responses: [{ status: 200, json: response.json }]
    }, async () => {
      const state = await syncSkinCommunityWishlist(["arale"]);

      assert.equal(state.status, "remote");
      assert.equal(state.syncStatus, "synced");
      assert.equal(Object.prototype.hasOwnProperty.call(state, "visitorCount"), false);
      assert.deepEqual(state.wishlistLeaders, []);
    });
  });
}

test("only the exact HTTP 409 credential code is classified for rotation", () => {
  assert.equal(isCredentialRejection(new SkinCommunityRpcError({
    operation: COMMUNITY_OPERATIONS.sync,
    kind: "http",
    status: 409,
    code: COMMUNITY_CREDENTIAL_REJECTION_CODE
  })), true);
  assert.equal(isCredentialRejection(new SkinCommunityRpcError({
    operation: COMMUNITY_OPERATIONS.sync,
    kind: "http",
    status: 401,
    code: "42501"
  })), false);
  assert.equal(isCredentialRejection(new SkinCommunityRpcError({
    operation: COMMUNITY_OPERATIONS.delete,
    kind: "http",
    status: 409,
    code: COMMUNITY_CREDENTIAL_REJECTION_CODE
  })), false);
  assert.equal(isCredentialRejection(new SkinCommunityRpcError({
    operation: COMMUNITY_OPERATIONS.sync,
    kind: "http",
    status: 500,
    code: COMMUNITY_CREDENTIAL_REJECTION_CODE
  })), false);
});

test("exact credential rejection rotates once and retries once", async () => {
  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [
      credentialRejection(),
      { status: 200, json: { visitorCount: 2, wishlistLeaders: [] } }
    ]
  }, async (harness) => {
    const state = await syncSkinCommunityWishlist(["arale"]);
    const replacement = harness.requests[1].body;

    assert.equal(state.syncStatus, "credential-rotated");
    assert.equal(harness.requests.length, 2);
    assert.equal(harness.lockState.requestCount, 1);
    assert.notEqual(replacement.p_visitor_id, OLD_VISITOR_ID);
    assert.notEqual(replacement.p_visitor_token, OLD_VISITOR_TOKEN);
    assert.notEqual(replacement.p_visitor_id, replacement.p_visitor_token);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), replacement.p_visitor_id);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), replacement.p_visitor_token);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
  });
});

test("rotation retry uses the latest wishlist selection", async () => {
  let selectedIds = ["arale"];

  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [
      () => {
        selectedIds = ["toy-sheriff", "pink-bunny"];
        return credentialRejection();
      },
      { status: 200, json: { visitorCount: 2, wishlistLeaders: [] } }
    ]
  }, async (harness) => {
    await syncSkinCommunityWishlist(() => selectedIds);

    assert.deepEqual(harness.requests[0].body.p_skin_ids, ["arale"]);
    assert.deepEqual(harness.requests[1].body.p_skin_ids, ["toy-sheriff", "pink-bunny"]);
  });
});

for (const rejection of [
  { name: "ACL 42501", response: { status: 401, json: { code: "42501" } } },
  { name: "HTTP 403", response: { status: 403, json: { code: "42501" } } },
  { name: "validation 22023", response: { status: 400, json: { code: "22023" } } },
  { name: "malformed UUID 22P02", response: { status: 400, json: { code: "22P02" } } },
  { name: "rate limit", response: { status: 429, json: { code: "RATE_LIMIT" } } },
  { name: "server outage", response: { status: 503, json: { code: "PGRST001" } } },
  { name: "network failure", response: { networkError: true } },
  { name: "wrong status with exact code", response: credentialRejection(500) }
]) {
  test(`${rejection.name} never rotates`, async () => {
    await withBrowserHarness({
      initialValues: committedValues(),
      responses: [rejection.response]
    }, async (harness) => {
      await assert.rejects(syncSkinCommunityWishlist(["arale"]));
      assert.equal(harness.requests.length, 1);
      assert.equal(harness.lockState.requestCount, 0);
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
      assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
    });
  });
}

test("replacement rejection becomes terminal and keeps committed credentials", async () => {
  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [credentialRejection(), credentialRejection()]
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "rotation-retry-failed");
      return true;
    });

    assert.equal(harness.requests.length, 2);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
    const pending = JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending));
    assert.equal(pending.retryState, "rejected");
    assert.equal(Number.isSafeInteger(pending.attemptedAt), true);
  });
});

test("terminal rejected pending never retries on initialization or reload", async () => {
  const rejected = pendingEnvelope({ retryState: "rejected" });
  const initialValues = committedValues({
    [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(rejected)
  });

  for (let reload = 0; reload < 3; reload += 1) {
    await withBrowserHarness({ initialValues }, async (harness) => {
      await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
        assert.equal(error.kind, "pending-rejected");
        return true;
      });
      assert.equal(harness.requests.length, 0);
      assert.equal(harness.lockState.requestCount, 0);
      assert.equal(
        JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending)).retryState,
        "rejected"
      );
    });
  }
});

test("explicit wishlist operation replaces one terminal pending under the rotation lock", async () => {
  const rejected = pendingEnvelope({ retryState: "rejected" });
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(rejected)
    }),
    responses: [{ status: 200, json: { visitorCount: 2, wishlistLeaders: [] } }]
  }, async (harness) => {
    const state = await syncSkinCommunityWishlist(["arale"], {
      allowTerminalRotation: true
    });

    assert.equal(state.syncStatus, "credential-rotated");
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.lockState.requestCount, 1);
    assert.notEqual(harness.requests[0].body.p_visitor_id, rejected.pendingVisitorId);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
  });
});

test("explicit terminal replacement fails closed without Web Locks", async () => {
  await withBrowserHarness({
    locks: false,
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(
        pendingEnvelope({ retryState: "rejected" })
      )
    })
  }, async (harness) => {
    await assert.rejects(
      syncSkinCommunityWishlist(["arale"], { allowTerminalRotation: true }),
      (error) => {
        assert.equal(error.kind, "rotation-lock-unavailable");
        return true;
      }
    );
    assert.equal(harness.requests.length, 0);
    assert.equal(
      JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending)).retryState,
      "rejected"
    );
  });
});

test("failed rejected transition leaves attempted ready terminal and reload sends zero requests", async () => {
  let failedRejectedWrite = false;
  let persistedValues;

  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [credentialRejection(), credentialRejection()],
    onStorageSet({ key, value }) {
      if (
        !failedRejectedWrite
        && key === STORAGE_KEYS.skinVisitorPending
        && JSON.parse(value).retryState === "rejected"
      ) {
        failedRejectedWrite = true;
        throw new Error("simulated rejected transition storage failure");
      }
    }
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "rotation-retry-failed");
      return true;
    });

    const pending = JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending));
    assert.equal(pending.retryState, "ready");
    assert.equal(Number.isSafeInteger(pending.attemptedAt), true);
    assert.equal(harness.requests.length, 2);

    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "pending-attempt-unresolved");
      return true;
    });
    assert.equal(harness.requests.length, 2);
    persistedValues = Object.fromEntries(harness.values);
  });

  for (let reload = 0; reload < 3; reload += 1) {
    await withBrowserHarness({
      initialValues: persistedValues,
      onStorageSet() {
        throw new Error("persistent storage write failure");
      }
    }, async (harness) => {
      await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
        assert.equal(error.kind, "pending-attempt-unresolved");
        return true;
      });
      assert.equal(harness.requests.length, 0);
      assert.equal(harness.lockState.requestCount, 0);
      const pending = JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending));
      assert.equal(pending.retryState, "ready");
      assert.equal(Number.isSafeInteger(pending.attemptedAt), true);
    });
  }
});

test("explicit operation replaces attempted ready once without resending the old pair", async () => {
  const attemptedReady = pendingEnvelope({ retryState: "ready" });
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(attemptedReady)
    }),
    responses: [{ status: 200, json: { visitorCount: 2, wishlistLeaders: [] } }]
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "pending-attempt-unresolved");
      return true;
    });
    assert.equal(harness.requests.length, 0);

    const state = await syncSkinCommunityWishlist(["toy-sheriff"], {
      allowTerminalRotation: true
    });
    assert.equal(state.syncStatus, "credential-rotated");
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.lockState.requestCount, 1);
    assert.notEqual(harness.requests[0].body.p_visitor_id, attemptedReady.pendingVisitorId);
    assert.notEqual(harness.requests[0].body.p_visitor_token, attemptedReady.pendingVisitorToken);
    assert.deepEqual(harness.requests[0].body.p_skin_ids, ["toy-sheriff"]);
  });
});

test("attempted ready remains fail closed without Web Locks", async () => {
  const attemptedReady = pendingEnvelope({ retryState: "ready" });
  await withBrowserHarness({
    locks: false,
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(attemptedReady)
    })
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "pending-attempt-unresolved");
      return true;
    });
    assert.equal(harness.requests.length, 0);

    await assert.rejects(
      syncSkinCommunityWishlist(["toy-sheriff"], { allowTerminalRotation: true }),
      (error) => {
        assert.equal(error.kind, "rotation-lock-unavailable");
        return true;
      }
    );
    assert.equal(harness.requests.length, 0);
    assert.deepEqual(
      JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending)),
      attemptedReady
    );
  });
});

test("network ambiguity keeps one pending pair and reload reuses it", async () => {
  const initialValues = committedValues();

  await withBrowserHarness({
    initialValues,
    responses: [credentialRejection(), { networkError: true }]
  }, async (firstHarness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]));
    const pending = JSON.parse(firstHarness.values.get(STORAGE_KEYS.skinVisitorPending));
    assert.equal(pending.retryState, "ambiguous");
    assert.equal(Number.isSafeInteger(pending.attemptedAt), true);
    assert.equal(firstHarness.requests.length, 2);

    const reloadedValues = Object.fromEntries(firstHarness.values);
    await withBrowserHarness({
      initialValues: reloadedValues,
      responses: [{ status: 200, json: { visitorCount: 2, wishlistLeaders: [] } }]
    }, async (reloadedHarness) => {
      const state = await syncSkinCommunityWishlist(["toy-sheriff"]);

      assert.equal(state.syncStatus, "credential-rotated");
      assert.equal(reloadedHarness.requests.length, 1);
      assert.equal(
        reloadedHarness.requests[0].body.p_visitor_id,
        pending.pendingVisitorId
      );
      assert.equal(
        reloadedHarness.requests[0].body.p_visitor_token,
        pending.pendingVisitorToken
      );
      assert.equal(reloadedHarness.values.has(STORAGE_KEYS.skinVisitorPending), false);
    });
  });
});

test("Web Locks absence fails safe without creating a replacement", async () => {
  await withBrowserHarness({
    initialValues: committedValues(),
    locks: false,
    responses: [credentialRejection()]
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "rotation-lock-unavailable");
      return true;
    });
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
  });
});

test("partial credential commit restores the old pair and remains recoverable", async () => {
  let failedCandidateIdWrite = false;

  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [
      credentialRejection(),
      { status: 200, json: { visitorCount: 2, wishlistLeaders: [] } }
    ],
    onStorageSet({ key, value }) {
      if (
        !failedCandidateIdWrite
        && key === STORAGE_KEYS.skinVisitor
        && value !== OLD_VISITOR_ID
      ) {
        failedCandidateIdWrite = true;
        throw new Error("simulated partial commit");
      }
    }
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]));

    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
    const pending = JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending));
    assert.equal(pending.retryState, "synced");

    const lifecycle = createCommunityCredentialLifecycle({
      storage: harness.localStorage,
      crypto: webcrypto,
      locks: harness.lockState.manager
    });
    const recovered = lifecycle.readCommittedCredentials();
    assert.equal(recovered.id, pending.pendingVisitorId);
    assert.equal(recovered.token, pending.pendingVisitorToken);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
  });
});

test("malformed pending envelopes are removed without touching committed credentials", async () => {
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: "{not-json"
    })
  }, async (harness) => {
    const lifecycle = createCommunityCredentialLifecycle({
      storage: harness.localStorage,
      crypto: webcrypto,
      locks: harness.lockState.manager
    });
    assert.deepEqual(lifecycle.readCommittedCredentials(), {
      id: OLD_VISITOR_ID,
      token: OLD_VISITOR_TOKEN
    });
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
  });
});

test("pending timestamps enforce TTL and a five-minute clock-skew window", async () => {
  const now = 2_000_000_000_000;
  const cases = [
    { name: "current time", createdAt: now, valid: true },
    { name: "TTL boundary", createdAt: now - COMMUNITY_PENDING_CREDENTIAL_TTL_MS, valid: true },
    { name: "past TTL", createdAt: now - COMMUNITY_PENDING_CREDENTIAL_TTL_MS - 1, valid: false },
    { name: "future within skew", createdAt: now + COMMUNITY_PENDING_CLOCK_SKEW_MS, valid: true },
    { name: "future beyond skew", createdAt: now + COMMUNITY_PENDING_CLOCK_SKEW_MS + 1, valid: false },
    { name: "clock rollback within skew", createdAt: now + 1_000, valid: true },
    { name: "clock rollback beyond skew", createdAt: now + COMMUNITY_PENDING_CLOCK_SKEW_MS + 60_000, valid: false },
    { name: "negative", createdAt: -1, valid: false },
    { name: "non-number", createdAt: "2000000000000", valid: false },
    { name: "extreme future", createdAt: Number.MAX_SAFE_INTEGER, valid: false }
  ];

  for (const entry of cases) {
    await withBrowserHarness({
      initialValues: committedValues({
        [STORAGE_KEYS.skinWishlist]: JSON.stringify({ selectedIds: ["arale"] }),
        [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(
          pendingEnvelope({
            createdAt: entry.createdAt,
            attemptedAt: null,
            retryState: "ready"
          })
        )
      })
    }, async (harness) => {
      const lifecycle = createCommunityCredentialLifecycle({
        storage: harness.localStorage,
        crypto: webcrypto,
        locks: harness.lockState.manager,
        now: () => now
      });
      const pending = lifecycle.readPendingCredentials({
        id: OLD_VISITOR_ID,
        token: OLD_VISITOR_TOKEN
      });

      assert.equal(Boolean(pending), entry.valid, entry.name);
      assert.equal(
        harness.values.has(STORAGE_KEYS.skinVisitorPending),
        entry.valid,
        entry.name
      );
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
      assert.deepEqual(
        JSON.parse(harness.values.get(STORAGE_KEYS.skinWishlist)).selectedIds,
        ["arale"]
      );
    });
  }
});

test("non-finite pending timestamps are rejected", async () => {
  for (const createdAt of [Infinity, Number.NaN]) {
    await withBrowserHarness({
      initialValues: committedValues({
        [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(
          pendingEnvelope({
            createdAt,
            attemptedAt: null,
            retryState: "ready"
          })
        )
      })
    }, async (harness) => {
      const lifecycle = createCommunityCredentialLifecycle({
        storage: harness.localStorage,
        crypto: webcrypto,
        locks: harness.lockState.manager,
        now: () => 2_000_000_000_000
      });
      assert.equal(lifecycle.readPendingCredentials({
        id: OLD_VISITOR_ID,
        token: OLD_VISITOR_TOKEN
      }), null);
      assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
    });
  }
});

test("secure generation fails closed without randomUUID or getRandomValues", async () => {
  await withBrowserHarness({ crypto: {} }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "secure-random-unavailable");
      return true;
    });
    assert.equal(harness.requests.length, 0);
    assert.equal(harness.values.size, 0);
  });
});

test("zero-filled random bytes fail closed", () => {
  assert.throws(() => generateCredentialPair({
    getRandomValues(bytes) {
      bytes.fill(0);
      return bytes;
    }
  }), /Community credential storage is unavailable/);
});

test("present visitor count still rejects negative, non-integer, and wrong-type values", async () => {
  for (const visitorCount of [-1, 1.5, "many"]) {
    await withBrowserHarness({
      initialValues: committedValues(),
      responses: [{ status: 200, json: { visitorCount, wishlistLeaders: [] } }]
    }, async () => {
      await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
        assert.equal(error.kind, "invalid-payload");
        return true;
      });
    });
  }
});

test("normal sync response body failure is a safe transient network error", async () => {
  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [{ status: 200, textError: `stream ${OLD_VISITOR_TOKEN}` }]
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "network");
      assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`, new RegExp(OLD_VISITOR_TOKEN));
      return true;
    });
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.lockState.requestCount, 0);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
  });
});

test("replacement response body failure marks the attempted pair ambiguous", async () => {
  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [
      credentialRejection(),
      { status: 200, textError: `stream ${OLD_VISITOR_TOKEN}` }
    ]
  }, async (harness) => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.kind, "rotation-retry-transient");
      assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`, new RegExp(OLD_VISITOR_TOKEN));
      return true;
    });
    const pending = JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending));
    assert.equal(pending.retryState, "ambiguous");
    assert.equal(Number.isSafeInteger(pending.attemptedAt), true);
    assert.equal(harness.requests.length, 2);
  });
});

test("non-JSON HTTP errors retain only safe status and operation metadata", async () => {
  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [{ status: 502, raw: "<html>gateway failure</html>" }]
  }, async () => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      assert.equal(error.operation, COMMUNITY_OPERATIONS.sync);
      assert.equal(error.status, 502);
      assert.equal(error.code, "");
      assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`, /gateway failure|html/i);
      return true;
    });
  });
});

test("legacy visitors keep their existing ID when a token is added", async () => {
  await withBrowserHarness({
    initialValues: {
      [STORAGE_KEYS.skinVisitor]: OLD_VISITOR_ID
    }
  }, async (harness) => {
    await syncSkinCommunityWishlist(["toy-sheriff"]);

    const body = harness.requests[0].body;
    assert.equal(body.p_visitor_id, OLD_VISITOR_ID);
    assert.ok(isUuidV4(body.p_visitor_token));
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), body.p_visitor_token);
  });
});

test("token-only visitors keep their existing token when an ID is added", async () => {
  await withBrowserHarness({
    initialValues: {
      [STORAGE_KEYS.skinVisitorToken]: OLD_VISITOR_TOKEN
    }
  }, async (harness) => {
    await syncSkinCommunityWishlist(["toy-sheriff"]);

    const body = harness.requests[0].body;
    assert.ok(isUuidV4(body.p_visitor_id));
    assert.notEqual(body.p_visitor_id, OLD_VISITOR_TOKEN);
    assert.equal(body.p_visitor_token, OLD_VISITOR_TOKEN);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), body.p_visitor_id);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
  });
});

test("community deletion clears committed and attempted pending credentials only after both succeed", async () => {
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(pendingEnvelope())
    })
  }, async (harness) => {
    const state = await forgetSkinCommunityData();

    assert.equal(harness.requests.length, 2);
    assert.deepEqual(harness.requests.map((request) => request.body), [
      {
        p_visitor_id: OLD_VISITOR_ID,
        p_visitor_token: OLD_VISITOR_TOKEN
      },
      {
        p_visitor_id: "44444444-4444-4444-8444-444444444444",
        p_visitor_token: "55555555-5555-4555-8555-555555555555"
      }
    ]);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitor), false);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorToken), false);
    assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
    assert.equal(state.status, "forgotten");
    assert.equal(harness.lockState.requestCount, 0);
  });
});

test("delete treats a missing pending server row as a safe no-op success", async () => {
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(pendingEnvelope())
    }),
    responses: [
      { status: 200, json: { wishlistLeaders: [] } },
      { status: 200, json: { wishlistLeaders: [] } }
    ]
  }, async (harness) => {
    const state = await forgetSkinCommunityData();
    assert.equal(state.status, "forgotten");
    assert.equal(harness.requests.length, 2);
    assert.equal(harness.values.size, 0);
  });
});

test("pure ready pending without an attempt marker is not sent to delete", async () => {
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(
        pendingEnvelope({
          attemptedAt: null,
          retryState: "ready"
        })
      )
    })
  }, async (harness) => {
    await forgetSkinCommunityData();
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.requests[0].body.p_visitor_id, OLD_VISITOR_ID);
  });
});

test("attempted ready remains a delete candidate and partial failure preserves all local data", async () => {
  const attemptedReady = pendingEnvelope({ retryState: "ready" });
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(attemptedReady)
    }),
    responses: [
      { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } },
      { networkError: true }
    ]
  }, async (harness) => {
    toggleSkinWishlistSelection(createSkinWishlistState(), "arale");
    const storedWishlist = harness.values.get(STORAGE_KEYS.skinWishlist);

    await assert.rejects(forgetSkinCommunityData(), (error) => {
      assert.equal(error.kind, "network");
      return true;
    });
    assert.equal(harness.requests.length, 2);
    assert.equal(harness.requests[1].body.p_visitor_id, attemptedReady.pendingVisitorId);
    assert.equal(harness.requests[1].body.p_visitor_token, attemptedReady.pendingVisitorToken);
    assert.equal(harness.values.get(STORAGE_KEYS.skinWishlist), storedWishlist);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
    assert.deepEqual(
      JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending)),
      attemptedReady
    );
    assert.equal(harness.lockState.requestCount, 0);
  });
});

test("duplicate committed and attempted pending pairs are deleted once", async () => {
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(
        pendingEnvelope({
          pendingVisitorId: OLD_VISITOR_ID,
          pendingVisitorToken: OLD_VISITOR_TOKEN
        })
      )
    })
  }, async (harness) => {
    await forgetSkinCommunityData();
    assert.equal(harness.requests.length, 1);
    assert.equal(harness.lockState.requestCount, 0);
  });
});

test("committed success plus pending network failure preserves all local deletion evidence", async () => {
  const initialValues = committedValues({
    [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(pendingEnvelope())
  });

  await withBrowserHarness({
    initialValues,
    responses: [
      { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } },
      { networkError: true }
    ]
  }, async (firstHarness) => {
    const wishlist = toggleSkinWishlistSelection(createSkinWishlistState(), "arale");
    const storedWishlist = firstHarness.values.get(STORAGE_KEYS.skinWishlist);

    await assert.rejects(forgetSkinCommunityData(), (error) => {
      assert.equal(error.kind, "network");
      return true;
    });
    assert.deepEqual(wishlist.selectedIds, ["arale"]);
    assert.equal(firstHarness.values.get(STORAGE_KEYS.skinWishlist), storedWishlist);
    assert.equal(firstHarness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(firstHarness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
    assert.equal(firstHarness.values.has(STORAGE_KEYS.skinVisitorPending), true);
    assert.equal(firstHarness.requests.length, 2);
    assert.equal(firstHarness.lockState.requestCount, 0);

    await withBrowserHarness({
      initialValues: Object.fromEntries(firstHarness.values),
      responses: [
        { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } },
        { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } }
      ]
    }, async (retryHarness) => {
      const state = await forgetSkinCommunityData();
      assert.equal(state.status, "forgotten");
      assert.equal(retryHarness.requests.length, 2);
      assert.equal(retryHarness.values.has(STORAGE_KEYS.skinVisitor), false);
      assert.equal(retryHarness.values.has(STORAGE_KEYS.skinVisitorToken), false);
      assert.equal(retryHarness.values.has(STORAGE_KEYS.skinVisitorPending), false);
    });
  });
});

test("pending success plus committed failure still attempts both and preserves evidence", async () => {
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(
        pendingEnvelope({ retryState: "rejected" })
      )
    }),
    responses: [
      { status: 403, json: { code: "42501" } },
      { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } }
    ]
  }, async (harness) => {
    toggleSkinWishlistSelection(createSkinWishlistState(), "arale");
    const storedWishlist = harness.values.get(STORAGE_KEYS.skinWishlist);
    await assert.rejects(forgetSkinCommunityData(), (error) => {
      assert.equal(error.code, "42501");
      return true;
    });
    assert.equal(harness.requests.length, 2);
    assert.equal(harness.values.get(STORAGE_KEYS.skinWishlist), storedWishlist);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
    assert.equal(
      JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending)).retryState,
      "rejected"
    );
    assert.equal(harness.lockState.requestCount, 0);
  });
});

test("synced pending deletion does not commit or discard its envelope before all deletes succeed", async () => {
  const syncedPending = pendingEnvelope({ retryState: "synced" });
  await withBrowserHarness({
    initialValues: committedValues({
      [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(syncedPending)
    }),
    responses: [
      { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } },
      { status: 503, json: { code: "PGRST001" } }
    ]
  }, async (harness) => {
    await assert.rejects(forgetSkinCommunityData());
    assert.equal(harness.requests.length, 2);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
    assert.deepEqual(
      JSON.parse(harness.values.get(STORAGE_KEYS.skinVisitorPending)),
      syncedPending
    );
  });
});

test("delete response body failures preserve committed and pending local data", async () => {
  for (const failingAttempt of [1, 2]) {
    await withBrowserHarness({
      initialValues: committedValues({
        [STORAGE_KEYS.skinVisitorPending]: JSON.stringify(pendingEnvelope())
      }),
      responses: [
        failingAttempt === 1
          ? { status: 200, textError: `stream ${OLD_VISITOR_TOKEN}` }
          : { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } },
        failingAttempt === 2
          ? { status: 200, textError: `stream ${OLD_VISITOR_TOKEN}` }
          : { status: 200, json: { visitorCount: 1, wishlistLeaders: [] } }
      ]
    }, async (harness) => {
      toggleSkinWishlistSelection(createSkinWishlistState(), "arale");
      const storedWishlist = harness.values.get(STORAGE_KEYS.skinWishlist);
      await assert.rejects(forgetSkinCommunityData(), (error) => {
        assert.equal(error.kind, "network");
        assert.doesNotMatch(`${error.message} ${JSON.stringify(error)}`, new RegExp(OLD_VISITOR_TOKEN));
        return true;
      });
      assert.equal(harness.requests.length, 2);
      assert.equal(harness.values.get(STORAGE_KEYS.skinWishlist), storedWishlist);
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
      assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), true);
    });
  }
});

for (const deletionFailure of [
  { name: "HTTP failure", response: { status: 500, json: { code: "PGRST001" } } },
  { name: "ACL failure", response: { status: 403, json: { code: "42501" } } },
  { name: "credential rejection", response: credentialRejection() },
  { name: "network failure", response: { networkError: true } },
  {
    name: "malformed success payload",
    response: { status: 200, json: { visitorCount: "unknown", wishlistLeaders: [] } }
  }
]) {
  test(`delete ${deletionFailure.name} preserves wishlist and credentials without rotation`, async () => {
    await withBrowserHarness({
      initialValues: committedValues(),
      responses: [deletionFailure.response]
    }, async (harness) => {
      const wishlist = toggleSkinWishlistSelection(createSkinWishlistState(), "arale");
      const storedWishlist = harness.values.get(STORAGE_KEYS.skinWishlist);

      await assert.rejects(forgetSkinCommunityData());

      assert.deepEqual(wishlist.selectedIds, ["arale"]);
      assert.equal(harness.values.get(STORAGE_KEYS.skinWishlist), storedWishlist);
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), OLD_VISITOR_ID);
      assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), OLD_VISITOR_TOKEN);
      assert.equal(harness.values.has(STORAGE_KEYS.skinVisitorPending), false);
      assert.equal(harness.requests.length, 1);
      assert.equal(harness.lockState.requestCount, 0);
    });
  });
}

test("missing delete credential does not create a visitor or claim deletion", async () => {
  await withBrowserHarness({}, async (harness) => {
    await assert.rejects(forgetSkinCommunityData(), (error) => {
      assert.equal(error.kind, "missing-credential");
      return true;
    });
    assert.equal(harness.requests.length, 0);
    assert.equal(harness.values.size, 0);
  });
});

test("structured errors never contain credentials, endpoint, or raw response text", async () => {
  await withBrowserHarness({
    initialValues: committedValues(),
    responses: [{
      status: 403,
      json: {
        code: "42501",
        message: `sensitive ${OLD_VISITOR_ID} ${OLD_VISITOR_TOKEN}`
      }
    }]
  }, async () => {
    await assert.rejects(syncSkinCommunityWishlist(["arale"]), (error) => {
      const serialized = `${error.message} ${JSON.stringify(error)}`;
      assert.doesNotMatch(serialized, new RegExp(OLD_VISITOR_ID));
      assert.doesNotMatch(serialized, new RegExp(OLD_VISITOR_TOKEN));
      assert.doesNotMatch(serialized, /example\.supabase\.co/);
      assert.doesNotMatch(serialized, /sensitive/);
      assert.equal(error.code, "42501");
      return true;
    });
  });
});

test("all five locales provide non-technical community sync status copy", () => {
  const keys = [
    "skinSyncStatusTitle",
    "skinSyncSynced",
    "skinSyncLocalOnly",
    "skinSyncCredentialRotated",
    "skinSyncRetryFailed",
    "skinDeleteUnverified"
  ];

  for (const locale of ["en", "zh-Hant", "ja", "ko", "vi"]) {
    for (const key of keys) {
      const value = translations[locale]?.elfLanding?.[key];
      assert.equal(typeof value, "string", `${locale}.${key} is missing`);
      assert.ok(value.length > 0, `${locale}.${key} is empty`);
      assert.doesNotMatch(value, /uuid|supabase|sqlstate|postgrest|https?:\/\//i);
    }
  }
});

test("Supabase boundary denies public snapshot writes and removes default function grants", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

  assert.match(schema, /revoke all on function sync_skin_supply_snapshot\(jsonb\) from public, anon, authenticated;/i);
  assert.match(schema, /grant execute on function sync_skin_supply_snapshot\(jsonb\) to service_role;/i);
  assert.doesNotMatch(schema, /grant execute on function sync_skin_supply_snapshot\(jsonb\) to anon/i);
  assert.match(schema, /set search_path = ''/i);
  assert.match(schema, /visitor_secret_hash = sha256/i);
});

test("schema reference uses the deployed gallery sync definition", async () => {
  const [schema, deployedMigration] = await Promise.all([
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../supabase/migrations/20260714141341_skin_gallery_security_hardening.sql",
        import.meta.url
      ),
      "utf8"
    )
  ]);
  const functionPattern =
    /create or replace function public\.sync_skin_gallery_state\([\s\S]*?\n\$\$;/i;
  const normalizeNewlines = (value) => value.replaceAll("\r\n", "\n");
  const schemaDefinition = schema.match(functionPattern)?.[0];
  const deployedDefinition = deployedMigration.match(functionPattern)?.[0];

  assert.ok(schemaDefinition, "schema sync function definition is missing");
  assert.ok(deployedDefinition, "deployed migration sync function definition is missing");
  assert.equal(
    normalizeNewlines(schemaDefinition),
    normalizeNewlines(deployedDefinition)
  );
  assert.match(
    schema,
    /Accepted production difference:[\s\S]*visitor_secret_hash[\s\S]*do not rebuild production solely/i
  );
});
