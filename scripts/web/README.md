# scripts/web — canonical frontend source for FDE Academy

The single-file SPA (`download/FDE_Academy_Frontend.html`) is **built**, not
hand-edited. The sources of truth live here:

```
head.html     document head + all CSS (design tokens in :root)
core.js       store, router, chrome (topbar/nav/footer), utilities
data1-5.js    curriculum data: stages, courses, lessons, books, projects, labs…
views1-3.js   route views (home, roadmap, courses, reader, quizzes, admin…)
bridge.js     live-platform bridge (cloud sync when served by the backend)

build.py      assembles the parts -> download/FDE_Academy_Frontend.html
              AND syncs download/fde-academy-backend/public/index.html
sync.py       integrity checker (run after every frontend change):
                A  sources rebuild the shipped SPA byte-for-byte
                B  backend served copy identical to the shipped SPA
                C  landing page design tokens match the SPA tokens
                D  landing deep links resolve in the SPA route table
```

## Workflow

1. Edit the part files (never the built HTML).
2. `python3 scripts/web/build.py` — writes both artifact copies atomically.
3. `python3 scripts/web/sync.py` — must print `all checks green` (exit 0).
4. Smoke-test in a browser, then commit **sources and both artifacts together**.

`sync.py --fix` rebuilds first, then checks. CI or a pre-commit hook can run
`sync.py` to make drift a build failure instead of a silent regression — this
is exactly the failure mode that caused the 2026-11 recovery incident (the
bridge script existed only in the built file, so any rebuild silently deleted
cloud sync).

The landing page (`download/FDE_Academy_Landing.html`) is intentionally a
separate standalone file: zero JavaScript, the same design tokens, links into
the SPA. Its token values and route links are guarded by checks C and D.
