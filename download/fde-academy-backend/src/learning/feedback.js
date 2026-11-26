// src/learning/feedback.js — the knowledge-check feedback engine.
//
// For an INCORRECT answer it returns: why the chosen option is incorrect
// (authored per-option note when the CMS has one, otherwise a composed
// explanation grounded in the question's own explanation), why the correct
// answer is correct, a SIMPLER example drawn from the lesson's own content,
// and a link back to the relevant lesson.
// For a CORRECT answer it returns: why it is correct (the authored
// explanation) and the NEXT challenge (authored, or composed from the next
// lesson in the curriculum).
// Nothing is invented: composed strings are assembled from curriculum rows.

export async function buildAttemptFeedback(db, attemptId, userId) {
  const attempt = await loadAttempt(db, attemptId, userId);
  return buildQuizFeedback(db, attempt);
}

export async function buildQuizFeedback(db, attempt) {
  const rows = await db.query(`
    SELECT qs.id AS "questionId", qs.position, qs.prompt, qs.explanation,
           (SELECT o.id FROM question_options o WHERE o.question_id = qs.id AND o.is_correct) AS "correctOptionId",
           (SELECT o.text FROM question_options o WHERE o.question_id = qs.id AND o.is_correct) AS "correctOptionText",
           aa.option_id AS "chosenOptionId",
           (SELECT o.text FROM question_options o WHERE o.id = aa.option_id) AS "chosenOptionText",
           l.code AS "lessonCode", l.title AS "lessonTitle", l.id AS "lessonId",
           qf.simpler_example AS "simplerExample", qf.next_challenge AS "nextChallenge",
           ofb.misconception_note AS "misconceptionNote",
           qz.code AS "quizCode"
    FROM questions qs
    JOIN quizzes qz ON qz.id = qs.quiz_id
    LEFT JOIN attempt_answers aa ON aa.question_id = qs.id AND aa.attempt_id = $1
    LEFT JOIN lessons l ON l.id = qz.lesson_id
    LEFT JOIN question_feedback qf ON qf.question_id = qs.id
    LEFT JOIN option_feedback ofb ON ofb.option_id = aa.option_id
    WHERE qz.id = $2 ORDER BY qs.position`,
    [attempt.id, attempt.quiz_id]);
  const next = await nextLessonAfter(db, attempt.quiz_id);
  return {
    attemptId: attempt.id,
    score: attempt.score,
    passed: attempt.passed,
    questions: rows.rows.map(r => buildQuestionFeedback(r, next)),
  };
}

export function buildQuestionFeedback(row, nextLesson) {
  const lesson = row.lessonCode
    ? { code: row.lessonCode, title: row.lessonTitle, url: `/api/v1/catalog/lessons/${row.lessonCode}` }
    : null;
  const choseCorrect = row.chosenOptionId === row.correctOptionId;
  if (!choseCorrect) {
    return {
      questionId: row.questionId,
      outcome: "incorrect",
      lessonId: row.lessonId || null,
      chosen: { id: row.chosenOptionId, text: row.chosenOptionText },
      correct: { id: row.correctOptionId, text: row.correctOptionText },
      whyIncorrect: row.misconceptionNote && row.misconceptionNote.trim()
        ? row.misconceptionNote
        : `“${row.chosenOptionText}” does not survive the check in this scenario. The behaviour that actually holds: ${row.explanation}`,
      whyCorrect: row.explanation,
      simplerExample: row.simplerExample && row.simplerExample.trim()
        ? row.simplerExample
        : null, // caller composes from lesson content via composeSimplerExample
      lesson,
      nextChallenge: null,
    };
  }
  return {
    questionId: row.questionId,
    outcome: "correct",
    lessonId: row.lessonId || null,
    chosen: { id: row.chosenOptionId, text: row.chosenOptionText },
    whyCorrect: row.explanation,
    nextChallenge: row.nextChallenge && row.nextChallenge.trim()
      ? row.nextChallenge
      : composeNextChallenge(nextLesson),
    lesson,
  };
}

