const RESERVED_CAPABILITIES = Object.freeze([]);
const STABLE_SOURCE_FIELD_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

export const MARKET_REQUIRED_CAPABILITIES = Object.freeze(["transactions"]);

export function createReservedMarketDataSource() {
  return Object.freeze({
    id: "market-api-reserved",
    kind: "reserved",
    capabilities: RESERVED_CAPABILITIES,
    load: null
  });
}

export function defineMarketDataSource(definition) {
  if (!definition || typeof definition !== "object") {
    throw new TypeError("Market data source definition must be an object.");
  }

  if (!isStableSourceField(definition.id)) {
    throw new TypeError("Market data source requires a stable id.");
  }

  if (typeof definition.load !== "function") {
    throw new TypeError("Market data source requires a load function.");
  }

  return Object.freeze({
    id: definition.id.trim(),
    kind: definition.kind ?? "adapter",
    capabilities: Object.freeze([...new Set(definition.capabilities ?? [])]),
    load: definition.load
  });
}

export function isMarketDataSourceReady(dataSource) {
  return Boolean(
    dataSource &&
    dataSource.kind !== "reserved" &&
    (dataSource.available === true || typeof dataSource.load === "function")
  );
}

export function hasMarketDataSourceCapabilities(
  dataSource,
  requiredCapabilities = MARKET_REQUIRED_CAPABILITIES
) {
  if (!Array.isArray(dataSource?.capabilities) || !Array.isArray(requiredCapabilities)) {
    return false;
  }

  return requiredCapabilities.every((capability) => dataSource.capabilities.includes(capability));
}

export function createMarketDataSourceState(dataSource) {
  const capabilities = Array.isArray(dataSource?.capabilities)
    ? [...new Set(dataSource.capabilities.filter(isStableSourceField).map((value) => value.trim()))]
    : [];

  return Object.freeze({
    id: isStableSourceField(dataSource?.id) ? dataSource.id.trim() : "unknown",
    kind: isStableSourceField(dataSource?.kind) ? dataSource.kind.trim() : "adapter",
    capabilities: Object.freeze(capabilities),
    available: isMarketDataSourceReady(dataSource)
  });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStableSourceField(value) {
  return isNonEmptyString(value) && STABLE_SOURCE_FIELD_PATTERN.test(value.trim());
}
