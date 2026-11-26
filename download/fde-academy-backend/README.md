# FDE Academy Backend

**v2.0 — the Learning Engine release.** The backend for FDE Academy (From Zero
Knowledge to Real-World Engineering): a standalone **Node.js + PostgreSQL**
service providing authentication, role-based access control, the published
curriculum, the book library with secure downloads, server-scored assessments,
verified student progress, an authoring/publishing pipeline, admin operations
and analytics — plus, since v2, the full learning engine:

- **Adaptive recommendations** (`docs/LEARNING_ENGINE.md`) — mathematics-first
  for new learners, curriculum-order cursor, struggle-driven review, and
  explicit prerequisite-skip warnings.
- **Knowledge-check feedback engine** — wrong answers get why-incorrect,
  why-correct, a simpler example from the lesson's own content, and a lesson
  link; correct answers get why-correct and the next challenge. Practice mode
  is ungraded and never pollutes attempts.
- **Optional AI tutor** (`docs/AI_TUTOR.md`) — retrieval over the approved
  curriculum with hard grounding rules, inline citations, a refusal path, and
  a fixed disclaimer; modes for simpler words, vocabulary, examples, practice
  generation, progressive hints, programming errors and math steps.
- **CMS + admin console** (`docs/CMS.md`) — full hierarchy/lesson/quiz/
  exercise authoring with feedback data, diagram and DOCX/PDF uploads,
  publish/unpublish, revision history with restore, served at `/admin`.

- **92 integration tests, all passing** (`npm test`) — including a dedicated
  quiz-integrity suite proving students cannot change their own or anyone's
  results through client-side requests, and 27 learning-engine tests
  (adaptive, feedback, practice, AI tutor, CMS, uploads, curriculum).
- **Zero runtime dependencies**: routing, scrypt password hashing and HS256
  tokens use the Node standard library. The only production dependency is the
  optional `pg` driver for PostgreSQL (auto-installed via optionalDependencies).
