// src/learning/adaptive.js — the curriculum-aware recommendation engine.
//
// Factors (per the learning-engine specification):
//   1. completed lessons        — the baseline cursor through the curriculum
//   2. assessment results       — graded attempts feed subject/course mastery
//   3. prerequisite completion  — unmet foundations produce clear WARNINGS
//                                 (never silent skipping, never hard blocks)
//   4. struggle areas           — courses averaging < 70% jump the queue for
//                                 review before new material
//   5. learning stage           — recommendation stays within the learner's
//                                 current stage
//   6. mathematics first        — brand-new learners start with the mathematics
//                                 curriculum (Foundation Mathematics)
//
// Everything is computed from recorded activity; the client cannot claim a
// recommendation or suppress a warning.

const STRUGGLE_THRESHOLD = 70;   // average score below this flags a course/subject

export async function computeStruggles(db, userId) {
  const subjects = await db.query(
    `SELECT subject_key AS key, subject_name AS name, attempts, avg_score AS "avgScore",
            pass_rate AS "passRate", last_attempt_at AS "lastAttemptAt"
     FROM v_subject_mastery WHERE user_id = $1 ORDER BY avg_score`, [userId]);
  const courses = await db.query(
    `SELECT course_id AS id, course_code AS code, course_title AS title, attempts, avg_score AS "avgScore"
     FROM v_course_mastery WHERE user_id = $1 ORDER BY avg_score`, [userId]);
  return {
    subjects: subjects.rows.filter(s => s.attempts > 0 && s.avgScore < STRUGGLE_THRESHOLD),
    courses: courses.rows.filter(c => c.attempts > 0 && c.avgScore < STRUGGLE_THRESHOLD),
    allSubjects: subjects.rows,
    allCourses: courses.rows,
  };
}

export async function recommendNextLesson(db, userId) {
  const completed = await db.query(`
    SELECT lesson_id FROM lesson_completions WHERE user_id = $1`, [userId]);
  const completedIds = new Set(completed.rows.map(r => r.lesson_id));
  const total = await db.query(`SELECT count(*)::int AS n FROM lessons WHERE status = 'published'`);
  const struggles = await computeStruggles(db, userId);

  const ordered = await curriculumOrder(db);

  // 1) Mathematics-first rule for brand-new learners: no completions AND no
  //    graded attempts yet. Someone who has already attempted (and failed)
  //    checks is not brand-new — the struggle path below takes over.
  const isBrandNew = completedIds.size === 0 &&
    !(await db.query(`SELECT 1 FROM quiz_attempts WHERE user_id = $1 AND status = 'submitted' LIMIT 1`, [userId])).rows[0];
  if (isBrandNew) {
    const mathLesson = ordered.find(l => l.subject_key === "mathematics");
    if (mathLesson) {
      return {
        lesson: shape(mathLesson), stage: mathLesson.stage_no, overallPct: 0,
        lessonsDone: 0, lessonsTotal: total.rows[0].n,
        struggles: strugglesSubjectsView(struggles),
        reasons: [
          { factor: "mathematics-first", text: "The curriculum is ordered so every new learner starts with mathematics — the foundation the engineering stages build on." },
          { factor: "stage", text: `Starting at Stage ${mathLesson.stage_no}: ${mathLesson.stage_title}.` },
        ],
        warnings: [],
      };
    }
  }

  // 2) Struggle adjustment: the weakest attempted course gets the next
  //    incomplete lesson BEFORE new material elsewhere.
  const strugglingCourse = struggles.courses[0] || null;
  const strugglingCourseLesson = strugglingCourse
    ? ordered.find(l => l.course_id === strugglingCourse.id && !completedIds.has(l.id)) || null
    : null;

  // 3) The default cursor: first incomplete lesson in curriculum order.
  const nextLesson = ordered.find(l => !completedIds.has(l.id)) || null;

  const chosen = strugglingCourseLesson || nextLesson;
  if (!chosen) {
    return {
      lesson: null, stage: null, overallPct: 100,
      lessonsDone: completedIds.size, lessonsTotal: total.rows[0].n,
      struggles: strugglesSubjectsView(struggles),
      reasons: [{ factor: "complete", text: "Every published lesson is complete — take the mock exam or revisit the projects." }],
      warnings: [],
    };
  }

  const reasons = [];
  if (strugglingCourseLesson) {
    reasons.push({ factor: "struggle", text: `You are averaging ${strugglingCourse.avgScore}% in “${strugglingCourse.title}” — reviewing its next lesson before moving on.` });
    if (nextLesson && nextLesson.id !== strugglingCourseLesson.id) {
      reasons.push({ factor: "cursor", text: `The next new material would be “${nextLesson.title}” (${nextLesson.code}); the review above takes priority.` });
    }
  } else if (nextLesson) {
    reasons.push({ factor: "cursor", text: `Next incomplete lesson in curriculum order after ${completedIds.size} completed.` });
  }
  const lastScore = await db.query(`
    SELECT a.score, qz.title FROM quiz_attempts a JOIN quizzes qz ON qz.id = a.quiz_id
    WHERE a.user_id = $1 AND a.status = 'submitted' ORDER BY a.submitted_at DESC LIMIT 1`, [userId]);
  if (lastScore.rows[0]) {
    reasons.push({ factor: "assessment", text: `Last graded check: ${lastScore.rows[0].score}% on “${lastScore.rows[0].title}”.` });
  }
  reasons.push({ factor: "stage", text: `Stage ${chosen.stage_no}: ${chosen.stage_title}.` });

  // 4) Prerequisites: unmet foundations produce explicit warnings.
  const warnings = await prerequisiteWarnings(db, userId, chosen, completedIds, ordered);

  return {
    lesson: shape(chosen),
    stage: chosen.stage_no,
    overallPct: total.rows[0].n ? Math.round(100 * completedIds.size / total.rows[0].n) : 0,
    lessonsDone: completedIds.size,
    lessonsTotal: total.rows[0].n,
    struggles: strugglesSubjectsView(struggles),
    reasons,
    warnings,
  };
}

