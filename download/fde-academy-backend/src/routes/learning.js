// src/routes/learning.js — the learning-engine surface: the unified
// curriculum tree, inline knowledge-check practice with full feedback,
// graded-attempt feedback, the adaptive recommendation, and mastery views.
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, unauthorized, unprocessable } from "../errors.js";
import { requirePermission } from "../rbac.js";
import { logEvent } from "../activity.js";
import { buildQuizFeedback, composeSimplerExamples } from "../learning/feedback.js";
import { recommendNextLesson, computeStruggles } from "../learning/adaptive.js";

export function registerLearningRoutes(router) {

  /* ---- the unified curriculum tree (stages → courses → … → lessons,
         with the stage's books, projects and exercises attached) ---- */
  router.get("/api/v1/curriculum/tree", async (ctx) => {
    const stages = await ctx.db.query(`
      SELECT s.id, s.stage_number AS "stageNumber", s.phase, s.title, s.meta_text AS meta
      FROM learning_stages s ORDER BY s.stage_number`);
    const courses = await ctx.db.query(`
      SELECT c.id, c.code, c.title, c.blurb, c.difficulty, c.status, c.sort_order AS "sortOrder",
             sub.key AS subject, s.stage_number AS "stageNumber",
             (SELECT count(*)::int FROM lessons l WHERE l.course_id = c.id AND l.status = 'published') AS lessons
      FROM courses c JOIN subjects sub ON sub.id = c.subject_id
      JOIN learning_stages s ON s.id = c.stage_id
      ${visibilityWhere(ctx)} ORDER BY s.stage_number, CASE WHEN sub.key = 'mathematics' THEN 0 ELSE 1 END, c.sort_order`, []);
    const modules = await ctx.db.query(`
      SELECT m.id, m.course_id AS "courseId", m.title, m.position FROM modules m
      JOIN courses c ON c.id = m.course_id ${visibilityWhere(ctx, "c")} ORDER BY m.position`);
    const chapters = await ctx.db.query(`
      SELECT ch.id, ch.module_id AS "moduleId", ch.title, ch.position FROM chapters ch
      JOIN modules m ON m.id = ch.module_id JOIN courses c ON c.id = m.course_id
      ${visibilityWhere(ctx, "c")} ORDER BY ch.position`);
    const lessons = await ctx.db.query(`
      SELECT l.id, l.code, l.title, l.minutes, l.chapter_id AS "chapterId", l.course_id AS "courseId",
             (SELECT qz.id FROM quizzes qz WHERE qz.lesson_id = l.id AND qz.status = 'published' LIMIT 1) AS "quizId"
      FROM lessons l JOIN courses c ON c.id = l.course_id
      ${visibilityWhere(ctx, "c")} ORDER BY l.position`);
    const books = await ctx.db.query(`
      SELECT b.slug, b.title, s.stage_number AS "stageNumber" FROM books b
      LEFT JOIN learning_stages s ON s.id = b.stage_id
      WHERE b.status = 'published' ORDER BY s.stage_number NULLS LAST`);
    const projects = await ctx.db.query(`
      SELECT p.code, p.title, p.level, s.stage_number AS "stageNumber" FROM projects p
      LEFT JOIN learning_stages s ON s.id = p.stage_id
      WHERE p.status = 'published' ORDER BY p.level`);
    const byChapter = new Map();
    for (const l of lessons.rows) {
      if (!byChapter.has(l.chapterId)) byChapter.set(l.chapterId, []);
      byChapter.get(l.chapterId).push({ id: l.id, code: l.code, title: l.title, minutes: l.minutes, quizId: l.quizId });
    }
    const byModule = new Map();
    for (const ch of chapters.rows) {
      if (!byModule.has(ch.moduleId)) byModule.set(ch.moduleId, []);
      byModule.get(ch.moduleId).push({ id: ch.id, title: ch.title, position: ch.position, lessons: byChapter.get(ch.id) || [] });
    }
    const byCourse = new Map();
    for (const m of modules.rows) {
      if (!byCourse.has(m.courseId)) byCourse.set(m.courseId, []);
      byCourse.get(m.courseId).push({ id: m.id, title: m.title, position: m.position, chapters: byModule.get(m.id) || [] });
    }
    const tree = stages.rows.map(s => ({
      stageNumber: s.stageNumber, phase: s.phase, title: s.title, meta: s.meta, id: s.id,
      courses: courses.rows.filter(c => c.stageNumber === s.stageNumber)
        .map(c => ({ ...c, modules: byCourse.get(c.id) || [] })),
      books: books.rows.filter(b => b.stageNumber === s.stageNumber).map(b => b.slug),
      projects: projects.rows.filter(p => p.stageNumber === s.stageNumber).map(p => p.code),
    }));
    // Per-user lesson state, folded into the lesson nodes when authenticated.
    if (ctx.user) {
      const state = await ctx.db.query(`
        SELECT l.id,
          EXISTS (SELECT 1 FROM lesson_completions lc WHERE lc.user_id = $1 AND lc.lesson_id = l.id) AS completed,
          (SELECT coalesce(max(a.score), 0) FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
            WHERE a.user_id = $1 AND q.lesson_id = l.id AND a.status = 'submitted') AS best
        FROM lessons l`, [ctx.user.id]);
      const m = new Map(state.rows.map(x => [x.id, { completed: x.completed, bestScore: x.best }]));
      const fold = (lesson) => lesson.completed !== undefined ? lesson : { ...lesson, state: m.get(lesson.id) || { completed: false, bestScore: 0 } };
      for (const stage of tree) for (const course of stage.courses) for (const mod of course.modules) for (const ch of mod.chapters) {
        ch.lessons = ch.lessons.map(fold);
      }
    }
    return { body: { tree, note: "Mathematics curriculum is ordered first for new learners." } };
  }, { public: true });

  /* ---- inline knowledge checks: practice mode (ungraded, full feedback) ---- */
  router.get("/api/v1/lessons/:code/check", async (ctx) => {
    const quiz = await loadLessonQuiz(ctx.db, ctx.params.code);
    return quizBody(quiz);
  }, { public: true });

  // POST answers, receive the complete per-question feedback immediately.
  // NOT a graded attempt: it never touches quiz_attempts; the activity trail
  // records it as practice (visible in history, excluded from mastery).
  router.post("/api/v1/lessons/:code/check", async (ctx) => {
    const body = validate({ answers: "array:100" }, ctx.body);
    const quiz = await loadLessonQuiz(ctx.db, ctx.params.code);
    const questions = await ctx.db.query(
      `SELECT id FROM questions WHERE quiz_id = $1`, [quiz.id]);
    const byQuestion = new Map(questions.rows.map(q => [q.id, q]));
    const chosen = new Map();
    for (const a of body.answers) {
      const clean = validate({ questionId: "uuid", optionId: "uuid" }, a);
      if (!byQuestion.has(clean.questionId)) {
        throw unprocessable("Answer rejected", [{ field: "answers", message: "question does not belong to this knowledge check" }]);
      }
      const ok = await ctx.db.query(
        `SELECT 1 FROM question_options WHERE id = $1 AND question_id = $2`, [clean.optionId, clean.questionId]);
      if (!ok.rows[0]) {
        throw unprocessable("Answer rejected", [{ field: "answers", message: "option does not belong to this question" }]);
      }
      chosen.set(clean.questionId, clean.optionId);
    }
    // assemble the same feedback structure the graded path uses
    const rows = await ctx.db.query(`
      SELECT qs.id AS "questionId", qs.position, qs.prompt, qs.explanation,
             (SELECT o.id FROM question_options o WHERE o.question_id = qs.id AND o.is_correct) AS "correctOptionId",
             (SELECT o.text FROM question_options o WHERE o.question_id = qs.id AND o.is_correct) AS "correctOptionText",
             l.code AS "lessonCode", l.title AS "lessonTitle", l.id AS "lessonId",
             qf.simpler_example AS "simplerExample", qf.next_challenge AS "nextChallenge"
      FROM questions qs
      JOIN quizzes qz ON qz.id = qs.quiz_id
      LEFT JOIN lessons l ON l.id = qz.lesson_id
      LEFT JOIN question_feedback qf ON qf.question_id = qs.id
      WHERE qz.id = $1 ORDER BY qs.position`, [quiz.id]);
    // per-question chosen option text + override note
    const optionNotes = await ctx.db.query(`
      SELECT o.id, o.text, ofb.misconception_note AS note FROM question_options o
      JOIN questions qs ON qs.id = o.question_id
      LEFT JOIN option_feedback ofb ON ofb.option_id = o.id
      WHERE qs.quiz_id = $1`, [quiz.id]);
    const optionMap = new Map(optionNotes.rows.map(o => [o.id, o]));
    const next = await nextLessonOf(ctx.db, quiz.id);
    const simpler = await composeSimplerExamples(ctx.db, rows.rows.map(r => r.lessonId).filter(Boolean));
    let correctCount = 0;
    const feedback = rows.rows.map(r => {
      const chosenId = chosen.get(r.questionId);
      const row = {
        ...r,
        chosenOptionId: chosenId || null,
        chosenOptionText: chosenId ? (optionMap.get(chosenId)?.text ?? null) : null,
        misconceptionNote: chosenId ? (optionMap.get(chosenId)?.note ?? null) : null,
      };
      if (chosenId === r.correctOptionId) correctCount++;
      const fb = buildRow(row, next);
      if (fb.outcome === "incorrect" && !fb.simplerExample) {
        fb.simplerExample = r.lessonId && simpler.get(r.lessonId) || null;
      }
      return fb;
    });
    const questionCount = rows.rows.length;
    const score = questionCount ? Math.round(100 * correctCount / questionCount) : 0;
    if (ctx.user) {
      await logEvent(ctx.db, ctx.user.id, "practice_submit", "lesson", rows.rows[0]?.lessonId || null,
        { quizCode: quiz.code, score, correctCount, questionCount });
    }
    return { body: { mode: "practice", score, correctCount, questionCount, feedback } };
  }, { public: true });

  /* ---- graded-attempt feedback (owner or admin) ---- */
  router.get("/api/v1/assessments/attempts/:id/feedback", async (ctx) => {
    if (!ctx.user) throw unauthorized();
    const r = await ctx.db.query(`SELECT id, quiz_id, user_id, score, passed FROM quiz_attempts WHERE id = $1`, [ctx.params.id]);
    const attempt = r.rows[0];
    if (!attempt || (attempt.user_id !== ctx.user.id && ctx.user.role !== "admin")) throw notFound("No such attempt");
    const result = await buildQuizFeedback(ctx.db, attempt);
    // fill composed simpler examples where not authored
    const lessonIds = result.questions.map(q => q.lessonId).filter(Boolean);
    const simpler = await composeSimplerExamples(ctx.db, lessonIds);
    for (const q of result.questions) {
      if (q.outcome === "incorrect" && !q.simplerExample) {
        q.simplerExample = simpler.get(q.lessonId) || null;
      }
    }
    return { body: result };
  });

  /* ---- the adaptive recommendation ---- */
  router.get("/api/v1/me/recommendation", async (ctx) => {
    if (!ctx.user) throw unauthorized();
    const rec = await recommendNextLesson(ctx.db, ctx.user.id);
    return { body: rec };
  });

  /* ---- mastery / struggle views ---- */
  router.get("/api/v1/me/mastery", async (ctx) => {
    if (!ctx.user) throw unauthorized();
    const s = await computeStruggles(ctx.db, ctx.user.id);
    return { body: {
      subjects: s.allSubjects,
      courses: s.allCourses,
      struggles: {
        threshold: 70,
        subjects: s.subjects,
        courses: s.courses,
      },
    } };
  });
}

