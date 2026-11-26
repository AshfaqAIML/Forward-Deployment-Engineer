// src/routes/books.js — book library, chapter reader, reading progress.
// Downloads go through downloads.js (signed single-use tokens); storage paths
// never appear in any response here.
import { Router } from "../http/router.js";
import { notFound } from "../errors.js";
import { logEvent } from "../activity.js";

export function registerBookRoutes(router) {

  router.get("/api/v1/books", async (ctx) => {
    const r = await ctx.db.query(`
      SELECT b.id, b.slug, b.title, b.subject, b.difficulty, b.description, b.pages, b.status,
             s.stage_number AS "stageNumber",
             (SELECT count(*)::int FROM book_chapters WHERE book_id = b.id) AS chapters
      FROM books b LEFT JOIN learning_stages s ON s.id = b.stage_id
      ${visibilityClause(ctx)} ORDER BY b.title`, []);
    let progress = {};
    if (ctx.user) {
      const p = await ctx.db.query(
        `SELECT book_id AS bid, chapters_read AS "chaptersRead", chapters_total AS "chaptersTotal", pct
         FROM v_book_progress WHERE user_id = $1`, [ctx.user.id]);
      progress = Object.fromEntries(p.rows.map(x => [x.bid, x]));
    }
    return { body: { books: r.rows.map(b => ({ ...b, progress: progress[b.id] || { chaptersRead: 0, chaptersTotal: b.chapters, pct: 0 } })) } };
  }, { public: true });

  router.get("/api/v1/books/:idOrSlug", async (ctx) => {
    const b = await loadBook(ctx.db, ctx.params.idOrSlug);
    if (b.status !== "published" && !(ctx.user && ["author", "admin"].includes(ctx.user.role))) throw notFound("No such book");
    const chapters = await ctx.db.query(`
      SELECT id, position, title, full_web AS "fullWeb"
      FROM book_chapters WHERE book_id = $1 ORDER BY position`, [b.id]);
    const editions = await ctx.db.query(`
      SELECT id, version, format, published_at AS "publishedAt", notes
      FROM book_editions WHERE book_id = $1 ORDER BY published_at DESC`, [b.id]);
    let chaptersRead = [];
    if (ctx.user) {
      const p = await ctx.db.query(
        `SELECT chapter_id FROM book_reading_progress WHERE user_id = $1 AND read`, [ctx.user.id]);
      chaptersRead = p.rows.map(x => x.chapter_id);
    }
    return { body: {
      book: { id: b.id, slug: b.slug, title: b.title, subject: b.subject, difficulty: b.difficulty,
              description: b.description, objectives: b.objectives, pages: b.pages,
              stageNumber: b.stage_number, status: b.status },
      chapters: chapters.rows.map(c => ({ ...c, read: chaptersRead.includes(c.id) })),
      editions: editions.rows,
    } };
  }, { public: true });

  router.get("/api/v1/books/:idOrSlug/chapters/:position", async (ctx) => {
    const b = await loadBook(ctx.db, ctx.params.idOrSlug);
    if (b.status !== "published" && !(ctx.user && ["author", "admin"].includes(ctx.user.role))) throw notFound("No such book");
    const pos = parseInt(ctx.params.position, 10);
    if (!Number.isInteger(pos) || pos < 1) throw notFound("Chapter positions start at 1");
    const r = await ctx.db.query(
      `SELECT id, position, title, content, full_web AS "fullWeb" FROM book_chapters
       WHERE book_id = $1 AND position = $2`, [b.id, pos]);
    const chapter = r.rows[0];
    if (!chapter) throw notFound("No such chapter");
    if (ctx.user) {
      await ctx.db.query(`
        INSERT INTO book_reading_progress (user_id, chapter_id, read, last_read_at)
        VALUES ($1, $2, true, now())
        ON CONFLICT (user_id, chapter_id) DO UPDATE SET read = true, last_read_at = now()`,
        [ctx.user.id, chapter.id]);
      await logEvent(ctx.db, ctx.user.id, "chapter_view", "book_chapter", chapter.id, { position: pos });
    }
    const read = await ctx.db.query(
      `SELECT read FROM book_reading_progress WHERE user_id IS NOT DISTINCT FROM $1 AND chapter_id = $2`,
      [ctx.user?.id || null, chapter.id]);
    return { body: { chapter: { ...chapter, read: !!read.rows[0]?.read } } };
  }, { public: true });

  // POST /api/v1/books/:idOrSlug/chapters/:position/read — explicit read marking.
  router.post("/api/v1/books/:idOrSlug/chapters/:position/read", async (ctx) => {
    const b = await loadBook(ctx.db, ctx.params.idOrSlug);
    const pos = parseInt(ctx.params.position, 10);
    const r = await ctx.db.query(
      `SELECT id FROM book_chapters WHERE book_id = $1 AND position = $2`, [b.id, pos]);
    const chapter = r.rows[0];
    if (!chapter) throw notFound("No such chapter");
    const readFlag = ctx.body?.read === false ? false : true;
    await ctx.db.query(`
      INSERT INTO book_reading_progress (user_id, chapter_id, read, last_read_at) VALUES ($1, $2, $3, now())
      ON CONFLICT (user_id, chapter_id) DO UPDATE SET read = $3, last_read_at = now()`,
      [ctx.user.id, chapter.id, readFlag]);
    await logEvent(ctx.db, ctx.user.id, readFlag ? "chapter_read" : "chapter_unread", "book_chapter", chapter.id);
    return { body: { ok: true, read: readFlag } };
  });
}

function visibilityClause(ctx) {
  const includeDrafts = ctx.query.includeDrafts === "1" && ctx.user && ["author", "admin"].includes(ctx.user.role);
  return includeDrafts ? "WHERE true" : "WHERE b.status = 'published'";
}

async function loadBook(db, idOrSlug) {
  const r = await db.query(`
    SELECT b.*, s.stage_number FROM books b
    LEFT JOIN learning_stages s ON s.id = b.stage_id
    WHERE b.id::text = $1 OR b.slug = $1`, [String(idOrSlug)]);
  const b = r.rows[0];
  if (!b) throw notFound("No such book");
  return b;
}
