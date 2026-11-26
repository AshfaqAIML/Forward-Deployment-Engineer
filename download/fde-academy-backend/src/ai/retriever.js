// src/ai/retriever.js — retrieval over the approved curriculum (the tutor's
// ONLY knowledge source for course content). Ranks lessons, glossary terms,
// book chapters and exercises by query relevance; a pinned lesson is always
// included first so "explain this lesson" never depends on fuzzy matching.
const STOP = new Set(["the", "a", "an", "of", "in", "to", "is", "and", "or", "for", "on",
  "what", "how", "why", "when", "does", "do", "me", "my", "i", "you", "it", "this",
  "that", "with", "as", "at", "by", "be", "are", "was", "can", "explain", "help"]);

function tokens(text) {
  return String(text || "").toLowerCase().split(/[^a-z0-9£%.-]+/).filter(t => t.length > 1 && !STOP.has(t));
}
function score(queryToks, texts) {
  let s = 0;
  for (const t of queryToks) {
    for (const text of texts) if (text && text.toLowerCase().includes(t)) { s += 1; break; }
  }
  return s;
}
function blockText(blocks) {
  // flatten the block schema to searchable text (no interactive evaluation)
  const out = [];
  for (const b of blocks || []) {
    if (!b || typeof b !== "object") continue;
    if (b.t === "p" && b.x) out.push(b.x);
    if (b.t === "ul" && Array.isArray(b.items)) out.push(b.items.join(" "));
    if (b.t === "table" && Array.isArray(b.rows)) out.push(b.rows.flat().join(" "));
    if (b.t === "code" && b.code) out.push(String(b.code).slice(0, 800));
    if (b.t === "exercise" && b.prompt) out.push(b.prompt);
    if (b.t === "steps" && Array.isArray(b.steps)) out.push(b.steps.map(x => `${x.expr || ""} ${x.note || ""}`).join(" "));
    if (b.t === "callout" && b.x) out.push(b.x);
    if (b.t === "math" && b.x) out.push(String(b.x));
  }
  return out.join(" \n").slice(0, 6000);
}

export async function retrieve(db, query, { lessonCode, limit = 4 } = {}) {
  const sources = [];
  const q = tokens(query);

  const lessons = await db.query(`
    SELECT l.id, l.code, l.title, l.objectives, l.content, c.title AS course_title
    FROM lessons l JOIN courses c ON c.id = l.course_id
    WHERE l.status = 'published'`);
  for (const l of lessons.rows) {
    const text = `${l.title} ${l.course_title} ${JSON.stringify(l.objectives)} ${blockText(l.content)}`;
    const s = score(q, [l.title, l.course_title, JSON.stringify(l.objectives), text]) + (blockText(l.content) ? 0 : 0);
    sources.push({ kind: "lesson", code: l.code, id: l.id, title: l.title, text, relevance: s,
      pinned: lessonCode && l.code === lessonCode });
  }
  const glossary = await db.query(`
    SELECT key, term, simple_meaning, detailed_meaning, example, category
    FROM glossary_terms WHERE status = 'published'`);
  for (const g of glossary.rows) {
    let s = score(q, [g.term, g.simple_meaning, g.detailed_meaning, g.example]);
    // exact term match dominates vocabulary questions
    const norm = query.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
    if (norm.includes(g.term.toLowerCase())) s += 8;
    sources.push({ kind: "glossary", code: g.key, id: g.key, title: g.term,
      text: `${g.term}: ${g.simple_meaning} ${g.detailed_meaning} Example: ${g.example}`, relevance: s });
  }
  const chapters = await db.query(`
    SELECT bc.id, b.slug, bc.title, bc.content FROM book_chapters bc
    JOIN books b ON b.id = bc.book_id WHERE b.status = 'published'`);
  for (const c of chapters.rows) {
    const text = `${c.title} ${blockText(c.content)}`.slice(0, 4000);
    const s = score(q, [c.title, text]);
    sources.push({ kind: "book", code: `${c.slug}#ch${c.id.slice(0, 4)}`, id: c.id, title: `${c.slug} — ${c.title}`, text, relevance: s });
  }
  const exercises = await db.query(`
    SELECT code, title, instructions, starter_code FROM coding_exercises WHERE status = 'published'`);
  for (const e of exercises.rows) {
    const s = score(q, [e.title, e.instructions, e.starter_code]);
    sources.push({ kind: "exercise", code: e.code, id: e.code, title: e.title,
      text: `${e.title}: ${e.instructions} Starter: ${String(e.starter_code).slice(0, 500)}`, relevance: s });
  }

  // pinned lesson first, then relevance; only include sources with signal
  const pinned = sources.filter(s => s.pinned);
  const ranked = sources.filter(s => !s.pinned && s.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  const selected = [...pinned, ...ranked].slice(0, Math.max(limit, pinned.length));
  // vocabulary questions must surface their glossary term even under the cap
  const exact = sources.filter(s => s.kind === "glossary" && s.relevance >= 8);
  for (const g of exact) if (!selected.includes(g)) selected.push(g);
  return {
    sources: selected.map(({ kind, code, title }) => ({ kind, code, title })),
    // material block for the prompt (kept compact)
    material: selected.map(s => `--- [${s.kind}:${s.code}] ${s.title} ---\n${s.text.slice(0, s.pinned ? 6000 : 2500)}`).join("\n\n"),
    grounded: selected.some(s => s.pinned || s.relevance >= 2),
  };
}
