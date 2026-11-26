// src/routes/static.js — serves the bundled single-page frontend from the
// backend origin. One process = the whole production website: the app shell
// and the API share an origin, so the browser needs no CORS exceptions and
// the download token flow stays first-party.
import fs from "node:fs";

export function registerStaticRoutes(router, cfg) {
  const file = cfg.staticFile;

  const readIndex = () => {
    try {
      return fs.readFileSync(file, "utf8");
    } catch (err) {
      return null;
    }
  };

  // Startup check: log once whether the frontend is bundled (deployments
  // that serve the SPA from a CDN can point FDE_STATIC_FILE at it or drop it).
  let bundled = false;
  try {
    bundled = fs.existsSync(file);
  } catch {}

  router.get("/", async (ctx) => {
    // The SPA shell must always revalidate so deploys are picked up
    // immediately (the page itself never changes between deploys).
    ctx.res.setHeader("Cache-Control", "no-cache");
    if (!bundled) {
      return {
        status: 200,
        body: { ok: true, service: "fde-academy-backend", frontend: "not bundled — set FDE_STATIC_FILE", docs: "GET /api/v1/health" },
      };
    }
    const html = readIndex();
    if (html === null) {
      return { status: 503, body: { error: { code: "frontend_unavailable", message: "frontend file missing" } } };
    }
    return html;
  }, { public: true, body: false });

  router.get("/index.html", async (ctx) => {
    ctx.res.setHeader("Cache-Control", "no-cache");
    return readIndex() ?? "";
  }, { public: true, body: false });

  return router;
}
