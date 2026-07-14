import assert from "node:assert/strict";
import test from "node:test";

import { loadElfSkinCatalog } from "../src/sources/elf/elf-skins.js";

test("skin catalog accepts an explicit runtime API configuration", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";

  globalThis.fetch = async (url) => {
    requestedUrl = String(url);

    return {
      ok: true,
      async json() {
        return {
          code: 0,
          serverTime: "2026-07-14T00:00:00Z",
          skins: [{
            skinName: "Toy Sheriff",
            skinUrl: "https://example.test/toy-sheriff.png",
            quantity: 39
          }]
        };
      }
    };
  };

  try {
    const catalog = await loadElfSkinCatalog({
      runtimeConfig: {
        skinApiUrl: "https://example.test/api/v1/elf/skins/"
      }
    });

    assert.equal(requestedUrl, "https://example.test/api/v1/elf/skins");
    assert.equal(catalog.skins.length, 1);
    assert.equal(catalog.skins[0].name, "Toy Sheriff");
    assert.equal(catalog.skins[0].quantity, 39);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
