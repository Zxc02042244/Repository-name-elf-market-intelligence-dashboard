export const COLLECTOR_SOURCE = "elf";

export const MANUAL_COLLECTOR_ITEMS = Object.freeze([
  {
    source: COLLECTOR_SOURCE,
    itemId: "21101",
    name: "Carrot",
    assetClass: "Resources / Materials",
    category: "Vegetable",
    group: "Seed"
  },
  {
    source: COLLECTOR_SOURCE,
    itemId: "21102",
    name: "Tomato",
    assetClass: "Resources / Materials",
    category: "Vegetable",
    group: "Seed"
  },
  {
    source: COLLECTOR_SOURCE,
    itemId: "21103",
    name: "Blueberry",
    assetClass: "Resources / Materials",
    category: "Fruit",
    group: "Seed"
  }
]);

export const MOCK_RAW_TRANSACTIONS = Object.freeze([
  {
    txnId: "manual-dry-run-001",
    txnTime: 1783425600,
    orderType: 1,
    orderUserId: "seller-001",
    orderUserName: "Dry Run Seller",
    traderId: "buyer-001",
    traderName: "Dry Run Buyer",
    itemNum: 10,
    totalAmount: 25000000000
  },
  {
    txnId: "manual-dry-run-002",
    txnTime: 1783429200,
    orderType: 2,
    orderUserId: "buyer-002",
    orderUserName: "Dry Run Buyer Two",
    traderId: "seller-002",
    traderName: "Dry Run Seller Two",
    itemNum: 5,
    totalAmount: 14000000000
  }
]);

const FUTURE_ENV_REQUIREMENTS = Object.freeze([
  {
    name: "ELF_REFRESH_TOKEN",
    requiredNow: false,
    purpose: "future server-side token refresh"
  },
  {
    name: "ELF_PROXY_REFRESH_URL",
    requiredNow: false,
    purpose: "future server-side proxy refresh endpoint"
  },
  {
    name: "ELF_PROXY_PRICE_URL",
    requiredNow: false,
    purpose: "future server-side proxy price endpoint"
  },
  {
    name: "SUPABASE_URL",
    requiredNow: false,
    purpose: "future Supabase writes"
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    requiredNow: false,
    purpose: "future Supabase writes"
  }
]);

export function loadCollectorConfig(env = process.env) {
  const requestedDryRun = env.COLLECTOR_DRY_RUN;
  const dryRun = true;
  const itemLimit = clampInteger(env.COLLECTOR_ITEM_LIMIT, 1, MANUAL_COLLECTOR_ITEMS.length, 1);
  const concurrency = clampInteger(env.COLLECTOR_CONCURRENCY, 1, 4, 1);

  return {
    source: env.COLLECTOR_SOURCE_NAME || COLLECTOR_SOURCE,
    dryRun,
    forcedDryRun: requestedDryRun === "false",
    itemLimit,
    concurrency,
    runLabel: env.COLLECTOR_RUN_LABEL || "manual-dry-run",
    items: MANUAL_COLLECTOR_ITEMS.slice(0, itemLimit),
    envReport: getEnvironmentReport(env)
  };
}

export function getEnvironmentReport(env = process.env) {
  return FUTURE_ENV_REQUIREMENTS.map((entry) => ({
    name: entry.name,
    present: Boolean(env[entry.name]),
    requiredNow: entry.requiredNow,
    purpose: entry.purpose
  }));
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
