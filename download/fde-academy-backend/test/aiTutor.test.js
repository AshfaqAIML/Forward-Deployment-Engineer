// test/aiTutor.test.js — the optional AI tutor with the deterministic stub
// provider: grounding, citations, refusal path, progressive hints, practice
// labelling, permissions, privacy-safe logging.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("status endpoint is public and reports capabilities + disclaimer", async () => {
  const h = await setup();
  try {
    const r = await h.call("GET", "/api/v1/ai/tutor/status");
    assert.equal(r.status, 200);
    assert.equal(r.json.enabled, true);
    assert.equal(r.json.provider, "stub");
    assert.ok(r.json.modes.includes("math"));
    assert.ok(r.json.disclaimer.includes("never recorded as results"));
  } finally { await h.close(); }
});

test("tutor requires authentication and works for students", async () => {
  const h = await setup();
  try {
    const anon = await h.call("POST", "/api/v1/ai/tutor", { body: { message: "explain fractions" } });
    assert.equal(anon.status, 401);
    const u = await h.registerUser();
    const r = await h.call("POST", "/api/v1/ai/tutor", {
      token: u.token, body: { message: "Explain fractions in simpler words.", lessonCode: "fm-2", mode: "explain" } });
    assert.equal(r.status, 200);
    assert.equal(r.json.mode, "explain");
    assert.equal(r.json.provider, "stub");
    // grounded: pinned lesson retrieved and cited
    assert.equal(r.json.grounded, true);
    assert.ok(r.json.sources.some(s => s.kind === "lesson" && s.code === "fm-2"));
    assert.ok(r.json.answer.includes("grounded answer"));
    // educational explanations are ALWAYS distinguished from verified material:
    assert.ok(r.json.disclaimer.includes("not verified course content"));
  } finally { await h.close(); }
});

test("out-of-material questions take the refusal path", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const r = await h.call("POST", "/api/v1/ai/tutor", {
      token: u.token, body: { message: "xyzzyqwop blorptastic", mode: "explain" } });
    assert.equal(r.status, 200);
    assert.equal(r.json.grounded, false);
    assert.ok(r.json.answer.includes("not covered in the approved course material"));
  } finally { await h.close(); }
});

test("vocabulary questions retrieve the exact glossary term", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const r = await h.call("POST", "/api/v1/ai/tutor", {
      token: u.token, body: { message: "What does contribution margin mean?", mode: "vocabulary" } });
    assert.ok(r.json.sources.some(s => s.kind === "glossary" && s.code === "contribution-margin"),
      "the glossary term must be retrieved for vocabulary questions");
  } finally { await h.close(); }
});

test("progressive hints: authored first, AI beyond the authored set", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const first = await h.call("POST", "/api/v1/ai/tutor/hints", {
      token: u.token, body: { exerciseCode: "code-c1", hintIndex: 1 } });
    assert.equal(first.status, 200);
    assert.equal(first.json.authored, true);
    assert.ok(first.json.hint.includes("0.5"));
    const beyond = await h.call("POST", "/api/v1/ai/tutor/hints", {
      token: u.token, body: { exerciseCode: "code-c1", hintIndex: 4 } });
    assert.equal(beyond.status, 200);
    assert.equal(beyond.json.authored, false);          // AI-generated, grounded
    assert.ok(beyond.json.hint.includes("STUB TUTOR"));
    const missing = await h.call("POST", "/api/v1/ai/tutor/hints", {
      token: u.token, body: { exerciseCode: "code-zz", hintIndex: 1 } });
    assert.equal(missing.status, 404);
  } finally { await h.close(); }
});

test("practice generation is labelled and never recorded as a check", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const r = await h.call("POST", "/api/v1/ai/tutor/practice", {
      token: u.token, body: { lessonCode: "fm-1", count: 2 } });
    assert.equal(r.status, 200);
    assert.equal(r.json.practice, true);
    assert.equal(r.json.count, 2);
    assert.ok(r.json.note.includes("never"));
    const attempts = await h.db.query(`SELECT count(*)::int AS n FROM quiz_attempts WHERE user_id = $1`, [u.id]);
    assert.equal(attempts.rows[0].n, 0, "AI practice must never create graded attempts");
  } finally { await h.close(); }
});

test("error help and math steps modes reach the tutor", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const e = await h.call("POST", "/api/v1/ai/tutor/explain-error", {
      token: u.token, body: { error: "TypeError: x is undefined", code: "let y = x.price;" } });
    assert.equal(e.status, 200);
    const m = await h.call("POST", "/api/v1/ai/tutor/math-steps", {
      token: u.token, body: { problem: "6 rolls at 0.80, costs?", lessonCode: "fm-1" } });
    assert.equal(m.status, 200);
    assert.ok(m.json.sources.some(s => s.code === "fm-1"));
  } finally { await h.close(); }
});

test("usage is logged without message content (privacy)", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    await h.call("POST", "/api/v1/ai/tutor", {
      token: u.token, body: { message: "my secret question about margins", lessonCode: "fm-1" } });
    const events = await h.db.query(`SELECT meta FROM activity_events WHERE user_id = $1 AND kind = 'ai_tutor'`, [u.id]);
    assert.equal(events.rows.length, 1);
    const logged = JSON.stringify(events.rows[0].meta);
    assert.ok(!logged.includes("secret question"), "message content must never be logged");
    assert.equal(events.rows[0].meta.mode, "explain");
  } finally { await h.close(); }
});

test("input validation applies to tutor endpoints", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const r = await h.call("POST", "/api/v1/ai/tutor", { token: u.token, body: { message: "x" } });
    assert.equal(r.status, 422);
    const r2 = await h.call("POST", "/api/v1/ai/tutor", { token: u.token, body: { message: "hello", mode: "not-a-mode" } });
    assert.equal(r2.status, 422);
  } finally { await h.close(); }
});
