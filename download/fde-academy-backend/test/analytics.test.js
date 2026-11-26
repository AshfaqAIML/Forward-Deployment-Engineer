// test/analytics.test.js — admin analytics reflect recorded reality; content
// health flags weak assessments; nothing is estimated or client-claimed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("overview counts match the seeded database and real activity", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    // two students generate real activity:
    const a = await h.registerUser();
    const b = await h.registerUser();
    await h.takeQuiz("quiz-fm-1", a.token, [2, 1, 1]);   // pass, 100
    await h.takeQuiz("quiz-fm-1", b.token, [0, 0, 0]);   // fail, 0
    const lessonId = (await h.call("GET", "/api/v1/catalog/lessons/fm-1", { token: a.token })).json.lesson.id;
    await h.call("POST", `/api/v1/me/progress/lessons/${lessonId}/complete`, { token: a.token, body: {} });
    await h.call("POST", "/api/v1/books/fm/downloads", { token: a.token, body: {} });

    const o = await h.call("GET", "/api/v1/admin/analytics/overview", { token: admin.token });
    assert.equal(o.status, 200);
    assert.equal(o.json.users.total, 5);                 // 3 demo + 2 registered
    assert.equal(o.json.users.new7d, 5);                 // all seeded within the last 7 days
    assert.equal(o.json.learning.attempts, 2);
    assert.equal(o.json.learning.avgScore, 50);          // (100 + 0) / 2
    assert.equal(o.json.learning.passRate, 50);
    assert.equal(o.json.learning.completions, 1);
    assert.equal(o.json.learning.downloads, 0); // records are written when a file is fetched (downloads.test.js)
    // cross-check directly against the database:
    const dbCount = await h.db.query(`SELECT count(*)::int AS n FROM users`);
    assert.equal(dbCount.rows[0].n, o.json.users.total);
  } finally { await h.close(); }
});

test("content health flags assessments averaging below 70%", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const a = await h.registerUser();
    const b = await h.registerUser();
    // both fail quiz-fm-1 → average 0:
    await h.takeQuiz("quiz-fm-1", a.token, [0, 0, 0]);
    await h.takeQuiz("quiz-fm-1", b.token, [0, 0, 0]);
    const health = await h.call("GET", "/api/v1/admin/analytics/content-health", { token: admin.token });
    assert.equal(health.status, 200);
    const weak = health.json.weak.find(w => w.quizCode === "quiz-fm-1");
    assert.ok(weak, "quiz-fm-1 must be flagged weak");
    assert.equal(weak.avgScore, 0);
    assert.equal(weak.attempts, 2);
    assert.equal(weak.title, "Knowledge check — The four operations, in real shops");
  } finally { await h.close(); }
});

test("analytics are admin-only and paginated user listing works", async () => {
  const h = await setup();
  try {
    const student = await h.registerUser();
    const r = await h.call("GET", "/api/v1/admin/analytics/overview", { token: student.token });
    assert.equal(r.status, 403);
    const admin = await h.loginDemo("admin");
    const page = await h.call("GET", "/api/v1/admin/users?limit=2&offset=0", { token: admin.token });
    assert.equal(page.status, 200);
    assert.equal(page.json.users.length, 2);
    assert.ok(page.json.total >= 4);
    // user rows include learning telemetry but no password material:
    assert.ok(page.json.users.every(u => !("password_hash" in u || "passwordHash" in u)));
  } finally { await h.close(); }
});

test("revision history endpoint lists snapshots", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const term = await h.call("GET", "/api/v1/glossary/break-even");
    await h.call("PUT", `/api/v1/admin/glossary/${term.json.term.id}`, {
      token: admin.token, body: { term: "Break-even", simple: "Where money in equals money out",
        detailed: term.json.term.detailed, example: term.json.term.example, category: "Mathematics" } });
    const revs = await h.call("GET", "/api/v1/admin/revisions?entity=glossary_term", { token: admin.token });
    assert.equal(revs.status, 200);
    assert.ok(revs.json.revisions.length >= 1);
  } finally { await h.close(); }
});
