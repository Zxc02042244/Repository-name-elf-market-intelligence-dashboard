import { expect, test } from "@playwright/test";
import {
  installPlaywrightSupabaseIsolation,
  SUPABASE_RPC_ALLOWLIST
} from "./playwright-supabase-isolation.js";
import { STORAGE_KEYS } from "../src/config/product-config.js";

let supabaseIsolation;
const legacyVisitorId = "11111111-1111-4111-8111-111111111111";
const legacyVisitorToken = "22222222-2222-4222-8222-222222222222";

test.beforeAll(() => {
  expect(SUPABASE_RPC_ALLOWLIST).toEqual([
    "sync_skin_gallery_state",
    "delete_skin_gallery_state",
    "get_skin_gallery_stats",
    "get_skin_supply_stats"
  ]);
});

test.beforeEach(async ({ context }) => {
  supabaseIsolation = await installPlaywrightSupabaseIsolation(context);
});

test.afterEach(async ({}, testInfo) => {
  const summary = supabaseIsolation.assertSafe({
    requiredRpcAttempts: { sync_skin_gallery_state: 1 }
  });
  testInfo.annotations.push({
    type: "supabase-isolation",
    description: JSON.stringify(summary)
  });
});

async function installCommittedCredentialFixture(context, selectedIds = []) {
  await context.addInitScript(({ keys, selectedIds: initialSelectedIds, visitorId, visitorToken }) => {
    if (!localStorage.getItem(keys.skinVisitor)) {
      localStorage.setItem(keys.skinVisitor, visitorId);
    }
    if (!localStorage.getItem(keys.skinVisitorToken)) {
      localStorage.setItem(keys.skinVisitorToken, visitorToken);
    }
    if (!localStorage.getItem(keys.skinWishlist) && initialSelectedIds.length > 0) {
      localStorage.setItem(keys.skinWishlist, JSON.stringify({
        visitorCount: 1,
        hasCountedLocalVisit: true,
        selectedIds: initialSelectedIds
      }));
    }
  }, {
    keys: STORAGE_KEYS,
    selectedIds,
    visitorId: legacyVisitorId,
    visitorToken: legacyVisitorToken
  });
}

function credentialRejectionResponse() {
  return {
    status: 409,
    json: {
      code: "ELF_VISITOR_CREDENTIAL_REJECTED",
      message: "The visitor credential was not accepted.",
      details: null,
      hint: null
    }
  };
}

function createIdempotentGate() {
  let releasePromise;
  let released = false;
  const promise = new Promise((resolve) => {
    releasePromise = resolve;
  });

  return Object.freeze({
    promise,
    release() {
      if (released) {
        return false;
      }
      released = true;
      releasePromise();
      return true;
    },
    isReleased() {
      return released;
    }
  });
}

