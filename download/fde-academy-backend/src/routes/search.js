// src/routes/search.js — cross-entity search over published content. Uses
// ILIKE with pg_trgm indexes when available (see 0008) — the same queries
// benefit from the trigram GIN indexes on a standard PostgreSQL server.
import { Router } from "../http/router.js";

export function registerSearchRoutes(router) {

  router.get("/api/v1/search", async (ctx) => {
    const q = String(ctx.query.q || "").trim();
    if (q.length < 2) {
      return { body: { query: q, results: [], message: "Type at least 2 characters to search." } };
    }
    const like = `%${q.replace(/[%_]/g, m => "\\" + m)}%`;
    const limit = 20;
    const [lessons, courses, books, glossary, projects] = await Promise.all([
      ctx.db.query(`
        SELECT l.id, l.code, l.title, c.title AS "courseTitle" FROM lessons l
        JOIN courses c ON c.id = l.course_id
        WHERE l.status = 'published' AND (l.title ILIKE $1 OR l.content::text ILIKE $1)
        ORDER BY l.title LIMIT $2`, [like, limit]),
      ctx.db.query(`
        SELECT id, code, title, blurb FROM courses
        WHERE status = 'published' AND (title ILIKE $1 OR blurb ILIKE $1)
        ORDER BY title LIMIT $2`, [like, limit]),
      ctx.db.query(`
        SELECT id, slug, title, subject FROM books
        WHERE status = 'published' AND (title ILIKE $1 OR description ILIKE $1)
        ORDER BY title LIMIT $2`, [like, limit]),
      ctx.db.query(`
        SELECT id, key, term, simple_meaning AS "simple" FROM glossary_terms
        WHERE status = 'published' AND (term ILIKE $1 OR simple_meaning ILIKE $1 OR detailed_meaning ILIKE $1)
        ORDER BY term LIMIT $2`, [like, limit]),
      ctx.db.query(`
        SELECT id, code, title, level FROM projects
        WHERE status = 'published' AND (title ILIKE $1 OR brief ILIKE $1)
        ORDER BY level, title LIMIT $2`, [like, limit]),
    ]);
    const results = [
      ...lessons.rows.map(r => ({ kind: "lesson", id: r.id, code: r.code, title: r.title, context: r.courseTitle })),
      ...courses.rows.map(r => ({ kind: "course", id: r.id, code: r.code, title: r.title, context: r.blurb })),
      ...books.rows.map(r => ({ kind: "book", id: r.id, code: r.slug, title: r.title, context: r.subject })),
      ...glossary.rows.map(r => ({ kind: "glossary", id: r.id, code: r.key, title: r.term, context: r.simple })),
      ...projects.rows.map(r => ({ kind: "project", id: r.id, code: r.code, title: r.title, context: `Level ${r.level}` })),
    ];
    return { body: { query: q, count: results.length, results } };
  }, { public: true });
}

// src/routes/glossary.js content lives in the admin module for mutations; the
// read side is public and mirrors the frontend's dictionary.
export function registerGlossaryRoutes(router) {
  router.get("/api/v1/glossary", async (ctx) => {
    const like = ctx.query.search ? `%${String(ctx.query.search).replace(/[%_]/g, m => "\\" + m)}%` : null;
    const category = ctx.query.category || null;
    const r = await ctx.db.query(`
      SELECT id, key, term, simple_meaning AS "simple", detailed_meaning AS "detailed",
             example, related, category, is_admin_added AS "isAdminAdded", updated_at AS "updatedAt"
      FROM glossary_terms
      WHERE status = 'published'
        AND ($1::text IS NULL OR term ILIKE $1 OR simple_meaning ILIKE $1 OR detailed_meaning ILIKE $1)
        AND ($2::text IS NULL OR category = $2)
      ORDER BY term`, [like, category]);
    const cats = await ctx.db.query(
      `SELECT DISTINCT category FROM glossary_terms WHERE status = 'published' ORDER BY category`);
    return { body: { terms: r.rows, categories: cats.rows.map(x => x.category) } };
  }, { public: true });

  router.get("/api/v1/glossary/:key", async (ctx) => {
    const r = await ctx.db.query(
      `SELECT id, key, term, simple_meaning AS "simple", detailed_meaning AS "detailed",
              example, related, category, is_admin_added AS "isAdminAdded"
       FROM glossary_terms WHERE key = $1 AND status = 'published'`, [ctx.params.key]);
    if (!r.rows[0]) return { status: 404, body: { error: { code: "not_found", message: "No such glossary term" } } };
    return { body: { term: r.rows[0] } };
  }, { public: true });
}
