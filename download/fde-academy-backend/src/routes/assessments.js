// src/routes/assessments.js — quiz delivery and server-side scoring.
//
// SECURITY INVARIANT: students can never influence their score. The client
// submits only option choices; correct answers live in question_options and
// are joined server-side at submit time. There is no endpoint that writes
// score, passed or submitted_at from request data. Attempt records are
// strictly owner-or-admin readable.
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, forbidden, conflict, badRequest, unprocessable } from "../errors.js";
import { logEvent } from "../activity.js";
import { requirePermission } from "../rbac.js";

export function registerAssessmentRoutes(router) {

  // GET /api/v1/assessments/quizzes/:id — questions and options WITHOUT any
  // correct-answer flag and WITHOUT explanations (explanations arrive with the
  // graded result after submission).
  router.get("/api/v1/assessments/quizzes/:id", async (ctx) => {
    const q = await loadQuiz(ctx.db, ctx.params.id);
    const questions = await ctx.db.query(`
      SELECT qs.id, qs.position, qs.prompt
      FROM questions qs WHERE qs.quiz_id = $1 ORDER BY qs.position`, [q.id]);
    const options = await ctx.db.query(`
      SELECT o.id, o.question_id AS "questionId", o.position, o.text
      FROM question_options o JOIN questions qs ON qs.id = o.question_id
      WHERE qs.quiz_id = $1 ORDER BY o.question_id, o.position`, [q.id]);
    const byQuestion = {};
    for (const o of options.rows) (byQuestion[o.questionId] ||= []).push({ id: o.id, position: o.position, text: o.text });
    return { body: {
      quiz: { id: q.id, code: q.code, kind: q.kind, title: q.title, passPct: q.pass_pct,
              timeLimitMinutes: q.time_limit_minutes, lessonId: q.lesson_id, courseId: q.course_id },
      questions: questions.rows.map(qs => ({ id: qs.id, position: qs.position, prompt: qs.prompt, options: byQuestion[qs.id] || [] })),
    } };
  });

  // POST /api/v1/assessments/quizzes/:id/attempts — opens an attempt.
  router.post("/api/v1/assessments/quizzes/:id/attempts", async (ctx) => {
    requirePermission(ctx, "attempt:quiz");
    const q = await loadQuiz(ctx.db, ctx.params.id);
    const r = await ctx.db.query(
      `INSERT INTO quiz_attempts (quiz_id, user_id) VALUES ($1, $2)
       RETURNING id, started_at, status`, [q.id, ctx.user.id]);
    return { status: 201, body: { attemptId: r.rows[0].id, startedAt: r.rows[0].started_at, status: r.rows[0].status } };
  });

  // POST /api/v1/assessments/attempts/:id/answers — upsert chosen options while
  // in progress. Every (question, option) pair is validated against the quiz.
  router.post("/api/v1/assessments/attempts/:id/answers", async (ctx) => {
    requirePermission(ctx, "attempt:quiz");
    const body = validate({ answers: "array:100" }, ctx.body);
    const attempt = await loadOwnedAttempt(ctx, ctx.params.id);
    if (attempt.status !== "in_progress") throw conflict("This attempt is already submitted");
    for (const a of body.answers) {
      if (typeof a !== "object" || a === null) throw badRequest("each answer must be an object");
      const clean = validate({ questionId: "uuid", optionId: "uuid" }, a);
      const ok = await ctx.db.query(`
        SELECT 1 FROM questions qs
        JOIN question_options o ON o.question_id = qs.id
        WHERE qs.quiz_id = $1 AND qs.id = $2 AND o.id = $3`,
        [attempt.quiz_id, clean.questionId, clean.optionId]);
      if (!ok.rows[0]) {
        throw unprocessable("Answer rejected", [{ field: "answers", message: `option ${clean.optionId} does not belong to question ${clean.questionId} of this quiz` }]);
      }
      await ctx.db.query(`
        INSERT INTO attempt_answers (attempt_id, question_id, option_id) VALUES ($1, $2, $3)
        ON CONFLICT (attempt_id, question_id) DO UPDATE SET option_id = EXCLUDED.option_id, answered_at = now()`,
        [attempt.id, clean.questionId, clean.optionId]);
    }
    return { body: { ok: true, saved: body.answers.length } };
  });

  // POST /api/v1/assessments/attempts/:id/submit — SERVER-SIDE SCORING.
  // The request body is ignored entirely; the score comes from joining the
  // stored answers against is_correct flags. This is what makes client-side
  // tampering with results impossible.
  router.post("/api/v1/assessments/attempts/:id/submit", async (ctx) => {
    requirePermission(ctx, "attempt:quiz");
    const attempt = await loadOwnedAttempt(ctx, ctx.params.id);
    if (attempt.status === "submitted") throw conflict("This attempt has already been submitted");
    const q = await ctx.db.query(`SELECT * FROM quizzes WHERE id = $1`, [attempt.quiz_id]);
    const quiz = q.rows[0];

    // Enforce the time limit when the quiz has one (grace of 30s for latency).
    if (quiz.time_limit_minutes) {
      const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / 60000;
      if (elapsed > quiz.time_limit_minutes + 0.5) {
        await ctx.db.query(`UPDATE quiz_attempts SET status = 'abandoned' WHERE id = $1`, [attempt.id]);
        throw forbidden(`The ${quiz.time_limit_minutes}-minute time limit was exceeded — the attempt is closed`);
      }
    }

    const total = await ctx.db.query(`SELECT count(*)::int AS n FROM questions WHERE quiz_id = $1`, [quiz.id]);
    const questionCount = total.rows[0].n;
    const correct = await ctx.db.query(`
      SELECT count(*)::int AS n
      FROM attempt_answers aa
      JOIN question_options o ON o.id = aa.option_id
      WHERE aa.attempt_id = $1 AND o.is_correct`, [attempt.id]);
    const correctCount = correct.rows[0].n;
    const score = questionCount ? Math.round(100 * correctCount / questionCount) : 0;
    const passed = score >= quiz.pass_pct;

    await ctx.db.transaction(async tx => {
      await tx.query(
        `UPDATE quiz_attempts SET status = 'submitted', submitted_at = now(), score = $2, passed = $3 WHERE id = $1`,
        [attempt.id, score, passed]);
      await logEvent(tx, ctx.user.id, "quiz_submit", "quiz", quiz.id, { attemptId: attempt.id, score, passed });
    });

    // Explanations only now, with the graded result.
    const detail = await ctx.db.query(`
      SELECT qs.id AS "questionId", qs.prompt, qs.explanation, o.id AS "chosenOptionId",
             (SELECT oo.id FROM question_options oo WHERE oo.question_id = qs.id AND oo.is_correct) AS "correctOptionId"
      FROM questions qs
      LEFT JOIN attempt_answers aa ON aa.question_id = qs.id AND aa.attempt_id = $1
      LEFT JOIN question_options o ON o.id = aa.option_id
      WHERE qs.quiz_id = $2 ORDER BY qs.position`, [attempt.id, quiz.id]);
    return { body: {
      attemptId: attempt.id, score, passed, passPct: quiz.pass_pct,
      correctCount, questionCount,
      questions: detail.rows,
    } };
  });

  // GET /api/v1/assessments/attempts/:id — owner or admin only.
  router.get("/api/v1/assessments/attempts/:id", async (ctx) => {
    const attempt = await loadOwnedAttempt(ctx, ctx.params.id);
    const answers = await ctx.db.query(`
      SELECT question_id AS "questionId", option_id AS "optionId", answered_at AS "answeredAt"
      FROM attempt_answers WHERE attempt_id = $1`, [attempt.id]);
    return { body: { attempt: {
      id: attempt.id, quizId: attempt.quiz_id, userId: attempt.user_id,
      status: attempt.status, startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at, score: attempt.score, passed: attempt.passed,
    }, answers: answers.rows } };
  });

  // GET /api/v1/assessments/quizzes/:id/attempts/mine — the caller's history.
  router.get("/api/v1/assessments/quizzes/:id/attempts/mine", async (ctx) => {
    requirePermission(ctx, "attempt:quiz");
    const q = await loadQuiz(ctx.db, ctx.params.id);
    const r = await ctx.db.query(`
      SELECT id, status, started_at AS "startedAt", submitted_at AS "submittedAt", score, passed
      FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 ORDER BY started_at DESC`, [q.id, ctx.user.id]);
    return { body: { attempts: r.rows } };
  });
}

async function loadQuiz(db, idOrCode) {
  const r = await db.query(
    `SELECT * FROM quizzes WHERE (id::text = $1 OR code = $1) AND status = 'published'`, [String(idOrCode)]);
  const quiz = r.rows[0];
  if (!quiz) throw notFound("No such quiz");
  return quiz;
}

async function loadOwnedAttempt(ctx, id) {
  if (!/^[0-9a-f-]{36}$/i.test(ctx.params.id)) throw badRequest("attempt id must be a UUID");
  const r = await ctx.db.query(`SELECT * FROM quiz_attempts WHERE id = $1`, [ctx.params.id]);
  const attempt = r.rows[0];
  // 404 (not 403) for other users' attempts: existence is not disclosed.
  if (!attempt || (attempt.user_id !== ctx.user.id && ctx.user.role !== "admin")) throw notFound("No such attempt");
  return attempt;
}