async function closeContextPromptly(context, timeoutMs = 2_000) {
  let timeoutId;
  try {
    await Promise.race([
      context.close(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Isolated context did not close promptly."));
        }, timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function installUnhandledRejectionCounter(context) {
  await context.addInitScript(() => {
    Object.defineProperty(globalThis, "__elfUnhandledRejectionCount", {
      configurable: true,
      value: 0,
      writable: true
    });
    globalThis.addEventListener("unhandledrejection", () => {
      globalThis.__elfUnhandledRejectionCount += 1;
    });
  });
}

async function readUnhandledRejectionCount(page) {
  return page.evaluate(() => globalThis.__elfUnhandledRejectionCount ?? 0);
}

function subtractFulfillmentSnapshots(after, before) {
  return Object.freeze({
    routeFulfillmentsStarted: (
      after.routeFulfillmentsStarted - before.routeFulfillmentsStarted
    ),
    routeFulfillmentsCompleted: (
      after.routeFulfillmentsCompleted - before.routeFulfillmentsCompleted
    ),
    routeFulfillmentsFailed: (
      after.routeFulfillmentsFailed - before.routeFulfillmentsFailed
    )
  });
}

test("every champion reuses the single global frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-unified-frame#home&tab=supply", {
    waitUntil: "domcontentloaded"
  });

  const card = page.locator('[data-skin-champion-view="desktop"] .elf-champion-card');
  await expect(card).toHaveCount(1);
  await expect(card).toHaveClass(/elf-champion-unified-frame/);
  await expect(card).not.toHaveClass(/elf-champion-layered-frame|elf-champion-frame-/);

  await expect.poll(async () => card.evaluate((element) => getComputedStyle(element).backgroundImage))
    .toContain("unified-forest-card-frame-v1.png");
  const firstBackground = await card.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(firstBackground).toContain("unified-forest-card-frame-v1.png");

  const rows = page.locator(".elf-tab-panel-supply .elf-rank-list-desktop .elf-rank-row-selectable");
  await expect(rows).toHaveCount(30);
  await rows.nth(1).locator("button[data-skin-preview]").click();

  const secondBackground = await card.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(secondBackground).toBe(firstBackground);
  await expect(card).toBeVisible();
  await expect.poll(async () => card.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThan(0);

  const layout = await card.evaluate((element) => {
    const rank = element.querySelector(".elf-champion-rank").getBoundingClientRect();
    const art = element.querySelector(".elf-champion-art img").getBoundingClientRect();
    const name = element.querySelector(".elf-champion-body > strong").getBoundingClientRect();
    const bounds = element.getBoundingClientRect();

    return {
      aspect: bounds.width / bounds.height,
      rankInside: rank.top >= bounds.top && rank.bottom <= bounds.bottom,
      artInside: art.top >= bounds.top && art.bottom <= bounds.bottom,
      nameInside: name.top >= bounds.top && name.bottom <= bounds.bottom
    };
  });

  expect(layout.aspect).toBeCloseTo(1041 / 1511, 2);
  expect(layout.rankInside).toBe(true);
  expect(layout.artInside).toBe(true);
  expect(layout.nameInside).toBe(true);
});

test("ranking preview and wishlist controls keep independent keyboard semantics", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-ranking-keyboard-contract#home", {
    waitUntil: "domcontentloaded"
  });

  const skinId = "pioneer-spark";
  const row = page.locator(`.elf-tab-panel-wishlist .elf-rank-list-desktop .elf-rank-row-selectable:has(> button[data-skin-preview='${skinId}'])`);
  const previewButton = row.locator(`:scope > button[data-skin-preview='${skinId}']`);
  const wishlistButton = row.locator(`:scope > button[data-wishlist-toggle='${skinId}']`);

  await expect(previewButton).toHaveCount(1);
  await expect(wishlistButton).toHaveCount(1);
  await expect(row).not.toHaveAttribute("role", "button");
  await expect(row).not.toHaveAttribute("tabindex", "0");
  await expect(row.locator("button button")).toHaveCount(0);
  await expect(previewButton.locator("img")).toHaveAttribute("alt", "");

  await previewButton.focus();
  await expect(previewButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(previewButton).toHaveAttribute("aria-pressed", "true");
  await expect(previewButton).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(wishlistButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(wishlistButton).toHaveAttribute("aria-pressed", "true");
  await expect(wishlistButton).toBeFocused();

  await page.keyboard.press("Space");
  await expect(wishlistButton).toHaveAttribute("aria-pressed", "false");
  await wishlistButton.click();
  await expect(wishlistButton).toHaveAttribute("aria-pressed", "true");
  await expect.poll(
    () => supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")
  ).toBeGreaterThanOrEqual(4);
});

test("legacy rejection rotates once, commits safely, and exposes no credential", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (message) => consoleMessages.push(message.text()));
  page.on("pageerror", (error) => pageErrors.push(error.message));

  supabaseIsolation.setRpcMock("sync_skin_gallery_state", ({ attemptNumber }) => (
    attemptNumber === 1
      ? credentialRejectionResponse()
      : { visitorCount: 1285, wishlistLeaders: [] }
  ));

  await page.goto("/?v=playwright-credential-rotation#home", {
    waitUntil: "domcontentloaded"
  });

  await expect(page.locator('[data-community-sync-status="credential-rotated"]')).toBeVisible();
  const storage = await page.evaluate((keys) => ({
    pending: localStorage.getItem(keys.skinVisitorPending),
    visitorId: localStorage.getItem(keys.skinVisitor),
    visitorToken: localStorage.getItem(keys.skinVisitorToken)
  }), STORAGE_KEYS);
  const history = supabaseIsolation.getRpcHistory("sync_skin_gallery_state");
  const rendered = await page.locator("html").textContent();

  expect(history).toHaveLength(2);
  expect(new Set(history.map((entry) => entry.visitorKey)).size).toBe(2);
  expect(storage.pending).toBeNull();
  expect(storage.visitorId).not.toBe(legacyVisitorId);
  expect(storage.visitorToken).not.toBe(legacyVisitorToken);
  expect(storage.visitorId).not.toBe(storage.visitorToken);
  expect(page.url()).not.toContain(storage.visitorId);
  expect(page.url()).not.toContain(storage.visitorToken);
  expect(rendered).not.toContain(storage.visitorId);
  expect(rendered).not.toContain(storage.visitorToken);
  expect(consoleMessages.join("\n")).not.toContain(storage.visitorToken);
  expect(pageErrors.join("\n")).not.toContain(storage.visitorToken);
});