/* ---- helpers ---- */
function visibilityWhere(ctx, alias = "c") {
  const canSeeDrafts = ctx.user && ["author", "admin"].includes(ctx.user.role) && ctx.query.includeDrafts === "1";
  return canSeeDrafts ? "" : `WHERE ${alias}.status = 'published'`;
}

async function loadLessonQuiz(db, code) {
  const r = await db.query(`
    SELECT qz.* FROM quizzes qz JOIN lessons l ON l.id = qz.lesson_id
    WHERE (l.code = $1 OR l.id::text = $1) AND qz.status = 'published'`, [String(code)]);
  const quiz = r.rows[0];
  if (!quiz) throw notFound("No knowledge check for this lesson");
  return quiz;
}

function quizBody(quiz) {
  // answers not included — the practice endpoint returns feedback only
  return { quiz: { id: quiz.id, code: quiz.code, title: quiz.title, passPct: quiz.pass_pct } };
}

function buildRow(row, next) {
  const choseCorrect = row.chosenOptionId && row.chosenOptionId === row.correctOptionId;
  const lesson = row.lessonCode ? { code: row.lessonCode, title: row.lessonTitle, url: `/api/v1/catalog/lessons/${row.lessonCode}` } : null;
  if (!choseCorrect) {
    return {
      questionId: row.questionId,
      outcome: "incorrect",
      chosen: { id: row.chosenOptionId, text: row.chosenOptionText },
      correct: { id: row.correctOptionId, text: row.correctOptionText },
      whyIncorrect: row.misconceptionNote && row.misconceptionNote.trim()
        ? row.misconceptionNote
        : `“${row.chosenOptionText}” does not survive the check in this scenario. The behaviour that actually holds: ${row.explanation}`,
      whyCorrect: row.explanation,
      simplerExample: row.simplerExample && row.simplerExample.trim() ? row.simplerExample : null,
      lesson,
      nextChallenge: null,
    };
  }
  return {
    questionId: row.questionId,
    outcome: "correct",
    chosen: { id: row.chosenOptionId, text: row.chosenOptionText },
    whyCorrect: row.explanation,
    nextChallenge: row.nextChallenge && row.nextChallenge.trim()
      ? row.nextChallenge
      : next ? `Next challenge: start “${next.title}” (${next.code}).` : "You have cleared this check — take the course topic test to consolidate.",
    lesson,
  };
}

async function nextLessonOf(db, quizId) {
  const r = await db.query(`
    WITH cur AS (
      SELECT l.id, l.code, l.title,
             row_number() OVER (ORDER BY (SELECT s.stage_number FROM learning_stages s WHERE s.id = l.stage_id),
                        (SELECT c.sort_order FROM courses c WHERE c.id = l.course_id),
                        (SELECT m.position FROM modules m JOIN chapters ch ON ch.module_id = m.id WHERE ch.id = l.chapter_id),
                        (SELECT ch.position FROM chapters ch WHERE ch.id = l.chapter_id), l.position) AS rn
      FROM lessons l WHERE l.status = 'published'),
    me AS (SELECT cur.rn FROM cur JOIN quizzes q ON q.lesson_id = cur.id WHERE q.id = $1)
    SELECT cur.id, cur.code, cur.title FROM cur, me WHERE cur.rn = me.rn + 1`, [quizId]);
  return r.rows[0] || null;
}
