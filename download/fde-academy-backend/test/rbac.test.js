// test/rbac.test.js — role-based access control: students are locked out of
// admin surfaces; suspended accounts lose access; anonymous users get 401.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("students cannot reach admin endpoints (403), authors cannot administer users", async () => {
  const h = await setup();
  try {
    const student = await h.loginDemo("student");
    const author = await h.loginDemo("author");
    const endpoints = [
      ["GET", "/api/v1/admin/analytics/overview"],
      ["GET", "/api/v1/admin/analytics/content-health"],
      ["GET", "/api/v1/admin/users"],
      ["GET", "/api/v1/admin/downloads"],
    ];
    for (const [method, path] of endpoints) {
      const r = await h.call(method, path, { token: student.token });
      assert.equal(r.status, 403, `${path} must be admin-only`);
      const a = await h.call(method, path, { token: author.token });
      assert.equal(a.status, 403, `${path} must be admin-only (authors too)`);
    }
  } finally { await h.close(); }
});

test("anonymous requests to protected routes get 401, not 403 (no role leak)", async () => {
  const h = await setup();
  try {
    const r = await h.call("GET", "/api/v1/admin/users");
    assert.equal(r.status, 401);
    const r2 = await h.call("GET", "/api/v1/me/progress");
    assert.equal(r2.status, 401);
  } finally { await h.close(); }
});

test("public catalog content works anonymously; drafts stay invisible", async () => {
  const h = await setup();
  try {
    const courses = await h.call("GET", "/api/v1/catalog/courses");
    assert.equal(courses.status, 200);
    assert.equal(courses.json.courses.length, 8);
    const lesson = await h.call("GET", "/api/v1/catalog/lessons/fm-1");
    assert.equal(lesson.status, 200);
    assert.equal(lesson.json.lesson.state.completed, false);
  } finally { await h.close(); }
});

test("suspended users lose access immediately and refresh tokens are revoked", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const u = await h.registerUser();
    const suspend = await h.call("PUT", `/api/v1/admin/users/${u.id}/status`, {
      token: admin.token, body: { status: "suspended" } });
    assert.equal(suspend.status, 200);
    const me = await h.call("GET", "/api/v1/auth/me", { token: u.token });
    assert.equal(me.status, 403);
    const refresh = await h.call("POST", "/api/v1/auth/refresh", { body: { refreshToken: u.refresh } });
    assert.equal(refresh.status, 401);
    // admin cannot suspend themselves (guard against lockout):
    const self = await h.call("PUT", `/api/v1/admin/users/${admin.id}/status`, {
      token: admin.token, body: { status: "suspended" } });
    assert.equal(self.status, 400);
  } finally { await h.close(); }
});

test("admin endpoints work for the admin role", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const overview = await h.call("GET", "/api/v1/admin/analytics/overview", { token: admin.token });
    assert.equal(overview.status, 200);
    assert.equal(overview.json.users.total, 3); // 3 demo users, fresh instance per test
    const users = await h.call("GET", "/api/v1/admin/users?role=student", { token: admin.token });
    assert.equal(users.status, 200);
    assert.ok(users.json.users.every(x => x.role === "student"));
  } finally { await h.close(); }
});
