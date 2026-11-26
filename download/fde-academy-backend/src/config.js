// src/config.js — environment loading and validation. All secrets come from the
// environment; .env.example documents every variable. Fail-fast in production.
import crypto from "node:crypto";
import path from "node:path";

function bool(v, dflt) { if (v === undefined || v === "") return dflt; return v === "1" || v === "true"; }
function int(v, dflt, { min, max } = {}) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return dflt;
  if (min !== undefined && n < min) return dflt;
  if (max !== undefined && n > max) return dflt;
  return n;
}

const env = process.env;
const isProd = (env.NODE_ENV || "development") === "production";

// JWT secret: required in production; in development/tests a random ephemeral
// secret is generated (tokens die with the process — safe for local use).
let jwtSecret = env.FDE_JWT_SECRET || "";
if (!jwtSecret) {
  if (isProd) {
    throw new Error("FDE_JWT_SECRET must be set in production (generate with: openssl rand -hex 48)");
  }
  jwtSecret = crypto.randomBytes(32).toString("hex");
}

export const config = {
  env: env.NODE_ENV || "development",
  isProd,
  host: env.FDE_HOST || "127.0.0.1",
  port: int(env.FDE_PORT, 8787, { min: 1, max: 65535 }),

  // Database: 'auto' picks pg when DATABASE_URL is set, otherwise PGlite
  // (embedded real PostgreSQL) for development and tests.
  dbDriver: env.FDE_DB || "auto",
  databaseUrl: env.DATABASE_URL || "",
  pgliteDataDir: env.FDE_PGLITE_DIR || "",           // empty = in-memory (tests)

  jwtSecret,
  accessTokenTtlMinutes: int(env.FDE_ACCESS_TOKEN_TTL_MIN, 15, { min: 1, max: 1440 }),
  refreshTokenTtlDays: int(env.FDE_REFRESH_TOKEN_TTL_DAYS, 30, { min: 1, max: 365 }),
  passwordResetTtlMinutes: int(env.FDE_PASSWORD_RESET_TTL_MIN, 60, { min: 5, max: 1440 }),
  downloadTokenTtlMinutes: int(env.FDE_DOWNLOAD_TOKEN_TTL_MIN, 10, { min: 1, max: 120 }),

  // Private file storage (resolved absolute). Never exposed by the API;
  // downloads stream through signed single-use tokens.
  storageDir: path.resolve(env.FDE_STORAGE_DIR || "storage"),

  logLevel: env.FDE_LOG_LEVEL || (isProd ? "info" : "debug"),

  // CORS: the origin the static frontend is served from (empty = same-origin).
  corsOrigin: env.FDE_CORS_ORIGIN || "",

  // Bundled single-page frontend served at "/" (path, resolved absolute).
  // Empty string disables bundling; the SPA may instead be served by a CDN.
  staticFile: path.resolve(env.FDE_STATIC_FILE || "public/index.html"),

  // Optional AI tutor (grounded in the curriculum). Provider: auto | sdk | cli | stub.
  aiTutorEnabled: env.FDE_AI_TUTOR !== "off",
  aiProvider: env.FDE_AI_PROVIDER || "auto",

  // Dev/test conveniences that are HARD-OFF in production:
  exposeResetTokens: !isProd && bool(env.FDE_EXPOSE_RESET_TOKENS, false),
  seedDemoUsers: !isProd && bool(env.FDE_SEED_DEMO_USERS, false),

  // Explicitly setting a hard-off flag in production is an operator error:
  // fail fast instead of silently ignoring the instruction (docs promise
  // "config refuses to boot"). Unset flags are simply off — no problem.
  productionUnsafeFlags: isProd ? [
    ...(bool(env.FDE_SEED_DEMO_USERS, false) ? ["FDE_SEED_DEMO_USERS"] : []),
    ...(bool(env.FDE_EXPOSE_RESET_TOKENS, false) ? ["FDE_EXPOSE_RESET_TOKENS"] : []),
  ] : [],
};

export function validateConfigForProduction() {
  const problems = [];
  if (config.jwtSecret.length < 32) problems.push("FDE_JWT_SECRET too short (use >= 32 bytes of entropy)");
  if (!config.databaseUrl) problems.push("DATABASE_URL must point at your PostgreSQL server in production");
  if (config.seedDemoUsers) problems.push("demo users must not be seeded in production");
  if (config.exposeResetTokens) problems.push("reset-token exposure must be disabled in production");
  if (config.productionUnsafeFlags.length) {
    problems.push("these dev/test flags are hard-off in production but were explicitly set (unset them): "
      + config.productionUnsafeFlags.join(", "));
  }
  return problems;
}
