#!/usr/bin/env node
// src/db/migrate.js — migration runner. Usage:
//   node src/db/migrate.js up [n]     apply next n (default: all) migrations
//   node src/db/migrate.js down [n]   revert last n (default: 1)
//   node src/db/migrate.js status     list applied/pending migrations
// Every migration runs inside a transaction and is recorded with a checksum;
// editing an applied migration is detected and refused.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { getDb } from "./index.js";
import { config } from "../config.js";
import { createLogger } from "../logger.js";

const log = createLogger({ level: config.logLevel, base: { component: "migrate" } });
const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../migrations");

function loadMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".up.sql"))
    .sort()
    .map(name => {
      const version = name.replace(/\.up\.sql$/, "");
      const up = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
      let down = "";
      try { down = readFileSync(path.join(MIGRATIONS_DIR, version + ".down.sql"), "utf8"); } catch {}
      return { version, up, down, checksum: crypto.createHash("sha256").update(up).digest("hex") };
    });
}

async function ensureBookkeeping(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now(), checksum text NOT NULL)`);
}

async function appliedMap(db) {
  const r = await db.query("SELECT version, checksum FROM schema_migrations");
  return new Map(r.rows.map(row => [row.version, row.checksum]));
}

export async function migrate(db, direction = "up", steps = Infinity) {
  await ensureBookkeeping(db);
  const files = loadMigrations();
  const done = await appliedMap(db);
  // Tamper detection: an applied migration whose file changed since application.
  for (const m of files) {
    if (done.has(m.version) && done.get(m.version) !== m.checksum) {
      throw new Error(`migration ${m.version} has been modified since it was applied`);
    }
  }
  if (direction === "up") {
    const pending = files.filter(m => !done.has(m.version)).slice(0, steps);
    for (const m of pending) {
      await db.transaction(async tx => {
        await tx.exec(m.up);
        await tx.query("INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)", [m.version, m.checksum]);
      });
      log.info("migration applied", { version: m.version });
    }
    return { applied: pending.map(m => m.version) };
  }
  if (direction === "down") {
    const appliedOrdered = files.filter(m => done.has(m.version)).slice(-steps);
    for (const m of appliedOrdered.reverse()) {
      if (!m.down) throw new Error(`no down migration for ${m.version}`);
      await db.transaction(async tx => {
        await tx.exec(m.down);
        await tx.query("DELETE FROM schema_migrations WHERE version = $1", [m.version]);
      });
      log.info("migration reverted", { version: m.version });
    }
    return { reverted: appliedOrdered.map(m => m.version) };
  }
  if (direction === "status") {
    return files.map(m => ({ version: m.version, applied: done.has(m.version) }));
  }
  throw new Error("direction must be up, down or status");
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  const direction = process.argv[2] || "up";
  const steps = process.argv[3] ? parseInt(process.argv[3], 10) : Infinity;
  const db = await getDb(config);
  try {
    const result = await migrate(db, direction, steps);
    if (direction === "status") {
      for (const r of result) console.log(`${r.applied ? "applied  " : "pending  "} ${r.version}`);
    } else {
      console.log(JSON.stringify(result, null, 1));
    }
  } finally {
    await db.close();
  }
}
