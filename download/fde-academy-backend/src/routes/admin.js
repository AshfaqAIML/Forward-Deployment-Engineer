// src/routes/admin.js — administration: analytics, user management, glossary
// CRUD with live effect, the draft → review → publish pipeline, revision
// history, download management, and evaluation of project submissions.
// Every route requires the admin (or author, where noted) role; the RBAC
// matrix in src/rbac.js is the source of truth.
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, conflict, badRequest, unprocessable } from "../errors.js";
import { logEvent } from "../activity.js";
import { requirePermission } from "../rbac.js";

export function registerAdminRoutes(router) {

  /* ---------------- analytics (real, computed from recorded activity) ---------------- */
  router.get("/api/v1/admin/analytics/overview", async (ctx) => {
    requirePermission(ctx, "analytics:read");
    const users = await ctx.db.query(`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS "new7d",
             (SELECT count(DISTINCT user_id)::int FROM activity_events
               WHERE at >= now() - interval '7 days') AS "active7d"
      FROM users`);
    const learning = await ctx.db.query(`
      SELECT (SELECT count(*)::int FROM lesson_completions) AS "completions",
             (SELECT count(*)::int FROM quiz_attempts WHERE status = 'submitted') AS "attempts",
             (SELECT coalesce(round(avg(score)), 0)::int FROM quiz_attempts WHERE status = 'submitted') AS "avgScore",
             (SELECT coalesce(round(100.0 * count(*) FILTER (WHERE passed) / nullif(count(*), 0)), 0)::int
                FROM quiz_attempts WHERE status = 'submitted') AS "passRate",
             (SELECT count(*)::int FROM project_submissions) AS "projectSubmissions",
             (SELECT count(*)::int FROM download_records) AS "downloads",
             (SELECT count(*)::int FROM lab_submissions) AS "labSubmissions" `);
    return { body: {
      users: users.rows[0],
      learning: learning.rows[0],
      generatedAt: new Date().toISOString(),
      note: "Every figure is computed from recorded activity — no client-claimed values are included.",
    } };
  });

  // Content health: published assessments averaging below 70% across attempts.
  router.get("/api/v1/admin/analytics/content-health", async (ctx) => {
    requirePermission(ctx, "analytics:read");
    const r = await ctx.db.query(`
      SELECT quiz_id AS "quizId", quiz_code AS "quizCode", title, attempts, avg_score AS "avgScore", pass_rate AS "passRate"
      FROM v_content_health ORDER BY avg_score ASC`);
    return { body: { health: r.rows, weakThreshold: 70,
      weak: r.rows.filter(x => x.attempts > 0 && x.avgScore < 70) } };
  });

  /* ---------------- user management ---------------- */
  router.get("/api/v1/admin/users", async (ctx) => {
    requirePermission(ctx, "users:read");
    const limit = Math.min(100, Math.max(1, parseInt(ctx.query.limit || "50", 10) || 50));
    const offset = Math.max(0, parseInt(ctx.query.offset || "0", 10) || 0);
    const role = ["student", "author", "admin"].includes(ctx.query.role) ? ctx.query.role : null;
    const r = await ctx.db.query(`
      SELECT u.id, u.email, u.display_name AS "displayName", u.role, u.status,
             u.created_at AS "createdAt", u.last_login_at AS "lastLoginAt",
             (SELECT count(*)::int FROM lesson_completions WHERE user_id = u.id) AS "lessonsCompleted",
             (SELECT count(*)::int FROM quiz_attempts WHERE user_id = u.id AND status = 'submitted') AS "attempts"
      FROM users u WHERE ($1::user_role IS NULL OR u.role = $1)
      ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`, [role, limit, offset]);
    const total = await ctx.db.query(
      `SELECT count(*)::int AS n FROM users WHERE ($1::user_role IS NULL OR role = $1)`, [role]);
    return { body: { users: r.rows, total: total.rows[0].n, limit, offset } };
  });

  router.put("/api/v1/admin/users/:id/status", async (ctx) => {
    requirePermission(ctx, "users:manage");
    const body = validate({ status: "enum:active,suspended" }, ctx.body);
    if (ctx.params.id === ctx.user.id) throw badRequest("You cannot change your own account status");
    const r = await ctx.db.query(
      `UPDATE users SET status = $2 WHERE id = $1 RETURNING id, status`, [ctx.params.id, body.status]);
    if (!r.rows[0]) throw notFound("No such user");
    if (body.status === "suspended") {
      await ctx.db.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [ctx.params.id]);
    }
    return { body: { ok: true, user: r.rows[0] } };
  });

  /* ---------------- glossary management (live effect across the API) ---------------- */
  router.post("/api/v1/admin/glossary", async (ctx) => {
    requirePermission(ctx, "glossary:manage");
    const body = validate({
      term: "string:2:60", simple: "string:10:300", detailed: "string:30:2000",
      example: "string:10:400", "category?": "string:1:40", "related?": "array:10",
    }, ctx.body);
    const key = body.term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const exists = await ctx.db.query(`SELECT 1 FROM glossary_terms WHERE key = $1`, [key]);
    if (exists.rows[0]) throw conflict("A glossary term with that name already exists");
    const r = await ctx.db.query(`
      INSERT INTO glossary_terms (key, term, simple_meaning, detailed_meaning, example, related, category, is_admin_added)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id, key`, 
      [key, body.term, body.simple, body.detailed, body.example, body.related || [], body.category || "General"]);
    await snapshotRevision(ctx.db, "glossary_term", r.rows[0].id, 1, { ...body, key }, ctx.user.id, "admin created term");
    return { status: 201, body: { id: r.rows[0].id, key: r.rows[0].key } };
  });

  router.put("/api/v1/admin/glossary/:id", async (ctx) => {
    requirePermission(ctx, "glossary:manage");
    const body = validate({
      term: "string:2:60", simple: "string:10:300", detailed: "string:30:2000",
      example: "string:10:400", "category?": "string:1:40",
    }, ctx.body);
    const current = await ctx.db.query(`SELECT * FROM glossary_terms WHERE id = $1`, [ctx.params.id]);
    if (!current.rows[0]) throw notFound("No such glossary term");
    const r = await ctx.db.query(`
      UPDATE glossary_terms SET term = $2, simple_meaning = $3, detailed_meaning = $4, example = $5, category = $6
      WHERE id = $1 RETURNING id, key`, [ctx.params.id, body.term, body.simple, body.detailed, body.example, body.category || "General"]);
    const version = await nextRevision(ctx.db, "glossary_term", ctx.params.id);
    await snapshotRevision(ctx.db, "glossary_term", ctx.params.id, version, current.rows[0], ctx.user.id, "admin edited term");
    return { body: { ok: true, key: r.rows[0].key } };
  });

  router.delete("/api/v1/admin/glossary/:id", async (ctx) => {
    requirePermission(ctx, "glossary:manage");
    const current = await ctx.db.query(`SELECT * FROM glossary_terms WHERE id = $1`, [ctx.params.id]);
    if (!current.rows[0]) throw notFound("No such glossary term");
    const version = await nextRevision(ctx.db, "glossary_term", ctx.params.id);
    await snapshotRevision(ctx.db, "glossary_term", ctx.params.id, version, current.rows[0], ctx.user.id, "admin removed term");
    await ctx.db.query(`DELETE FROM glossary_terms WHERE id = $1`, [ctx.params.id]);
    return { body: { ok: true } };
  });

  /* ---------------- draft → review → publish pipeline ---------------- */
  // Authors create drafts; admins review and publish. Publishing snapshots the
  // previous state into content_revisions and writes a publish_events row.
  router.post("/api/v1/author/drafts", async (ctx) => {
    requirePermission(ctx, "draft:write");
    const body = validate({
      entityType: "enum:course,lesson,book,book_chapter,quiz,coding_exercise,math_exercise,project,glossary_term",
      "entityId?": "uuid", payload: "object", "changeNote?": "string:0:500",
    }, ctx.body);
    const r = await ctx.db.query(`
      INSERT INTO content_drafts (entity_type, entity_id, payload, author_id, change_note)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, status, created_at AS "createdAt"`,
      [body.entityType, body.entityId || null, JSON.stringify(body.payload), ctx.user.id, body.changeNote || null]);
    return { status: 201, body: { draftId: r.rows[0].id, status: r.rows[0].status, createdAt: r.rows[0].createdAt } };
  });

  router.get("/api/v1/author/drafts", async (ctx) => {
    requirePermission(ctx, "draft:read");
    const mine = ctx.user.role === "author";
    const r = await ctx.db.query(`
      SELECT d.id, d.entity_type AS "entityType", d.entity_id AS "entityId", d.status,
             d.change_note AS "changeNote", d.created_at AS "createdAt",
             u.display_name AS "authorName", d.author_id AS "authorId"
      FROM content_drafts d JOIN users u ON u.id = d.author_id
      ${mine ? "WHERE d.author_id = $1" : ""} ORDER BY d.created_at DESC LIMIT 100`, mine ? [ctx.user.id] : []);
    return { body: { drafts: r.rows } };
  });

  router.post("/api/v1/author/drafts/:id/submit", async (ctx) => {
    requirePermission(ctx, "draft:submit");
    const r = await ctx.db.query(`
      UPDATE content_drafts SET status = 'in_review', updated_at = now()
      WHERE id = $1 AND (author_id = $2 OR $3) RETURNING id`,
      [ctx.params.id, ctx.user.id, ctx.user.role === "admin"]);
    if (!r.rows[0]) throw notFound("No such draft (or not yours to submit)");
    return { body: { ok: true } };
  });

  // Admin review: verdict + comment, then (for approvals) an explicit publish.
  router.post("/api/v1/admin/drafts/:id/review", async (ctx) => {
    requirePermission(ctx, "review:manage");
    const body = validate({ verdict: "enum:approved,rejected", "comments?": "string:0:2000" }, ctx.body);
    const d = await ctx.db.query(`SELECT * FROM content_drafts WHERE id = $1 FOR UPDATE`, [ctx.params.id]);
    const draft = d.rows[0];
    if (!draft) throw notFound("No such draft");
    if (draft.status !== "in_review") throw conflict(`Draft is ${draft.status}, not in_review`);
    await ctx.db.transaction(async tx => {
      await tx.query(`UPDATE content_drafts SET status = $2, updated_at = now() WHERE id = $1`, [draft.id, body.verdict === "approved" ? "approved" : "rejected"]);
      await tx.query(`INSERT INTO content_reviews (draft_id, reviewer_id, verdict, comments) VALUES ($1, $2, $3, $4)`,
        [draft.id, ctx.user.id, body.verdict, body.comments || null]);
    });
    return { body: { ok: true, status: body.verdict === "approved" ? "approved" : "rejected" } };
  });

  // Publish an approved draft. Supported entity types cover the content the
  // admin console manages; each apply path snapshots the previous row first.
  router.post("/api/v1/admin/drafts/:id/publish", async (ctx) => {
    requirePermission(ctx, "publish:manage");
    const d = await ctx.db.query(`SELECT * FROM content_drafts WHERE id = $1`, [ctx.params.id]);
    const draft = d.rows[0];
    if (!draft) throw notFound("No such draft");
    if (draft.status !== "approved") throw conflict("Only approved drafts can be published");
    const result = await applyDraft(ctx.db, draft, ctx.user.id);
    await ctx.db.query(`UPDATE content_drafts SET status = 'published', updated_at = now() WHERE id = $1`, [draft.id]);
    await ctx.db.query(
      `INSERT INTO publish_events (entity_type, entity_id, action, actor_id) VALUES ($1, $2, 'publish', $3)`,
      [draft.entity_type, result.entityId, ctx.user.id]);
    return { body: { ok: true, entityType: draft.entity_type, entityId: result.entityId, created: result.created } };
  });

  /* ---------------- revision history & download management ---------------- */
  router.get("/api/v1/admin/revisions", async (ctx) => {
    requirePermission(ctx, "analytics:read");
    const entityType = ctx.query.entity || null;
    const r = await ctx.db.query(`
      SELECT entity_type AS "entityType", entity_id AS "entityId", version, snapshot,
             changed_by AS "changedBy", change_note AS "changeNote", at
      FROM content_revisions WHERE ($1::text IS NULL OR entity_type = $1)
      ORDER BY at DESC LIMIT 100`, [entityType]);
    return { body: { revisions: r.rows } };
  });

  router.get("/api/v1/admin/downloads", async (ctx) => {
    requirePermission(ctx, "analytics:read");
    const r = await ctx.db.query(`
      SELECT at, original_filename AS "filename", file_kind AS "fileKind", bytes, user_display_name AS "user"
      FROM v_download_log ORDER BY at DESC LIMIT 200`);
    return { body: { downloads: r.rows } };
  });

  /* ---------------- rubric evaluation of project submissions ---------------- */
  router.post("/api/v1/admin/project-submissions/:id/evaluate", async (ctx) => {
    requirePermission(ctx, "evaluate:manage");
    const body = validate({
      understanding: "int:0:4", correctness: "int:0:4", craft: "int:0:4",
      safety: "int:0:4", operation: "int:0:4", communication: "int:0:4",
      "feedback?": "string:0:2000",
    }, ctx.body);
    const s = await ctx.db.query(`SELECT * FROM project_submissions WHERE id = $1`, [ctx.params.id]);
    const sub = s.rows[0];
    if (!sub) throw notFound("No such submission");
    const rubric = { understanding: body.understanding, correctness: body.correctness, craft: body.craft,
                     safety: body.safety, operation: body.operation, communication: body.communication };
    const values = Object.values(rubric);
    const total = values.reduce((a, b) => a + b, 0);
    const passed = total >= 16 && values.every(v => v >= 2);
    const exists = await ctx.db.query(`SELECT 1 FROM evaluation_results WHERE submission_id = $1`, [sub.id]);
    if (exists.rows[0]) throw conflict("This submission has already been evaluated");
    await ctx.db.transaction(async tx => {
      await tx.query(`
        INSERT INTO evaluation_results (submission_id, rubric, total, passed, feedback, evaluated_by)
        VALUES ($1, $2, $3, $4, $5, $6)`, [sub.id, JSON.stringify(rubric), total, passed, body.feedback || null, ctx.user.id]);
      await tx.query(`UPDATE project_submissions SET status = 'reviewed' WHERE id = $1`, [sub.id]);
      await logEvent(tx, sub.user_id, "project_evaluated", "project_submission", sub.id, { total, passed });
    });
    return { body: { ok: true, total, passed, rubric } };
  });
}

