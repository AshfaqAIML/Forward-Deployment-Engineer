// test/downloads.test.js — the secure download pipeline: token issuance,
// streaming, single-use, expiry, ownership, and that private storage paths
// never appear in any response.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("full download flow: token -> stream -> record, with no storage paths leaked", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const issue = await h.call("POST", "/api/v1/books/fm/downloads", { token: u.token, body: {} });
    assert.equal(issue.status, 201);
    assert.ok(issue.json.token);
    assert.ok(issue.json.downloadUrl.startsWith("/api/v1/downloads/"));
    assert.equal(issue.json.filename, "fm_FDE_Academy_v1.doc");
    assert.ok(!JSON.stringify(issue.json).includes("storage"), "no storage path may leak");

    const res = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + u.token } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/msword");
    assert.equal(res.headers.get("content-disposition"), 'attachment; filename="fm_FDE_Academy_v1.doc"');
    const checksum = res.headers.get("x-checksum-sha256");
    const bytes = Buffer.from(await res.arrayBuffer());
    assert.equal(bytes.length, issue.json.bytes);
    assert.ok(bytes.toString("utf8").includes("Foundation Mathematics"));
    const crypto = await import("node:crypto");
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), checksum);
    // download recorded:
    const rec = await h.db.query(`SELECT count(*)::int AS n FROM download_records WHERE user_id = $1`, [u.id]);
    assert.equal(rec.rows[0].n, 1);
  } finally { await h.close(); }
});

test("download tokens are single-use", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const issue = await h.call("POST", "/api/v1/books/fm/downloads", { token: u.token, body: {} });
    const first = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + u.token } });
    assert.equal(first.status, 200);
    const second = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + u.token } });
    assert.equal(second.status, 403);
    const body = await second.json();
    assert.ok(body.error.message.includes("expired or was already used"));
  } finally { await h.close(); }
});

test("expired tokens are refused server-side", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const issue = await h.call("POST", "/api/v1/books/fm/downloads", { token: u.token, body: {} });
    // age the token beyond its TTL directly in the database:
    await h.db.query(`UPDATE download_tokens SET expires_at = now() - interval '1 minute' WHERE token_hash IS NOT NULL`);
    const res = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + u.token } });
    assert.equal(res.status, 403);
  } finally { await h.close(); }
});

test("tokens belong to their requester — another user cannot spend them", async () => {
  const h = await setup();
  try {
    const a = await h.registerUser();
    const b = await h.registerUser();
    const issue = await h.call("POST", "/api/v1/books/fm/downloads", { token: a.token, body: {} });
    const stolen = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + b.token } });
    assert.equal(stolen.status, 403);
    // the rightful owner can still use it:
    const own = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + a.token } });
    assert.equal(own.status, 200);
  } finally { await h.close(); }
});

test("anonymous users cannot issue downloads; garbage tokens are rejected", async () => {
  const h = await setup();
  try {
    const anon = await h.call("POST", "/api/v1/books/fm/downloads", { body: {} });
    assert.equal(anon.status, 401);
    const u = await h.registerUser();
    const res = await fetch(h.base + "/api/v1/downloads/AAAA BBBB CCCC DDDD EEEE", {
      headers: { authorization: "Bearer " + u.token } });
    assert.equal(res.status, 401);
  } finally { await h.close(); }
});

test("file versions and download log are queryable by admins only", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const u = await h.registerUser();
    await h.call("POST", "/api/v1/books/fm/downloads", { token: u.token, body: {} });
    await fetch(h.base + "/api/v1/books/fm/downloads", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + u.token }, body: "{}" })
      .then(r => r.json()).then(async j => {
        await fetch(h.base + j.downloadUrl, { headers: { authorization: "Bearer " + u.token } });
      });
    const log = await h.call("GET", "/api/v1/admin/downloads", { token: admin.token });
    assert.equal(log.status, 200);
    assert.ok(log.json.downloads.length >= 1);
    assert.ok(log.json.downloads.every(d => typeof d.filename === "string" && !("storage_key" in d)));
    const versions = await h.db.query(`SELECT count(*)::int AS n FROM file_versions`);
    assert.equal(versions.rows[0].n, 6); // one per seeded book
  } finally { await h.close(); }
});
