import { createTransactionDedupeHash } from "./lib/collector-hash.mjs";
import { loadCollectorConfig, MOCK_RAW_TRANSACTIONS } from "./lib/collector-config.mjs";
import { createCollectorLogger } from "./lib/collector-logger.mjs";
import { createSupabaseClientFromEnv } from "./lib/supabase-client.mjs";
import {
  buildPriceSnapshotCandidate,
  normalizeElfHistoryTransaction
} from "./lib/elf-history-normalizer.mjs";

const logger = createCollectorLogger();

async function main() {
  const config = loadCollectorConfig(process.env);
  const startedAt = new Date();

  logger.info("Starting manual collector skeleton.", {
    dryRun: config.dryRun,
    itemLimit: config.itemLimit,
    concurrency: config.concurrency,
    runLabel: config.runLabel
  });

  if (config.forcedDryRun) {
    logger.warn("COLLECTOR_DRY_RUN=false was requested, but this skeleton is dry-run only.");
  }

  reportEnvironmentPreflight(config);
  const supabasePreflight = await createSupabaseClientFromEnv({
    dryRun: config.dryRun,
    env: process.env
  });
  reportSupabasePreflight(supabasePreflight);

  const run = {
    source: config.source,
    triggerType: "manual",
    status: "running",
    requestedItems: config.items.length,
    loadedItems: 0,
    failedItems: 0,
    transactionCandidates: 0,
    snapshotCandidates: 0,
    startedAt: startedAt.toISOString()
  };

  const allTransactionCandidates = [];
  const snapshotCandidates = [];

  for (const item of config.items) {
    try {
      const rawRows = collectMockRowsForItem(item);
      const candidates = rawRows.map((rawTx) => {
        const candidate = normalizeElfHistoryTransaction(rawTx, item, {
          source: config.source,
          collectedAt: startedAt.toISOString(),
          runLabel: config.runLabel
        });

        return {
          ...candidate,
          rawHash: createTransactionDedupeHash(candidate)
        };
      });
      const snapshot = buildPriceSnapshotCandidate(item, candidates, {
        source: config.source,
        bucketStart: getBucketStart(startedAt).toISOString(),
        bucketMinutes: 60
      });

      allTransactionCandidates.push(...candidates);
      snapshotCandidates.push(snapshot);
      run.loadedItems += 1;

      logger.info("Prepared item candidates.", {
        itemId: item.itemId,
        itemName: item.name,
        transactionCandidates: candidates.length,
        snapshotCandidates: 1
      });
    } catch (error) {
      run.failedItems += 1;
      logger.warn("Skipped item candidate preparation.", {
        itemId: item.itemId,
        itemName: item.name,
        reason: error.message
      });
    }
  }

  run.transactionCandidates = allTransactionCandidates.length;
  run.snapshotCandidates = snapshotCandidates.length;
  run.status = run.failedItems > 0 ? "partial" : "succeeded";
  run.finishedAt = new Date().toISOString();

  logger.summary("Dry-run write plan.", {
    collectorRuns: 1,
    items: config.items.length,
    marketTransactions: allTransactionCandidates.length,
    priceSnapshots: snapshotCandidates.length,
    supabaseStatus: supabasePreflight.status,
    databaseWrites: 0
  });
  logger.summary("Manual collector skeleton completed.", run);
}

function reportSupabasePreflight(preflight) {
  const details = {
    status: preflight.status,
    canWrite: preflight.canWrite,
    missingEnv: preflight.missingEnv
  };

  if (preflight.enabled) {
    logger.info("Supabase preflight ready for future writes.", details);
    return;
  }

  logger.warn(preflight.reason, details);
}

function reportEnvironmentPreflight(config) {
  for (const entry of config.envReport) {
    if (entry.present) {
      logger.info("Environment variable is present.", {
        name: entry.name,
        purpose: entry.purpose
      });
      continue;
    }

    logger.warn("Environment variable is not set; continuing because this skeleton is dry-run only.", {
      name: entry.name,
      purpose: entry.purpose
    });
  }
}

function collectMockRowsForItem(item) {
  return MOCK_RAW_TRANSACTIONS.map((row, index) => ({
    ...row,
    txnId: `${row.txnId}-${item.itemId}`,
    txnTime: Number(row.txnTime) + index,
    itemId: item.itemId
  }));
}

function getBucketStart(date) {
  const bucket = new Date(date);
  bucket.setUTCMinutes(0, 0, 0);
  return bucket;
}

main().catch((error) => {
  logger.error("Manual collector skeleton failed.", {
    reason: error.message
  });
  process.exitCode = 1;
});
