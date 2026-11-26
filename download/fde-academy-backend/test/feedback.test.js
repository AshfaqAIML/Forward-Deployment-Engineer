// test/feedback.test.js — knowledge-check feedback: incorrect path (why
// incorrect + why correct + simpler example + lesson link), correct path
// (why correct + next challenge), practice mode, graded-attempt feedback.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("practice check: incorrect answer gets the full tutoring feedback", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const check = await h.call("GET", "/api/v1/lessons/fm-1/check", { token: u.token });
    assert.equal(check.status, 200);
    const questions = check.json.questions || check.json;
    assert.ok(!JSON.stringify(check.json).includes("is_correct"));
    // answer q1 wrong (option 0), q2/q3 right
    const get = await h.call("GET", "/api/v1/assessments/quizzes/quiz-fm-1", { token: u.token });
    const qs = get.json.questions;
    const r = await h.call("POST", "/api/v1/lessons/fm-1/check", {
      token: u.token,
      body: { answers: [
        { questionId: qs[0].id, optionId: qs[0].options[0].id },
        { questionId: qs[1].id, optionId: qs[1].options[1].id },
        { questionId: qs[2].id, optionId: qs[2].options[1].id },
      ] } });
    assert.equal(r.status, 200);
    assert.equal(r.json.mode, "practice");
    assert.equal(r.json.score, 67);
    const wrong = r.json.feedback[0];
    assert.equal(wrong.outcome, "incorrect");
    // authored misconception note (fm-1 has overrides)
    assert.ok(wrong.whyIncorrect.includes("subtracted the rolls"));
    // why the correct answer is correct
    assert.ok(wrong.whyCorrect.length > 20);
    // simpler example, drawn from the lesson's own content
    assert.ok(wrong.simplerExample.includes("courier") || wrong.simplerExample.includes("Simpler"));
    // link back to the relevant lesson
    assert.equal(wrong.lesson.code, "fm-1");
    assert.equal(wrong.lesson.url, "/api/v1/catalog/lessons/fm-1");
    // correct answers get why + next challenge
    const right = r.json.feedback[1];
    assert.equal(right.outcome, "correct");
    assert.ok(right.whyCorrect.length > 20);
    assert.ok(right.nextChallenge.includes("fm-2"));
    // practice never becomes a graded attempt:
    const attempts = await h.db.query(`SELECT count(*)::int AS n FROM quiz_attempts WHERE user_id = $1`, [u.id]);
    assert.equal(attempts.rows[0].n, 0);
    // but it IS recorded as activity (visible in history, excluded from mastery)
    const events = await h.db.query(`SELECT kind, meta FROM activity_events WHERE user_id = $1 AND kind = 'practice_submit'`, [u.id]);
    assert.equal(events.rows.length, 1);
    assert.equal(events.rows[0].meta.score, 67);
  } finally { await h.close(); }
});

test("practice answers are validated against the exact question", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const get = await h.call("GET", "/api/v1/assessments/quizzes/quiz-fm-1", { token: u.token });
    const foreign = (await h.call("GET", "/api/v1/assessments/quizzes/quiz-fm-2", { token: u.token })).json.questions[0].options[0];
    const r = await h.call("POST", "/api/v1/lessons/fm-1/check", {
      token: u.token, body: { answers: [{ questionId: get.json.questions[0].id, optionId: foreign.id }] } });
    assert.equal(r.status, 422);
    const r2 = await h.call("POST", "/api/v1/lessons/fm-99/check", {
      token: u.token, body: { answers: [] } });
    assert.equal(r2.status, 404);
  } finally { await h.close(); }
});

test("graded attempts expose the same structured feedback (owner only)", async () => {
  const h = await setup();
  try {
    const a = await h.registerUser();
    const b = await h.registerUser();
    const quiz = (await h.call("GET", "/api/v1/assessments/quizzes/quiz-fm-1", { token: a.token })).json;
    const at = await h.call("POST", `/api/v1/assessments/quizzes/${quiz.quiz.id}/attempts`, { token: a.token, body: {} });
    await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/answers`, {
      token: a.token, body: { answers: quiz.questions.map((q, i) => ({ questionId: q.id, optionId: q.options[i === 0 ? 0 : 1].id })) } });
    await h.call("POST", `/api/v1/assessments/attempts/${at.json.attemptId}/submit`, { token: a.token, body: {} });
    const fb = await h.call("GET", `/api/v1/assessments/attempts/${at.json.attemptId}/feedback`, { token: a.token });
    assert.equal(fb.status, 200);
    assert.equal(fb.json.score, 67);
    assert.equal(fb.json.questions[0].outcome, "incorrect");
    assert.ok(fb.json.questions[0].simplerExample, "graded feedback fills the composed simpler example");
    assert.ok(fb.json.questions[1].nextChallenge.includes("fm-2"));
    // another user cannot read the feedback:
    const steal = await h.call("GET", `/api/v1/assessments/attempts/${at.json.attemptId}/feedback`, { token: b.token });
    assert.equal(steal.status, 404);
  } finally { await h.close(); }
});

test("questions without authored overrides get composed grounded feedback", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const qs = (await h.call("GET", "/api/v1/assessments/quizzes/quiz-fm-4", { token: u.token })).json.questions;
    const r = await h.call("POST", "/api/v1/lessons/fm-4/check", {
      token: u.token, body: { answers: [{ questionId: qs[0].id, optionId: qs[0].options[0].id }] } });
    const fb = r.json.feedback[0];
    assert.equal(fb.outcome, "incorrect");
    assert.ok(fb.whyIncorrect.includes("does not survive the check"));
    assert.ok(fb.simplerExample, "composed example from lesson content");
    assert.equal(fb.lesson.code, "fm-4");
  } finally { await h.close(); }
});
