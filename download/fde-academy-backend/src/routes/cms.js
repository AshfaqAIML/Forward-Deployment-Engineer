// src/routes/cms.js — the content-management API (admin role; authors use the
// draft pipeline from PROMPT 9's admin.js). Covers the full hierarchy CRUD,
// lesson block editing, quiz authoring with feedback, exercises, diagram and
// book uploads, publish/unpublish, and revision history with restore.
//
// Every mutating call snapshots the previous row into content_revisions, so
// nothing is ever lost. Public assets (diagrams) are served via
// GET /api/v1/content/assets/:id — private books keep the token flow.
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { notFound, conflict, badRequest, unprocessable, payloadTooLarge } from "../errors.js";
import { requirePermission } from "../rbac.js";
import { logEvent } from "../activity.js";
import { storagePath } from "../db/index.js";
import { config } from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PUBLIC_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const BOOK_MIME = new Set(["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf"]);
const MAX_UPLOAD = 20 * 1024 * 1024;

export function registerCmsRoutes(router) {

  // The admin console: a single self-contained page served by the backend.
  // All data access goes through the authenticated API from the browser.
  router.get("/admin", async (ctx) => {
    const html = await import("node:fs/promises").then(fs =>
      fs.readFile(new URL("../../public/admin.html", import.meta.url), "utf8"));
    return html;   // router serves text/html for "<!DOCTYPE…" strings
  }, { public: true, body: false });

  /* ---------------- subjects ---------------- */
  router.post("/api/v1/admin/cms/subjects", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({ key: "string:2:40", name: "string:2:80" }, ctx.body);
    const exists = await ctx.db.query(`SELECT 1 FROM subjects WHERE key = $1`, [body.key]);
    if (exists.rows[0]) throw conflict("A subject with that key already exists");
    const r = await ctx.db.query(`INSERT INTO subjects (key, name, position) VALUES ($1,$2,
      (SELECT coalesce(max(position),0)+1 FROM subjects)) RETURNING id, key, name`, [body.key, body.name]);
    return { status: 201, body: r.rows[0] };
  });
  router.put("/api/v1/admin/cms/subjects/:id", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({ name: "string:2:80", "position?": "int:0:99" }, ctx.body);
    await snapshot(ctx, "subject", ctx.params.id);
    const r = await ctx.db.query(`UPDATE subjects SET name = $2, position = coalesce($3, position) WHERE id = $1 RETURNING id, key, name`,
      [ctx.params.id, body.name, body.position ?? null]);
    if (!r.rows[0]) throw notFound("No such subject");
    return { body: r.rows[0] };
  });

  /* ---------------- courses ---------------- */
  router.post("/api/v1/admin/cms/courses", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      code: "string:2:20", title: "string:3:120", subjectId: "uuid", stageId: "uuid",
      difficulty: "enum:Beginner,Intermediate,Advanced", "blurb?": "string:0:500",
      objectives: "array:20", "prereqNote?": "string:0:300", "sortOrder?": "int:0:99",
    }, ctx.body);
    for (const o of body.objectives || []) {
      if (typeof o !== "string" || o.length > 300) throw unprocessable("objectives must be strings (<= 300 chars)", [{ field: "objectives" }]);
    }
    const exists = await ctx.db.query(`SELECT 1 FROM courses WHERE code = $1`, [body.code]);
    if (exists.rows[0]) throw conflict("A course with that code already exists");
    const r = await ctx.db.query(`
      INSERT INTO courses (code, title, subject_id, stage_id, difficulty, blurb, objectives, prereq_note, sort_order, status)
      VALUES ($1,$2,$3,$4,$5::difficulty_level,$6,$7,$8,$9,'draft') RETURNING id, code, title, status`,
      [body.code, body.title, body.subjectId, body.stageId, body.difficulty, body.blurb ?? null,
       JSON.stringify(body.objectives || []), body.prereqNote ?? null, body.sortOrder ?? 99]);
    return { status: 201, body: r.rows[0] };
  });
  router.put("/api/v1/admin/cms/courses/:id", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      title: "string:3:120", "blurb?": "string:0:500", objectives: "array:20",
      "prereqNote?": "string:0:300", status: "enum:draft,in_review,published,archived",
    }, ctx.body);
    await snapshot(ctx, "course", ctx.params.id);
    const r = await ctx.db.query(`
      UPDATE courses SET title = $2, blurb = $3, objectives = $4, prereq_note = $5, status = $6::content_status,
        published_at = CASE WHEN $6 = 'published' THEN coalesce(published_at, now()) ELSE published_at END
      WHERE id = $1 RETURNING id, code, title, status`,
      [ctx.params.id, body.title, body.blurb ?? null, JSON.stringify(body.objectives || []), body.prereqNote ?? null, body.status]);
    if (!r.rows[0]) throw notFound("No such course");
    if (body.status === "published" || body.status === "archived") {
      await ctx.db.query(`INSERT INTO publish_events (entity_type, entity_id, action, actor_id) VALUES ('course', $1, $2, $3)`,
        [ctx.params.id, body.status === "published" ? "publish" : "archive", ctx.user.id]);
    }
    return { body: r.rows[0] };
  });

  /* ---------------- modules & chapters ---------------- */
  router.post("/api/v1/admin/cms/courses/:id/modules", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({ title: "string:3:120" }, ctx.body);
    const course = await ctx.db.query(`SELECT id FROM courses WHERE id = $1`, [ctx.params.id]);
    if (!course.rows[0]) throw notFound("No such course");
    const r = await ctx.db.query(`INSERT INTO modules (course_id, position, title) VALUES ($1,
      (SELECT coalesce(max(position),0)+1 FROM modules WHERE course_id = $1), $2) RETURNING id, title, position`,
      [ctx.params.id, body.title]);
    return { status: 201, body: r.rows[0] };
  });
  router.post("/api/v1/admin/cms/modules/:id/chapters", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({ title: "string:3:120" }, ctx.body);
    const mod = await ctx.db.query(`SELECT id FROM modules WHERE id = $1`, [ctx.params.id]);
    if (!mod.rows[0]) throw notFound("No such module");
    const r = await ctx.db.query(`INSERT INTO chapters (module_id, position, title) VALUES ($1,
      (SELECT coalesce(max(position),0)+1 FROM chapters WHERE module_id = $1), $2) RETURNING id, title, position`,
      [ctx.params.id, body.title]);
    return { status: 201, body: r.rows[0] };
  });
  router.put("/api/v1/admin/cms/chapters/:id", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({ title: "string:3:120" }, ctx.body);
    const cur = await snapshot(ctx, "chapter", ctx.params.id);
    if (!cur) throw notFound("No such chapter");
    const r = await ctx.db.query(`UPDATE chapters SET title = $2 WHERE id = $1 RETURNING id, title`, [ctx.params.id, body.title]);
    return { body: r.rows[0] };
  });

  /* ---------------- lessons (the content editor surface) ---------------- */
  router.post("/api/v1/admin/cms/chapters/:id/lessons", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      code: "string:2:20", title: "string:3:160", minutes: "int:1:600",
      objectives: "array:20", content: "array:400", status: "enum:draft,published",
    }, ctx.body);
    validateBlocks(body.content);
    const ch = await ctx.db.query(`
      SELECT ch.id, m.course_id FROM chapters ch JOIN modules m ON m.id = ch.module_id
      WHERE ch.id = $1`, [ctx.params.id]);
    const chapter = ch.rows[0];
    if (!chapter) throw notFound("No such chapter");
    const exists = await ctx.db.query(`SELECT 1 FROM lessons WHERE code = $1`, [body.code]);
    if (exists.rows[0]) throw conflict("A lesson with that code already exists");
    const stage = await ctx.db.query(`SELECT stage_id FROM courses WHERE id = $1`, [chapter.course_id]);
    const r = await ctx.db.query(`
      INSERT INTO lessons (code, course_id, chapter_id, stage_id, position, title, minutes, objectives, content, status)
      VALUES ($1,$2,$3,$4,(SELECT coalesce(max(position),0)+1 FROM lessons WHERE chapter_id = $3),$5,$6,$7,$8,$9::content_status)
      RETURNING id, code, title, status`,
      [body.code, chapter.course_id, chapter.id, stage.rows[0].stage_id, body.title, body.minutes,
       JSON.stringify(body.objectives || []), JSON.stringify(body.content || []), body.status]);
    return { status: 201, body: r.rows[0] };
  });

  router.put("/api/v1/admin/cms/lessons/:id", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      title: "string:3:160", minutes: "int:1:600", objectives: "array:20",
      content: "array:400", status: "enum:draft,in_review,published,archived",
      "position?": "int:1:99",
    }, ctx.body);
    validateBlocks(body.content);
    const cur = await snapshot(ctx, "lesson", ctx.params.id);
    if (!cur) throw notFound("No such lesson");
    const r = await ctx.db.query(`
      UPDATE lessons SET title = $2, minutes = $3, objectives = $4, content = $5, version = version + 1,
        status = $6::content_status, position = coalesce($7, position),
        published_at = CASE WHEN $6 = 'published' THEN coalesce(published_at, now()) ELSE published_at END
      WHERE id = $1 RETURNING id, code, title, version, status`,
      [ctx.params.id, body.title, body.minutes, JSON.stringify(body.objectives || []),
       JSON.stringify(body.content || []), body.status, body.position ?? null]);
    if (body.status === "published") {
      await ctx.db.query(`INSERT INTO publish_events (entity_type, entity_id, action, actor_id, version) VALUES ('lesson', $1, 'publish', $2, $3)`,
        [ctx.params.id, ctx.user.id, r.rows[0].version]);
    }
    return { body: r.rows[0] };
  });

  // Publish / unpublish without touching content.
  router.post("/api/v1/admin/cms/lessons/:id/publish", async (ctx) => {
    requirePermission(ctx, "cms:write");
    await setLessonStatus(ctx, "published");
  });
  router.post("/api/v1/admin/cms/lessons/:id/unpublish", async (ctx) => {
    requirePermission(ctx, "cms:write");
    await setLessonStatus(ctx, "draft");
  });

  // Lesson prerequisites (skip-warning source for the adaptive engine).
  router.post("/api/v1/admin/cms/lessons/:id/prerequisites", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({ prerequisiteLessonId: "uuid" }, ctx.body);
    if (body.prerequisiteLessonId === ctx.params.id) throw badRequest("A lesson cannot be its own prerequisite");
    const a = await ctx.db.query(`SELECT 1 FROM lessons WHERE id = $1`, [ctx.params.id]);
    const b = await ctx.db.query(`SELECT 1 FROM lessons WHERE id = $1`, [body.prerequisiteLessonId]);
    if (!a.rows[0] || !b.rows[0]) throw notFound("No such lesson");
    await ctx.db.query(`INSERT INTO lesson_prerequisites (lesson_id, prerequisite_lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [ctx.params.id, body.prerequisiteLessonId]);
    return { status: 201, body: { ok: true } };
  });

  /* ---------------- quizzes + feedback authoring ---------------- */
  router.post("/api/v1/admin/cms/lessons/:id/quiz", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      title: "string:3:160", passPct: "int:1:100", questions: "array:50",
    }, ctx.body);
    const lesson = await ctx.db.query(`SELECT id, title FROM lessons WHERE id = $1`, [ctx.params.id]);
    if (!lesson.rows[0]) throw notFound("No such lesson");
    if (!body.questions.length) throw unprocessable("A quiz needs at least one question", [{ field: "questions" }]);
    for (const q of body.questions) {
      if (typeof q !== "object" || q === null) throw badRequest("each question must be an object");
      if (typeof q.prompt !== "string" || q.prompt.length < 5) throw badRequest("each question needs a prompt");
      if (!Array.isArray(q.options) || q.options.length < 2) throw badRequest("each question needs >= 2 options");
      if (!Number.isInteger(q.answerIdx) || q.answerIdx < 0 || q.answerIdx >= q.options.length) throw badRequest("answerIdx out of range");
      if (typeof q.explanation !== "string" || q.explanation.length < 10) throw badRequest("each question needs an explanation (why the answer is correct)");
      for (const o of q.options) if (typeof o !== "string" || !o.trim()) throw badRequest("options must be non-empty strings");
    }
    const quiz = await ctx.db.transaction(async tx => {
      const lessonCode = (await tx.query(`SELECT code FROM lessons WHERE id = $1`, [ctx.params.id])).rows[0].code;
      // one LIVE knowledge check per lesson: archive the previous one (its
      // attempts and history stay intact), then create a fresh published quiz
      // with a collision-free code.
      await tx.query(`UPDATE quizzes SET status = 'archived', updated_at = now()
        WHERE lesson_id = $1 AND status IN ('draft', 'published')`, [ctx.params.id]);
      let code = `quiz-${lessonCode}`;
      const suffix = async () => {
        const taken = (await tx.query(`SELECT 1 FROM quizzes WHERE code = $1`, [code])).rows[0];
        if (!taken) return code;
        for (let n = 2; n < 100; n++) {
          const candidate = `quiz-${lessonCode}-v${n}`;
          if (!(await tx.query(`SELECT 1 FROM quizzes WHERE code = $1`, [candidate])).rows[0]) return candidate;
        }
        return `quiz-${lessonCode}-${Date.now() % 100000}`;
      };
      code = await suffix();
      const qz = (await tx.query(`INSERT INTO quizzes (code, kind, lesson_id, title, pass_pct, status)
        VALUES ($1,'lesson_check',$2,$3,$4,'published') RETURNING id, code`, [code, ctx.params.id, body.title, body.passPct])).rows[0];
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i];
        const questionId = (await tx.query(`INSERT INTO questions (quiz_id, position, prompt, explanation) VALUES ($1,$2,$3,$4) RETURNING id`,
          [qz.id, i + 1, q.prompt, q.explanation])).rows[0].id;
        for (let j = 0; j < q.options.length; j++) {
          const optId = (await tx.query(`INSERT INTO question_options (question_id, position, text, is_correct) VALUES ($1,$2,$3,$4) RETURNING id`,
            [questionId, j + 1, q.options[j], j === q.answerIdx])).rows[0].id;
          if (q.optionNotes && q.optionNotes[j] && j !== q.answerIdx) {
            await tx.query(`INSERT INTO option_feedback (option_id, misconception_note) VALUES ($1,$2)`, [optId, q.optionNotes[j]]);
          }
        }
        if (q.simplerExample || q.nextChallenge) {
          await tx.query(`INSERT INTO question_feedback (question_id, simpler_example, next_challenge) VALUES ($1,$2,$3)`,
            [questionId, q.simplerExample || `Reread this lesson and redo its worked example before trying again.`, q.nextChallenge || "Next challenge: continue with the following lesson."]);
        }
      }
      return qz;
    });
    return { status: 201, body: quiz };
  });

  /* ---------------- exercises (code + math) ---------------- */
  router.post("/api/v1/admin/cms/exercises/coding", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      code: "string:2:20", title: "string:3:120", language: "enum:JavaScript,SQL,HTTP,Python-guided",
      instructions: "string:10:4000", starterCode: "string:1:8000", minutes: "int:5:120",
      "linkedLessonId?": "uuid", "hints?": "array:5", "solution?": "string:10:8000",
    }, ctx.body);
    const exists = await ctx.db.query(`SELECT 1 FROM coding_exercises WHERE code = $1`, [body.code]);
    if (exists.rows[0]) throw conflict("An exercise with that code already exists");
    const ex = (await ctx.db.query(`INSERT INTO coding_exercises (code, title, language, instructions, starter_code, minutes, linked_lesson_id, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'published') RETURNING id, code`, 
      [body.code, body.title, body.language, body.instructions, body.starterCode, body.minutes, body.linkedLessonId ?? null])).rows[0];
    for (let i = 0; i < (body.hints || []).length; i++) {
      await ctx.db.query(`INSERT INTO exercise_hints (owner_type, owner_id, position, content) VALUES ('coding_exercise',$1,$2,$3)`,
        [ex.id, i + 1, body.hints[i]]);
    }
    if (body.solution) {
      await ctx.db.query(`INSERT INTO exercise_solutions (owner_type, owner_id, content, status) VALUES ('coding_exercise',$1,$2,'published')`,
        [ex.id, body.solution]);
    }
    return { status: 201, body: ex };
  });
  router.post("/api/v1/admin/cms/exercises/math", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      code: "string:2:20", title: "string:3:120", prompt: "string:10:4000",
      minutes: "int:5:120", "linkedLessonId?": "uuid", "config?": "object", "solution?": "string:10:4000",
    }, ctx.body);
    const exists = await ctx.db.query(`SELECT 1 FROM math_exercises WHERE code = $1`, [body.code]);
    if (exists.rows[0]) throw conflict("An exercise with that code already exists");
    const ex = (await ctx.db.query(`INSERT INTO math_exercises (code, title, prompt, config, minutes, linked_lesson_id, status)
      VALUES ($1,$2,$3,$4,$5,$6,'published') RETURNING id, code`,
      [body.code, body.title, body.prompt, JSON.stringify(body.config || {}), body.minutes, body.linkedLessonId ?? null])).rows[0];
    if (body.solution) {
      await ctx.db.query(`INSERT INTO exercise_solutions (owner_type, owner_id, content, status) VALUES ('math_exercise',$1,$2,'published')`,
        [ex.id, body.solution]);
    }
    return { status: 201, body: ex };
  });

  /* ---------------- uploads: diagrams (public) and books (private) ---------------- */
  // Raw-body upload (application/octet-stream) with filename + kind in query:
  //   POST /api/v1/admin/cms/uploads?kind=diagram&filename=x.png&lessonId=<uuid>
  //   POST /api/v1/admin/cms/uploads?kind=book&filename=x.docx&bookId=<uuid>
  // (name written in Content-Disposition by the client; here we keep query
  //  params because octet-stream uploads carry no JSON metadata.)
  router.post("/api/v1/admin/cms/uploads", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const isDiagram = ctx.query.kind === "diagram";
    const kind = ctx.query.kind === "book" ? "book" : isDiagram ? "resource" : null;
    if (!kind) throw badRequest("kind must be diagram or book");
    const filename = String(ctx.query.filename || "").replace(/[^\w.\-]/g, "_");
    if (!filename || filename.length > 120) throw badRequest("filename is required");
    const lessonId = ctx.query.lessonId || null;
    const bookId = ctx.query.bookId || null;
    if (isDiagram && !lessonId) throw badRequest("diagram uploads need lessonId");
    // book uploads may arrive before the book row exists: the registration
    // endpoint attaches the file to its book/edition afterwards.
    if (lessonId && !/^[0-9a-f-]{36}$/i.test(lessonId)) throw badRequest("lessonId must be a UUID");
    if (bookId && !/^[0-9a-f-]{36}$/i.test(bookId)) throw badRequest("bookId must be a UUID");

    const chunks = [];
    let received = 0;
    for await (const chunk of ctx.req) {
      received += chunk.length;
      if (received > MAX_UPLOAD) throw payloadTooLarge("Uploads are capped at 20 MB");
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    if (!bytes.length) throw badRequest("Empty upload");
    const mime = sniffMime(bytes, filename);
    if (isDiagram && !PUBLIC_MIME.has(mime)) {
      throw badRequest("Diagrams must be PNG, JPEG, WebP or SVG");
    }
    if (!isDiagram && !BOOK_MIME.has(mime)) {
      throw badRequest("Books must be DOC, DOCX or PDF");
    }
    const checksum = crypto.createHash("sha256").update(bytes).digest("hex");
    const storageKey = `${kind === "book" ? "books" : "assets"}/${crypto.randomUUID()}.${filename}`;
    await fs.mkdir(path.dirname(storagePath(config, storageKey)), { recursive: true });
    await fs.writeFile(storagePath(config, storageKey), bytes);

    // A book file uploaded before its book row exists lands as a PRIVATE
    // 'resource' file; book registration then attaches it as the edition
    // (kind 'edition', book_id + edition_id set) — satisfying files_check.
    const fileKind = isDiagram ? "resource" : (bookId ? "book" : "resource");
    const file = (await ctx.db.query(`
      INSERT INTO files (book_id, lesson_id, kind, storage_key, original_filename, mime_type, bytes, checksum_sha256, visibility, uploaded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, original_filename, mime_type, bytes, checksum_sha256, visibility`,
      [bookId, lessonId, fileKind, storageKey, filename, mime,
       bytes.length, checksum, isDiagram ? "public" : "private", ctx.user.id])).rows[0];
    await logEvent(ctx.db, ctx.user.id, "upload", "file", file.id, { kind, filename });
    // diagrams get a stable public URL the lesson blocks can reference
    return { status: 201, body: { ...file,
      url: isDiagram ? `/api/v1/content/assets/${file.id}` : null,
      downloadUrl: kind === "book" ? `/api/v1/books/${bookId}/downloads` : null } };
  }, { body: false });

  // Public asset serving (diagrams). SVG gets a strict CSP so uploaded markup
  // cannot execute; everything gets nosniff.
  router.get("/api/v1/content/assets/:id", async (ctx) => {
    if (!/^[0-9a-f-]{36}$/i.test(ctx.params.id)) throw notFound("No such asset");
    const r = await ctx.db.query(
      `SELECT storage_key, mime_type, bytes, checksum_sha256, original_filename FROM files WHERE id = $1 AND visibility = 'public'`,
      [ctx.params.id]);
    const file = r.rows[0];
    if (!file) throw notFound("No such asset");
    let data;
    try { data = await fs.readFile(storagePath(config, file.storage_key)); }
    catch { throw notFound("Asset could not be read from storage"); }
    const headers = {
      "Content-Type": file.mime_type,
      "Content-Length": data.length,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    };
    if (file.mime_type === "image/svg+xml") {
      headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; script-src 'none'";
    }
    return { stream: data, status: 200, bytes: data.length, contentType: file.mime_type,
             filename: file.original_filename, checksum: file.checksum_sha256, headers };
  }, { public: true, body: false });

  /* ---------------- book upload (new book + file in one call) ---------------- */
  router.post("/api/v1/admin/cms/books", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({
      slug: "string:2:30", title: "string:3:160", subject: "string:2:60",
      difficulty: "string:2:30", "description?": "string:0:800", objectives: "array:20",
      "stageId?": "uuid", "pages?": "int:1:2000", "fileId?": "uuid",
    }, ctx.body);
    const exists = await ctx.db.query(`SELECT 1 FROM books WHERE slug = $1`, [body.slug]);
    if (exists.rows[0]) throw conflict("A book with that slug already exists");
    const book = (await ctx.db.query(`
      INSERT INTO books (slug, title, subject, difficulty, description, objectives, stage_id, pages, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft') RETURNING id, slug, title`,
      [body.slug, body.title, body.subject, body.difficulty, body.description ?? null,
       JSON.stringify(body.objectives || []), body.stageId ?? null, body.pages ?? null])).rows[0];
    if (body.fileId) {
      // attach an already-uploaded private file as this book's edition file
      const f = await ctx.db.query(`SELECT id FROM files WHERE id = $1 AND visibility = 'private'`, [body.fileId]);
      if (!f.rows[0]) throw badRequest("fileId must reference an uploaded (private) book file");
      const edition = (await ctx.db.query(`INSERT INTO book_editions (book_id, version, format, notes) VALUES ($1,'1.0',$2,'uploaded edition') RETURNING id`,
        [book.id, await formatFor(body.fileId, ctx)])).rows[0];
      await ctx.db.query(`UPDATE files SET book_id = $1, edition_id = $2, kind = 'edition' WHERE id = $3`, [book.id, edition.id, body.fileId]);
    }
    return { status: 201, body: book };
  });

  // Attach a finished print edition (DOCX/PDF from the book pipeline) to an
  // existing book: create the edition row, attach the uploaded file to it.
  router.post("/api/v1/admin/cms/books/:id/editions", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const body = validate({ version: "string:1:20", format: "enum:docx,doc,pdf,web",
      "fileId?": "uuid", "notes?": "string:0:500" }, ctx.body);
    const book = await ctx.db.query(`SELECT id, slug FROM books WHERE id = $1`, [ctx.params.id]);
    if (!book.rows[0]) throw notFound("No such book");
    const edition = (await ctx.db.query(`
      INSERT INTO book_editions (book_id, version, format, notes) VALUES ($1,$2,$3::book_format,$4)
      RETURNING id, version, format, notes`,
      [ctx.params.id, body.version, body.format, body.notes ?? "print edition"])).rows[0];
    if (body.fileId) {
      const f = await ctx.db.query(`SELECT id, visibility, kind FROM files WHERE id = $1`, [body.fileId]);
      if (!f.rows[0]) throw badRequest("fileId must reference an uploaded file");
      if (f.rows[0].visibility !== "private") throw badRequest("edition files must be private");
      await ctx.db.query(`UPDATE files SET book_id = $1, edition_id = $2, kind = 'edition' WHERE id = $3`,
        [ctx.params.id, edition.id, body.fileId]);
    }
    // the audit enum has publish/unpublish/archive only: an edition that is
    // attached to a PUBLISHED book is part of publishing it
    const b = await ctx.db.query(`SELECT status FROM books WHERE id = $1`, [ctx.params.id]);
    if (b.rows[0]?.status === "published") {
      await ctx.db.query(`INSERT INTO publish_events (entity_type, entity_id, action, actor_id)
        VALUES ('book', $1, 'publish', $2)`, [ctx.params.id, ctx.user.id]);
    }
    return { status: 201, body: { ...edition, fileId: body.fileId || null } };
  });

  router.post("/api/v1/admin/cms/books/:id/publish", async (ctx) => {
    requirePermission(ctx, "cms:write");
    await snapshot(ctx, "book", ctx.params.id, "publish via CMS");
    const r = await ctx.db.query(`UPDATE books SET status = 'published', published_at = coalesce(published_at, now()) WHERE id = $1 RETURNING id, slug, status`,
      [ctx.params.id]);
    if (!r.rows[0]) throw notFound("No such book");
    await ctx.db.query(`INSERT INTO publish_events (entity_type, entity_id, action, actor_id) VALUES ('book', $1, 'publish', $2)`,
      [ctx.params.id, ctx.user.id]);
    return { body: r.rows[0] };
  });

  /* ---------------- revision history + restore ---------------- */
  router.get("/api/v1/admin/cms/revisions/:entityType/:entityId", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const r = await ctx.db.query(`
      SELECT version, snapshot, changed_by AS "changedBy", change_note AS "changeNote", at
      FROM content_revisions WHERE entity_type = $1 AND entity_id = $2 ORDER BY version DESC`,
      [ctx.params.entityType, ctx.params.entityId]);
    return { body: { revisions: r.rows } };
  });

  // Restore a previous revision of a lesson (the snapshot becomes live again,
  // the current state is snapshotted first — restore is itself reversible).
  router.post("/api/v1/admin/cms/lessons/:id/restore/:version", async (ctx) => {
    requirePermission(ctx, "cms:write");
    const version = parseInt(ctx.params.version, 10);
    if (!Number.isInteger(version) || version < 1) throw badRequest("version must be a positive integer");
    const snap = await ctx.db.query(
      `SELECT snapshot FROM content_revisions WHERE entity_type = 'lesson' AND entity_id = $1 AND version = $2`,
      [ctx.params.id, version]);
    if (!snap.rows[0]) throw notFound("No such revision");
    await snapshot(ctx, "lesson", ctx.params.id, "pre-restore snapshot");
    const s = snap.rows[0].snapshot;
    const r = await ctx.db.query(`
      UPDATE lessons SET title = $2, minutes = $3, objectives = $4, content = $5, version = version + 1
      WHERE id = $1 RETURNING id, code, version`,
      [ctx.params.id, s.title, s.minutes, JSON.stringify(s.objectives || []), JSON.stringify(s.content || [])]);
    return { body: { ok: true, restored: r.rows[0] } };
  });
}

