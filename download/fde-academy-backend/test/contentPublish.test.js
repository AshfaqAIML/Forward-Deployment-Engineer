// test/contentPublish.test.js — the authoring pipeline: drafts are invisible
// to students; review + publish make content live; revisions snapshot history.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("draft course is invisible to students until an admin publishes it", async () => {
  const h = await setup();
  try {
    const author = await h.loginDemo("author");
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();

    // the author proposes a new course:
    const subject = await h.db.query(`SELECT id FROM subjects WHERE key = 'mathematics'`);
    const stage = await h.db.query(`SELECT id FROM learning_stages WHERE stage_number = 2`);
    const draft = await h.call("POST", "/api/v1/author/drafts", {
      token: author.token,
      body: { entityType: "course", payload: {
        code: "stats-1", title: "Statistics for Business", subjectId: subject.rows[0].id,
        stageId: stage.rows[0].id, difficulty: "Intermediate",
        blurb: "Descriptive statistics taught through market data.", sortOrder: 50 },
        changeNote: "New Stage 2 elective" } });
    assert.equal(draft.status, 201);
    const draftId = draft.json.draftId;

    // students cannot see it (and its existence is not disclosed):
    const before = await h.call("GET", "/api/v1/catalog/courses/stats-1", { token: student.token });
    assert.equal(before.status, 404);

    // submit for review (author), review (admin), publish (admin):
    const submit = await h.call("POST", `/api/v1/author/drafts/${draftId}/submit`, { token: author.token });
    assert.equal(submit.status, 200);
    const review = await h.call("POST", `/api/v1/admin/drafts/${draftId}/review`, {
      token: admin.token, body: { verdict: "approved", comments: "Looks good" } });
    assert.equal(review.status, 200);
    const publish = await h.call("POST", `/api/v1/admin/drafts/${draftId}/publish`, { token: admin.token, body: {} });
    assert.equal(publish.status, 200);
    assert.ok(publish.json.entityId);
    assert.equal(publish.json.created, true);

    // now it is live for students:
    const after = await h.call("GET", "/api/v1/catalog/courses/stats-1", { token: student.token });
    assert.equal(after.status, 200);
    assert.equal(after.json.course.title, "Statistics for Business");
    const list = await h.call("GET", "/api/v1/catalog/courses");
    assert.equal(list.json.courses.length, 9);

    // the publish event and review trail exist:
    const events = await h.db.query(`SELECT action FROM publish_events WHERE entity_id = $1`, [publish.json.entityId]);
    assert.equal(events.rows[0].action, "publish");
    const reviews = await h.db.query(`SELECT verdict, comments FROM content_reviews WHERE draft_id = $1`, [draftId]);
    assert.equal(reviews.rows[0].verdict, "approved");
  } finally { await h.close(); }
});

test("students cannot create drafts or publish; authors cannot publish", async () => {
  const h = await setup();
  try {
    const author = await h.loginDemo("author");
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();
    const r1 = await h.call("POST", "/api/v1/author/drafts", {
      token: student.token, body: { entityType: "course", payload: { title: "x" } } });
    assert.equal(r1.status, 403);
    // author submits a draft, then tries to publish it themselves:
    const draft = await h.call("POST", "/api/v1/author/drafts", {
      token: author.token, body: { entityType: "course", payload: { code: "nope", title: "Nope" } } });
    await h.call("POST", `/api/v1/author/drafts/${draft.json.draftId}/submit`, { token: author.token });
    await h.call("POST", `/api/v1/admin/drafts/${draft.json.draftId}/review`, {
      token: admin.token, body: { verdict: "approved" } });
    const pub = await h.call("POST", `/api/v1/admin/drafts/${draft.json.draftId}/publish`, { token: author.token, body: {} });
    assert.equal(pub.status, 403);
  } finally { await h.close(); }
});

test("editing a published glossary term snapshots the previous version", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const before = await h.call("GET", "/api/v1/glossary/break-even");
    assert.equal(before.status, 200);
    const edit = await h.call("PUT", `/api/v1/admin/glossary/${before.json.term.id}`, {
      token: admin.token, body: { term: "Break-even", simple: "Sales level covering all costs",
        detailed: before.json.term.detailed, example: before.json.term.example, category: "Mathematics" } });
    assert.equal(edit.status, 200);
    const revisions = await h.db.query(
      `SELECT snapshot FROM content_revisions WHERE entity_type = 'glossary_term' AND entity_id = $1 ORDER BY version`, [before.json.term.id]);
    assert.ok(revisions.rows.length >= 1);
    assert.ok(revisions.rows[0].snapshot.term.includes("break-even point") || JSON.stringify(revisions.rows[0].snapshot).includes("money out"));
    // live glossary reflects the edit:
    const after = await h.call("GET", "/api/v1/glossary/break-even");
    assert.equal(after.json.term.simple, "Sales level covering all costs");
  } finally { await h.close(); }
});

test("lesson content drafts publish with version increment and snapshot", async () => {
  const h = await setup();
  try {
    const author = await h.loginDemo("author");
    const admin = await h.loginDemo("admin");
    const lesson = (await h.call("GET", "/api/v1/catalog/lessons/fm-1")).json.lesson;
    const draft = await h.call("POST", "/api/v1/author/drafts", {
      token: author.token,
      body: { entityType: "lesson", entityId: lesson.id, changeNote: "clarity pass",
        payload: { title: lesson.title, content: [{ t: "p", x: "Rewritten opening paragraph." }] } } });
    await h.call("POST", `/api/v1/author/drafts/${draft.json.draftId}/submit`, { token: author.token });
    await h.call("POST", `/api/v1/admin/drafts/${draft.json.draftId}/review`, { token: admin.token, body: { verdict: "approved" } });
    const pub = await h.call("POST", `/api/v1/admin/drafts/${draft.json.draftId}/publish`, { token: admin.token, body: {} });
    assert.equal(pub.status, 200);
    const updated = (await h.call("GET", "/api/v1/catalog/lessons/fm-1")).json.lesson;
    assert.equal(updated.version, 2);
    assert.equal(updated.content[0].x, "Rewritten opening paragraph.");
    const snap = await h.db.query(
      `SELECT version FROM content_revisions WHERE entity_type = 'lesson' AND entity_id = $1`, [lesson.id]);
    assert.equal(snap.rows.length, 1);
  } finally { await h.close(); }
});
