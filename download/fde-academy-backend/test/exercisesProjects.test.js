// test/exercisesProjects.test.js — gated hints/solutions, lab submissions,
// project submission gates, rubric evaluation, and my-submissions views.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("hints and solutions are gated behind a real attempt", async () => {
  const h = await setup();
  try {
    const u = await h.registerUser();
    // before any submission:
    const hints = await h.call("GET", "/api/v1/exercises/coding/code-c1/hints", { token: u.token });
    assert.equal(hints.status, 403);
    assert.ok(hints.json.error.message.includes("attempt"));
    const sol = await h.call("GET", "/api/v1/exercises/coding/code-c1/solution", { token: u.token });
    assert.equal(sol.status, 403);
    // exercise detail never contains the solution or hints:
    const detail = await h.call("GET", "/api/v1/exercises/coding/code-c1", { token: u.token });
    assert.ok(!JSON.stringify(detail.json).includes("or divide by 2"));
    assert.ok(detail.json.exercise.starterCode.includes("Predict"));
    // after a submission, both unlock:
    await h.call("POST", "/api/v1/exercises/coding/code-c1/submissions", {
      token: u.token, body: { code: "let total = 0;" } });
    const hints2 = await h.call("GET", "/api/v1/exercises/coding/code-c1/hints", { token: u.token });
    assert.equal(hints2.status, 200);
    assert.equal(hints2.json.hints.length, 1);
    const sol2 = await h.call("GET", "/api/v1/exercises/coding/code-c1/solution", { token: u.token });
    assert.equal(sol2.status, 200);
    assert.ok(sol2.json.solution.includes("/ 2"));
  } finally { await h.close(); }
});

test("math exercises are served with prompts (no solution inline)", async () => {
  const h = await setup();
  try {
    const list = await h.call("GET", "/api/v1/exercises?kind=math");
    assert.equal(list.json.math.length, 3);
    const one = await h.call("GET", "/api/v1/exercises/math/maths-percent");
    assert.equal(one.status, 200);
    assert.ok(one.json.exercise.prompt.includes("30% off"));
    assert.ok(!JSON.stringify(one.json).includes("checkNote"));
  } finally { await h.close(); }
});

test("project submission is gated by the checklist and evidence, then rubric-evaluated", async () => {
  const h = await setup();
  try {
    const student = await h.registerUser();
    const admin = await h.loginDemo("admin");
    const project = await h.call("GET", "/api/v1/projects/p1-1", { token: student.token });
    assert.equal(project.json.project.demoChecklist.length, 4);
    assert.equal(project.json.project.level, 1);
    // incomplete checklist:
    const gate = await h.call("POST", "/api/v1/projects/p1-1/submissions", {
      token: student.token, body: { evidence: "A spreadsheet with break-even formulas".repeat(2),
        checklist: [true, false, false, false] } });
    assert.equal(gate.status, 422);
    assert.ok(gate.json.error.details.some(d => d.message.includes("not yet demonstrated")));
    // thin evidence:
    const thin = await h.call("POST", "/api/v1/projects/p1-1/submissions", {
      token: student.token, body: { evidence: "short", checklist: [true, true, true, true] } });
    assert.equal(thin.status, 422);
    // valid:
    const ok = await h.call("POST", "/api/v1/projects/p1-1/submissions", {
      token: student.token, body: { evidence: "Spreadsheet with formulas recomputed by hand; audit note attached.",
        checklist: [true, true, true, true] } });
    assert.equal(ok.status, 201);
    // duplicate:
    const dup = await h.call("POST", "/api/v1/projects/p1-1/submissions", {
      token: student.token, body: { evidence: "again again again again again again", checklist: [true, true, true, true] } });
    assert.equal(dup.status, 409);
    // rubric evaluation by admin: pass at 16/24 with no dimension below 2:
    const evalr = await h.call("POST", `/api/v1/admin/project-submissions/${ok.json.submissionId}/evaluate`, {
      token: admin.token, body: { understanding: 4, correctness: 4, craft: 3, safety: 2, operation: 3, communication: 4,
        feedback: "Solid assumptions table." } });
    assert.equal(evalr.status, 200);
    assert.equal(evalr.json.total, 20);
    assert.equal(evalr.json.passed, true);
    // the student sees the graded result:
    const mine = await h.call("GET", "/api/v1/projects/submissions/mine", { token: student.token });
    assert.equal(mine.json.submissions.length, 1);
    assert.equal(mine.json.submissions[0].rubricTotal, 20);
    assert.equal(mine.json.submissions[0].rubricPassed, true);
    // students cannot evaluate:
    const nope = await h.call("POST", `/api/v1/admin/project-submissions/${ok.json.submissionId}/evaluate`, {
      token: student.token, body: { understanding: 4, correctness: 4, craft: 4, safety: 4, operation: 4, communication: 4 } });
    assert.equal(nope.status, 403);
  } finally { await h.close(); }
});

test("catalog serves the full structure: modules -> chapters -> lessons", async () => {
  const h = await setup();
  try {
    const r = await h.call("GET", "/api/v1/catalog/courses/fm");
    assert.equal(r.status, 200);
    assert.equal(r.json.modules.length, 2);
    assert.equal(r.json.modules[0].chapters.length, 1);
    assert.equal(r.json.lessons.length, 6);
    assert.equal(r.json.topicTest.code, "tt-fm");
    const stage = await h.call("GET", "/api/v1/catalog/stages/2");
    assert.equal(stage.status, 200);
    const stages = await h.call("GET", "/api/v1/catalog/stages");
    assert.equal(stages.json.stages.length, 18);
  } finally { await h.close(); }
});