/* ---------------- helpers ---------------- */
const BLOCK_KINDS = new Set(["p", "ul", "table", "code", "callout", "math", "steps", "nl",
  "plot", "ieq", "frac", "pct", "geom", "exercise", "diagram"]);
function validateBlocks(blocks) {
  if (!Array.isArray(blocks)) throw unprocessable("content must be an array of blocks", [{ field: "content" }]);
  for (const b of blocks) {
    if (typeof b !== "object" || b === null || !b.t || !BLOCK_KINDS.has(b.t)) {
      throw unprocessable("content blocks need a known t (p, ul, table, code, callout, math, steps, nl, plot, ieq, frac, pct, geom, exercise, diagram)", [{ field: "content" }]);
    }
  }
}

async function snapshot(ctx, entityType, entityId, note = "cms edit") {
  const tables = { subject: "subjects", course: "courses", chapter: "chapters", lesson: "lessons", book: "books", glossary_term: "glossary_terms" };
  const table = tables[entityType];
  if (!table) throw badRequest(`no revision snapshots for ${entityType}`);
  const cur = await ctx.db.query(`SELECT * FROM ${table} WHERE id = $1`, [entityId]);
  const row = cur.rows[0];
  if (!row) return null;
  const v = await ctx.db.query(
    `SELECT coalesce(max(version), 0)::int + 1 AS v FROM content_revisions WHERE entity_type = $1 AND entity_id = $2`,
    [entityType, entityId]);
  await ctx.db.query(`
    INSERT INTO content_revisions (entity_type, entity_id, version, snapshot, changed_by, change_note)
    VALUES ($1,$2,$3,$4,$5,$6)`,
    [entityType, entityId, v.rows[0].v, JSON.stringify(row), ctx.user.id, note]);
  return row;
}

