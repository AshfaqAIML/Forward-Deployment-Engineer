# FDE Academy

A self-paced training platform for Forward Deployed Engineers: an 18-stage
curriculum, 34 lessons with machine-verified knowledge checks, 5 topic tests
and a mock exam, 6 print-edition books (DOCX/PDF), 15 portfolio projects, and
interactive maths/coding labs.

Architecture (approved project requirement): a standalone **Node.js backend
with zero runtime dependencies** (Node stdlib only; `pg` is required only in
PostgreSQL mode), a **single-file SPA** that works fully offline, and one
database adapter with **PostgreSQL for production** and **embedded PGlite**
(dev/test run real PostgreSQL semantics with no server).

## Repository map

| Path | Contents |
|---|---|
| `download/fde-academy-backend/` | The deployable backend: `src/`, 11 migrations (50 tables + 5 views), `seed/content.json` (the canonical curriculum payload), `test/` (96 tests), `ops/deploy.sh`, `docs/` (12 documents incl. ARCHITECTURE, API, SCHEMA, SECURITY, DEPLOYMENT), `README.md` |
| `download/fde-book-pipeline/` | Book production pipeline: turns the curriculum into the print editions (`build.py`, `publish.py`, `pipeline/`, output in `dist/`) |
| `download/fde_projects/` | Project Handbook companion: datasets and per-level project source code (levels 1–7) |
| `download/fde_design/` | Website design sources: wireframes, diagrams, embed assets |
| `scripts/web/` | Canonical SPA sources (`core.js`, `data1–5.js`, `views1–3.js`, `bridge.js`) + `build.py` (builds the single-file artifact) + `sync.py` (4 drift checks) — see `scripts/web/README.md` |
| `scripts/counts_db.mjs`, `scripts/counts_spa.mjs` | Content-verification scripts (pristine-seed SQL counts vs the SPA's offline copy) |
| `download/FDE_Academy_Frontend.html`, `download/FDE_Academy_Landing.html` | Built frontend artifacts (byte-identical to the sources) |
| `download/*.docx`, `*.pdf`, `*.json`, `*.xlsx` | Deliverables: the 6 books + workbook, reports, catalogues, inventories |
| `download/worklog.md` | Round-by-round handover log — **read the last entry to orient** |
| `download/CONTENT_INVENTORY.md`, `download/COMPONENT_INVENTORY.md` | Verified content and component inventories |
| `audit/` | QA evidence from the audit round (findings JSON, E2E journey logs) |

## Quickstart

```bash
cd download/fde-academy-backend
npm ci            # installs dev dependencies (PGlite etc.)
npm test          # 96 tests, each file gets a pristine in-memory PostgreSQL
bash ops/deploy.sh  # local reference deployment: PGlite + migrate + seed + publish books
```

Then open the served `public/index.html` (the SPA) — see `docs/DEPLOYMENT.md`
for the hosted-PostgreSQL production path and every flag.

Frontend workflow (canonical sources are in `scripts/web/`, never edit the
built HTML):

```bash
python3 scripts/web/build.py    # rebuilds BOTH artifact copies
python3 scripts/web/sync.py     # 4 integrity checks — must stay green
```

## Requirements

- Node.js ≥ 20 (verified on 24); npm.
- PostgreSQL 13+ only for production mode — development and tests use
  embedded PGlite, no server needed.
- Python 3 only for the two frontend workflow scripts.

## Status

Recovered, audited and production-ready as of 2026-11-26 (commit history in
`git log`; narrative in `download/worklog.md`). Known open items are listed
in the worklog's latest entry — currently one content drift (glossary 56 vs
55) and two stale counts in older docs.
