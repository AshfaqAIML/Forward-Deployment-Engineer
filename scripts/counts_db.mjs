// scripts/counts_db.mjs — canonical seeded-content counts, verified by
// running the real seed against a pristine in-memory PostgreSQL (PGlite)
// and querying the resulting tables. No guessed numbers.
process.env.NODE_ENV = "test";
process.env.FDE_PGLITE_DIR = "";   // in-memory: pristine DB per process
process.env.FDE_DB = "auto";

const B = "/home/z/my-project/download/fde-academy-backend/src";
const { config } = await import(B + "/config.js");
const { getDb } = await import(B + "/db/index.js");
const { seed } = await import(B + "/db/seed.js");

const result = await seed();
const db = await getDb(config);
const rows = async (sql) => (await db.query(sql)).rows;

const tables = ["subjects", "learning_stages", "courses", "modules", "chapters",
  "lessons", "quizzes", "questions", "books", "book_editions", "book_chapters",
  "glossary_terms", "projects", "coding_exercises", "math_exercises"];
const totals = {};
for (const t of tables) totals[t] = (await rows(`SELECT count(*)::int n FROM ${t}`))[0].n;

const kinds = await rows("SELECT kind, count(*)::int n FROM quizzes GROUP BY kind ORDER BY kind");
const qByKind = await rows("SELECT qz.kind, count(q.id)::int n FROM questions q JOIN quizzes qz ON q.quiz_id = qz.id GROUP BY qz.kind ORDER BY qz.kind");
const perCourse = await rows(`
  SELECT co.code, co.title, count(DISTINCT l.id)::int lessons,
         count(DISTINCT q.id)::int quizzes
  FROM courses co
  LEFT JOIN lessons l ON l.course_id = co.id
  LEFT JOIN quizzes  q ON q.lesson_id = l.id
  GROUP BY co.code, co.title, co.sort_order ORDER BY co.sort_order`);
const books = await rows(`
  SELECT b.slug, b.title, count(e.id)::int editions,
         string_agg(DISTINCT e.format::text, ',' ORDER BY e.format::text) formats
  FROM books b LEFT JOIN book_editions e ON e.book_id = b.id
  GROUP BY b.slug, b.title, b.created_at ORDER BY b.created_at`);
const stageRows = await rows("SELECT stage_number, phase, title FROM learning_stages ORDER BY stage_number");
const subjectRows = await rows("SELECT key, name, position FROM subjects ORDER BY position");
const projectRows = await rows("SELECT code, title FROM projects ORDER BY code");
const codingRows = await rows("SELECT code, title FROM coding_exercises ORDER BY code");
const mathRows = await rows("SELECT code, title FROM math_exercises ORDER BY code");
const glossaryKeys = (await rows("SELECT key FROM glossary_terms ORDER BY key")).map(r => r.key);

console.log(JSON.stringify({
  seedSkipped: result?.skipped ?? false,
  totals, quizzesByKind: kinds, questionsByKind: qByKind,
  perCourse, books, stages: stageRows, subjects: subjectRows,
  projects: projectRows, coding: codingRows, maths: mathRows, glossaryKeys,
}, null, 1));
process.exit(0);