/* ---------------- helpers ---------------- */
async function snapshotRevision(db, entityType, entityId, version, snapshot, changedBy, note) {
  await db.query(`
    INSERT INTO content_revisions (entity_type, entity_id, version, snapshot, changed_by, change_note)
    VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (entity_type, entity_id, version) DO NOTHING`,
    [entityType, entityId, version, JSON.stringify(snapshot), changedBy, note || null]);
}
async function nextRevision(db, entityType, entityId) {
  const r = await db.query(
    `SELECT coalesce(max(version), 0)::int + 1 AS v FROM content_revisions WHERE entity_type = $1 AND entity_id = $2`,
    [entityType, entityId]);
  return r.rows[0].v;
}

// Applies an approved draft payload to its entity, snapshotting first.
// Handles new-entity creation (entityId null) and updates.
async function applyDraft(db, draft, actorId) {
  const p = draft.payload;
  const t = draft.entity_type;
  if (t === "course") {
    if (draft.entity_id) {
      const cur = await db.query(`SELECT * FROM courses WHERE id = $1`, [draft.entity_id]);
      if (!cur.rows[0]) throw notFound("Target course no longer exists");
      const v = await nextRevision(db, "course", draft.entity_id);
      await snapshotRevision(db, "course", draft.entity_id, v, cur.rows[0], actorId, "pre-publish snapshot");
      await db.query(`UPDATE courses SET title = $2, blurb = $3, status = 'published', published_at = now() WHERE id = $1`,
        [draft.entity_id, p.title, p.blurb]);
      return { entityId: draft.entity_id, created: false };
    }
    const r = await db.query(`
      INSERT INTO courses (code, title, subject_id, stage_id, difficulty, blurb, status, published_at, sort_order)
      VALUES ($1, $2, $3, $4, $5::difficulty_level, $6, 'published', now(), $7) RETURNING id`,
      [p.code, p.title, p.subjectId, p.stageId, p.difficulty, p.blurb, p.sortOrder ?? 99]);
    return { entityId: r.rows[0].id, created: true };
  }
  if (t === "glossary_term") {
    if (draft.entity_id) {
      const cur = await db.query(`SELECT * FROM glossary_terms WHERE id = $1`, [draft.entity_id]);
      if (!cur.rows[0]) throw notFound("Target term no longer exists");
      const v = await nextRevision(db, "glossary_term", draft.entity_id);
      await snapshotRevision(db, "glossary_term", draft.entity_id, v, cur.rows[0], actorId, "pre-publish snapshot");
      await db.query(`UPDATE glossary_terms SET term = $2, simple_meaning = $3, detailed_meaning = $4, example = $5 WHERE id = $1`,
        [draft.entity_id, p.term, p.simple, p.detailed, p.example]);
      return { entityId: draft.entity_id, created: false };
    }
    const key = String(p.term).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const r = await db.query(`
      INSERT INTO glossary_terms (key, term, simple_meaning, detailed_meaning, example, category, is_admin_added, status)
      VALUES ($1, $2, $3, $4, $5, $6, true, 'published') RETURNING id`,
      [key, p.term, p.simple, p.detailed, p.example, p.category || "General"]);
    return { entityId: r.rows[0].id, created: true };
  }
  if (t === "lesson") {
    if (!draft.entity_id) throw badRequest("lesson drafts must target an existing lesson (entityId)");
    const cur = await db.query(`SELECT * FROM lessons WHERE id = $1`, [draft.entity_id]);
    if (!cur.rows[0]) throw notFound("Target lesson no longer exists");
    const v = await nextRevision(db, "lesson", draft.entity_id);
    await snapshotRevision(db, "lesson", draft.entity_id, v, cur.rows[0], actorId, "pre-publish snapshot");
    const r = await db.query(
      `UPDATE lessons SET title = $2, content = $3, objectives = $4, version = version + 1, status = 'published', published_at = now() WHERE id = $1
       RETURNING id, version`,
      [draft.entity_id, p.title ?? cur.rows[0].title, JSON.stringify(p.content ?? cur.rows[0].content),
       JSON.stringify(p.objectives ?? cur.rows[0].objectives)]);
    return { entityId: draft.entity_id, created: false };
  }
  throw unprocessable(`Publishing ${t} drafts is not supported by this endpoint yet — extend applyDraft()`);
}
