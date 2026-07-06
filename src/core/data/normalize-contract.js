export function isValidMarketTransaction(transaction) {
  return Boolean(
    transaction &&
      transaction.id &&
      Number.isFinite(transaction.time) &&
      transaction.asset?.id &&
      transaction.asset?.name &&
      Number.isFinite(transaction.quantity) &&
      Number.isFinite(transaction.value?.total) &&
      Number.isFinite(transaction.value?.unit) &&
      transaction.value?.currency &&
      transaction.actors?.seller?.id &&
      transaction.actors?.buyer?.id
  );
}

export function normalizeTransactionList(transactions) {
  if (!Array.isArray(transactions)) {
    throw new TypeError("MarketModel requires an array of normalized market transactions.");
  }

  return transactions.filter(isValidMarketTransaction);
}
