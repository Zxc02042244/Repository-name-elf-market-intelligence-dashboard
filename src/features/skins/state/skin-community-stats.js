import { PRODUCT_RULES } from "../../../config/product-config.js";
import { hasCommunityServiceConfig, readPublicServiceConfig } from "../../../config/service-config.js";
import {
  COMMUNITY_CREDENTIAL_REJECTION_CODE,
  CommunityCredentialError,
  createCommunityCredentialLifecycle
} from "./skin-community-credentials.js";

export const COMMUNITY_OPERATIONS = Object.freeze({
  sync: "sync",
  delete: "delete"
});

export class SkinCommunityRpcError extends Error {
  constructor({ operation, kind, status = 0, code = "" }) {
    super(operation === COMMUNITY_OPERATIONS.delete
      ? "Community data deletion could not be verified."
      : "Community wishlist sync could not be completed.");
    this.name = "SkinCommunityRpcError";
    this.operation = operation;
    this.kind = kind;
    this.status = normalizeHttpStatus(status);
    this.code = normalizeMachineCode(code);
  }
}

export function createSkinCommunityState() {
  const config = readCommunityConfig();

  return {
    status: config.enabled ? "idle" : "disabled",
    syncStatus: config.enabled ? "credential-ready" : "disabled",
    visitorCount: null,
    wishlistLeaders: [],
    detail: ""
  };
}

export async function syncSkinCommunityWishlist(selectedIdsOrProvider, options = {}) {
  const config = readCommunityConfig();

  if (!config.enabled) {
    return createSkinCommunityState();
  }

  const selectedIdsProvider = createSelectedIdsProvider(selectedIdsOrProvider);
  const lifecycle = options.lifecycle ?? createCommunityCredentialLifecycle();
  let committed;

  try {
    committed = lifecycle.ensureCommittedCredentials();
  } catch (error) {
    throw normalizeLifecycleError(error, COMMUNITY_OPERATIONS.sync);
  }

  const pending = lifecycle.readPendingCredentials(committed);
  if (pending) {
    if (isTerminalPending(pending)) {
      if (options.allowTerminalRotation !== true) {
        throw new SkinCommunityRpcError({
          operation: COMMUNITY_OPERATIONS.sync,
          kind: pending.retryState === "rejected"
            ? "pending-rejected"
            : "pending-attempt-unresolved",
          status: 409,
          code: COMMUNITY_CREDENTIAL_REJECTION_CODE
        });
      }

      return replaceTerminalPendingSync({
        lifecycle,
        config,
        committed,
        pending,
        selectedIdsProvider
      });
    }

    return resumePendingSync({
      lifecycle,
      config,
      committed,
      pending,
      selectedIdsProvider
    });
  }

  try {
    const payload = await requestCommunityRpc({
      config,
      operation: COMMUNITY_OPERATIONS.sync,
      credentials: committed,
      selectedIds: selectedIdsProvider()
    });
    return normalizeCommunityPayload(payload, "synced");
  } catch (error) {
    if (!isCredentialRejection(error)) {
      throw error;
    }
  }

  try {
    return await lifecycle.withRotationLock(async () => {
      const lockedCommitted = lifecycle.ensureCommittedCredentials();

      if (!sameCredentials(lockedCommitted, committed)) {
        const payload = await requestCommunityRpc({
          config,
          operation: COMMUNITY_OPERATIONS.sync,
          credentials: lockedCommitted,
          selectedIds: selectedIdsProvider()
        });
        return normalizeCommunityPayload(payload, "synced");
      }

      const lockedPending = lifecycle.createOrReusePendingCredentials(lockedCommitted);
      return retryPendingSync({
        lifecycle,
        config,
        pending: lockedPending,
        selectedIdsProvider
      });
    });
  } catch (error) {
    throw normalizeLifecycleError(error, COMMUNITY_OPERATIONS.sync);
  }
}

export async function forgetSkinCommunityData(options = {}) {
  const config = readCommunityConfig();
  const lifecycle = options.lifecycle ?? createCommunityCredentialLifecycle();

  if (!config.enabled) {
    throw new SkinCommunityRpcError({
      operation: COMMUNITY_OPERATIONS.delete,
      kind: "service-disabled"
    });
  }

  let candidates;
  try {
    candidates = lifecycle.readDeletionCandidates();
  } catch (error) {
    throw normalizeLifecycleError(error, COMMUNITY_OPERATIONS.delete);
  }

  if (candidates.length === 0) {
    throw new SkinCommunityRpcError({
      operation: COMMUNITY_OPERATIONS.delete,
      kind: "missing-credential"
    });
  }

  let firstFailure = null;
  let payload = null;
  for (const credentials of candidates) {
    try {
      payload = await requestCommunityRpc({
        config,
        operation: COMMUNITY_OPERATIONS.delete,
        credentials
      });
    } catch (error) {
      firstFailure ??= error;
    }
  }

  if (firstFailure) {
    throw firstFailure;
  }

  try {
    lifecycle.clearAllCredentials();
  } catch (error) {
    throw normalizeLifecycleError(error, COMMUNITY_OPERATIONS.delete);
  }

  return {
    ...normalizeCommunityPayload(payload, "synced"),
    status: "forgotten",
    detail: ""
  };
}

