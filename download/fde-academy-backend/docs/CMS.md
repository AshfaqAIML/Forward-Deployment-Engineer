# Content Management System — admin console + API

The CMS covers the entire content lifecycle: create the hierarchy, author
lessons and quizzes (with feedback data), add exercises, upload diagrams and
books, publish/unpublish, edit, and maintain previous versions.

## The console

Serve the backend and open **`/admin`** — a single self-contained page
(`public/admin.html`, no build step, no dependencies) served by the API. It
talks to the same authenticated endpoints; nothing is trusted from the
browser that the API does not re-verify.

Tabs: **Curriculum** (the full stage→course→module→chapter→lesson tree with
status badges, copy-id helpers, and per-lesson edit/quiz shortcuts) ·
**Lesson editor** (title, minutes, objectives, block editor, publish/
unpublish, revision history with restore) · **Quiz editor** (questions with
options, correct index, explanation, per-option misconception notes, simpler
example, next challenge) · **Create content** (subject/course/module/
chapter/lesson) · **Exercises** (coding + math) · **Books & uploads**
(diagram upload with public asset URL; book file upload + registration) ·
**Glossary** (CRUD with live effect) · **Analytics** (KPIs, content health,
download log) · **Users** (listing, suspend/reactivate).

Demo sign-in (development only, `FDE_SEED_DEMO_USERS=1`):
`admin@fde.local` / the `FDE_DEMO_PASSWORD` value.

The console was verified end-to-end with Playwright (17 checks: login, tree,
full create flow, publish visibility, lesson save + revision restore, quiz
authoring, diagram upload + public fetch, analytics, zero page errors).

## API surface (admin role; authors keep the draft→review pipeline)

All under `/api/v1/admin/cms/*`, every mutation snapshots the previous row
into `content_revisions` first.

| Resource | Endpoints |
| --- | --- |
| Subjects | `POST /cms/subjects` · `PUT /cms/subjects/:id` |
| Courses | `POST /cms/courses` (draft) · `PUT /cms/courses/:id` (edit/status) |
| Modules | `POST /cms/courses/:id/modules` |
| Chapters | `POST /cms/modules/:id/chapters` · `PUT /cms/chapters/:id` |
| Lessons | `POST /cms/chapters/:id/lessons` · `PUT /cms/lessons/:id` (version++) · `POST /cms/lessons/:id/publish` · `POST .../unpublish` · `POST .../prerequisites` |
| Quizzes | `POST /cms/lessons/:id/quiz` — questions with options, `answerIdx`, `explanation`, optional `optionNotes[]`, `simplerExample`, `nextChallenge`; re-authoring archives the previous check (history preserved) |
| Coding exercises | `POST /cms/exercises/coding` — instructions, starter code, hints, solution |
| Math exercises | `POST /cms/exercises/math` — prompt, config, solution |
| Books | `POST /cms/uploads?kind=book` (DOC/DOCX/PDF) · `POST /cms/books` (attaches the file as the edition) · `POST /cms/books/:id/publish` |
| Diagrams | `POST /cms/uploads?kind=diagram&filename=…&lessonId=…` (PNG/JPEG/WebP/SVG) → public asset URL |
| History | `GET /cms/revisions/:entityType/:entityId` · `POST /cms/lessons/:id/restore/:version` |

Lesson content is validated block-by-block (known `t` kinds only, including
the new `diagram` block that references an uploaded asset). Objectives must
be strings; statuses are enums; duplicate codes are 409s.

## Uploads and file safety

- Raw `application/octet-stream` bodies, capped at 20 MB (413 beyond).
- MIME is **sniffed from magic bytes** (PNG/JPEG/PDF/DOC/DOCX), not trusted
  from the name: a `.png`-named text file is rejected with 400.
- Diagrams are `public` assets served from `GET /api/v1/content/assets/:id`
  with `X-Content-Type-Options: nosniff`; SVG additionally gets
  `Content-Security-Policy: default-src 'none'; script-src 'none'` so
  uploaded markup cannot execute.
- Book files stay `private` (the PROMPT 9 token download flow is the only way
  out); a file uploaded before its book row exists lands as a private
  resource and is attached to the book/edition at registration.
- Everything is stored under the private storage root with SHA-256 checksums
  and version rows; storage keys never appear in responses.

## Versioning model

Every CMS mutation calls `snapshot()` first: the full previous row goes to
`content_revisions` with an incrementing version. Restoring a version
snapshots the current state first (restores are themselves reversible) and
reinstates the old content with `version + 1`. Publishing writes
`publish_events` audit rows. Nothing is ever lost.
