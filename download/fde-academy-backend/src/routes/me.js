// src/routes/me.js — the student's own world: profile, preferences, progress,
// notes, bookmarks, lesson completion, reading/lab/project history, results.
// Every query is scoped to ctx.user.id — records belonging to other users are
// unreachable through these endpoints (by construction, not by convention).
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, conflict, forbidden, badRequest, unauthorized } from "../errors.js";
import { logEvent, activeDayCount } from "../activity.js";
import { requirePermission } from "../rbac.js";

const guard = ctx => { if (!ctx.user) throw unauthorized(); };

export function registerMeRoutes(router) {

  /* ---- profile & preferences ---- */
  router.get("/api/v1/me/profile", async (ctx) => {
    guard(ctx);
    const r = await ctx.db.query(`
      SELECT u.display_name AS "displayName", u.email, u.created_at AS "createdAt",
             p.full_name AS "fullName", p.country, p.timezone, p.bio, p.career_goal AS "careerGoal"
      FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.id = $1`, [ctx.user.id]);
    return { body: r.rows[0] };
  });

  router.put("/api/v1/me/profile", async (ctx) => {
    guard(ctx);
    const body = validate({
      displayName: "string:2:60", "fullName?": "string:0:120", "country?": "string:0:60",
      "timezone?": "string:1:64", "bio?": "string:0:500", "careerGoal?": "string:0:300",
    }, ctx.body);
    await ctx.db.transaction(async tx => {
      await tx.query(`UPDATE users SET display_name = $2 WHERE id = $1`, [ctx.user.id, body.displayName]);
      await tx.query(`
        UPDATE user_profiles SET full_name = $2, country = $3, timezone = $4, bio = $5, career_goal = $6
        WHERE user_id = $1`,
        [ctx.user.id, body.fullName ?? null, body.country ?? null, body.timezone || "UTC", body.bio ?? null, body.careerGoal ?? null]);
    });
    return { body: { ok: true } };
  });

  router.get("/api/v1/me/preferences", async (ctx) => {
    guard(ctx);
    const r = await ctx.db.query(`
      SELECT weekly_goal_sessions AS "weeklyGoalSessions", preferred_subjects AS "preferredSubjects",
             large_text AS "largeText", reduced_motion AS "reducedMotion"
      FROM learning_preferences WHERE user_id = $1`, [ctx.user.id]);
    return { body: r.rows[0] };
  });

  router.put("/api/v1/me/preferences", async (ctx) => {
    guard(ctx);
    const body = validate({
      weeklyGoalSessions: "int:1:7", preferredSubjects: "array:10",
      largeText: "boolean", reducedMotion: "boolean",
    }, ctx.body);
    if (body.preferredSubjects.some(s => typeof s !== "string" || s.length > 40)) {
      throw badRequest("preferredSubjects must be short strings");
    }
    await ctx.db.query(`
      UPDATE learning_preferences SET weekly_goal_sessions = $2, preferred_subjects = $3,
        large_text = $4, reduced_motion = $5 WHERE user_id = $1`,
      [ctx.user.id, body.weeklyGoalSessions, body.preferredSubjects, body.largeText, body.reducedMotion]);
    return { body: { ok: true } };
  });

  /* ---- notes & bookmarks (one per user per lesson) ---- */
  router.get("/api/v1/me/notes/:lessonId", async (ctx) => {
    guard(ctx);
    const r = await ctx.db.query(`SELECT body, updated_at AS "updatedAt" FROM notes WHERE user_id = $1 AND lesson_id = $2`,
      [ctx.user.id, ctx.params.lessonId]);
    if (!r.rows[0]) return { body: { body: null } };
    return { body: r.rows[0] };
  });

  router.put("/api/v1/me/notes/:lessonId", async (ctx) => {
    guard(ctx);
    const body = validate({ body: "string:1:2000" }, ctx.body);
    await assertLesson(ctx.db, ctx.params.lessonId);
    await ctx.db.query(`
      INSERT INTO notes (user_id, lesson_id, body) VALUES ($1, $2, $3)
      ON CONFLICT (user_id, lesson_id) DO UPDATE SET body = EXCLUDED.body, updated_at = now()`,
      [ctx.user.id, ctx.params.lessonId, body.body]);
    await logEvent(ctx.db, ctx.user.id, "note_save", "lesson", ctx.params.lessonId);
    return { body: { ok: true } };
  });

  router.post("/api/v1/me/bookmarks/:lessonId", async (ctx) => {
    guard(ctx);
    await assertLesson(ctx.db, ctx.params.lessonId);
    await ctx.db.query(
      `INSERT INTO bookmarks (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [ctx.user.id, ctx.params.lessonId]);
    return { status: 201, body: { ok: true, bookmarked: true } };
  });

  router.delete("/api/v1/me/bookmarks/:lessonId", async (ctx) => {
    guard(ctx);
    await ctx.db.query(`DELETE FROM bookmarks WHERE user_id = $1 AND lesson_id = $2`,
      [ctx.user.id, ctx.params.lessonId]);
    return { body: { ok: true, bookmarked: false } };
  });

  /* ---- lesson completion: granted ONLY by a passing quiz attempt ---- */
  router.post("/api/v1/me/progress/lessons/:lessonId/complete", async (ctx) => {
    guard(ctx);
    await assertLesson(ctx.db, ctx.params.lessonId);
    // The passing attempt must exist, belong to this user, and have passed.
    const best = await ctx.db.query(`
      SELECT a.id, a.score, a.passed FROM quiz_attempts a
      JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.user_id = $1 AND q.lesson_id = $2 AND a.status = 'submitted' AND a.passed
      ORDER BY a.score DESC LIMIT 1`, [ctx.user.id, ctx.params.lessonId]);
    const attempt = best.rows[0];
    if (!attempt) {
      throw forbidden("Lessons complete only through a passing knowledge check — take the quiz first");
    }
    const existing = await ctx.db.query(
      `SELECT 1 FROM lesson_completions WHERE user_id = $1 AND lesson_id = $2`, [ctx.user.id, ctx.params.lessonId]);
    if (!existing.rows[0]) {
      await ctx.db.transaction(async tx => {
        const courseId = (await tx.query(`SELECT course_id FROM lessons WHERE id = $1`, [ctx.params.lessonId])).rows[0].course_id;
        await tx.query(
          `INSERT INTO lesson_completions (user_id, lesson_id, quiz_attempt_id) VALUES ($1, $2, $3)`,
          [ctx.user.id, ctx.params.lessonId, attempt.id]);
        // study_progress rollup maintained server-side inside the same transaction
        await tx.query(`
          INSERT INTO study_progress (user_id, course_id, lessons_done, pct)
          SELECT $1, $2,
                 (SELECT count(*)::int FROM lesson_completions WHERE user_id = $1 AND lesson_id IN (SELECT id FROM lessons WHERE course_id = $2)),
                 round(100.0 * (SELECT count(*) FROM lesson_completions WHERE user_id = $1 AND lesson_id IN (SELECT id FROM lessons WHERE course_id = $2))
                       / (SELECT count(*) FROM lessons WHERE course_id = $2 AND status = 'published'))
          ON CONFLICT (user_id, course_id) DO UPDATE
            SET lessons_done = EXCLUDED.lessons_done, pct = EXCLUDED.pct, updated_at = now()`,
          [ctx.user.id, courseId]);
        await logEvent(tx, ctx.user.id, "lesson_complete", "lesson", ctx.params.lessonId, { attemptId: attempt.id });
      });
      return { status: 201, body: { ok: true, completed: true, attemptId: attempt.id } };
    }
    return { body: { ok: true, completed: true, already: true } };
  });

  /* ---- the dashboard: every statistic computed from recorded activity ---- */
  router.get("/api/v1/me/progress", async (ctx) => {
    guard(ctx);
    const overall = await ctx.db.query(`
      SELECT (SELECT count(*)::int FROM lesson_completions WHERE user_id = $1) AS done,
             (SELECT count(*)::int FROM lessons WHERE status = 'published') AS total`, [ctx.user.id]);
    const perCourse = await ctx.db.query(`
      SELECT c.id, c.code, c.title, coalesce(sp.lessons_done, 0) AS "lessonsDone", coalesce(sp.pct, 0) AS pct,
             (SELECT count(*)::int FROM lessons l WHERE l.course_id = c.id AND l.status = 'published') AS total
      FROM courses c LEFT JOIN study_progress sp ON sp.course_id = c.id AND sp.user_id = $1
      WHERE c.status = 'published' ORDER BY c.sort_order`, [ctx.user.id]);
    const recentAttempts = await ctx.db.query(`
      SELECT a.id, a.score, a.passed, a.submitted_at AS "submittedAt", q.title AS quiz
      FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.user_id = $1 AND a.status = 'submitted' ORDER BY a.submitted_at DESC LIMIT 10`, [ctx.user.id]);
    const books = await ctx.db.query(
      `SELECT book_id AS "bookId", slug, chapters_read AS "chaptersRead", chapters_total AS "chaptersTotal", pct
       FROM v_book_progress WHERE user_id = $1`, [ctx.user.id]);
    const projectsDone = await ctx.db.query(
      `SELECT count(*)::int AS n FROM project_submissions WHERE user_id = $1`, [ctx.user.id]);
    const stage = await ctx.db.query(`
      WITH next AS (
        SELECT s.id, s.stage_number FROM learning_stages s
        JOIN lessons l ON l.stage_id = s.id AND l.status = 'published'
        WHERE NOT EXISTS (SELECT 1 FROM lesson_completions lc WHERE lc.user_id = $1 AND lc.lesson_id = l.id)
        ORDER BY s.stage_number LIMIT 1)
      SELECT id, stage_number AS "stageNumber" FROM next`, [ctx.user.id]);
    const recommended = await ctx.db.query(`
      WITH next AS (
        SELECT l.id, l.code, l.title FROM lessons l
        JOIN courses c ON c.id = l.course_id
        JOIN learning_stages s ON s.id = l.stage_id
        JOIN modules m ON m.id = (SELECT module_id FROM chapters WHERE id = l.chapter_id)
        JOIN chapters ch ON ch.id = l.chapter_id
        WHERE l.status = 'published' AND NOT EXISTS
          (SELECT 1 FROM lesson_completions lc WHERE lc.user_id = $1 AND lc.lesson_id = l.id)
        ORDER BY s.stage_number, c.sort_order, m.position, ch.position, l.position LIMIT 1)
      SELECT id, code, title FROM next`, [ctx.user.id]);
    return { body: {
      overallPct: overall.rows[0].total ? Math.round(100 * overall.rows[0].done / overall.rows[0].total) : 0,
      lessonsDone: overall.rows[0].done, lessonsTotal: overall.rows[0].total,
      activeDaysThisWeek: await activeDayCount(ctx.db, ctx.user.id, 7),
      currentStageNumber: stage.rows[0]?.stageNumber || 18,
      recommendedLesson: recommended.rows[0] || null,
      courses: perCourse.rows,
      recentAttempts: recentAttempts.rows,
      books: books.rows,
      projectsSubmitted: projectsDone.rows[0].n,
    } };
  });

  /* ---- history feed (paginated) ---- */
  router.get("/api/v1/me/history", async (ctx) => {
    guard(ctx);
    const limit = Math.min(100, Math.max(1, parseInt(ctx.query.limit || "25", 10) || 25));
    const r = await ctx.db.query(`
      SELECT kind, subject_type AS "subjectType", subject_id AS "subjectId", meta, at
      FROM activity_events WHERE user_id = $1 ORDER BY at DESC LIMIT $2`, [ctx.user.id, limit]);
    return { body: { events: r.rows } };
  });
}

async function assertLesson(db, lessonId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)) {
    throw badRequest("lesson id must be a UUID");
  }
  const r = await db.query(`SELECT 1 FROM lessons WHERE id = $1 AND status = 'published'`, [lessonId]);
  if (!r.rows[0]) throw notFound("No such lesson");
}