export function markSkinCommunityLoading(state) {
  return {
    ...state,
    status: "loading",
    syncStatus: "syncing",
    detail: ""
  };
}

export function markSkinCommunityError(state, error, operation = COMMUNITY_OPERATIONS.sync) {
  const normalized = error instanceof SkinCommunityRpcError
    ? error
    : new SkinCommunityRpcError({
      operation,
      kind: "unknown"
    });

  return {
    ...state,
    status: "error",
    syncStatus: operation === COMMUNITY_OPERATIONS.delete
      ? "deletion-unverified"
      : isTransientError(normalized)
        ? "offline/transient-error"
        : "failed",
    detail: ""
  };
}

export function isCredentialRejection(error) {
  return error instanceof SkinCommunityRpcError
    && error.operation === COMMUNITY_OPERATIONS.sync
    && error.status === 409
    && error.code === COMMUNITY_CREDENTIAL_REJECTION_CODE;
}

async function resumePendingSync({
  lifecycle,
  config,
  committed,
  pending,
  selectedIdsProvider
}) {
  try {
    return await lifecycle.withRotationLock(async () => {
      const lockedCommitted = lifecycle.ensureCommittedCredentials();

      if (!sameCredentials(lockedCommitted, committed)) {
        const payload = await requestCommunityRpc({
          config,
          operation: COMMUNITY_OPERATIONS.sync,
          credentials: lockedCommitted,
          selectedIds: selectedIdsProvider()
        });
        return normalizeCommunityPayload(payload, "synced");
      }

      const lockedPending = lifecycle.readPendingCredentials(lockedCommitted);
      if (!lockedPending || lockedPending.operationId !== pending.operationId) {
        const payload = await requestCommunityRpc({
          config,
          operation: COMMUNITY_OPERATIONS.sync,
          credentials: lockedCommitted,
          selectedIds: selectedIdsProvider()
        });
        return normalizeCommunityPayload(payload, "synced");
      }

      return retryPendingSync({
        lifecycle,
        config,
        pending: lockedPending,
        selectedIdsProvider
      });
    });
  } catch (error) {
    throw normalizeLifecycleError(error, COMMUNITY_OPERATIONS.sync);
  }
}

async function replaceTerminalPendingSync({
  lifecycle,
  config,
  committed,
  pending,
  selectedIdsProvider
}) {
  try {
    return await lifecycle.withRotationLock(async () => {
      const lockedCommitted = lifecycle.ensureCommittedCredentials();

      if (!sameCredentials(lockedCommitted, committed)) {
        const payload = await requestCommunityRpc({
          config,
          operation: COMMUNITY_OPERATIONS.sync,
          credentials: lockedCommitted,
          selectedIds: selectedIdsProvider()
        });
        return normalizeCommunityPayload(payload, "synced");
      }

      const lockedPending = lifecycle.readPendingCredentials(lockedCommitted);
      if (
        !lockedPending
        || lockedPending.operationId !== pending.operationId
        || !isTerminalPending(lockedPending)
      ) {
        throw new SkinCommunityRpcError({
          operation: COMMUNITY_OPERATIONS.sync,
          kind: "pending-rejected-changed"
        });
      }

      const replacement = lifecycle.replaceTerminalPendingCredentials(
        lockedCommitted,
        lockedPending
      );
      return retryPendingSync({
        lifecycle,
        config,
        pending: replacement,
        selectedIdsProvider
      });
    });
  } catch (error) {
    throw normalizeLifecycleError(error, COMMUNITY_OPERATIONS.sync);
  }
}

async function retryPendingSync({
  lifecycle,
  config,
  pending,
  selectedIdsProvider
}) {
  let attemptedPending;
  try {
    attemptedPending = lifecycle.markPendingAttempted(pending);
    const payload = await requestCommunityRpc({
      config,
      operation: COMMUNITY_OPERATIONS.sync,
      credentials: {
        id: attemptedPending.pendingVisitorId,
        token: attemptedPending.pendingVisitorToken
      },
      selectedIds: selectedIdsProvider()
    });

    lifecycle.commitPendingCredentials(attemptedPending);
    return normalizeCommunityPayload(payload, "credential-rotated");
  } catch (error) {
    const candidate = attemptedPending ?? pending;
    if (isCredentialRejection(error)) {
      try {
        lifecycle.markPendingRejected(candidate);
      } catch {
        // Preserve the last verifiable pending envelope when storage is unavailable.
      }
    } else if (isTransientError(error)) {
      try {
        lifecycle.markPendingAmbiguous(candidate);
      } catch {
        // The existing pending envelope remains the only replacement candidate.
      }
    }

    const normalized = error instanceof SkinCommunityRpcError
      ? error
      : normalizeLifecycleError(error, COMMUNITY_OPERATIONS.sync);

    throw new SkinCommunityRpcError({
      operation: COMMUNITY_OPERATIONS.sync,
      kind: isTransientError(normalized)
        ? "rotation-retry-transient"
        : "rotation-retry-failed",
      status: normalized.status,
      code: normalized.code
    });
  }
}