- **Verified against real PostgreSQL**: migrations, seed and tests run on
  [PGlite](https://pglite.dev/) (PostgreSQL compiled to WASM) locally; point
  `DATABASE_URL` at a PostgreSQL 13+ server for deployment — the same SQL.

## Architecture choice (per requirement: document the selection)

The approved FDE Academy design (Website Design & Architecture Specification)
places a **separate backend service behind the API gateway**, with the frontend
consuming it over `/api/v1`. No backend framework existed in the project when
this work started, so this repository establishes a **standalone backend**:

| Decision | Choice | Why |
| --- | --- | --- |
| Shape | Separate Node.js service, JSON REST over `/api/v1` | Matches the approved architecture (SSR frontend + backing services); deployable and scalable independently. |
| Language | Node.js 20+ (ESM) | Same language as the frontend toolchain; one runtime to operate. |
| Framework | None (node:http + ~200-line router) | Tiny audit surface, no supply-chain exposure; the router provides path params, body limits, CORS, request ids and uniform error JSON. |
| Database | PostgreSQL 13+ | Relational integrity for the curriculum and assessment model; JSONB for content blocks; trigram search. |
| DB access | Thin adapter (`src/db/index.js`) with two drivers | `pg` (production pool) and PGlite (dev/tests) behind one interface (`query/exec/transaction`) — the data-access layer is isolated and swappable. |
| Auth | scrypt password hashing + HS256 access JWTs (15 min) + rotating opaque refresh tokens (30 d, hashed at rest) | No plain-text passwords; replayed refresh tokens are rejected; logout and password change revoke sessions. |

See `docs/ARCHITECTURE.md` for the component diagram and request lifecycle.

## Quick start (development — no PostgreSQL server needed)

```bash
cd fde-academy-backend
npm install                       # installs PGlite (dev engine)
cp .env.example .env              # defaults are fine for development
npm run migrate                   # apply all migrations (embedded Postgres)
npm run seed                      # load the real curriculum + generate book files
npm start                         # listen on http://127.0.0.1:8787
curl http://127.0.0.1:8787/api/v1/health
```

Optional: `FDE_SEED_DEMO_USERS=1 npm run seed` creates `admin@fde.local`,
`author@fde.local` and `student@fde.local` (password from `FDE_DEMO_PASSWORD`)
— development/test only; the configuration refuses to run with them in production.

## Quick start (production, real PostgreSQL)

```bash
createdb fde_academy && createuser fde   # or your managed PostgreSQL
# set in .env:
#   NODE_ENV=production
#   DATABASE_URL=postgresql://fde:SECRET@host:5432/fde_academy
#   FDE_JWT_SECRET=$(openssl rand -hex 48)
npm ci
npm run migrate && npm run seed
npm start                          # or run under systemd/PM3/container
```

On boot in production the configuration validates itself and fails fast:
`FDE_JWT_SECRET` ≥ 32 bytes, `DATABASE_URL` set, demo-user seeding and
reset-token exposure off.

## Tests

```bash
npm test          # 65 tests: each file gets a pristine in-memory PostgreSQL
```

| Suite | What it proves |
| --- | --- |
| `auth` | Registration/login/refresh rotation/logout; scrypt hashes at rest; tampered tokens rejected. |
| `quizIntegrity` | **Scores are computed server-side only**; forged `score`/`passed` fields are inert; cross-question options rejected; other users' attempts are invisible (404); resubmission blocked (409); lesson completion requires a passing attempt. |
| `rbac` | Students/authors locked out of admin surfaces; anonymous gets 401; suspended users lose access; self-suspension guarded. |
| `ownership` | Notes/bookmarks/progress/submissions are unreachable across accounts. |
| `validation` | Unknown fields stripped (no role escalation); field-level 422 details; 1 MB body cap; malformed JSON 400. |
| `downloads` | Signed single-use tokens; expiry; requester binding; checksums; storage paths never leak. |
| `passwordReset` | Enumeration-resistant responses; hashed tokens; single use; session revocation. |
| `progress` | Dashboard/streaks from recorded activity; book progress; timed-exam enforcement. |
| `contentPublish` | Drafts invisible to students → review → publish → live; revision snapshots. |
| `adaptive` | Math-first for new learners; cursor order; struggle-driven review; prerequisite warnings. |
| `feedback` | Practice feedback structure; authored overrides; graded-attempt feedback; no attempt pollution. |
| `aiTutor` | Grounding/citation/refusal contract with a deterministic provider; privacy logging. |
| `cms` | Full authoring flow, uploads, versions + restore, permission walls. |
| `curriculum` | The unified tree, mathematics-first ordering, per-user state. |
| `searchGlossary` | Cross-entity search; live admin glossary CRUD. |
| `analytics` | Overview/health figures reconcile with the database. |
| `migrations` | Up/down/status idempotency; tamper detection. |

## Repository layout

```
migrations/            numbered .up.sql / .down.sql (immutable once applied)
src/
  server.js            assembly + entry point (exports buildApp for tests)
  config.js            env loading + production validation
  logger.js            JSON logs with secret redaction
  errors.js            AppError hierarchy -> uniform problem responses
  rbac.js              role -> permission matrix
  validate.js          schema validation, unknown-field stripping
  activity.js          append-only activity trail helpers
  db/index.js          DB adapter: pg (prod) / PGlite (dev+test)
  db/migrate.js        migration runner (checksums, transactions)
  db/seed.js           loads seed/content.json, generates book files
  auth/                passwords (scrypt), tokens (JWT+refresh), session guards
  http/router.js       routing, body limits, CORS, request ids, error JSON
  learning/            feedback engine + adaptive recommender (v2)
  ai/                  retriever, tutor prompts, provider adapter (v2)
  routes/              auth, catalog, assessments, me, books, downloads,
                       exercises, projects, search+glossary, admin,
                       learning, ai, cms (v2)
public/admin.html      the admin CMS console (served at /admin)
storage/books/         PRIVATE file storage (never exposed; streamed via tokens)
seed/content.json      the real curriculum (34 lessons, 40 quizzes/139 questions,
                       6 books, 55 glossary terms, 15 projects, 9 exercises)
test/                  node:test suites + helpers (fresh DB per file)
docs/                  API.md, SCHEMA.md, SECURITY.md, ARCHITECTURE.md,
                       FRONTEND_INTEGRATION.md, LEARNING_ENGINE.md,
                       AI_TUTOR.md, CMS.md, ER.png
client/fde-api.js      browser-safe fetch client for the frontend
```

## Environment variables

See [.env.example](.env.example) — every variable is documented there, including
which are required in production and which are hard-off outside development.

## Security summary (details in docs/SECURITY.md)

- Passwords: scrypt with per-user salt; constant-time verification; never logged.
- Tokens: 15-minute JWTs; refresh tokens rotate on every use and revoke on
  logout/password change; only sha256 hashes stored.
- Quiz results: computed exclusively from `question_options.is_correct` in the
  database — no endpoint accepts a score from any client.
- Downloads: single-use expiring tokens; files stream from private storage;
  `storage_key` never serialized.
- Access control: RBAC matrix; ownership enforced in every student-scoped query;
  404 (not 403) on other users' resources so existence is not disclosed.
- Validation: every endpoint; unknown fields stripped; bodies capped at 1 MB.
