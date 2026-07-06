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

export function getElfBetaItem(itemId) {
  return ELF_BETA_ITEMS.find((item) => item.itemId === itemId);
}