async function setLessonStatus(ctx, status) {
  await snapshot(ctx, "lesson", ctx.params.id, `${status} via CMS`);
  const r = await ctx.db.query(`
    UPDATE lessons SET status = $2::content_status,
      published_at = CASE WHEN $2 = 'published' THEN coalesce(published_at, now()) ELSE published_at END
    WHERE id = $1 RETURNING id, code, status`, [ctx.params.id, status]);
  if (!r.rows[0]) throw notFound("No such lesson");
  await ctx.db.query(`INSERT INTO publish_events (entity_type, entity_id, action, actor_id) VALUES ('lesson', $1, $2, $3)`,
    [ctx.params.id, status === "published" ? "publish" : "unpublish", ctx.user.id]);
  return { body: r.rows[0] };
}

function sniffMime(bytes, filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  const byExt = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
    svg: "image/svg+xml", doc: "application/msword", pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  // magic-byte check where cheap (defence against mislabeled uploads)
  if (bytes.length > 8) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
    if (bytes.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
    if (bytes.subarray(0, 2).toString("latin1") === "PK" && ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (bytes.subarray(0, 4).toString("latin1") === "\xd0\xcf\x11\xe0" && ext === "doc") return "application/msword";
  }
  return byExt[ext] || "application/octet-stream";
}

async function formatFor(fileId, ctx) {
  const f = await ctx.db.query(`SELECT mime_type FROM files WHERE id = $1`, [fileId]);
  const mime = f.rows[0]?.mime_type;
  if (mime === "application/pdf") return "pdf" ;
  if (mime === "application/msword") return "doc";
  return "docx";
}
