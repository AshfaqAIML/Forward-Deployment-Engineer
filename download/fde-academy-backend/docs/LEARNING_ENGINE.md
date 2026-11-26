# The Learning Engine — FDE Academy v2

The educational core that makes the platform a learning environment rather
than a text display: a structured content system, curriculum-aware
recommendations, knowledge checks with full tutoring feedback, an optional
grounded AI tutor, and the CMS that authors it all.

## Structured content system

The full hierarchy (all persisted, all served through the API):

```
subjects ─< courses ─< modules ─< chapters ─< lessons (content blocks,
             │  objectives, prerequisites, version)          knowledge checks)
             │                                  └─< question_feedback / option_feedback
             └─ learning stages (18, the roadmap — every entity links to a stage)

books ─< book_chapters (same block schema)      projects (Level 1–7)
      ─< editions ─< files (private storage)    exercises (coding + math)

quiz flows: quizzes ─< questions ─< question_options (is_correct server-only)
            quiz_attempts ─< attempt_answers    (PROMPT 9 — unchanged)
```

One content model everywhere: lessons and book chapters share the JSONB block
schema the frontend renders. `GET /api/v1/curriculum/tree` returns the whole
structure (with per-lesson quiz links, per-stage books/projects, and the
caller's completion state folded in) so every surface stays connected to the
same curriculum.

**Learning objectives** ride on courses and lessons (`objectives jsonb`) and
appear in lesson detail, the recommendation engine's challenges, and the AI
tutor's context. **Prerequisites** exist at both course and lesson level and
feed the skip-warning system below.

## Knowledge checks — the full feedback loop

After a major concept, the lesson's check can run in **practice mode**
(`POST /api/v1/lessons/:code/check`): ungraded, immediate, and never touching
`quiz_attempts` (recorded only as a `practice_submit` activity event, excluded
from mastery). The response is per-question structured feedback:

For an **incorrect** answer:
- `whyIncorrect` — the authored per-option misconception note when the CMS
  provides one (`option_feedback`), otherwise a composed explanation grounded
  in the question's own explanation;
- `whyCorrect` — the authored explanation of the right answer;
- `simplerExample` — authored, or extracted from the lesson's own teaching
  content (its exercise/steps blocks);
- `lesson` — code, title and API link back to the relevant lesson.

For a **correct** answer:
- `whyCorrect` — why this is the right reading;
- `nextChallenge` — the authored challenge, or one composed from the next
  lesson in curriculum order.

Graded attempts expose the same structure through
`GET /api/v1/assessments/attempts/:id/feedback` (owner or admin). The 102
seeded lesson-check questions all carry authored simpler examples and next
challenges; the fm-1 check also ships authored per-option misconception notes
as the demonstration set, and the CMS can author them for any question.

## Adaptive learning

`GET /api/v1/me/recommendation` computes the next lesson from recorded
activity only (never client claims), weighing exactly the required factors:

| Factor | Behaviour |
| --- | --- |
| Completed lessons | The baseline cursor through curriculum order (stage → mathematics-pinned course order → module → chapter → lesson). |
| Assessment results | Graded attempts feed `v_subject_mastery` / `v_course_mastery`. |
| Prerequisite completion | Unmet lesson- or course-level prerequisites produce explicit `warnings[]` (with the missing foundation) — skipping is possible but never silent, and never automatic. |
| Struggle areas | The weakest attempted course (average < 70 %) jumps the queue: its next incomplete lesson is recommended first, with the reason spelled out. |
| Learning stage | The recommendation stays within the learner's current stage (surfaced in `reasons[]`). |
| Mathematics first | A brand-new learner (no completions AND no attempts) is pointed at Foundation Mathematics first — the mathematics curriculum leads for every new learner (also pinned first in `/curriculum/tree` and the course listing). |

Every response carries machine-readable `reasons[]` (factor + text),
`warnings[]`, `struggles`, and the dashboard rollup numbers — the frontend can
render exactly why the engine chose what it chose.

`GET /api/v1/me/mastery` exposes the mastery views (subject and course level)
with the struggle threshold.

## AI tutor (optional, grounded)

See `docs/AI_TUTOR.md`. Short version: retrieval over the approved curriculum
only, hard grounding rules in the system prompt, inline citations, a refusal
path for anything outside the material, and a fixed disclaimer distinguishing
educational explanations from verified course material. Modes: simpler-words
explanation, vocabulary, additional examples, practice question generation
(never recorded), progressive exercise hints (authored first, then grounded
AI), programming-error help, and step-by-step math walkthroughs.

## Cross-device progress

All progress lives server-side (PROMPT 9's verified model): lesson completions
are granted only through passing knowledge checks; notes, bookmarks, reading
progress, attempts and submissions are keyed to the user and unreachable
across accounts. Any device that signs in sees the same state.

## Verification

- `npm test` — 92 integration tests (65 from the backend build + 27 for the
  learning engine: adaptive, feedback, practice, AI tutor with the stub
  provider, CMS, uploads, curriculum tree, math-first ordering).
- `scripts/p10_admin_ui_smoke.py` (repo-external, Playwright) — 17/17 checks
  of the admin console against the real server.
- The AI tutor was additionally live-smoked through the real provider
  (grounding, citations, refusal path, practice generation, error help).
