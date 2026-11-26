// test/cms.test.js — the content-management system end-to-end: create the
// full hierarchy, author lessons + quizzes with feedback, upload diagrams and
// books, publish/unpublish, revisions + restore, and permission walls.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";
import crypto from "node:crypto";

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  crypto.randomBytes(256),
]);

test("full authoring flow: subject → course → module → chapter → lesson → publish", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();

    // subject
    const sub = await h.call("POST", "/api/v1/admin/cms/subjects", { token: admin.token, body: { key: "statistics", name: "Statistics" } });
    assert.equal(sub.status, 201);
    const dup = await h.call("POST", "/api/v1/admin/cms/subjects", { token: admin.token, body: { key: "statistics", name: "Statistics" } });
    assert.equal(dup.status, 409);

    // course (draft)
    const stage = (await h.call("GET", "/api/v1/catalog/stages/2")).json;
    const course = await h.call("POST", "/api/v1/admin/cms/courses", {
      token: admin.token, body: { code: "stats-1", title: "Statistics for Business",
        subjectId: sub.json.id, stageId: stage.id, difficulty: "Beginner",
        blurb: "Descriptive statistics through market data.", objectives: ["Read a data table", "Compute an average"] } });
    assert.equal(course.status, 201);
    // drafts are invisible to students:
    assert.equal((await h.call("GET", "/api/v1/catalog/courses/stats-1", { token: student.token })).status, 404);

    // module → chapter → lesson
    const mod = await h.call("POST", `/api/v1/admin/cms/courses/${course.json.id}/modules`, {
      token: admin.token, body: { title: "1. Describing data" } });
    assert.equal(mod.status, 201);
    const ch = await h.call("POST", `/api/v1/admin/cms/modules/${mod.json.id}/chapters`, {
      token: admin.token, body: { title: "Averages" } });
    assert.equal(ch.status, 201);
    const lesson = await h.call("POST", `/api/v1/admin/cms/chapters/${ch.json.id}/lessons`, {
      token: admin.token, body: { code: "stats-1", title: "Means and medians", minutes: 25,
        objectives: ["Mean is the fair share", "Median resists outliers"],
        content: [{ t: "p", x: "Averages answer: what is one number that represents the whole batch?" },
                  { t: "exercise", prompt: "Stall takes £12 from 4 sales. Fair share per sale?", solution: "12 ÷ 4 = £3." }],
        status: "draft" } });
    assert.equal(lesson.status, 201);
    // invalid blocks are rejected:
    const badBlocks = await h.call("POST", `/api/v1/admin/cms/chapters/${ch.json.id}/lessons`, {
      token: admin.token, body: { code: "stats-2", title: "Broken", minutes: 10,
        objectives: [], content: [{ t: "nope", x: "?" }], status: "draft" } });
    assert.equal(badBlocks.status, 422);

    // publish the course and lesson, students see them:
    await h.call("PUT", `/api/v1/admin/cms/courses/${course.json.id}`, {
      token: admin.token, body: { title: "Statistics for Business", blurb: "Descriptive statistics through market data.",
        objectives: ["Read a data table"], status: "published" } });
    await h.call("POST", `/api/v1/admin/cms/lessons/${lesson.json.id}/publish`, { token: admin.token, body: {} });
    const visible = await h.call("GET", "/api/v1/catalog/lessons/stats-1", { token: student.token });
    assert.equal(visible.status, 200);
    assert.equal(visible.json.lesson.status, "published");
    // unpublish makes it vanish again:
    await h.call("POST", `/api/v1/admin/cms/lessons/${lesson.json.id}/unpublish`, { token: admin.token, body: {} });
    assert.equal((await h.call("GET", "/api/v1/catalog/lessons/stats-1", { token: student.token })).status, 404);
    await h.call("POST", `/api/v1/admin/cms/lessons/${lesson.json.id}/publish`, { token: admin.token, body: {} });
  } finally { await h.close(); }
});

