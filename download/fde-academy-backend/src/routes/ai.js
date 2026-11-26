// src/routes/ai.js — the optional AI tutor surface. Every response carries
// its sources, a grounded flag and the disclaimer; usage is logged as an
// activity event with mode only (message content is never stored).
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, forbidden } from "../errors.js";
import { resolveProvider } from "../ai/provider.js";
import { tutorAnswer, progressiveHint, generatePractice, DISCLAIMER } from "../ai/tutor.js";
import { config } from "../config.js";
import { logEvent } from "../activity.js";

let providerPromise = null;
async function getProvider() {
  if (!providerPromise) providerPromise = resolveProvider(config.aiProvider);
  return providerPromise;
}

function requireTutor(ctx) {
  if (!config.aiTutorEnabled) {
    throw forbidden("The AI tutor is disabled on this deployment (FDE_AI_TUTOR=off)");
  }
  if (ctx.user.role !== "admin" && ctx.user.role !== "author" && ctx.user.role !== "student") {
    throw forbidden("AI tutor is available to students, authors and admins");
  }
}

export function registerAiTutorRoutes(router) {

  // POST /api/v1/ai/tutor — the general entry point.
  // modes: explain | vocabulary | examples | practice | hint | error | math
  router.post("/api/v1/ai/tutor", async (ctx) => {
    if (!ctx.user) return { status: 401, body: { error: { code: "unauthorized", message: "Authentication required" } } };
    requireTutor(ctx);
    const body = validate({ message: "string:2:2000", "lessonCode?": "string:1:20",
      "mode?": "enum:explain,vocabulary,examples,practice,hint,error,math" }, ctx.body);
    const provider = await getProvider();
    const result = await tutorAnswer(ctx.db, provider, body);
    await logEvent(ctx.db, ctx.user.id, "ai_tutor", "lesson", null, { mode: result.mode, lessonCode: body.lessonCode || null });
    return { body: { ...result, provider: provider.name } };
  });

  // POST /api/v1/ai/tutor/explain-error — programming error help (exercise context).
  router.post("/api/v1/ai/tutor/explain-error", async (ctx) => {
    if (!ctx.user) return { status: 401, body: { error: { code: "unauthorized", message: "Authentication required" } } };
    requireTutor(ctx);
    const body = validate({ error: "string:2:600", "code?": "string:1:4000", "exerciseCode?": "string:1:20" }, ctx.body);
    const provider = await getProvider();
    const result = await tutorAnswer(ctx.db, provider, {
      mode: "error",
      message: `I hit this error: ${body.error}`,
      extra: body.code ? `My code:\n${body.code}` : "",
      lessonCode: undefined,
    });
    await logEvent(ctx.db, ctx.user.id, "ai_tutor", null, null, { mode: "error" });
    return { body: { ...result, exercise: body.exerciseCode || null, provider: provider.name } };
  });

  // POST /api/v1/ai/tutor/math-steps — step-by-step mathematical explanation.
  router.post("/api/v1/ai/tutor/math-steps", async (ctx) => {
    if (!ctx.user) return { status: 401, body: { error: { code: "unauthorized", message: "Authentication required" } } };
    requireTutor(ctx);
    const body = validate({ problem: "string:2:600", "lessonCode?": "string:1:20" }, ctx.body);
    const provider = await getProvider();
    const result = await tutorAnswer(ctx.db, provider, {
      mode: "math", message: `Walk me through: ${body.problem}`, lessonCode: body.lessonCode,
    });
    await logEvent(ctx.db, ctx.user.id, "ai_tutor", "lesson", null, { mode: "math" });
    return { body: { ...result, provider: provider.name } };
  });

  // POST /api/v1/ai/tutor/hints — progressive hints for an exercise:
  // authored hints first, AI-generated (grounded) beyond them.
  router.post("/api/v1/ai/tutor/hints", async (ctx) => {
    if (!ctx.user) return { status: 401, body: { error: { code: "unauthorized", message: "Authentication required" } } };
    requireTutor(ctx);
    const body = validate({ exerciseCode: "string:2:20", hintIndex: "int:1:10" }, ctx.body);
    const provider = await getProvider();
    const result = await progressiveHint(ctx.db, provider, body);
    if (!result) throw notFound("No such exercise");
    await logEvent(ctx.db, ctx.user.id, "ai_hint", "coding_exercise", null, { exerciseCode: body.exerciseCode, hintIndex: body.hintIndex });
    return { body: { ...result, provider: provider.name } };
  });

  // POST /api/v1/ai/tutor/practice — generated practice questions (clearly
  // labelled; never scored; never recorded as knowledge checks).
  router.post("/api/v1/ai/tutor/practice", async (ctx) => {
    if (!ctx.user) return { status: 401, body: { error: { code: "unauthorized", message: "Authentication required" } } };
    requireTutor(ctx);
    const body = validate({ lessonCode: "string:2:20", "count?": "int:1:6" }, ctx.body);
    const provider = await getProvider();
    const result = await generatePractice(ctx.db, provider, body);
    await logEvent(ctx.db, ctx.user.id, "ai_practice", "lesson", null, { lessonCode: body.lessonCode, count: result.count });
    return { body: { ...result, provider: provider.name } };
  });

  // GET /api/v1/ai/tutor/status — capabilities + provider, so clients can
  // show the assistant as optional.
  router.get("/api/v1/ai/tutor/status", async (ctx) => {
    const provider = config.aiTutorEnabled ? await getProvider() : null;
    return { body: {
      enabled: config.aiTutorEnabled,
      provider: provider?.name || null,
      modes: ["explain", "vocabulary", "examples", "practice", "hint", "error", "math"],
      disclaimer: DISCLAIMER,
      note: "The tutor answers only from the approved curriculum; educational explanations are always distinguished from verified material.",
    } };
  }, { public: true });
}
