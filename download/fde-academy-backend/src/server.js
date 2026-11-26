// src/server.js — application assembly. Exports buildApp() for the test suite
// (ephemeral port, injected config/db) and starts the listener when run
// directly (`npm start`).
import http from "node:http";
import { config, validateConfigForProduction } from "./config.js";
import { createLogger } from "./logger.js";
import { getDb } from "./db/index.js";
import { Router } from "./http/router.js";
import { authenticate } from "./auth/session.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerCatalogRoutes } from "./routes/catalog.js";
import { registerAssessmentRoutes } from "./routes/assessments.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerBookRoutes } from "./routes/books.js";
import { registerDownloadRoutes } from "./routes/downloads.js";
import { registerExerciseRoutes } from "./routes/exercises.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerSearchRoutes, registerGlossaryRoutes } from "./routes/search.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerLearningRoutes } from "./routes/learning.js";
import { registerAiTutorRoutes } from "./routes/ai.js";
import { registerCmsRoutes } from "./routes/cms.js";
import { registerStaticRoutes } from "./routes/static.js";

export function buildRouter(cfg, logger) {
  const router = new Router({ config: cfg, logger });
  registerAuthRoutes(router);
  registerCatalogRoutes(router);
  registerAssessmentRoutes(router);
  registerMeRoutes(router);
  registerBookRoutes(router);
  registerDownloadRoutes(router);
  registerExerciseRoutes(router);
  registerProjectRoutes(router);
  registerSearchRoutes(router);
  registerGlossaryRoutes(router);
  registerAdminRoutes(router);
  registerLearningRoutes(router);
  registerAiTutorRoutes(router);
  registerCmsRoutes(router);
  registerStaticRoutes(router, cfg);
  // Health/readiness for load balancers and the frontend's connectivity check.
  router.get("/api/v1/health", async () => ({
    body: { ok: true, service: "fde-academy-backend", version: "2.0.0", time: new Date().toISOString() },
  }), { public: true, body: false });
  return router;
}

export async function buildApp(cfg = config, logger = createLogger({ level: cfg.logLevel })) {
  const problems = cfg.isProd ? validateConfigForProduction() : [];
  if (problems.length) throw new Error("Invalid production configuration:\n - " + problems.join("\n - "));
  const db = await getDb(cfg);
  const router = buildRouter(cfg, logger);
  const auth = authenticate(db);
  const handler = router.handle(db, auth);
  const server = http.createServer(handler);
  server.on("clientError", (err, socket) => { try { socket.destroy(); } catch {} });
  return { server, db, router, config: cfg, logger };
}

// Direct-run entry point.
if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  const logger = createLogger({ level: config.logLevel, base: { component: "server" } });
  const { server, db } = await buildApp(config, logger);
  server.listen(config.port, config.host, () => {
    logger.info("listening", { host: config.host, port: config.port, driver: resolveDriverLabel() });
  });
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, async () => {
      logger.info("shutting down", { signal: sig });
      server.close();
      await db.close().catch(() => {});
      process.exit(0);
    });
  }
}
function resolveDriverLabel() { return config.databaseUrl ? "pg" : "pglite"; }