test("ambiguous replacement failure keeps pending pair and reload reuses it without a loop", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  supabaseIsolation.setRpcMock("sync_skin_gallery_state", ({ attemptNumber }) => {
    if (attemptNumber === 1) {
      return credentialRejectionResponse();
    }
    if (attemptNumber === 2) {
      return { networkError: true };
    }
    return { visitorCount: 1285, wishlistLeaders: [] };
  });

  await page.goto("/?v=playwright-pending-reload#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('[data-community-sync-status="offline/transient-error"]')).toBeVisible();
  const pendingBeforeReload = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEYS.skinVisitorPending);
  expect(pendingBeforeReload?.retryState).toBe("ambiguous");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-community-sync-status="credential-rotated"]')).toBeVisible();

  const history = supabaseIsolation.getRpcHistory("sync_skin_gallery_state");
  expect(history).toHaveLength(3);
  expect(history[2].visitorKey).toBe(history[1].visitorKey);
  await expect.poll(
    () => supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")
  ).toBe(3);
});

test("two tabs receiving the same rejection create only one replacement visitor", async ({ context }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  const originalRejectionGate = createIdempotentGate();
  try {
    supabaseIsolation.setRpcMock("sync_skin_gallery_state", async ({ request }) => {
      if (request.visitorKey === 1) {
        await originalRejectionGate.promise;
        return credentialRejectionResponse();
      }
      return { visitorCount: 1285, wishlistLeaders: [] };
    });

    const firstPage = await context.newPage();
    const secondPage = await context.newPage();
    supabaseIsolation.setPagePhase(firstPage, "initialization");
    supabaseIsolation.setPagePhase(secondPage, "initialization");
    await Promise.all([
      firstPage.goto("/?v=playwright-two-tab-a#home", { waitUntil: "domcontentloaded" }),
      secondPage.goto("/?v=playwright-two-tab-b#home", { waitUntil: "domcontentloaded" })
    ]);

    await expect.poll(() => (
      supabaseIsolation.getRpcHistory("sync_skin_gallery_state")
        .filter((entry) => entry.visitorKey === 1).length
    )).toBe(2);
    originalRejectionGate.release();

    await expect.poll(() => supabaseIsolation.getRpcHistory("sync_skin_gallery_state").length)
      .toBe(4);
    const statuses = await Promise.all([
      firstPage.locator("[data-community-sync-status]").first()
        .getAttribute("data-community-sync-status"),
      secondPage.locator("[data-community-sync-status]").first()
        .getAttribute("data-community-sync-status")
    ]);
    expect(new Set(statuses)).toEqual(new Set(["credential-rotated", "synced"]));

    const history = supabaseIsolation.getRpcHistory("sync_skin_gallery_state");
    expect(history).toHaveLength(4);
    expect(new Set(history.map((entry) => entry.visitorKey))).toEqual(new Set([1, 2]));
    expect(history.filter((entry) => entry.visitorKey === 1)).toHaveLength(2);
    expect(history.filter((entry) => entry.visitorKey === 2)).toHaveLength(2);
    expect(history.every((entry) => entry.selectedSkinIds.join(",") === "arale")).toBe(true);
    expect(history.filter((entry) => entry.visitorKey === 1)
      .every((entry) => entry.mockResponseType === "credential-rejection")).toBe(true);
    expect(history.filter((entry) => entry.visitorKey === 2)
      .every((entry) => entry.mockResponseType === "success")).toBe(true);

    const pageRpcEvents = await Promise.all([
      supabaseIsolation.getPageRpcHistory(firstPage),
      supabaseIsolation.getPageRpcHistory(secondPage)
    ]);
    for (const rpcEvents of pageRpcEvents) {
      const syncEvents = rpcEvents.filter((entry) => entry.rpcName === "sync_skin_gallery_state");
      expect(syncEvents).toHaveLength(2);
      expect(syncEvents.map((entry) => entry.lockAcquired)).toEqual([false, true]);
    }

    const firstCredential = await firstPage.evaluate((keys) => ({
      id: localStorage.getItem(keys.skinVisitor),
      token: localStorage.getItem(keys.skinVisitorToken)
    }), STORAGE_KEYS);
    const secondCredential = await secondPage.evaluate((keys) => ({
      id: localStorage.getItem(keys.skinVisitor),
      token: localStorage.getItem(keys.skinVisitorToken)
    }), STORAGE_KEYS);
    expect(firstCredential).toEqual(secondCredential);
  } finally {
    originalRejectionGate.release();
  }
});

