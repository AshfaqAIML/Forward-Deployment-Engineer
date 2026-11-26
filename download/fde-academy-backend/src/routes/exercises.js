// src/routes/exercises.js — coding and mathematical exercises, gated hints and
// solutions, sandbox lab submissions. Policy: hints require at least one real
// submission (an honest attempt); solutions require hints to have been seen.
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, forbidden } from "../errors.js";
import { logEvent } from "../activity.js";
import { requirePermission } from "../rbac.js";

export function registerExerciseRoutes(router) {

  router.get("/api/v1/exercises", async (ctx) => {
    const kind = ctx.query.kind === "math" ? "math" : ctx.query.kind === "coding" ? "coding" : null;
    const coding = await ctx.db.query(`
      SELECT c.id, c.code, c.title, c.language, c.minutes, c.status, c.linked_lesson_id AS "linkedLessonId"
      FROM coding_exercises c WHERE c.status = 'published' ORDER BY c.code`);
    const math = await ctx.db.query(`
      SELECT m.id, m.code, m.title, m.minutes, m.status, m.linked_lesson_id AS "linkedLessonId"
      FROM math_exercises m WHERE m.status = 'published' ORDER BY m.code`);
    return { body: {
      coding: (!kind || kind === "coding") ? coding.rows : [],
      math: (!kind || kind === "math") ? math.rows : [],
    } };
  }, { public: true });

  router.get("/api/v1/exercises/coding/:idOrCode", async (ctx) => {
    const r = await ctx.db.query(`
      SELECT c.id, c.code, c.title, c.language, c.instructions, c.starter_code AS "starterCode",
             c.minutes, c.linked_lesson_id AS "linkedLessonId", c.status
      FROM coding_exercises c WHERE (c.id::text = $1 OR c.code = $1)`, [String(ctx.params.idOrCode)]);
    const ex = r.rows[0];
    if (!ex || (ex.status !== "published" && !(ctx.user && ["author", "admin"].includes(ctx.user.role)))) {
      throw notFound("No such exercise");
    }
    return { body: { exercise: ex } };   // hints/solutions are NOT included
  }, { public: true });

  router.get("/api/v1/exercises/math/:idOrCode", async (ctx) => {
    const r = await ctx.db.query(`
      SELECT m.id, m.code, m.title, m.prompt, m.config, m.minutes, m.linked_lesson_id AS "linkedLessonId", m.status
      FROM math_exercises m WHERE (m.id::text = $1 OR m.code = $1)`, [String(ctx.params.idOrCode)]);
    const ex = r.rows[0];
    if (!ex || (ex.status !== "published" && !(ctx.user && ["author", "admin"].includes(ctx.user.role)))) {
      throw notFound("No such exercise");
    }
    return { body: { exercise: ex } };
  }, { public: true });

  // Hints unlock after at least one lab submission for the exercise — the
  // attempt-first policy of the academy, enforced server-side.
  router.get("/api/v1/exercises/coding/:idOrCode/hints", async (ctx) => {
    requirePermission(ctx, "submit:lab");
    const ex = await loadCoding(ctx.db, ctx.params.idOrCode);
    const attempts = await ctx.db.query(
      `SELECT count(*)::int AS n FROM lab_submissions WHERE user_id = $1 AND exercise_id = $2`,
      [ctx.user.id, ex.id]);
    if (attempts.rows[0].n < 1) {
      throw forbidden("Hints unlock after your first saved attempt — the sandbox editor is the honest path");
    }
    const hints = await ctx.db.query(`
      SELECT position, content FROM exercise_hints
      WHERE owner_type = 'coding_exercise' AND owner_id = $1 ORDER BY position`, [ex.id]);
    return { body: { hints: hints.rows } };
  });

  router.get("/api/v1/exercises/coding/:idOrCode/solution", async (ctx) => {
    requirePermission(ctx, "submit:lab");
    const ex = await loadCoding(ctx.db, ctx.params.idOrCode);
    const attempts = await ctx.db.query(
      `SELECT count(*)::int AS n FROM lab_submissions WHERE user_id = $1 AND exercise_id = $2`,
      [ctx.user.id, ex.id]);
    if (attempts.rows[0].n < 1) {
      throw forbidden("The solution is visible only after an honest attempt — submit your work first");
    }
    const sol = await ctx.db.query(`
      SELECT content FROM exercise_solutions
      WHERE owner_type = 'coding_exercise' AND owner_id = $1 AND status = 'published'`, [ex.id]);
    if (!sol.rows[0]) throw notFound("No solution has been published for this exercise");
    return { body: { solution: sol.rows[0].content } };
  });

  // Record a sandbox lab submission (the code the student chose to save).
  router.post("/api/v1/exercises/coding/:idOrCode/submissions", async (ctx) => {
    requirePermission(ctx, "submit:lab");
    const ex = await loadCoding(ctx.db, ctx.params.idOrCode);
    const body = validate({ code: "string:1:20000" }, ctx.body);
    const r = await ctx.db.query(`
      INSERT INTO lab_submissions (user_id, exercise_id, code) VALUES ($1, $2, $3)
      RETURNING id, created_at AS "createdAt"`, [ctx.user.id, ex.id, body.code]);
    await logEvent(ctx.db, ctx.user.id, "lab_submission", "coding_exercise", ex.id);
    return { status: 201, body: { submissionId: r.rows[0].id, createdAt: r.rows[0].createdAt } };
  });

  router.get("/api/v1/exercises/coding/:idOrCode/submissions/mine", async (ctx) => {
    requirePermission(ctx, "submit:lab");
    const ex = await loadCoding(ctx.db, ctx.params.idOrCode);
    const r = await ctx.db.query(`
      SELECT id, code, created_at AS "createdAt" FROM lab_submissions
      WHERE user_id = $1 AND exercise_id = $2 ORDER BY created_at DESC LIMIT 20`, [ctx.user.id, ex.id]);
    return { body: { submissions: r.rows } };
  });
}

async function loadCoding(db, idOrCode) {
  const r = await db.query(
    `SELECT id, code, status FROM coding_exercises WHERE (id::text = $1 OR code = $1)`, [String(idOrCode)]);
  const ex = r.rows[0];
  if (!ex || ex.status !== "published") throw notFound("No such exercise");
  return ex;
}
