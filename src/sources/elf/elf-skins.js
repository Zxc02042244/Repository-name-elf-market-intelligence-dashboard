const ELF_SKIN_API_URL = "https://api-prd.cidi.games/api/v1/elf/skins";

const toneCycle = Object.freeze(["amber", "cyan", "rose", "violet", "emerald"]);

const fallbackElfSkins = Object.freeze([
  {
    id: "apple-darling",
    name: "Apple Darling",
    image: "https://www.cidi.games/elfs/elf-set_apple_darling-idle.png",
    quantity: null,
    tone: "amber"
  },
  {
    id: "chick-starlet",
    name: "Chick Starlet",
    image: "https://www.cidi.games/elfs/elf-set_chick_starlet-idle.png",
    quantity: null,
    tone: "cyan"
  },
  {
    id: "moo-moo",
    name: "Moo Moo",
    image: "https://www.cidi.games/elfs/elf-set_moo_moo-idle.png",
    quantity: null,
    tone: "rose"
  },
  {
    id: "pumpkin-whisper",
    name: "Pumpkin Whisper",
    image: "https://www.cidi.games/elfs/elf-set_pumpkin_whisper-idle.png",
    quantity: null,
    tone: "violet"
  },
  {
    id: "tigerstripe",
    name: "Tigerstripe",
    image: "https://www.cidi.games/elfs/elf-set_tigerstripe-idle.png",
    quantity: null,
    tone: "emerald"
  }
]);

export function getFallbackElfSkins() {
  return fallbackElfSkins.map((skin) => ({ ...skin }));
}

export async function loadElfSkinCatalog({ signal } = {}) {
  const response = await fetch(ELF_SKIN_API_URL, { signal });

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
