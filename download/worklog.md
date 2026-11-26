# FDE Academy — worklog

One entry per substantial development round. Newest last. This file is the
handover record: read the last entry to know exactly where the project stands
and what to do next. Update it at the end of every substantial round, in the
same commit as the round's changes.

---

## Round history

| # | Date | Commit | Focus |
|---|---|---|---|
| 1 | 2025-11-25 | `9180838`…`935a228` era (original build; opaque auto-commit messages) | Platform built: Node.js stdlib backend, schema (50 tables + 5 views, 11 migrations), SPA, book pipeline, 96-test suite, reports |
| 2 | 2026-11-26 | `7227ef6` | Recovery: `#/home` route + active nav after chrome rebuild; landing rebuilt to the 11-section spec with shared design tokens; PGlite dependency restored (96/96) |
| 3 | 2026-11-26 | `20bf5a2` | Audit & Recovery Report (root causes, repairs, verification matrix) |
| 4 | 2026-11-26 | `8a4b62f` | Production readiness: fail-fast on explicitly-set hard-off prod flags; `e2e_admin` reads `FDE_DEMO_PASSWORD` from env; canonical frontend build (`bridge.js` extracted, `build.py` writes both copies) + `sync.py` drift checker; DEPLOYMENT.md §9b hosted quickstart; fresh-install proof (`npm ci`, 96/96); deploy rehearsal (E2E 10/10 + 8/8, books 6/6 published); Production Readiness Report (docx+pdf) |
| 5 | 2026-11-26 | `3bd425e` + `8286513` | **Maintainability docs**: CONTENT_INVENTORY.md + COMPONENT_INVENTORY.md (all counts verified from three sources) + this worklog; no code changes |
| 6 | 2026-11-26 | see `git log -1` after this entry | **GitHub packaging**: root `README.md` (repo map + quickstart); `.gitignore` hardened (`.env`, `pgdata/`, root `storage/`, `*.log`); root `.env` **untracked** (it holds a `DATABASE_URL` connection string — never publish it); project zip built for GitHub upload |

---

## Entry — Round 5: maintainability documentation (2026-11-26)

**Date:** 2026-11-26 · **Stage:** post-recovery, production-ready, documentation hardening · **Latest commit at round start:** `8a4b62f` → this round's content commit: `3bd425e` (inventories); this worklog lands as the commit immediately after it (`git log -1`).

### Work completed
- Created `download/CONTENT_INVENTORY.md`: every content category (subjects, stages, courses, lessons, quizzes, questions, books, chapters, editions, glossary, projects, coding and maths exercises, labs, career tabs) with verified counts, identifiers and the source of truth for each. All numbers produced by three independent checks: the seed payload JSON, a pristine in-memory PostgreSQL seeded through the real seeder and queried with SQL, and the SPA's offline data evaluated in a VM.
- Created `download/COMPONENT_INVENTORY.md`: implementation-level map of the app shell (router, chrome, store, toasts, glossary popovers, the seven maths widgets), all 20 page views with their routes/dependencies/interactions, and the six bridge (cloud) components. Complements the design-level `FDE_Academy_Component_Inventory.xlsx`; documents actual code, nothing invented.
- Created this worklog and two reusable verification scripts (`scripts/counts_db.mjs`, `scripts/counts_spa.mjs`).
- No application file was modified; no dependency was added or changed; the frontend artifact was not rebuilt.

### Files changed
- New: `download/CONTENT_INVENTORY.md`, `download/COMPONENT_INVENTORY.md`, `download/worklog.md`, `scripts/counts_db.mjs`, `scripts/counts_spa.mjs`.
- Modified: none (verified by `git diff` against `8a4b62f` — only additions).