// Composed simpler example from the lesson's own teaching content: prefer the
// lesson's exercise blocks, then worked step tables, then the opening example.
export async function composeSimplerExamples(db, lessonIds) {
  if (!lessonIds.length) return new Map();
  const out = new Map();
  for (const lessonId of lessonIds) {
    const r = await db.query(`SELECT content, title FROM lessons WHERE id = $1`, [lessonId]);
    const lesson = r.rows[0];
    if (!lesson) continue;
    out.set(lessonId, composeSimplerExampleFromBlocks(lesson.content || [], lesson.title));
  }
  return out;
}

export function composeSimplerExampleFromBlocks(blocks, lessonTitle) {
  const exercise = blocks.find(b => b && b.t === "exercise" && b.prompt);
  if (exercise) {
    return `Simpler example (from “${lessonTitle}”): ${exercise.prompt}${exercise.solution ? ` — ${exercise.solution}` : ""}`;
  }
  const steps = blocks.find(b => b && b.t === "steps" && Array.isArray(b.steps) && b.steps.length);
  if (steps) {
    const first = steps.steps.find(s => s && (s.expr || s.note));
    if (first) {
      return `Simpler walkthrough (from “${lessonTitle}”): ${first.expr || ""}${first.note ? ` — ${first.note}` : ""}`;
    }
  }
  const para = blocks.find(b => b && b.t === "p" && typeof b.x === "string" && b.x.length > 40);
  if (para) return `Reread the core idea (from “${lessonTitle}”): ${para.x}`;
  return `Reread “${lessonTitle}” and redo its worked example before trying again.`;
}

function composeNextChallenge(nextLesson) {
  if (!nextLesson) return "You have cleared this check — take the course topic test to consolidate.";
  return `Next challenge: start “${nextLesson.title}” (${nextLesson.code})${nextLesson.firstObjective ? ` — ${nextLesson.firstObjective}` : ""}.`;
}

async function nextLessonAfter(db, quizId) {
  const r = await db.query(`
    WITH cur AS (
      SELECT l.id, l.code, l.title, l.course_id,
             (SELECT s.stage_number FROM learning_stages s WHERE s.id = l.stage_id) AS stage_no,
             (SELECT c.sort_order FROM courses c WHERE c.id = l.course_id) AS course_no,
             (SELECT m.position FROM modules m JOIN chapters ch ON ch.module_id = m.id WHERE ch.id = l.chapter_id) AS module_no,
             (SELECT ch.position FROM chapters ch WHERE ch.id = l.chapter_id) AS chapter_no,
             row_number() OVER (ORDER BY (SELECT s.stage_number FROM learning_stages s WHERE s.id = l.stage_id),
                        (SELECT c.sort_order FROM courses c WHERE c.id = l.course_id),
                        (SELECT m.position FROM modules m JOIN chapters ch ON ch.module_id = m.id WHERE ch.id = l.chapter_id),
                        (SELECT ch.position FROM chapters ch WHERE ch.id = l.chapter_id), l.position) AS rn
      FROM lessons l WHERE l.status = 'published'
    ),
    me AS (SELECT cur.rn FROM cur JOIN quizzes q ON q.lesson_id = cur.id WHERE q.id = $1)
    SELECT cur.id, cur.code, cur.title,
           (SELECT jsonb_array_length(l2.objectives) > 0 FROM lessons l2 WHERE l2.id = cur.id) AS has_obj,
           (SELECT l2.objectives -> 0 ->> 'x' FROM lessons l2 WHERE l2.id = cur.id) AS objective,
           (SELECT l2.objectives -> 0 FROM lessons l2 WHERE l2.id = cur.id) AS objective_raw
    FROM cur, me WHERE cur.rn = me.rn + 1`, [quizId]);
  const row = r.rows[0];
  if (!row) return null;
  return { id: row.id, code: row.code, title: row.title, firstObjective: objectiveText(row) };
}

function objectiveText(row) {
  if (typeof row.objective === "string") return row.objective;
  if (row.objective_raw && typeof row.objective_raw === "object") {
    return row.objective_raw.x || row.objective_raw.text || null;
  }
  return null;
}

async function loadAttempt(db, attemptId, userId) {
  const r = await db.query(`
    SELECT a.id, a.quiz_id, a.user_id, a.score, a.passed, a.status
    FROM quiz_attempts a WHERE a.id = $1`, [attemptId]);
  const a = r.rows[0];
  if (!a || (a.user_id !== userId)) return null;
  return a;
}
