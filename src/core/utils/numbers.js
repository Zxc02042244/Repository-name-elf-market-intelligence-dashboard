import { DEFAULT_LOCALE } from "../../config/locale-config.js";

export function formatValue(value, currency = "units", options = {}) {
  return `${formatNumber(value, options)} ${currency}`.trim();
}

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat(options.locale ?? DEFAULT_LOCALE, {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits ?? 0
  }).format(value ?? 0);
}