test("cross-tab gate releases a pending handler after navigation failure", async ({ browser, page }) => {
  await page.goto("/?v=playwright-gate-navigation-baseline#home", {
    waitUntil: "domcontentloaded"
  });

  const manualContext = await browser.newContext();
  const manualIsolation = await installPlaywrightSupabaseIsolation(manualContext);
  await installUnhandledRejectionCounter(manualContext);
  await installCommittedCredentialFixture(manualContext, ["arale"]);
  const navigationGate = createIdempotentGate();
  let callbackFinished = false;
  let contextClosed = false;
  let navigationError = null;
  let pageErrorCount = 0;
  let waitingPage;

  try {
    const fulfillmentBefore = manualIsolation.getRpcFulfillmentSnapshot(
      "sync_skin_gallery_state"
    );
    try {
      manualIsolation.setRpcMock("sync_skin_gallery_state", async () => {
        await navigationGate.promise;
        callbackFinished = true;
        return { visitorCount: 1285, wishlistLeaders: [] };
      });

      waitingPage = await manualContext.newPage();
      waitingPage.on("pageerror", () => {
        pageErrorCount += 1;
      });
      await waitingPage.goto("/?v=playwright-gate-navigation-waiting#home", {
        waitUntil: "domcontentloaded"
      });
      const enteredHandler = await manualIsolation.waitForRpcHandler(
        "sync_skin_gallery_state",
        1,
        { timeoutMs: 1_000 }
      );
      expect(enteredHandler).toMatchObject({
        method: "POST",
        rpcName: "sync_skin_gallery_state",
        attemptNumber: 1,
        routeFulfillmentsStarted: 0,
        routeFulfillmentsCompleted: 0,
        routeFulfillmentsFailed: 0
      });
      expect(enteredHandler.activeRouteHandlers).toBeGreaterThan(0);

      const failingPage = await manualContext.newPage();
      try {
        await failingPage.goto("http://[invalid");
      } catch (error) {
        navigationError = error;
        throw error;
      }
    } catch (error) {
      expect(error).toBe(navigationError);
    } finally {
      navigationGate.release();
    }

    expect(navigationError).toBeTruthy();
    expect(navigationGate.isReleased()).toBe(true);
    expect(navigationGate.release()).toBe(false);
    await expect.poll(() => callbackFinished).toBe(true);
    const targetFulfillment = await manualIsolation.waitForFulfillment(
      "sync_skin_gallery_state",
      1,
      { timeoutMs: 1_000 }
    );
    const fulfillmentAfter = manualIsolation.getRpcFulfillmentSnapshot(
      "sync_skin_gallery_state"
    );
    const fulfillmentDelta = subtractFulfillmentSnapshots(
      fulfillmentAfter,
      fulfillmentBefore
    );
    expect(targetFulfillment).toEqual({
      method: "POST",
      rpcName: "sync_skin_gallery_state",
      attemptNumber: 1,
      routeFulfillmentsStarted: 1,
      routeFulfillmentsCompleted: 1,
      routeFulfillmentsFailed: 0,
      activeRouteHandlers: 0
    });
    expect(fulfillmentDelta).toEqual({
      routeFulfillmentsStarted: 1,
      routeFulfillmentsCompleted: 1,
      routeFulfillmentsFailed: 0
    });
    expect(fulfillmentAfter.activeRouteHandlers).toBe(0);
    expect(pageErrorCount).toBe(0);
    expect(await readUnhandledRejectionCount(waitingPage)).toBe(0);
    const isolationSummary = manualIsolation.assertSafe({
      requiredRpcAttempts: { sync_skin_gallery_state: 1 }
    });
    expect(isolationSummary.networkEgress).toBe(0);
  } finally {
    navigationGate.release();
    await closeContextPromptly(manualContext);
    contextClosed = true;
  }
  expect(contextClosed).toBe(true);
});

test("wishlist toggled during rejection is included in the replacement retry", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  supabaseIsolation.setRpcMock("sync_skin_gallery_state", ({ attemptNumber }) => (
    attemptNumber === 1
      ? { ...credentialRejectionResponse(), delayMs: 400 }
      : { visitorCount: 1285, wishlistLeaders: [] }
  ));

  await page.goto("/?v=playwright-rotation-latest-wishlist#home", {
    waitUntil: "domcontentloaded"
  });
  await expect.poll(() => supabaseIsolation.getRpcHistory("sync_skin_gallery_state").length).toBe(1);
  await page.locator("[data-wishlist-toggle='toy-sheriff']:visible").first().click();
  await expect.poll(() => supabaseIsolation.getRpcHistory("sync_skin_gallery_state").length)
    .toBeGreaterThanOrEqual(2);

  const history = supabaseIsolation.getRpcHistory("sync_skin_gallery_state");
  expect(history[0].selectedSkinIds).toEqual(["arale"]);
  expect(history[1].selectedSkinIds).toEqual(["arale", "toy-sheriff"]);
});

