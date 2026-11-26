#!/usr/bin/env node
// src/db/seed.js — loads the real FDE Academy curriculum (seed/content.json,
// generated from the content package) into the database, generates the
// downloadable book files in private storage, and (dev/test only, opt-in)
// creates demo accounts. Idempotent: refuses to double-seed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { getDb } from "./index.js";
import { migrate } from "./migrate.js";
import { config } from "../config.js";
import { createLogger } from "../logger.js";
import { hashPassword } from "../auth/passwords.js";

const log = createLogger({ level: config.logLevel, base: { component: "seed" } });
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const content = JSON.parse(readFileSync(path.join(ROOT, "seed/content.json"), "utf8"));

async function main() {
  const db = await getDb(config);
  await migrate(db, "up");
  const already = await db.query(`SELECT count(*)::int AS n FROM courses`);
  if (already.rows[0].n > 0) {
    log.warn("database already seeded — truncate first if you want a fresh seed");
    return { skipped: true };
  }

  const ids = {};   // code -> uuid lookups
  const q = async (sql, params) => (await db.query(sql, params)).rows[0];

  /* subjects + stages */
  for (const s of content.subjects) ids["subject:" + s.key] = (await q(
    `INSERT INTO subjects (key, name, position) VALUES ($1,$2,$3) RETURNING id`, [s.key, s.name, s.position])).id;
  for (const s of content.stages) ids["stage:" + s.number] = (await q(
    `INSERT INTO learning_stages (stage_number, phase, title, meta_text) VALUES ($1,$2,$3,$4) RETURNING id`,
    [s.number, s.phase, s.title, s.meta])).id;

  /* courses */
  for (const c of content.courses) {
    const diff = ["Beginner", "Intermediate", "Advanced"].includes(c.difficulty) ? c.difficulty : "Beginner";
    ids["course:" + c.code] = (await q(
      `INSERT INTO courses (code, title, subject_id, stage_id, difficulty, blurb, objectives, prereq_note, sort_order, status, published_at)
       VALUES ($1,$2,$3,$4,$5::difficulty_level,$6,$7,$8,$9,'published', now()) RETURNING id`,
      [c.code, c.title, ids["subject:" + c.subjectKey], ids["stage:" + c.stageNumber], diff,
       c.blurb, JSON.stringify(c.objectives), c.prereqNote, c.sortOrder])).id;
  }
  for (const [code, pre] of content.coursePrereqs) {
    await db.query(`INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES ($1,$2)`,
      [ids["course:" + code], ids["course:" + pre]]);
  }

  /* modules → chapters → lessons (+ knowledge-check quizzes) */
  for (const [courseCode, mods] of Object.entries(content.moduleChapters)) {
    const courseId = ids["course:" + courseCode];
    for (const m of mods) {
      const moduleId = (await q(
        `INSERT INTO modules (course_id, position, title) VALUES ($1,$2,$3) RETURNING id`,
        [courseId, m.position, m.title])).id;
      for (const ch of m.chapters) {
        const chapterId = (await q(
          `INSERT INTO chapters (module_id, position, title) VALUES ($1,$2,$3) RETURNING id`,
          [moduleId, ch.position, ch.title])).id;
        for (const code of ch.lessonCodes) {
          const l = content.lessons.find(x => x.code === code);
          ids["lesson:" + code] = (await q(
            `INSERT INTO lessons (code, course_id, chapter_id, stage_id, position, title, minutes, objectives, content, status, published_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published', now()) RETURNING id`,
            [code, courseId, chapterId, ids["stage:" + l.stageNumber], l.position, l.title, l.minutes,
             JSON.stringify(l.objectives), JSON.stringify(l.content)])).id;
        }
      }
    }
  }
  /* quiz questions: one transaction per batch so the deferred
     "exactly one correct option" trigger validates complete questions */
  let questionCount = 0;
  const testQuizzes = [];
  await db.transaction(async tx => {
    const qt = async (sql, params) => (await tx.query(sql, params)).rows[0];
    for (const quiz of content.quizzes) {
      const quizId = (await qt(
        `INSERT INTO quizzes (code, kind, lesson_id, title, pass_pct, status) VALUES ($1,'lesson_check',$2,$3,70,'published') RETURNING id`,
        [quiz.code, ids["lesson:" + quiz.lessonCode], quiz.title])).id;
      for (const qs of quiz.questions) {
        const questionId = (await qt(
          `INSERT INTO questions (quiz_id, position, prompt, explanation) VALUES ($1,$2,$3,$4) RETURNING id`,
          [quizId, qs.position, qs.prompt, qs.explanation])).id;
        for (let i = 0; i < qs.options.length; i++) {
          const optId = (await qt(
            `INSERT INTO question_options (question_id, position, text, is_correct) VALUES ($1,$2,$3,$4) RETURNING id`,
            [questionId, i + 1, qs.options[i], i === qs.answerIdx])).id;
          if (qs.optionNotes && qs.optionNotes[i]) {
            await tx.query(`INSERT INTO option_feedback (option_id, misconception_note) VALUES ($1,$2)`,
              [optId, qs.optionNotes[i]]);
          }
        }
        if (qs.simplerExample && qs.nextChallenge) {
          await tx.query(`INSERT INTO question_feedback (question_id, simpler_example, next_challenge) VALUES ($1,$2,$3)`,
            [questionId, qs.simplerExample, qs.nextChallenge]);
        }
        questionCount++;
      }
    }
    /* topic tests + mock exam */
    for (const t of content.tests) {
      const quizId = (await qt(
        `INSERT INTO quizzes (code, kind, course_id, title, pass_pct, time_limit_minutes, status) VALUES ($1,'topic_test',$2,$3,$4,$5,'published') RETURNING id`,
        [t.code, ids["course:" + t.courseCode], t.title, t.passPct, t.minutes])).id;
      testQuizzes.push([quizId, t.questions]);
    }
    testQuizzes.push([(await qt(
      `INSERT INTO quizzes (code, kind, title, pass_pct, time_limit_minutes, status) VALUES ($1,'mock_exam',$2,$3,$4,'published') RETURNING id`,
      [content.mock.code, content.mock.title, content.mock.passPct, content.mock.minutes])).id, content.mock.questions]);
    for (const [quizId, questions] of testQuizzes) {
      for (const qs of questions) {
        const questionId = (await qt(
          `INSERT INTO questions (quiz_id, position, prompt, explanation) VALUES ($1,$2,$3,$4) RETURNING id`,
          [quizId, qs.position, qs.prompt, qs.explanation])).id;
        for (let i = 0; i < qs.options.length; i++) {
          await tx.query(`INSERT INTO question_options (question_id, position, text, is_correct) VALUES ($1,$2,$3,$4)`,
            [questionId, i + 1, qs.options[i], i === qs.answerIdx]);
        }
        questionCount++;
      }
    }
  });
  const allQuizzes = testQuizzes;

  /* books + chapters + edition + real files in private storage */
  mkdirSync(path.join(config.storageDir, "books"), { recursive: true });
  for (const b of content.books) {
    const bookId = (await q(
      `INSERT INTO books (slug, title, subject, difficulty, description, objectives, stage_id, pages, status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published', now()) RETURNING id`,
      [b.slug, b.title, b.subject, b.difficulty, b.description, JSON.stringify(b.objectives),
       ids["stage:" + b.stageNumber], b.pages])).id;
    for (const ch of b.chapters) {
      await db.query(`INSERT INTO book_chapters (book_id, position, title, content, full_web) VALUES ($1,$2,$3,$4,$5)`,
        [bookId, ch.position, ch.title, JSON.stringify(ch.content), ch.fullWeb]);
    }
    const editionId = (await q(
      `INSERT INTO book_editions (book_id, version, format, notes) VALUES ($1,'1.0','doc','Word-compatible export') RETURNING id`,
      [bookId])).id;
    const doc = bookToDoc(b);
    const storageKey = `books/${b.slug}_v1.doc`;
    const filePath = path.join(config.storageDir, storageKey);
    writeFileSync(filePath, doc, "utf8");
    const checksum = crypto.createHash("sha256").update(doc, "utf8").digest("hex");
    const fileId = (await q(
      `INSERT INTO files (book_id, edition_id, kind, storage_key, original_filename, mime_type, bytes, checksum_sha256)
       VALUES ($1,$2,'edition',$3,$4,$5,$6,$7) RETURNING id`,
      [bookId, editionId, storageKey, `${b.slug}_FDE_Academy_v1.doc`, "application/msword",
       Buffer.byteLength(doc, "utf8"), checksum])).id;
    await db.query(
      `INSERT INTO file_versions (file_id, version, storage_key, bytes, checksum_sha256, note) VALUES ($1,1,$2,$3,$4,'initial edition')`,
      [fileId, storageKey, Buffer.byteLength(doc, "utf8"), checksum]);
  }

  /* glossary, projects, exercises */
  for (const g of content.glossary) {
    await db.query(`
      INSERT INTO glossary_terms (key, term, simple_meaning, detailed_meaning, example, related, category, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'published')`,
      [g.key, g.term, g.simple, g.detailed, g.example, g.related, g.category]);
  }
  for (const p of content.projects) {
    await db.query(`
      INSERT INTO projects (code, level, stage_id, title, customer, brief, steps, demo_checklist, concepts, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published')`,
      [p.code, p.level, ids["stage:" + p.stageNumber], p.title, p.customer, p.brief,
       JSON.stringify(p.steps), JSON.stringify(p.demoChecklist), p.concepts]);
  }
  for (const e of content.codingExercises) {
    const exId = (await q(
      `INSERT INTO coding_exercises (code, title, language, instructions, starter_code, minutes, linked_lesson_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'published') RETURNING id`,
      [e.code, e.title, e.language, e.instructions, e.starterCode, e.minutes,
       e.linkedLessonCode ? ids["lesson:" + e.linkedLessonCode] : null])).id;
    for (let i = 0; i < (e.hints || []).length; i++) {
      await db.query(`INSERT INTO exercise_hints (owner_type, owner_id, position, content) VALUES ('coding_exercise',$1,$2,$3)`,
        [exId, i + 1, e.hints[i]]);
    }
    if (e.solution) {
      await db.query(`INSERT INTO exercise_solutions (owner_type, owner_id, content, status) VALUES ('coding_exercise',$1,$2,'published')`,
        [exId, e.solution]);
    }
  }
  for (const e of content.mathExercises) {
    const exId = (await q(
      `INSERT INTO math_exercises (code, title, prompt, config, minutes, linked_lesson_id, status)
       VALUES ($1,$2,$3,'{}',$4,$5,'published') RETURNING id`,
      [e.code, e.title, e.prompt, e.minutes, e.linkedLessonCode ? ids["lesson:" + e.linkedLessonCode] : null])).id;
    if (e.solution) {
      await db.query(`INSERT INTO exercise_solutions (owner_type, owner_id, content, status) VALUES ('math_exercise',$1,$2,'published')`,
        [exId, e.solution]);
    }
  }

  /* achievements */
  for (const a of [
    ["first-lesson", "First verified lesson", "Complete your first lesson through a passing knowledge check", "star"],
    ["stage-a-complete", "Foundations finished", "Complete every Stage A lesson", "target"],
    ["first-book", "Bookworm", "Mark your first book chapter as read", "book"],
    ["first-project", "Portfolio started", "Submit your first Level 1 project", "briefcase"],
    ["streak-7", "Seven-day streak", "Seven consecutive active days", "flask"],
  ]) {
    await db.query(`INSERT INTO achievements (code, title, description, icon) VALUES ($1,$2,$3,$4)`, a);
  }

  /* demo accounts (dev/test only, config-gated) */
  const demo = {};
  if (config.seedDemoUsers) {
    const password = process.env.FDE_DEMO_PASSWORD || "ChangeMe-2026!";
    for (const [email, role, name] of [
      ["admin@fde.local", "admin", "Academy Admin"],
      ["author@fde.local", "author", "Content Author"],
      ["student@fde.local", "student", "Demo Student"],
    ]) {
      const u = (await q(
        `INSERT INTO users (email, password_hash, display_name, role, email_verified) VALUES ($1,$2,$3,$4,true) RETURNING id`,
        [email, hashPassword(password), name, role])).id;
      await db.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [u]);
      await db.query(`INSERT INTO learning_preferences (user_id) VALUES ($1)`, [u]);
      if (role === "author") await db.query(`INSERT INTO content_authors (user_id, bio) VALUES ($1,$2)`, [u, "Curriculum author"]);
      demo[role] = u;
    }
    log.warn("demo users seeded — passwords are the FDE_DEMO_PASSWORD value; NEVER enable this in production");
  }

  const summary = {
    subjects: content.subjects.length, stages: content.stages.length, courses: content.courses.length,
    lessons: content.lessons.length, quizzes: content.quizzes.length + allQuizzes.length,
    questions: questionCount, books: content.books.length, glossary: content.glossary.length,
    projects: content.projects.length, codingExercises: content.codingExercises.length,
    mathExercises: content.mathExercises.length, demoUsers: Object.keys(demo).length,
  };
  log.info("seed complete", summary);
  return summary;
}

