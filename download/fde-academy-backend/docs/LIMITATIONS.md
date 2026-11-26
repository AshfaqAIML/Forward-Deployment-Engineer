# LIMITATIONS.md — known limitations and improvement roadmap

Honest accounting of what the platform does not (yet) do. Nothing here is
placeholder data — every listed gap is a real boundary of the current build.

## Known limitations

**Deployment shape**
1. **Single-process architecture.** One Node process serves website + API.
   Vertical scaling only; there is no horizontal session sharing (refresh
   tokens live in the database, so a blue/green pair would work, but a
   load-balanced pool is untested).
2. **Embedded database default.** The reference deployment runs PostgreSQL
   embedded (PGlite, file-backed). Production mode supports and expects an
   external PostgreSQL via `DATABASE_URL`, but the sandbox reference has not
   been run against a separate Postgres server.
3. **No in-app rate limiting** — deliberate (zero runtime dependencies);
   limits must be enforced at the reverse proxy. Documented in SECURITY.md.
4. **Email delivery is not wired.** Password reset issues single-use tokens
   through the API, but no SMTP transport exists; an operator must read the
   token from the server channel in dev (or integrate a provider in prod).

**Frontend integration depth**
5. **The SPA is local-first; the bridge syncs the core only.** Accounts,
   graded lesson quizzes, cloud progress and book downloads sync to the
   server. Topic tests, the mock exam, notes, the sandbox lab and the AI lab
   still run purely in the browser (they record locally only).
6. **No server-side AI tutor UI.** The backend exposes a grounded tutor API
   (explain, hints, error help, math steps, practice), but the website's AI
   lab does not yet call it; it uses its local demo experience.

**Content & assessment**
7. **Quiz question pool is fixed per lesson** (3 questions each); retries
   reshuffle nothing server-side. Mastery is tracked, adaptive item
   selection is future work.
8. **Project submissions are file-light**: text-based submissions with
   evaluator workflows; no automated test-runner on the server.
9. **Two remediation titles (fm-1 revision, al-1 revision) exist as content
   annotations**, not separate auto-assigned lessons.

**Operations**
10. **Monitoring is log-based**; no bundled metrics endpoint beyond
    `/api/v1/health` and the admin analytics reports.
11. **Backups are filesystem tarballs**; verified by restore test in the E2E
    scripts but not automated off-site.

## Improvement roadmap

| # | Improvement | Why it matters | Effort |
|---|---|---|---|
| R1 | Wire the SPA's AI lab to the backend tutor API | one grounded assistant across devices | S |
| R2 | Sync topic tests + mock exam results to the server | unified transcript across devices | M |
| R3 | SMTP integration for password reset emails | self-service recovery in production | S |
| R4 | /metrics endpoint (Prometheus format) | alerting without log parsing | S |
| R5 | Automated off-site backup rotation | ransomware/disaster resilience | S |
| R6 | Quiz item bank + adaptive selection | better mastery signal | M |
| R7 | Server-side project test runner | objective Level-2+ scoring | M |
| R8 | Multi-worker mode (shared nothing, LB in front) | horizontal scale | M |
| R9 | External PostgreSQL reference deployment + CI | confidence for hosted prod | M |
| R10 | Content CMS bulk import (JSON) with schema lint | faster authoring | M |

S = days, M = weeks. Nothing in R1–R10 blocks the current release; the E2E
journeys (student 10/10, admin 8/8) define the release bar and pass it.
