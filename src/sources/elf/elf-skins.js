import { readPublicServiceConfig } from "../../config/service-config.js";

const toneCycle = Object.freeze(["amber", "cyan", "rose", "violet", "emerald"]);

const fallbackElfSkinNames = Object.freeze([
  "Genesis Pioneer",
  "Pioneer Spark",
  "Pioneer Swift",
  "Take My Pi",
  "CiDi Echo",
  "Arale",
  "Pink Bunny",
  "Trailblazer",
  "Shark Hoodie",
  "Arcane Prince",
  "Spinning Kicker",
  "Dune Walker",
  "Cosmic Sovereign",
  "Galactic Cadet",
  "Toy Sheriff",
  "Lion Dance",
  "Amber Miner",
  "Tomato Darling",
  "Chick Starlet",
  "Cloudtop Chef",
  "Hornwood Spirit",
  "Moo Moo",
  "Prairie Wanderer",
  "Pumpkin Whisper",
  "Treasure Hunter",
  "Workshop Artisan",
  "Octo Pirate",
  "Steel Enforcer",
  "Starborn Warrior",
  "Heroic Guardian",
  "Mantis Fighter",
  "Alien Hunter",
  "Stardeep Warden",
  "Arena Gladiator",
  "Claw Ranger",
  "Wolf Hood",
  "Desert Lizard",
  "Shield Commander",
  "Emerald Sage",
  "Frost Enchantress",
  "Flame Brawler",
  "Bio Warrior",
  "Frost Envoy",
  "Flame Runner",
  "Zombie Walker",
  "Bubble Beast",
  "Pumpkin Head",
  "Dark Ooze",
  "Tree Guardian"
]);

const fallbackElfSkins = Object.freeze(
  fallbackElfSkinNames.map((name, index) => ({
    id: createSkinId(name),
    name,
    image: createFallbackSkinImageUrl(name),
    quantity: null,
    tone: inferSkinTone(name, index)
  }))
);

export function getFallbackElfSkins() {
  return fallbackElfSkins.map((skin) => ({ ...skin }));
}

export async function loadElfSkinCatalog({ signal, runtimeConfig } = {}) {
  const { skinApiUrl } = readPublicServiceConfig(runtimeConfig);

  if (!skinApiUrl) {
    throw new Error("ELF skin API public runtime configuration is missing.");
  }

  const response = await fetch(skinApiUrl, { signal });

  if (!response.ok) {
    const error = new Error(`ELF skin API request failed with HTTP ${response.status}.`);
    error.kind = "elf_skin_request_failed";
    throw error;
  }

  const payload = await response.json();

  if (payload?.code !== 0 || !Array.isArray(payload.skins)) {
    const error = new Error("Unexpected ELF skin API response format.");
    error.kind = "unexpected_elf_skin_response_format";
    throw error;
  }

  return {
    source: "CiDi official ELF skin API",
    serverTime: payload.serverTime ?? "",
    fetchedAt: Date.now(),
    skins: sortSkinsByQuantity(
      payload.skins
        .map(normalizeElfSkin)
        .filter((skin) => skin.name && skin.image)
    )
  };
}

function normalizeElfSkin(rawSkin, index) {
  const name = String(rawSkin?.skinName ?? "").trim();

  return {
    id: createSkinId(name),
    name,
    image: String(rawSkin?.skinUrl ?? "").trim(),
    quantity: normalizeQuantity(rawSkin?.quantity),
    tone: inferSkinTone(name, index)
  };
}

function normalizeQuantity(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function sortSkinsByQuantity(skins) {
  return [...skins].sort((left, right) => {
    const rightQuantity = right.quantity ?? -1;
    const leftQuantity = left.quantity ?? -1;
    return rightQuantity - leftQuantity || left.name.localeCompare(right.name);
  });
}

function inferSkinTone(name, index) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("pink") || lowerName.includes("bunny") || lowerName.includes("rose")) {
    return "rose";
  }

  if (lowerName.includes("shark") || lowerName.includes("echo") || lowerName.includes("water")) {
    return "cyan";
  }

  if (lowerName.includes("tree") || lowerName.includes("leaf") || lowerName.includes("guardian")) {
    return "emerald";
  }

  if (lowerName.includes("arcane") || lowerName.includes("pi") || lowerName.includes("pioneer")) {
    return "violet";
  }

  return toneCycle[index % toneCycle.length];
}

function createSkinId(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createFallbackSkinImageUrl(name) {
  const { fallbackSkinImageBaseUrl } = readPublicServiceConfig();
  const fileName = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${fallbackSkinImageBaseUrl}/elf-set_${fileName}-idle.png`;
}
