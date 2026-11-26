# Database Schema — FDE Academy Backend

PostgreSQL 13+. Applied by `npm run migrate` (numbered, transactional,
checksummed, reversible). 39 user tables + 3 views + integrity triggers.
Entity-relationship overview: `docs/ER.png`.

## Conventions
- Primary keys: `uuid DEFAULT gen_random_uuid()`.
- Content enums: `content_status ('draft','in_review','published','archived')`.
- Mutable tables get an `updated_at` trigger (0008).
- Curriculum lesson/book content is JSONB using the frontend's block schema
  (`p`, `ul`, `table`, `code`, `callout`, `math`, `steps`, `nl`, `plot`, `ieq`,
  `frac`, `pct`, `geom`, `exercise`) — one content model across the platform.

## Users & access (0001)
| Table | Key columns / constraints | Relationships |
| --- | --- | --- |
| `users` | `email` unique (stored lowercase), `password_hash` (scrypt), `role user_role`, `status user_status`, `last_login_at` | 1–1 `user_profiles`, `learning_preferences`; 1–N `refresh_tokens`, `password_reset_tokens` |
| `user_profiles` | PK `user_id`; private fields (full name, country, timezone, bio, career goal) | FK → users CASCADE |
| `learning_preferences` | PK `user_id`; `weekly_goal_sessions 1–7`, `preferred_subjects text[]`, a11y flags | FK → users CASCADE |
| `refresh_tokens` | `token_hash` unique (sha256 of opaque token), `expires_at`, `revoked_at`, `user_agent`, `ip_hash` | FK → users CASCADE |
| `password_reset_tokens` | `token_hash` unique, `expires_at`, `used_at` (single use) | FK → users CASCADE |

## Learning content (0002)
| Table | Notes |
| --- | --- |
| `subjects` | `key` unique ('mathematics', 'programming', …) |
| `learning_stages` | `stage_number 1–18` unique, `phase A–G` — the roadmap backbone |
| `courses` | `code` unique; FK subject + stage; `difficulty` enum; `objectives jsonb`; status + `published_at` |
| `course_prerequisites` | self-relation (course_id, prerequisite_course_id) |
| `modules` | unique (course, position) |
| `chapters` | unique (module, position) |
| `lessons` | `code` unique ('fm-1'); FK course/chapter + denormalised `stage_id`; `content jsonb`; `version`; unique (chapter, position) |
| `lesson_prerequisites` | self-relation on lessons |
| `learning_resources` | links/videos attached to lessons or books (`url` must be http(s)) |

## Book library (0003)
| Table | Notes |
| --- | --- |
| `books` | `slug` unique; FK stage; status |
| `book_editions` | unique (book, version, format docx/doc/pdf/web) |
| `book_chapters` | unique (book, position); `content jsonb`; `full_web` flag |
| `files` | **`storage_key` unique — internal, never serialized**; checksum, bytes, mime; kind book/edition/chapter; FKs to book/edition/chapter with matching CHECKs |
| `file_versions` | unique (file, version) — old editions stay auditable |
| `download_tokens` | sha256 token hash unique; `expires_at`; `used_at` (single use); `requested_by` |
| `download_records` | audit log (file, user, timestamp) — no IPs, no emails |
| `book_reading_progress` | unique (user, chapter); `read` toggle, `last_read_at` |

## Assessment (0004)
| Table | Notes |
| --- | --- |
| `quizzes` | `code` unique; kind `lesson_check`/`topic_test`/`mock_exam` with CHECK binding to lesson/course; `pass_pct`; `time_limit_minutes` |
| `questions` | unique (quiz, position); `explanation` (served only after grading) |
| `question_options` | unique (question, position); **`is_correct` — server-only, never serialized to students** |
| `quiz_attempts` | status `in_progress/submitted/abandoned`; `score`, `passed`, `submitted_at` set ONLY by the submit flow; CHECK: submitted ⇒ score+passed+submitted_at present |
| `attempt_answers` | unique (attempt, question) |

Trigger `trg_question_options_single_correct` (DEFERRED): every question must
have **exactly one** correct option — validated at commit, so authors may insert
options row-by-row inside a transaction.

## Practical learning (0005)
| Table | Notes |
| --- | --- |
| `coding_exercises` | language JavaScript/SQL/HTTP/Python-guided; starter code; linked lesson |
| `math_exercises` | prompt + interactive component `config jsonb` |
| `exercise_hints` | owner (coding/math/project) + position; unlock policy in the API |
| `exercise_solutions` | unique per owner; `status` |
| `projects` | level 1–7; `steps jsonb`; `demo_checklist jsonb`; `concepts text[]` |
| `project_submissions` | unique (project, user); CHECK evidence ≥ 20 chars; checklist jsonb |
| `evaluation_results` | 1–1 with submission; `rubric jsonb`, `total 0–24`, `passed` |
| `lab_submissions` | sandbox code the student saved (1–20 000 chars) |

## Student activities (0006)
| Table | Notes |
| --- | --- |
| `lesson_completions` | unique (user, lesson); `quiz_attempt_id` — completion is quiz-gated |
| `bookmarks` | PK (user, lesson) |
| `notes` | unique (user, lesson); 1–2000 chars |
| `activity_events` | append-only audit trail (kind, subject_type/id, meta, at) — the source for streaks and analytics |
| `study_progress` | unique (user, course); maintained inside the completion transaction |
| `achievements` / `user_achievements` | earned server-side only |
| `glossary_terms` | `key` unique; simple/detailed/example; `is_admin_added`; status |

## Administration (0007)
| Table | Notes |
| --- | --- |
| `content_authors` | 1–1 with an author-role user |
| `content_drafts` | entity_type + optional entity_id + `payload jsonb`; status draft → in_review → approved/rejected → published |
| `content_reviews` | verdict + comments per review action |
| `content_revisions` | unique (entity_type, entity_id, version); full snapshots — rollback-capable history |
| `publish_events` | audit of publish/unpublish/archive actions |

## Views & search (0008)
- `v_content_health` — per quiz: attempts, avg score, pass rate (weak-quiz detection).
- `v_book_progress` — per user/book: chapters read vs total, pct.
- `v_download_log` — download audit without storage keys.
- Trigram GIN indexes (pg_trgm, best-effort) on lesson/course/book/glossary/project titles; search falls back to ILIKE where the extension is unavailable.
- `updated_at` triggers on all mutable tables.

## Seeded data (src/db/seed.js, from seed/content.json)
8 courses · 18 stages · 34 lessons with full content blocks · 40 quizzes
(139 questions with server-side correct answers) · 6 books (8+ chapters each,
content + generated `.doc` edition files in private storage with SHA-256
checksums and version rows) · 55 glossary terms · 15 projects · 9 exercises
(6 coding with gated hints/solutions, 3 math) · 5 achievement definitions.

## Operations
```bash
npm run migrate          # apply pending
npm run migrate:down 3   # revert last 3 (each .down.sql is provided)
npm run migrate:status   # applied/pending with checksums
```
Editing an applied migration is detected and refused (checksum mismatch) —
migrations are immutable once applied; ship a new one instead.
