import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  forgetSkinCommunityData,
  syncSkinCommunityWishlist
} from "../src/features/skins/state/skin-community-stats.js";
import { STORAGE_KEYS } from "../src/config/product-config.js";

function installBrowserHarness() {
  const values = new Map();
  const requests = [];

  globalThis.window = {
    ELF_PUBLIC_CONFIG: {
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "sb_publishable_test"
    },
    crypto: globalThis.crypto ?? webcrypto,
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); }
    }
  };
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return {
      ok: true,
      status: 200,
      async json() { return { visitorCount: 1, wishlistLeaders: [] }; }
    };
  };

  return { requests, values };
}

test("wishlist sync uses stable paired visitor credentials and caps client input", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const harness = installBrowserHarness();

  try {
    await syncSkinCommunityWishlist(["toy-sheriff", "toy-sheriff", "forest-oracle", "ignored-fourth"]);
    await syncSkinCommunityWishlist(["forest-oracle"]);

    const first = JSON.parse(harness.requests[0].options.body);
    const second = JSON.parse(harness.requests[1].options.body);
    assert.match(first.p_visitor_id, /^[0-9a-f-]{36}$/);
    assert.match(first.p_visitor_token, /^[0-9a-f-]{36}$/);
    assert.notEqual(first.p_visitor_id, first.p_visitor_token);
    assert.equal(second.p_visitor_id, first.p_visitor_id);
    assert.equal(second.p_visitor_token, first.p_visitor_token);
    assert.deepEqual(first.p_skin_ids, ["toy-sheriff", "forest-oracle", "ignored-fourth"]);
    assert.equal(harness.requests[0].options.headers.Authorization, undefined);
    assert.equal(harness.requests[0].options.headers.apikey, "sb_publishable_test");
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("community deletion sends the token and removes both local credentials", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const harness = installBrowserHarness();

  try {
    await syncSkinCommunityWishlist(["toy-sheriff"]);
    const syncBody = JSON.parse(harness.requests[0].options.body);
    const state = await forgetSkinCommunityData();
    const deletion = harness.requests[1];

    assert.match(deletion.url, /delete_skin_gallery_state$/);
    assert.deepEqual(JSON.parse(deletion.options.body), {
      p_visitor_id: syncBody.p_visitor_id,
      p_visitor_token: syncBody.p_visitor_token
    });
    assert.equal(harness.values.size, 0);
    assert.equal(state.status, "forgotten");
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("legacy visitors keep their existing ID when a token is added", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const harness = installBrowserHarness();
  const legacyVisitorId = "a5eb18e5-0f2e-4c93-a552-13f84508fc11";

  try {
    harness.values.set(STORAGE_KEYS.skinVisitor, legacyVisitorId);
    await syncSkinCommunityWishlist(["toy-sheriff"]);

    const body = JSON.parse(harness.requests[0].options.body);
    assert.equal(body.p_visitor_id, legacyVisitorId);
    assert.match(body.p_visitor_token, /^[0-9a-f-]{36}$/);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), legacyVisitorId);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), body.p_visitor_token);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("token-only visitors keep their existing token when an ID is added", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const harness = installBrowserHarness();
  const existingVisitorToken = "6b8af76d-16d6-4b34-b957-2d72b73cead4";

  try {
    harness.values.set(STORAGE_KEYS.skinVisitorToken, existingVisitorToken);
    await syncSkinCommunityWishlist(["toy-sheriff"]);

    const body = JSON.parse(harness.requests[0].options.body);
    assert.match(body.p_visitor_id, /^[0-9a-f-]{36}$/);
    assert.notEqual(body.p_visitor_id, existingVisitorToken);
    assert.equal(body.p_visitor_token, existingVisitorToken);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), body.p_visitor_id);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), existingVisitorToken);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("failed community deletion preserves credentials for a retry", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const harness = installBrowserHarness();

  try {
    await syncSkinCommunityWishlist(["toy-sheriff"]);
    globalThis.fetch = async () => ({ ok: false, status: 404 });

    await assert.rejects(
      forgetSkinCommunityData(),
      /Community data deletion failed with HTTP 404/
    );
    assert.equal(harness.values.size, 2);
    assert.ok(harness.values.get(STORAGE_KEYS.skinVisitor));
    assert.ok(harness.values.get(STORAGE_KEYS.skinVisitorToken));
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});

test("forbidden community deletion preserves both credentials for a retry", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const harness = installBrowserHarness();

  try {
    await syncSkinCommunityWishlist(["toy-sheriff"]);
    const visitorId = harness.values.get(STORAGE_KEYS.skinVisitor);
    const visitorToken = harness.values.get(STORAGE_KEYS.skinVisitorToken);
    globalThis.fetch = async () => ({ ok: false, status: 403 });

    await assert.rejects(
      forgetSkinCommunityData(),
      /Community data deletion failed with HTTP 403/
    );
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitor), visitorId);
    assert.equal(harness.values.get(STORAGE_KEYS.skinVisitorToken), visitorToken);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
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
        import.meta.url,
      ),
      "utf8",
    ),
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
    normalizeNewlines(deployedDefinition),
  );
  assert.match(
    schema,
    /Accepted production difference:[\s\S]*visitor_secret_hash[\s\S]*do not rebuild production solely/i,
  );
});