test("lesson edits are versioned, snapshotted and restorable", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    // edit a seeded lesson twice
    const lesson = (await h.call("GET", "/api/v1/catalog/lessons/fm-2", { token: admin.token })).json.lesson;
    const v0 = lesson.version;
    await h.call("PUT", `/api/v1/admin/cms/lessons/${lesson.id}`, {
      token: admin.token, body: { title: lesson.title, minutes: lesson.minutes,
        objectives: lesson.objectives, content: [{ t: "p", x: "First revision content." }], status: "published" } });
    const v1 = (await h.call("GET", "/api/v1/catalog/lessons/fm-2", { token: admin.token })).json.lesson;
    assert.equal(v1.version, v0 + 1);
    assert.equal(v1.content[0].x, "First revision content.");
    await h.call("PUT", `/api/v1/admin/cms/lessons/${lesson.id}`, {
      token: admin.token, body: { title: lesson.title, minutes: lesson.minutes,
        objectives: lesson.objectives, content: [{ t: "p", x: "Second revision content." }], status: "published" } });
    const revs = await h.call("GET", `/api/v1/admin/cms/revisions/lesson/${lesson.id}`, { token: admin.token });
    assert.ok(revs.json.revisions.length >= 2);
    // restore the FIRST pre-edit snapshot (original lesson content)
    const original = revs.json.revisions[revs.json.revisions.length - 1];
    const restore = await h.call("POST", `/api/v1/admin/cms/lessons/${lesson.id}/restore/${original.version}`, {
      token: admin.token, body: {} });
    assert.equal(restore.status, 200);
    const after = (await h.call("GET", "/api/v1/catalog/lessons/fm-2", { token: admin.token })).json.lesson;
    assert.equal(after.version, v0 + 3);
    assert.notEqual(after.content[0].x, "Second revision content.");
  } finally { await h.close(); }
});

test("quiz authoring with feedback data flows into the learning engine", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();
    const lesson = (await h.call("GET", "/api/v1/catalog/lessons/fm-5", { token: admin.token })).json.lesson;
    const quiz = await h.call("POST", `/api/v1/admin/cms/lessons/${lesson.id}/quiz`, {
      token: admin.token, body: { title: "Authored check — order of operations", passPct: 70,
        questions: [{
          prompt: "What does 2 + 3 × 4 equal?",
          options: ["20", "14", "24", "9"], answerIdx: 1,
          explanation: "Multiplication binds before addition: 3 × 4 = 12, then 2 + 12 = 14.",
          optionNotes: [null, null, "24 adds everything left to right. Multiplication binds first.", "9 multiplies the wrong pair."],
          simplerExample: "Simpler: 1 + 2 × 3 → 1 + 6 = 7, not 9.",
          nextChallenge: "Next challenge: write your own three-step money calculation.",
        }] } });
    assert.equal(quiz.status, 201);
    // students get the new check (with answers withheld) — its code may be
    // versioned (quiz-fm-5-v2) because the archived original keeps the code:
    const check = await h.call("GET", "/api/v1/lessons/fm-5/check", { token: student.token });
    assert.ok(check.json.quiz.code.startsWith("quiz-fm-5"));
    const qs = (await h.call("GET", `/api/v1/assessments/quizzes/${check.json.quiz.code}`, { token: student.token })).json.questions;
    assert.equal(qs[0].prompt, "What does 2 + 3 × 4 equal?");
    // wrong answer → the authored feedback trio
    const r = await h.call("POST", "/api/v1/lessons/fm-5/check", {
      token: student.token, body: { answers: [{ questionId: qs[0].id, optionId: qs[0].options[2].id }] } });
    const fb = r.json.feedback[0];
    assert.equal(fb.outcome, "incorrect");
    assert.ok(fb.whyIncorrect.includes("left to right"));       // authored note
    assert.equal(fb.simplerExample, "Simpler: 1 + 2 × 3 → 1 + 6 = 7, not 9.");
    assert.equal(fb.lesson.code, "fm-5");
    // correct answer → authored next challenge
    const ok = await h.call("POST", "/api/v1/lessons/fm-5/check", {
      token: student.token, body: { answers: [{ questionId: qs[0].id, optionId: qs[0].options[1].id }] } });
    assert.equal(ok.json.feedback[0].outcome, "correct");
    assert.equal(ok.json.feedback[0].nextChallenge, "Next challenge: write your own three-step money calculation.");
    // the database integrity trigger: exactly one correct option enforced
    await assert.rejects(async () => {
      await h.db.transaction(async tx => {
        const qid = qs[0].id;
        await tx.query(`INSERT INTO question_options (question_id, position, text, is_correct) VALUES ($1, 9, 'another', false)`, [qid]);
        await tx.query(`UPDATE question_options SET is_correct = true WHERE question_id = $1 AND position = 3`, [qid]);
      });
    }, /exactly one correct/);
  } finally { await h.close(); }
});

