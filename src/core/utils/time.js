export function formatTime(timestamp) {
  if (!timestamp) {
    return "No transactions";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}
