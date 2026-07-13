export function readPublicServiceConfig(runtimeConfig = globalThis.window?.ELF_PUBLIC_CONFIG) {
  const config = runtimeConfig && typeof runtimeConfig === "object" ? runtimeConfig : {};

  return Object.freeze({
    supabaseUrl: normalizeUrl(config.supabaseUrl),
    supabasePublishableKey: normalizeText(config.supabasePublishableKey ?? config.supabaseAnonKey),
    skinApiUrl: normalizeUrl(config.skinApiUrl),
    fallbackSkinImageBaseUrl: normalizeUrl(config.fallbackSkinImageBaseUrl)
  });
}

export function hasCommunityServiceConfig(config = readPublicServiceConfig()) {
  return Boolean(config.supabaseUrl && config.supabasePublishableKey);
}

function normalizeUrl(value) {
  return normalizeText(value).replace(/\/+$/, "");
}

function normalizeText(value) {
  return String(value ?? "").trim();
}
