export function formatValue(value, currency = "units") {
  return `${formatNumber(value)} ${currency}`;
}

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    minimumFractionDigits: options.minimumFractionDigits ?? 0
  }).format(value ?? 0);
}