test("failed delete preserves local wishlist and committed credentials without rotation", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  supabaseIsolation.setRpcMock("delete_skin_gallery_state", () => ({
    status: 409,
    json: {
      code: "ELF_VISITOR_CREDENTIAL_REJECTED",
      message: "The visitor credential was not accepted.",
      details: null,
      hint: null
    }
  }));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/?v=playwright-delete-preserves-local#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('[data-community-sync-status="synced"]')).toBeVisible();
  await page.locator("[data-community-data-delete]").click();
  await expect(page.locator('[data-community-sync-status="deletion-unverified"]')).toBeVisible();

  const stored = await page.evaluate((keys) => ({
    visitorId: localStorage.getItem(keys.skinVisitor),
    visitorToken: localStorage.getItem(keys.skinVisitorToken),
    wishlist: JSON.parse(localStorage.getItem(keys.skinWishlist))
  }), STORAGE_KEYS);
  expect(stored.visitorId).toBe(legacyVisitorId);
  expect(stored.visitorToken).toBe(legacyVisitorToken);
  expect(stored.wishlist.selectedIds).toEqual(["arale"]);
  expect(supabaseIsolation.getRpcAttemptCount("delete_skin_gallery_state")).toBe(1);
  expect(new Set(
    supabaseIsolation.getRpcHistory()
      .map((entry) => entry.visitorKey)
      .filter((visitorKey) => visitorKey > 0)
  )).toEqual(new Set([1]));
});

test("terminal replacement rejection stays idle across reload until an explicit wishlist action", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  supabaseIsolation.setRpcMock("sync_skin_gallery_state", ({ attemptNumber }) => (
    attemptNumber <= 2
      ? credentialRejectionResponse()
      : { visitorCount: 1285, wishlistLeaders: [] }
  ));

  await page.goto("/?v=playwright-terminal-rejected#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('[data-community-sync-status="failed"]')).toBeVisible();
  const rejected = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEYS.skinVisitorPending);
  expect(rejected?.retryState).toBe("rejected");
  expect(rejected?.attemptedAt).toEqual(expect.any(Number));
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(2);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-community-sync-status="failed"]')).toBeVisible();
  await page.waitForTimeout(100);
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(2);

  await page.locator("[data-wishlist-toggle='toy-sheriff']:visible").first().click();
  await expect(page.locator('[data-community-sync-status="credential-rotated"]')).toBeVisible();
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(3);
  const history = supabaseIsolation.getRpcHistory("sync_skin_gallery_state");
  expect(history[2].visitorKey).not.toBe(history[1].visitorKey);
});

test("failed rejected-state persistence leaves attempted ready idle until an explicit action", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  await context.addInitScript((pendingKey) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (
        key === pendingKey
        && String(value).includes('"retryState":"rejected"')
      ) {
        throw new DOMException("Storage write blocked.", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  }, STORAGE_KEYS.skinVisitorPending);
  supabaseIsolation.setRpcMock("sync_skin_gallery_state", ({ attemptNumber }) => (
    attemptNumber <= 2
      ? credentialRejectionResponse()
      : { visitorCount: 1285, wishlistLeaders: [] }
  ));

  await page.goto("/?v=playwright-attempted-ready-terminal#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('[data-community-sync-status="failed"]')).toBeVisible();
  const attemptedReady = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEYS.skinVisitorPending);
  expect(attemptedReady?.retryState).toBe("ready");
  expect(attemptedReady?.attemptedAt).toEqual(expect.any(Number));
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(2);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-community-sync-status="failed"]')).toBeVisible();
  await page.waitForTimeout(100);
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(2);

  await page.locator("[data-wishlist-toggle='toy-sheriff']:visible").first().click();
  await expect(page.locator('[data-community-sync-status="credential-rotated"]')).toBeVisible();
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(3);
  const history = supabaseIsolation.getRpcHistory("sync_skin_gallery_state");
  expect(history[2].visitorKey).not.toBe(history[1].visitorKey);
});

