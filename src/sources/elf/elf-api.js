import { ELF_PROXY_ENDPOINTS, ELF_SOURCE } from "./elf-config.js";
import { ELF_LIVE_CANARY_ITEMS, getElfBetaItem } from "./elf-items.js";
import { normalizeElfTransaction } from "./normalize-elf-transaction.js";

const MOCK_ELF_RAW_TRANSACTIONS = [
  {
    itemId: "elf-sigil-ore",
    itemNum: 8,
    totalAmount: 24000000000,
    orderType: 1,
    orderUserId: "actor-aurel",
    orderUserName: "Aurel",
    traderId: "actor-mira",
    traderName: "Mira",
    txnId: "mock-001",
    txnTime: Date.UTC(2026, 6, 6, 8, 15)
  },
  {
    itemId: "moonleaf-bundle",
    itemNum: 12,
    totalAmount: 18000000000,
    orderType: 2,
    orderUserId: "actor-liora",
    orderUserName: "Liora",
    traderId: "actor-mira",
    traderName: "Mira",
    txnId: "mock-002",
    txnTime: Date.UTC(2026, 6, 6, 9, 5)
  },
  {
    itemId: "ember-core",
    itemNum: 2,
    totalAmount: 50000000000,
    orderType: 1,
    orderUserId: "actor-corin",
    orderUserName: "Corin",
    traderId: "actor-aurel",
    traderName: "Aurel",
    txnId: "mock-003",
    txnTime: Date.UTC(2026, 6, 6, 10, 25)
  },
  {
    itemId: "waystone-shard",
    itemNum: 5,
    totalAmount: 37500000000,
    orderType: 2,
    orderUserId: "actor-sena",
    orderUserName: "Sena",
    traderId: "actor-liora",
    traderName: "Liora",
    txnId: "mock-004",
    txnTime: Date.UTC(2026, 6, 6, 11, 10)
  },
  {
    itemId: "elf-sigil-ore",
    itemNum: 10,
    totalAmount: 31000000000,
    orderType: 1,
    orderUserId: "actor-sena",
    orderUserName: "Sena",
    traderId: "actor-corin",
    traderName: "Corin",
    txnId: "mock-005",
    txnTime: Date.UTC(2026, 6, 6, 12, 40)
  },
  {
    itemId: "ember-core",
    itemNum: 1,
    totalAmount: 28000000000,
    orderType: 2,
    orderUserId: "actor-mira",
    orderUserName: "Mira",
    traderId: "actor-sena",
    traderName: "Sena",
    txnId: "mock-006",
    txnTime: Date.UTC(2026, 6, 6, 13, 30)
  }
];

export async function loadElfMockMarketTransactions() {
  const fetchedAt = Date.now();
  const transactions = MOCK_ELF_RAW_TRANSACTIONS.map((rawTx) => {
    const item = getElfBetaItem(rawTx.itemId);

    if (!item) {
      throw new Error(`Unexpected mock item id: ${rawTx.itemId}`);
    }

    return normalizeElfTransaction(rawTx, item, { fetchedAt });
  });

  return {
    source: ELF_SOURCE.mockLabel,
    fetchedAt,
    transactions
  };
}

export async function getElfAccessToken() {
  let response;

  try {
    response = await fetch(ELF_PROXY_ENDPOINTS.refresh, { method: "POST" });
  } catch (error) {
    throw createElfAdapterError("token_refresh_failed", "Token refresh failed.", error);
  }

  const payload = await readProxyJson(response, "token_refresh_failed", "Token refresh failed.");

  if (payload.code !== 0 || !isNonEmptyString(payload.data?.accessToken)) {
    throw createElfAdapterError("token_refresh_failed", "Token refresh failed.");
  }

  return `Bearer ${payload.data.accessToken}`;
}

export async function fetchElfItemTransactions(item, accessToken) {
  if (!item?.itemId) {
    throw createElfAdapterError("unexpected_api_response_format", "Unexpected API response format.");
  }

  const url = new URL(ELF_PROXY_ENDPOINTS.price);
  url.searchParams.set("itemId", String(item.itemId));
  url.searchParams.set("accessToken", accessToken);

  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw createElfAdapterError("item_request_failed", "Item request failed.", error, item);
  }

  const payload = await readProxyJson(response, "item_request_failed", "Item request failed.", item);

  if (payload?.code !== 0) {
    throw createElfAdapterError("item_request_failed", "Item request failed.", null, item);
  }

  if (!Array.isArray(payload.data)) {
    throw createElfAdapterError("unexpected_api_response_format", "Unexpected API response format.", null, item);
  }

  return payload.data;
}

export async function loadElfLiveTransactions(items = ELF_LIVE_CANARY_ITEMS) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createElfAdapterError("unexpected_api_response_format", "Unexpected API response format.");
  }

  const fetchedAt = Date.now();
  const accessToken = await getElfAccessToken();
  const transactions = [];
  const failures = [];

  for (const item of items) {
    try {
      const rawTransactions = await fetchElfItemTransactions(item, accessToken);
      transactions.push(
        ...rawTransactions.map((rawTx) => normalizeElfTransaction(rawTx, item, { fetchedAt }))
      );
    } catch (error) {
      failures.push({
        itemId: item.itemId,
        itemName: item.name,
        kind: error.kind ?? "item_request_failed",
        message: getSafeErrorMessage(error)
      });
    }
  }

  if (failures.length === items.length && transactions.length === 0) {
    if (failures.some((failure) => failure.kind === "unexpected_api_response_format")) {
      throw createElfAdapterError("unexpected_api_response_format", "Unexpected API response format.");
    }

    throw createElfAdapterError("item_request_failed", "Item request failed.");
  }

  return {
    source: failures.length > 0 ? `${ELF_SOURCE.liveLabel} (partial)` : ELF_SOURCE.liveLabel,
    fetchedAt,
    transactions,
    failures,
    partial: failures.length > 0
  };
}

function createElfAdapterError(kind, message, cause, item) {
  const error = new Error(message);
  error.kind = kind;
  error.cause = cause;
  error.item = item;
  return error;
}

async function readProxyJson(response, failureKind, failureMessage, item) {
  if (!response?.ok) {
    throw createElfAdapterError(failureKind, failureMessage, null, item);
  }

  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    throw createElfAdapterError(
      "unexpected_api_response_format",
      "Unexpected API response format.",
      error,
      item
    );
  }

  if (!payload || typeof payload !== "object" || !Object.hasOwn(payload, "code")) {
    throw createElfAdapterError(
      "unexpected_api_response_format",
      "Unexpected API response format.",
      null,
      item
    );
  }

  return payload;
}

function getSafeErrorMessage(error) {
  const messages = {
    token_refresh_failed: "Token refresh failed.",
    item_request_failed: "Item request failed.",
    unexpected_api_response_format: "Unexpected API response format."
  };

  return messages[error?.kind] ?? "Item request failed.";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
