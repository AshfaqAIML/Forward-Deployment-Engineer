// test/migrations.test.js — the migration runner: applies everything cleanly,
// is idempotent, reverts and re-applies, and detects tampering.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { getDb, resolveDriver } from "../src/db/index.js";
import { migrate } from "../src/db/migrate.js";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIG = path.join(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

function makeDb() {
  return {
    driver: "pglite",
    query: (sql, params = []) => pgl.query(sql, params),
    exec: (sql) => pgl.exec(sql),
    transaction: async (fn) => pgl.transaction(async tx => fn({
      query: (sql, params = []) => tx.query(sql, params), exec: (sql) => tx.exec(sql) })),
    close: async () => {},
  };
}
let pgl;

test("migrations apply, are idempotent, and create the full schema", async () => {
  pgl = new PGlite();
  const db = makeDb();
  const up = await migrate(db, "up");
  assert.equal(up.applied.length, 11);
  const again = await migrate(db, "up");
  assert.equal(again.applied.length, 0, "already-applied migrations must be skipped");
  const t = await db.query(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`);
  assert.ok(t.rows[0].n >= 39, "full schema present");
  const v = await db.query(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='VIEW'`);
  assert.equal(v.rows[0].n, 5);   // book progress, content health, download log, subject mastery, course mastery
});

test("migrations revert cleanly and can be re-applied", async () => {
  const db = makeDb();
  const down = await migrate(db, "down", 2);
  assert.equal(down.reverted.length, 2);
  const up = await migrate(db, "up");
  assert.equal(up.applied.length, 2);
  // revert EVERYTHING then re-apply everything:
  const downAll = await migrate(db, "down", 99);
  assert.equal(downAll.reverted.length, 11);
  const upAll = await migrate(db, "up");
  assert.equal(upAll.applied.length, 11);
});

test("tampering with an applied migration is detected", async () => {
  const db = makeDb();
  await migrate(db, "up");
  const file = path.join(MIG, "0001_users.up.sql");
  const original = readFileSync(file, "utf8");
  try {
    writeFileSync(file, original + "\n-- tampered\n", "utf8");
    await assert.rejects(() => migrate(db, "up"), /modified since it was applied/);
  } finally {
    writeFileSync(file, original, "utf8");
  }
});

test("status lists applied and pending migrations", async () => {
  pgl = new PGlite();
  const db = makeDb();
  const before = await migrate(db, "status");
  assert.equal(before.filter(r => r.applied).length, 0);
  await migrate(db, "up", 3);
  const mid = await migrate(db, "status");
  assert.equal(mid.filter(r => r.applied).length, 3);
  assert.equal(mid.filter(r => !r.applied).length, 8);
});

test("driver resolution: DATABASE_URL selects pg, otherwise pglite", () => {
  assert.equal(resolveDriver({ dbDriver: "auto", databaseUrl: "postgres://x" }), "pg");
  assert.equal(resolveDriver({ dbDriver: "auto", databaseUrl: "" }), "pglite");
  assert.equal(resolveDriver({ dbDriver: "pglite", databaseUrl: "postgres://x" }), "pglite");
});
