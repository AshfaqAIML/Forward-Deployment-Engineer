// src/logger.js — structured JSON logging with secret redaction. One line per
// event so stdout is shippable to any log aggregator.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const REDACT = new Set(["password", "newpassword", "confirmpassword", "passwordhash",
  "token", "accesstoken", "refreshtoken", "resettoken", "authorization", "secret",
  "jwtsecret", "cookie", "downloadtoken"]);

function redact(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[REDACT.has(k.toLowerCase().replace(/[^a-z]/g, "")) ? k + ":[REDACTED]" : k] = redact(v);
  }
  return out;
}

export function createLogger({ level = "info", base = {} } = {}) {
  const threshold = LEVELS[level] ?? 20;
  function write(lvl, msg, fields) {
    if (LEVELS[lvl] < threshold) return;
    const line = { ts: new Date().toISOString(), level: lvl, msg, ...base, ...redact(fields || {}) };
    const out = JSON.stringify(line);
    (lvl === "error" ? console.error : console.log)(out);
  }
  return {
    debug: (m, f) => write("debug", m, f),
    info: (m, f) => write("info", m, f),
    warn: (m, f) => write("warn", m, f),
    error: (m, f) => write("error", m, f),
    child: (extra) => createLogger({ level, base: { ...base, ...extra } }),
  };
}
