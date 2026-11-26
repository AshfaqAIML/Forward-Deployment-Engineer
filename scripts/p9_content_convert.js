// scripts/p9_content_convert.js — converts the PROMPT 8 frontend curriculum
// data (scripts/web/data*.js) into seed JSON for the backend seeder.
// The data files call interactive component factories at load time; here those
// factories return plain block objects (the same {t: ...} schema the frontend
// renders), and function-valued fields are marked as client-evaluated.
import { readFileSync, writeFileSync } from "node:fs";

/* ---- stubs for symbols the data files use at load time ---- */
const component = t => (opts) => deepClean({ t, ...opts });
globalThis.stepcalc = (title, steps) => deepClean({ t: "steps", title, steps });
globalThis.numberline = component("nl");
globalThis.plot = opts => deepClean({ t: "plot", ...opts, fn: markFn(opts.fn) });
globalThis.ieq = component("ieq");
globalThis.fraction = component("frac");
globalThis.percent = component("pct");
globalThis.geometry = component("geom");
globalThis.mathExpr = x => ({ t: "math", x });

function markFn(fn) {
  if (typeof fn !== "function") return fn ?? null;
  return { __clientFn: true, note: "client-evaluated by the frontend component library" };
}
function deepClean(v) {
  if (typeof v === "function") return { __clientFn: true };
  if (Array.isArray(v)) return v.map(deepClean);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = deepClean(val);
    return out;
  }
  return v;
}

/* ---- load the frontend data modules (single shared scope, like the browser build) ---- */
globalThis.FDE = { term: (k, l) => l || k.replace(/-/g, " ") };
const WEB = "/home/z/my-project/scripts/web";
const combined = ["data1.js", "data2.js", "data3.js", "data4.js", "data5.js"]
  .map(f => readFileSync(`${WEB}/${f}`, "utf8")).join("\n;\n")
  + "\n;globalThis.__EXPORT = { STAGES, COURSES, LESSONS, BOOKS, PROJECTS, LABS, TOPIC_TESTS, MOCK_EXAM, GLOSSARY_BASE };";
new Function(combined)();

const { STAGES, COURSES, BOOKS, PROJECTS, LABS, TOPIC_TESTS, MOCK_EXAM, GLOSSARY_BASE } = globalThis.__EXPORT;
const COLLECT = { lessons: STAGES ? globalThis.__EXPORT.LESSONS : [] };

/* ---- assemble ---- */
const stages = STAGES.map(s => ({ number: s.n, phase: s.phase, title: s.title, meta: s.meta }));

const subjects = [...new Set(COURSES.map(c => c.subject))].map((name, i) =>
  ({ key: name.toLowerCase(), name, position: i }));

const courses = COURSES.map((c, i) => {
  const stage = STAGES.find(s => s.id === c.stage);
  return { code: c.id, title: c.title, subjectKey: c.subject.toLowerCase(),
           stageNumber: stage.n, difficulty: c.difficulty.split(" ")[0] === "All" ? "Beginner" : c.difficulty,
           blurb: c.blurb, objectives: c.objectives, prereqNote: c.prereq, sortOrder: i };
});
const coursePrereqs = [
  ["algebra", "fm"], ["logic", "algebra"], ["graphs", "logic"], ["ps", "graphs"],
  ["prog1", "ps"], ["ai1", "prog1"],
];

