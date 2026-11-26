# FDE Academy — Content Inventory (verified 2026-11-26)

Educational content currently present in the platform. **Every number in this
file was verified on 2026-11-26 by three independent reads**: (1) the canonical
seed payload `fde-academy-backend/seed/content.json`, (2) a pristine
in-memory PostgreSQL seeded through the real `src/db/seed.js` and queried with
SQL (`scripts/counts_db.mjs`), and (3) the SPA's offline copy evaluated from
`scripts/web/data1–5.js` in a VM (`scripts/counts_spa.mjs`). No number here is
manually guessed; where the sources disagree, the disagreement is documented
in §7.

## 1. Sources of truth

| Content copy | Location | Notes |
|---|---|---|
| Canonical payload | `fde-academy-backend/seed/content.json` | What `npm run seed` loads into PostgreSQL |
| Live database | PostgreSQL (50 tables, 5 views) via `src/db/seed.js` + 11 migrations | Production/PGlite; the served truth |
| SPA offline copy | `scripts/web/data1.js` … `data5.js` (`STAGES`, `COURSES`, `LESSONS`, `BOOKS`, …) | Lets the single-file app work offline; must mirror the seed |
| Print-edition books | `fde-book-pipeline/` (built editions in `dist/`) | Published to the platform via `publish.py`; not part of the seed payload |

The deployment flow is: seed (placeholder `.doc` editions) → book pipeline
`publish.py` attaches the real DOCX + PDF editions. A freshly seeded database
has 6 editions; a fully published deployment has 18 (6 books × 3 formats).

## 2. Headline counts (all three sources cross-checked)

| Category | Count | Where verified |
|---|---|---|
| Subjects | **4** | content.json, `subjects` table |
| Learning stages | **18** | content.json, `learning_stages` table, SPA `STAGES` |
| Phases (stage groups) | 7 | SPA `PHASES` (A–G); DB stores `phase` per stage |
| Courses | **8** | content.json, `courses` table, SPA `COURSES` |
| Modules / chapters (course structure) | 15 / 15 | `modules`, `chapters` tables (from content.json `moduleChapters`) |
| Lessons | **34** | content.json, `lessons` table, SPA `LESSONS` |
| Lesson knowledge-check quizzes | **34** (one per lesson) | `quizzes kind='lesson_check'`; SPA inline `lesson.quiz` |
| Topic tests | **5** (25 questions) | `quizzes kind='topic_test'`; SPA `TOPIC_TESTS` |
| Mock exam | **1** (12 questions, 25 min, 60% pass) | `quizzes kind='mock_exam'`; SPA `MOCK_EXAM` |
| Quizzes total | **40** (34 + 5 + 1) | `quizzes` table |
| Quiz questions total | **139** (102 + 25 + 12) | `questions` table |
| Books | **6** | content.json, `books` table, SPA `BOOKS` |
| Book chapters | **37** (fm 8, alg 8, log 6, gph 5, ps 5, hb 5) | `book_chapters` table, content.json |
| Book editions | 6 seeded (`.doc` placeholders) → **18** after publish (doc, docx, pdf) | `book_editions` |
| Glossary terms | **56** database / **55** SPA — see §7 | `glossary_terms`, SPA `DATA_READY_GLOSSARY` |
| Projects | **15** | content.json, `projects` table, SPA `PROJECTS` |
| Coding exercises | **6** | content.json, `coding_exercises` table, SPA labs |
| Mathematics exercises | **3** | content.json, `math_exercises` table, SPA labs |
| Labs (SPA presentation of the above) | 9 = 3 maths + 6 coding | SPA `LABS` |
| SQL practice table (sql lab dataset) | 12 rows | SPA `SQL_TABLE` |
| FAQ / help corpus | 8 entries (+5 home FAQ) | SPA `FAQ_CORPUS`, `HOME_FAQ` |
| Career centre | 6 tabs (guide, interview, sysdesign, portfolio, cv, comms) | SPA `CAREER` |

Related but distinct: the full print-programme catalogue
(`download/FDE_Academy_Book_Catalogue.json`) describes the **32-book, 404
chapter, 1,820-hour** programme blueprint that the six platform books are the
first published slice of. Those numbers are programme-level design figures,
not platform content counts, and must not be mixed with the table above.

