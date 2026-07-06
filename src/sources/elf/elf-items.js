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

export const ELF_MARKET_COVERAGE_ITEMS = [
  {
    itemId: 21101,
    name: "Carrot",
    group: "Resource",
    category: "Vegetable"
  },
  {
    itemId: 21102,
    name: "Potato",
    group: "Resource",
    category: "Vegetable"
  },
  {
    itemId: 21103,
    name: "Pumpkin",
    group: "Resource",
    category: "Vegetable"
  },
  {
    itemId: 21104,
    name: "Broccoli",
    group: "Resource",
    category: "Vegetable"
  },
  {
    itemId: 21105,
    name: "Tomato",
    group: "Resource",
    category: "Vegetable"
  },
  {
    itemId: 21106,
    name: "Beet",
    group: "Resource",
    category: "Vegetable"
  },
  {
    itemId: 21107,
    name: "Wheat",
    group: "Resource",
    category: "Grain"
  },
  {
    itemId: 21108,
    name: "Corn",
    group: "Resource",
    category: "Grain"
  },
  {
    itemId: 21109,
    name: "Chili",
    group: "Resource",
    category: "Spice"
  },
  {
    itemId: 21110,
    name: "Strawberry",
    group: "Resource",
    category: "Fruit"
  },
  {
    itemId: 21111,
    name: "Watermelon",
    group: "Resource",
    category: "Fruit"
  },
  {
    itemId: 21112,
    name: "Ryegrass",
    group: "Resource",
    category: "Grass"
  }
];

export function getElfBetaItem(itemId) {
  return ELF_BETA_ITEMS.find((item) => item.itemId === itemId);
}
