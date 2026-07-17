import { STORAGE_KEYS } from "../../../config/product-config.js";

export const COMMUNITY_CREDENTIAL_REJECTION_CODE = "ELF_VISITOR_CREDENTIAL_REJECTED";
export const COMMUNITY_ROTATION_LOCK_NAME = "elfSkinGallery.visitorRotation.v1";
export const COMMUNITY_PENDING_CREDENTIAL_VERSION = 2;
export const COMMUNITY_PENDING_CREDENTIAL_TTL_MS = 24 * 60 * 60 * 1000;
export const COMMUNITY_PENDING_CLOCK_SKEW_MS = 5 * 60 * 1000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PENDING_RETRY_STATES = new Set(["ready", "ambiguous", "synced", "rejected"]);
const GENERATION_ATTEMPTS = 4;

export class CommunityCredentialError extends Error {
  constructor(kind) {
    super("Community credential storage is unavailable.");
    this.name = "CommunityCredentialError";
    this.kind = kind;
  }
}

export function createCommunityCredentialLifecycle(options = {}) {
  const storage = options.storage ?? globalThis.window?.localStorage;
  const cryptoProvider = options.crypto ?? globalThis.window?.crypto;
  const locks = options.locks ?? globalThis.window?.navigator?.locks;
  const now = typeof options.now === "function" ? options.now : () => Date.now();

  return Object.freeze({
    ensureCommittedCredentials() {
      recoverPartialCredentialCommit(storage, now);
      const stored = readCommittedCredentials(storage);

      if (stored.id && stored.token && stored.id !== stored.token) {
        return stored;
      }

      const generated = generateCredentialPair(cryptoProvider);
      const next = {
        id: stored.id || generated.id,
        token: stored.token && stored.token !== stored.id
          ? stored.token
          : generated.token
      };

      if (next.id === next.token) {
        next.token = generateUuidV4(cryptoProvider, new Set([next.id]));
      }

      writeAndVerifyCommittedCredentials(storage, next);
      return next;
    },

    readCommittedCredentials() {
      recoverPartialCredentialCommit(storage, now);
      return readCommittedCredentials(storage);
    },

    readPendingCredentials(committed) {
      return readPendingCredentials(storage, committed, now);
    },

    readDeletionCandidates() {
      const committed = readCommittedCredentials(storage);
      const pending = readPendingCredentials(storage, null, now);
      const candidates = [];

      if (pending) {
        addUniqueCredential(candidates, basePair(pending));
        if (pending.attemptedAt !== null) {
          addUniqueCredential(candidates, pendingPair(pending));
        }
        if (!isPendingCommitCombination(committed, pending)) {
          addUniqueCredential(candidates, committed);
        }
      } else {
        addUniqueCredential(candidates, committed);
      }

      return candidates;
    },

    createOrReusePendingCredentials(committed) {
      const existing = readPendingCredentials(storage, committed, now);

      if (existing) {
        return existing;
      }

      return createFreshPendingCredentials(storage, cryptoProvider, now, committed);
    },

    replaceTerminalPendingCredentials(committed, terminalPending) {
      const current = readPendingCredentials(storage, committed, now);
      if (
        !current
        || current.operationId !== terminalPending.operationId
        || !isTerminalPending(current)
      ) {
        throw new CommunityCredentialError("pending-replacement-changed");
      }

      return createFreshPendingCredentials(storage, cryptoProvider, now, committed);
    },

    markPendingAttempted(pending) {
      const next = {
        ...pending,
        attemptedAt: pending.attemptedAt ?? now()
      };
      writePendingCredentials(storage, next);
      return next;
    },

    markPendingAmbiguous(pending) {
      const next = {
        ...pending,
        retryState: "ambiguous"
      };
      writePendingCredentials(storage, next);
      return next;
    },

    markPendingRejected(pending) {
      const next = {
        ...pending,
        retryState: "rejected"
      };
      writePendingCredentials(storage, next);
      return next;
    },

    commitPendingCredentials(pending) {
      const syncedPending = {
        ...pending,
        retryState: "synced"
      };
      writePendingCredentials(storage, syncedPending);

      try {
        writeAndVerifyCommittedCredentials(storage, pendingPair(syncedPending));
        removeStorageValue(storage, STORAGE_KEYS.skinVisitorPending);
      } catch (error) {
        try {
          writeAndVerifyCommittedCredentials(storage, basePair(syncedPending));
        } catch {
          // The synced pending envelope remains available for recovery on reload.
        }
        throw error;
      }

      return pendingPair(syncedPending);
    },

    clearAllCredentials() {
      removeStorageValue(storage, STORAGE_KEYS.skinVisitorPending);
      removeStorageValue(storage, STORAGE_KEYS.skinVisitorToken);
      removeStorageValue(storage, STORAGE_KEYS.skinVisitor);

      if (
        readStorageValue(storage, STORAGE_KEYS.skinVisitorPending)
        || readStorageValue(storage, STORAGE_KEYS.skinVisitorToken)
        || readStorageValue(storage, STORAGE_KEYS.skinVisitor)
      ) {
        throw new CommunityCredentialError("storage-clear-failed");
      }
    },

    async withRotationLock(callback) {
      if (!locks || typeof locks.request !== "function") {
        throw new CommunityCredentialError("rotation-lock-unavailable");
      }

      return locks.request(
        COMMUNITY_ROTATION_LOCK_NAME,
        { mode: "exclusive" },
        callback
      );
    }
  });
}

