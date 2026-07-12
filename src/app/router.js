export function getCurrentRoute() {
  const rawHash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(rawHash);
  const routeToken = rawHash.split("&", 1)[0];
  const mode = params.get("mode");
  const sort = params.get("sort");
  const isHome = rawHash === "" || routeToken === "home";

  return {
    name: isHome ? "home" : "dashboard",
    tab: isSupportedHomeTab(params.get("tab")) ? params.get("tab") : "wishlist",
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
    tab: route.tab,
    mode: route.mode,
    search: route.search,
    sort: route.sort,
    assetId: route.assetId,
    actorId: route.actorId,
    ...overrides
  };
  const params = new URLSearchParams();

  if (nextRoute.name === "home" && nextRoute.tab && nextRoute.tab !== "wishlist") {
    params.set("tab", nextRoute.tab);
  }

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
  const routeName = nextRoute.name === "dashboard" ? "market" : "home";
  return hash ? `#${routeName}&${hash}` : `#${routeName}`;
}

function isSupportedSort(sort) {
  return ["value", "activity", "latest", "name"].includes(sort);
}

function isSupportedHomeTab(tab) {
  return ["wishlist", "supply", "gallery"].includes(tab);
}
