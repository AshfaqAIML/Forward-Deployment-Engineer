// test/searchGlossary.test.js — cross-entity search and admin glossary CRUD
// with live effect.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("search finds lessons, books, glossary terms and projects", async () => {
  const h = await setup();
  try {
    const r = await h.call("GET", "/api/v1/search?q=break-even");
    assert.equal(r.status, 200);
    const kinds = r.json.results.map(x => x.kind);
    assert.ok(kinds.includes("lesson"), "lesson hit expected");
    assert.ok(kinds.includes("glossary"), "glossary hit expected");
    assert.ok(kinds.includes("book"), "book hit expected");
    // short queries get guidance instead of a full scan:
    const short = await h.call("GET", "/api/v1/search?q=b");
    assert.equal(short.json.results.length, 0);
    assert.ok(short.json.message);
  } finally { await h.close(); }
});

test("glossary search + category filters + term lookup", async () => {
  const h = await setup();
  try {
    const r = await h.call("GET", "/api/v1/glossary?search=break-even");
    assert.equal(r.status, 200);
    assert.ok(r.json.terms.length >= 1);
    assert.equal(r.json.terms[0].key, "break-even");     // exact term ranks first
    const cats = await h.call("GET", "/api/v1/glossary");
    assert.ok(cats.json.categories.includes("Mathematics"));
    assert.ok(cats.json.categories.includes("Logic"));
    assert.ok(cats.json.terms.length >= 55);
    const one = await h.call("GET", "/api/v1/glossary/hallucination");
    assert.equal(one.status, 200);
    assert.ok(one.json.term.detailed.length > 30);
    assert.deepEqual(one.json.term.related, ["grounding", "retrieval"]);
  } finally { await h.close(); }
});

test("admin can add, edit and remove glossary terms — changes are live", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const student = await h.registerUser();
    // add:
    const add = await h.call("POST", "/api/v1/admin/glossary", {
      token: admin.token, body: { term: "Retrieval augmented generation",
        simple: "Answers grounded in retrieved sources",
        detailed: "A pattern where a model answers only from documents retrieved for the question, with citations.",
        example: "The FAQ assistant quotes policy sections.", category: "AI" } });
    assert.equal(add.status, 201);
    const key = add.json.key;
    const found = await h.call("GET", `/api/v1/glossary/${key}`, { token: student.token });
    assert.equal(found.status, 200);
    assert.equal(found.json.term.category, "AI");
    // duplicate is rejected (with a VALID payload, so it hits the conflict, not validation):
    const dup = await h.call("POST", "/api/v1/admin/glossary", {
      token: admin.token, body: { term: "Retrieval augmented generation",
        simple: "Grounded answers, submitted twice", detailed: "A duplicate submission that should hit the unique-key conflict.".repeat(1),
        example: "The FAQ assistant quotes policy.", category: "AI" } });
    assert.equal(dup.status, 409);
    // search sees it immediately:
    const search = await h.call("GET", "/api/v1/search?q=retrieval");
    assert.ok(search.json.results.some(x => x.kind === "glossary" && x.code === key));
    // edit:
    const edit = await h.call("PUT", `/api/v1/admin/glossary/${add.json.id}`, {
      token: admin.token, body: { term: "RAG", simple: "Retrieval-augmented generation (RAG)",
        detailed: found.json.term.detailed, example: found.json.term.example, category: "AI" } });
    assert.equal(edit.status, 200);
    // remove:
    const del = await h.call("DELETE", `/api/v1/admin/glossary/${add.json.id}`, { token: admin.token });
    assert.equal(del.status, 200);
    const gone = await h.call("GET", `/api/v1/glossary/${key}`);
    assert.equal(gone.status, 404);
    // students cannot manage the glossary:
    const forbidden = await h.call("POST", "/api/v1/admin/glossary", {
      token: student.token, body: { term: "X", simple: "xxx yyy", detailed: "xxx".repeat(15), example: "xxx yyy", category: "X" } });
    assert.equal(forbidden.status, 403);
  } finally { await h.close(); }
});

test("admin glossary input is validated (short fields rejected)", async () => {
  const h = await setup();
  try {
    const admin = await h.loginDemo("admin");
    const r = await h.call("POST", "/api/v1/admin/glossary", {
      token: admin.token, body: { term: "Ok", simple: "too short", detailed: "x".repeat(40), example: "an example", category: "AI" } });
    assert.equal(r.status, 422);
  } finally { await h.close(); }
});
