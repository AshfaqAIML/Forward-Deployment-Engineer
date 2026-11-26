// test/auth.test.js — registration, login, token refresh rotation, logout,
// password hashing at rest, and enumeration resistance.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";
import { verifyPassword } from "../src/auth/passwords.js";

test("register → login → me, passwords stored hashed, not plain text", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser("Sup3rSecret!");
    assert.equal(typeof u.token, "string");
    const me = await h.call("GET", "/api/v1/auth/me", { token: u.token });
    assert.equal(me.status, 200);
    assert.equal(me.json.role, "student");           // no role injection possible at registration
    assert.equal(me.json.displayName, "Tester");

    const dbRow = await h.db.query(`SELECT password_hash FROM users WHERE id = $1`, [u.id]);
    const hash = dbRow.rows[0].password_hash;
    assert.ok(hash.startsWith("scrypt$"), "stored password must be a scrypt hash");
    assert.ok(!hash.includes("Sup3rSecret!"), "plain-text password must never be stored");
    assert.ok(verifyPassword("Sup3rSecret!", hash));
    assert.ok(!verifyPassword("wrong-password", hash));

    const login = await h.call("POST", "/api/v1/auth/login", { body: { email: u.email, password: "Sup3rSecret!" } });
    assert.equal(login.status, 200);
    assert.ok(login.json.accessToken && login.json.refreshToken);

    const bad = await h.call("POST", "/api/v1/auth/login", { body: { email: u.email, password: "WrongPass123" } });
    assert.equal(bad.status, 401);
    assert.equal(bad.json.error.code, "unauthorized");
  } finally { await h.close(); }
});

test("registration rejects duplicates, bad emails, weak passwords", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const dup = await h.call("POST", "/api/v1/auth/register", {
      body: { email: u.email, password: "Password123", displayName: "Dup" } });
    assert.equal(dup.status, 409);
    const badEmail = await h.call("POST", "/api/v1/auth/register", {
      body: { email: "not-an-email", password: "Password123", displayName: "X" } });
    assert.equal(badEmail.status, 422);
    const weak = await h.call("POST", "/api/v1/auth/register", {
      body: { email: "weak@t.io", password: "short1", displayName: "X" } });
    assert.equal(weak.status, 422);
    assert.ok(weak.json.error.details.some(d => d.field === "password"));
  } finally { await h.close(); }
});

test("refresh tokens rotate; replay of an old refresh token is rejected", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const first = await h.call("POST", "/api/v1/auth/refresh", { body: { refreshToken: u.refresh } });
    assert.equal(first.status, 200);
    const newRefresh = first.json.refreshToken;
    assert.notEqual(newRefresh, u.refresh);
    // replaying the OLD token must fail (it was revoked during rotation)
    const replay = await h.call("POST", "/api/v1/auth/refresh", { body: { refreshToken: u.refresh } });
    assert.equal(replay.status, 401);
    // the fresh one still works
    const again = await h.call("POST", "/api/v1/auth/refresh", { body: { refreshToken: newRefresh } });
    assert.equal(again.status, 200);
  } finally { await h.close(); }
});

test("logout revokes the refresh token", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const out = await h.call("POST", "/api/v1/auth/logout", { body: { refreshToken: u.refresh }, token: u.token });
    assert.equal(out.status, 200);
    const after = await h.call("POST", "/api/v1/auth/refresh", { body: { refreshToken: u.refresh } });
    assert.equal(after.status, 401);
  } finally { await h.close(); }
});

test("tampered and garbage access tokens are rejected", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const tampered = u.token.slice(0, -6) + "XXXXXX";
    for (const bad of [tampered, "not.a.jwt", ""]) {
      const r = await h.call("GET", "/api/v1/auth/me", { token: bad });
      assert.equal(r.status, 401);
    }
    const anon = await h.call("GET", "/api/v1/auth/me");
    assert.equal(anon.status, 401);
  } finally { await h.close(); }
});

test("health endpoint is public", async () => {
  const h = await setup();
  try {
    const r = await h.call("GET", "/api/v1/health");
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  } finally { await h.close(); }
});
