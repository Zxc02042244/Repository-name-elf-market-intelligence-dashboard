import { ELF_SOURCE } from "./elf-config.js";

export function normalizeElfTransaction(rawTx, item, context = {}) {
  assertElfTransactionShape(rawTx, item);

  const quantity = Number(rawTx.itemNum);
  const totalValue = Number(rawTx.totalAmount) / 1e9;
  const unitValue = quantity > 0 ? totalValue / quantity : 0;
  const transactionTime = normalizeElfTimestamp(rawTx.txnTime);
  const participants = mapElfParticipants(rawTx);

  return {
    id: String(rawTx.txnId),
    time: transactionTime,
    source: {
      name: ELF_SOURCE.name,
      itemId: item.itemId,
      fetchedAt: context.fetchedAt ?? Date.now()
    },
    asset: {
      id: item.itemId,
      name: item.name,
      gameDisplayName: item.gameDisplayName ?? item.name,
      sourceItemId: item.itemId,
      assetClass: item.assetClass ?? "Unclassified / Other",
      group: item.group,
      category: item.category
    },
    quantity,
    value: {
      total: totalValue,
      unit: unitValue,
      currency: ELF_SOURCE.currency,
      raw: Number(rawTx.totalAmount)
    },
    actors: participants,
    raw: rawTx,
    legacy: {
      itemId: item.itemId,
      itemName: item.name,
      assetClass: item.assetClass ?? "Unclassified / Other",
      itemGroup: item.group,
      category: item.category,
      itemNum: quantity,
      price: unitValue,
      orderType: rawTx.orderType,
      totalAmountSigil: totalValue,
      txnId: rawTx.txnId,
      txnTime: rawTx.txnTime,
      orderUserId: rawTx.orderUserId,
      orderUserName: rawTx.orderUserName,
      traderId: rawTx.traderId,
      traderName: rawTx.traderName,
      sellerId: participants.seller.id,
      sellerName: participants.seller.name,
      buyerId: participants.buyer.id,
      buyerName: participants.buyer.name
    }
  };
}

function assertElfTransactionShape(rawTx, item) {
  if (!rawTx || typeof rawTx !== "object") {
    throw createElfNormalizationError();
  }

  if (!item?.itemId || !item?.name) {
    throw createElfNormalizationError();
  }

  const quantity = Number(rawTx.itemNum);
  const totalAmount = Number(rawTx.totalAmount);
  const transactionTime = Number(rawTx.txnTime);
  const orderType = Number(rawTx.orderType);

  if (!hasValue(rawTx.txnId) || !Number.isFinite(transactionTime) || transactionTime <= 0) {
    throw createElfNormalizationError();
  }

  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(totalAmount) || totalAmount < 0) {
    throw createElfNormalizationError();
  }

  if (orderType !== 1 && orderType !== 2) {
    throw createElfNormalizationError();
  }

  if (!hasValue(rawTx.orderUserId) || !hasValue(rawTx.orderUserName)) {
    throw createElfNormalizationError();
  }

  if (!hasValue(rawTx.traderId) || !hasValue(rawTx.traderName)) {
    throw createElfNormalizationError();
  }
}

function mapElfParticipants(rawTx) {
  const orderUser = {
    id: String(rawTx.orderUserId),
    name: rawTx.orderUserName
  };
  const trader = {
    id: String(rawTx.traderId),
    name: rawTx.traderName
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

function normalizeElfTimestamp(value) {
  const timestamp = Number(value);
  return timestamp < 100000000000 ? timestamp * 1000 : timestamp;
}

function createElfNormalizationError() {
  const error = new TypeError("Unexpected API response format.");
  error.kind = "unexpected_api_response_format";
  return error;
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}
