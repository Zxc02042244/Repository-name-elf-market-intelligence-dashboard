import { loadElfSkinCatalog } from "../src/sources/elf/elf-skins.js";

const defaultSupabaseUrl = "https://hsvemaakgjxydocwqbmq.supabase.co";
const defaultSkinApiUrl = "https://api-prd.cidi.games/api/v1/elf/skins";

const dryRun = process.argv.includes("--dry-run");

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const envSupabaseUrl = String(process.env.ELF_SUPABASE_URL ?? "").trim();
  const supabaseSecretKey = String(process.env.ELF_SUPABASE_SECRET_KEY ?? "").trim();
  const envSkinApiUrl = String(process.env.ELF_SKIN_API_URL ?? "").trim();
  const supabaseUrl = normalizeUrl(envSupabaseUrl || defaultSupabaseUrl);
  const skinApiUrl = normalizeUrl(envSkinApiUrl || defaultSkinApiUrl);

  if (!supabaseUrl || !skinApiUrl || (!dryRun && !supabaseSecretKey)) {
    throw new Error("Missing ELF skin snapshot runtime configuration.");
  }

  const catalog = await loadElfSkinCatalog({
    runtimeConfig: { skinApiUrl }
  });
  const skins = normalizeSupplySkins(catalog.skins);

  if (skins.length === 0) {
    throw new Error("No positive skin supply values were returned by the official skin API.");
  }

  if (dryRun) {
    console.log(`Dry run: ${skins.length} positive skin supply rows ready.`);
    return;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sync_skin_supply_snapshot`, {
    method: "POST",
    headers: {
      apikey: supabaseSecretKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_skins: skins
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Skin supply snapshot sync failed with HTTP ${response.status}: ${body}`);
  }

  const payload = await response.json();
  console.log(`Synced ${skins.length} skin supply rows for snapshot ${payload?.snapshotDate ?? "unknown"}.`);
}

function normalizeSupplySkins(skins) {
  if (!Array.isArray(skins)) {
    return [];
  }

  return skins
    .map((skin) => ({
      skinId: String(skin?.id ?? "").trim(),
      skinName: String(skin?.name ?? "").trim(),
      supply: normalizeNullableCount(skin?.quantity)
    }))
    .filter((skin) => skin.skinId && skin.skinName && skin.supply !== null && skin.supply > 0)
    .slice(0, 100);
}

function normalizeNullableCount(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.floor(numberValue)
    : null;
}

function normalizeUrl(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}
