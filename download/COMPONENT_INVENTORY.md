# FDE Academy — Component Inventory (implementation-level)

This inventory documents the frontend **as implemented** in the canonical
source files under `scripts/web/` and shipped in the single-file SPA
(`download/FDE_Academy_Frontend.html`, mirrored to
`download/fde-academy-backend/public/index.html`). It complements — and does
not replace — the design-level inventory
(`download/FDE_Academy_Component_Inventory.xlsx`, 45 components in 17
categories, from the design round): that file describes *variants, states and
priorities*; this one describes *code*: which file owns which behaviour, what
it depends on, which routes it serves.

Counts below were verified against the code, not estimated. The shipped
artifact contains exactly two `<script>` blocks: the app bundle
(core → data → views, in that order) and the live-platform bridge.

## 1. Architecture summary

| Layer | Source files | Role |
|---|---|---|
| App shell & utilities | `scripts/web/core.js` | Router, chrome (topbar/nav/footer), state store, icons, toasts, glossary popovers, file downloads, the maths widget library |
| Curriculum data | `scripts/web/data1.js` … `data5.js` | Plain arrays/objects (offline copy of the curriculum) |
| Views | `scripts/web/views1.js` … `views3.js` | Route registrations + render functions (vanilla-JS template literals) |
| Live-platform bridge | `scripts/web/bridge.js` | Optional cloud layer: sign-in, server-scored quizzes, signed book downloads, progress card |
| Assembly | `scripts/web/build.py` (+ `sync.py` checker) | Inlines everything into one HTML file; syncs both artifact copies |

The SPA is local-first: every route renders and works offline from the data
files; the bridge only enhances it when the backend is reachable and the
visitor is signed in.

## 2. Shared app-shell components (core.js)

| Component | Lines (approx.) | Purpose | Used by | Key interactions |
|---|---|---|---|---|
| `FDE` namespace + `term()` store | 3–38 | Global namespace; terminology lookup (`T(k, l)`) that aliases jargon per learner level | Every data file, every view | Glossary keys resolved at render time |
| `I(name, size)` — icon system | 39–45 | Inline SVG icon factory (~30 named icons) | All views, chrome | None (pure) |
| `toast(msg, type)` | 46+ | Transient notification surface | Quiz results, downloads, sign-in, sync events | Auto-dismiss; stack |
| Router: `route(pattern, view)`, `matchRoute(hash)`, `renderRoute()`, `nav(path)` | 130–190 | Hash-based SPA routing with `:param` patterns, active-nav marking | All views (registered via `route(...)`) | `hashchange` → render; `nav()` for programmatic transitions |
| `renderChrome(path)` | 192–253 | Topbar (brand, primary nav, auth state), footer; applies active section; mobile collapse | Every page (except embedded reader chrome) | Nav clicks; responsive collapse at 640 px |
| `P` — learner state store | core.js (top) | localStorage-backed progress: completed lessons, quiz answers, demo checklists, bookmarks, profile | Lesson/project/quiz/dashboard views | Read on render; written on interactions |
| `openGlossaryPopover(key)` | 254–277 | Click-to-open term popover with simple/detailed/example layers | Term links inside lesson and reader content | Click term → popover; click-through to full glossary |
| `downloadFile(name, content, mime)` + `chapterToDocHtml(book, ch)` | 278–297 | Offline downloads: the six books' bundled `.doc` editions; HTML→doc export of any chapter | Book detail, reader | Blob download; no network |
| Maths widget library | 298–620 | Seven interactive widgets — `stepcalc` (stepped arithmetic), `numberline`, `plot`, `ieq` (interactive equations with sliders), `fraction`, `percent`, `geometry` — plus `quickSlider` helper and `mountMath()` deferred-wiring queue | Maths studio; embedded in maths lessons | Sliders/inputs update live; wired after render via `MOUNTS` |
| `m(s)` term renderer | 298–310 | Wraps text so term keys render as glossary links | Lesson blocks, reader | Integrates with the popover |

Shared by definition: chrome, router, store, toasts, icons, popovers, the
widget library.

## 3. Page views (route registrations)

Every view is a registration `route("pattern", view)` plus its render
function inside the file listed. "Data" names the source arrays from
`data1–5.js`.

### views1.js — curriculum

| Route | View / section | Purpose | Depends on | Key interactions |
|---|---|---|---|---|
| `#/` and `#/home` | Home | Landing inside the app: hero, the seven phase cards, how-it-works, FAQ | `STAGES`, `PHASES`, `HOME_FAQ` (5) | Links into roadmap/courses/sign-in |
| `#/roadmap` | Learning roadmap | All 18 stages grouped by phase, with per-stage progress | `STAGES` (18), `PHASES` (7), `P` | Stage cards open `#/stage/:id` |
| `#/stage/:id` | Stage detail | One stage: description, courses, lesson list with completion state | `STAGES`, `COURSES`, `LESSONS` (34), `P` | Lesson links; progress ticks |
| `#/courses` | Course library | All 8 courses with difficulty, length, prerequisites | `COURSES` (8) | Course cards |
| `#/course/:id` | Course detail | Objectives, module/chapter outline, lesson list, linked book & test | `COURSES`, `LESSONS`, `BOOKS`, `TOPIC_TESTS` | Lesson links; book link |
| `#/lesson/:id` | Lesson reader + knowledge check | Objectives, content blocks (text, worked examples, term links, embedded widgets), the 3–4 question quiz, links to related project/lab/book | `LESSONS` (34, incl. 102 inline quiz questions), `P`, widgets, popover | Quiz answer → instant local score + explanation; completion persisted; **bridge `syncQuiz` re-submits to the server for official scoring** |

