export const ELF_BETA_ITEMS = [
  {
    itemId: "elf-sigil-ore",
    name: "Sigil Ore",
    group: "Material",
    category: "Resource"
  },
  {
    itemId: "moonleaf-bundle",
    name: "Moonleaf Bundle",
    group: "Material",
    category: "Herb"
  },
  {
    itemId: "ember-core",
    name: "Ember Core",
    group: "Crafting",
    category: "Component"
  },
  {
    itemId: "waystone-shard",
    name: "Waystone Shard",
    group: "Crafting",
    category: "Component"
  }
];

export const ELF_LIVE_CANARY_ITEMS = [
  {
    itemId: 21101,
    name: "Carrot",
    group: "Resource",
    category: "Crop"
  }
];

export function getElfBetaItem(itemId) {
  return ELF_BETA_ITEMS.find((item) => item.itemId === itemId);
}
