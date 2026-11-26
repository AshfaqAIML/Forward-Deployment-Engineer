// test/validation.test.js — every endpoint validates; unknown fields are
// stripped; oversized or malformed bodies fail cleanly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("malformed JSON and wrong content-type are rejected with 400", async () => {
  const h = await setup();
  try {
    const res = await fetch(h.base + "/api/v1/auth/login", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{not json" });
    assert.equal(res.status, 400);
    const res2 = await fetch(h.base + "/api/v1/auth/login", {
      method: "POST", headers: { "content-type": "text/plain" }, body: "{}" });
    assert.equal(res2.status, 400);
  } finally { await h.close(); }
});

test("oversized bodies are refused (1MB limit)", async () => {
  const h = await setup();
  try {
    const big = "x".repeat(1024 * 1024 + 100);
    const res = await fetch(h.base + "/api/v1/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@t.io", password: big }) });
    assert.equal(res.status, 413);
  } finally { await h.close(); }
});

test("unknown fields are stripped — role escalation via registration is impossible", async () => {
  const h = await setup();
  try {
    const r = await h.call("POST", "/api/v1/auth/register", {
      body: { email: "escalate@t.io", password: "Password123", displayName: "Hacker",
              role: "admin", status: "active", emailVerified: true, score: 100 } });
    assert.equal(r.status, 201);
    assert.equal(r.json.user.role, "student");
    const row = await h.db.query(`SELECT role, status, email_verified FROM users WHERE email = 'escalate@t.io'`);
    assert.equal(row.rows[0].role, "student");
    assert.equal(row.rows[0].status, "active");
    assert.equal(row.rows[0].email_verified, false);
  } finally { await h.close(); }
});

test("field-level validation errors carry useful details (422)", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const bad = await h.call("PUT", "/api/v1/me/preferences", {
      token: u.token, body: { weeklyGoalSessions: 99, preferredSubjects: ["ok"], largeText: "yes", reducedMotion: false } });
    assert.equal(bad.status, 422);
    assert.ok(bad.json.error.details.some(d => d.field === "weeklyGoalSessions"));
    const bad2 = await h.call("PUT", "/api/v1/me/preferences", {
      token: u.token, body: { weeklyGoalSessions: 3, largeText: true } });
    assert.equal(bad2.status, 422);   // reducedMotion missing = required
  } finally { await h.close(); }
});

test("uuid path parameters are type-checked", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const r = await h.call("GET", "/api/v1/catalog/lessons/not-a-uuid-at-all", { token: u.token });
    assert.equal(r.status, 404);
    const note = await h.call("PUT", "/api/v1/me/notes/12345", { token: u.token, body: { body: "x".repeat(30) } });
    assert.equal(note.status, 400);
  } finally { await h.close(); }
});

test("note length cap is enforced at 2000 characters", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const lessonId = (await h.call("GET", "/api/v1/catalog/lessons/fm-1")).json.lesson.id;
    const r = await h.call("PUT", `/api/v1/me/notes/${lessonId}`, { token: u.token, body: { body: "x".repeat(2001) } });
    assert.equal(r.status, 422);
    const ok = await h.call("PUT", `/api/v1/me/notes/${lessonId}`, { token: u.token, body: { body: "x".repeat(2000) } });
    assert.equal(ok.status, 200);
  } finally { await h.close(); }
});
