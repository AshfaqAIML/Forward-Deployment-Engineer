// src/routes/projects.js — project centre: guided builds, checklist-gated
// submissions, rubric evaluation (admin), and the student's own submissions.
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, conflict, unprocessable, forbidden } from "../errors.js";
import { logEvent } from "../activity.js";
import { requirePermission } from "../rbac.js";

export function registerProjectRoutes(router) {

  router.get("/api/v1/projects", async (ctx) => {
    const r = await ctx.db.query(`
      SELECT p.id, p.code, p.title, p.level, p.brief, p.customer, p.concepts, p.status
      FROM projects p ${ctx.user && ["author", "admin"].includes(ctx.user.role) && ctx.query.includeDrafts === "1" ? "WHERE true" : "WHERE p.status = 'published'"}
      ORDER BY p.level, p.code`);
    let mine = {};
    if (ctx.user) {
      const s = await ctx.db.query(
        `SELECT project_id AS pid, status, submitted_at AS "submittedAt" FROM project_submissions WHERE user_id = $1`, [ctx.user.id]);
      mine = Object.fromEntries(s.rows.map(x => [x.pid, { status: x.status, submittedAt: x.submittedAt }]));
    }
    return { body: { projects: r.rows.map(p => ({ ...p, submission: mine[p.id] || null })) } };
  }, { public: true });

  router.get("/api/v1/projects/:idOrCode", async (ctx) => {
    const p = await loadProject(ctx.db, ctx.params.idOrCode);
    const steps = await ctx.db.query(`
      SELECT position, content FROM exercise_hints WHERE owner_type = 'project' AND owner_id = $1 ORDER BY position`, [p.id]);
    const checklist = p.demo_checklist || [];
    let mine = null;
    if (ctx.user) {
      const s = await ctx.db.query(`
        SELECT id, evidence, checklist, status, submitted_at AS "submittedAt" FROM project_submissions
        WHERE project_id = $1 AND user_id = $2`, [p.id, ctx.user.id]);
      mine = s.rows[0] || null;
      if (mine?.checklist && Array.isArray(mine.checklist)) {
        mine.checklist = mine.checklist.map(c => ({ ...c }));
      }
    }
    return { body: {
      project: { id: p.id, code: p.code, title: p.title, level: p.level, customer: p.customer, brief: p.brief,
                 steps: p.steps, demoChecklist: checklist, concepts: p.concepts, status: p.status },
      guidedSteps: steps.rows,
      mySubmission: mine,
    } };
  }, { public: true });

  // Submission gate mirrors the frontend: every checklist item must be ticked
  // AND evidence must be substantive. Both are validated here, server-side.
  router.post("/api/v1/projects/:idOrCode/submissions", async (ctx) => {
    requirePermission(ctx, "submit:project");
    const p = await loadProject(ctx.db, ctx.params.idOrCode);
    const body = validate({ evidence: "string:20:4000", checklist: "array:30" }, ctx.body);
    const required = (p.demo_checklist || []).map((c, i) => ({ index: i, label: c.label ?? c, done: !!body.checklist[i]?.done }));
    // accept either booleans or {done} objects
    const ticks = body.checklist.map(c => c === true || c?.done === true);
    const missing = ticks.map((t, i) => ({ index: i, label: (p.demo_checklist[i]?.label ?? p.demo_checklist[i]) || `item ${i + 1}`, done: t }))
      .filter(x => !x.done);
    if (missing.length) {
      throw unprocessable("The demonstration checklist gates submission", missing.map(m => ({
        field: "checklist", message: `not yet demonstrated: ${m.label}` })));
    }
    const existing = await ctx.db.query(
      `SELECT 1 FROM project_submissions WHERE project_id = $1 AND user_id = $2`, [p.id, ctx.user.id]);
    if (existing.rows[0]) throw conflict("You have already submitted this project");
    const r = await ctx.db.query(`
      INSERT INTO project_submissions (project_id, user_id, evidence, checklist)
      VALUES ($1, $2, $3, $4) RETURNING id, submitted_at AS "submittedAt"`,
      [p.id, ctx.user.id, body.evidence, JSON.stringify(ticks.map((t, i) => ({ index: i, done: t })))]);
    await logEvent(ctx.db, ctx.user.id, "project_submit", "project", p.id, { submissionId: r.rows[0].id });
    return { status: 201, body: { submissionId: r.rows[0].id, submittedAt: r.rows[0].submittedAt } };
  });

  router.get("/api/v1/projects/submissions/mine", async (ctx) => {
    requirePermission(ctx, "submit:project");
    const r = await ctx.db.query(`
      SELECT s.id, s.project_id AS "projectId", p.title AS "projectTitle", p.level, s.status,
             s.evidence, s.submitted_at AS "submittedAt",
             e.total AS "rubricTotal", e.passed AS "rubricPassed", e.feedback AS "rubricFeedback"
      FROM project_submissions s JOIN projects p ON p.id = s.project_id
      LEFT JOIN evaluation_results e ON e.submission_id = s.id
      WHERE s.user_id = $1 ORDER BY s.submitted_at DESC`, [ctx.user.id]);
    return { body: { submissions: r.rows } };
  });
}

async function loadProject(db, idOrCode) {
  const r = await db.query(
    `SELECT * FROM projects WHERE (id::text = $1 OR code = $1)`, [String(idOrCode)]);
  const p = r.rows[0];
  if (!p || p.status !== "published") throw notFound("No such project");
  return p;
}
