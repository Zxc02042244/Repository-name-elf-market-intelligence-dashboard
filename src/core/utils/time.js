import { DEFAULT_LOCALE } from "../../config/locale-config.js";

export function formatTime(timestamp, options = {}) {
  if (!timestamp) {
    return options.emptyText ?? "—";
  }

  return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}
