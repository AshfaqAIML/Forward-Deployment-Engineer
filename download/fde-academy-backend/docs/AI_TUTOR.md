# The AI Tutor — optional, grounded, honest

An optional tutor that helps learners *understand* the approved material. It
is deliberately constrained: the curriculum is its only content source, it
never invents course content or results, and its output is always visually
distinguishable from verified material.

## Architecture

```
POST /api/v1/ai/tutor*  ─▶ requireTutor (auth + role + FDE_AI_TUTOR)
        │
        ▼
   retrieval (src/ai/retriever.js)
   • lessons (title, objectives, flattened block text)
   • glossary terms (exact-term match dominates)
   • book chapters, coding exercises
   • a pinned lesson is always included when lessonCode is given
        │
        ▼
   tutor prompts (src/ai/tutor.js)
   • BASE_RULES: ground in MATERIAL, refuse outside it, cite inline,
     never invent content/answers/completion, label "Outside the course
     material:" for anything beyond the source
   • mode overlays: explain | vocabulary | examples | practice | hint |
     error | math
        │
        ▼
   provider (src/ai/provider.js)
   • sdk  — z-ai-web-dev-sdk (production deployments with the package)
   • cli  — the `z-ai chat` subprocess (works without the package)
   • stub — deterministic fake for the test suite
```

## The honesty contract

Every response carries:

- `answer` — the tutor's text;
- `sources[]` — the exact lessons/glossary/book/exercise entries used, with
  codes and titles;
- `grounded` — whether retrieval had signal (pinned lesson or ≥ 2 relevance);
- `disclaimer` — fixed text: *"AI tutor explanations are educational support
  generated from the approved FDE Academy material — they are not verified
  course content and are never recorded as results."*

The system prompt's hard rules make the model:

1. answer ONLY from the provided material, else reply "This is not covered in
   the approved course material." and point at the relevant lesson;
2. cite inline (`[lesson:fm-1]`, `[glossary:break-even]`);
3. never invent quiz questions, correct answers, scores, or completion
   records (the API structurally cannot write those from tutor calls anyway);
4. prefix anything beyond the material with "Outside the course material:".

Practice generation (`POST /ai/tutor/practice`) is additionally labelled in
the response (`practice: true` + note) and is never scored, never stored as a
knowledge check, and never appears in progress — verified in tests.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /ai/tutor/status` | capabilities, provider, disclaimer (public) |
| `POST /ai/tutor` | general entry: `{message, lessonCode?, mode?}` |
| `POST /ai/tutor/explain-error` | programming errors: `{error, code?, exerciseCode?}` |
| `POST /ai/tutor/math-steps` | step-by-step math: `{problem, lessonCode?}` |
| `POST /ai/tutor/hints` | progressive hints: `{exerciseCode, hintIndex}` — authored `exercise_hints` first, grounded AI beyond them |
| `POST /ai/tutor/practice` | `{lessonCode, count?}` labelled practice |

All tutor endpoints require authentication (student/author/admin). Usage is
logged as `ai_tutor`/`ai_hint`/`ai_practice` activity events with **mode
only** — question text is never stored (tested).

## Configuration

```
FDE_AI_TUTOR=off        # disable entirely (endpoints answer 403 with a clear message)
FDE_AI_PROVIDER=auto    # auto | sdk | cli | stub
```

`auto` prefers the SDK when `z-ai-web-dev-sdk` resolves, and falls back to
the `z-ai chat` CLI. The backend keeps zero hard runtime dependencies: both
providers are loaded lazily.

## Live verification (this build)

Run against the real provider (`cli`):

- "explain subtracting money in simpler words" (pinned fm-1) → grounded,
  step-by-step, cites `[lesson:fm-1]`;
- "what does contribution margin mean?" → retrieves
  `[glossary:contribution-margin]` and answers from it with the material's
  own example;
- "capital of France / 1998 World Cup" → "This is not covered in the approved
  course material." (refusal path);
- practice generation for fm-1 → material-styled questions, labelled
  PRACTICE, answer key included;
- a `TypeError` in a reduce callback → cites `[lesson:pg-1]`'s variables
  teaching to explain the error.

The test suite covers the same contract deterministically with the stub
provider (grounding flag, citations, refusal wording, practice labelling,
hint authored/AI boundary, privacy logging, input validation).
