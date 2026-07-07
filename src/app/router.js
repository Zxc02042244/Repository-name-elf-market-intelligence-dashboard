export function getCurrentRoute() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const mode = params.get("mode");
  const sort = params.get("sort");

  return {
    name: "dashboard",
    mode: mode === "actors" ? "actors" : "assets",
    search: params.get("q") ?? "",
    sort: isSupportedSort(sort) ? sort : "value",
    assetId: params.get("asset") ?? "",
    actorId: params.get("actor") ?? ""
  };
}

export function buildRouteHash(route, overrides = {}) {
  const nextRoute = {
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
  return hash ? `#${hash}` : "#";
}

function isSupportedSort(sort) {
  return ["value", "activity", "latest", "name"].includes(sort);
}
