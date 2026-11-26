# API Reference — FDE Academy Backend v1

Base URL: `http://<host>:<port>/api/v1` · Content type: `application/json`
Authentication: `Authorization: Bearer <accessToken>` (15-minute JWTs; obtain via
register/login/refresh).

Error format (uniform, every endpoint):

```json
{ "error": { "code": "validation_failed", "message": "…", "details": [ { "field": "email", "message": "…" } ] } }
```

Status codes: 400 malformed request · 401 unauthenticated/bad token ·
403 forbidden (role, suspension, expired link) · 404 not found (also used to
avoid disclosing other users' resources) · 409 conflict · 413 body too large ·
422 validation failed.

## Contents
1. [Health](#health)
2. [Authentication](#authentication)
3. [Account & preferences](#account--preferences)
4. [Catalog: subjects, stages, courses, lessons](#catalog)
5. [Assessments: quizzes, attempts, scoring](#assessments)
6. [Student progress, notes, bookmarks, history](#student-data)
7. [Books, reading progress, secure downloads](#books--downloads)
8. [Exercises: coding & math, hints, solutions, lab submissions](#exercises)
9. [Projects & submissions](#projects)
10. [Search & glossary](#search--glossary)
11. [Authoring: drafts, review, publish](#authoring)
12. [Admin: analytics, users, glossary, revisions, downloads, evaluation](#admin)

---

## Health
`GET /health` → `{ ok, service, version, time }` — public, no auth.

## Authentication

### POST /auth/register — public
```json
{ "email": "maya@example.io", "password": "Tr0ub4dor&3", "displayName": "Maya" }
```
201 → `{ user: { id, email, displayName, role: "student" }, accessToken, refreshToken,
tokenType: "Bearer", expiresInMinutes }`.
Rules: lowercase email; password ≥ 10 chars with a letter and a digit. Unknown
fields (e.g. `role`) are stripped — escalation is impossible. 409 if the email exists.

### POST /auth/login — public
`{ email, password }` → 200 session payload (above). 401 with a generic message
for unknown email OR wrong password (enumeration-resistant). Updates `last_login_at`.

### POST /auth/refresh — public
`{ refreshToken }` → 200 with a fresh pair. The presented token is revoked
(replay of an old refresh token ⇒ 401). Rotation happens in one transaction.

### POST /auth/logout — auth optional (token revocation requires the body)
`{ refreshToken }` → `{ ok: true }`. Revokes that refresh token.

### POST /auth/password-reset/request — public
`{ email }` → always 200 `{ ok, message }` (identical whether or not the account
exists). In dev/test with `FDE_EXPOSE_RESET_TOKENS=1` the response also carries
`devResetToken` for the test harness. Production delivers the link by email.

### POST /auth/password-reset/confirm — public
`{ token, newPassword }` → 200. Single-use token (invalid/expired/used ⇒ 400);
revokes every refresh token for the account.

### GET /auth/me — auth
`{ id, email, displayName, role }` — the caller's own account.

## Account & preferences

- `GET /me/profile` — auth. `{ displayName, email, createdAt, fullName, country, timezone, bio, careerGoal }`.
- `PUT /me/profile` — auth. Body: `{ displayName, fullName?, country?, timezone?, bio?, careerGoal? }`.
- `GET /me/preferences` — auth. `{ weeklyGoalSessions, preferredSubjects, largeText, reducedMotion }`.
- `PUT /me/preferences` — auth. All four fields required (mirrors the frontend panel).

## Catalog

All catalog reads are public; a valid token enriches responses with per-user state.

- `GET /catalog/subjects` — `[{ id, key, name }]`
- `GET /catalog/stages` — 18 stages `[{ id, stageNumber, phase, title, meta, lessons }]`
- `GET /catalog/stages/:idOrNumber` — stage detail + its lessons (accepts UUID or 1–18)
- `GET /catalog/courses?subject=&difficulty=&includeDrafts=1` — published only for
  students/anonymous; `includeDrafts` requires author/admin. Response rows include
  `progress: { lessonsDone, pct }` for the caller.
- `GET /catalog/courses/:idOrCode` — course with `modules[].chapters[]`, `lessons[]`
  (each lesson carries `state: { completed, bookmarked, bestScore }`), objectives,
  prerequisites note, `topicTest`.
- `GET /catalog/lessons/:idOrCode` — lesson with `content` (JSON blocks: paragraphs,
  tables, code, interactive components), `objectives`, `quiz` id, `prevCode`/`nextCode`,
  and caller state `{ completed, completedAt, bookmarked, bestScore, note }`.
  Drafts are 404 to non-authors. Logs a `lesson_view` activity event.

## Assessments

**Correct answers and explanations are never included in quiz delivery.** The
client sends only chosen option ids; the server computes the score.

- `GET /assessments/quizzes/:idOrCode` — `{ quiz: { id, code, kind, title, passPct,
  timeLimitMinutes }, questions: [{ id, position, prompt, options: [{ id, position, text }] }] }`
- `POST /assessments/quizzes/:idOrCode/attempts` — auth. 201 `{ attemptId, startedAt, status: "in_progress" }`
- `POST /assessments/attempts/:id/answers` — auth, owner. `{ answers: [{ questionId, optionId }] }`
  upserts choices; 422 if any option does not belong to its question *of this quiz*.
- `POST /assessments/attempts/:id/submit` — auth, owner. Body ignored entirely.
  Server-side scoring: 200 `{ attemptId, score, passed, passPct, correctCount,
  questionCount, questions: [{ questionId, prompt, explanation, chosenOptionId,
  correctOptionId }] }`. Enforces the time limit (grace 30 s; late ⇒ 403 and the
  attempt is marked `abandoned`). Resubmission ⇒ 409.
- `GET /assessments/attempts/:id` — owner or admin. 404 for anyone else.
- `GET /assessments/quizzes/:idOrCode/attempts/mine` — caller's history.

Quiz kinds: `lesson_check` (pass 70 %, gates lesson completion), `topic_test`
(per course, pass 70 %, timed), `mock_exam` (timed).

## Student data

- `POST /me/progress/lessons/:lessonId/complete` — auth. **Granted only when the
  caller has a passing submitted attempt for that lesson's quiz** (otherwise 403).
  Idempotent; maintains `study_progress` and the activity trail.
- `GET /me/progress` — the dashboard payload, all computed from recorded data:
  `{ overallPct, lessonsDone, lessonsTotal, activeDaysThisWeek, currentStageNumber,
  recommendedLesson, courses[], recentAttempts[], books[], projectsSubmitted }`
- `GET /me/notes/:lessonId` · `PUT /me/notes/:lessonId` (`{ body }`, 1–2000 chars)
- `POST /me/bookmarks/:lessonId` · `DELETE /me/bookmarks/:lessonId`
- `GET /me/history?limit=` — activity events (login, lesson_view, quiz_submit,
  chapter_read, download, lab_submission, project_submit …)

## Books & downloads

- `GET /books` — published books with `progress: { chaptersRead, chaptersTotal, pct }`
  for the caller (from the `v_book_progress` view).
- `GET /books/:idOrSlug` — book, chapters (with `read` flags), editions.
- `GET /books/:idOrSlug/chapters/:position` — chapter content (same block schema
  as lessons); marks a reading-progress row for authenticated callers.
- `POST /books/:idOrSlug/chapters/:position/read` — auth. `{ read: true|false }`.
- `POST /books/:idOrSlug/downloads` — auth. 201 →
  `{ token, downloadUrl, filename, bytes, checksum, expiresInSeconds }`
  (single-use, 10-minute signed token; only its sha256 hash is stored).
- `GET /downloads/:token` — auth, token requester only. Streams the file with
  `Content-Disposition: attachment`, `X-Checksum-Sha256`, `Cache-Control: no-store`.
  Replay ⇒ 403; wrong owner ⇒ 403. Records a `download_records` row.
  **The private storage location is never exposed.**

## Exercises

- `GET /exercises` · `GET /exercises?kind=coding|math` — published exercises.
- `GET /exercises/coding/:idOrCode` — instructions + starter code. No hints/solution.
- `POST /exercises/coding/:idOrCode/submissions` — auth. `{ code }` (≤ 20 000 chars).
- `GET /exercises/coding/:idOrCode/hints` — auth, **403 until the caller has ≥ 1
  saved submission** (attempt-first policy).
- `GET /exercises/coding/:idOrCode/solution` — auth, gated identically.
- `GET /exercises/coding/:idOrCode/submissions/mine` — caller's saved runs.
- `GET /exercises/math/:idOrCode` — prompt + component config; solutions gated.

Sandbox execution itself stays in the browser (Web Worker isolation) by design;
this API records submissions and gates help — see docs/FRONTEND_INTEGRATION.md.

## Projects

- `GET /projects` · `GET /projects/:idOrCode` — steps, demonstration checklist,
  concepts, and `mySubmission` for the caller.
- `POST /projects/:idOrCode/submissions` — auth. `{ evidence, checklist }`.
  **Gate:** every checklist item must be true and evidence ≥ 20 chars (422 with
  per-item messages otherwise); one submission per project (409 on duplicate).
- `GET /projects/submissions/mine` — with rubric results once evaluated.

## Search & glossary

- `GET /search?q=` — public. Lessons (title + content), courses, books, glossary,
  projects; ≥ 2 characters; 20 per kind.
- `GET /glossary?search=&category=` — public, published terms.
- `GET /glossary/:key` — public.

## Authoring

- `POST /author/drafts` — author/admin. `{ entityType, entityId?, payload, changeNote? }`
- `GET /author/drafts` — authors see their own; admins see all.
- `POST /author/drafts/:id/submit` — author (own drafts) → status `in_review`.
- Admin continuation under [Admin](#admin): review, publish.

## Admin

All `/admin/*` routes require the admin role (authors are 403).

- `GET /admin/analytics/overview` — users (total/new7d/active7d), learning
  (completions, attempts, avgScore, passRate, projectSubmissions, downloads,
  labSubmissions). Every figure is computed from recorded activity.
- `GET /admin/analytics/content-health` — per published quiz: attempts,
  avgScore, passRate + `weak[]` (average below 70 %).
- `GET /admin/users?role=&limit=&offset=` — paginated; includes learning
  telemetry, never password material.
- `PUT /admin/users/:id/status` — `{ status: "active"|"suspended" }`; suspension
  revokes refresh tokens; self-suspension is refused (400).
- Glossary CRUD (live effect on `/glossary` and `/search`):
  `POST /admin/glossary` · `PUT /admin/glossary/:id` · `DELETE /admin/glossary/:id`
- Draft pipeline: `POST /admin/drafts/:id/review` `{ verdict: "approved"|"rejected",
  comments? }` → `POST /admin/drafts/:id/publish` (snapshots previous state into
  `content_revisions`, writes a `publish_events` row, updates/creates the entity).
- `GET /admin/revisions?entity=` — revision history.
- `GET /admin/downloads` — download audit log (filename, bytes, user display name).
- `POST /admin/project-submissions/:id/evaluate` — six rubric dimensions 0–4;
  pass at 16/24 with no dimension below 2.

## Learning engine (v2)

- `GET /curriculum/tree` — public (state when authenticated). Stages → courses
  → modules → chapters → lessons with quiz links, per-stage books/projects.
- `GET /lessons/:code/check` — the lesson's knowledge check questions (no answers).
- `POST /lessons/:code/check` — practice mode: `{answers:[{questionId, optionId}]}` →
  per-question full feedback (why incorrect, why correct, simpler example, lesson
  link / why correct + next challenge), score, and NO attempt record.
- `GET /assessments/attempts/:id/feedback` — the same structure for a graded
  attempt (owner or admin).
- `GET /me/recommendation` — the adaptive engine: lesson + reasons[] +
  warnings[] (unmet prerequisites) + struggles + rollup.
- `GET /me/mastery` — subject/course mastery with struggle flags.

## AI tutor (v2, optional)

- `GET /ai/tutor/status` — public: enabled, provider, modes, disclaimer.
- `POST /ai/tutor` — `{message, lessonCode?, mode?}` (modes: explain,
  vocabulary, examples, practice, hint, error, math) → `{answer, sources,
  grounded, disclaimer}`. Grounded in the approved curriculum only.
- `POST /ai/tutor/explain-error` — `{error, code?, exerciseCode?}`.
- `POST /ai/tutor/math-steps` — `{problem, lessonCode?}`.
- `POST /ai/tutor/hints` — `{exerciseCode, hintIndex}` — authored hints first.
- `POST /ai/tutor/practice` — `{lessonCode, count?}` — labelled practice,
  never recorded.

## Content management (v2, admin)

See docs/CMS.md for the full CRUD/upload surface under `/admin/cms/*`, and
`GET /admin` for the console page. Highlights: hierarchy + lesson + quiz
authoring with feedback data, diagram uploads (public assets with MIME
sniffing and SVG CSP), DOCX/PDF book uploads with the token download flow,
publish/unpublish, revision history and restore.

## Rate limits

Not implemented in this build (single-node development posture). The router has
request-ids and structured logs at every hop, so a reverse proxy
(`limit_req` in nginx, API gateway quotas) is the recommended enforcement point —
documented in docs/SECURITY.md.

## Appendix A — complete route index (auto-generated from src/routes)

Every registered route, grouped by module. Behaviour details for the
public learning surface are in the sections above; admin/CMS routes follow
the same auth rules as described in SECURITY.md (admin/author role checks,
audit logging).


### `admin.js`

- `GET /api/v1/admin/analytics/overview`
- `GET /api/v1/admin/analytics/content-health`
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/glossary`
- `DELETE /api/v1/admin/glossary/:id`
- `POST /api/v1/author/drafts`
- `GET /api/v1/author/drafts`
- `POST /api/v1/author/drafts/:id/submit`
- `POST /api/v1/admin/drafts/:id/review`
- `POST /api/v1/admin/drafts/:id/publish`
- `GET /api/v1/admin/revisions`
- `GET /api/v1/admin/downloads`
- `POST /api/v1/admin/project-submissions/:id/evaluate`

### `ai.js`

- `POST /api/v1/ai/tutor`
- `POST /api/v1/ai/tutor/explain-error`
- `POST /api/v1/ai/tutor/math-steps`
- `POST /api/v1/ai/tutor/hints`
- `POST /api/v1/ai/tutor/practice`
- `GET /api/v1/ai/tutor/status`

### `assessments.js`

- `GET /api/v1/assessments/quizzes/:id`
- `POST /api/v1/assessments/quizzes/:id/attempts`
- `POST /api/v1/assessments/attempts/:id/answers`
- `POST /api/v1/assessments/attempts/:id/submit`
- `GET /api/v1/assessments/attempts/:id`
- `GET /api/v1/assessments/quizzes/:id/attempts/mine`

### `auth.js`

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`

### `books.js`

- `GET /api/v1/books`
- `GET /api/v1/books/:idOrSlug`
- `GET /api/v1/books/:idOrSlug/chapters/:position`
- `POST /api/v1/books/:idOrSlug/chapters/:position/read`

### `catalog.js`

- `GET /api/v1/catalog/subjects`
- `GET /api/v1/catalog/stages`
- `GET /api/v1/catalog/stages/:id`
- `GET /api/v1/catalog/courses`
- `GET /api/v1/catalog/courses/:id`
- `GET /api/v1/catalog/lessons/:id`

### `cms.js`

- `GET /admin`
- `POST /api/v1/admin/cms/subjects`
- `POST /api/v1/admin/cms/courses`
- `POST /api/v1/admin/cms/courses/:id/modules`
- `POST /api/v1/admin/cms/modules/:id/chapters`
- `POST /api/v1/admin/cms/chapters/:id/lessons`
- `POST /api/v1/admin/cms/lessons/:id/publish`
- `POST /api/v1/admin/cms/lessons/:id/unpublish`
- `POST /api/v1/admin/cms/lessons/:id/prerequisites`
- `POST /api/v1/admin/cms/lessons/:id/quiz`
- `POST /api/v1/admin/cms/exercises/coding`
- `POST /api/v1/admin/cms/exercises/math`
- `POST /api/v1/admin/cms/uploads`
- `GET /api/v1/content/assets/:id`
- `POST /api/v1/admin/cms/books`
- `POST /api/v1/admin/cms/books/:id/editions`
- `POST /api/v1/admin/cms/books/:id/publish`
- `GET /api/v1/admin/cms/revisions/:entityType/:entityId`
- `POST /api/v1/admin/cms/lessons/:id/restore/:version`

### `downloads.js`

- `POST /api/v1/books/:idOrSlug/downloads`
- `GET /api/v1/downloads/:token`

### `exercises.js`

- `GET /api/v1/exercises`
- `GET /api/v1/exercises/coding/:idOrCode`
- `GET /api/v1/exercises/math/:idOrCode`
- `GET /api/v1/exercises/coding/:idOrCode/hints`
- `GET /api/v1/exercises/coding/:idOrCode/solution`
- `POST /api/v1/exercises/coding/:idOrCode/submissions`
- `GET /api/v1/exercises/coding/:idOrCode/submissions/mine`

### `learning.js`

- `GET /api/v1/curriculum/tree`
- `GET /api/v1/lessons/:code/check`
- `POST /api/v1/lessons/:code/check`
- `GET /api/v1/assessments/attempts/:id/feedback`
- `GET /api/v1/me/recommendation`
- `GET /api/v1/me/mastery`

### `me.js`

- `GET /api/v1/me/profile`
- `GET /api/v1/me/preferences`
- `GET /api/v1/me/notes/:lessonId`
- `POST /api/v1/me/bookmarks/:lessonId`
- `DELETE /api/v1/me/bookmarks/:lessonId`
- `POST /api/v1/me/progress/lessons/:lessonId/complete`
- `GET /api/v1/me/progress`
- `GET /api/v1/me/history`

### `projects.js`

- `GET /api/v1/projects`
- `GET /api/v1/projects/:idOrCode`
- `POST /api/v1/projects/:idOrCode/submissions`
- `GET /api/v1/projects/submissions/mine`

### `search.js`

- `GET /api/v1/search`
- `GET /api/v1/glossary`
- `GET /api/v1/glossary/:key`

### Book print editions (added by the book pipeline)

```
POST /api/v1/admin/cms/books/:id/editions
```

Attaches a finished print edition to an existing book. Request body:
`{ "version": "1.0.0", "format": "docx" | "doc" | "pdf" | "web",
"fileId": "<uuid of a previously uploaded PRIVATE book file>", "notes?": "…" }`.
Creates the `book_editions` row, attaches the file (kind `edition`) and
records a publish event for published books. Edition files download only
through the existing token flow (`POST /api/v1/books/:idOrSlug/downloads`).
