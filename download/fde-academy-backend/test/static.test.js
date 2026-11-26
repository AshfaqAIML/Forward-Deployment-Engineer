// test/static.test.js — the single-process website: GET / serves the bundled SPA.
import test from "node:test";
import assert from "node:assert/strict";
import { setup } from "./helpers.js";

test("GET / serves the bundled frontend from the backend origin", async () => {
  const ctx = await setup();
  try {
    const res = await fetch(ctx.base + "/");
    assert.equal(res.status, 200);
    assert.ok((res.headers.get("content-type") || "").includes("text/html"));
    assert.equal(res.headers.get("cache-control"), "no-cache", "SPA shell must revalidate so deploys are picked up");
    const html = await res.text();
    assert.ok(html.length > 100000, "the full SPA should be served, not a stub");
    assert.ok(html.includes("live-platform bridge"), "bridge script present");
    // structural guard: exactly ONE bridge, placed at the document end —
    // an append into an inner template literal once broke the app script.
    assert.equal(html.split("live-platform bridge").length - 1, 1, "bridge appears exactly once");
    assert.ok(html.indexOf("live-platform bridge") > html.length * 0.8, "bridge must sit at the document end, not inside an app template");
    assert.ok(html.includes("FDE Academy"), "branded page");
  } finally {
    await ctx.close();
  }
});

test("GET /api/v1/health stays JSON next to the static route", async () => {
  const ctx = await setup();
  try {
    const res = await fetch(ctx.base + "/api/v1/health");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  } finally {
    await ctx.close();
  }
});

test("download format selection: DOCX and PDF requests return distinct files", async () => {
  const ctx = await setup();
  try {
    const admin = await ctx.loginDemo("admin");
    // publish two tiny but real editions through the CMS (as an author would)
    const fakeDocx = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.alloc(64, 0x07)]);
    const fakePdf = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(64, 0x09)]);
    const up = async (buf, name) => {
      const res = await fetch(ctx.base + `/api/v1/admin/cms/uploads?kind=book&filename=${name}`, {
        method: "POST", headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/octet-stream" },
        body: buf,
      });
      const json = await res.json();
      assert.equal(res.status, 201, JSON.stringify(json));
      return json;
    };
    const up1 = await up(fakeDocx, "journey.docx");
    const up2 = await up(fakePdf, "journey.pdf");
    const book = await ctx.call("GET", "/api/v1/books/fm", { token: admin.token });
    const bookId = (book.json.book || book.json).id;
    const e1 = await ctx.call("POST", `/api/v1/admin/cms/books/${bookId}/editions`, {
      token: admin.token, body: { version: "9.9.1", format: "docx", fileId: up1.id } });
    const e2 = await ctx.call("POST", `/api/v1/admin/cms/books/${bookId}/editions`, {
      token: admin.token, body: { version: "9.9.1", format: "pdf", fileId: up2.id } });
    assert.equal(e1.status, 201, JSON.stringify(e1.json));
    assert.equal(e2.status, 201, JSON.stringify(e2.json));
    // student asks for each format explicitly
    const student = await ctx.registerUser();
    const docxIss = await ctx.call("POST", "/api/v1/books/fm/downloads", { token: student.token, body: { format: "docx" } });
    assert.equal(docxIss.status, 201, JSON.stringify(docxIss.json));
    const pdfIss = await ctx.call("POST", "/api/v1/books/fm/downloads", { token: student.token, body: { format: "pdf" } });
    assert.equal(pdfIss.status, 201, JSON.stringify(pdfIss.json));
    const d1 = await fetch(ctx.base + docxIss.json.downloadUrl, { headers: { authorization: `Bearer ${student.token}` } });
    const d2 = await fetch(ctx.base + pdfIss.json.downloadUrl, { headers: { authorization: `Bearer ${student.token}` } });
    const docx = Buffer.from(await d1.arrayBuffer());
    const pdf = Buffer.from(await d2.arrayBuffer());
    assert.equal(docx[0], 0x50); assert.equal(docx[1], 0x4b);   // PK: docx is a zip
    assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  } finally { await ctx.close(); }
});
