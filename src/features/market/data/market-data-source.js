const RESERVED_CAPABILITIES = Object.freeze([]);

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

  if (!isNonEmptyString(definition.id)) {
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
  return Boolean(dataSource && dataSource.kind !== "reserved" && typeof dataSource.load === "function");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