// Unmet lesson- AND course-level prerequisites, each with the concrete
// missing foundation and a plain-language warning. Skipping is possible — but
// never silent.
export async function prerequisiteWarnings(db, userId, lesson, completedIds, ordered) {
  const warnings = [];
  const lessonPrereqs = await db.query(`
    SELECT l.id, l.code, l.title FROM lesson_prerequisites lp
    JOIN lessons l ON l.id = lp.prerequisite_lesson_id
    WHERE lp.lesson_id = $1`, [lesson.id]);
  for (const p of lessonPrereqs.rows) {
    if (!completedIds.has(p.id)) {
      warnings.push({
        type: "lesson-prerequisite",
        missing: { id: p.id, code: p.code, title: p.title },
        text: `“${lesson.title}” builds on “${p.title}”, which you have not completed. Skipping ahead is allowed, but expect gaps.`,
      });
    }
  }
  const coursePrereqs = await db.query(`
    SELECT c.id, c.code, c.title FROM course_prerequisites cp
    JOIN courses c ON c.id = cp.prerequisite_course_id
    WHERE cp.course_id = $1`, [lesson.course_id]);
  for (const p of coursePrereqs.rows) {
    const done = await db.query(`
      SELECT count(*)::int AS done, (SELECT count(*)::int FROM lessons l2 WHERE l2.course_id = $2 AND l2.status = 'published') AS total
      FROM lesson_completions lc JOIN lessons l ON l.id = lc.lesson_id
      WHERE lc.user_id = $1 AND l.course_id = $2`, [userId, p.id]);
    const row = done.rows[0];
    if (row.done < row.total) {
      warnings.push({
        type: "course-prerequisite",
        missing: { id: p.id, code: p.code, title: p.title, lessonsDone: row.done, lessonsTotal: row.total },
        text: `“${lesson.title}” is part of “${lesson.course_title}”, which expects the essential foundation “${p.title}” first (${row.done}/${row.total} lessons complete). You can continue, but the gaps will show.`,
      });
    }
  }
  return warnings;
}

// The single source of curriculum order: stage → course sort (mathematics
// subject pinned first) → module → chapter → lesson.
export async function curriculumOrder(db) {
  const r = await db.query(`
    SELECT l.id, l.code, l.title, l.minutes, l.course_id, c.title AS course_title, c.code AS course_code, sub.key AS subject_key,
           s.stage_number AS stage_no, s.title AS stage_title,
           (SELECT c2.sort_order FROM courses c2 WHERE c2.id = l.course_id) AS course_no
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    JOIN subjects sub ON sub.id = c.subject_id
    JOIN learning_stages s ON s.id = l.stage_id
    WHERE l.status = 'published'
    ORDER BY s.stage_number,
             CASE WHEN sub.key = 'mathematics' THEN 0 ELSE 1 END,
             c.sort_order,
             (SELECT m.position FROM modules m JOIN chapters ch ON ch.module_id = m.id WHERE ch.id = l.chapter_id),
             (SELECT ch.position FROM chapters ch WHERE ch.id = l.chapter_id),
             l.position`);
  return r.rows;
}

function shape(l) {
  return {
    id: l.id, code: l.code, title: l.title, minutes: l.minutes,
    course: { id: l.course_id, title: l.course_title },
    stageNumber: l.stage_no,
    url: `/api/v1/catalog/lessons/${l.code}`,
  };
}

function strugglesSubjectsView(struggles) {
  return {
    subjects: struggles.subjects.map(s => ({ key: s.key, name: s.name, avgScore: s.avgScore, attempts: s.attempts })),
    courses: struggles.courses.map(c => ({ code: c.code, title: c.title, avgScore: c.avgScore, attempts: c.attempts })),
  };
}
