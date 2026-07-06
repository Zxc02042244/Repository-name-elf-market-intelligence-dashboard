import { ELF_SOURCE } from "./elf-config.js";
import { getElfBetaItem } from "./elf-items.js";
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
    source: ELF_SOURCE.label,
    fetchedAt,
    transactions
  };
}
