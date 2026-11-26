// test/passwordReset.test.js — recovery flow: generic responses (no account
// enumeration), hashed tokens at rest, single use, revocation of sessions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("reset request always answers the same, whether or not the account exists", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const known = await h.call("POST", "/api/v1/auth/password-reset/request", { body: { email: u.email } });
    const unknown = await h.call("POST", "/api/v1/auth/password-reset/request", { body: { email: "ghost@nowhere.io" } });
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(known.json.message, unknown.json.message);
    assert.equal(known.json.ok, unknown.json.ok);
    // dev/test mode exposes the token for the flow; for the unknown account no
    // token appears:
    assert.ok(known.json.devResetToken);
    assert.equal(unknown.json.devResetToken, undefined);
    // the stored value is a hash, never the raw token:
    const row = await h.db.query(`SELECT token_hash FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1`);
    assert.ok(row.rows[0].token_hash !== known.json.devResetToken);
    assert.equal(row.rows[0].token_hash.length, 64);
  } finally { await h.close(); }
});

test("confirm consumes the token, changes the password, kills sessions, single use", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const req = await h.call("POST", "/api/v1/auth/password-reset/request", { body: { email: u.email } });
    const token = req.json.devResetToken;
    const confirm = await h.call("POST", "/api/v1/auth/password-reset/confirm", {
      body: { token, newPassword: "NewPassword456" } });
    assert.equal(confirm.status, 200);
    // old password no longer works; the new one does:
    const oldLogin = await h.call("POST", "/api/v1/auth/login", { body: { email: u.email, password: u.password } });
    assert.equal(oldLogin.status, 401);
    const newLogin = await h.call("POST", "/api/v1/auth/login", { body: { email: u.email, password: "NewPassword456" } });
    assert.equal(newLogin.status, 200);
    // pre-reset refresh token is revoked:
    const refresh = await h.call("POST", "/api/v1/auth/refresh", { body: { refreshToken: u.refresh } });
    assert.equal(refresh.status, 401);
    // the token is single-use:
    const replay = await h.call("POST", "/api/v1/auth/password-reset/confirm", {
      body: { token, newPassword: "AnotherPass789" } });
    assert.equal(replay.status, 400);
  } finally { await h.close(); }
});

test("weak new passwords are rejected by the confirm endpoint", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const req = await h.call("POST", "/api/v1/auth/password-reset/request", { body: { email: u.email } });
    const r = await h.call("POST", "/api/v1/auth/password-reset/confirm", {
      body: { token: req.json.devResetToken, newPassword: "short1" } });
    assert.equal(r.status, 422);
  } finally { await h.close(); }
});

test("reset tokens expire", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const req = await h.call("POST", "/api/v1/auth/password-reset/request", { body: { email: u.email } });
    await h.db.query(`UPDATE password_reset_tokens SET expires_at = now() - interval '1 minute'`);
    const r = await h.call("POST", "/api/v1/auth/password-reset/confirm", {
      body: { token: req.json.devResetToken, newPassword: "NewPassword456" } });
    assert.equal(r.status, 400);
  } finally { await h.close(); }
});
