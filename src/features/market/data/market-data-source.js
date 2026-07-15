const RESERVED_CAPABILITIES = Object.freeze([]);
const PUBLIC_DATA_SOURCE_STATES = new WeakSet();

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

  if (!isNonEmptyString(definition.id)) {
    throw new TypeError("Market data source requires a stable id.");
  }

  const kind = definition.kind === undefined ? "adapter" : definition.kind;
  const capabilities = normalizeCapabilities(definition.capabilities);

  if (!isNonEmptyString(kind)) {
    throw new TypeError("Market data source requires a valid kind.");
  }

  if (typeof definition.load !== "function") {
    throw new TypeError("Market data source requires a load function.");
  }

  return Object.freeze({
    id: definition.id.trim(),
    kind: kind.trim(),
    capabilities,
    load: definition.load
  });
}

export function isMarketDataSourceReady(dataSource) {
  if (PUBLIC_DATA_SOURCE_STATES.has(dataSource)) {
    return dataSource.available === true;
  }

  return isMarketDataSourceLoadable(dataSource);
}

export function isMarketDataSourceLoadable(dataSource) {
  return Boolean(
    dataSource &&
    dataSource.kind !== "reserved" &&
    typeof dataSource.load === "function"
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
  if (!dataSource || typeof dataSource !== "object") {
    throw new TypeError("Market data source state requires a source object.");
  }

  if (!isNonEmptyString(dataSource.id)) {
    throw new TypeError("Market data source state requires a stable id.");
  }

  const kind = dataSource.kind === undefined ? "adapter" : dataSource.kind;

  if (!isNonEmptyString(kind)) {
    throw new TypeError("Market data source state requires a valid kind.");
  }

  const capabilities = normalizeCapabilities(dataSource.capabilities);
  const state = Object.freeze({
    id: dataSource.id.trim(),
    kind: kind.trim(),
    capabilities,
    available: isMarketDataSourceLoadable(dataSource)
  });

  PUBLIC_DATA_SOURCE_STATES.add(state);
  return state;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeCapabilities(capabilities = []) {
  if (!Array.isArray(capabilities) || !capabilities.every(isNonEmptyString)) {
    throw new TypeError("Market data source capabilities must be non-empty strings.");
  }

  return Object.freeze([...new Set(capabilities.map((capability) => capability.trim()))]);
}
