// test/quizIntegrity.test.js — THE core security requirement: students cannot
// change quiz results or other users' records. Score is computed server-side
// from the database's own answer flags; no client input can influence it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

const Q = "quiz-fm-1"; // 3 questions: correct options at indexes 2, 1, 1

test("quiz delivery never leaks correct answers or explanations", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const r = await h.call("GET", `/api/v1/assessments/quizzes/${Q}`, { token: u.token });
    assert.equal(r.status, 200);
    const dump = JSON.stringify(r.json);
    assert.ok(!dump.includes("is_correct"), "is_correct must never be serialized");
    assert.ok(!dump.includes("isCorrect"));
    assert.ok(!dump.includes("explanation"), "explanations arrive only with a graded result");
    for (const q of r.json.questions) {
      assert.ok(q.options.length >= 2);
      for (const o of q.options) assert.deepEqual(Object.keys(o).sort(), ["id", "position", "text"]);
    }
  } finally { await h.close(); }
});

test("all-correct answers score 100 and pass; all-wrong scores 0 — computed server-side", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const right = await h.takeQuiz(Q, u.token, [2, 1, 1]);
    assert.equal(right.status, 200);
    assert.equal(right.json.score, 100);
    assert.equal(right.json.passed, true);
    assert.equal(right.json.correctCount, 3);
    // explanations and correct answers only in the graded result:
    assert.ok(right.json.questions.every(q => q.explanation));
    assert.ok(right.json.questions.every(q => q.correctOptionId));

    const wrong = await h.takeQuiz(Q, u.token, [0, 0, 0]);
    assert.equal(wrong.json.score, 0);
    assert.equal(wrong.json.passed, false);
  } finally { await h.close(); }
});

test("a forged score in the request body is ignored — there is no such field", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const quiz = await h.call("GET", `/api/v1/assessments/quizzes/${Q}`, { token: u.token });
    const at = await h.call("POST", `/api/v1/assessments/quizzes/${quiz.json.quiz.id}/attempts`, { token: u.token, body: {} });
    // classic tamper attempts — all must be inert:
    await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/answers`, {
      token: u.token,
      body: { answers: quiz.json.questions.map(q => ({ questionId: q.id, optionId: q.options[0].id })),
              score: 100, passed: true, status: "submitted", userId: "00000000-0000-0000-0000-000000000000" },
    });
    const submit = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/submit`, {
      token: u.token, body: { score: 100, passed: true } });
    assert.equal(submit.status, 200);
    assert.equal(submit.json.score, 0, "server computed the real score: all chosen options are wrong");
    assert.equal(submit.json.passed, false);
    // database agrees with the server, not the client:
    const row = await h.db.query(`SELECT score, passed, user_id FROM quiz_attempts WHERE id = $1`, [at.json.attemptId]);
    assert.equal(row.rows[0].score, 0);
    assert.equal(row.rows[0].user_id, u.id);
  } finally { await h.close(); }
});

test("answers referencing options from a different question or quiz are rejected", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const fm = await h.call("GET", `/api/v1/assessments/quizzes/${Q}`, { token: u.token });
    const st = await h.call("GET", `/api/v1/assessments/quizzes/quiz-st-1`, { token: u.token });
    const at = await h.call("POST", `/api/v1/assessments/quizzes/${fm.json.quiz.id}/attempts`, { token: u.token, body: {} });
    // option from ANOTHER quiz's question:
    const foreign = st.json.questions[0].options[1];
    const r = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/answers`, {
      token: u.token, body: { answers: [{ questionId: fm.json.questions[0].id, optionId: foreign.id }] } });
    assert.equal(r.status, 422);
    // option from the same quiz but a different question:
    const otherQ = fm.json.questions[1].options[0];
    const r2 = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/answers`, {
      token: u.token, body: { answers: [{ questionId: fm.json.questions[0].id, optionId: otherQ.id }] } });
    assert.equal(r2.status, 422);
  } finally { await h.close(); }
});

test("another user's attempt is invisible and cannot be answered or submitted", async () => {
  const h = await setup();
  try {
    const a = await h.registerUser();
    const b = await h.registerUser();
    const quiz = await h.call("GET", `/api/v1/assessments/quizzes/${Q}`, { token: a.token });
    const at = await h.call("POST", `/api/v1/assessments/quizzes/${quiz.json.quiz.id}/attempts`, { token: a.token, body: {} });
    // user B tries to read, answer, and submit user A's attempt:
    const read = await h.call("GET", `/api/v1/assessments/attempts/${at.json.attemptId}`, { token: b.token });
    assert.equal(read.status, 404, "existence must not be disclosed to other users");
    const answer = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/answers`, {
      token: b.token, body: { answers: [{ questionId: quiz.json.questions[0].id, optionId: quiz.json.questions[0].options[0].id }] } });
    assert.equal(answer.status, 404);
    const submit = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/submit`, { token: b.token, body: {} });
    assert.equal(submit.status, 404);
    // A can still submit their own attempt:
    const mine = await h.takeQuiz(Q, a.token, [2, 1, 1]);
    assert.equal(mine.status, 200);
  } finally { await h.close(); }
});

test("a submitted attempt cannot be resubmitted or re-answered", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const quiz = await h.call("GET", `/api/v1/assessments/quizzes/${Q}`, { token: u.token });
    const at = await h.call("POST", `/api/v1/assessments/quizzes/${quiz.json.quiz.id}/attempts`, { token: u.token, body: {} });
    await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/answers`, {
      token: u.token, body: { answers: quiz.json.questions.map(q => ({ questionId: q.id, optionId: q.options[0].id })) } });
    const first = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/submit`, { token: u.token, body: {} });
    assert.equal(first.status, 200);
    const second = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/submit`, { token: u.token, body: {} });
    assert.equal(second.status, 409);
    const reAnswer = await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/answers`, {
      token: u.token, body: { answers: [{ questionId: quiz.json.questions[0].id, optionId: quiz.json.questions[0].options[2].id }] } });
    assert.equal(reAnswer.status, 409);
  } finally { await h.close(); }
});

test("lesson completion is granted only through a passing attempt", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const lesson = await h.call("GET", `/api/v1/catalog/lessons/fm-1`, { token: u.token });
    const lessonId = lesson.json.lesson.id;
    // 1) fail the quiz first
    const failed = await h.takeQuiz(Q, u.token, [0, 0, 0]);
    assert.equal(failed.json.passed, false);
    const noComplete = await h.call("POST", `/api/v1/me/progress/lessons/${lessonId}/complete`, { token: u.token, body: {} });
    assert.equal(noComplete.status, 403);
    // 2) pass it, then completion succeeds
    await h.takeQuiz(Q, u.token, [2, 1, 1]);
    const complete = await h.call("POST", `/api/v1/me/progress/lessons/${lessonId}/complete`, { token: u.token, body: {} });
    assert.equal(complete.status, 201);
    // 3) progress endpoint reflects the verified completion
    const prog = await h.call("GET", "/api/v1/me/progress", { token: u.token });
    assert.equal(prog.json.lessonsDone, 1);
    const fmCourse = prog.json.courses.find(c => c.code === "fm");
    assert.equal(fmCourse.lessonsDone, 1);
    assert.equal(fmCourse.pct, Math.round(100 / 6));
    // 4) completion is idempotent
    const again = await h.call("POST", `/api/v1/me/progress/lessons/${lessonId}/complete`, { token: u.token, body: {} });
    assert.equal(again.status, 200);
    assert.equal(again.json.already, true);
  } finally { await h.close(); }
});