### Tests executed (actual results)
- `node scripts/counts_db.mjs` — pristine in-memory seed: 11 migrations applied; seeded 4 subjects / 18 stages / 8 courses / 15 modules / 15 chapters / 34 lessons / 40 quizzes (34 lesson_check + 5 topic_test + 1 mock_exam) / 139 questions (102 + 25 + 12) / 6 books / 6 placeholder `.doc` editions / 37 book chapters / 56 glossary terms / 15 projects / 6 coding + 3 maths exercises. Exit 0.
- `node scripts/counts_spa.mjs` — SPA offline copy: 18 stages / 8 courses / 34 lessons (34 inline quizzes, 102 questions) / 6 books / 55 glossary / 15 projects / 9 labs / 5 topic tests (25 questions) / 12 mock-exam questions. Exit 0. Matches the DB everywhere except glossary (55 vs 56 — see known issues).
- Full backend suite `npm test` after the round: **96 pass, 0 fail** (fresh `npm ci` install — the sandbox recycle had wiped node_modules, which the lock file reinstall re-proved).
- `python3 scripts/web/sync.py`: **all four checks green** (A sources rebuild the shipped SPA byte-for-byte; B backend copy identical; C 22 design tokens identical; D 16 landing links resolve). The frontend artifact is byte-identical to the pre-round state.

### Architectural decisions
- The three documentation files live at the workspace root visible to the project owner (`download/`), not inside the backend repository, because they describe the *whole* platform (frontend sources, backend, pipeline, deployment docs).
- The 55-vs-56 glossary drift is **documented, not fixed**: fixing it would change the frontend sources, force a rebuild, and break this round's byte-identity guarantee. Content fixes belong to a dedicated content round.
- `counts_db.mjs` / `counts_spa.mjs` are kept as permanent re-verification tools (content-consistency check after any content change), next to `sync.py` (artifact-consistency check).
- The inventories deliberately cite the pre-existing deliverables (`FDE_Academy_Component_Inventory.xlsx`, `FDE_Academy_Book_Catalogue.json`) instead of duplicating them, and separate the 6-platform-books counts from the 32-book programme blueprint figures.

