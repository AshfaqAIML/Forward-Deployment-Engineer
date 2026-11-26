// test/helpers.js — shared test bootstrap. Each test FILE runs in its own
// Node process, so every file gets a pristine in-memory PostgreSQL (PGlite):
// migrations applied, real curriculum seeded, app listening on an ephemeral
// port. Env is set BEFORE importing src so config picks it up.
process.env.FDE_JWT_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.FDE_LOG_LEVEL = "error";
process.env.FDE_SEED_DEMO_USERS = "1";
process.env.FDE_EXPOSE_RESET_TOKENS = "1";
process.env.FDE_DEMO_PASSWORD = "DemoPass-2026";
process.env.FDE_AI_PROVIDER = "stub";

const { buildApp } = await import("../src/server.js");
const { seed } = await import("../src/db/seed.js");

let counter = 0;
export async function setup() {
  const app = await buildApp();
  await seed();
  await new Promise(res => app.server.listen(0, "127.0.0.1", res));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  async function call(method, path, { body, token, raw } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, json, headers: res.headers, text };
  }
  async function registerUser(password = "Password123") {
    const email = `u${Date.now()}.${++counter}.${Math.random().toString(36).slice(2, 7)}@t.io`;
    const r = await call("POST", "/api/v1/auth/register", { body: { email, password, displayName: "Tester" } });
    if (r.status !== 201) throw new Error("register failed: " + JSON.stringify(r.json));
    return { email, password, token: r.json.accessToken, refresh: r.json.refreshToken, id: r.json.user.id };
  }
  async function loginDemo(role) {
    const r = await call("POST", "/api/v1/auth/login", {
      body: { email: `${role}@fde.local`, password: process.env.FDE_DEMO_PASSWORD } });
    if (r.status !== 200) throw new Error("demo login failed: " + JSON.stringify(r.json));
    return { token: r.json.accessToken, refresh: r.json.refreshToken, id: r.json.user.id };
  }
  // DB-derived answer sets (ground truth from question_options.is_correct):
  // tests never hardcode which option is right.
  async function optionIds(quizCode, wantCorrect) {
    const r = await app.db.query(`
      SELECT o.id FROM questions qs
      JOIN quizzes qz ON qz.id = qs.quiz_id
      JOIN question_options o ON o.question_id = qs.id AND o.is_correct = $2
      WHERE qz.code = $1 ORDER BY qs.position`, [quizCode, wantCorrect]);
    return r.rows.map(x => x.id);
  }
  async function passQuiz(quizCode, token) {
    const correct = await optionIds(quizCode, true);
    const qq = await call("GET", `/api/v1/assessments/quizzes/${quizCode}`, { token });
    const attempt = await call("POST", `/api/v1/assessments/quizzes/${qq.json.quiz.id}/attempts`, { token, body: {} });
    const answers = qq.json.questions.map((question, i) => ({ questionId: question.id, optionId: correct[i] }));
    await call("POST", `/api/v1/assessments/attempts/${attempt.json.attemptId}/answers`, { token, body: { answers } });
    return call("POST", `/api/v1/assessments/attempts/${attempt.json.attemptId}/submit`, { token, body: {} });
  }
  async function failQuiz(quizCode, token) {
    const wrong = await optionIds(quizCode, false);
    const qq = await call("GET", `/api/v1/assessments/quizzes/${quizCode}`, { token });
    const attempt = await call("POST", `/api/v1/assessments/quizzes/${qq.json.quiz.id}/attempts`, { token, body: {} });
    const answers = qq.json.questions.map((question, i) => ({ questionId: question.id, optionId: wrong[i] }));
    await call("POST", `/api/v1/assessments/attempts/${attempt.json.attemptId}/answers`, { token, body: { answers } });
    return call("POST", `/api/v1/assessments/attempts/${attempt.json.attemptId}/submit`, { token, body: {} });
  }
  // Take a quiz and submit given answers (array of option indices per question).
  async function takeQuiz(quizCode, token, answerIndices) {
    const qq = await call("GET", `/api/v1/assessments/quizzes/${quizCode}`, { token });
    const attempt = await call("POST", `/api/v1/assessments/quizzes/${qq.json.quiz.id}/attempts`, { token, body: {} });
    const answers = qq.json.questions.map((question, i) => ({
      questionId: question.id, optionId: question.options[answerIndices[i]]?.id,
    })).filter(a => a.optionId);
    await call("POST", `/api/v1/assessments/attempts/${attempt.json.attemptId}/answers`, { token, body: { answers } });
    return call("POST", `/api/v1/assessments/attempts/${attempt.json.attemptId}/submit`, { token, body: {} });
  }
  async function close() {
    app.server.close();
    await app.db.close();
  }
  return { app, base, call, registerUser, loginDemo, takeQuiz, passQuiz, failQuiz, db: app.db, close };
}