/* modules/chapters derived from lesson module+chapter grouping */
const moduleChapters = {}; // courseCode -> [{moduleTitle, chapters: Map(chapterTitle -> lessons[])}]
const lessons = COLLECT.lessons.map(l => {
  const stage = STAGES.find(s => s.id === l.stage);
  return { code: l.id, courseCode: l.course, stageNumber: stage.n,
           moduleTitle: l.module, chapterTitle: l.chapter, title: l.title,
           minutes: l.minutes, objectives: l.objectives, content: deepClean(l.blocks),
           quiz: l.quiz.map((q, qi) => ({ position: qi + 1, prompt: q.q, options: q.options,
                                          answerIdx: q.answer, explanation: q.why })) };
});
for (const l of lessons) {
  const per = (moduleChapters[l.courseCode] ||= []);
  let mod = per.find(m => m.title === l.moduleTitle);
  if (!mod) { mod = { title: l.moduleTitle, position: per.length + 1, chapters: [] }; per.push(mod); }
  let ch = mod.chapters.find(c => c.title === l.chapterTitle);
  if (!ch) { ch = { title: l.chapterTitle, position: mod.chapters.length + 1, lessons: [] }; mod.chapters.push(ch); }
  ch.lessons.push(l);
}
for (const [code, mods] of Object.entries(moduleChapters)) {
  for (const m of mods) for (const ch of m.chapters) {
    ch.lessons.sort((a, b) => a.code.localeCompare(b.code));
    ch.lessons.forEach((l, i) => { l.position = i + 1; });
  }
}
// stable lesson ordering across courses by stage then course
lessons.sort((a, b) => a.stageNumber - b.stageNumber || a.courseCode.localeCompare(b.courseCode) || a.position - b.position);
// FM lesson order follows data order; use original data order within a course:
const order = {}; COLLECT.lessons.forEach((l, i) => { order[l.id] = i; });
lessons.sort((a, b) => (order[a.code] ?? 0) - (order[b.code] ?? 0));

const quizzes = lessons.filter(l => l.quiz.length).map(l => ({
  code: `quiz-${l.code}`, kind: "lesson_check", lessonCode: l.code,
  title: `Knowledge check — ${l.title}`, passPct: 70, questions: l.quiz,
}));

const books = BOOKS.map(b => {
  const stage = STAGES.find(s => s.id === b.stage);
  return { slug: b.id, title: b.title, subject: b.subject, difficulty: b.difficulty === "All levels" ? "Beginner" : b.difficulty,
           description: b.desc, objectives: b.objectives, stageNumber: stage.n, pages: b.pages,
           chapters: b.chapters.map((c, i) => ({ position: i + 1, title: c.t, content: deepClean(c.blocks || []), fullWeb: !!c.full })) };
});

const glossary = GLOSSARY_BASE.map(([key, term, simple, detailed, example, related, cat]) =>
  ({ key, term, simple, detailed, example, related, category: cat }));

const projects = PROJECTS.map(p => {
  const stage = STAGES.find(s => s.id === p.stage);
  return { code: p.id, level: p.level, stageNumber: stage.n, title: p.title, customer: p.customer,
           brief: p.brief, steps: p.steps, demoChecklist: p.demo.map(d => ({ label: d })),
           concepts: p.concepts };
});

const tests = TOPIC_TESTS.map(t => ({
  code: t.id, courseCode: t.course, title: t.title, passPct: t.pass, minutes: t.minutes,
  questions: t.questions.map((q, qi) => ({ position: qi + 1, prompt: q.q, options: q.options,
                                           answerIdx: q.answer, explanation: q.why })),
}));
const mock = { code: MOCK_EXAM.id, title: MOCK_EXAM.title, passPct: MOCK_EXAM.pass, minutes: MOCK_EXAM.minutes,
               questions: MOCK_EXAM.questions.map((q, qi) => ({ position: qi + 1, prompt: q.q, options: q.options,
                                                               answerIdx: q.answer, explanation: q.why })) };

const codingExercises = LABS.filter(l => l.starter).map(l => ({
  code: l.id, title: l.title,
  language: l.lang === "SQL" ? "SQL" : l.lang === "HTTP" ? "HTTP" : "JavaScript",
  instructions: l.intro, starterCode: l.starter, minutes: l.minutes,
  hints: l.hint ? [l.hint] : [], solution: l.solution || null,
  linkedLessonCode: l.linked || null,
}));
const mathExercises = LABS.filter(l => l.kind === "Maths").map(l => ({
  code: l.id, title: l.title, prompt: l.intro, minutes: l.minutes,
  solution: l.checkNote || null, linkedLessonCode: l.linked || null,
}));

