# Frontend Integration — connecting the FDE Academy frontend to this backend

The current frontend deliverable (PROMPT 8) is a self-contained static
application whose data layer is an isolated in-browser store
(`FDE.store` over `localStorage`). That isolation was deliberate: the store's
read/write surface maps 1:1 onto this API, so the swap is mechanical. This
document is that mapping, plus a ready-made fetch client (`client/fde-api.js`).

## The swap in one paragraph

Every frontend feature that reads or writes `store.s.*` gets an adapter that
calls the corresponding endpoint instead. Rendering, routing, math components
and the Web-Worker code sandbox do not change at all — content blocks arrive
from `GET /catalog/lessons/:code` in the same `{ t: ... }` block schema the
frontend already renders, quizzes arrive without correct answers, and scores
come back from `POST .../submit` (the store's "compute best score locally" path
is deleted — the server is the only scorer).

## Feature → endpoint map

| Frontend feature (store call today) | Backend endpoint(s) |
| --- | --- |
| Profile create/edit (`profile.name`, `weeklyGoal`) | `POST /auth/register` · `GET/PUT /me/profile` · `GET/PUT /me/preferences` |
| Login / session | `POST /auth/login` · `/auth/refresh` (rotate) · `/auth/logout` |
| Password recovery | `POST /auth/password-reset/request` + `/confirm` |
| Roadmap stage states (computed from completions) | `GET /catalog/stages` · `GET /catalog/stages/:n` |
| Course library + filters | `GET /catalog/courses?subject=&difficulty=` |
| Course detail tree + per-lesson state | `GET /catalog/courses/:code` |
| Lesson reader content + blocks | `GET /catalog/lessons/:code` (content, objectives, prev/next codes) |
| Knowledge check (quiz) | `GET /assessments/quizzes/quiz-<lesson>` → `POST .../attempts` → `POST .../answers` → `POST .../submit` (explanations arrive with the graded result) |
| Lesson completion gate (pass ≥ 70 %) | `POST /me/progress/lessons/:id/complete` (server re-verifies the passing attempt) |
| Bookmarks | `POST/DELETE /me/bookmarks/:lessonId` |
| Notes | `GET/PUT /me/notes/:lessonId` |
| Dashboard statistics (overallPct, streak, quiz avg, recommended) | `GET /me/progress` (all computed from recorded activity) |
| History / activity feed | `GET /me/history` |
| Book library + filters + progress | `GET /books` (includes per-book progress) |
| Book reader chapters | `GET /books/:slug/chapters/:n` (marks read) · `POST .../read` |
| Book downloads (DOCX + print-PDF) | `POST /books/:slug/downloads` → `GET /downloads/:token` (single-use link, checksum header) |
| Assessment centre: topic tests + mock exam + results + report | `GET /assessments/quizzes/:code` flow · `GET /assessments/quizzes/:id/attempts/mine` · `GET /me/progress` (report data) |
| Coding labs: editor, run, submit | execution stays in the Web Worker; submissions: `POST /exercises/coding/:code/submissions`; hints/solutions: `GET .../hints`, `GET .../solution` (both gated until a submission exists — the frontend's attempt-first rule, now enforced server-side) |
| Math exercises / drills | `GET /exercises/math/:code` (prompt + component config) |
| Project centre: steps, checklist gate, submission, results | `GET /projects/:code` (steps, demoChecklist) · `POST /projects/:code/submissions` (checklist + evidence validated server-side) · `GET /projects/submissions/mine` (rubric results after admin evaluation) |
| Glossary (search, categories, popovers) | `GET /glossary?search=&category=` · `GET /glossary/:key` |
| Global search | `GET /search?q=` |
| Admin: analytics, content health, users | `GET /admin/analytics/overview` · `/admin/analytics/content-health` · `GET/PUT /admin/users` |
| Admin: glossary CRUD (live effect) | `POST/PUT/DELETE /admin/glossary` |
| Admin/author: content publishing flow | `POST /author/drafts` → `/author/drafts/:id/submit` → `POST /admin/drafts/:id/review` → `/admin/drafts/:id/publish`; history: `GET /admin/revisions` |
| Downloads management | `GET /admin/downloads` |

## What improves when you connect the backend

- Quiz results and progress become **server-verified** (the static build trusted
  the browser; the backend is the single scorer and completion gate).
- Progress follows the user across devices; streaks/averages come from an
  append-only audit trail, not client claims.
- Hints and solutions are **gated server-side** (attempt-first policy enforced,
  not just UI-hidden).
- Content edits go through drafts → review → publish with revision history,
  instead of shipping new static files.

## Using `client/fde-api.js`

```js
import { FdeApi } from "./fde-api.js";
const api = new FdeApi("https://api.example.io");     // base URL of the backend
await api.register({ email, password, displayName }); // stores tokens in memory/localStorage
const courses = await api.courses({ subject: "mathematics" });
const lesson = await api.lesson("fm-1");              // blocks render as before
const result = await api.takeQuiz("quiz-fm-1", answersByQuestion);
// result.score / result.passed / result.questions[].explanation
```

The client handles token attach, refresh-on-401 rotation, and typed errors
(`ApiError` with `code`, `status`, `details`). It has no dependencies and works
in browsers and Node 18+ (for SSR).

## CORS

Serve the frontend from any origin and set on the backend:
`FDE_CORS_ORIGIN=https://your-frontend-origin` — the router then emits the
allow-headers/methods for credentialess Bearer usage. Same-origin deployments
leave it empty.

## Two integration boundaries to keep

1. **Code execution stays client-side.** The Web-Worker sandbox is the isolated
   execution environment; the backend only records submissions. If you later add
   server-side execution, isolate it in separate throwaway containers — never
   the API process.
2. **Interactive equation blocks** (`ieq` with display functions) are stored as
   parameter sets with `__clientFn` markers where a display function existed in
   the content package; the frontend component library evaluates them. Extend
   the backend content model only with data, never code, in JSONB.
