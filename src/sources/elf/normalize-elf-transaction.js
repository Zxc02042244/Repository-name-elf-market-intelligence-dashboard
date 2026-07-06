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
    throw new TypeError("Unexpected API response format: transaction must be an object.");
  }

  if (!item?.itemId || !item?.name) {
    throw new TypeError("Unexpected API response format: item metadata is missing.");
  }

  const quantity = Number(rawTx.itemNum);
  const totalAmount = Number(rawTx.totalAmount);
  const transactionTime = Number(rawTx.txnTime);
  const orderType = Number(rawTx.orderType);

  if (!rawTx.txnId || !Number.isFinite(transactionTime)) {
    throw new TypeError("Unexpected API response format: transaction id or time is missing.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(totalAmount)) {
    throw new TypeError("Unexpected API response format: quantity or total amount is invalid.");
  }

  if (orderType !== 1 && orderType !== 2) {
    throw new TypeError("Unexpected API response format: order type is unsupported.");
  }

  if (!rawTx.orderUserId || !rawTx.traderId) {
    throw new TypeError("Unexpected API response format: participant fields are missing.");
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
