import { createHash } from "node:crypto";

export function createStableHash(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function createTransactionDedupeHash(candidate) {
  return createStableHash({
    source: candidate.source,
    itemId: candidate.item.itemId,
    transactionId: candidate.transaction.transactionId,
    transactionTime: candidate.transaction.transactionTime,
    quantity: candidate.quantity,
    totalValue: candidate.value.total,
    sellerId: candidate.actors.seller.id,
    buyerId: candidate.actors.buyer.id,
    currency: candidate.value.currency
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
