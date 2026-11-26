// test/progress.test.js — verified progress, streak computation from real
// activity days, book reading progress, and the dashboard rollup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("dashboard progress is computed from recorded activity, never client claims", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    // complete the Stage-1 orientation lessons, then fm-1 (Stage 2):
    for (const code of ["st-1", "st-2", "st-3"]) {
      await h.takeQuiz(`quiz-${code}`, u.token, [1, 1, 1]);
      const id = (await h.call("GET", `/api/v1/catalog/lessons/${code}`, { token: u.token })).json.lesson.id;
      const c = await h.call("POST", `/api/v1/me/progress/lessons/${id}/complete`, { token: u.token, body: {} });
      assert.equal(c.status, 201);
    }
    await h.takeQuiz("quiz-fm-1", u.token, [2, 1, 1]);
    const lessonId = (await h.call("GET", "/api/v1/catalog/lessons/fm-1")).json.lesson.id;
    await h.call("POST", `/api/v1/me/progress/lessons/${lessonId}/complete`, { token: u.token, body: {} });
    const prog = await h.call("GET", "/api/v1/me/progress", { token: u.token });
    assert.equal(prog.json.lessonsDone, 4);
    assert.equal(prog.json.lessonsTotal, 34);
    assert.equal(prog.json.overallPct, Math.round(400 / 34));
    assert.equal(prog.json.currentStageNumber, 2);       // still stage 2 lessons left
    assert.equal(prog.json.recommendedLesson.code, "fm-2");
    assert.ok(prog.json.recentAttempts.length >= 1);
    assert.equal(prog.json.projectsSubmitted, 0);
    // active days come from real events:
    assert.ok(prog.json.activeDaysThisWeek >= 1);
  } finally { await h.close(); }
});

test("streak counts distinct activity days from the audit trail", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    // backdate login events across three consecutive days:
    await h.db.query(`
      INSERT INTO activity_events (user_id, kind, at) VALUES
        ($1, 'login', now() - interval '2 days'),
        ($1, 'login', now() - interval '1 day')`, [u.id]);
    const prog = await h.call("GET", "/api/v1/me/progress", { token: u.token });
    assert.ok(prog.json.activeDaysThisWeek >= 3, "3 distinct days recorded");
  } finally { await h.close(); }
});

test("book chapter reading marks progress and the view aggregates it", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const book = await h.call("GET", "/api/v1/books/fm", { token: u.token });
    assert.equal(book.status, 200);
    assert.equal(book.json.chapters.length, 8);
    // open + explicitly read chapters 1-3:
    for (const pos of [1, 2, 3]) {
      const r = await h.call("GET", `/api/v1/books/fm/chapters/${pos}`, { token: u.token });
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.json.chapter.content));
      const mark = await h.call("POST", `/api/v1/books/fm/chapters/${pos}/read`, { token: u.token, body: {} });
      assert.equal(mark.status, 200);
    }
    const list = await h.call("GET", "/api/v1/books", { token: u.token });
    const fm = list.json.books.find(b => b.slug === "fm");
    assert.equal(fm.progress.chaptersRead, 3);
    assert.equal(fm.progress.chaptersTotal, 8);
    assert.equal(fm.progress.pct, 38);
    const prog = await h.call("GET", "/api/v1/me/progress", { token: u.token });
    const row = prog.json.books.find(b => b.slug === "fm");
    assert.equal(row.chaptersRead, 3);
    // unread toggle works:
    await h.call("POST", "/api/v1/books/fm/chapters/3/read", { token: u.token, body: { read: false } });
    const after = await h.call("GET", "/api/v1/books", { token: u.token });
    assert.equal(after.json.books.find(b => b.slug === "fm").progress.chaptersRead, 2);
  } finally { await h.close(); }
});

test("history feed lists recorded events", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    await h.call("GET", "/api/v1/catalog/lessons/fm-1", { token: u.token });   // logs lesson_view
    await h.takeQuiz("quiz-fm-1", u.token, [2, 1, 1]);
    const hist = await h.call("GET", "/api/v1/me/history?limit=10", { token: u.token });
    assert.equal(hist.status, 200);
    const kinds = hist.json.events.map(e => e.kind);
    assert.ok(kinds.includes("lesson_view"));
    assert.ok(kinds.includes("quiz_submit"));
  } finally { await h.close(); }
});

test("time-limited mock exam rejects late submission", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const quiz = await h.call("GET", "/api/v1/assessments/quizzes/mock-a", { token: u.token });
    assert.equal(quiz.json.quiz.timeLimitMinutes, 25);
    const at = await h.call("POST", `/api/v1/assessments/quizzes/${quiz.json.quiz.id}/attempts`, { token: u.token, body: {} });
    await h.db.query(`UPDATE quiz_attempts SET started_at = now() - interval '30 minutes' WHERE id = $1`, [at.json.attemptId]);
    const submit = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/submit`, { token: u.token, body: {} });
    assert.equal(submit.status, 403);
    const row = await h.db.query(`SELECT status FROM quiz_attempts WHERE id = $1`, [at.json.attemptId]);
    assert.equal(row.rows[0].status, "abandoned");
  } finally { await h.close(); }
});