test("delete failure coalesces multiple in-flight wishlist toggles into one latest sync", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  const deleteFailureGate = createIdempotentGate();
  try {
    supabaseIsolation.setRpcMock("delete_skin_gallery_state", async () => {
      await deleteFailureGate.promise;
      return {
        status: 503,
        json: { code: "PGRST001" }
      };
    });
    page.on("dialog", (dialog) => dialog.accept());

    supabaseIsolation.setPagePhase(page, "initialization");
    await page.goto("/?v=playwright-delete-queue-failure#home", {
      waitUntil: "domcontentloaded"
    });
    await expect(page.locator('[data-community-sync-status="synced"]')).toBeVisible();
    const syncAttemptsBeforeDelete = supabaseIsolation.getRpcAttemptCount(
      "sync_skin_gallery_state"
    );
    expect(syncAttemptsBeforeDelete).toBe(1);
    supabaseIsolation.setPagePhase(page, "delete-start");
    await page.locator("[data-community-data-delete]").click();
    await expect.poll(
      () => supabaseIsolation.getRpcAttemptCount("delete_skin_gallery_state")
    ).toBe(1);

    supabaseIsolation.setPagePhase(page, "delete-in-flight-toggle");
    await page.locator("[data-wishlist-toggle='toy-sheriff']:visible").first().click();
    await page.locator("[data-wishlist-toggle='pioneer-spark']:visible").first().click();
    await page.locator("[data-wishlist-toggle='arale']:visible").first().click();
    expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state"))
      .toBe(syncAttemptsBeforeDelete);
    supabaseIsolation.setPagePhase(page, "queued-after-delete");
    deleteFailureGate.release();

    await expect.poll(() => (
      supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")
      - syncAttemptsBeforeDelete
    )).toBe(1);
    await page.waitForTimeout(100);
    expect(
      supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")
      - syncAttemptsBeforeDelete
    ).toBe(1);
    const postDeleteHistory = supabaseIsolation
      .getRpcHistory("sync_skin_gallery_state")
      .slice(syncAttemptsBeforeDelete);
    expect(postDeleteHistory).toHaveLength(1);
    expect(postDeleteHistory[0].phase).toBe("queued-after-delete");
    expect(postDeleteHistory[0].selectedSkinIds).toEqual(["toy-sheriff", "pioneer-spark"]);
  } finally {
    deleteFailureGate.release();
  }
});

test("delete gate releases a pending handler after poll failure", async ({ browser, page }) => {
  await page.goto("/?v=playwright-gate-poll-baseline#home", {
    waitUntil: "domcontentloaded"
  });

  const manualContext = await browser.newContext();
  const manualIsolation = await installPlaywrightSupabaseIsolation(manualContext);
  await installUnhandledRejectionCounter(manualContext);
  await installCommittedCredentialFixture(manualContext, ["arale"]);
  const deleteGate = createIdempotentGate();
  let callbackFinished = false;
  let contextClosed = false;
  let pollError = null;
  let pageErrorCount = 0;
  let isolatedPage;

  try {
    let fulfillmentBefore;
    try {
      manualIsolation.setRpcMock("delete_skin_gallery_state", async () => {
        await deleteGate.promise;
        callbackFinished = true;
        return {
          status: 503,
          json: { code: "PGRST001" }
        };
      });

      isolatedPage = await manualContext.newPage();
      isolatedPage.on("pageerror", () => {
        pageErrorCount += 1;
      });
      isolatedPage.on("dialog", (dialog) => dialog.accept());
      await isolatedPage.goto("/?v=playwright-gate-poll-waiting#home", {
        waitUntil: "domcontentloaded"
      });
      await expect(isolatedPage.locator('[data-community-sync-status="synced"]')).toBeVisible();
      fulfillmentBefore = manualIsolation.getRpcFulfillmentSnapshot(
        "delete_skin_gallery_state"
      );
      await isolatedPage.locator("[data-community-data-delete]").click();
      const enteredHandler = await manualIsolation.waitForRpcHandler(
        "delete_skin_gallery_state",
        1,
        { timeoutMs: 1_000 }
      );
      expect(enteredHandler).toMatchObject({
        method: "POST",
        rpcName: "delete_skin_gallery_state",
        attemptNumber: 1,
        routeFulfillmentsStarted: 0,
        routeFulfillmentsCompleted: 0,
        routeFulfillmentsFailed: 0
      });
      expect(enteredHandler.activeRouteHandlers).toBeGreaterThan(0);

      try {
        await expect.poll(() => 0, {
          timeout: 100,
          intervals: [10]
        }).toBe(1);
      } catch (error) {
        pollError = error;
        throw error;
      }
    } catch (error) {
      expect(error).toBe(pollError);
    } finally {
      deleteGate.release();
    }

    expect(pollError).toBeTruthy();
    expect(deleteGate.isReleased()).toBe(true);
    expect(deleteGate.release()).toBe(false);
    await expect.poll(() => callbackFinished).toBe(true);
    const targetFulfillment = await manualIsolation.waitForFulfillment(
      "delete_skin_gallery_state",
      1,
      { timeoutMs: 1_000 }
    );
    const fulfillmentAfter = manualIsolation.getRpcFulfillmentSnapshot(
      "delete_skin_gallery_state"
    );
    const fulfillmentDelta = subtractFulfillmentSnapshots(
      fulfillmentAfter,
      fulfillmentBefore
    );
    expect(targetFulfillment).toEqual({
      method: "POST",
      rpcName: "delete_skin_gallery_state",
      attemptNumber: 1,
      routeFulfillmentsStarted: 1,
      routeFulfillmentsCompleted: 1,
      routeFulfillmentsFailed: 0,
      activeRouteHandlers: 0
    });
    expect(fulfillmentDelta).toEqual({
      routeFulfillmentsStarted: 1,
      routeFulfillmentsCompleted: 1,
      routeFulfillmentsFailed: 0
    });
    expect(fulfillmentAfter.activeRouteHandlers).toBe(0);
    expect(pageErrorCount).toBe(0);
    expect(await readUnhandledRejectionCount(isolatedPage)).toBe(0);
    const isolationSummary = manualIsolation.assertSafe({
      requiredRpcAttempts: {
        sync_skin_gallery_state: 1,
        delete_skin_gallery_state: 1
      }
    });
    expect(isolationSummary.networkEgress).toBe(0);
  } finally {
    deleteGate.release();
    await closeContextPromptly(manualContext);
    contextClosed = true;
  }
  expect(contextClosed).toBe(true);
});

