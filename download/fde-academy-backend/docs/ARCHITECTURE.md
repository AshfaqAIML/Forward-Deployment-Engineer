# Architecture — FDE Academy Backend

## Component view

```
                      ┌────────────────────────────────────────────────┐
                      │                 Node.js process                │
  browser / SSR       │                                                │
  frontend ──HTTPS──▶ │  http/router.js   path routing · CORS · 1MB    │
  (Bearer JWT)        │        │           body limits · request ids   │
                      │        ▼                                        │
                      │  auth/session.js  verify Bearer → ctx.user     │
                      │        │                                        │
                      │  rbac.js          role → permission check      │
                      │        │                                        │
                      │  routes/*         13 domain modules            │
                      │        │            (auth, catalog, assessments,│
                      │        │             me, books, downloads,      │
                      │        │             exercises, projects,       │
                      │        │             search, glossary, admin)   │
                      │        ▼                                        │
                      │  db/index.js — adapter: query/exec/transaction │
                      │      ├── pg Pool ──── PostgreSQL server (prod) │
                      │      └── PGlite ───── embedded Postgres (dev)  │
                      │        │                                        │
                      │  storage/ — PRIVATE files (books)              │
                      │        │  streamed only via signed tokens      │
                      └────────┴────────────────────────────────────────┘
                               │
                               ▼
                    PostgreSQL 13+  (39 tables, 3 views, triggers)
```

## Request lifecycle (example: quiz submit)

1. `http` layer: route match, JSON body parse (≤ 1 MB), request id, access log start.
2. `authenticate`: Bearer JWT verified (signature + expiry, constant-time), user row
   loaded, status checked → `ctx.user` (or 401).
3. `requirePermission(ctx, "attempt:quiz")` — RBAC matrix.
4. Handler: load the attempt **owner-checked** (404 for other users), enforce the
   time limit from the server-recorded `started_at`.
5. Score computed in SQL against `question_options.is_correct` inside a transaction
   with the attempt update and the activity event.
6. Response: uniform JSON; any `AppError` maps to a problem document; anything
   else becomes a 500 without internals; the error path logs with stack (redacted).

## Why a standalone backend (documented selection)

The approved design (Website Design & Architecture Specification) commits to an
SSR-capable frontend consuming **separate backend services behind the API
gateway**. No backend framework existed in the project, so this repository
establishes the backend as an independent Node.js service. Rationale:

- **Deployment symmetry with the design** — the frontend (static build or SSR)
  speaks `/api/v1` exactly as specified; the backend scales and evolves alone.
- **Zero-dependency core** — routing, scrypt hashing and HS256 tokens use the
  Node standard library; the audit surface is the whole dependency surface
  (one optional production driver: `pg`).
- **One SQL, two engines** — the DB adapter isolates the data-access layer
  behind `query/exec/transaction`; production uses `pg` against PostgreSQL,
  development and the 65-test suite run the same SQL on PGlite (PostgreSQL
  compiled to WASM). No behavioral fork between test and production engines.

## Data-access layer

`src/db/index.js` exposes one interface:

```js
const db = await getDb(config);   // pg pool OR pglite, resolved from config
db.query(sql, params)             // -> { rows }
db.exec(sql)                      // multi-statement scripts (migrations)
await db.transaction(async tx => { tx.query(...) })   // BEGIN/COMMIT/ROLLBACK
```

Every route receives `ctx.db`; nothing else imports a driver. Swapping in a
connection-pooling sidecar (pgbouncer) or a managed Postgres changes
configuration, not code.

## Content model

Lessons and book chapters store their teaching content as JSONB **blocks** —
the same schema the frontend renders (paragraphs, tables, code, interactive
math components). Authoring (drafts) proposes block payloads; publishing
snapshots the previous version. One content model across the stack means the
API can serve any future client without a content translation layer.

## Cross-cutting concerns

| Concern | Implementation |
| --- | --- |
| Logging | JSON lines, request ids, level control, secret redaction (`src/logger.js`) |
| Errors | `AppError(status, code, message, details)` → problem JSON; 500s hide internals |
| Validation | schema validator + unknown-field stripping (`src/validate.js`) |
| AuthN | scrypt + JWT + rotating refresh tokens (`src/auth/*`) |
| AuthZ | role→permission matrix + per-route ownership (`src/rbac.js`, routes) |
| Migrations | numbered .up/.down, transactional, checksummed (`src/db/migrate.js`) |
| Auditing | `activity_events` (student behaviour), `content_revisions` + `publish_events` (content), `download_records` (files) |
| Analytics | SQL aggregates over recorded activity only (`v_content_health`, overview queries) |

## Testing strategy

Each test file runs in its own process with a **pristine in-memory PostgreSQL**
(migrations + real curriculum seed + ephemeral HTTP port). That gives file-level
isolation with genuine engine semantics — the tests exercise the full HTTP
stack (fetch → router → auth → RBAC → SQL), not mocks.

## Deployment notes

- One process, no cluster requirement (Node handles the concurrency profile of
  an academy; scale horizontally behind the gateway when needed).
- Run `npm run migrate` as a release step (runner is idempotent and safe to
  re-run); migrations are immutable once applied (checksum-enforced).
- Termination: SIGINT/SIGTERM close the listener and the pool.
- Reverse proxy: TLS termination, gzip, and rate limiting (the recommended
  enforcement point — see docs/SECURITY.md).
