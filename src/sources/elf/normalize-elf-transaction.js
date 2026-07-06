import { ELF_SOURCE } from "./elf-config.js";

export function normalizeElfTransaction(rawTx, item, context = {}) {
  const quantity = Number(rawTx.itemNum);
  const totalValue = Number(rawTx.totalAmount) / 1e9;
  const unitValue = quantity > 0 ? totalValue / quantity : 0;
  const participants = mapElfParticipants(rawTx);

  return {
    id: String(rawTx.txnId),
    time: Number(rawTx.txnTime),
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
