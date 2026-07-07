const SECRET_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /(token|secret|key|authorization)(\s*[:=]\s*)[^\s,;}]+/gi
];

export function createCollectorLogger({ quiet = false } = {}) {
  function write(level, message, details) {
    if (quiet && level === "info") {
      return;
    }

    const prefix = `[collector:${level}]`;
    const safeMessage = sanitizeLogText(message);
    const safeDetails = details ? ` ${sanitizeLogText(JSON.stringify(details))}` : "";
    const line = `${prefix} ${safeMessage}${safeDetails}`;

    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  return {
    info(message, details) {
      write("info", message, details);
    },
    warn(message, details) {
      write("warn", message, details);
    },
    error(message, details) {
      write("error", message, details);
    },
    summary(message, details) {
      write("summary", message, details);
    }
  };
}

export function sanitizeLogText(value) {
  let text = String(value ?? "");
  text = text.replace(SECRET_PATTERNS[0], "Bearer [redacted]");
  text = text.replace(SECRET_PATTERNS[1], "$1$2[redacted]");
  return text;
}