### Known issues and limitations
1. **Glossary drift:** seed/database have 56 terms, the SPA offline copy has 55 (`argument-logic` missing from `scripts/web/data2.js`). Offline glossary shows 55; signed-in server rendering sees 56. Recommended next content task.
2. **Stale counts in older docs (found this round, not fixed — outside this round's authorised files):** `fde-academy-backend/README.md` §Tests says "65 tests" (verified count: 96); `docs/ARCHITECTURE.md` says "39 tables, 3 views" (verified: 50 tables, 5 views, 11 migrations). Both need a one-line update in a future docs round.
3. Content-consistency (counts agreement) is a script run by hand; it is not yet wired into CI or a git hook the way `sync.py` could be.
4. `node_modules` does not survive sandbox recycles (files persist, installed modules do not) — always `npm ci` first after an environment reset.
5. No public deployment yet: no hosting account or credentials exist in this environment (see DEPLOYMENT.md §9b for the exact setup).
6. Round 1's commits carry opaque auto-generated messages; the table above is the reliable narrative.

### Exact next task
Add the missing glossary term `argument-logic` to `scripts/web/data2.js` (`GLOSSARY_BASE`, with the same fields as the seed entry in `fde-academy-backend/seed/content.json`: key, term, simple, detailed, example, related, category), then run the standard frontend workflow:
`python3 scripts/web/build.py && python3 scripts/web/sync.py` (expect all four checks green, glossary parity 56 = 56), re-run `node scripts/counts_spa.mjs`, commit sources + both artifacts together, and add a worklog entry.

### Commands to continue
```bash
cd /home/z/my-project/download/fde-academy-backend && npm ci   # after any sandbox recycle
npm test                                    # 96 tests (~3 min)
python3 /home/z/my-project/scripts/web/build.py     # rebuild frontend (writes BOTH copies)
python3 /home/z/my-project/scripts/web/sync.py      # 4 drift checks — must be green
node /home/z/my-project/scripts/counts_db.mjs       # content truth from a pristine seed
node /home/z/my-project/scripts/counts_spa.mjs      # SPA offline copy counts
bash ops/deploy.sh                          # local reference deployment (see docs/DEPLOYMENT.md)
```

---

## Entry — Round 6: GitHub packaging (2026-11-26)

**Date:** 2026-11-26 · **Stage:** production-ready, packaging for handover · **Latest commit at round start:** `8286513`.

### Work completed
- Wrote the root `README.md` (GitHub-facing: what the project is, repository map, quickstart, requirements, status).
- Hardened the root `.gitignore` (`.env`, `pgdata/`, root `storage/`, `*.log` on top of `skills/`, `node_modules/`).
- **Untracked the root `.env`** — it contains a `DATABASE_URL` connection string and must never be published. The file stays on local disk but is out of version control and future commits.
- Packaged the repository as `download/FDE_Academy_Project_2026-11-26.zip` for direct upload to GitHub (see below for exactly what is in it and what was deliberately left out).
- Untracked 10 stale `__pycache__`/`.pyc` build artifacts in `fde-book-pipeline/` (regenerated automatically; never belong on GitHub).
- Secrets sweep before packaging: zero occurrences of the demo-password string and zero JWT-shaped strings in any tracked file; the audit E2E JSONs contain no token/password fields.

### Files changed
- New: `README.md` (root), `download/FDE_Academy_Project_2026-11-26.zip` (deliverable, untracked-by-design: an archive of `HEAD`, never committed into itself).
- Modified: `.gitignore`, `download/worklog.md` (this entry).
- Untracked (not deleted from disk): `.env`, the 10 pipeline `.pyc` files.

### Tests executed (actual results)
- No code or content changed in this round, so the suite was not re-run; the last full run (this same day, Round 5 verification) was **96 pass / 0 fail** on a fresh `npm ci` install, and `sync.py` was **4/4 green** with a byte-identical frontend artifact.
- Zip verification (this round's check): `unzip -l` — 582 files, 39.4 MB zipped / 52.5 MB unzipped (details below), contains the backend repo, the book pipeline, the handbook companion, the design sources, `scripts/web/` sources, all deliverables, the three round-5 documents and the new root README; **no** `.env`, `node_modules`, `pgdata/`, `.git`, `upload/`, `skills/`, `__pycache__`/`.pyc`, or the nested `fde-academy-backend.zip` / `fde-book-pipeline.zip`.

### Architectural decisions
- The zip is `git archive HEAD` (tracked content only) with pathspec exclusions: `upload/` (the project owner's own screenshots — privacy), the two nested archives `download/fde-academy-backend.zip` and `download/fde-book-pipeline.zip` (zip-inside-zip redundancy; the live folders are included instead), and `__pycache__`/`.pyc`. `skills/` and `.env` are excluded automatically (untracked).
- Git history (auto-commit UUID messages included) is not part of the zip: the GitHub repository starts fresh; the worklog's round-history table is the durable narrative.

### Known issues and limitations
1. Unchanged from Round 5: glossary 56-vs-55 drift; README "65 tests" / ARCHITECTURE "39 tables" stale counts; counts scripts not wired into CI.
2. `node_modules` does not survive sandbox recycles — run `npm ci` before `npm test` after any environment reset.
3. Uploading to GitHub is manual (no hosting/GitHub credentials exist in this sandbox).

### Exact next task
Unchanged from Round 5: add the missing glossary term `argument-logic` to `scripts/web/data2.js`, rebuild (`build.py` + `sync.py`), re-run `counts_spa.mjs` (expect 56 = 56), commit sources + both artifacts, and add the worklog entry.

### Commands to continue
```bash
# Publish this zip to GitHub (after downloading it):
unzip FDE_Academy_Project_2026-11-26.zip -d fde-academy && cd fde-academy
git init && git add . && git commit -m "FDE Academy — initial import (see download/worklog.md)"
# create the repo on github.com, then: git remote add origin <url> && git push -u origin main

# Local development (unchanged):
cd download/fde-academy-backend && npm ci && npm test
python3 scripts/web/build.py && python3 scripts/web/sync.py
```
