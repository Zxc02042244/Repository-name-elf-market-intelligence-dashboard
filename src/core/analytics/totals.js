export function calculateTotals(transactions) {
  const sellers = new Set();
  const buyers = new Set();
  let totalVolume = 0;
  let latestTransactionTime = null;

  for (const transaction of transactions) {
    totalVolume += transaction.value.total;
    sellers.add(transaction.actors.seller.id);
    buyers.add(transaction.actors.buyer.id);
    latestTransactionTime = Math.max(latestTransactionTime ?? 0, transaction.time);
  }

  return {
    totalTransactions: transactions.length,
    totalVolume,
    activeSellers: sellers.size,
    activeBuyers: buyers.size,
    latestTransactionTime
  };
}
