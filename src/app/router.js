export function getCurrentRoute() {
  const rawHash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(rawHash);
  const mode = params.get("mode");
  const sort = params.get("sort");
  const isHome = rawHash === "" || rawHash === "home";

  return {
    name: isHome ? "home" : "dashboard",
    mode: mode === "actors" ? "actors" : "assets",
    search: params.get("q") ?? "",
    sort: isSupportedSort(sort) ? sort : "value",
    assetId: params.get("asset") ?? "",
    actorId: params.get("actor") ?? ""
  };
}

export function buildRouteHash(route, overrides = {}) {
  const nextRoute = {
    name: route.name,
    mode: route.mode,
    search: route.search,
    sort: route.sort,
    assetId: route.assetId,
    actorId: route.actorId,
    ...overrides
  };
  const params = new URLSearchParams();

  if (nextRoute.mode && nextRoute.mode !== "assets") {
    params.set("mode", nextRoute.mode);
  }

  if (nextRoute.search) {
    params.set("q", nextRoute.search);
  }

  if (nextRoute.sort && nextRoute.sort !== "value") {
    params.set("sort", nextRoute.sort);
  }

  if (nextRoute.assetId) {
    params.set("asset", nextRoute.assetId);
  }

  if (nextRoute.actorId) {
    params.set("actor", nextRoute.actorId);
  }

  const hash = params.toString();
  if (hash) {
    return `#${hash}`;
  }

  return nextRoute.name === "dashboard" ? "#market" : "#home";
}

function isSupportedSort(sort) {
  return ["value", "activity", "latest", "name"].includes(sort);
}