test("delete success discards queued toggles and leaves no stale sync request", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  supabaseIsolation.setRpcMock("delete_skin_gallery_state", () => ({
    status: 200,
    json: { visitorCount: 1284, wishlistLeaders: [] },
    delayMs: 300
  }));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/?v=playwright-delete-queue-success#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('[data-community-sync-status="synced"]')).toBeVisible();
  await page.locator("[data-community-data-delete]").click();
  await expect.poll(
    () => supabaseIsolation.getRpcAttemptCount("delete_skin_gallery_state")
  ).toBe(1);
  await page.locator("[data-wishlist-toggle='toy-sheriff']:visible").first().click();
  await page.locator("[data-wishlist-toggle='pioneer-spark']:visible").first().click();

  await expect.poll(async () => page.evaluate((keys) => ({
    id: localStorage.getItem(keys.skinVisitor),
    token: localStorage.getItem(keys.skinVisitorToken),
    selectedIds: JSON.parse(localStorage.getItem(keys.skinWishlist)).selectedIds
  }), STORAGE_KEYS)).toEqual({
    id: null,
    token: null,
    selectedIds: []
  });
  await page.waitForTimeout(100);
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(1);

  await page.locator("[data-wishlist-toggle='toy-sheriff']:visible").first().click();
  await expect.poll(
    () => supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")
  ).toBe(2);
  await page.waitForTimeout(100);
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(2);
});

test("delete network failure without a toggle never starts a sync retry", async ({ context, page }) => {
  await installCommittedCredentialFixture(context, ["arale"]);
  supabaseIsolation.setRpcMock("delete_skin_gallery_state", () => ({
    networkError: true,
    delayMs: 100
  }));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/?v=playwright-delete-network-no-sync#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('[data-community-sync-status="synced"]')).toBeVisible();
  await page.locator("[data-community-data-delete]").click();
  await expect(page.locator('[data-community-sync-status="deletion-unverified"]')).toBeVisible();
  await page.waitForTimeout(100);
  expect(supabaseIsolation.getRpcAttemptCount("sync_skin_gallery_state")).toBe(1);
  expect(supabaseIsolation.getRpcAttemptCount("delete_skin_gallery_state")).toBe(1);
});

test("unexpected production-origin requests are blocked and classified without egress", async ({ browser, page }) => {
  await page.goto("/?v=playwright-standard-isolation-proof#home", {
    waitUntil: "domcontentloaded"
  });

  const context = await browser.newContext();
  const manualIsolation = await installPlaywrightSupabaseIsolation(context);
  const isolatedPage = await context.newPage();

  try {
    await isolatedPage.goto("/?v=playwright-unexpected-isolation-proof#home", {
      waitUntil: "domcontentloaded"
    });
    const status = await isolatedPage.evaluate(async (origin) => {
      const response = await fetch(`${origin}/rest/v1/not-allowlisted`);
      return response.status;
    }, manualIsolation.productionOrigin);
    expect(status).toBe(418);

    const summary = manualIsolation.getSummary();
    expect(summary.productionOriginIntercepts).toBeGreaterThanOrEqual(2);
    expect(summary.allowlistedMockRequests).toBeGreaterThanOrEqual(1);
    expect(summary.blockedUnexpectedRequests).toBe(1);
    expect(summary.networkEgress).toBe(0);
    expect(
      summary.productionOriginIntercepts
      - summary.allowlistedMockRequests
      - summary.allowlistedPreflightRequests
      - summary.blockedUnexpectedRequests
    ).toBe(0);
    expect(() => manualIsolation.assertSafe()).toThrow(
      /unexpected production Supabase requests/
    );
  } finally {
    await context.close();
  }
});

