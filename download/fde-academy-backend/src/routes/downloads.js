// src/routes/downloads.js — secure file downloads for the book library.
//
// Flow: POST /api/v1/books/:id/downloads {editionId?} -> {token, downloadUrl}
// (a raw opaque token; only its sha256 hash is stored, TTL 10 minutes,
// single use). GET /api/v1/downloads/:token streams the file bytes.
//
// Invariants:
//   * storage_key (the private storage location) never appears in any response;
//   * tokens cannot be replayed and expire server-side;
//   * every served download is recorded in download_records + activity_events;
//   * files are read only from within the configured private storage dir
//     (path traversal is rejected in storagePath()).
import { Router } from "../http/router.js";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { notFound, forbidden, unauthorized } from "../errors.js";
import { storagePath } from "../db/index.js";
import { generateOpaqueToken, hashOpaqueToken } from "../auth/tokens.js";
import { config } from "../config.js";
import { logEvent } from "../activity.js";
import { requirePermission } from "../rbac.js";
import { validate } from "../validate.js";

export function registerDownloadRoutes(router) {

  // Issue a download token for the newest (or requested) edition of a book.
  router.post("/api/v1/books/:idOrSlug/downloads", async (ctx) => {
    requirePermission(ctx, "download:book");
    const body = validate({ "editionId?": "uuid", "format?": "enum:docx,doc,pdf,web" }, ctx.body || {});
    const b = await ctx.db.query(`
      SELECT b.id FROM books b WHERE (b.id::text = $1 OR b.slug = $1) AND b.status = 'published'`,
      [String(ctx.params.idOrSlug)]);
    const book = b.rows[0];
    if (!book) throw notFound("No such book");
    // Selection order: explicit editionId → requested format (newest of that
    // format) → newest edition of any format. The format flag is what the
    // website's DOCX and PDF buttons send.
    const f = body.editionId
      ? await ctx.db.query(`SELECT f.* FROM files f WHERE f.edition_id = $1 AND f.kind = 'edition'`, [body.editionId])
      : body.format
      ? await ctx.db.query(`
          SELECT f.* FROM files f
          JOIN book_editions e ON e.id = f.edition_id
          WHERE f.book_id = $1 AND f.kind = 'edition' AND e.format = $2
          ORDER BY e.published_at DESC LIMIT 1`, [book.id, body.format])
      : await ctx.db.query(`
          SELECT f.* FROM files f
          JOIN book_editions e ON e.id = f.edition_id
          WHERE f.book_id = $1 AND f.kind = 'edition'
          ORDER BY e.published_at DESC LIMIT 1`, [book.id]);
    const file = f.rows[0];
    if (!file) throw notFound("No downloadable edition is available for this book yet");

    const token = generateOpaqueToken();
    await ctx.db.query(`
      INSERT INTO download_tokens (file_id, token_hash, requested_by, expires_at)
      VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval)`,
      [file.id, hashOpaqueToken(token), ctx.user.id, config.downloadTokenTtlMinutes]);
    return { status: 201, body: {
      token,
      downloadUrl: `/api/v1/downloads/${token}`,
      filename: file.original_filename,
      bytes: file.bytes,
      checksum: file.checksum_sha256,
      expiresInSeconds: config.downloadTokenTtlMinutes * 60,
    } };
  });

  // Stream the file. The URL contains only the opaque token — never the path.
  router.get("/api/v1/downloads/:token", async (ctx) => {
    const token = String(ctx.params.token || "");
    if (!/^[A-Za-z0-9_-]{20,120}$/.test(token)) throw unauthorized("Invalid download token");
    const r = await ctx.db.query(`
      SELECT t.id AS token_id, t.expires_at, t.used_at, f.*
      FROM download_tokens t JOIN files f ON f.id = t.file_id
      WHERE t.token_hash = $1 AND t.requested_by = $2`, [hashOpaqueToken(token), ctx.user.id]);
    const row = r.rows[0];
    if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
      throw forbidden("This download link has expired or was already used — request a fresh one");
    }
    // Consume the token, stream the file, record the download — atomically
    // enough for single-use semantics (UPDATE ... WHERE used_at IS NULL).
    const consumed = await ctx.db.query(
      `UPDATE download_tokens SET used_at = now() WHERE id = $1 AND used_at IS NULL RETURNING id`, [row.token_id]);
    if (!consumed.rows[0]) throw forbidden("This download link was already used");
    let bytes;
    try { bytes = await fs.readFile(storagePath(config, row.storage_key)); }
    catch { throw notFound("The file could not be read from storage — contact an administrator"); }
    await ctx.db.query(`INSERT INTO download_records (file_id, user_id) VALUES ($1, $2)`, [row.id, ctx.user.id]);
    await logEvent(ctx.db, ctx.user.id, "download", "file", row.id, { filename: row.original_filename });
    return { stream: bytes, status: 200, bytes: bytes.length, contentType: row.mime_type,
             filename: row.original_filename, checksum: row.checksum_sha256 };
  });
}