export function generateCredentialPair(cryptoProvider, excluded = new Set()) {
  const id = generateUuidV4(cryptoProvider, excluded);
  const token = generateUuidV4(cryptoProvider, new Set([...excluded, id]));
  return { id, token };
}

export function isUuidV4(value) {
  return UUID_V4_PATTERN.test(String(value ?? "").trim().toLowerCase());
}

function generateUuidV4(cryptoProvider, excluded = new Set()) {
  const normalizedExcluded = new Set(
    [...excluded].map((value) => String(value ?? "").trim().toLowerCase())
  );

  if (typeof cryptoProvider?.randomUUID === "function") {
    for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
      const candidate = String(cryptoProvider.randomUUID() ?? "").trim().toLowerCase();
      if (isUuidV4(candidate) && !normalizedExcluded.has(candidate)) {
        return candidate;
      }
    }
  }

  if (typeof cryptoProvider?.getRandomValues === "function") {
    for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
      const bytes = new Uint8Array(16);
      cryptoProvider.getRandomValues(bytes);

      if (bytes.every((byte) => byte === 0)) {
        continue;
      }

      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const candidate = formatUuid(bytes);

      if (!normalizedExcluded.has(candidate)) {
        return candidate;
      }
    }
  }

  throw new CommunityCredentialError("secure-random-unavailable");
}

function recoverPartialCredentialCommit(storage, now) {
  const pending = readPendingCredentials(storage, null, now);

  if (!pending) {
    return;
  }

  const committed = readCommittedCredentials(storage);
  const candidate = pendingPair(pending);
  const base = basePair(pending);

  if (pending.retryState === "synced") {
    if (!sameCredentials(committed, candidate)) {
      try {
        writeAndVerifyCommittedCredentials(storage, candidate);
      } catch {
        writeAndVerifyCommittedCredentials(storage, base);
        return;
      }
    }
    removeStorageValue(storage, STORAGE_KEYS.skinVisitorPending);
    return;
  }

  const hasCandidatePart = committed.id === candidate.id || committed.token === candidate.token;
  if (hasCandidatePart && !sameCredentials(committed, candidate)) {
    writeAndVerifyCommittedCredentials(storage, base);
  }
}

function readCommittedCredentials(storage) {
  return {
    id: normalizeStoredUuid(readStorageValue(storage, STORAGE_KEYS.skinVisitor)),
    token: normalizeStoredUuid(readStorageValue(storage, STORAGE_KEYS.skinVisitorToken))
  };
}

function readPendingCredentials(storage, committed, now) {
  const raw = readStorageValue(storage, STORAGE_KEYS.skinVisitorPending);

  if (!raw) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    removeStorageValue(storage, STORAGE_KEYS.skinVisitorPending);
    return null;
  }

  const pending = normalizePendingCredentials(parsed);
  const currentTime = now();
  if (!pending || !isPendingTimeValid(pending, currentTime)) {
    removeStorageValue(storage, STORAGE_KEYS.skinVisitorPending);
    return null;
  }

  if (
    committed
    && (
      pending.baseVisitorId !== committed.id
      || pending.baseVisitorToken !== committed.token
    )
  ) {
    removeStorageValue(storage, STORAGE_KEYS.skinVisitorPending);
    return null;
  }

  return pending;
}

function normalizePendingCredentials(value) {
  const pending = value && typeof value === "object" ? value : {};
  const normalized = {
    version: Number(pending.version),
    operationId: normalizeStoredUuid(pending.operationId),
    baseVisitorId: normalizeStoredUuid(pending.baseVisitorId),
    baseVisitorToken: normalizeStoredUuid(pending.baseVisitorToken),
    pendingVisitorId: normalizeStoredUuid(pending.pendingVisitorId),
    pendingVisitorToken: normalizeStoredUuid(pending.pendingVisitorToken),
    createdAt: pending.createdAt,
    attemptedAt: pending.attemptedAt ?? null,
    retryState: String(pending.retryState ?? "")
  };

  if (
    normalized.version !== COMMUNITY_PENDING_CREDENTIAL_VERSION
    || !isUuidV4(normalized.operationId)
    || !normalized.baseVisitorId
    || !normalized.baseVisitorToken
    || !isUuidV4(normalized.pendingVisitorId)
    || !isUuidV4(normalized.pendingVisitorToken)
    || normalized.pendingVisitorId === normalized.pendingVisitorToken
    || !Number.isSafeInteger(normalized.createdAt)
    || normalized.createdAt <= 0
    || (
      normalized.attemptedAt !== null
      && (
        !Number.isSafeInteger(normalized.attemptedAt)
        || normalized.attemptedAt <= 0
      )
    )
    || (
      normalized.retryState !== "ready"
      && normalized.attemptedAt === null
    )
    || !PENDING_RETRY_STATES.has(normalized.retryState)
  ) {
    return null;
  }

  return normalized;
}