/* ---- knowledge-check feedback (PROMPT 10) ---- */
function extractExample(blocks, title) {
  const exercise = (blocks || []).find(b => b && b.t === "exercise" && b.prompt);
  if (exercise) return `Simpler example (from “${title}”): ${exercise.prompt}${exercise.solution ? ` — ${exercise.solution}` : ""}`;
  const steps = (blocks || []).find(b => b && b.t === "steps" && Array.isArray(b.steps) && b.steps.length);
  if (steps && steps.steps[0]) {
    const s = steps.steps[0];
    return `Simpler walkthrough (from “${title}”): ${s.expr || ""}${s.note ? ` — ${s.note}` : ""}`;
  }
  const para = (blocks || []).find(b => b && b.t === "p" && typeof b.x === "string" && b.x.length > 40);
  return para ? `Reread the core idea (from “${title}”): ${para.x}` : `Reread “${title}” and redo its worked example before trying again.`;
}
// next lesson in the global curriculum order (stage, course sort, position)
const orderedCodes = lessons.map(l => l.code);
for (const l of lessons) {
  const idx = orderedCodes.indexOf(l.code);
  const nextL = lessons[idx + 1];
  for (const q of l.quiz) {
    q.simplerExample = extractExample(l.content, l.title);
    q.nextChallenge = nextL
      ? `Next challenge: start “${nextL.title}” (${nextL.code})${nextL.objectives && nextL.objectives[0] ? ` — ${nextL.objectives[0]}` : ""}.`
      : "You have cleared this check — take the course topic test to consolidate.";
  }
}
// hand-authored per-option misconception notes (demonstration set: fm-1)
const fm1Notes = {
  "0-0": "You subtracted the rolls instead of the money. Track money in, money out — 6 rolls × £0.80 is money IN.",
  "0-1": "You multiplied the two prices together. Quantities and prices live on different sides: 6 × £0.80 is income, 8 × £1.50 is cost.",
  "0-3": "£9.00 treats the purchase as one lump sum. Work per item first — only then add.",
  "1-0": "80 p is the price of one roll, not the profit. The answer must combine both money flows.",
  "1-2": "10 × 1.20 changes the scenario instead of answering it. Keep the original numbers; recompute the difference.",
  "1-3": "−£5.20 keeps the sign the wrong way round. When income is larger, the shop is up, not down.",
  "2-0": "£4.20 is the price of the extra rolls alone. The question asks for the NEW total — add it to the previous total.",
  "2-2": "£12.60 triples the extra rolls as if 9 more were sold. Only 3 extra rolls were sold.",
  "2-3": "£10.00 is the cost of the extra rolls (3 × £1.50). Profit uses the selling price minus the cost.",
};
for (const l of lessons.filter(x => x.code === "fm-1")) {
  l.quiz.forEach((q, qi) => { q.optionNotes = q.options.map((_, oi) => fm1Notes[`${qi}-${oi}`] || null); });
}

const out = { subjects, stages, courses, coursePrereqs, moduleChapters: Object.fromEntries(
    Object.entries(moduleChapters).map(([code, mods]) => [code, mods.map(m => ({ title: m.title, position: m.position, chapters: m.chapters.map(c => ({ title: c.title, position: c.position, lessonCodes: c.lessons.map(l => l.code) })) }))])),
  lessons, quizzes, books, glossary, projects, tests, mock, codingExercises, mathExercises };

const OUT = "/home/z/my-project/download/fde-academy-backend/seed/content.json";
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log("written", OUT);
console.log("lessons:", lessons.length, "quizzes:", quizzes.length, "questions:", quizzes.reduce((t, q) => t + q.questions.length, 0),
  "books:", books.length, "glossary:", glossary.length, "projects:", projects.length,
  "coding:", codingExercises.length, "math:", mathExercises.length);