test("diagram uploads are public assets; book uploads stay private", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();
    const lesson = (await h.call("GET", "/api/v1/catalog/lessons/fm-3", { token: admin.token })).json.lesson;
    // diagram (public): raw octet-stream upload
    const up = await fetch(h.base + `/api/v1/admin/cms/uploads?kind=diagram&filename=diagram.png&lessonId=${lesson.id}`, {
      method: "POST", headers: { authorization: "Bearer " + admin.token }, body: PNG_BYTES });
    const uploaded = await up.json();
    assert.equal(up.status, 201);
    assert.equal(uploaded.visibility, "public");
    assert.ok(uploaded.url.startsWith("/api/v1/content/assets/"));
    // anonymous users can fetch the public asset:
    const asset = await fetch(h.base + uploaded.url);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("content-type"), "image/png");
    assert.equal(asset.headers.get("x-content-type-options"), "nosniff");
    const bytes = Buffer.from(await asset.arrayBuffer());
    assert.equal(bytes.length, PNG_BYTES.length);
    // rejected: non-image diagram
    const bad = await fetch(h.base + `/api/v1/admin/cms/uploads?kind=diagram&filename=notes.txt&lessonId=${lesson.id}`, {
      method: "POST", headers: { authorization: "Bearer " + admin.token }, body: Buffer.from("plain text") });
    assert.equal(bad.status, 400);
    // book upload (private DOCX) + book registration + download flow
    const docx = Buffer.concat([Buffer.from("PK\x03\x04"), crypto.randomBytes(512)]);
    const upBook = await fetch(h.base + "/api/v1/admin/cms/uploads?kind=book&filename=handbook.docx", {
      method: "POST", headers: { authorization: "Bearer " + admin.token }, body: docx });
    const bookFile = await upBook.json();
    assert.equal(upBook.status, 201);
    assert.equal(bookFile.visibility, "private");
    const book = await h.call("POST", "/api/v1/admin/cms/books", {
      token: admin.token, body: { slug: "stats-handbook", title: "Statistics Handbook", subject: "Mathematics",
        difficulty: "Beginner", description: "Print companion for the statistics course.",
        objectives: ["Fair shares"], fileId: bookFile.id } });
    assert.equal(book.status, 201);
    await h.call("POST", `/api/v1/admin/cms/books/${book.json.id}/publish`, { token: admin.token, body: {} });
    // students download through the signed token flow, never a storage path:
    const issue = await h.call("POST", "/api/v1/books/stats-handbook/downloads", { token: student.token, body: {} });
    assert.equal(issue.status, 201);
    const dl = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + student.token } });
    assert.equal(dl.status, 200);
    const got = Buffer.from(await dl.arrayBuffer());
    assert.equal(got.length, docx.length);
    assert.ok(!JSON.stringify(issue.json).includes("storage"));
  } finally { await h.close(); }
});

