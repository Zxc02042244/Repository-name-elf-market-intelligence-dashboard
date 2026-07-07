const SIGIL_DIVISOR = 1e9;

export function normalizeElfHistoryTransaction(rawTx, item, context = {}) {
  assertRawTransaction(rawTx, item);

  const quantity = Number(rawTx.itemNum);
  const totalValue = Number(rawTx.totalAmount) / SIGIL_DIVISOR;
  const transactionTime = normalizeTimestamp(rawTx.txnTime);
  const participants = mapParticipants(rawTx);

  return {
    source: item.source || context.source || "elf",
    item: {
      itemId: String(item.itemId),
      itemName: item.name,
      assetClass: item.assetClass,
      category: item.category,
      groupName: item.group
    },
    transaction: {
      transactionId: String(rawTx.txnId),
      transactionTime
    },
    quantity,
    value: {
      total: totalValue,
      unit: quantity > 0 ? totalValue / quantity : 0,
      currency: "SIGIL"
    },
    actors: participants,
    collectedAt: context.collectedAt ?? new Date().toISOString(),
    collectorRunLabel: context.runLabel ?? "manual-dry-run"
  };
}

export function buildPriceSnapshotCandidate(item, transactions, context = {}) {
  const unitValues = transactions.map((entry) => entry.value.unit).filter((value) => Number.isFinite(value));
  const totalQuantity = transactions.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalVolume = transactions.reduce((sum, entry) => sum + entry.value.total, 0);
  const latestTransactionTime = transactions.reduce(
    (latest, entry) => Math.max(latest, Date.parse(entry.transaction.transactionTime)),
    0
  );

  return {
    source: item.source || context.source || "elf",
    itemId: String(item.itemId),
    itemName: item.name,
    assetClass: item.assetClass,
    category: item.category,
    groupName: item.group,
    bucketStart: context.bucketStart ?? new Date().toISOString(),
    bucketMinutes: context.bucketMinutes ?? 60,
    tradeCount: transactions.length,
    totalQuantity,
    totalVolume,
    averageUnitValue: totalQuantity > 0 ? totalVolume / totalQuantity : 0,
    minUnitValue: unitValues.length ? Math.min(...unitValues) : null,
    maxUnitValue: unitValues.length ? Math.max(...unitValues) : null,
    lastUnitValue: transactions[0]?.value.unit ?? null,
    latestTransactionTime: latestTransactionTime ? new Date(latestTransactionTime).toISOString() : null
  };
}

function assertRawTransaction(rawTx, item) {
  if (!item?.itemId || !item?.name) {
    throw new TypeError("Collector item metadata is incomplete.");
  }

  if (!rawTx || typeof rawTx !== "object") {
    throw new TypeError("Mock raw transaction is missing.");
  }

  const quantity = Number(rawTx.itemNum);
  const totalAmount = Number(rawTx.totalAmount);
  const orderType = Number(rawTx.orderType);

  if (!rawTx.txnId || !Number.isFinite(Number(rawTx.txnTime))) {
    throw new TypeError("Mock raw transaction identity is incomplete.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(totalAmount) || totalAmount < 0) {
    throw new TypeError("Mock raw transaction value is invalid.");
  }

  if (orderType !== 1 && orderType !== 2) {
    throw new TypeError("Mock raw transaction side mapping is invalid.");
  }

  if (!rawTx.orderUserId || !rawTx.traderId) {
    throw new TypeError("Mock raw transaction actors are incomplete.");
  }
}

function mapParticipants(rawTx) {
  const orderUser = {
    id: String(rawTx.orderUserId),
    name: rawTx.orderUserName || "-"
  };
  const trader = {
    id: String(rawTx.traderId),
    name: rawTx.traderName || "-"
  };

  if (Number(rawTx.orderType) === 2) {
    return {
      seller: trader,
      buyer: orderUser
    };
  }

  return {
    seller: orderUser,
    buyer: trader
  };
}

function normalizeTimestamp(value) {
  const timestamp = Number(value);
  const milliseconds = timestamp < 100000000000 ? timestamp * 1000 : timestamp;
  return new Date(milliseconds).toISOString();
}
