import { translations } from "./translations.js";

export const defaultLocale = "en";

export const supportedLocales = Object.freeze([
  "en",
  "zh-Hant",
  "ja",
  "ko",
  "vi"
]);

const localeAliases = Object.freeze({
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  zh: "zh-Hant",
  "zh-hant": "zh-Hant",
  "zh-tw": "zh-Hant",
  "zh-hk": "zh-Hant",
  ja: "ja",
  "ja-jp": "ja",
  ko: "ko",
  "ko-kr": "ko",
  vi: "vi",
  "vi-vn": "vi"
});

export function normalizeLocale(locale) {
  const rawLocale = String(locale ?? "").trim();

  if (!rawLocale) {
    return defaultLocale;
  }

  if (supportedLocales.includes(rawLocale)) {
    return rawLocale;
  }

  return localeAliases[rawLocale.toLowerCase()] ?? defaultLocale;
}

export function t(key, locale = defaultLocale, params = {}) {
  const normalizedLocale = normalizeLocale(locale);
  const localizedValue = readTranslation(translations[normalizedLocale], key);
  const fallbackValue = readTranslation(translations[defaultLocale], key);
  const template = typeof localizedValue === "string"
    ? localizedValue
    : typeof fallbackValue === "string"
      ? fallbackValue
      : String(key);

  return interpolate(template, params);
}

function readTranslation(dictionary, key) {
  return String(key ?? "")
    .split(".")
    .filter(Boolean)
    .reduce((value, part) => {
      if (!value || typeof value !== "object") {
        return undefined;
      }

      return Object.prototype.hasOwnProperty.call(value, part)
        ? value[part]
        : undefined;
    }, dictionary);
}

function interpolate(template, params) {
  return String(template).replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params ?? {}, name)
      ? String(params[name])
      : match
  ));
}
