// test/adaptive.test.js — the curriculum-aware recommendation engine:
// mathematics-first, cursor order, struggle-driven review, prerequisite
// warnings, mastery views.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("brand-new learners get the mathematics curriculum first", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    const rec = await h.call("GET", "/api/v1/me/recommendation", { token: u.token });
    assert.equal(rec.status, 200);
    assert.equal(rec.json.lesson.code, "fm-1");
    assert.equal(rec.json.lesson.course.title, "Foundation Mathematics");
    assert.ok(rec.json.reasons.some(r => r.factor === "mathematics-first"));
    assert.deepEqual(rec.json.warnings, []);
    assert.equal(rec.json.struggles.subjects.length, 0);
  } finally { await h.close(); }
});

test("recommendation follows curriculum order as lessons complete", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    for (const code of ["st-1", "st-2", "st-3", "fm-1", "fm-2"]) {
      await h.passQuiz(`quiz-${code}`, u.token);
      const id = (await h.call("GET", `/api/v1/catalog/lessons/${code}`, { token: u.token })).json.lesson.id;
      await h.call("POST", `/api/v1/me/progress/lessons/${id}/complete`, { token: u.token, body: {} });
    }
    const rec = await h.call("GET", "/api/v1/me/recommendation", { token: u.token });
    assert.equal(rec.json.lesson.code, "fm-3");
    assert.equal(rec.json.lessonsDone, 5);
    assert.equal(rec.json.overallPct, Math.round(500 / 34));
    assert.ok(rec.json.reasons.some(r => r.factor === "cursor"));
    assert.ok(rec.json.reasons.some(r => r.factor === "stage"));
  } finally { await h.close(); }
});

test("unmet lesson prerequisites produce explicit warnings (no silent skipping)", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const u = await h.registerUser();
    // author a prerequisite: st-2 (notes) requires st-3 (dashboard) first
    const st2 = (await h.call("GET", "/api/v1/catalog/lessons/st-2")).json.lesson;
    const st3 = (await h.call("GET", "/api/v1/catalog/lessons/st-3")).json.lesson;
    const add = await h.call("POST", `/api/v1/admin/cms/lessons/${st2.id}/prerequisites`, {
      token: admin.token, body: { prerequisiteLessonId: st3.id } });
    assert.equal(add.status, 201);
    // user completes only st-1 → next is st-2, whose prerequisite st-3 is unmet
    await h.passQuiz("quiz-st-1", u.token);
    const id1 = (await h.call("GET", "/api/v1/catalog/lessons/st-1", { token: u.token })).json.lesson.id;
    await h.call("POST", `/api/v1/me/progress/lessons/${id1}/complete`, { token: u.token, body: {} });
    const rec = await h.call("GET", "/api/v1/me/recommendation", { token: u.token });
    assert.equal(rec.json.lesson.code, "st-2");
    const warning = rec.json.warnings.find(w => w.type === "lesson-prerequisite");
    assert.ok(warning, "warning must be present");
    assert.equal(warning.missing.code, "st-3");
    assert.ok(warning.text.includes("have not completed"));
    assert.ok(warning.text.includes("allowed, but expect gaps") || warning.text.includes("gaps"));
  } finally { await h.close(); }
});

test("struggling course jumps the queue with a course-prerequisite warning", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    // fail algebra checks without completing anything: algebra averages 0
    // (algebra is course code "al"; "lo" is logic)
    for (const code of ["al-1", "al-2", "al-3"]) {
      await h.failQuiz(`quiz-${code}`, u.token);
    }
    const mastery = await h.call("GET", "/api/v1/me/mastery", { token: u.token });
    assert.ok(mastery.json.struggles.courses.some(c => c.code === "algebra"));
    const rec = await h.call("GET", "/api/v1/me/recommendation", { token: u.token });
    // the struggle path: algebra's first incomplete lesson, with a warning
    // that its foundation (Foundation Mathematics) is untouched
    assert.equal(rec.json.lesson.course.title, "Algebra Essentials");
    assert.ok(rec.json.reasons.some(r => r.factor === "struggle"));
    const warning = rec.json.warnings.find(w => w.type === "course-prerequisite");
    assert.ok(warning, "course prerequisite warning expected");
    assert.equal(warning.missing.code, "fm");
    assert.equal(warning.missing.lessonsDone, 0);
    assert.ok(warning.text.includes("essential foundation"));
  } finally { await h.close(); }
});

test("mastery views reflect recorded attempts only", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    await h.passQuiz("quiz-fm-1", u.token);   // 100
    const m = await h.call("GET", "/api/v1/me/mastery", { token: u.token });
    const fm = m.json.subjects.find(s => s.key === "mathematics");
    assert.equal(fm.attempts, 1);
    assert.equal(fm.avgScore, 100);
    assert.equal(m.json.struggles.subjects.length, 0);
    await h.failQuiz("quiz-fm-2", u.token);   // 0 → mathematics average 50
    const m2 = await h.call("GET", "/api/v1/me/mastery", { token: u.token });
    const fm2 = m2.json.subjects.find(s => s.key === "mathematics");
    assert.equal(fm2.avgScore, 50);
    assert.ok(m2.json.struggles.subjects.some(s => s.key === "mathematics"));
  } finally { await h.close(); }
});

test("completing everything ends with a completion recommendation", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    // complete every lesson through the real API (quiz → complete)
    // every published lesson, in curriculum order (the tree is the source of truth)
    const tree = (await h.call("GET", "/api/v1/curriculum/tree", { token: u.token })).json.tree;
    const codes = [];
    for (const stage of tree) for (const course of stage.courses)
      for (const mod of course.modules) for (const ch of mod.chapters)
        for (const l of ch.lessons) codes.push(l.code);
    assert.equal(codes.length, 34);
    for (const code of codes) {
      const lesson = await h.call("GET", `/api/v1/catalog/lessons/${code}`, { token: u.token });
      if (lesson.status !== 200) continue;               // only seeded/published lessons
      if (lesson.json.lesson.quiz) {
        await h.passQuiz(`quiz-${code}`, u.token);
      }
      await h.call("POST", `/api/v1/me/progress/lessons/${lesson.json.lesson.id}/complete`, { token: u.token, body: {} });
    }
    const rec = await h.call("GET", "/api/v1/me/recommendation", { token: u.token });
    assert.equal(rec.json.lessonsDone, rec.json.lessonsTotal);
    assert.equal(rec.json.lesson, null);
    assert.ok(rec.json.reasons.some(r => r.factor === "complete"));
  } finally { await h.close(); }
});