function writePendingCredentials(storage, pending) {
  writeStorageValue(
    storage,
    STORAGE_KEYS.skinVisitorPending,
    JSON.stringify(pending)
  );

  const verificationTime = Math.max(pending.createdAt, pending.attemptedAt ?? pending.createdAt);
  const verified = readPendingCredentials(storage, basePair(pending), () => verificationTime);
  if (
    !verified
    || verified.operationId !== pending.operationId
    || verified.retryState !== pending.retryState
    || verified.attemptedAt !== pending.attemptedAt
  ) {
    throw new CommunityCredentialError("pending-storage-failed");
  }
}

function createFreshPendingCredentials(storage, cryptoProvider, now, committed) {
  const pair = generateCredentialPair(cryptoProvider, new Set([committed.id, committed.token]));
  const pending = {
    version: COMMUNITY_PENDING_CREDENTIAL_VERSION,
    operationId: generateUuidV4(
      cryptoProvider,
      new Set([committed.id, committed.token, pair.id, pair.token])
    ),
    baseVisitorId: committed.id,
    baseVisitorToken: committed.token,
    pendingVisitorId: pair.id,
    pendingVisitorToken: pair.token,
    createdAt: now(),
    attemptedAt: null,
    retryState: "ready"
  };

  writePendingCredentials(storage, pending);
  return pending;
}

function writeAndVerifyCommittedCredentials(storage, credentials) {
  writeStorageValue(storage, STORAGE_KEYS.skinVisitorToken, credentials.token);
  writeStorageValue(storage, STORAGE_KEYS.skinVisitor, credentials.id);

  if (!sameCredentials(readCommittedCredentials(storage), credentials)) {
    throw new CommunityCredentialError("credential-storage-failed");
  }
}

function readStorageValue(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    throw new CommunityCredentialError("storage-read-failed");
  }
}

function writeStorageValue(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    throw new CommunityCredentialError("storage-write-failed");
  }

  if (storage?.getItem(key) !== String(value)) {
    throw new CommunityCredentialError("storage-write-failed");
  }
}

function removeStorageValue(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    throw new CommunityCredentialError("storage-remove-failed");
  }

  if (storage?.getItem(key) !== null) {
    throw new CommunityCredentialError("storage-remove-failed");
  }
}

function normalizeStoredUuid(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return UUID_PATTERN.test(normalized) ? normalized : "";
}

function formatUuid(bytes) {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function pendingPair(pending) {
  return {
    id: pending.pendingVisitorId,
    token: pending.pendingVisitorToken
  };
}

function basePair(pending) {
  return {
    id: pending.baseVisitorId,
    token: pending.baseVisitorToken
  };
}

function sameCredentials(left, right) {
  return Boolean(
    left?.id
    && left?.token
    && left.id === right?.id
    && left.token === right?.token
  );
}

function addUniqueCredential(candidates, credentials) {
  if (!credentials?.id || !credentials?.token || credentials.id === credentials.token) {
    return;
  }

  if (!candidates.some((candidate) => sameCredentials(candidate, credentials))) {
    candidates.push({
      id: credentials.id,
      token: credentials.token
    });
  }
}

function isPendingTimeValid(pending, currentTime) {
  if (!Number.isSafeInteger(currentTime) || currentTime <= 0) {
    return false;
  }

  const age = currentTime - pending.createdAt;
  if (
    age < -COMMUNITY_PENDING_CLOCK_SKEW_MS
    || age > COMMUNITY_PENDING_CREDENTIAL_TTL_MS
  ) {
    return false;
  }

  if (pending.attemptedAt === null) {
    return true;
  }

  return (
    pending.attemptedAt >= pending.createdAt - COMMUNITY_PENDING_CLOCK_SKEW_MS
    && pending.attemptedAt <= currentTime + COMMUNITY_PENDING_CLOCK_SKEW_MS
  );
}

function isTerminalPending(pending) {
  return pending.retryState === "rejected"
    || (pending.retryState === "ready" && pending.attemptedAt !== null);
}

function isPendingCommitCombination(committed, pending) {
  if (!committed?.id || !committed?.token) {
    return false;
  }

  const possibleIds = new Set([pending.baseVisitorId, pending.pendingVisitorId]);
  const possibleTokens = new Set([pending.baseVisitorToken, pending.pendingVisitorToken]);
  return possibleIds.has(committed.id) && possibleTokens.has(committed.token);
}