## 3. Subjects (4)

| Key | Name |
|---|---|
| `orientation` | Orientation |
| `mathematics` | Mathematics |
| `programming` | Programming |
| `ai` | AI |

## 4. Courses (8) with lesson and quiz distribution

| Code | Course | Stage | Lessons | Quizzes (lesson checks) |
|---|---|---|---|---|
| `start` | Start Here & Study Skills | 1 | 3 | 3 |
| `fm` | Foundation Mathematics | 2 | 6 | 6 |
| `algebra` | Algebra Essentials | 3 | 4 | 4 |
| `logic` | Logic & Proof | 4 | 4 | 4 |
| `graphs` | Graphs & Networks | 5 | 4 | 4 |
| `ps` | Problem Solving | 6 | 4 | 4 |
| `prog1` | Programming Foundations (Python) | 7 | 5 | 5 |
| `ai1` | AI Engineering I: Assistants | 15 | 4 | 4 |
| | **Total** | | **34** | **34** |

## 5. Lessons (34) — identifiers

Lesson codes (identical in the seed payload, the `lessons` table, and the SPA
route `#/lesson/:id`): `st-1…st-3`, `fm-1…fm-6`, `al-1…al-4`, `lo-1…lo-4`,
`gr-1…gr-4`, `ps-1…ps-4`, `pg-1…pg-5`, `ai-1…ai-4`. Each lesson carries
objectives, minutes, content blocks and its knowledge-check quiz.

## 6. Assessments, books, projects, exercises — identifiers

- **Topic tests (5):** `tt-fm`, `tt-al`, `tt-lo`, `tt-gr`, `tt-pg` — 25
  questions total.
- **Mock exam (1):** `mock-a` — 12 questions, 25 minutes, 60% pass mark.
- **Books (6):** slugs `fm` (Foundation Mathematics), `alg` (Algebra: From
  Expressions to Quadratics), `log` (Logic & Proof), `gph` (Graphs &
  Networks), `ps` (Problem Solving), `hb` (FDE Project Handbook); 37
  chapters; DOCX/PDF editions ~0.5–0.7 MB each after publishing.
- **Projects (15):** `p1-1`, `p1-2`, `p2-1`, `p2-2`, `p3-1`, `p3-2`, `p4-1`,
  `p4-2`, `p5-1`, `p5-2`, `p6-1`, `p6-2`, `p7-1`, `p7-2`, `p7-3` — each with
  customer brief, steps, demonstration checklist and concepts.
- **Coding exercises (6):** `code-c1`, `code-c2`, `code-c3`, `sql-1`,
  `api-1`, `ai-1` — instructions, starter code, hints, verified solutions;
  linked to lessons.
- **Mathematics exercises (3):** `maths-fraction`, `maths-percent`,
  `maths-geometry` — prompt, minutes, solution; linked to lessons.
- **Glossary terms (56):** keys such as `argument`, `assumption`, `bottleneck`,
  `conjecture`, `…` — each with term, simple and detailed explanations,
  example, related keys, category. Full list: `SELECT key FROM glossary_terms`.

## 7. Known drift between copies (verified, deliberate non-fix)

The database and the seed payload have **56** glossary terms; the SPA's
offline copy has **55**: the term **`argument-logic`** exists in the seed but
not in `scripts/web/data2.js` (`GLOSSARY_BASE`). Impact: the offline glossary
route shows 55 terms; signed-in server-backed rendering sees 56. It is not
fixed in this documentation round because fixing it would change the frontend
artifact and break the byte-identity guarantee. It is the recommended next
content task (see worklog.md).

## 8. How to re-verify these numbers

```bash
node scripts/counts_db.mjs    # in-memory seed + SQL counts (the live truth)
node scripts/counts_spa.mjs   # SPA offline copy counts
python3 -c "import json; c=json.load(open('download/fde-academy-backend/seed/content.json')); print({k: len(v) if isinstance(v,(list,dict)) else v for k,v in c.items()})"
```

Agreement of the three outputs (modulo the §7 glossary exception) is the
content-consistency check; run it after any content change.