test("print editions (DOCX/PDF) attach to an existing book and download", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();
    const detail = (await h.call("GET", "/api/v1/books/fm", { token: student.token })).json;
    const book = detail.book;                  // {id, slug, …}
    const before = detail.editions.length;     // editions live at the top level
    for (const [name, format] of [["textbook.docx", "docx"], ["textbook.pdf", "pdf"]]) {
      const up = await fetch(h.base + `/api/v1/admin/cms/uploads?kind=book&filename=${name}`, {
        method: "POST", headers: { authorization: "Bearer " + admin.token },
        body: Buffer.concat([Buffer.from("PK\x03\x04"), Buffer.from(name)]) });
      const f = await up.json();
      assert.equal(up.status, 201);
      const ed = await h.call("POST", `/api/v1/admin/cms/books/${book.id}/editions`, {
        token: admin.token, body: { version: "1.0.0", format, fileId: f.id, notes: "print edition" } });
      assert.equal(ed.status, 201);
    }
    const after = (await h.call("GET", "/api/v1/books/fm", { token: student.token })).json;
    assert.equal(after.editions.length, before + 2);
    const formats = after.editions.map(e => e.format).sort();
    assert.ok(formats.includes("docx") && formats.includes("pdf"));
    // student downloads the print PDF through the token flow
    const issue = await h.call("POST", "/api/v1/books/fm/downloads", { token: student.token, body: {} });
    assert.equal(issue.status, 201);
    const dl = await fetch(h.base + issue.json.downloadUrl, { headers: { authorization: "Bearer " + student.token } });
    assert.equal(dl.status, 200);
  } finally { await h.close(); }
});

test("exercises can be authored via the CMS", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();
    const coding = await h.call("POST", "/api/v1/admin/cms/exercises/coding", {
      token: admin.token, body: { code: "code-c9", title: "Median of sales", language: "JavaScript",
        instructions: "Write a function returning the median of a numeric array.",
        starterCode: "function median(values) {\n  // sort, then pick the middle\n}", minutes: 25,
        hints: ["Sort first.", "Even length: average the two middle values."],
        solution: "values.sort((a,b)=>a-b); const m = values.length>>1; return values.length%2 ? values[m] : (values[m-1]+values[m])/2;" } });
    assert.equal(coding.status, 201);
    const math = await h.call("POST", "/api/v1/admin/cms/exercises/math", {
      token: admin.token, body: { code: "maths-median", title: "Median drill", minutes: 10,
        prompt: "Find the median of 3, 9, 5, 1.", solution: "Sorted: 1, 3, 5, 9 → (3+5)/2 = 4." } });
    assert.equal(math.status, 201);
    const list = await h.call("GET", "/api/v1/exercises", { token: student.token });
    assert.ok(list.json.coding.some(x => x.code === "code-c9"));
    assert.ok(list.json.math.some(x => x.code === "maths-median"));
    // gated hints work on the new exercise after a submission:
    await h.call("POST", "/api/v1/exercises/coding/code-c9/submissions", { token: student.token, body: { code: "function median(v){return 0}" } });
    const hints = await h.call("GET", "/api/v1/exercises/coding/code-c9/hints", { token: student.token });
    assert.equal(hints.json.hints.length, 2);
  } finally { await h.close(); }
});

test("CMS is admin-only; students and authors are walled out", async () => {
  const h = await setup();
  try {
    const student = await h.registerUser();
    const author = await h.loginDemo("author");
    for (const token of [student.token, author.token]) {
      assert.equal((await h.call("POST", "/api/v1/admin/cms/subjects", { token, body: { key: "x", name: "X" } })).status, 403);
      assert.equal((await h.call("GET", "/api/v1/admin/cms/revisions/lesson/00000000-0000-0000-0000-000000000000", { token })).status, 403);
    }
    // the admin console page itself is served publicly (login happens client-side):
    const page = await h.call("GET", "/admin");
    assert.equal(page.status, 200);
    assert.ok(page.text.includes("Admin CMS"));
  } finally { await h.close(); }
});
