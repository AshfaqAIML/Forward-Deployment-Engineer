// src/http/router.js — framework-free HTTP layer: path routing with :params,
// body limits + JSON parsing, CORS, request ids, access logs, uniform JSON
// error responses. Route handlers are async (ctx) => body | {status, body|headers}.
import crypto from "node:crypto";
import { AppError, badRequest, notFound, payloadTooLarge, methodNotAllowed } from "../errors.js";
import { createLogger } from "../logger.js";

const MAX_BODY = 1024 * 1024; // 1 MB

export class Router {
  constructor({ config, logger } = {}) {
    this.routes = [];
    this.config = config;
    this.log = (logger || createLogger()).child({ component: "http" });
  }

  add(method, pattern, handler, opts = {}) {
    const segments = pattern.split("/").filter(Boolean);
    this.routes.push({ method, pattern, segments, handler, opts });
    return this;
  }
  get(p, h, o) { return this.add("GET", p, h, o); }
  post(p, h, o) { return this.add("POST", p, h, o); }
  put(p, h, o) { return this.add("PUT", p, h, o); }
  patch(p, h, o) { return this.add("PATCH", p, h, o); }
  delete(p, h, o) { return this.add("DELETE", p, h, o); }

  match(method, pathname) {
    const parts = pathname.split("/").filter(Boolean);
    let pathMatched = false;
    for (const r of this.routes) {
      if (r.segments.length !== parts.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        const seg = r.segments[i];
        if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(parts[i]);
        else if (seg !== parts[i]) { ok = false; break; }
      }
      if (!ok) continue;
      pathMatched = true;
      if (r.method === method || (method === "HEAD" && r.method === "GET")) return { route: r, params };
    }
    if (pathMatched) throw methodNotAllowed(`method ${method} is not allowed on ${pathname}`);
    throw notFound(`no route for ${method} ${pathname}`);
  }

  // Node.js request handler. authenticate(db) -> user|null is called lazily
  // only when a route opts in via {auth: true} — public routes stay public.
  handle(db, authenticate) {
    return async (req, res) => {
      const started = Date.now();
      const requestId = crypto.randomUUID();
      const log = this.log.child({ requestId, method: req.method });
      const url = new URL(req.url, "http://internal");
      const ctx = {
        req, res, db, requestId, log,
        method: req.method, path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        params: {}, body: null, user: null,
      };
      res.setHeader("X-Request-Id", requestId);
      if (this.config?.corsOrigin) {
        res.setHeader("Access-Control-Allow-Origin", this.config.corsOrigin);
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.setHeader("Vary", "Origin");
      }
      if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }

      let status = 500;
      try {
        const { route, params } = this.match(req.method, url.pathname);
        ctx.params = params;
        // Authenticates whenever a route allows it (default). authenticate()
        // returns null for anonymous callers; a present-but-invalid token
        // throws 401 — even on public routes (fail closed on bad credentials).
        // opts.auth === false skips auth entirely (health check).
        if (route.opts.auth !== false) {
          ctx.user = await authenticate(req);
        }
        if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && route.opts.body !== false) {
          ctx.body = await readJsonBody(req);
        }
        const out = await route.handler(ctx);
        if (typeof out === "string") { status = 200; res.writeHead(200, { "Content-Type": out.startsWith("<!") ? "text/html" : "text/plain; charset=utf-8" }); res.end(out); }
        else if (out && out.stream) { status = out.status || 200; streamResponse(res, out); }
        else { status = out?.status ?? 200; res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...(out?.headers || {}) }); res.end(JSON.stringify(out?.body ?? out ?? { ok: true })); }
      } catch (err) {
        const appErr = err instanceof AppError ? err : new AppError(500, "internal_error", "Something went wrong on our side");
        status = appErr.status;
        if (status >= 500) log.error("request failed", { error: err.message, stack: err.stack?.split("\n").slice(0, 4) });
        res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: { code: appErr.code, message: appErr.message, details: appErr.details } }));
      } finally {
        log.info("request", { status, ms: Date.now() - started, path: ctx.path, userId: ctx.user?.id || null });
        if (ctx.user?.id) {
          // request-scoped activity logging is done by routes for domain events;
          // here we only keep the access trail.
        }
      }
    };
  }
}

function streamResponse(res, out) {
  res.writeHead(out.status || 200, {
    "Content-Type": out.contentType || "application/octet-stream",
    "Content-Length": out.bytes,
    "Content-Disposition": `attachment; filename="${out.filename.replace(/[^\w.\-]/g, "_")}"`,
    "X-Checksum-Sha256": out.checksum,
    "Cache-Control": "private, no-store",
    ...(out.headers || {}),
  });
  res.end(out.stream);
}

async function readJsonBody(req) {
  const type = req.headers["content-type"] || "";
  const length = parseInt(req.headers["content-length"] || "0", 10);
  if (length > MAX_BODY) throw payloadTooLarge();
  const chunks = [];
  let received = 0;
  for await (const chunk of req) {
    received += chunk.length;
    if (received > MAX_BODY) throw payloadTooLarge();
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  if (!type.includes("application/json")) throw badRequest("Content-Type must be application/json");
  try { return JSON.parse(raw); }
  catch { throw badRequest("Request body is not valid JSON"); }
}
