// test/curriculum.test.js — the unified curriculum tree: structure,
// mathematics-first ordering, per-lesson quiz links, per-user state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("the tree exposes the full structure with mathematics ordered first", async () => {
  const h = await setup();
  try {
    const r = await h.call("GET", "/api/v1/curriculum/tree");
    assert.equal(r.status, 200);
    const tree = r.json.tree;
    assert.equal(tree.length, 18);
    // stage 1 = Start here, stage 2 begins the mathematics curriculum
    assert.equal(tree[0].courses.length, 1);            // the start-here course
    const stage2 = tree[1];
    assert.ok(stage2.courses.length >= 1);
    assert.equal(stage2.courses[0].code, "fm");         // mathematics pinned first
    assert.equal(stage2.courses[0].subject, "mathematics");
    // every course carries modules → chapters → lessons with quiz links
    let lessons = 0;
    for (const stage of tree) for (const course of stage.courses) {
      assert.ok(course.modules.length >= 1, "courses have modules");
      for (const mod of course.modules) {
        assert.ok(mod.chapters.length >= 1, "modules have chapters");
        for (const ch of mod.chapters) for (const l of ch.lessons) {
          assert.ok(/^[a-z]+-\d+$/.test(l.code));
          assert.ok(l.minutes >= 1);
          if (l.quizId) assert.ok(/^[0-9a-f-]{36}$/.test(l.quizId));
          lessons++;
        }
      }
    }
    assert.equal(lessons, 34);
    // books and projects are attached to their stages
    const withBooks = tree.filter(s => s.books.length > 0);
    assert.ok(withBooks.length >= 2);
    const withProjects = tree.filter(s => s.projects.length > 0);
    assert.ok(withProjects.length >= 3);
    assert.ok(r.json.note.includes("Mathematics"));
  } finally { await h.close(); }
});

test("an authenticated learner sees their state folded into the tree", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    await h.takeQuiz("quiz-fm-1", u.token, [2, 1, 1]);
    const lesson = (await h.call("GET", "/api/v1/catalog/lessons/fm-1", { token: u.token })).json.lesson;
    await h.call("POST", `/api/v1/me/progress/lessons/${lesson.id}/complete`, { token: u.token, body: {} });
    const r = await h.call("GET", "/api/v1/curriculum/tree", { token: u.token });
    const fmLesson = r.json.tree[1].courses[0].modules[0].chapters[0].lessons[0];
    assert.equal(fmLesson.code, "fm-1");
    assert.equal(fmLesson.state.completed, true);
    assert.equal(fmLesson.state.bestScore, 100);
    // anonymous tree has no state at all:
    const anon = await h.call("GET", "/api/v1/curriculum/tree");
    assert.equal(anon.json.tree[1].courses[0].modules[0].chapters[0].lessons[0].state, undefined);
  } finally { await h.close(); }
});