async function requestCommunityRpc({
  config,
  operation,
  credentials,
  selectedIds = []
}) {
  const rpcName = operation === COMMUNITY_OPERATIONS.delete
    ? "delete_skin_gallery_state"
    : "sync_skin_gallery_state";
  const requestBody = operation === COMMUNITY_OPERATIONS.delete
    ? {
      p_visitor_id: credentials.id,
      p_visitor_token: credentials.token
    }
    : {
      p_visitor_id: credentials.id,
      p_visitor_token: credentials.token,
      p_skin_ids: normalizeSelectedIds(selectedIds)
    };

  let response;
  try {
    response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${rpcName}`, {
      method: "POST",
      headers: {
        apikey: config.supabasePublishableKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
  } catch {
    throw new SkinCommunityRpcError({
      operation,
      kind: "network"
    });
  }

  let parsedBody;
  try {
    parsedBody = await readResponseBody(response);
  } catch {
    throw new SkinCommunityRpcError({
      operation,
      kind: "network"
    });
  }

  if (!response.ok) {
    throw new SkinCommunityRpcError({
      operation,
      kind: "http",
      status: response.status,
      code: parsedBody.validJson
        ? normalizeMachineCode(parsedBody.value?.code)
        : ""
    });
  }

  if (!parsedBody.validJson || !isValidCommunityPayload(parsedBody.value)) {
    throw new SkinCommunityRpcError({
      operation,
      kind: "invalid-payload",
      status: response.status
    });
  }

  return parsedBody.value;
}

async function readResponseBody(response) {
  if (typeof response?.text === "function") {
    const text = await response.text();
    try {
      return {
        validJson: true,
        value: JSON.parse(text)
      };
    } catch {
      return {
        validJson: false,
        value: null
      };
    }
  }

  if (typeof response?.json === "function") {
    try {
      return {
        validJson: true,
        value: await response.json()
      };
    } catch {
      return {
        validJson: false,
        value: null
      };
    }
  }

  return {
    validJson: false,
    value: null
  };
}

function normalizeCommunityPayload(payload, syncStatus) {
  return {
    status: "remote",
    syncStatus,
    visitorCount: payload.visitorCount,
    wishlistLeaders: payload.wishlistLeaders
      .slice(0, PRODUCT_RULES.rankingLimit)
      .map((leader) => ({
        skinId: leader.skinId.trim(),
        wishCount: leader.wishCount
      })),
    detail: ""
  };
}

function isValidCommunityPayload(payload) {
  return Boolean(
    payload
    && typeof payload === "object"
    && !Array.isArray(payload)
    && Number.isInteger(payload.visitorCount)
    && payload.visitorCount >= 0
    && Array.isArray(payload.wishlistLeaders)
    && payload.wishlistLeaders.every((leader) => (
      leader
      && typeof leader === "object"
      && typeof leader.skinId === "string"
      && leader.skinId.trim().length > 0
      && Number.isInteger(leader.wishCount)
      && leader.wishCount > 0
    ))
  );
}

function readCommunityConfig() {
  const publicConfig = readPublicServiceConfig();

  return {
    enabled: hasCommunityServiceConfig(publicConfig),
    supabaseUrl: publicConfig.supabaseUrl,
    supabasePublishableKey: publicConfig.supabasePublishableKey
  };
}

function createSelectedIdsProvider(selectedIdsOrProvider) {
  return typeof selectedIdsOrProvider === "function"
    ? () => normalizeSelectedIds(selectedIdsOrProvider())
    : () => normalizeSelectedIds(selectedIdsOrProvider);
}

function normalizeSelectedIds(selectedIds) {
  if (!Array.isArray(selectedIds)) {
    return [];
  }

  return [...new Set(
    selectedIds
      .map((selectedId) => String(selectedId ?? "").trim())
      .filter(Boolean)
  )].slice(0, PRODUCT_RULES.wishlistLimit);
}

function normalizeLifecycleError(error, operation) {
  if (error instanceof SkinCommunityRpcError) {
    return error;
  }

  if (error instanceof CommunityCredentialError) {
    return new SkinCommunityRpcError({
      operation,
      kind: error.kind
    });
  }

  return new SkinCommunityRpcError({
    operation,
    kind: "unknown"
  });
}

function isTransientError(error) {
  return error instanceof SkinCommunityRpcError
    && (
      error.kind === "network"
      || error.kind === "rotation-retry-transient"
      || error.status === 429
      || error.status >= 500
    );
}

function normalizeHttpStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0;
}

function normalizeMachineCode(value) {
  const code = String(value ?? "").trim();
  return /^[A-Z0-9_]{1,80}$/.test(code) ? code : "";
}

function sameCredentials(left, right) {
  return Boolean(
    left?.id
    && left?.token
    && left.id === right?.id
    && left.token === right?.token
  );
}

function isTerminalPending(pending) {
  return pending?.retryState === "rejected"
    || (pending?.retryState === "ready" && pending.attemptedAt !== null);
}
