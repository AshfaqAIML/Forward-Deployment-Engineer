// src/db/index.js — database access layer. One adapter interface, two drivers:
//   * PostgreSQL (production): the standard `pg` driver against DATABASE_URL.
//   * PGlite (development/tests): real PostgreSQL compiled to WASM — the same
//     SQL, the same semantics, zero external server needed.
// The rest of the codebase only ever sees: query(sql, params) -> {rows},
// exec(sql) for multi-statement scripts, and transaction(fn).
import path from "node:path";
import { createRequire } from "node:module";

let current = null;

export function resolveDriver(cfg) {
  if (cfg.dbDriver === "pglite") return "pglite";
  if (cfg.dbDriver === "pg") return "pg";
  return cfg.databaseUrl ? "pg" : "pglite";
}

export async function getDb(cfg) {
  if (current) return current;
  const driver = resolveDriver(cfg);
  if (driver === "pglite") {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = cfg.pgliteDataDir ? await PGlite.create(cfg.pgliteDataDir) : new PGlite();
    current = {
      driver: "pglite",
      query: async (sql, params = []) => db.query(sql, params),
      exec: async (sql) => db.exec(sql),
      transaction: async (fn) => db.transaction(async (tx) => fn({
        query: (sql, params = []) => tx.query(sql, params),
        exec: (sql) => tx.exec(sql),
      })),
      close: async () => { await db.close(); current = null; },
    };
  } else {
    // Production driver: standard node-postgres pool. Imported lazily so the
    // dependency only matters when actually running against a PostgreSQL server.
    const require = createRequire(import.meta.url);
    let pg;
    try { pg = require("pg"); }
    catch { throw new Error("The 'pg' package is required for PostgreSQL mode: npm install pg"); }
    const pool = new pg.Pool({ connectionString: cfg.databaseUrl, max: 10 });
    current = {
      driver: "pg",
      query: async (sql, params = []) => pool.query(sql, params),
      exec: async (sql) => pool.query(sql),          // simple protocol: multi-statement OK
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const out = await fn({ query: (sql, params = []) => client.query(sql, params), exec: (sql) => client.query(sql) });
          await client.query("COMMIT");
          return out;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
      close: async () => { await pool.end(); current = null; },
    };
  }
  return current;
}

export function storagePath(cfg, key) {
  // storage_key is relative to the private storage dir; traversal is rejected.
  const resolved = path.resolve(cfg.storageDir, key);
  if (!resolved.startsWith(path.resolve(cfg.storageDir) + path.sep)) {
    throw new Error("invalid storage key");
  }
  return resolved;
}
