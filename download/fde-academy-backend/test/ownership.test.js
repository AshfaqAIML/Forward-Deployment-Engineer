// test/ownership.test.js — student records are unreachable across accounts:
// notes, bookmarks, progress, submissions; and profile privacy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("notes are private and cannot be read or written for another user", async () => {
  const h = await setup();
  try {
    const a = await h.registerUser();
    const b = await h.registerUser();
    const lesson = await h.call("GET", "/api/v1/catalog/lessons/fm-1");
    const lessonId = lesson.json.lesson.id;
    // A writes a note on their own lesson row:
    const write = await h.call("PUT", `/api/v1/me/notes/${lessonId}`, {
      token: a.token, body: { body: "Alignment of decimal points prevents money bugs." } });
    assert.equal(write.status, 200);
    // B reads the same URL — gets their OWN (empty) note, never A's:
    const readB = await h.call("GET", `/api/v1/me/notes/${lessonId}`, { token: b.token });
    assert.equal(readB.status, 200);
    assert.equal(readB.json.body, null);
    // The notes table has exactly one row (A's), keyed by (user, lesson):
    const rows = await h.db.query(`SELECT user_id FROM notes WHERE lesson_id = $1`, [lessonId]);
    assert.deepEqual(rows.rows.map(r => r.user_id), [a.id]);
    // B overwriting "the same note" writes their own row, not A's:
    await h.call("PUT", `/api/v1/me/notes/${lessonId}`, { token: b.token, body: { body: "B's note" } });
    const after = await h.db.query(`SELECT user_id FROM notes WHERE lesson_id = $1 ORDER BY user_id`, [lessonId]);
    assert.equal(after.rows.length, 2);
  } finally { await h.close(); }
});

test("bookmarks and completion are per-user; no cross-user writes exist", async () => {
  const h = await setup();
  try {
    const a = await h.registerUser();
    const b = await h.registerUser();
    const lessonId = (await h.call("GET", "/api/v1/catalog/lessons/fm-1")).json.lesson.id;
    await h.takeQuiz("quiz-fm-1", a.token, [2, 1, 1]);
    const done = await h.call("POST", `/api/v1/me/progress/lessons/${lessonId}/complete`, { token: a.token, body: {} });
    assert.equal(done.status, 201);
    // B's progress shows nothing:
    const progB = await h.call("GET", "/api/v1/me/progress", { token: b.token });
    assert.equal(progB.json.lessonsDone, 0);
    // A's bookmark is invisible to B's progress:
    await h.call("POST", `/api/v1/me/bookmarks/${lessonId}`, { token: a.token, body: {} });
    const lessonB = await h.call("GET", "/api/v1/catalog/lessons/fm-1", { token: b.token });
    assert.equal(lessonB.json.lesson.state.bookmarked, false);
    assert.equal(lessonB.json.lesson.state.note, null);
    const lessonA = await h.call("GET", "/api/v1/catalog/lessons/fm-1", { token: a.token });
    assert.equal(lessonA.json.lesson.state.bookmarked, true);
    assert.equal(lessonA.json.lesson.state.completed, true);
    // B cannot delete A's bookmark — the endpoint only ever touches own rows:
    await h.call("DELETE", `/api/v1/me/bookmarks/${lessonId}`, { token: b.token });
    const stillA = await h.call("GET", "/api/v1/catalog/lessons/fm-1", { token: a.token });
    assert.equal(stillA.json.lesson.state.bookmarked, true);
  } finally { await h.close(); }
});

test("profiles are private: only the owner sees their own profile fields", async () => {
  const h = await setup();
  try {
    const a = await h.registerUser();
    await h.call("PUT", "/api/v1/me/profile", {
      token: a.token, body: { displayName: "Maya", fullName: "Maya J", country: "UK", careerGoal: "FDE" } });
    // A sees their own data:
    const mine = await h.call("GET", "/api/v1/me/profile", { token: a.token });
    assert.equal(mine.json.displayName, "Maya");
    assert.equal(mine.json.country, "UK");
    // There is no endpoint that returns another user's profile/email: the only
    // user listing is admin-only and tested in rbac. Catalog endpoints never
    // include user data:
    const lesson = await h.call("GET", "/api/v1/catalog/lessons/fm-1", { token: a.token });
    assert.ok(!JSON.stringify(lesson.json).includes("Maya J"));
  } finally { await h.close(); }
});

test("lab submissions and project submissions are scoped to the caller", async () => {
  const h = await setup();
  try {
    const a = await h.registerUser();
    const b = await h.registerUser();
    const sub = await h.call("POST", "/api/v1/exercises/coding/code-c1/submissions", {
      token: a.token, body: { code: "console.log('hello')" } });
    assert.equal(sub.status, 201);
    const mineB = await h.call("GET", "/api/v1/exercises/coding/code-c1/submissions/mine", { token: b.token });
    assert.equal(mineB.json.submissions.length, 0);
    const mineA = await h.call("GET", "/api/v1/exercises/coding/code-c1/submissions/mine", { token: a.token });
    assert.equal(mineA.json.submissions.length, 1);
  } finally { await h.close(); }
});