function bookToDoc(b) {
  const paras = block => {
    switch (block.t) {
      case "p": return `<p>${block.x}</p>`;
      case "ul": return `<ul>${(block.items || []).map(i => `<li>${i}</li>`).join("")}</ul>`;
      case "exercise": return `<p><b>Exercise:</b> ${block.prompt}</p><p><i>Solution:</i> ${block.solution || ""}</p>`;
      case "table": return `<p><b>${block.caption || "Table"}</b></p><table border="1">${(block.rows || []).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;
      case "steps": return `<p><b>${block.title}</b></p>${(block.steps || []).map(s => `<p>${s.expr}<br><i>${s.note || ""}</i></p>`).join("")}`;
      default: return `<p>[interactive component: ${block.t} — see the web edition]</p>`;
    }
  };
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${b.title}</title></head>
<body style="font-family:Georgia,serif;max-width:680px;margin:40px auto;line-height:1.7">
<p style="font-size:11px;letter-spacing:2px;color:#8F5229">FDE ACADEMY SERIES</p>
<h1>${b.title}</h1><p style="color:#666">${b.description}</p>
<h2>Learning objectives</h2><ul>${b.objectives.map(o => `<li>${o}</li>`).join("")}</ul>
<h2>Table of contents</h2><ol>${b.chapters.map(c => `<li>${c.title}</li>`).join("")}</ol>
${b.chapters.map(c => `<h2>${c.title}</h2>${(c.content || []).map(paras).join("")}`).join("")}
<p style="color:#666;font-size:12px">© FDE Academy — generated by the backend seeder, ${new Date().toISOString().slice(0, 10)}.</p>
</body></html>`;
}

if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  const summary = await main();
  console.log(JSON.stringify(summary, null, 1));
  process.exit(0);
}
export { main as seed };
