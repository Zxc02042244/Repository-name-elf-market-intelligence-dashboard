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
  return inspectTransactionList(transactions).transactions;
}

export function inspectTransactionList(transactions) {
  if (!Array.isArray(transactions)) {
    throw new TypeError("MarketModel requires an array of normalized market transactions.");
  }

  const acceptedTransactions = [];
  const seenTransactionKeys = new Set();
  let rejectedCount = 0;
  let duplicateCount = 0;

  for (const transaction of transactions) {
    if (!isValidMarketTransaction(transaction)) {
      rejectedCount += 1;
      continue;
    }

    const transactionKey = createTransactionKey(transaction);

    if (seenTransactionKeys.has(transactionKey)) {
      duplicateCount += 1;
      continue;
    }

    seenTransactionKeys.add(transactionKey);
    acceptedTransactions.push(transaction);
  }

  return {
    transactions: acceptedTransactions,
    quality: {
      receivedCount: transactions.length,
      acceptedCount: acceptedTransactions.length,
      rejectedCount,
      duplicateCount
    }
  };
}

function createTransactionKey(transaction) {
  const sourceName = String(transaction.source?.name ?? "unknown").trim().toLowerCase();
  return `${sourceName}:${String(transaction.id).trim()}`;
}