test("mobile ranking preview remains independently clickable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-ranking-mobile-preview-contract#home", {
    waitUntil: "domcontentloaded"
  });

  const row = page.locator(".elf-rank-list-mobile .elf-rank-row-selectable").nth(1);
  const previewButton = row.locator(":scope > button[data-skin-preview]");
  const wishlistButton = row.locator(":scope > button[data-wishlist-toggle]");

  await expect(previewButton).toBeVisible();
  await expect(wishlistButton).toBeHidden();
  await expect(previewButton).toHaveAttribute("aria-pressed", "false");
  await previewButton.click();
  await expect(previewButton).toHaveAttribute("aria-pressed", "true");
});

test("mobile carousel uses the same global frame", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?v=playwright-unified-frame-mobile#home&tab=supply", {
    waitUntil: "domcontentloaded"
  });

  const cards = page.locator(".elf-mobile-champion-carousel .elf-champion-card");
  await expect(cards).toHaveCount(10);

  const backgrounds = await cards.evaluateAll((elements) => (
    elements.map((element) => getComputedStyle(element).backgroundImage)
  ));
  expect(new Set(backgrounds).size).toBe(1);
  expect(backgrounds[0]).toContain("unified-forest-card-frame-v1.png");
});

test("wishlist and supply rankings share the champion card bounds", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-shared-ranking-layout#home", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop .elf-rank-meter")).toHaveCount(30);
  await expect(page.locator('[data-skin-champion-view="desktop"] .elf-champion-card')).toBeVisible();

  const readLayout = () => page.locator(".elf-tab-panel:visible").evaluate((panel) => {
    const card = panel.querySelector('[data-skin-champion-view="desktop"] .elf-champion-card');
    const ranking = panel.querySelector(":scope > .elf-rank-list-desktop");
    const pagination = panel.querySelector(":scope > .elf-ranking-pagination");
    const delta = panel.querySelector(":scope > .elf-delta-panel");
    const rect = (element) => {
      const bounds = element?.getBoundingClientRect();
      return bounds ? {
        top: bounds.top,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height
      } : null;
    };

    return {
      card: rect(card),
      ranking: rect(ranking),
      pagination: rect(pagination),
      delta: rect(delta),
      meters: panel.querySelectorAll(":scope > .elf-rank-list-desktop .elf-rank-meter").length
    };
  });

  const wishlist = await readLayout();
  expect(wishlist.meters).toBe(30);
  expect(Math.abs(wishlist.ranking.top - wishlist.card.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(wishlist.pagination.bottom - wishlist.card.bottom)).toBeLessThanOrEqual(1);

  await page.locator(".elf-home-tabs-desktop [data-skin-home-tab='supply']").click();
  await expect(page.locator(".elf-tab-panel-supply")).toBeVisible();

  const supply = await readLayout();
  expect(supply.meters).toBe(30);
  expect(supply.card.width).toBeCloseTo(wishlist.card.width, 0);
  expect(supply.card.height).toBeCloseTo(wishlist.card.height, 0);
  expect(Math.abs(supply.ranking.top - supply.card.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(supply.pagination.bottom - supply.card.bottom)).toBeLessThanOrEqual(1);
  expect(supply.delta.height).toBe(0);
});

test("desktop ranking paginates all 49 skins while mobile stays at top ten", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?v=playwright-ranking-pages#home", { waitUntil: "domcontentloaded" });

  const desktopRows = page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop .elf-rank-row");
  await expect(desktopRows).toHaveCount(30);
  await expect(page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop")).toHaveAttribute("data-ranking-columns", "3");

  await page.locator("[data-skin-ranking-page='1']").click();
  await expect(desktopRows).toHaveCount(19);
  await expect(page.locator(".elf-tab-panel-wishlist .elf-rank-list-desktop")).toHaveAttribute("data-ranking-columns", "2");
  await expect(desktopRows.nth(0).locator(".elf-rank-index")).toHaveText("31");
  await expect(desktopRows.nth(18).locator(".elf-rank-index")).toHaveText("49");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".elf-mobile-champion-carousel .elf-champion-card")).toHaveCount(10);
  await expect(page.locator(".elf-rank-list-mobile .elf-rank-row")).toHaveCount(10);
  await expect(page.locator(".elf-ranking-pagination")).toBeHidden();
});