### views2.js — library, labs, projects, search, account

| Route | View / section | Purpose | Depends on | Key interactions |
|---|---|---|---|---|
| `#/books` | Digital book library | The six print-edition books | `BOOKS` (6) | Book cards |
| `#/book/:id` | Book detail | Cover, description, objectives, table of contents (37 chapters total), offline `.doc` download | `BOOKS`, `downloadFile` | Download `.doc` (offline); **bridge `injectPdfButtons` adds signed DOCX/PDF downloads when signed in** |
| `#/book/:id/:ch` | Chapter reader | One chapter typeset as a document; prev/next navigation; reading progress | `BOOKS`, `chapterToDocHtml`, `P`, popover | Chapter nav; progress persisted; term popovers |
| `#/labs` | Practical labs | All 9 labs: 3 maths + 6 coding | `LABS` (9) | Lab cards |
| `#/lab/:id` | Lab workspace | Maths labs run the live widgets; coding labs show instructions, starter code, hints, solution | `LABS`, widget library, `SQL_TABLE` (12 rows, for the SQL lab) | Widget interaction; reveal solution |
| `#/projects` | Project centre | The 15 portfolio projects grouped by phase | `PROJECTS` (15) | Project cards |
| `#/project/:id` | Project brief | Customer brief, steps, the demonstration checklist that gates submission, evidence field | `PROJECTS`, `P` | Checklist must be fully ticked before submission is accepted (offline: `P`; **bridge submits to server when signed in**) |
| `#/search/:q` | Search | Search across lessons, books, glossary, FAQ | `LESSONS`, `BOOKS`, `GLOSSARY`, `FAQ_CORPUS` (8) | Live query via `#/search/…` |
| `#/signin` | Profile / account | Local profile (name/level) or cloud account | `P`, **bridge `injectAccountFields` renders the real sign-in/sign-up forms** | Sign-up/sign-in; profile save |

### views3.js — practice, progress, career, admin

| Route | View / section | Purpose | Depends on | Key interactions |
|---|---|---|---|---|
| `#/assessments` (+ `/:tab`) | Assessment centre | Tabs: **take** (5 topic tests, 25 questions), **results** (attempts), **mock** (mock exam A: 12 questions, 25 minutes, 60% pass), **report** | `TOPIC_TESTS` (5), `MOCK_EXAM`, `P` | Timed mock; topic tests; results tables |
| `#/glossary` | Glossary | All terms, category filter | `DATA_READY_GLOSSARY` (55) | Popovers; category filter |
| `#/maths` | Maths studio | "All seven, live:" one demo of each maths widget | widget library (7) | Full interactivity |
| `#/dashboard` | Learner dashboard | Recommended next activity, recent quiz results, this week's goal, book reading progress, bookmarks & notes, data export | `P`, `LESSONS`, `BOOKS` | Data export (offline); **bridge `injectCloudCard` adds the cloud sync/progress card when signed in** |
| `#/career` (+ `/:tab`) | Career centre | Six tabs: guide, interview, sysdesign, portfolio, cv, comms | `CAREER` (6 tabs) | Tab navigation |
| `#/admin` | Admin console | Manage account, content health (real signals), glossary management, publishing flow | Cloud-only (role-gated) | **Renders only against the backend with an admin token; the offline copy shows a gated notice** |

## 4. Bridge components (bridge.js — cloud layer, second script block)

| Component | Purpose | Interacts with |
|---|---|---|
| `api(method, path, body)` | JSON client for `/api/v1` with token refresh and one retry | Backend REST API |
| `tokens()` | Cloud session storage (`fde.cloud`) | localStorage |
| `injectAccountFields()` | Renders real sign-in / sign-up / token-refresh forms into `#/signin` | `#/signin` view |
| `syncQuiz(lessonCode)` | Submits lesson knowledge checks for server-side scoring (official attempts + feedback) | `#/lesson/:id` quiz |
| `downloadEdition(slug, format)` + `saveBlob()` | Signed single-use edition downloads (DOCX/PDF) | `#/book/:id` |
| `injectPdfButtons()` | Adds the print-edition DOCX/PDF buttons to book detail | `#/book/:id` |
| `injectCloudCard()` | Account + server progress card on the dashboard | `#/dashboard` |

Design rule (enforced by the build): every bridge feature degrades silently —
offline or signed-out, the app behaves exactly as the offline copy does.

## 5. Landing page (download/FDE_Academy_Landing.html)

A standalone zero-JavaScript page (11 sections) with the same design tokens
and 16 deep links into the SPA. Guarded by the integrity checker's checks C
(design-token parity) and D (route links resolve). It is intentionally NOT
part of the built SPA and has no components in the code sense.

## 6. What this file is for

- Onboarding: find the file that owns a behaviour before changing it.
- Review: check a proposed change against "shared vs page-specific" scope.
- Drift awareness: if you add a component, add the row here in the same
  commit; `sync.py` guards the artifact, this file guards the map.

Known implementation notes (not defects): the offline quiz scoring in the
lesson view is intentionally duplicated with the bridge's server scoring
(local-first design); `GLOSSARY_BASE` in the SPA lists 55 terms while the
database seed has 56 — see CONTENT_INVENTORY.md §7.
