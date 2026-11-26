// scripts/counts_spa.mjs — verify the SPA's offline curriculum copy
// (scripts/web/data1-5.js) by evaluating the real data files in a VM and
// counting the arrays. Top-level `const` lives in the context's lexical
// environment (not on the sandbox object), so counting runs INSIDE the VM.
// The only stub is FDE.term (a look-up helper returning a display object).
import vm from "node:vm";
import fs from "node:fs";

const WEB = "/home/z/my-project/scripts/web";
const ctx = vm.createContext({
  console,
  FDE: { term: (k, l) => ({ k, l }), DATA: null },
});
for (const f of ["data1.js", "data2.js", "data3.js", "data4.js", "data5.js"]) {
  vm.runInContext(fs.readFileSync(`${WEB}/${f}`, "utf8"), ctx, { filename: f });
}

const out = vm.runInContext(`(() => {
  const count = (arr, fn) => arr.reduce((m, x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; return m; }, {});
  return {
    STAGES: STAGES.length,
    PHASES: Object.keys(PHASES).length,
    COURSES: COURSES.length,
    courseCodes: COURSES.map(c => c.id),
    LESSONS: LESSONS.length,
    lessonIds: LESSONS.map(l => l.id),
    lessonsByStage: count(LESSONS, l => l.stage),
    lessonsWithInlineQuiz: LESSONS.filter(l => l.quiz).length,
    inlineQuizQuestions: LESSONS.reduce((n, l) => n + (l.quiz ? l.quiz.length : 0), 0),
    lessonSampleKeys: Object.keys(LESSONS[4]),
    BOOKS: BOOKS.length,
    bookSlugs: BOOKS.map(b => b.id),
    GLOSSARY_BASE: GLOSSARY_BASE.length,
    DATA_READY_GLOSSARY: DATA_READY_GLOSSARY.length,
    PROJECTS: PROJECTS.length,
    projectIds: PROJECTS.map(p => p.id),
    LABS: LABS.length,
    labIds: LABS.map(l => l.id),
    SQL_TABLE: SQL_TABLE.length,
    FAQ_CORPUS: FAQ_CORPUS.length,
    TOPIC_TESTS: TOPIC_TESTS.length,
    topicTestIds: TOPIC_TESTS.map(t => t.id),
    topicTestQuestions: TOPIC_TESTS.reduce((n, t) => n + (t.questions || []).length, 0),
    MOCK_EXAM_QUESTIONS: MOCK_EXAM.questions.length,
    HOME_FAQ: HOME_FAQ.length,
    CAREER_TABS: Object.keys(CAREER),
  };
})()`, ctx);

console.log(JSON.stringify(out, null, 1));
