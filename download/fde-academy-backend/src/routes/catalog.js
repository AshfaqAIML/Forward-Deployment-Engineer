// src/routes/catalog.js — the published curriculum: subjects, stages, courses,
// modules, chapters, lessons. Students and anonymous visitors only ever see
// status='published' rows; drafts stay invisible until the admin publishes.
import { Router } from "../http/router.js";
import { validate, queryUuid } from "../validate.js";
import { notFound, forbidden } from "../errors.js";
import { logEvent } from "../activity.js";

// Students/anons see published content only. Authors+admins can request
// includeDrafts=1 to preview.
function contentVisibility(ctx) {
  const includeDrafts = ctx.query.includeDrafts === "1";
  const canSeeDrafts = ctx.user && ["author", "admin"].includes(ctx.user.role);
  return includeDrafts && canSeeDrafts ? "" : "AND c.status = 'published'";
}

export function registerCatalogRoutes(router) {

  router.get("/api/v1/catalog/subjects", async (ctx) => {
    const r = await ctx.db.query(`SELECT id, key, name FROM subjects ORDER BY position`);
    return { body: { subjects: r.rows } };
  }, { public: true });

  router.get("/api/v1/catalog/stages", async (ctx) => {
    const r = await ctx.db.query(`
      SELECT s.id, s.stage_number AS "stageNumber", s.phase, s.title, s.meta_text AS meta,
        (SELECT count(*)::int FROM lessons l WHERE l.stage_id = s.id AND l.status = 'published') AS lessons
      FROM learning_stages s ORDER BY s.stage_number`);
    return { body: { stages: r.rows } };
  }, { public: true });

  router.get("/api/v1/catalog/stages/:id", async (ctx) => {
    // Accepts a stage UUID or the stage number (1-18) — friendlier deep links.
    const idOrNumber = String(ctx.params.id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const isNumber = /^\d+$/.test(idOrNumber);
    if (!isUuid && !isNumber) throw notFound("No such stage");
    const r = await ctx.db.query(`
      SELECT s.id, s.stage_number AS "stageNumber", s.phase, s.title, s.meta_text AS meta
      FROM learning_stages s WHERE ${isUuid ? "s.id::text = $1" : "s.stage_number = $1::int"}`, [idOrNumber]);
    if (!r.rows[0]) throw notFound("No such stage");
    const ls = await ctx.db.query(`
      SELECT l.id, l.code, l.title, l.minutes, l.status
      FROM lessons l WHERE l.stage_id = $1 ${ctx.user ? "" : "AND l.status = 'published'"} ORDER BY l.course_id, l.position`,
      [r.rows[0].id]);
    return { body: { ...r.rows[0], lessons: ls.rows } };
  }, { public: true });

  // Course library with the same filters the frontend exposes.
  router.get("/api/v1/catalog/courses", async (ctx) => {
    const subject = ctx.query.subject || null;
    const difficulty = ["Beginner", "Intermediate", "Advanced"].includes(ctx.query.difficulty) ? ctx.query.difficulty : null;
    const draftsVisible = ctx.user && ["author", "admin"].includes(ctx.user.role) && ctx.query.includeDrafts === "1";
    const r = await ctx.db.query(`
      SELECT c.id, c.code, c.title, c.blurb, c.difficulty, c.sort_order AS "sortOrder",
             c.status, c.published_at AS "publishedAt",
             sub.key AS subject, s.stage_number AS "stageNumber",
             (SELECT count(*)::int FROM lessons l WHERE l.course_id = c.id AND l.status = 'published') AS lessons
      FROM courses c
      JOIN subjects sub ON sub.id = c.subject_id
      JOIN learning_stages s ON s.id = c.stage_id
      WHERE ($1::text IS NULL OR sub.key = $1) AND ($2::text IS NULL OR c.difficulty = $2::difficulty_level)
        ${draftsVisible ? "" : "AND c.status = 'published'"}
      ORDER BY s.stage_number, c.sort_order`, [subject, difficulty]);
    let progress = {};
    if (ctx.user) {
      const p = await ctx.db.query(`SELECT course_id AS cid, lessons_done, pct FROM study_progress WHERE user_id = $1`, [ctx.user.id]);
      progress = Object.fromEntries(p.rows.map(x => [x.cid, { lessonsDone: x.lessons_done, pct: x.pct }]));
    }
    return { body: { courses: r.rows.map(c => ({ ...c, progress: progress[c.id] || { lessonsDone: 0, pct: 0 } })) } };
  }, { public: true });

  router.get("/api/v1/catalog/courses/:id", async (ctx) => {
    const r = await ctx.db.query(`
      SELECT c.*, sub.key AS subject, s.stage_number AS "stageNumber", s.title AS "stageTitle"
      FROM courses c JOIN subjects sub ON sub.id = c.subject_id
      JOIN learning_stages s ON s.id = c.stage_id
      WHERE c.id::text = $1 OR c.code = $1`, [ctx.params.id]);
    const course = r.rows[0];
    if (!course) throw notFound("No such course");
    if (course.status !== "published" && !(ctx.user && ["author", "admin"].includes(ctx.user.role))) {
      throw notFound("No such course"); // drafts are invisible, not 403 (no existence leak)
    }
    const mods = await ctx.db.query(`
      SELECT m.id, m.title, m.position FROM modules m WHERE m.course_id = $1 ORDER BY m.position`, [course.id]);
    const chs = await ctx.db.query(`
      SELECT ch.id, ch.module_id AS "moduleId", ch.title, ch.position
      FROM chapters ch JOIN modules m ON m.id = ch.module_id
      WHERE m.course_id = $1 ORDER BY m.position, ch.position`, [course.id]);
    const ls = await ctx.db.query(`
      SELECT l.id, l.code, l.title, l.minutes, l.position, l.chapter_id AS "chapterId", l.status
      FROM lessons l WHERE l.course_id = $1 AND (l.status = 'published' OR $2)
      ORDER BY l.position`, [course.id, ctx.user && ["author", "admin"].includes(ctx.user.role)]);
    let lessonState = {};
    if (ctx.user) {
      const st = await ctx.db.query(`
        SELECT l.id,
          EXISTS (SELECT 1 FROM lesson_completions lc WHERE lc.user_id = $1 AND lc.lesson_id = l.id) AS completed,
          EXISTS (SELECT 1 FROM bookmarks b WHERE b.user_id = $1 AND b.lesson_id = l.id) AS bookmarked,
          (SELECT coalesce(max(a.score), 0) FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
            WHERE a.user_id = $1 AND q.lesson_id = l.id AND a.status = 'submitted') AS "bestScore"
        FROM lessons l WHERE l.course_id = $2`, [ctx.user.id, course.id]);
      lessonState = Object.fromEntries(st.rows.map(x => [x.id, { completed: x.completed, bookmarked: x.bookmarked, bestScore: x.bestScore }]));
    }
    const quiz = await ctx.db.query(
      `SELECT id, code, title FROM quizzes WHERE course_id = $1 AND kind = 'topic_test' AND status = 'published'`, [course.id]);
    return { body: {
      course: { ...course, objectives: course.objectives },
      modules: mods.rows.map(m => ({ ...m, chapters: chs.rows.filter(c => c.moduleId === m.id) })),
      lessons: ls.rows.map(l => ({ ...l, state: lessonState[l.id] || { completed: false, bookmarked: false, bestScore: 0 } })),
      topicTest: quiz.rows[0] || null,
    } };
  }, { public: true });

  // Lesson detail: content blocks + prerequisites + the knowledge-check quiz id.
  // is_correct answers are NEVER included here (assessments.js serves questions
  // without the flags; scoring happens server-side at submit).
  router.get("/api/v1/catalog/lessons/:id", async (ctx) => {
    const r = await ctx.db.query(`
      SELECT l.*, c.title AS "courseTitle", c.id AS "courseId", c.code AS "courseCode",
             s.stage_number AS "stageNumber", ch.title AS "chapterTitle", m.title AS "moduleTitle"
      FROM lessons l JOIN courses c ON c.id = l.course_id
      JOIN learning_stages s ON s.id = l.stage_id
      JOIN chapters ch ON ch.id = l.chapter_id JOIN modules m ON m.id = ch.module_id
      WHERE l.id::text = $1 OR l.code = $1`, [ctx.params.id]);
    const lesson = r.rows[0];
    if (!lesson) throw notFound("No such lesson");
    if (lesson.status !== "published" && !(ctx.user && ["author", "admin"].includes(ctx.user.role))) {
      throw notFound("No such lesson");
    }
    if (ctx.user) {
      await logEvent(ctx.db, ctx.user.id, "lesson_view", "lesson", lesson.id);
      const best = await ctx.db.query(`
        SELECT coalesce(max(a.score), 0) AS best FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
        WHERE a.user_id = $1 AND q.lesson_id = $2 AND a.status = 'submitted'`, [ctx.user.id, lesson.id]);
      const note = await ctx.db.query(`SELECT body, updated_at FROM notes WHERE user_id = $1 AND lesson_id = $2`, [ctx.user.id, lesson.id]);
      const bm = await ctx.db.query(`SELECT 1 FROM bookmarks WHERE user_id = $1 AND lesson_id = $2`, [ctx.user.id, lesson.id]);
      const done = await ctx.db.query(`SELECT completed_at FROM lesson_completions WHERE user_id = $1 AND lesson_id = $2`, [ctx.user.id, lesson.id]);
      lesson.state = {
        completed: !!done.rows[0], completedAt: done.rows[0]?.completed_at || null,
        bookmarked: !!bm.rows[0], bestScore: best.rows[0].best,
        note: note.rows[0]?.body || null,
      };
    } else {
      lesson.state = { completed: false, bookmarked: false, bestScore: 0, note: null };
    }
    const quiz = await ctx.db.query(
      `SELECT id, code, title, pass_pct AS "passPct" FROM quizzes WHERE lesson_id = $1 AND status = 'published'`, [lesson.id]);
    const prevNext = await ctx.db.query(`
      WITH ordered AS (SELECT id, code, title, row_number() OVER (ORDER BY position) AS rn FROM lessons WHERE course_id = $1 AND status = 'published')
      SELECT (SELECT code FROM ordered WHERE rn = cur.rn - 1) AS prev, (SELECT code FROM ordered WHERE rn = cur.rn + 1) AS next
      FROM ordered cur WHERE cur.id = $2`, [lesson.courseId, lesson.id]);
    lesson.quiz = quiz.rows[0] || null;
    lesson.prevCode = prevNext.rows[0]?.prev || null;
    lesson.nextCode = prevNext.rows[0]?.next || null;
    return { body: { lesson } };
  }, { public: true });
}
