# Security — FDE Academy Backend

How this service satisfies the assignment's hard requirements, and where the
operational boundaries are.

## 1. Students cannot change quiz results (or anyone's records) client-side

- The only inputs a client can send for an attempt are **option choices**
  (`questionId`, `optionId`). Every choice is validated to belong to the
  question *and the quiz of that attempt* (422 otherwise).
- `POST /assessments/attempts/:id/submit` **ignores the request body**. The
  score is computed in SQL by joining stored answers against
  `question_options.is_correct`.
- `is_correct` is never serialized by any student-facing endpoint (verified by
  test: the JSON dump of quiz delivery must not contain the flag). Explanations
  are only returned with a graded result.
- `quiz_attempts.score/passed/submitted_at` are writable exclusively through the
  submit flow; the database CHECK (`status='submitted' ⇒ score, passed,
  submitted_at present`) keeps rows consistent.
- Cross-user protection: attempts are loaded with `user_id = caller OR admin`;
  other users get **404** (existence is not disclosed). Submitted attempts
  cannot be re-answered or resubmitted (409). Time limits are enforced at submit
  with the attempt's server-recorded `started_at`.
- Lesson completion is granted **only** through a passing attempt of that
  lesson's quiz — the endpoint re-verifies server-side (403 otherwise), and
  `study_progress` is recomputed inside the same transaction.
- Tests: `test/quizIntegrity.test.js` (forged `score`/`passed`/`userId` fields
  prove inert; cross-quiz options rejected; another user's attempt
  read/answer/submit all 404; tamper case scored 0).

## 2. Passwords are never plain text

- scrypt (N=16384, r=8, p=1, 64-byte key) with a per-user 16-byte random salt;
  stored as `scrypt$N$r$p$salt$hash`.
- Verification is constant-time (`crypto.timingSafeEqual`).
- The logger redacts any key matching password/token/secret/authorization
  (case-insensitive) before a line is emitted — a `SELECT password_hash` in a
  debug log can still print the hash, but request logging never carries raw
  passwords.
- Password policy: ≥ 10 chars with a letter and a digit, enforced at
  registration and reset.
- Password reset tokens and refresh tokens are random 32-byte values; only
  their sha256 hashes are stored. Refresh tokens rotate on every use; replay of
  a rotated token is rejected. Logout, password change and suspension revoke
  refresh tokens. Reset tokens are single-use and expire (default 60 min).
- Password reset responses are identical whether or not an account exists
  (enumeration resistance).

## 3. Private student information is protected

- `user_profiles` (real name, country, bio, career goal) is served **only** to
  its owner via `/me/profile`. No endpoint returns another user's profile or
  email — the only user listing is admin-only (`/admin/users`), and it exposes
  role/status/telemetry, never password material.
- Student-scoped tables (notes, bookmarks, progress, attempts, submissions,
  lab submissions) are keyed by `user_id` in every query — cross-account access
  is impossible by construction, not by convention (tested in
  `test/ownership.test.js`).
- `activity_events` stores behaviour, not identity extras; `ip_hash` (not raw
  IP) is the only client-address data anywhere, on refresh tokens, for abuse
  detection.
- Download audit records store user id + timestamp only.

## 4. Private file storage and secrets are never exposed

- Files live under `FDE_STORAGE_DIR` (default `storage/`) — **outside** any
  static-serving path. Downloads go through `POST /books/:id/downloads`
  → single-use, 10-minute, request-bound token → `GET /downloads/:token`,
  which streams bytes with `Content-Disposition: attachment` and a checksum
  header. `storage_key` is never serialized by any endpoint (tested).
- Path traversal is impossible: `storagePath()` resolves the key and rejects
  anything escaping the storage root.
- The JWT secret, database URL and every other secret come **only** from the
  environment (`.env.example` documents them; no real values are committed).
  In production the config fails to boot without `FDE_JWT_SECRET` ≥ 32 bytes.
- Dev-only conveniences (`FDE_SEED_DEMO_USERS`, `FDE_EXPOSE_RESET_TOKENS`) are
  hard-disabled in production — the config validator refuses to start.

## 5. All inputs validated, access strictly controlled

- `src/validate.js` schema validation on every endpoint: types, lengths, enums,
  UUIDs, arrays; **unknown fields are stripped** (a registration carrying
  `role: "admin"` is ignored — tested); validation errors return 422 with
  field-level details.
- Bodies are capped at 1 MB (413), malformed JSON → 400, non-JSON content type
  → 400.
- RBAC: `users.role ∈ {student, author, admin}` with a permission matrix in
  `src/rbac.js`; every mutating route states its permission. Anonymous → 401;
  authenticated-but-unauthorized → 403. Suspended accounts are refused at
  authentication (403) and their refresh tokens are revoked.
- The authoring pipeline is role-separated: authors create drafts; only admins
  review and publish; drafts are invisible (404) to students.
- Administrative self-lockout guard: an admin cannot suspend their own account.

## 6. Additional hardening in place

- Request ids on every response (`X-Request-Id`) and structured JSON logs with
  secret redaction.
- Transactions wrap every multi-step write (register, scoring, completion,
  publish, rotation, reset).
- Database-level integrity beyond app checks: unique constraints, FK cascades,
  the deferred *exactly-one-correct-option* trigger, and status CHECKs.
- `clientError` sockets are destroyed; CORS is opt-in via `FDE_CORS_ORIGIN`.

## Known boundaries (be explicit in review)

- **Rate limiting is not in the app** — enforce at the gateway/reverse proxy
  (`limit_req`, quotas). The logs and request ids make that enforcement point
  clean.
- **Email delivery is a hook, not an implementation** — password-reset tokens
  are generated/stored/consumed; the production mail provider is a deployment
  integration (dev/test expose the token through a config-gated flag).
- The API records lab submissions and gates hints/solutions, but **sandbox code
  execution stays in the browser** (Web Worker isolation) — student code never
  touches any server, which is the strongest isolation available.
- `npm` dependency surface: zero runtime dependencies; `pg` (production driver)
  and `@electric-sql/pglite` (dev/test engine) only.
